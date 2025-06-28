import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { inventoryService } from '../services/inventory.service.js';
import { AppError, InventoryError } from '../utils/AppError.js';
import { createLogger } from '../utils/logger.js';
import { AuthRequest } from '../types/express.js';

const logger = createLogger({ service: 'InventoryValidationMiddleware' });

const checkoutProductsSchema = z.array(
  z.object({
    _id: z.string(),
    quantity: z.number().positive().int(),
    variantId: z.string().optional(),
  })
);

export async function validateInventoryPreCheckout(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { products } = req.body;
    
    // Validate request body
    const validationResult = checkoutProductsSchema.safeParse(products);
    if (!validationResult.success) {
      throw new AppError('Invalid product data', 400);
    }

    const validProducts = validationResult.data;
    const inventoryIssues: Array<{
      productId: string;
      variantId?: string;
      requestedQuantity: number;
      availableStock: number;
      productName?: string;
      variantDetails?: string;
    }> = [];

    logger.info('inventory.validation.pre-checkout.start', {
      productCount: validProducts.length,
      userId: req.user?._id?.toString(),
    });

    // Batch validate inventory for better performance
    try {
      const validationResult = await inventoryService.batchValidateInventory(validProducts);

      // Convert validation results to inventory issues
      for (const product of validationResult.validatedProducts) {
        if (!product.hasStock) {
          inventoryIssues.push({
            productId: product.productId,
            variantId: product.variantId,
            requestedQuantity: product.requestedQuantity,
            availableStock: product.availableStock,
            productName: product.productName,
            variantDetails: product.variantDetails,
          });
        }
      }
    } catch (error) {
      logger.error('inventory.validation.batch.error', error, {
        productCount: validProducts.length,
        userId: req.user?._id?.toString(),
      });
      
        // If batch validation fails, report all products as having issues
      for (const product of validProducts) {
        inventoryIssues.push({
          productId: product._id,
          variantId: product.variantId,
          requestedQuantity: product.quantity,
          availableStock: 0,
          productName: product._id,
        });
      }
    }

    if (inventoryIssues.length > 0) {
      logger.warn('inventory.validation.pre-checkout.failed', {
        issueCount: inventoryIssues.length,
        userId: req.user?._id?.toString(),
      });

      const errorMessages = inventoryIssues.map(issue => {
        const variantInfo = issue.variantDetails ? ` (${issue.variantDetails})` : '';
        return `${issue.productName ?? issue.productId}${variantInfo}: Only ${issue.availableStock} available, ${issue.requestedQuantity} requested`;
      });

      throw new InventoryError(
        `Inventory validation failed: ${errorMessages.join('; ')}`,
        'INSUFFICIENT_INVENTORY',
        inventoryIssues
      );
    }

    logger.info('inventory.validation.pre-checkout.success', {
      productCount: validProducts.length,
      userId: req.user?._id?.toString(),
    });

    next();
  } catch (error) {
    next(error);
  }
}

export async function logInventoryValidation(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const startTime = Date.now();
  const { products } = req.body;
  
  logger.info('inventory.validation.request', {
    endpoint: req.path,
    method: req.method,
    userId: req.user?._id?.toString(),
    productCount: Array.isArray(products) ? products.length : 0,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // Log response
  const originalSend = res.send;
  res.send = function(data: unknown): Response {
    const duration = Date.now() - startTime;
    
    logger.info('inventory.validation.response', {
      endpoint: req.path,
      method: req.method,
      userId: req.user?._id?.toString(),
      statusCode: res.statusCode,
      duration,
      hasInventoryError: res.statusCode === 400 && 
        typeof data === 'object' && 
        data && 
        'code' in data && 
        (data as { code: string }).code === 'INSUFFICIENT_INVENTORY',
    });

    return originalSend.call(this, data);
  };

  next();
}

// Enhanced rate limiter for inventory validation with custom logging
// Note: The main rate limiting is handled by inventoryCheckRateLimit in security.middleware.ts
// This provides additional logging capabilities when rate limits are exceeded
export function enhanceInventoryRateLimit(req: AuthRequest, res: Response, next: NextFunction): void {
  // Log rate limit headers if present
  const remaining = res.getHeader('RateLimit-Remaining');
  const limit = res.getHeader('RateLimit-Limit');
  
  if (remaining !== undefined && parseInt(remaining as string) < 5) {
    logger.warn('inventory.validation.rate-limit-approaching', {
      ip: req.ip,
      userId: req.user?._id?.toString(),
      remaining: remaining,
      limit: limit,
      endpoint: req.path,
    });
  }
  
  next();
}