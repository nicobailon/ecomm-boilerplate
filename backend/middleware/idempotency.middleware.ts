import { Request, Response, NextFunction } from 'express';
import { CacheService } from '../services/cache.service.js';
import { defaultLogger as logger } from '../utils/logger.js';

const cacheService = new CacheService();
const IDEMPOTENCY_TTL = 24 * 60 * 60; // 24 hours in seconds
const IDEMPOTENCY_KEY_PREFIX = 'idempotency:';

interface IdempotencyResponse {
  statusCode: number;
  body: unknown;
  headers: Record<string, string>;
}

export const idempotencyMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const idempotencyKey = req.headers['idempotency-key'] as string;
  
  if (!idempotencyKey) {
    // No idempotency key provided, proceed normally
    return next();
  }
  
  // Use only the idempotency key for caching (simpler approach)
  // This allows clients to manage one key per operation without worrying about exact request details
  const cacheKey = `${IDEMPOTENCY_KEY_PREFIX}${idempotencyKey}`;
  
  try {
    // Check if we have a cached response for this idempotency key
    const cachedResponse = await cacheService.get<IdempotencyResponse>(cacheKey);
    
    if (cachedResponse) {
      logger.info('[Idempotency] Returning cached response', {
        idempotencyKey,
        method: req.method,
        path: req.originalUrl,
      });
      
      // Set the cached headers
      Object.entries(cachedResponse.headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });
      
      // Return the cached response
      res.status(cachedResponse.statusCode).json(cachedResponse.body);
      return;
    }
    
    // No cached response, proceed with the request
    // Override res.json to cache the response
    const originalJson = res.json.bind(res);
    
    res.json = function(body: unknown): Response {
      // Only cache successful responses (2xx status codes)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const responseToCache: IdempotencyResponse = {
          statusCode: res.statusCode,
          body,
          headers: {
            'Content-Type': 'application/json',
            'X-Idempotency-Key': idempotencyKey,
            'X-Idempotent-Replayed': 'false',
          },
        };
        
        // Cache the response asynchronously
        cacheService.set(cacheKey, responseToCache, IDEMPOTENCY_TTL)
          .then(() => {
            logger.debug('[Idempotency] Response cached', {
              idempotencyKey,
              method: req.method,
              path: req.originalUrl,
              ttl: IDEMPOTENCY_TTL,
            });
          })
          .catch((error) => {
            logger.error('[Idempotency] Failed to cache response', {
              idempotencyKey,
              error: (error as Error).message,
            });
          });
        
        // Add header to indicate this is the original response
        res.setHeader('X-Idempotent-Replayed', 'false');
      }
      
      return originalJson(body);
    };
    
    next();
  } catch (error) {
    logger.error('[Idempotency] Middleware error', {
      idempotencyKey,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    // If there's an error with the idempotency logic, proceed with the request
    next();
  }
};