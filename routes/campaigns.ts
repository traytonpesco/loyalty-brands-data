import express from 'express';
import { Op } from 'sequelize';
import models from '../models';
import { requirePermission, requireSuperAdmin } from '../middleware/rbac';
import { parseDateRange, buildDateWhereClause } from '../utils/dateFilter';

const router = express.Router();

/**
 * Get user's tenant IDs
 */
async function getUserTenantIds(user: any): Promise<string[]> {
  if (!user) return [];
  
  // Check if user has super_admin role
  const roles = await user.getRoles();
  const isSuperAdmin = roles.some((r: any) => r.name === 'super_admin');
  
  if (isSuperAdmin) {
    // Super admins can see all tenants
    const allTenants = await (models as any).Tenant.findAll({ attributes: ['id'] });
    return allTenants.map((t: any) => t.id);
  }
  
  // Regular users: get their assigned tenants
  const tenants = await user.getTenants();
  return tenants.map((t: any) => t.id);
}

/**
 * Get campaigns for current user's tenants
 */
router.get('/', requirePermission(['campaigns.read']), async (req, res) => {
  try {
    const user: any = (req as any).user;
    const tenantIds = await getUserTenantIds(user);
    
    if (tenantIds.length === 0) {
      return res.json([]);
    }
    
    const tenantId = req.query.tenantId as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    
    const where: any = {};
    
    if (tenantId) {
      // Verify user has access to this tenant
      if (!tenantIds.includes(tenantId)) {
        return res.status(403).json({ error: 'Access denied to this tenant' });
      }
      where.tenantId = tenantId;
    } else {
      // Return campaigns from all user's tenants
      where.tenantId = tenantIds;
    }
    
    // Add date filtering
    try {
      const dateRange = parseDateRange(startDate, endDate);
      if (dateRange) {
        // Filter by startDate (campaigns that started within the range)
        Object.assign(where, buildDateWhereClause('startDate', dateRange));
      }
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
    
    const campaigns = await (models as any).Campaign.findAll({
      where,
      include: [
        {
          model: (models as any).Tenant,
          attributes: ['id', 'name', 'slug', 'primaryColor', 'secondaryColor', 'accentColor', 'logoUrl']
        }
      ],
      order: [['startDate', 'DESC']]
    });
    
    res.json(campaigns);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get single campaign by ID
 */
router.get('/:id', requirePermission(['campaigns.read']), async (req, res) => {
  try {
    const { id } = req.params;
    const user: any = (req as any).user;
    const tenantIds = await getUserTenantIds(user);
    
    const campaign = await (models as any).Campaign.findOne({
      where: { id },
      include: [
        {
          model: (models as any).Tenant,
          attributes: ['id', 'name', 'slug', 'primaryColor', 'secondaryColor', 'accentColor', 'logoUrl']
        },
        {
          model: (models as any).CampaignMetric,
          attributes: ['id', 'metricType', 'data']
        }
      ]
    });
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    // Verify user has access to this campaign's tenant
    if (!tenantIds.includes(campaign.tenantId)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json(campaign);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get campaign engagement metrics (4 core KPIs)
 */
router.get('/:id/metrics', requirePermission(['campaigns.read']), async (req, res) => {
  try {
    const { id } = req.params;
    const user: any = (req as any).user;
    const tenantIds = await getUserTenantIds(user);

    const campaign = await (models as any).Campaign.findByPk(id);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    if (!tenantIds.includes(campaign.tenantId)) return res.status(403).json({ error: 'Access denied' });

    const { CampaignSession, CampaignImpression, CampaignContact } = models as any;

    const [sessions, impressionsRow, contactsCount] = await Promise.all([
      CampaignSession.findAll({ where: { campaignId: id }, attributes: ['id', 'durationSeconds', 'journeyStarted', 'journeyCompleted'] }),
      CampaignImpression.findOne({
        where: { campaignId: id },
        attributes: [[(models as any).sequelize.fn('SUM', (models as any).sequelize.col('impressionCount')), 'total']],
        raw: true,
      }),
      CampaignContact.count({ where: { campaignId: id, consentGiven: true } }),
    ]);

    const totalImpressions = Number(impressionsRow?.total ?? 0);
    const verifiedEngagement = sessions.length;
    const journeyStarted = sessions.filter((s: any) => s.journeyStarted).length;
    const journeyCompleted = sessions.filter((s: any) => s.journeyCompleted).length;
    const completionRate = journeyStarted > 0 ? (journeyCompleted / journeyStarted) * 100 : 0;
    const durations = sessions.map((s: any) => s.durationSeconds).filter((d: number | null) => d != null) as number[];
    const avgDuration = durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
    const deepEngagementCount = durations.filter((d: number) => d >= 30).length;
    const deepEngagementPct = durations.length ? (deepEngagementCount / durations.length) * 100 : 0;
    const contactRate = verifiedEngagement > 0 ? (contactsCount / verifiedEngagement) * 100 : 0;

    res.json({
      verifiedEngagement,
      totalImpressions,
      engagementRate: totalImpressions > 0 ? (verifiedEngagement / totalImpressions) * 100 : 0,
      attentionQuality: {
        averageDurationSeconds: Math.round(avgDuration),
        deepEngagementPct: Math.round(deepEngagementPct * 10) / 10,
        sessionCount: durations.length,
      },
      experienceCompletion: {
        completionRate: Math.round(completionRate * 10) / 10,
        journeyStarted,
        journeyCompleted,
      },
      qualifiedContacts: {
        total: contactsCount,
        contactRate: Math.round(contactRate * 10) / 10,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get engagement funnel: impressions -> interactions -> completions -> contacts
 */
router.get('/:id/funnel', requirePermission(['campaigns.read']), async (req, res) => {
  try {
    const { id } = req.params;
    const user: any = (req as any).user;
    const tenantIds = await getUserTenantIds(user);
    const campaign = await (models as any).Campaign.findByPk(id);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    if (!tenantIds.includes(campaign.tenantId)) return res.status(403).json({ error: 'Access denied' });

    const { CampaignSession, CampaignImpression, CampaignContact } = models as any;
    const [impressionsRow, interactionsCount, completionsCount, contactsCount] = await Promise.all([
      CampaignImpression.findOne({
        where: { campaignId: id },
        attributes: [[(models as any).sequelize.fn('SUM', (models as any).sequelize.col('impressionCount')), 'total']],
        raw: true,
      }),
      CampaignSession.count({ where: { campaignId: id } }),
      CampaignSession.count({ where: { campaignId: id, journeyCompleted: true } }),
      CampaignContact.count({ where: { campaignId: id, consentGiven: true } }),
    ]);

    const impressions = Number(impressionsRow?.total ?? 0);
    const interactions = interactionsCount;
    const completions = completionsCount;
    const contacts = contactsCount;
    res.json({
      impressions,
      interactions,
      completions,
      contacts,
      impressionToInteractionRate: impressions > 0 ? (interactions / impressions) * 100 : 0,
      interactionToCompletionRate: interactions > 0 ? (completions / interactions) * 100 : 0,
      completionToContactRate: completions > 0 ? (contacts / completions) * 100 : 0,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get attention distribution (dwell time buckets)
 */
router.get('/:id/attention-distribution', requirePermission(['campaigns.read']), async (req, res) => {
  try {
    const { id } = req.params;
    const user: any = (req as any).user;
    const tenantIds = await getUserTenantIds(user);
    const campaign = await (models as any).Campaign.findByPk(id);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    if (!tenantIds.includes(campaign.tenantId)) return res.status(403).json({ error: 'Access denied' });

    const sessions = await (models as any).CampaignSession.findAll({
      where: { campaignId: id },
      attributes: ['durationSeconds'],
      raw: true,
    });
    const buckets = { '0-15': 0, '15-30': 0, '30-60': 0, '60+': 0 };
    sessions.forEach((s: any) => {
      const d = s.durationSeconds ?? 0;
      if (d < 15) buckets['0-15']++;
      else if (d < 30) buckets['15-30']++;
      else if (d < 60) buckets['30-60']++;
      else buckets['60+']++;
    });
    res.json({ buckets, total: sessions.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get completion funnel (step-by-step drop-off)
 */
router.get('/:id/completion-funnel', requirePermission(['campaigns.read']), async (req, res) => {
  try {
    const { id } = req.params;
    const user: any = (req as any).user;
    const tenantIds = await getUserTenantIds(user);
    const campaign = await (models as any).Campaign.findByPk(id);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    if (!tenantIds.includes(campaign.tenantId)) return res.status(403).json({ error: 'Access denied' });

    const sessions = await (models as any).CampaignSession.findAll({
      where: { campaignId: id, journeyStarted: true },
      attributes: ['stepsCompleted', 'totalSteps', 'dropOffStep'],
      raw: true,
    });
    const maxSteps = Math.max(0, ...sessions.map((s: any) => s.totalSteps || 0), 5);
    const stepCounts: number[] = Array(maxSteps + 1).fill(0);
    sessions.forEach((s: any) => {
      const completed = s.stepsCompleted ?? 0;
      for (let i = 0; i <= completed && i <= maxSteps; i++) stepCounts[i]++;
    });
    const steps = Array.from({ length: maxSteps + 1 }, (_, i) => ({ step: i, count: stepCounts[i] }));
    res.json({ steps, totalStarted: sessions.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get campaign metrics timeseries (daily counts)
 */
router.get('/:id/timeseries', requirePermission(['campaigns.read']), async (req, res) => {
  try {
    const { id } = req.params;
    const user: any = (req as any).user;
    const tenantIds = await getUserTenantIds(user);
    const campaign = await (models as any).Campaign.findByPk(id);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    if (!tenantIds.includes(campaign.tenantId)) return res.status(403).json({ error: 'Access denied' });

    const sessions = await (models as any).CampaignSession.findAll({
      where: { campaignId: id },
      attributes: ['sessionStart', 'journeyCompleted'],
      raw: true,
    });
    const contacts = await (models as any).CampaignContact.findAll({
      where: { campaignId: id, consentGiven: true },
      attributes: ['createdAt'],
      raw: true,
    });
    const byDay: Record<string, { date: string; interactions: number; completions: number; contacts: number }> = {};
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    sessions.forEach((s: any) => {
      const date = fmt(new Date(s.sessionStart));
      if (!byDay[date]) byDay[date] = { date, interactions: 0, completions: 0, contacts: 0 };
      byDay[date].interactions++;
      if (s.journeyCompleted) byDay[date].completions++;
    });
    contacts.forEach((c: any) => {
      const date = fmt(new Date(c.createdAt));
      if (!byDay[date]) byDay[date] = { date, interactions: 0, completions: 0, contacts: 0 };
      byDay[date].contacts++;
    });
    const series = Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date));
    res.json({ series });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get cross-brand aggregated metrics (super_admin only)
 */
router.get('/admin/aggregate', requireSuperAdmin(), async (req, res) => {
  try {
    const { CampaignSession, CampaignImpression, CampaignContact, Campaign, Tenant } = models as any;
    const seq = (models as any).sequelize;

    const campaigns = await Campaign.findAll({ attributes: ['id'] });
    const campaignIds = campaigns.map((c: any) => c.id);
    const tenantCount = await Tenant.count();

    const [impressionsRow, sessionCount, completionCount, contactsCount, avgDurationRow, deepCount] = campaignIds.length
      ? await Promise.all([
          CampaignImpression.findOne({
            where: { campaignId: { [Op.in]: campaignIds } },
            attributes: [[seq.fn('SUM', seq.col('impressionCount')), 'total']],
            raw: true,
          }),
          CampaignSession.count({ where: { campaignId: { [Op.in]: campaignIds } } }),
          CampaignSession.count({ where: { campaignId: { [Op.in]: campaignIds }, journeyCompleted: true } }),
          CampaignContact.count({ where: { campaignId: { [Op.in]: campaignIds }, consentGiven: true } }),
          CampaignSession.findOne({
            where: { campaignId: { [Op.in]: campaignIds } },
            attributes: [[seq.fn('AVG', seq.col('durationSeconds')), 'avg']],
            raw: true,
          }),
          CampaignSession.count({
            where: { campaignId: { [Op.in]: campaignIds }, durationSeconds: { [Op.gte]: 60 } },
          }),
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

    res.json({
      verifiedEngagement,
      journeyCompleted,
      totalImpressions,
      engagementRate: Math.round(engagementRate * 10) / 10,
      completionRate: Math.round(completionRate * 10) / 10,
      qualifiedContacts,
      contactRate: Math.round(contactRate * 10) / 10,
      avgDurationSeconds: Math.round(avgDurationSeconds),
      deepEngagementPct: Math.round(deepEngagementPct * 10) / 10,
      campaignCount: campaigns.length,
      tenantCount,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get aggregated metrics for tenant
 */
router.get('/tenant/:tenantId/aggregate', requirePermission(['campaigns.read']), async (req, res) => {
  try {
    const { tenantId } = req.params;
    const user: any = (req as any).user;
    const tenantIds = await getUserTenantIds(user);
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    
    // Verify user has access to this tenant
    if (!tenantIds.includes(tenantId)) {
      return res.status(403).json({ error: 'Access denied to this tenant' });
    }
    
    const where: any = { tenantId };
    
    // Add date filtering
    try {
      const dateRange = parseDateRange(startDate, endDate);
      if (dateRange) {
        Object.assign(where, buildDateWhereClause('startDate', dateRange));
      }
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
    
    const campaigns = await (models as any).Campaign.findAll({ where });
    const campaignIds = campaigns.map((c: any) => c.id);

    const { CampaignSession, CampaignImpression, CampaignContact } = models as any;
    const seq = (models as any).sequelize;
    const [impressionsRow, sessionCount, completionCount, contactsCount, avgDurationRow, deepCount] = campaignIds.length
      ? await Promise.all([
          CampaignImpression.findOne({
            where: { campaignId: { [Op.in]: campaignIds } },
            attributes: [[seq.fn('SUM', seq.col('impressionCount')), 'total']],
            raw: true,
          }),
          CampaignSession.count({ where: { campaignId: { [Op.in]: campaignIds } } }),
          CampaignSession.count({ where: { campaignId: { [Op.in]: campaignIds }, journeyCompleted: true } }),
          CampaignContact.count({ where: { campaignId: { [Op.in]: campaignIds }, consentGiven: true } }),
          CampaignSession.findOne({
            where: { campaignId: { [Op.in]: campaignIds } },
            attributes: [[seq.fn('AVG', seq.col('durationSeconds')), 'avg']],
            raw: true,
          }),
          CampaignSession.count({
            where: { campaignId: { [Op.in]: campaignIds }, durationSeconds: { [Op.gte]: 60 } },
          }),
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

    const aggregated = campaigns.reduce((acc: any, campaign: any) => ({
      totalProductsDispensed: acc.totalProductsDispensed + (campaign.totalProductsDispensed || 0),
      totalUserInteractions: acc.totalUserInteractions + (campaign.totalUserInteractions || 0),
      totalFreeSamplesRedeemed: acc.totalFreeSamplesRedeemed + (campaign.totalFreeSamplesRedeemed || 0),
      totalProductClicks: acc.totalProductClicks + (campaign.totalProductClicks || 0),
      uniqueCustomers: acc.uniqueCustomers + (campaign.uniqueCustomers || 0),
      totalAdPlays: acc.totalAdPlays + (campaign.totalAdPlays || 0),
      campaignCount: acc.campaignCount + 1
    }), {
      totalProductsDispensed: 0,
      totalUserInteractions: 0,
      totalFreeSamplesRedeemed: 0,
      totalProductClicks: 0,
      uniqueCustomers: 0,
      totalAdPlays: 0,
      campaignCount: 0
    });

    const avgEngagement = campaigns.length > 0
      ? campaigns.reduce((sum: number, c: any) => sum + (c.averageEngagementTime || 0), 0) / campaigns.length
      : 0;
    const totalMinutes = campaigns.reduce((sum: number, c: any) => sum + (c.totalHours || 0) * 60, 0);
    const totalOfflineMinutes = campaigns.reduce((sum: number, c: any) => sum + (c.machineOfflineMinutes || 0), 0);
    const avgUptime = totalMinutes > 0
      ? ((totalMinutes - totalOfflineMinutes) / totalMinutes * 100).toFixed(2)
      : '100.00';

    res.json({
      ...aggregated,
      averageEngagementTime: Math.round(avgEngagement),
      averageUptime: avgUptime,
      dateRange: startDate && endDate ? { startDate, endDate } : null,
      verifiedEngagement,
      journeyCompleted,
      totalImpressions,
      engagementRate: Math.round(engagementRate * 10) / 10,
      completionRate: Math.round(completionRate * 10) / 10,
      qualifiedContacts,
      contactRate: Math.round(contactRate * 10) / 10,
      avgDurationSeconds: Math.round(avgDurationSeconds),
      deepEngagementPct: Math.round(deepEngagementPct * 10) / 10,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Compare two date ranges for a tenant
 */
router.get('/tenant/:tenantId/compare', requirePermission(['campaigns.read']), async (req, res) => {
  try {
    const { tenantId } = req.params;
    const user: any = (req as any).user;
    const tenantIds = await getUserTenantIds(user);
    const period1Start = req.query.period1Start as string;
    const period1End = req.query.period1End as string;
    const period2Start = req.query.period2Start as string;
    const period2End = req.query.period2End as string;
    
    // Verify user has access to this tenant
    if (!tenantIds.includes(tenantId)) {
      return res.status(403).json({ error: 'Access denied to this tenant' });
    }
    
    if (!period1Start || !period1End || !period2Start || !period2End) {
      return res.status(400).json({ 
        error: 'All date parameters required: period1Start, period1End, period2Start, period2End' 
      });
    }
    
    // Parse date ranges
    let dateRange1, dateRange2;
    try {
      dateRange1 = parseDateRange(period1Start, period1End);
      dateRange2 = parseDateRange(period2Start, period2End);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
    
    // Get campaigns for each period
    const where1: any = { tenantId, ...buildDateWhereClause('startDate', dateRange1) };
    const where2: any = { tenantId, ...buildDateWhereClause('startDate', dateRange2) };
    
    const campaigns1 = await (models as any).Campaign.findAll({ where: where1 });
    const campaigns2 = await (models as any).Campaign.findAll({ where: where2 });
    
    // Calculate metrics for period 1
    const metrics1 = campaigns1.reduce((acc: any, campaign: any) => ({
      totalProductsDispensed: acc.totalProductsDispensed + (campaign.totalProductsDispensed || 0),
      totalUserInteractions: acc.totalUserInteractions + (campaign.totalUserInteractions || 0),
      totalFreeSamplesRedeemed: acc.totalFreeSamplesRedeemed + (campaign.totalFreeSamplesRedeemed || 0),
      totalProductClicks: acc.totalProductClicks + (campaign.totalProductClicks || 0),
      uniqueCustomers: acc.uniqueCustomers + (campaign.uniqueCustomers || 0),
      totalAdPlays: acc.totalAdPlays + (campaign.totalAdPlays || 0),
      campaignCount: acc.campaignCount + 1
    }), {
      totalProductsDispensed: 0,
      totalUserInteractions: 0,
      totalFreeSamplesRedeemed: 0,
      totalProductClicks: 0,
      uniqueCustomers: 0,
      totalAdPlays: 0,
      campaignCount: 0
    });
    
    // Calculate metrics for period 2
    const metrics2 = campaigns2.reduce((acc: any, campaign: any) => ({
      totalProductsDispensed: acc.totalProductsDispensed + (campaign.totalProductsDispensed || 0),
      totalUserInteractions: acc.totalUserInteractions + (campaign.totalUserInteractions || 0),
      totalFreeSamplesRedeemed: acc.totalFreeSamplesRedeemed + (campaign.totalFreeSamplesRedeemed || 0),
      totalProductClicks: acc.totalProductClicks + (campaign.totalProductClicks || 0),
      uniqueCustomers: acc.uniqueCustomers + (campaign.uniqueCustomers || 0),
      totalAdPlays: acc.totalAdPlays + (campaign.totalAdPlays || 0),
      campaignCount: acc.campaignCount + 1
    }), {
      totalProductsDispensed: 0,
      totalUserInteractions: 0,
      totalFreeSamplesRedeemed: 0,
      totalProductClicks: 0,
      uniqueCustomers: 0,
      totalAdPlays: 0,
      campaignCount: 0
    });
    
    // Calculate percentage changes
    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };
    
    const comparison = {
      period1: {
        dateRange: { startDate: period1Start, endDate: period1End },
        metrics: metrics1
      },
      period2: {
        dateRange: { startDate: period2Start, endDate: period2End },
        metrics: metrics2
      },
      changes: {
        totalProductsDispensed: calculateChange(metrics1.totalProductsDispensed, metrics2.totalProductsDispensed),
        totalUserInteractions: calculateChange(metrics1.totalUserInteractions, metrics2.totalUserInteractions),
        totalFreeSamplesRedeemed: calculateChange(metrics1.totalFreeSamplesRedeemed, metrics2.totalFreeSamplesRedeemed),
        totalProductClicks: calculateChange(metrics1.totalProductClicks, metrics2.totalProductClicks),
        uniqueCustomers: calculateChange(metrics1.uniqueCustomers, metrics2.uniqueCustomers),
        totalAdPlays: calculateChange(metrics1.totalAdPlays, metrics2.totalAdPlays),
      }
    };
    
    res.json(comparison);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Delete campaign
 */
router.delete('/:id', requirePermission(['tenants.write']), async (req, res) => {
  try {
    const { id } = req.params;
    const user: any = (req as any).user;
    const tenantIds = await getUserTenantIds(user);
    
    const campaign = await (models as any).Campaign.findByPk(id);
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    // Verify user has access to this campaign's tenant
    if (!tenantIds.includes(campaign.tenantId)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Delete associated metrics first
    await (models as any).CampaignMetric.destroy({ where: { campaignId: id } });
    
    // Delete campaign
    await campaign.destroy();
    
    res.json({ ok: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

