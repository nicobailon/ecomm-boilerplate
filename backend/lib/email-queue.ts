import Bull from 'bull';
import { emailService, IPopulatedOrderDocument } from '../services/email.service.js';
import { isEmailEnabled } from './resend.js';
import type { IUserDocument } from '../models/user.model.js';

export interface EmailJob {
  type: 'orderConfirmation' | 'welcomeEmail' | 'passwordReset' | 'emailVerification';
  data: {
    order?: IPopulatedOrderDocument;
    user?: IUserDocument;
    resetToken?: string;
    verificationToken?: string;
    email?: string;
  };
}

// Track if Redis connection is healthy
let isRedisHealthy = true;
let emailQueue: Bull.Queue<EmailJob> | null = null;
let queueInitPromise: Promise<Bull.Queue<EmailJob> | null> | null = null;
let connectionTimeout: NodeJS.Timeout | null = null;

// Function to create the queue (lazy initialization)
const createEmailQueue = async (): Promise<Bull.Queue<EmailJob> | null> => {
  if (!process.env.UPSTASH_REDIS_URL) {
    console.warn('[EmailQueue] UPSTASH_REDIS_URL not configured - email queue disabled, emails will be sent synchronously');
    return null;
  }

  try {
    // Parse the Redis URL to extract connection details
    const redisUrl = new URL(process.env.UPSTASH_REDIS_URL);
    
    const queue = new Bull<EmailJob>('email', {
      redis: {
        host: redisUrl.hostname,
        port: parseInt(redisUrl.port ?? '6379', 10),
        password: redisUrl.password,
        username: redisUrl.username ?? 'default',
        tls: redisUrl.protocol === 'rediss:' ? {} : undefined,
        maxRetriesPerRequest: 3,
        connectTimeout: 10000, // 10 second connection timeout
        commandTimeout: 5000, // 5 second command timeout
        retryStrategy: (times: number) => {
          // Stop retrying after 10 attempts
          if (times > 10) {
            console.error('[EmailQueue] Max Redis connection retries reached, giving up');
            return null;
          }
          // Exponential backoff with max delay of 30 seconds
          const delay = Math.min(times * 1000, 30000);
          console.error(`[EmailQueue] Redis connection retry #${times}, waiting ${delay}ms`);
          return delay;
        },
        reconnectOnError: (err: Error) => {
          const targetErrors = ['READONLY', 'ECONNRESET', 'ETIMEDOUT'];
          if (targetErrors.some(e => err.message.includes(e))) {
            // Only reconnect for specific errors
            return true;
          }
          return false;
        },
        enableOfflineQueue: false, // Don't queue commands when offline
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    });
    
    // Monitor Redis connection health
    queue.on('error', (error) => {
      console.error('[EmailQueue] Redis connection error:', {
        error: error instanceof Error ? error.message : error,
        redisUrl: process.env.UPSTASH_REDIS_URL?.replace(/:[^:@]+@/, ':***@'), // Hide password
        timestamp: new Date().toISOString(),
      });
      isRedisHealthy = false;
      
      // Implement circuit breaker pattern - pause queue after multiple failures
      if (connectionTimeout) {
        clearTimeout(connectionTimeout);
      }
      
      // Wait 60 seconds before allowing new connection attempts
      connectionTimeout = setTimeout(() => {
        console.error('[EmailQueue] Re-enabling Redis health check after cooldown period');
        isRedisHealthy = true;
        connectionTimeout = null;
      }, 60000);
    });
    
    queue.on('ready', () => {
      console.error('[EmailQueue] Successfully connected to Redis');
      isRedisHealthy = true;
    });
    
    // Set up job processing
    void queue.process(async (job) => {
      if (!isEmailEnabled()) {
        console.error('[EmailQueue] Email sending is disabled, skipping job:', {
          jobId: job.id,
          type: job.data.type,
          emailEnabled: false,
        });
        return;
      }

      const { type, data } = job.data;

      try {
        switch (type) {
          case 'orderConfirmation':
            if (data.order && data.user) {
              await emailService.sendOrderConfirmation(data.order, data.user);
            }
            break;

          case 'welcomeEmail':
            if (data.user) {
              await emailService.sendWelcomeEmail(data.user);
            }
            break;

          case 'passwordReset':
            if (data.user && data.resetToken) {
              await emailService.sendPasswordResetEmail(data.user, data.resetToken);
            }
            break;

          case 'emailVerification':
            if (data.user && data.verificationToken) {
              await emailService.sendEmailVerification(data.user, data.verificationToken);
            }
            break;

          default:
            console.error('Unknown email job type:', type);
        }
      } catch (error) {
        console.error('[EmailQueue] Failed to process email job:', {
          jobId: job.id,
          type,
          attempt: job.attemptsMade + 1,
          maxAttempts: job.opts.attempts,
          error: error instanceof Error ? error.message : error,
          stack: error instanceof Error ? error.stack : undefined,
        });
        throw error;
      }
    });

    queue.on('completed', (job) => {
      console.error('[EmailQueue] Email job completed successfully:', {
        jobId: job.id,
        type: job.data.type,
        processingTime: job.finishedOn && job.processedOn ? job.finishedOn - job.processedOn : 'unknown',
      });
    });

    queue.on('failed', (job, err) => {
      console.error('[EmailQueue] Email job failed after all attempts:', {
        jobId: job?.id,
        type: job?.data?.type,
        attempts: job?.attemptsMade,
        error: err instanceof Error ? err.message : err,
        willRetry: false,
      });
    });

    queue.on('stalled', (job) => {
      console.warn('[EmailQueue] Email job stalled:', {
        jobId: job?.id,
        type: job?.data?.type,
        details: 'Job did not report progress within expected time',
      });
    });
    
    return queue;
  } catch (error) {
    console.error('[EmailQueue] Failed to initialize Bull queue:', {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return null;
  }
};

// Function to get or create the queue
const getEmailQueue = async (): Promise<Bull.Queue<EmailJob> | null> => {
  if (emailQueue) {
    return emailQueue;
  }
  
  // If already initializing, wait for it
  if (queueInitPromise) {
    return queueInitPromise;
  }
  
  // Start initialization
  queueInitPromise = createEmailQueue();
  emailQueue = await queueInitPromise;
  
  return emailQueue;
}

// Helper function to send email directly (used for fallback)
const sendEmailDirectly = async (type: EmailJob['type'], data: EmailJob['data']): Promise<void> => {
  switch (type) {
    case 'orderConfirmation':
      if (data.order && data.user) {
        await emailService.sendOrderConfirmation(data.order, data.user);
      }
      break;
    case 'welcomeEmail':
      if (data.user) {
        await emailService.sendWelcomeEmail(data.user);
      }
      break;
    case 'passwordReset':
      if (data.user && data.resetToken) {
        await emailService.sendPasswordResetEmail(data.user, data.resetToken);
      }
      break;
    case 'emailVerification':
      if (data.user && data.verificationToken) {
        await emailService.sendEmailVerification(data.user, data.verificationToken);
      }
      break;
  }
};

/**
 * Queue an email for asynchronous processing.
 * Falls back to direct sending if queue is unavailable.
 */
export const queueEmail = async (type: EmailJob['type'], data: EmailJob['data']): Promise<void> => {
  // Try to get or create the queue
  const queue = await getEmailQueue();
  
  // If queue is not available or Redis is unhealthy, fall back to direct sending
  if (!queue || !isRedisHealthy) {
    console.warn('[EmailQueue] Queue unavailable, falling back to direct send:', {
      type,
      reason: !queue ? 'Queue not initialized' : 'Redis unhealthy',
      fallbackMethod: 'direct-send',
    });
    
    try {
      await sendEmailDirectly(type, data);
    } catch (error) {
      console.error('[EmailQueue] Direct send fallback failed:', {
        type,
        error: error instanceof Error ? error.message : error,
        nextAction: 'Email will not be sent',
      });
    }
    return;
  }
  
  // Normal queue operation
  try {
    const job = await queue.add({ type, data });
    console.error('[EmailQueue] Successfully queued email:', {
      jobId: job.id,
      type,
      queueSize: await queue.count(),
    });
  } catch (error) {
    console.error('[EmailQueue] Failed to queue email:', {
      type,
      error: error instanceof Error ? error.message : error,
      action: 'Attempting direct send fallback',
    });
    
    // Try direct send as last resort
    console.warn('[EmailQueue] Queue operation failed, attempting direct send as last resort:', {
      type,
      reason: 'Queue add operation failed',
    });
    try {
      await sendEmailDirectly(type, data);
    } catch (fallbackError) {
      console.error('[EmailQueue] All email send attempts failed:', {
        type,
        primaryError: error instanceof Error ? error.message : error,
        fallbackError: fallbackError instanceof Error ? fallbackError.message : fallbackError,
        result: 'Email will not be sent',
      });
    }
  }
};

// Export a function to get the queue for server shutdown handling
export const getEmailQueueForShutdown = async (): Promise<Bull.Queue<EmailJob> | null> => {
  // Don't create a new queue if it doesn't exist
  return emailQueue;
};