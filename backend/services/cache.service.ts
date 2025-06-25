import { redis } from '../lib/redis.js';
import { withRedisHealth, RedisHealthService } from '../lib/redis-health.js';
import { defaultLogger as logger } from '../utils/logger.js';

export class CacheService {
  // In-memory fallback cache for when Redis is unavailable
  private memoryCache = new Map<string, { value: string; expires: number }>();
  private readonly maxMemoryCacheSize = 100; // Limit memory cache size
  private cleanupInterval: NodeJS.Timeout | null = null;
  
  async get<T>(key: string): Promise<T | null> {
    return withRedisHealth(
      async () => {
        const data = await redis.get(key);
        return data ? JSON.parse(data) as T : null;
      },
      () => {
        // Fallback to memory cache
        const cached = this.memoryCache.get(key);
        if (cached && cached.expires > Date.now()) {
          logger.debug(`[Cache] Memory cache hit for key: ${key}`);
          return JSON.parse(cached.value) as T;
        }
        // Clean up expired entry
        if (cached) {
          this.memoryCache.delete(key);
        }
        return null;
      },
      `Cache get: ${key}`,
    );
  }

  async set(key: string, value: unknown, ttl = 3600): Promise<void> {
    await withRedisHealth(
      async () => {
        await redis.set(key, JSON.stringify(value), 'EX', ttl);
      },
      () => {
        // Fallback to memory cache
        if (!RedisHealthService.isRedisHealthy()) {
          // Enforce size limit
          if (this.memoryCache.size >= this.maxMemoryCacheSize) {
            // Remove oldest entries (simple FIFO)
            const firstKey = this.memoryCache.keys().next().value;
            if (firstKey) {
              this.memoryCache.delete(firstKey);
            }
          }
          
          this.memoryCache.set(key, {
            value: JSON.stringify(value),
            expires: Date.now() + (ttl * 1000),
          });
          logger.debug(`[Cache] Stored in memory cache: ${key}`);
        }
      },
      `Cache set: ${key}`,
    );
  }

  async del(key: string): Promise<void> {
    await withRedisHealth(
      async () => {
        await redis.del(key);
      },
      () => {
        // Also remove from memory cache
        this.memoryCache.delete(key);
        logger.debug(`[Cache] Deleted from memory cache: ${key}`);
      },
      `Cache delete: ${key}`,
    );
  }

  async flush(): Promise<void> {
    await withRedisHealth(
      async () => {
        await redis.flushall();
      },
      () => {
        // Clear memory cache as fallback
        this.memoryCache.clear();
        logger.warn('[Cache] Flushed memory cache (Redis unavailable)');
      },
      'Cache flush',
    );
  }
  
  // Cleanup expired entries from memory cache periodically
  startMemoryCacheCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      let cleaned = 0;
      
      for (const [key, entry] of this.memoryCache.entries()) {
        if (entry.expires <= now) {
          this.memoryCache.delete(key);
          cleaned++;
        }
      }
      
      if (cleaned > 0) {
        logger.debug(`[Cache] Cleaned ${cleaned} expired entries from memory cache`);
      }
    }, 60000); // Run every minute
  }
  
  stopMemoryCacheCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}
