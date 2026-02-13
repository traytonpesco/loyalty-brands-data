import express from 'express';
import crypto from 'crypto';
import models from '../models';
import { requirePermission } from '../middleware/rbac';
import { WEBHOOK_EVENTS, retryFailedWebhooks, getWebhookStats } from '../services/webhookService';

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
 * Get all available webhook events
 * GET /api/webhooks/events
 */
router.get('/events', requirePermission(['tenants.read']), async (req, res) => {
  res.json({
    events: Object.values(WEBHOOK_EVENTS),
    descriptions: {
      [WEBHOOK_EVENTS.CAMPAIGN_CREATED]: 'Triggered when a new campaign is created',
      [WEBHOOK_EVENTS.CAMPAIGN_UPDATED]: 'Triggered when a campaign is updated',
      [WEBHOOK_EVENTS.CAMPAIGN_DELETED]: 'Triggered when a campaign is deleted',
      [WEBHOOK_EVENTS.CAMPAIGN_MILESTONE]: 'Triggered when a campaign reaches a milestone',
      [WEBHOOK_EVENTS.MACHINE_DOWNTIME]: 'Triggered when machine downtime is detected',
      [WEBHOOK_EVENTS.USER_CREATED]: 'Triggered when a new user is created',
      [WEBHOOK_EVENTS.USER_DELETED]: 'Triggered when a user is deleted',
      [WEBHOOK_EVENTS.CONFIG_CHANGED]: 'Triggered when configuration changes',
      [WEBHOOK_EVENTS.CSV_UPLOADED]: 'Triggered when a CSV file is uploaded',
      [WEBHOOK_EVENTS.EXPORT_COMPLETED]: 'Triggered when a data export completes',
    },
  });
});

/**
 * List webhooks for tenant
 * GET /api/webhooks/:tenantId
 */
router.get('/:tenantId', requirePermission(['tenants.read']), async (req, res) => {
  try {
    const { tenantId } = req.params;
    const user: any = (req as any).user;
    const tenantIds = await getUserTenantIds(user);
    
    if (!tenantIds.includes(tenantId)) {
      return res.status(403).json({ error: 'Access denied to this tenant' });
    }

    const webhooks = await (models as any).Webhook.findAll({
      where: { tenantId },
      order: [['createdAt', 'DESC']],
    });

    res.json({ webhooks });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Create webhook
 * POST /api/webhooks/:tenantId
 */
router.post('/:tenantId', requirePermission(['tenants.write']), async (req, res) => {
  try {
    const { tenantId } = req.params;
    const { url, events, description } = req.body;
    const user: any = (req as any).user;
    const tenantIds = await getUserTenantIds(user);
    
    if (!tenantIds.includes(tenantId)) {
      return res.status(403).json({ error: 'Access denied to this tenant' });
    }

    if (!url || !events || !Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ 
        error: 'url and events (array) are required' 
      });
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    // Validate events
    const validEvents = Object.values(WEBHOOK_EVENTS);
    const invalidEvents = events.filter(e => e !== '*' && !validEvents.includes(e));
    if (invalidEvents.length > 0) {
      return res.status(400).json({ 
        error: `Invalid events: ${invalidEvents.join(', ')}` 
      });
    }

    // Generate secret
    const secret = crypto.randomBytes(32).toString('hex');

    const webhook = await (models as any).Webhook.create({
      tenantId,
      url,
      secret,
      events,
      description: description || null,
      isActive: true,
    });

    res.status(201).json({ 
      webhook,
      message: 'Webhook created successfully. Save the secret - it will not be shown again.',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Update webhook
 * PUT /api/webhooks/:webhookId
 */
router.put('/:webhookId', requirePermission(['tenants.write']), async (req, res) => {
  try {
    const { webhookId } = req.params;
    const { url, events, description, isActive } = req.body;
    const user: any = (req as any).user;
    const tenantIds = await getUserTenantIds(user);

    const webhook = await (models as any).Webhook.findByPk(webhookId);
    
    if (!webhook) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    if (!tenantIds.includes(webhook.tenantId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updates: any = {};
    if (url !== undefined) updates.url = url;
    if (events !== undefined) updates.events = events;
    if (description !== undefined) updates.description = description;
    if (isActive !== undefined) updates.isActive = isActive;

    await webhook.update(updates);

    res.json({ webhook, message: 'Webhook updated successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Delete webhook
 * DELETE /api/webhooks/:webhookId
 */
router.delete('/:webhookId', requirePermission(['tenants.write']), async (req, res) => {
  try {
    const { webhookId } = req.params;
    const user: any = (req as any).user;
    const tenantIds = await getUserTenantIds(user);

    const webhook = await (models as any).Webhook.findByPk(webhookId);
    
    if (!webhook) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    if (!tenantIds.includes(webhook.tenantId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await webhook.destroy();

    res.json({ message: 'Webhook deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get webhook delivery history
 * GET /api/webhooks/:webhookId/deliveries
 */
router.get('/:webhookId/deliveries', requirePermission(['tenants.read']), async (req, res) => {
  try {
    const { webhookId } = req.params;
    const { limit = 50, status } = req.query;
    const user: any = (req as any).user;
    const tenantIds = await getUserTenantIds(user);

    const webhook = await (models as any).Webhook.findByPk(webhookId);
    
    if (!webhook) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    if (!tenantIds.includes(webhook.tenantId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const where: any = { webhookId };
    if (status) {
      where.status = status;
    }

    const deliveries = await (models as any).WebhookDelivery.findAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit as string),
    });

    res.json({ deliveries });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get webhook statistics
 * GET /api/webhooks/:webhookId/stats
 */
router.get('/:webhookId/stats', requirePermission(['tenants.read']), async (req, res) => {
  try {
    const { webhookId } = req.params;
    const user: any = (req as any).user;
    const tenantIds = await getUserTenantIds(user);

    const webhook = await (models as any).Webhook.findByPk(webhookId);
    
    if (!webhook) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    if (!tenantIds.includes(webhook.tenantId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const stats = await getWebhookStats(webhookId);

    res.json({ stats });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Retry failed deliveries
 * POST /api/webhooks/:webhookId/retry
 */
router.post('/:webhookId/retry', requirePermission(['tenants.write']), async (req, res) => {
  try {
    const { webhookId } = req.params;
    const user: any = (req as any).user;
    const tenantIds = await getUserTenantIds(user);

    const webhook = await (models as any).Webhook.findByPk(webhookId);
    
    if (!webhook) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    if (!tenantIds.includes(webhook.tenantId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const retriedCount = await retryFailedWebhooks(webhookId);

    res.json({ 
      message: `Retrying ${retriedCount} failed deliveries`,
      retriedCount,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

