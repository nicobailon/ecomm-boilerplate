import { redis } from '../lib/redis.js';
import { withRedisHealth } from '../lib/redis-health.js';
import { IMediaItem } from '../types/media.types.js';
import { defaultLogger as logger } from '../utils/logger.js';

export class MediaCacheService {
  private static readonly CACHE_PREFIX = 'media:';
  private static readonly TTL = 3600; // 1 hour
  
  static async getCachedMedia(productId: string): Promise<IMediaItem[] | null> {
    return withRedisHealth(
      async () => {
        const cached = await redis.get(`${this.CACHE_PREFIX}${productId}`);
        return cached ? JSON.parse(cached) as IMediaItem[] : null;
      },
      () => {
        logger.debug(`[MediaCache] Redis unavailable, returning null for product: ${productId}`);
        return null;
      },
      `Media cache get: ${productId}`,
    );
  }
  
  static async setCachedMedia(productId: string, mediaGallery: IMediaItem[]): Promise<void> {
    await withRedisHealth(
      async () => {
        await redis.setex(
          `${this.CACHE_PREFIX}${productId}`,
          this.TTL,
          JSON.stringify(mediaGallery),
        );
      },
      () => {
        logger.debug(`[MediaCache] Redis unavailable, skipping cache set for product: ${productId}`);
      },
      `Media cache set: ${productId}`,
    );
  }
  
  static async invalidateMediaCache(productId: string): Promise<void> {
    await withRedisHealth(
      async () => {
        await redis.del(`${this.CACHE_PREFIX}${productId}`);
      },
      () => {
        logger.debug(`[MediaCache] Redis unavailable, skipping cache invalidation for product: ${productId}`);
      },
      `Media cache invalidate: ${productId}`,
    );
  }
  
  static async invalidateAllMediaCache(): Promise<void> {
    await withRedisHealth(
      async () => {
        const keys = await redis.keys(`${this.CACHE_PREFIX}*`);
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      },
      () => {
        logger.debug('[MediaCache] Redis unavailable, skipping bulk cache invalidation');
      },
      'Media cache bulk invalidate',
    );
  }
}