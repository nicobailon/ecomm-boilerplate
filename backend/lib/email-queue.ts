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
const createEmailQueue = (): Bull.Queue<EmailJob> | null => {
  if (!process.env.UPSTASH_REDIS_URL) {
    console.warn('[EmailQueue] UPSTASH_REDIS_URL not configured - email queue disabled, emails will be sent synchronously');
    return null;
  }

  try {
    // Parse the Redis URL to extract connection details
    const redisUrl = new URL(process.env.UPSTASH_REDIS_URL);
    
    // Create Bull-compatible Redis configuration
    const bullRedisConfig = {
      host: redisUrl.hostname,
      port: parseInt(redisUrl.port ?? '6379', 10),
      password: redisUrl.password,
      username: redisUrl.username ?? 'default',
      tls: redisUrl.protocol === 'rediss:' ? {} : undefined,
      // Bull-compatible settings
      connectTimeout: 15000, // 15 second connection timeout for TLS
      commandTimeout: 15000, // Increased to 15 seconds for TLS latency
      lazyConnect: false, // Bull works better with immediate connection
      // Connection management optimized for Bull + Upstash
      keepAlive: 30000, // Send keep-alive packets every 30 seconds
      noDelay: true, // Disable Nagle's algorithm for lower latency
      family: 4, // Force IPv4 for better Upstash compatibility
      connectionName: 'ecommerce-email-queue', // Identify connection in Redis
      // Bull-specific requirements
      enableReadyCheck: false, // Bull requires this to be false
      maxRetriesPerRequest: null, // Bull requires this to be null
      enableOfflineQueue: true, // Enable for Bull compatibility
      // Retry strategy optimized for Upstash TLS
      retryStrategy: (times: number) => {
        if (times > 6) {
          console.error('[EmailQueue] Max Redis connection retries reached, giving up');
          return null;
        }
        const delay = Math.min(times * 3000, 30000); // 3s, 6s, 9s, 12s, 15s, 18s
        console.warn(`[EmailQueue] Redis connection retry #${times}, waiting ${delay}ms`);
        return delay;
      },
      reconnectOnError: (err: Error) => {
        const targetErrors = ['READONLY', 'ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNREFUSED'];
        const shouldReconnect = targetErrors.some(e => err.message.includes(e));
        if (shouldReconnect) {
          console.warn(`[EmailQueue] Reconnecting due to error: ${err.message}`);
        }
        return shouldReconnect;
      },
    };

    const queue = new Bull<EmailJob>('email', {
      redis: bullRedisConfig,
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
    
    // Enhanced Redis connection health monitoring
    queue.on('error', (error) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[EmailQueue] Redis connection error:', {
        error: errorMessage,
        redisUrl: process.env.UPSTASH_REDIS_URL?.replace(/:[^:@]+@/, ':***@'), // Hide password
        timestamp: new Date().toISOString(),
        queueStatus: queue.client?.status || 'unknown',
      });

      // Only mark unhealthy for connection-related errors, not command timeouts
      const connectionErrors = ['ECONNRESET', 'ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT'];
      const isConnectionError = connectionErrors.some(e => errorMessage.includes(e));

      if (isConnectionError) {
        isRedisHealthy = false;

        // Implement circuit breaker pattern - pause queue after connection failures
        if (connectionTimeout) {
          clearTimeout(connectionTimeout);
        }

        // Wait 60 seconds before allowing new connection attempts
        connectionTimeout = setTimeout(() => {
          console.error('[EmailQueue] Re-enabling Redis health check after cooldown period');
          isRedisHealthy = true;
          connectionTimeout = null;
        }, 60000);
      } else {
        // For command timeouts, log but don't trigger circuit breaker
        console.warn('[EmailQueue] Redis command timeout (not triggering circuit breaker):', {
          error: errorMessage,
          timestamp: new Date().toISOString(),
        });
      }
    });

    queue.on('ready', () => {
      console.error('[EmailQueue] Successfully connected to Redis');
      isRedisHealthy = true;

      // Clear any existing circuit breaker timeout
      if (connectionTimeout) {
        clearTimeout(connectionTimeout);
        connectionTimeout = null;
      }
    });

    // Add connection close monitoring
    queue.on('close', () => {
      console.warn('[EmailQueue] Redis connection closed');
    });

    // Add reconnecting event monitoring
    queue.on('reconnecting', (delay: number) => {
      console.error(`[EmailQueue] Reconnecting to Redis in ${delay}ms`);
    });
    
    // Set up job processing with enhanced error handling
    void queue.process(async (job) => {
      if (!isEmailEnabled()) {
        console.warn('[EmailQueue] Email sending is disabled, skipping job:', {
          jobId: job.id,
          type: job.data.type,
          emailEnabled: false,
        });
        return;
      }

      const { type, data } = job.data;

      console.error('[EmailQueue] Processing email job:', {
        jobId: job.id,
        type,
        timestamp: new Date().toISOString(),
      });

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
  emailQueue = createEmailQueue();
  queueInitPromise = Promise.resolve(emailQueue);
  
  return emailQueue;
};

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
  
  // Enhanced fallback logic with better error handling
  if (!queue || !isRedisHealthy) {
    const reason = !queue ? 'Queue not initialized' : 'Redis unhealthy';
    console.warn('[EmailQueue] Queue unavailable, falling back to direct send:', {
      type,
      reason,
      fallbackMethod: 'direct-send',
      timestamp: new Date().toISOString(),
    });

    try {
      await sendEmailDirectly(type, data);
      console.error('[EmailQueue] Direct send fallback successful:', {
        type,
        method: 'direct-send',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('[EmailQueue] Direct send fallback failed:', {
        type,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        nextAction: 'Email will not be sent',
        timestamp: new Date().toISOString(),
      });
      // Re-throw error for proper error handling upstream
      throw error;
    }
    return;
  }
  
  // Normal queue operation with enhanced error handling and retry logic
  try {
    const job = await queue.add({ type, data }, {
      attempts: 2, // Increased attempts for better reliability
      removeOnComplete: true,
      removeOnFail: true,
      // Add job-specific timeout
      timeout: 30000, // 30 second job timeout
    });

    console.error('[EmailQueue] Successfully queued email:', {
      jobId: job.id,
      type,
      queueSize: await queue.count(),
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn('[EmailQueue] Queue operation failed, using direct send fallback:', {
      type,
      error: errorMessage,
      fallbackMethod: 'direct-send',
      timestamp: new Date().toISOString(),
    });

    // Check if this is a Redis connection issue
    const connectionErrors = ['ECONNRESET', 'ETIMEDOUT', 'ECONNREFUSED', 'Command timed out'];
    const isConnectionError = connectionErrors.some(e => errorMessage.includes(e));

    if (isConnectionError) {
      console.warn('[EmailQueue] Redis connection issue detected, marking unhealthy');
      isRedisHealthy = false;
    }

    // Immediate fallback to direct send
    try {
      await sendEmailDirectly(type, data);
      console.error('[EmailQueue] Direct send fallback successful:', {
        type,
        method: 'direct-send',
        timestamp: new Date().toISOString(),
      });
    } catch (fallbackError) {
      console.error('[EmailQueue] All email send attempts failed:', {
        type,
        primaryError: errorMessage,
        fallbackError: fallbackError instanceof Error ? fallbackError.message : fallbackError,
        result: 'Email will not be sent',
        timestamp: new Date().toISOString(),
      });
      // Re-throw the original error for proper error handling
      throw error;
    }
  }
};

// Export a function to get the queue for server shutdown handling
export const getEmailQueueForShutdown = (): Bull.Queue<EmailJob> | null => {
  // Don't create a new queue if it doesn't exist
  return emailQueue;
};

// Enhanced shutdown function with proper connection cleanup
export const shutdownEmailQueue = async (): Promise<void> => {
  if (!emailQueue) {
    console.error('[EmailQueue] No queue to shutdown');
    return;
  }

  try {
    console.error('[EmailQueue] Starting graceful shutdown...');

    // Clear any circuit breaker timeout
    if (connectionTimeout) {
      clearTimeout(connectionTimeout);
      connectionTimeout = null;
    }

    // Wait for active jobs to complete (with timeout)
    const activeJobs = await emailQueue.getActive();
    if (activeJobs.length > 0) {
      console.error(`[EmailQueue] Waiting for ${activeJobs.length} active jobs to complete...`);

      // Wait up to 30 seconds for jobs to complete
      const maxWaitTime = 30000;
      const startTime = Date.now();

      while ((await emailQueue.getActive()).length > 0 && (Date.now() - startTime) < maxWaitTime) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const remainingJobs = await emailQueue.getActive();
      if (remainingJobs.length > 0) {
        console.warn(`[EmailQueue] ${remainingJobs.length} jobs still active after timeout, forcing shutdown`);
      }
    }

    // Close the queue and its Redis connections
    await emailQueue.close();
    console.error('[EmailQueue] Queue closed successfully');

    // Reset state
    emailQueue = null;
    queueInitPromise = null;
    isRedisHealthy = true;

  } catch (error) {
    console.error('[EmailQueue] Error during shutdown:', {
      error: error instanceof Error ? error.message : error,
      timestamp: new Date().toISOString(),
    });
  }
};