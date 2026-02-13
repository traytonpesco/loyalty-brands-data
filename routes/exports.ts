import express from 'express';
import { Op } from 'sequelize';
import models from '../models';
import { requirePermission } from '../middleware/rbac';
import { exportData, getContentType, getFileExtension, ExportFormat } from '../services/exportService';
import { parseDateRange, buildDateWhereClause } from '../utils/dateFilter';

const router = express.Router();

/**
 * Helper to get user's tenant IDs
 */
async function getUserTenantIds(user: any): Promise<string[]> {
  if (!user) return [];
  
  const roles = await user.getRoles();
  const isSuperAdmin = roles.some((r: any) => r.name === 'super_admin');
  
  if (isSuperAdmin) {
    const allTenants = await (models as any).Tenant.findAll({ attributes: ['id'] });
    return allTenants.map((t: any) => t.id);
  }
  
  const tenants = await user.getTenants();
  return tenants.map((t: any) => t.id);
}

/**
 * Define column structure for campaigns (engagement-focused)
 */
const campaignColumns = [
  { key: 'name', label: 'Campaign Name' },
  { key: 'startDate', label: 'Start Date' },
  { key: 'endDate', label: 'End Date' },
  { key: 'verifiedEngagement', label: 'Verified Engagement' },
  { key: 'totalImpressions', label: 'Total Impressions' },
  { key: 'engagementRate', label: 'Engagement Rate %' },
  { key: 'completionRate', label: 'Completion Rate %' },
  { key: 'qualifiedContacts', label: 'Qualified Contacts' },
  { key: 'contactRate', label: 'Contact Rate %' },
  { key: 'avgDurationSeconds', label: 'Avg Duration (s)' },
  { key: 'deepEngagementPct', label: 'Deep Engagement % (60s+)' },
];

/**
 * Export single campaign
 * POST /api/exports/campaign/:id
 * Body: { format: 'csv' | 'excel' | 'json' | 'xml' }
 */
