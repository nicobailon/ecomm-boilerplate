import { getEmailQueueForShutdown } from './email-queue.js';
import type Bull from 'bull';
import type { EmailJob } from './email-queue.js';

interface QueueAlert {
  type: 'failed' | 'stalled' | 'error' | 'threshold';
  queue: string;
  message: string;
  details?: unknown;
  timestamp: Date;
}

export class QueueMonitoring {
  private alertHandlers: ((alert: QueueAlert) => void)[] = [];
  private failureThreshold = 5; // Alert if more than 5 failures in 5 minutes
  private recentFailures: Date[] = [];
  private lastAlerts = new Map<string, Date>();
  private alertCooldown = 60000; // 1 minute cooldown per alert type
  
  private emailQueue: Bull.Queue<EmailJob> | null = null;
  
  constructor() {
    // Delay queue listener setup
    this.initializeAsync();
  }
  
  private async initializeAsync(): Promise<void> {
    try {
      // Wait a bit for the email queue to potentially be initialized
      await new Promise(resolve => setTimeout(resolve, 1000));
      this.emailQueue = await getEmailQueueForShutdown();
      this.setupQueueListeners();
    } catch (error) {
      console.error('[QueueMonitoring] Failed to initialize:', error);
    }
  }
  
  /**
   * Register an alert handler
   */
  onAlert(handler: (alert: QueueAlert) => void): void {
    this.alertHandlers.push(handler);
  }
  
  /**
   * Send alert to all registered handlers with deduplication
   */
  private sendAlert(alert: QueueAlert): void {
    // Create unique key for deduplication
    const alertKey = `${alert.type}-${alert.queue}-${alert.message.substring(0, 50)}`;
    const lastAlertTime = this.lastAlerts.get(alertKey);
    const now = new Date();
    
    // Check cooldown period
    if (lastAlertTime && now.getTime() - lastAlertTime.getTime() < this.alertCooldown) {
      // Skip duplicate alert within cooldown period
      return;
    }
    
    // Update last alert time
    this.lastAlerts.set(alertKey, now);
    
    // Clean up old entries periodically (remove entries older than 5 minutes)
    if (this.lastAlerts.size > 100) {
      const fiveMinutesAgo = now.getTime() - 5 * 60 * 1000;
      for (const [key, time] of this.lastAlerts.entries()) {
        if (time.getTime() < fiveMinutesAgo) {
          this.lastAlerts.delete(key);
        }
      }
    }
    
    console.error(`[QueueMonitoring] ${alert.type.toUpperCase()} Alert:`, {
      queue: alert.queue,
      message: alert.message,
      details: alert.details,
      timestamp: alert.timestamp.toISOString(),
    });
    
    // Send to all registered handlers (e.g., Slack, email, monitoring service)
    this.alertHandlers.forEach(handler => {
      try {
        handler(alert);
      } catch (error) {
        console.error('[QueueMonitoring] Alert handler error:', error);
      }
    });
  }
  
  /**
   * Set up listeners for queue events
   */
  private setupQueueListeners(): void {
    if (!this.emailQueue) {
      console.warn('[QueueMonitoring] Email queue not available, skipping queue listeners');
      return;
    }
    
    // Job failed after all retries
    this.emailQueue.on('failed', (job, err) => {
      this.trackFailure();
      
      this.sendAlert({
        type: 'failed',
        queue: 'email',
        message: `Email job ${job.id} failed after ${job.attemptsMade} attempts`,
        details: {
          jobId: job.id,
          jobData: job.data,
          error: err.message,
          stack: err.stack,
          attempts: job.attemptsMade,
        },
        timestamp: new Date(),
      });
    });
    
    // Job stalled (worker crashed or stopped)
    this.emailQueue.on('stalled', (job) => {
      this.sendAlert({
        type: 'stalled',
        queue: 'email',
        message: `Email job ${job.id} stalled and will be retried`,
        details: {
          jobId: job.id,
          jobData: job.data,
        },
        timestamp: new Date(),
      });
    });
    
    // Queue error (Redis connection issues, etc.)
    this.emailQueue.on('error', (error) => {
      this.sendAlert({
        type: 'error',
        queue: 'email',
        message: 'Email queue error',
        details: {
          error: error.message,
          stack: error.stack,
        },
        timestamp: new Date(),
      });
    });
  }
  
