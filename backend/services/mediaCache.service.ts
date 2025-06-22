import { redis } from '../lib/redis.js';

export class MediaCacheService {
  private static readonly CACHE_PREFIX = 'media:';
  private static readonly TTL = 3600; // 1 hour
  
  static async getCachedMedia(productId: string): Promise<any | null> {
    try {
      const cached = await redis.get(`${this.CACHE_PREFIX}${productId}`);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }
  
  static async setCachedMedia(productId: string, mediaGallery: any[]): Promise<void> {
    try {
      await redis.setex(
        `${this.CACHE_PREFIX}${productId}`,
        this.TTL,
        JSON.stringify(mediaGallery)
      );
    } catch (error) {
      console.error('Redis set error:', error);
    }
  }
  
  static async invalidateMediaCache(productId: string): Promise<void> {
    try {
      await redis.del(`${this.CACHE_PREFIX}${productId}`);
    } catch (error) {
      console.error('Redis del error:', error);
    }
  }
  
  static async invalidateAllMediaCache(): Promise<void> {
    try {
      const keys = await redis.keys(`${this.CACHE_PREFIX}*`);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.error('Redis keys/del error:', error);
    }
  }
}