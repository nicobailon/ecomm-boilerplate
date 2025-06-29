import { InventoryValidationError } from '../types/inventory.types.js';
import type { IProductDocument } from '../models/product.model.js';

export function createInventoryValidationError(
  code: InventoryValidationError['code'],
  details: InventoryValidationError['details'],
): InventoryValidationError {
  const messages = details.map(detail => {
    const variantInfo = detail.variantDetails ? ` (${detail.variantDetails})` : '';
    return `${detail.productName ?? 'Product'}${variantInfo}: ${detail.availableStock} available, ${detail.requestedQuantity} requested`;
  });

  const error = new Error(`Inventory validation failed: ${messages.join(', ')}`) as InventoryValidationError;
  error.name = 'InventoryValidationError';
  error.code = code;
  error.details = details;
  return error;
}

export function isInventoryValidationError(error: unknown): error is InventoryValidationError {
  return error instanceof Error && 'code' in error && 'details' in error;
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelayMs = 100,
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < maxRetries) {
        const isRetryable = 
          error instanceof Error && 
          (error.name === 'VersionError' || 
           error.message.includes('WriteConflict') ||
           error.message.includes('TransientTransactionError'));
        
        if (isRetryable) {
          const delay = baseDelayMs * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
      
      throw error;
    }
  }

  throw lastError ?? new Error('Operation failed after retries');
}

export function formatVariantDetails(variant: { size?: string; color?: string; label?: string }): string {
  if (variant.label) {
    return variant.label;
  }
  
  const parts = [];
  if (variant.size) parts.push(`Size: ${variant.size}`);
  if (variant.color) parts.push(`Color: ${variant.color}`);
  
  return parts.length > 0 ? parts.join(', ') : '';
}

export function buildAtomicUpdateFilter(
  productId: string,
  minInventory: number,
  variantId?: string,
): Record<string, unknown> {
  const filter: Record<string, unknown> = {
    _id: productId,
    isDeleted: { $ne: true },
  };

  if (variantId) {
    filter.variants = {
      $elemMatch: {
        variantId: variantId,
        inventory: { $gte: minInventory },
      },
    };
  } else {
    // For products without specific variant, check default variant
    filter['variants.0.inventory'] = { $gte: minInventory };
  }

  return filter;
}

export function buildAtomicUpdateOperation(
  variantId: string | undefined,
  inventoryDelta: number,
): Record<string, unknown> {
  if (variantId) {
    return {
      $inc: { 'variants.$[elem].inventory': inventoryDelta },
    };
  } else {
    // Update default variant when no variant is specified
    return {
      $inc: { 'variants.0.inventory': inventoryDelta },
    };
  }
}

export function getArrayFilters(variantId?: string): { 'elem.variantId': string }[] | undefined {
  if (!variantId) return undefined;
  
  return [
    { 'elem.variantId': variantId },
  ];
}

export async function performAtomicInventoryUpdate(
  productId: string,
  quantity: number,
  variantId?: string,
): Promise<IProductDocument | null> {
  const { Product } = await import('../models/product.model.js');
  const filter = buildAtomicUpdateFilter(productId, quantity, variantId);
  const update = buildAtomicUpdateOperation(variantId, -quantity);
  const options = {
    new: true,
    arrayFilters: getArrayFilters(variantId),
  };

  return Product.findOneAndUpdate(filter, update, options);
}

export async function validateInventoryAvailability(
  items: { productId: string; quantity: number; variantId?: string }[],
): Promise<{
  productId: string;
  hasStock: boolean;
  availableStock: number;
  productName?: string;
}[]> {
  const { Product } = await import('../models/product.model.js');
  const results = [];

  for (const item of items) {
    const product = await Product.findById(item.productId);
    
    if (!product) {
      results.push({
        productId: item.productId,
        hasStock: false,
        availableStock: 0,
      });
      continue;
    }

    let availableStock = 0;
    if (item.variantId) {
      const variant = product.variants.find((v: any) => v.variantId === item.variantId);
      availableStock = variant ? variant.inventory : 0;
    } else {
      // Sum all variant inventories when no specific variant is requested
      availableStock = product.variants?.reduce((sum: number, v: any) => sum + (v.inventory || 0), 0) || 0;
    }

    results.push({
      productId: item.productId,
      productName: product.name,
      hasStock: availableStock >= item.quantity,
      availableStock,
    });
  }

  return results;
}