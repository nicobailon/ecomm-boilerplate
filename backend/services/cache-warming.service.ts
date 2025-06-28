import { productService } from './product.service.js';
import { defaultLogger as logger } from '../utils/logger.js';
import { CacheService } from './cache.service.js';
import { CACHE_KEYS, CACHE_TTL } from '../constants/cache-config.js';

export class CacheWarmingService {
  private cacheService: CacheService;

  constructor() {
    this.cacheService = new CacheService();
  }

  async warmAllCaches(): Promise<void> {
    logger.info('[CacheWarming] Starting cache warming process...');
    
    try {
      await Promise.all([
        this.warmFeaturedProducts(),
      ]);
      
      logger.info('[CacheWarming] Cache warming completed successfully');
    } catch (error) {
      logger.error('[CacheWarming] Error during cache warming:', error);
    }
  }

  private async warmFeaturedProducts(): Promise<void> {
    try {
      logger.info('[CacheWarming] Warming featured products cache...');
      
      const featuredProducts = await productService.getFeaturedProducts(true);
      
      await this.cacheService.set(
        CACHE_KEYS.FEATURED_PRODUCTS,
        featuredProducts,
        CACHE_TTL.FEATURED_PRODUCTS
      );
      
      logger.info(`[CacheWarming] Cached ${featuredProducts.length} featured products`);
    } catch (error) {
      logger.error('[CacheWarming] Error warming featured products cache:', error);
      throw error;
    }
  }
}

export const cacheWarmingService = new CacheWarmingService();