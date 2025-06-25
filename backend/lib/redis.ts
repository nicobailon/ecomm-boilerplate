import { Redis } from 'ioredis';
import { config } from 'dotenv';
import { defaultLogger as logger } from '../utils/logger.js';
import { RedisHealthService } from './redis-health.js';

config();

const redisUrl = process.env.UPSTASH_REDIS_URL;
if (!redisUrl) {
  throw new Error('UPSTASH_REDIS_URL is not defined in environment variables');
}

// Parse Redis URL to extract connection details
const parsedUrl = new URL(redisUrl);

// Export health check function for backward compatibility
export const isRedisHealthy = (): boolean => RedisHealthService.isRedisHealthy();

// Create Redis client with advanced configuration matching EmailQueue
export const redis = new Redis({
  host: parsedUrl.hostname,
  port: parseInt(parsedUrl.port ?? '6379', 10),
  password: parsedUrl.password,
  username: parsedUrl.username ?? 'default',
  tls: parsedUrl.protocol === 'rediss:' ? {} : undefined,
  maxRetriesPerRequest: 1, // Reduce retries for faster failover
  connectTimeout: 5000, // 5 second connection timeout
  commandTimeout: 3000, // 3 second command timeout
  retryStrategy: (times: number) => {
    // Stop retrying after 10 attempts
    if (times > 10) {
      logger.error('[Redis] Max connection retries reached, giving up');
      return null;
    }
    // Exponential backoff with max delay of 30 seconds
    const delay = Math.min(times * 1000, 30000);
    logger.info(`[Redis] Connection retry #${times}, waiting ${delay}ms`);
    return delay;
  },
  reconnectOnError: (err: Error) => {
    const targetErrors = ['READONLY', 'ECONNRESET', 'ETIMEDOUT'];
    const shouldReconnect = targetErrors.some(e => err.message.includes(e));
    if (!shouldReconnect) {
      logger.error('[Redis] Non-recoverable error:', err.message);
    }
    return shouldReconnect;
  },
  enableOfflineQueue: true, // Allow queuing commands when offline for graceful degradation
  // Connection pooling optimizations
  enableReadyCheck: true, // Wait for Redis to be ready before sending commands
  lazyConnect: false, // Connect immediately
  keepAlive: 30000, // Send keep-alive packets every 30 seconds
  noDelay: true, // Disable Nagle's algorithm for lower latency
  // Upstash-specific optimizations
  connectionName: 'ecommerce-main', // Identify connection in Redis
  autoResubscribe: false, // Don't auto-resubscribe (we handle this manually)
  autoResendUnfulfilledCommands: false, // Don't resend commands after reconnect
});

// Monitor Redis connection health
redis.on('error', (error) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  logger.error('[Redis] Connection error:', {
    error: errorMessage,
    timestamp: new Date().toISOString(),
  });
  RedisHealthService.markUnhealthy(errorMessage);
});

redis.on('ready', () => {
  logger.info('[Redis] Successfully connected');
  RedisHealthService.markHealthy();
});

redis.on('close', () => {
  logger.warn('[Redis] Connection closed');
});

redis.on('reconnecting', (delay: number) => {
  logger.info(`[Redis] Reconnecting in ${delay}ms`);
});