router.post('/campaign/:id', requirePermission(['campaigns.read']), async (req, res) => {
  try {
    const { id } = req.params;
    const { format } = req.body as { format: ExportFormat };
    const user: any = (req as any).user;
    const tenantIds = await getUserTenantIds(user);
    
    if (!format || !['csv', 'excel', 'json', 'xml'].includes(format)) {
      return res.status(400).json({ error: 'Invalid format. Must be csv, excel, json, or xml' });
    }

    const campaign = await (models as any).Campaign.findByPk(id);
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    // Verify user has access to this campaign's tenant
    if (!tenantIds.includes(campaign.tenantId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { CampaignSession, CampaignImpression, CampaignContact } = models as any;
    const seq = (models as any).sequelize;
    const cid = campaign.id;

    const [impressionsRow, sessionCount, completionCount, contactsCount, avgDurationRow, deepCount] = await Promise.all([
      CampaignImpression.findOne({
        where: { campaignId: cid },
        attributes: [[seq.fn('SUM', seq.col('impressionCount')), 'total']],
        raw: true,
      }),
      CampaignSession.count({ where: { campaignId: cid } }),
      CampaignSession.count({ where: { campaignId: cid, journeyCompleted: true } }),
      CampaignContact.count({ where: { campaignId: cid, consentGiven: true } }),
      CampaignSession.findOne({
        where: { campaignId: cid },
        attributes: [[seq.fn('AVG', seq.col('durationSeconds')), 'avg']],
        raw: true,
      }),
      CampaignSession.count({ where: { campaignId: cid, durationSeconds: { [Op.gte]: 60 } } }),
    ]);

    const totalImpressions = Number(impressionsRow?.total ?? 0);
    const verifiedEngagement = sessionCount;
    const completionRate = verifiedEngagement > 0 ? (completionCount / verifiedEngagement) * 100 : 0;
    const contactRate = verifiedEngagement > 0 ? (contactsCount / verifiedEngagement) * 100 : 0;
    const engagementRate = totalImpressions > 0 ? (verifiedEngagement / totalImpressions) * 100 : 0;
    const avgDurationSeconds = Number(avgDurationRow?.avg ?? 0);
    const deepEngagementPct = verifiedEngagement > 0 ? (deepCount / verifiedEngagement) * 100 : 0;

    const campaignData = [{
      name: campaign.name,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      verifiedEngagement,
      totalImpressions,
      engagementRate: Math.round(engagementRate * 10) / 10,
      completionRate: Math.round(completionRate * 10) / 10,
      qualifiedContacts: contactsCount,
      contactRate: Math.round(contactRate * 10) / 10,
      avgDurationSeconds: Math.round(avgDurationSeconds),
      deepEngagementPct: Math.round(deepEngagementPct * 10) / 10,
    }];

    // Generate export
    const buffer = await exportData(campaignData, format, campaignColumns, {
      sheetName: campaign.name,
      rootElement: 'campaign'
    });
    
    // Set response headers
    const filename = `${campaign.name.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.${getFileExtension(format)}`;
    res.setHeader('Content-Type', getContentType(format));
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error: any) {
    console.error('Export error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Export multiple campaigns
 * POST /api/exports/campaigns
 * Body: { format: 'csv' | 'excel' | 'json' | 'xml', campaignIds?: string[], tenantId?: string }
 */
router.post('/campaigns', requirePermission(['campaigns.read']), async (req, res) => {
  try {
    const { format, campaignIds, tenantId } = req.body;
    const user: any = (req as any).user;
    const tenantIds = await getUserTenantIds(user);
    
    if (!format || !['csv', 'excel', 'json', 'xml'].includes(format)) {
      return res.status(400).json({ error: 'Invalid format. Must be csv, excel, json, or xml' });
    }

    let where: any = { tenantId: tenantIds };
    
    // Filter by specific tenant if provided
    if (tenantId) {
      if (!tenantIds.includes(tenantId)) {
        return res.status(403).json({ error: 'Access denied to this tenant' });
      }
      where.tenantId = tenantId;
    }
    
    // Filter by specific campaigns if provided
    if (campaignIds && Array.isArray(campaignIds) && campaignIds.length > 0) {
      where.id = campaignIds;
    }

    const campaigns = await (models as any).Campaign.findAll({ where });
    
    if (campaigns.length === 0) {
      return res.status(404).json({ error: 'No campaigns found' });
    }

    const { CampaignSession, CampaignImpression, CampaignContact } = models as any;
    const seq = (models as any).sequelize;
    const campaignIds = campaigns.map((c: any) => c.id);

    const buildRow = async (c: any) => {
      const cid = c.id;
      const [impressionsRow, sessionCount, completionCount, contactsCount, avgDurationRow, deepCount] = await Promise.all([
        CampaignImpression.findOne({ where: { campaignId: cid }, attributes: [[seq.fn('SUM', seq.col('impressionCount')), 'total']], raw: true }),
        CampaignSession.count({ where: { campaignId: cid } }),
        CampaignSession.count({ where: { campaignId: cid, journeyCompleted: true } }),
        CampaignContact.count({ where: { campaignId: cid, consentGiven: true } }),
        CampaignSession.findOne({ where: { campaignId: cid }, attributes: [[seq.fn('AVG', seq.col('durationSeconds')), 'avg']], raw: true }),
        CampaignSession.count({ where: { campaignId: cid, durationSeconds: { [Op.gte]: 60 } } }),
      ]);
      const totalImpressions = Number(impressionsRow?.total ?? 0);
      const verifiedEngagement = sessionCount;
      const completionRate = verifiedEngagement > 0 ? (completionCount / verifiedEngagement) * 100 : 0;
      const contactRate = verifiedEngagement > 0 ? (contactsCount / verifiedEngagement) * 100 : 0;
      const engagementRate = totalImpressions > 0 ? (verifiedEngagement / totalImpressions) * 100 : 0;
      const avgDurationSeconds = Number(avgDurationRow?.avg ?? 0);
      const deepEngagementPct = verifiedEngagement > 0 ? (deepCount / verifiedEngagement) * 100 : 0;
      return {
        name: c.name,
        startDate: c.startDate,
        endDate: c.endDate,
        verifiedEngagement,
        totalImpressions,
        engagementRate: Math.round(engagementRate * 10) / 10,
        completionRate: Math.round(completionRate * 10) / 10,
        qualifiedContacts: contactsCount,
        contactRate: Math.round(contactRate * 10) / 10,
        avgDurationSeconds: Math.round(avgDurationSeconds),
        deepEngagementPct: Math.round(deepEngagementPct * 10) / 10,
      };
    };

    const data = await Promise.all(campaigns.map(buildRow));
    
    // Generate export
    const buffer = await exportData(data, format, campaignColumns, {
      sheetName: 'Campaigns',
      rootElement: 'campaigns'
    });
    
    // Set response headers
    const filename = `campaigns_${Date.now()}.${getFileExtension(format)}`;
    res.setHeader('Content-Type', getContentType(format));
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error: any) {
    console.error('Export error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Export aggregated data for tenant
 * POST /api/exports/aggregate/:tenantId
 * Body: { format: 'csv' | 'excel' | 'json' | 'xml', startDate?: string, endDate?: string }
 */
router.post('/aggregate/:tenantId', requirePermission(['campaigns.read']), async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { format, startDate, endDate } = req.body;
    const user: any = (req as any).user;
    const tenantIds = await getUserTenantIds(user);
    
    if (!format || !['csv', 'excel', 'json', 'xml'].includes(format)) {
      return res.status(400).json({ error: 'Invalid format. Must be csv, excel, json, or xml' });
    }
    
    // Verify user has access to this tenant
    if (!tenantIds.includes(tenantId)) {
      return res.status(403).json({ error: 'Access denied to this tenant' });
    }

    const tenant = await (models as any).Tenant.findByPk(tenantId);
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const where: any = { tenantId };
    if (startDate && endDate) {
      try {
        const dateRange = parseDateRange(startDate, endDate);
        if (dateRange) Object.assign(where, buildDateWhereClause('startDate', dateRange));
      } catch (_) { /* ignore */ }
    }
    const campaigns = await (models as any).Campaign.findAll({ where });
    const campaignIds = campaigns.map((c: any) => c.id);

    const { CampaignSession, CampaignImpression, CampaignContact } = models as any;
    const seq = (models as any).sequelize;
    const [impressionsRow, sessionCount, completionCount, contactsCount, avgDurationRow, deepCount] = campaignIds.length
      ? await Promise.all([
          CampaignImpression.findOne({ where: { campaignId: { [Op.in]: campaignIds } }, attributes: [[seq.fn('SUM', seq.col('impressionCount')), 'total']], raw: true }),
          CampaignSession.count({ where: { campaignId: { [Op.in]: campaignIds } } }),
          CampaignSession.count({ where: { campaignId: { [Op.in]: campaignIds }, journeyCompleted: true } }),
          CampaignContact.count({ where: { campaignId: { [Op.in]: campaignIds }, consentGiven: true } }),
          CampaignSession.findOne({ where: { campaignId: { [Op.in]: campaignIds } }, attributes: [[seq.fn('AVG', seq.col('durationSeconds')), 'avg']], raw: true }),
          CampaignSession.count({ where: { campaignId: { [Op.in]: campaignIds }, durationSeconds: { [Op.gte]: 60 } } }),
        ])
      : [null, 0, 0, 0, null, 0];

    const totalImpressions = Number(impressionsRow?.total ?? 0);
    const verifiedEngagement = sessionCount;
    const journeyCompleted = completionCount;
    const qualifiedContacts = contactsCount;
    const avgDurationSeconds = Number(avgDurationRow?.avg ?? 0);
    const deepEngagementPct = verifiedEngagement > 0 ? (deepCount / verifiedEngagement) * 100 : 0;
    const completionRate = verifiedEngagement > 0 ? (journeyCompleted / verifiedEngagement) * 100 : 0;
    const contactRate = verifiedEngagement > 0 ? (qualifiedContacts / verifiedEngagement) * 100 : 0;
    const engagementRate = totalImpressions > 0 ? (verifiedEngagement / totalImpressions) * 100 : 0;

    const aggregated = {
      tenantName: tenant.name,
      period: startDate && endDate ? `${startDate} to ${endDate}` : 'All time',
      totalCampaigns: campaigns.length,
      verifiedEngagement,
      totalImpressions,
      engagementRate: Math.round(engagementRate * 10) / 10,
      completionRate: Math.round(completionRate * 10) / 10,
      qualifiedContacts,
      contactRate: Math.round(contactRate * 10) / 10,
      avgDurationSeconds: Math.round(avgDurationSeconds),
      deepEngagementPct: Math.round(deepEngagementPct * 10) / 10,
    };

    const aggregateColumns = [
      { key: 'tenantName', label: 'Tenant Name' },
      { key: 'period', label: 'Period' },
      { key: 'totalCampaigns', label: 'Total Campaigns' },
      { key: 'verifiedEngagement', label: 'Verified Engagement' },
      { key: 'totalImpressions', label: 'Total Impressions' },
      { key: 'engagementRate', label: 'Engagement Rate %' },
      { key: 'completionRate', label: 'Completion Rate %' },
      { key: 'qualifiedContacts', label: 'Qualified Contacts' },
      { key: 'contactRate', label: 'Contact Rate %' },
      { key: 'avgDurationSeconds', label: 'Avg Duration (s)' },
      { key: 'deepEngagementPct', label: 'Deep Engagement % (60s+)' },
    ];
    
    // Generate export
    const buffer = await exportData([aggregated], format, aggregateColumns, {
      sheetName: 'Aggregate Report',
      rootElement: 'aggregateReport'
    });
    
    // Set response headers
    const filename = `aggregate_${tenant.name.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.${getFileExtension(format)}`;
    res.setHeader('Content-Type', getContentType(format));
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error: any) {
    console.error('Export error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;

