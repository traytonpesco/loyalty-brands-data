import * as cron from 'node-cron';
import { Op } from 'sequelize';
import models from '../models';
import { exportToCSV, exportToJSON, exportToXML, exportToExcel } from './exportService';
import { sendExportEmail } from './email';
import dayjs from 'dayjs';
import { parseDateRange, buildDateWhereClause } from '../utils/dateFilter';

interface ScheduledExportJob {
  id: string;
  tenantId: string;
  name: string;
  exportType: 'campaign' | 'campaigns' | 'aggregate';
  format: 'csv' | 'excel' | 'json' | 'xml';
  schedule: string;
  recipients: string[];
  filters?: any;
  isActive: boolean;
}

const activeCronJobs = new Map<string, any>();

/**
 * Execute a scheduled export
 */
async function executeScheduledExport(job: ScheduledExportJob): Promise<void> {
  console.log(`[Scheduled Export] Executing job ${job.id} - ${job.name}`);

  const historyId = crypto.randomUUID();
  
  try {
    // Create history record
    await (models as any).ExportHistory.create({
      id: historyId,
      scheduledExportId: job.id,
      tenantId: job.tenantId,
      format: job.format,
      status: 'processing',
      recipients: job.recipients,
      startedAt: new Date(),
    });

    // Generate export based on type
    let data: any[] = [];
    let headers: any[] = [];
    let fileName = '';

    if (job.exportType === 'campaign' && job.filters?.campaignId) {
      const campaign = await (models as any).Campaign.findByPk(job.filters.campaignId);
      if (!campaign) throw new Error('Campaign not found');
      const row = await buildEngagementRowForCampaign((models as any), campaign.id, campaign);
      data = [row];
      headers = getCampaignHeaders();
      fileName = `campaign-${campaign.name}-${dayjs().format('YYYY-MM-DD')}.${getFileExtension(job.format)}`;

    } else if (job.exportType === 'campaigns') {
      const whereClause: any = { tenantId: job.tenantId };
      if (job.filters?.startDate || job.filters?.endDate) {
        const dateRange = parseDateRange(job.filters.startDate || '', job.filters.endDate || '');
        if (dateRange) Object.assign(whereClause, buildDateWhereClause('startDate', dateRange));
      }
      if (job.filters?.campaignIds && job.filters.campaignIds.length > 0) {
        whereClause.id = job.filters.campaignIds;
      }
      const campaigns = await (models as any).Campaign.findAll({ where: whereClause });
      data = await Promise.all(campaigns.map((c: any) => buildEngagementRowForCampaign((models as any), c.id, c)));
      headers = getCampaignHeaders();
      fileName = `campaigns-${job.tenantId}-${dayjs().format('YYYY-MM-DD')}.${getFileExtension(job.format)}`;

    } else if (job.exportType === 'aggregate') {
      // Aggregated engagement metrics export
      const whereClause: any = { tenantId: job.tenantId };
      if (job.filters?.startDate || job.filters?.endDate) {
        const dateRange = parseDateRange(job.filters.startDate || '', job.filters.endDate || '');
        if (dateRange) Object.assign(whereClause, buildDateWhereClause('startDate', dateRange));
      }
      const campaigns = await (models as any).Campaign.findAll({ where: whereClause, attributes: ['id'] });
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
      const qualifiedContacts = contactsCount;
      const avgDurationSeconds = Number(avgDurationRow?.avg ?? 0);
      const deepEngagementPct = verifiedEngagement > 0 ? (deepCount / verifiedEngagement) * 100 : 0;
      const completionRate = verifiedEngagement > 0 ? (completionCount / verifiedEngagement) * 100 : 0;
      const contactRate = verifiedEngagement > 0 ? (qualifiedContacts / verifiedEngagement) * 100 : 0;
      const engagementRate = totalImpressions > 0 ? (verifiedEngagement / totalImpressions) * 100 : 0;

      const tenant = await (models as any).Tenant.findByPk(job.tenantId);
      data = [{
        tenantName: tenant?.name ?? job.tenantId,
        period: job.filters?.startDate && job.filters?.endDate ? `${job.filters.startDate} to ${job.filters.endDate}` : 'All time',
        totalCampaigns: campaigns.length,
        verifiedEngagement,
        totalImpressions,
        engagementRate: Math.round(engagementRate * 10) / 10,
        completionRate: Math.round(completionRate * 10) / 10,
        qualifiedContacts,
        contactRate: Math.round(contactRate * 10) / 10,
        avgDurationSeconds: Math.round(avgDurationSeconds),
        deepEngagementPct: Math.round(deepEngagementPct * 10) / 10,
      }];
      headers = getAggregateHeaders();
      fileName = `aggregate-${job.tenantId}-${dayjs().format('YYYY-MM-DD')}.${getFileExtension(job.format)}`;
    }

    if (data.length === 0) {
      throw new Error('No data found for export');
    }

    // Generate file buffer based on format
    let fileBuffer: Buffer;

    switch (job.format) {
      case 'csv':
        fileBuffer = await exportToCSV(data, headers);
        break;
      case 'excel':
        fileBuffer = await exportToExcel(data, headers, 'Export');
        break;
      case 'json':
        fileBuffer = await exportToJSON(data);
        break;
      case 'xml':
        fileBuffer = await exportToXML(data, 'exports');
        break;
      default:
        throw new Error(`Unsupported format: ${job.format}`);
    }

    // Send email with attachment
    const emailSent = await sendExportEmail(
      job.recipients,
      job.name,
      job.format,
      fileBuffer,
      fileName
    );

    if (!emailSent) {
      console.warn(`[Scheduled Export] Email not sent (SMTP not configured), but export completed`);
    }

    // Update history record
    await (models as any).ExportHistory.update(
      {
        status: 'completed',
        fileName,
        fileSize: fileBuffer.length,
        recordCount: data.length,
        completedAt: new Date(),
      },
      { where: { id: historyId } }
    );

    // Update last run time
    await (models as any).ScheduledExport.update(
      { lastRunAt: new Date() },
      { where: { id: job.id } }
    );

    console.log(`[Scheduled Export] Job ${job.id} completed successfully. Exported ${data.length} records.`);

  } catch (error: any) {
    console.error(`[Scheduled Export] Job ${job.id} failed:`, error.message);

    // Update history with error
    await (models as any).ExportHistory.update(
      {
        status: 'failed',
        error: error.message,
        completedAt: new Date(),
      },
      { where: { id: historyId } }
    );
  }
}