  /**
   * Track failures and check threshold
   */
  private trackFailure(): void {
    const now = new Date();
    this.recentFailures.push(now);
    
    // Remove failures older than 5 minutes
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    this.recentFailures = this.recentFailures.filter(date => date > fiveMinutesAgo);
    
    // Check if threshold exceeded
    if (this.recentFailures.length >= this.failureThreshold) {
      this.sendAlert({
        type: 'threshold',
        queue: 'email',
        message: `High failure rate detected: ${this.recentFailures.length} failures in the last 5 minutes`,
        details: {
          failureCount: this.recentFailures.length,
          threshold: this.failureThreshold,
          recentFailures: this.recentFailures.map(d => d.toISOString()),
        },
        timestamp: new Date(),
      });
      
      // Reset to prevent spam
      this.recentFailures = [];
    }
  }
  
  /**
   * Get queue health metrics
   */
  async getQueueHealth(): Promise<{
    queue: string;
    status: 'healthy' | 'unhealthy';
    metrics: {
      waiting: number;
      active: number;
      completed: number;
      failed: number;
      delayed: number;
      paused: number;
    };
    timestamp: Date;
  }> {
    if (!this.emailQueue) {
      // Try to get the queue if not already initialized
      this.emailQueue = await getEmailQueueForShutdown();
    }
    
    if (!this.emailQueue) {
      return {
        queue: 'email',
        status: 'unhealthy' as const,
        metrics: {
          waiting: 0,
          active: 0,
          completed: 0,
          failed: 0,
          delayed: 0,
          paused: 0,
        },
        timestamp: new Date(),
      };
    }
    
    const [waiting, active, completed, failed, delayed, paused] = await Promise.all([
      this.emailQueue.getWaitingCount(),
      this.emailQueue.getActiveCount(),
      this.emailQueue.getCompletedCount(),
      this.emailQueue.getFailedCount(),
      this.emailQueue.getDelayedCount(),
      this.emailQueue.getPausedCount(),
    ]);
    
    return {
      queue: 'email',
      status: this.emailQueue.client.status === 'ready' ? 'healthy' : 'unhealthy',
      metrics: {
        waiting,
        active,
        completed,
        failed,
        delayed,
        paused,
      },
      timestamp: new Date(),
    };
  }
}

// Create singleton instance
export const queueMonitoring = new QueueMonitoring();

// Example alert handlers that can be configured
export const alertHandlers = {
  // Log to console (already done by default)
  console: (alert: QueueAlert) => {
    console.error(`[ALERT] ${alert.type}:`, alert.message, alert.details);
  },
  
  // Send to monitoring service (e.g., Sentry, DataDog)
  monitoring: (_alert: QueueAlert) => {
    // Example: Sentry integration
    if (process.env.SENTRY_DSN) {
      // Sentry.captureMessage(alert.message, {
      //   level: 'error',
      //   tags: { queue: alert.queue, type: alert.type },
      //   extra: alert.details,
      // });
    }
  },
  
  // Send Slack notification
  slack: async (alert: QueueAlert) => {
    if (process.env.SLACK_WEBHOOK_URL) {
      try {
        await fetch(process.env.SLACK_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `🚨 Queue Alert: ${alert.type}`,
            attachments: [{
              color: 'danger',
              title: alert.message,
              fields: [
                { title: 'Queue', value: alert.queue, short: true },
                { title: 'Time', value: alert.timestamp.toISOString(), short: true },
              ],
              footer: 'Queue Monitoring',
            }],
          }),
        });
      } catch (error) {
        console.error('[QueueMonitoring] Failed to send Slack alert:', error);
      }
    }
  },
  
  // Send email notification (be careful not to create loops!)
  email: (alert: QueueAlert) => {
    // Only send email alerts for critical issues, not individual job failures
    if (alert.type === 'threshold' || alert.type === 'error') {
      if (process.env.ALERT_EMAIL) {
        // Use a different email service or direct SMTP to avoid queue dependency
        console.error(`[QueueMonitoring] Would send email alert to ${process.env.ALERT_EMAIL}`);
      }
    }
  },
};