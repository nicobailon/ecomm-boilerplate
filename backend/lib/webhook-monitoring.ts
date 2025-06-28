import { WebhookEvent } from '../models/webhook-event.model.js';

interface WebhookAlert {
  type: 'failed' | 'high_failure_rate' | 'processing_delay' | 'duplicate';
  message: string;
  details?: {
    eventId?: string;
    eventType?: string;
    failureRate?: number;
    processingTime?: number;
    error?: string;
  };
  timestamp: Date;
}

export class WebhookMonitoring {
  private alertHandlers: ((alert: WebhookAlert) => void | Promise<void>)[] = [];
  private failureThreshold = 0.05; // 5% failure rate threshold
  private processingDelayThreshold = 5000; // 5 seconds
  private monitoringInterval: NodeJS.Timeout | null = null;
  private lastAlerts = new Map<string, Date>();
  private alertCooldown = 300000; // 5 minutes cooldown per alert type

  /**
   * Register an alert handler
   */
  onAlert(handler: (alert: WebhookAlert) => void | Promise<void>): void {
    this.alertHandlers.push(handler);
  }

  /**
   * Start monitoring webhook events
   */
  startMonitoring(intervalMs = 60000): void {
    if (this.monitoringInterval) {
      console.warn('[WebhookMonitoring] Monitoring already started');
      return;
    }

    console.info('[WebhookMonitoring] Starting webhook monitoring');
    
    // Initial check
    void this.checkWebhookHealth();
    
    // Schedule periodic checks
    this.monitoringInterval = setInterval(() => {
      void this.checkWebhookHealth();
    }, intervalMs);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.info('[WebhookMonitoring] Monitoring stopped');
    }
  }

  /**
   * Check webhook health and send alerts if needed
   */
  private async checkWebhookHealth(): Promise<void> {
    try {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      // Check failure rate
      const [totalEvents, failedEvents] = await Promise.all([
        WebhookEvent.countDocuments({ createdAt: { $gte: fiveMinutesAgo } }),
        WebhookEvent.countDocuments({ 
          createdAt: { $gte: fiveMinutesAgo },
          processed: false,
          error: { $exists: true }
        })
      ]);

      if (totalEvents > 10) { // Only alert if we have meaningful data
        const failureRate = failedEvents / totalEvents;
        if (failureRate > this.failureThreshold) {
          this.sendAlert({
            type: 'high_failure_rate',
            message: `Webhook failure rate is ${(failureRate * 100).toFixed(2)}% (${failedEvents}/${totalEvents} events)`,
            details: { failureRate },
            timestamp: now
          });
        }
      }

      // Check for unprocessed old events
      const oldUnprocessedEvents = await WebhookEvent.find({
        createdAt: { $lte: oneHourAgo },
        processed: false
      }).limit(5);

      for (const event of oldUnprocessedEvents) {
        this.sendAlert({
          type: 'processing_delay',
          message: `Webhook event ${event.stripeEventId} unprocessed for over 1 hour`,
          details: {
            eventId: event.stripeEventId,
            eventType: event.eventType,
            processingTime: now.getTime() - event.createdAt.getTime()
          },
          timestamp: now
        });
      }

      // Check for high duplicate rate
      const duplicateEvents = await WebhookEvent.aggregate([
        { $match: { createdAt: { $gte: fiveMinutesAgo } } },
        { $group: { _id: '$stripeEventId', count: { $sum: 1 } } },
        { $match: { count: { $gt: 1 } } },
        { $count: 'duplicates' }
      ]);

      if (duplicateEvents.length > 0 && duplicateEvents[0].duplicates > 5) {
        this.sendAlert({
          type: 'duplicate',
          message: `High duplicate webhook rate detected: ${duplicateEvents[0].duplicates} duplicates in last 5 minutes`,
          details: {},
          timestamp: now
        });
      }
    } catch (error) {
      console.error('[WebhookMonitoring] Health check error:', error);
    }
  }

  /**
   * Send alert to all registered handlers with deduplication
   */
  private sendAlert(alert: WebhookAlert): void {
    const alertKey = `${alert.type}-${alert.message.substring(0, 50)}`;
    const lastAlertTime = this.lastAlerts.get(alertKey);
    const now = new Date();
    
    if (lastAlertTime && now.getTime() - lastAlertTime.getTime() < this.alertCooldown) {
      return;
    }
    
    this.lastAlerts.set(alertKey, now);
    
    // Clean up old entries
    if (this.lastAlerts.size > 100) {
      const fiveMinutesAgo = now.getTime() - 5 * 60 * 1000;
      for (const [key, time] of this.lastAlerts.entries()) {
        if (time.getTime() < fiveMinutesAgo) {
          this.lastAlerts.delete(key);
        }
      }
    }
    
    console.error(`[WebhookMonitoring] ${alert.type.toUpperCase()} Alert:`, alert);
    
    this.alertHandlers.forEach(handler => {
      try {
        const result = handler(alert);
        if (result instanceof Promise) {
          void result.catch((error) => {
            console.error('[WebhookMonitoring] Alert handler error:', error);
          });
        }
      } catch (error) {
        console.error('[WebhookMonitoring] Alert handler error:', error);
      }
    });
  }

  /**
   * Log a webhook processing event for monitoring
   */
  async logWebhookEvent(
    eventId: string,
    eventType: string,
    success: boolean,
    processingTimeMs: number,
    error?: string
  ): Promise<void> {
    try {
      // Log metrics (could be sent to monitoring service)
      console.info('[WebhookMonitoring] Event processed:', {
        eventId,
        eventType,
        success,
        processingTimeMs,
        error
      });

      // Alert on slow processing
      if (processingTimeMs > this.processingDelayThreshold) {
        this.sendAlert({
          type: 'processing_delay',
          message: `Webhook event ${eventId} took ${processingTimeMs}ms to process`,
          details: {
            eventId,
            eventType,
            processingTime: processingTimeMs
          },
          timestamp: new Date()
        });
      }

      // Alert on failures
      if (!success && error) {
        this.sendAlert({
          type: 'failed',
          message: `Webhook event ${eventId} failed: ${error}`,
          details: {
            eventId,
            eventType,
            error
          },
          timestamp: new Date()
        });
      }
    } catch (err) {
      console.error('[WebhookMonitoring] Error logging webhook event:', err);
    }
  }
}

// Alert handlers
export const webhookAlertHandlers = {
  console: (alert: WebhookAlert): void => {
    console.error('[WEBHOOK ALERT]', {
      type: alert.type,
      message: alert.message,
      details: alert.details,
      timestamp: alert.timestamp.toISOString()
    });
  },

  monitoring: (alert: WebhookAlert): void => {
    // Send to monitoring service (Sentry, Datadog, etc.)
    // This is a placeholder - implement based on your monitoring service
    if (process.env.MONITORING_ENABLED === 'true') {
      console.info('[WebhookMonitoring] Would send to monitoring service:', alert);
    }
  },

  slack: async (alert: WebhookAlert): Promise<void> => {
    if (!process.env.SLACK_WEBHOOK_URL) return;
    
    try {
      const response = await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🚨 Webhook Alert: ${alert.type}`,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*Alert Type:* ${alert.type}\n*Message:* ${alert.message}\n*Time:* ${alert.timestamp.toISOString()}`
              }
            }
          ]
        })
      });
      
      if (!response.ok) {
        console.error('[WebhookMonitoring] Slack notification failed:', response.statusText);
      }
    } catch (error) {
      console.error('[WebhookMonitoring] Slack notification error:', error);
    }
  }
};

export const webhookMonitoring = new WebhookMonitoring();