/**
 * Schedule a cron job for an export
 */
function scheduleExportJob(job: ScheduledExportJob): void {
  // Validate cron expression
  if (!cron.validate(job.schedule)) {
    console.error(`[Scheduled Export] Invalid cron expression for job ${job.id}: ${job.schedule}`);
    return;
  }

  // Stop existing job if any
  stopExportJob(job.id);

  // Start new cron job
  const cronJob = cron.schedule(job.schedule, () => {
    executeScheduledExport(job);
  }, {
    timezone: process.env.TZ || 'UTC',
  });

  activeCronJobs.set(job.id, cronJob);
  console.log(`[Scheduled Export] Job ${job.id} scheduled with pattern: ${job.schedule}`);
}

/**
 * Stop a scheduled export job
 */
function stopExportJob(jobId: string): void {
  const existingJob = activeCronJobs.get(jobId);
  if (existingJob) {
    existingJob.stop();
    activeCronJobs.delete(jobId);
    console.log(`[Scheduled Export] Job ${jobId} stopped`);
  }
}

/**
 * Initialize all active scheduled exports on server start
 */
export async function initializeScheduledExports(): Promise<void> {
  try {
    const scheduledExports = await (models as any).ScheduledExport.findAll({
      where: { isActive: true },
      raw: true,
    });

    console.log(`[Scheduled Export] Found ${scheduledExports.length} active scheduled exports`);

    for (const job of scheduledExports) {
      scheduleExportJob(job);
    }
  } catch (error) {
    console.error('[Scheduled Export] Failed to initialize scheduled exports:', error);
  }
}

/**
 * Add a new scheduled export
 */
export function addScheduledExport(job: ScheduledExportJob): void {
  if (job.isActive) {
    scheduleExportJob(job);
  }
}

/**
 * Update an existing scheduled export
 */
export function updateScheduledExport(job: ScheduledExportJob): void {
  stopExportJob(job.id);
  if (job.isActive) {
    scheduleExportJob(job);
  }
}

/**
 * Remove a scheduled export
 */
export function removeScheduledExport(jobId: string): void {
  stopExportJob(jobId);
}

/**
 * Manually trigger a scheduled export (for testing)
 */
export async function triggerScheduledExport(jobId: string): Promise<void> {
  const job = await (models as any).ScheduledExport.findByPk(jobId, { raw: true });
  if (!job) {
    throw new Error('Scheduled export not found');
  }
  await executeScheduledExport(job);
}

async function buildEngagementRowForCampaign(modelsObj: any, campaignId: string, campaign: any) {
  const { CampaignSession, CampaignImpression, CampaignContact } = modelsObj;
  const seq = modelsObj.sequelize;
  const [impressionsRow, sessionCount, completionCount, contactsCount, avgDurationRow, deepCount] = await Promise.all([
    CampaignImpression.findOne({ where: { campaignId }, attributes: [[seq.fn('SUM', seq.col('impressionCount')), 'total']], raw: true }),
    CampaignSession.count({ where: { campaignId } }),
    CampaignSession.count({ where: { campaignId, journeyCompleted: true } }),
    CampaignContact.count({ where: { campaignId, consentGiven: true } }),
    CampaignSession.findOne({ where: { campaignId }, attributes: [[seq.fn('AVG', seq.col('durationSeconds')), 'avg']], raw: true }),
    CampaignSession.count({ where: { campaignId, durationSeconds: { [Op.gte]: 60 } } }),
  ]);
  const totalImpressions = Number(impressionsRow?.total ?? 0);
  const verifiedEngagement = sessionCount;
  const completionRate = verifiedEngagement > 0 ? (completionCount / verifiedEngagement) * 100 : 0;
  const contactRate = verifiedEngagement > 0 ? (contactsCount / verifiedEngagement) * 100 : 0;
  const engagementRate = totalImpressions > 0 ? (verifiedEngagement / totalImpressions) * 100 : 0;
  const avgDurationSeconds = Number(avgDurationRow?.avg ?? 0);
  const deepEngagementPct = verifiedEngagement > 0 ? (deepCount / verifiedEngagement) * 100 : 0;
  return {
    id: campaign.id,
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
  };
}

/**
 * Helper functions
 */
function getFileExtension(format: string): string {
  switch (format) {
    case 'excel': return 'xlsx';
    case 'csv': return 'csv';
    case 'json': return 'json';
    case 'xml': return 'xml';
    default: return 'txt';
  }
}

function getCampaignHeaders() {
  return [
    { key: 'id', label: 'Campaign ID' },
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
}

function getAggregateHeaders() {
  return [
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
}

