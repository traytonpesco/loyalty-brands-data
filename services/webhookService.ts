import crypto from 'crypto';
import models from '../models';

export const WEBHOOK_EVENTS = {
  CAMPAIGN_CREATED: 'campaign.created',
  CAMPAIGN_UPDATED: 'campaign.updated',
  CAMPAIGN_DELETED: 'campaign.deleted',
  CAMPAIGN_MILESTONE: 'campaign.milestone',
  MACHINE_DOWNTIME: 'machine.downtime',
  USER_CREATED: 'user.created',
  USER_DELETED: 'user.deleted',
  CONFIG_CHANGED: 'config.changed',
  CSV_UPLOADED: 'csv.uploaded',
  EXPORT_COMPLETED: 'export.completed',
};

interface WebhookPayload {
  event: string;
  timestamp: string;
  tenantId: string;
  data: any;
}

/**
 * Generate HMAC signature for webhook payload
 */
export function generateSignature(payload: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

/**
 * Verify webhook signature
 */
export function verifySignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = generateSignature(payload, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Trigger webhook for an event
 */
export async function triggerWebhook(
  tenantId: string,
  event: string,
  data: any
): Promise<void> {
  try {
    // Find all active webhooks for this tenant that subscribe to this event
    const webhooks = await (models as any).Webhook.findAll({
      where: {
        tenantId,
        isActive: true,
      },
    });

    const subscribedWebhooks = webhooks.filter((webhook: any) => {
      const events = Array.isArray(webhook.events) ? webhook.events : [];
      return events.includes(event) || events.includes('*');
    });

    if (subscribedWebhooks.length === 0) {
      console.log(`[Webhook] No webhooks found for event ${event} in tenant ${tenantId}`);
      return;
    }

    // Create delivery records for each webhook
    for (const webhook of subscribedWebhooks) {
      const payload: WebhookPayload = {
        event,
        timestamp: new Date().toISOString(),
        tenantId,
        data,
      };

      await (models as any).WebhookDelivery.create({
        webhookId: webhook.id,
        event,
        payload,
        status: 'pending',
        attempts: 0,
        maxAttempts: 3,
      });

      console.log(`[Webhook] Queued delivery for webhook ${webhook.id}`);
    }

    // Trigger immediate delivery
    processWebhookQueue();
  } catch (error) {
    console.error('[Webhook] Error triggering webhook:', error);
  }
}

/**
 * Process webhook delivery queue
 */
export async function processWebhookQueue(): Promise<void> {
  try {
    // Find pending and retry-ready deliveries
    const now = new Date();
    const deliveries = await (models as any).WebhookDelivery.findAll({
      where: {
        status: ['pending', 'retrying'],
      },
      include: [
        {
          model: (models as any).Webhook,
          where: { isActive: true },
        },
      ],
      limit: 100,
    });

    for (const delivery of deliveries) {
      // Skip if not ready for retry
      if (delivery.nextRetryAt && new Date(delivery.nextRetryAt) > now) {
        continue;
      }

      await deliverWebhook(delivery);
    }
  } catch (error) {
    console.error('[Webhook] Error processing queue:', error);
  }
}

/**
 * Deliver a webhook
 */
async function deliverWebhook(delivery: any): Promise<void> {
  const webhook = delivery.Webhook;
  
  try {
    const payloadString = JSON.stringify(delivery.payload);
    const signature = generateSignature(payloadString, webhook.secret);

    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': delivery.event,
        'User-Agent': 'Bright.Blue-Brand-Portal-Webhook/1.0',
      },
      body: payloadString,
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    const responseBody = await response.text();

    if (response.ok) {
      // Success
      await delivery.update({
        status: 'success',
        attempts: delivery.attempts + 1,
        responseStatus: response.status,
        responseBody: responseBody.substring(0, 1000), // Limit stored response
        deliveredAt: new Date(),
      });

      console.log(`[Webhook] Successfully delivered to ${webhook.url}`);
    } else {
      // HTTP error
      throw new Error(`HTTP ${response.status}: ${responseBody}`);
    }
  } catch (error: any) {
    console.error(`[Webhook] Delivery failed:`, error.message);

    const attempts = delivery.attempts + 1;
    const shouldRetry = attempts < delivery.maxAttempts;

    if (shouldRetry) {
      // Calculate exponential backoff: 2^attempts minutes
      const delayMinutes = Math.pow(2, attempts);
      const nextRetryAt = new Date(Date.now() + delayMinutes * 60 * 1000);

      await delivery.update({
        status: 'retrying',
        attempts,
        error: error.message,
        nextRetryAt,
      });

      console.log(`[Webhook] Will retry in ${delayMinutes} minutes`);
    } else {
      // Max retries reached
      await delivery.update({
        status: 'failed',
        attempts,
        error: error.message,
      });

      console.log(`[Webhook] Max retries reached, marking as failed`);
    }
  }
}

/**
 * Retry failed webhooks
 */
export async function retryFailedWebhooks(webhookId?: string): Promise<number> {
  try {
    const where: any = {
      status: 'failed',
    };

    if (webhookId) {
      where.webhookId = webhookId;
    }

    const failedDeliveries = await (models as any).WebhookDelivery.findAll({ where });

    for (const delivery of failedDeliveries) {
      await delivery.update({
        status: 'pending',
        attempts: 0,
        nextRetryAt: null,
        error: null,
      });
    }

    // Trigger processing
    processWebhookQueue();

    return failedDeliveries.length;
  } catch (error) {
    console.error('[Webhook] Error retrying failed webhooks:', error);
    return 0;
  }
}

/**
 * Get webhook delivery statistics
 */
export async function getWebhookStats(webhookId: string): Promise<any> {
  try {
    const deliveries = await (models as any).WebhookDelivery.findAll({
      where: { webhookId },
      attributes: ['status'],
    });

    const stats = {
      total: deliveries.length,
      success: deliveries.filter((d: any) => d.status === 'success').length,
      failed: deliveries.filter((d: any) => d.status === 'failed').length,
      pending: deliveries.filter((d: any) => d.status === 'pending').length,
      retrying: deliveries.filter((d: any) => d.status === 'retrying').length,
    };

    return {
      ...stats,
      successRate: stats.total > 0 ? (stats.success / stats.total) * 100 : 0,
    };
  } catch (error) {
    console.error('[Webhook] Error getting stats:', error);
    return null;
  }
}

// Start processing queue periodically (every 1 minute)
if (typeof global !== 'undefined') {
  setInterval(() => {
    processWebhookQueue();
  }, 60000); // 1 minute
}

