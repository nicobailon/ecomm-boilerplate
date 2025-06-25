import { defaultLogger as logger } from '../utils/logger.js';

/**
 * Centralized Redis Health Service
 * Manages Redis connection health state across all Redis clients
 */
export class RedisHealthService {
  private static isHealthy = true;
  private static cooldownTimeout: NodeJS.Timeout | null = null;
  private static lastError: string | null = null;
  private static lastErrorTime: Date | null = null;
  private static errorCount = 0;
  private static readonly MAX_ERROR_COUNT = 5;
  private static readonly COOLDOWN_PERIOD = 60000; // 60 seconds
  
  /**
   * Mark Redis as unhealthy and start cooldown period
   */
  static markUnhealthy(error?: string): void {
    this.isHealthy = false;
    this.errorCount++;
    this.lastError = error ?? 'Unknown error';
    this.lastErrorTime = new Date();
    
    logger.error('[RedisHealth] Marked as unhealthy', {
      error: this.lastError,
      errorCount: this.errorCount,
      timestamp: this.lastErrorTime.toISOString(),
    });
    
    // Clear existing cooldown if any
    if (this.cooldownTimeout) {
      clearTimeout(this.cooldownTimeout);
    }
    
    // Start cooldown period
    this.cooldownTimeout = setTimeout(() => {
      logger.info('[RedisHealth] Cooldown period ended, marking as healthy');
      this.isHealthy = true;
      this.errorCount = 0;
      this.cooldownTimeout = null;
    }, this.COOLDOWN_PERIOD);
  }
  
  /**
   * Mark Redis as healthy
   */
  static markHealthy(): void {
    if (!this.isHealthy) {
      logger.info('[RedisHealth] Connection restored');
    }
    this.isHealthy = true;
    this.errorCount = 0;
    
    // Clear cooldown timeout if any
    if (this.cooldownTimeout) {
      clearTimeout(this.cooldownTimeout);
      this.cooldownTimeout = null;
    }
  }
  
  /**
   * Check if Redis is currently healthy
   */
  static isRedisHealthy(): boolean {
    return this.isHealthy;
  }
  
  /**
   * Check if we should attempt to reconnect
   * Returns false if we've exceeded max errors
   */
  static shouldAttemptReconnect(): boolean {
    return this.errorCount < this.MAX_ERROR_COUNT;
  }
  
  /**
   * Get current health status details
   */
  static getHealthStatus(): {
    healthy: boolean;
    errorCount: number;
    lastError: string | null;
    lastErrorTime: Date | null;
    inCooldown: boolean;
  } {
    return {
      healthy: this.isHealthy,
      errorCount: this.errorCount,
      lastError: this.lastError,
      lastErrorTime: this.lastErrorTime,
      inCooldown: this.cooldownTimeout !== null,
    };
  }
  
  /**
   * Reset all health tracking
   */
  static reset(): void {
    this.isHealthy = true;
    this.errorCount = 0;
    this.lastError = null;
    this.lastErrorTime = null;
    
    if (this.cooldownTimeout) {
      clearTimeout(this.cooldownTimeout);
      this.cooldownTimeout = null;
    }
  }
}

/**
 * Wrapper function for Redis operations with health checking
 */
export async function withRedisHealth<T>(
  operation: () => Promise<T>,
  fallback?: () => T | Promise<T>,
  operationName = 'Redis operation',
): Promise<T | null> {
  if (!RedisHealthService.isRedisHealthy()) {
    logger.warn(`[RedisHealth] Skipping ${operationName} - Redis is unhealthy`);
    if (fallback) {
      return fallback();
    }
    return null;
  }
  
  try {
    const result = await operation();
    // Mark as healthy on successful operation
    RedisHealthService.markHealthy();
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error(`[RedisHealth] ${operationName} failed:`, errorMessage);

    // Mark as unhealthy if it's a connection error
    if (errorMessage.includes('ECONNRESET') ??
        errorMessage.includes('ETIMEDOUT') ??
        errorMessage.includes('ECONNREFUSED')) {
      RedisHealthService.markUnhealthy(errorMessage);
    }

    if (fallback) {
      logger.info(`[RedisHealth] Using fallback for ${operationName}`);
      return fallback();
    }

    return null;
  }
}