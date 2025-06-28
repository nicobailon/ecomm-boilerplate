import mongoose from 'mongoose';
import { Product } from '../models/product.model.js';
import { InventoryHistory } from '../models/inventory-history.model.js';
import { AppError, InventoryError, NotFoundError } from '../utils/AppError.js';
import { CacheService } from './cache.service.js';
import { createLogger, generateCorrelationId } from '../utils/logger.js';
import { getVariantOrDefault } from './helpers/variant.helper.js';
import { USE_VARIANT_LABEL } from '../utils/featureFlags.js';
import { buildSafeCacheKey } from '../utils/cache-key-encoder.js';
import { websocketService } from '../lib/websocket.js';
import {
  StockStatus,
  InventoryAdjustmentResult,
  ProductInventoryInfo,
  BulkInventoryUpdate,
  InventoryUpdateReason,
  InventoryMetrics,
  InventoryTurnoverData,
} from '../../shared/types/inventory.types.js';
import {
  CheckoutProduct,
  ValidationResult,
  ValidatedProduct,
  AtomicInventoryCheckResult,
} from '../types/inventory.types.js';
import {
  formatVariantDetails,
  buildAtomicUpdateFilter,
  buildAtomicUpdateOperation,
  getArrayFilters,
} from '../utils/inventory-atomicity.js';

const CACHE_KEYS = {
  INVENTORY_METRICS: 'inventory:metrics',
  OUT_OF_STOCK_PRODUCTS: 'inventory:out-of-stock',
  PRODUCT_INVENTORY: (productId: string, variantId?: string, variantLabel?: string) => {
    if (USE_VARIANT_LABEL && variantLabel) {
      return buildSafeCacheKey('inventory:product', productId, 'label', variantLabel);
    }
    return buildSafeCacheKey('inventory:product', productId, variantId);
  },
};

const CACHE_TTL = {
  METRICS: 60, // 1 minute
  OUT_OF_STOCK: 300, // 5 minutes
  PRODUCT_INVENTORY: 30, // 30 seconds
};

// Type definitions for aggregation results
interface InventoryMetricsResult {
  totalProducts: number;
  totalValue: number;
  outOfStockCount: number;
  lowStockCount: number;
}

interface StockValueResult {
  totalValue: number;
}

interface OutOfStockProductResult {
  productId: string;
  productName: string;
  variantId: string;
  variantDetails: string;
  lastInStock?: Date;
}

export class InventoryService {
  private cacheService: CacheService;
  private logger = createLogger({ service: 'InventoryService' });

  constructor() {
    this.cacheService = new CacheService();
  }

  async batchValidateInventory(
    products: { _id: string; quantity: number; variantId?: string }[]
  ): Promise<{
    isValid: boolean;
    validatedProducts: {
      productId: string;
      variantId?: string;
      requestedQuantity: number;
      availableStock: number;
      productName?: string;
      variantDetails?: string;
      hasStock: boolean;
    }[];
  }> {
    const productIds = products.map(p => p._id);
    const productDocs = await Product.find({ _id: { $in: productIds } });
    const productMap = new Map(productDocs.map(p => [p._id!.toString(), p]));
    
    const validatedProducts = [];
    let isValid = true;

    for (const item of products) {
      const product = productMap.get(item._id);
      
      if (!product) {
        validatedProducts.push({
          productId: item._id,
          variantId: item.variantId,
          requestedQuantity: item.quantity,
          availableStock: 0,
          hasStock: false,
        });
        isValid = false;
        continue;
      }

      let availableStock = 0;
      let variantDetails: string | undefined;

      if (!product.variants || product.variants.length === 0) {
        availableStock = 0;
      } else if (item.variantId) {
        const variant = product.variants.find(v => v.variantId === item.variantId);
        if (variant) {
          availableStock = variant.inventory;
          variantDetails = formatVariantDetails(variant);
        }
      } else {
        availableStock = product.variants.reduce((sum, v) => sum + v.inventory, 0);
      }

      const hasStock = availableStock >= item.quantity;
      if (!hasStock) {
        isValid = false;
      }

      validatedProducts.push({
        productId: item._id,
        variantId: item.variantId,
        requestedQuantity: item.quantity,
        availableStock,
        productName: product.name,
        variantDetails,
        hasStock,
      });
    }

    return { isValid, validatedProducts };
  }

  async validateAndReserveInventory(
    products: CheckoutProduct[],
    session: mongoose.ClientSession
  ): Promise<ValidationResult> {
    const correlationId = generateCorrelationId();
    const errors: string[] = [];
    const validatedProducts: ValidatedProduct[] = [];
    
    this.logger.info('inventory.validate.start', {
      correlationId,
      productCount: products.length,
    });

    for (const product of products) {
      try {
        const result = await this.atomicInventoryCheck(
          product.id,
          product.variantId,
          product.quantity,
          session
        );

        if (!result.success) {
          const variantInfo = result.variantDetails ? ` (${result.variantDetails})` : '';
          errors.push(
            `${result.productName}${variantInfo}: Only ${result.availableStock} available, ${product.quantity} requested`
          );
        }

        validatedProducts.push({
          productId: product.id,
          variantId: product.variantId,
          requestedQuantity: product.quantity,
          availableStock: result.availableStock,
          productName: result.productName,
          variantDetails: result.variantDetails,
        });

      } catch (error) {
        this.logger.error('inventory.validate.product.error', error, {
          correlationId,
          productId: product.id,
          variantId: product.variantId,
        });

        if (error instanceof Error) {
          errors.push(`${product.id}: ${error.message}`);
        }
      }
    }

    const isValid = errors.length === 0;
    
    this.logger.info('inventory.validate.complete', {
      correlationId,
      isValid,
      errorCount: errors.length,
      validatedCount: validatedProducts.length,
    });

    return {
      isValid,
      errors,
      validatedProducts,
    };
  }

  async atomicInventoryCheck(
    productId: string,
    variantId: string | undefined,
    quantity: number,
    session: mongoose.ClientSession
  ): Promise<AtomicInventoryCheckResult> {
    const product = await Product.findById(productId).session(session);
    
    if (!product) {
      throw new InventoryError('Product not found', 'PRODUCT_NOT_FOUND', [{
        productId,
        variantId,
        requestedQuantity: quantity,
        availableStock: 0,
      }]);
    }

    let availableStock = 0;
    let variantDetails = '';
    
    if (variantId) {
      const variant = product.variants.find(v => v.variantId === variantId);
      if (!variant) {
        throw new InventoryError('Variant not found', 'VARIANT_NOT_FOUND', [{
          productId,
          productName: product.name,
          variantId,
          requestedQuantity: quantity,
          availableStock: 0,
        }]);
      }
      
      availableStock = variant.inventory;
      variantDetails = formatVariantDetails(variant);
    } else {
      if (product.variants.length > 0) {
        const firstVariant = product.variants[0];
        if (firstVariant) {
          availableStock = firstVariant.inventory;
        }
      }
    }

    const success = availableStock >= quantity;

    return {
      success,
      availableStock,
      productName: product.name,
      variantDetails,
    };
  }

  async getInventoryWithLock(
    productId: string,
    variantId: string | undefined,
    session: mongoose.ClientSession
  ): Promise<number> {
    const product = await Product.findById(productId).session(session);
    
    if (!product) {
      throw new InventoryError('Product not found', 'PRODUCT_NOT_FOUND', [{
        productId,
        variantId,
        requestedQuantity: 0,
        availableStock: 0,
      }]);
    }

    if (variantId) {
      const variant = product.variants.find(v => v.variantId === variantId);
      if (!variant) {
        throw new InventoryError('Variant not found', 'VARIANT_NOT_FOUND', [{
          productId,
          productName: product.name,
          variantId,
          requestedQuantity: 0,
          availableStock: 0,
        }]);
      }
      return variant.inventory;
    } else {
      if (product.variants.length > 0) {
        const firstVariant = product.variants[0];
        if (firstVariant) {
          return firstVariant.inventory;
        }
      }
      return 0;
    }
  }

  async atomicInventoryDeduction(
    productId: string,
    variantId: string | undefined,
    quantity: number,
    session: mongoose.ClientSession
  ): Promise<boolean> {
    const filter = buildAtomicUpdateFilter(productId, quantity, variantId);
    const update = buildAtomicUpdateOperation(variantId, -quantity);
    const options = {
      session,
      new: true,
      arrayFilters: getArrayFilters(variantId),
    };

    const result = await Product.findOneAndUpdate(filter, update, options);

    if (!result) {
      const product = await Product.findById(productId).session(session);
      if (!product) {
        throw new InventoryError('Product not found', 'PRODUCT_NOT_FOUND', [{
          productId,
          variantId,
          requestedQuantity: quantity,
          availableStock: 0,
        }]);
      }

      const availableStock = await this.getInventoryWithLock(productId, variantId, session);
      throw new InventoryError('Insufficient inventory', 'INSUFFICIENT_INVENTORY', [{
        productId,
        productName: product.name,
        variantId,
        variantDetails: variantId ? formatVariantDetails(product.variants.find(v => v.variantId === variantId) ?? {}) : undefined,
        requestedQuantity: quantity,
        availableStock,
      }]);
    }

    return true;
  }

  async recordInventoryHistory(
    productId: string,
    variantId: string | undefined,
    adjustment: number,
    reason: InventoryUpdateReason,
    userId: string,
    metadata?: Record<string, unknown>,
    session?: mongoose.ClientSession
  ): Promise<void> {
    const product = await Product.findById(productId).session(session || null);
    if (!product) {
      throw new NotFoundError('Product');
    }

    let previousQuantity = 0;
    let newQuantity = 0;

    if (variantId) {
      const variant = product.variants.find(v => v.variantId === variantId);
      if (variant) {
        previousQuantity = variant.inventory + Math.abs(adjustment);
        newQuantity = variant.inventory;
      }
    } else {
      // For products without variants, assume first variant or 0
      if (product.variants.length > 0) {
        const firstVariant = product.variants[0];
        if (firstVariant) {
          previousQuantity = firstVariant.inventory + Math.abs(adjustment);
          newQuantity = firstVariant.inventory;
        }
      }
    }

    const historyData = {
      productId,
      variantId,
      previousQuantity,
      newQuantity,
      adjustment,
      reason,
      userId,
      metadata,
    };

    if (session) {
      await InventoryHistory.create([historyData], { session });
    } else {
      await InventoryHistory.create(historyData);
    }
  }
  async checkAvailability(
    productId: string,
    variantId?: string,
    quantity = 1,
    variantLabel?: string,
  ): Promise<boolean> {
    const product = await Product.findById(productId);
    if (!product) {
      return false;
    }

    let totalInventory = 0;

    if (USE_VARIANT_LABEL && variantLabel) {
      const { variant } = getVariantOrDefault(product.variants, variantLabel);
      if (!variant) {
        return false;
      }
      totalInventory = variant.inventory;
    } else if (variantId) {
      const variant = product.variants.find(v => v.variantId === variantId);
      if (!variant) {
        return false;
      }
      totalInventory = variant.inventory;
    } else {
      totalInventory = product.variants.reduce((sum, v) => sum + v.inventory, 0);
    }

    return totalInventory >= quantity;
  }

  async getAvailableInventory(
    productId: string,
    variantId?: string,
    variantLabel?: string,
  ): Promise<number> {
    const product = await Product.findById(productId);
    if (!product) {
      throw new NotFoundError('Product');
    }

    // Handle products without variants
    if (!product.variants || product.variants.length === 0) {
      return 0;
    }

    let totalInventory = 0;

    if (USE_VARIANT_LABEL && variantLabel) {
      const { variant } = getVariantOrDefault(product.variants, variantLabel);
      if (!variant) {
        throw new NotFoundError('Variant');
      }
      totalInventory = variant.inventory;
    } else if (variantId) {
      const variant = product.variants.find(v => v.variantId === variantId);
      if (!variant) {
        throw new NotFoundError('Variant');
      }
      totalInventory = variant.inventory;
    } else {
      totalInventory = product.variants.reduce((sum, v) => sum + v.inventory, 0);
    }

    return Math.max(0, totalInventory);
  }

  async updateInventory(
    productId: string,
    variantId: string | undefined,
    adjustment: number,
    reason: InventoryUpdateReason,
    userId: string,
    metadata?: Record<string, unknown>,
    retryCount = 0,
    variantLabel?: string,
  ): Promise<InventoryAdjustmentResult> {
    const MAX_INVENTORY = 999999;
    const MAX_RETRIES = 3;
    const correlationId = metadata?.correlationId as string ?? generateCorrelationId();
    const startTime = Date.now();
    
    this.logger.info('inventory.update.start', {
      correlationId,
      productId,
      variantId,
      adjustment,
      reason,
      userId,
      retryCount,
    });
    
    try {
      // Check if this is a history-only update (inventory already deducted atomically)
      const skipDeduction = metadata?.skipDeduction === true;
      
      // First, check if product exists and has variants
      const product = await Product.findById(productId);
      if (!product) {
        throw new NotFoundError('Product');
      }
      
      // If product has no variants, create a default variant
      if (!product.variants || product.variants.length === 0) {
        product.variants = [{
          variantId: 'default',
          label: 'Default',
          size: undefined,
          color: undefined,
          price: product.price,
          inventory: 0,
          images: [],
          sku: undefined,
        }];
        await product.save();
      }
      
      let updatedProduct = product;
      let previousQuantity: number;
      let newQuantity: number;
      
      if (!skipDeduction) {
        // Use atomic operation
        const updateQuery = variantId
          ? {
              _id: productId,
              'variants.variantId': variantId,
              'variants.inventory': { 
                $gte: adjustment < 0 ? Math.abs(adjustment) : 0,
                $lte: adjustment > 0 ? MAX_INVENTORY - adjustment : MAX_INVENTORY,
              },
            }
          : {
              _id: productId,
              'variants.0.inventory': { 
                $gte: adjustment < 0 ? Math.abs(adjustment) : 0,
                $lte: adjustment > 0 ? MAX_INVENTORY - adjustment : MAX_INVENTORY,
              },
            };
        
        // Additional validation for sales
        if (reason === 'sale' && adjustment < 0) {
          const availableStock = await this.getAvailableInventory(productId, variantId);
          if (Math.abs(adjustment) > availableStock) {
            throw new InventoryError(
              `Cannot sell ${Math.abs(adjustment)} items. Only ${availableStock} available`,
              'INSUFFICIENT_INVENTORY',
              [{
                productId: productId,
                variantId: variantId,
                requestedQuantity: Math.abs(adjustment),
                availableStock: availableStock
              }]
            );
          }
        }
        
        const updateOperation = variantId
          ? { $inc: { 'variants.$.inventory': adjustment } }
          : { $inc: { 'variants.0.inventory': adjustment } };
        
        const result = await Product.findOneAndUpdate(
          updateQuery,
          updateOperation,
          { new: true, runValidators: true },
        );
        
        if (!result) {
          if (variantId) {
            const variant = product.variants.find(v => v.variantId === variantId);
            if (!variant) {
              throw new NotFoundError('Variant');
            }
          }
          
          throw new InventoryError(
            adjustment < 0 
              ? `Insufficient inventory. Current: ${product.variants[0]?.inventory ?? 0}, Requested adjustment: ${adjustment}`
              : `Inventory limit exceeded. Maximum allowed: ${MAX_INVENTORY}`,
            'INSUFFICIENT_INVENTORY',
            [{
              productId: productId,
              variantId: variantId,
              requestedQuantity: Math.abs(adjustment),
              availableStock: product.variants[0]?.inventory ?? 0
            }]
          );
        }
        
        updatedProduct = result;
      }
      
      // Get the variant data for history
      const variant = variantId
        ? updatedProduct.variants.find(v => v.variantId === variantId)
        : updatedProduct.variants.length > 0 ? updatedProduct.variants[0] : undefined;
      
      if (!variant) {
        throw new AppError('Variant not found after update', 500);
      }
      
      if (skipDeduction) {
        // For history-only updates, calculate what the values would have been
        previousQuantity = variant.inventory - adjustment;
        newQuantity = variant.inventory;
      } else {
        previousQuantity = variant.inventory - adjustment;
        newQuantity = variant.inventory;
      }
      
      // Save history
      const historyRecord = new InventoryHistory({
        productId,
        variantId,
        previousQuantity,
        newQuantity,
        adjustment,
        reason,
        userId,
        metadata,
      });
      
      await historyRecord.save();
      
      // Get available stock
      const availableStock = await this.getAvailableInventory(productId, variantId);
      
      // Invalidate cache
      await this.invalidateInventoryCache(productId, variantId, variantLabel);
      
      // Broadcast inventory update via WebSocket
      const stockStatus = this.calculateStockStatus(
        availableStock,
        updatedProduct.lowStockThreshold,
        updatedProduct.allowBackorder,
      );
      
      await websocketService.publishInventoryUpdate({
        productId,
        variantId,
        availableStock,
        totalStock: newQuantity,
        stockStatus: stockStatus as 'in_stock' | 'low_stock' | 'out_of_stock',
        timestamp: Date.now(),
      });
      
      const result = {
        success: true,
        previousQuantity,
        newQuantity,
        availableStock,
        historyRecord: historyRecord.toObject(),
      };
      
      this.logger.info('inventory.update.success', {
        correlationId,
        productId,
        variantId,
        adjustment,
        reason,
        userId,
        previousQuantity,
        newQuantity,
        availableStock,
        duration: Date.now() - startTime,
      });
      
      return result;
    } catch (error) {
      // Handle version conflict errors (optimistic locking)
      if (error instanceof Error && error.name === 'VersionError' && retryCount < MAX_RETRIES) {
        this.logger.warn('inventory.update.retry', {
          correlationId,
          productId,
          variantId,
          retryCount,
          error: error,
        });

        // Retry the operation with exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 100));
        return this.updateInventory(
          productId,
          variantId,
          adjustment,
          reason,
          userId,
          { ...metadata, correlationId },
          retryCount + 1,
        );
      }
      
      this.logger.error('inventory.update.error', error, {
        correlationId,
        productId,
        variantId,
        adjustment,
        reason,
        userId,
        duration: Date.now() - startTime,
      });
      
      throw error;
    }
  }

  async bulkUpdateInventory(
    updates: BulkInventoryUpdate[],
    userId: string,
  ): Promise<InventoryAdjustmentResult[]> {
    const results: InventoryAdjustmentResult[] = [];

    for (const update of updates) {
      try {
        const result = await this.updateInventory(
          update.productId,
          update.variantId,
          update.adjustment,
          update.reason,
          userId,
          update.metadata,
        );
        results.push(result);
      } catch {
        results.push({
          success: false,
          previousQuantity: 0,
          newQuantity: 0,
          availableStock: 0,
          historyRecord: {
            productId: update.productId,
            variantId: update.variantId,
            previousQuantity: 0,
            newQuantity: 0,
            adjustment: 0,
            reason: update.reason,
            userId,
            timestamp: new Date(),
            metadata: update.metadata,
          },
        });
      }
    }

    return results;
  }

  async getProductInventoryInfo(
    productId: string,
    variantId?: string,
    variantLabel?: string,
  ): Promise<ProductInventoryInfo> {
    const product = await Product.findById(productId);
    if (!product) {
      throw new NotFoundError('Product');
    }

    const availableStock = await this.getAvailableInventory(productId, variantId, variantLabel);

    let currentStock = 0;

    // Handle products without variants
    if (!product.variants || product.variants.length === 0) {
      // Products without variants have 0 inventory
      currentStock = 0;
    } else if (USE_VARIANT_LABEL && variantLabel) {
      const { variant } = getVariantOrDefault(product.variants, variantLabel);
      if (!variant) {
        throw new NotFoundError('Variant');
      }
      currentStock = variant.inventory;
    } else if (variantId) {
      const variant = product.variants.find(v => v.variantId === variantId);
      if (!variant) {
        throw new NotFoundError('Variant');
      }
      currentStock = variant.inventory;
    } else {
      currentStock = product.variants.reduce((sum, v) => sum + v.inventory, 0);
    }

    const stockStatus = this.calculateStockStatus(
      availableStock,
      product.lowStockThreshold,
      product.allowBackorder,
    );

    return {
      productId,
      variantId,
      currentStock,
      availableStock,
      lowStockThreshold: product.lowStockThreshold,
      allowBackorder: product.allowBackorder,
      restockDate: product.restockDate,
      stockStatus,
    };
  }

  private calculateStockStatus(
    availableStock: number,
    threshold: number,
    allowBackorder: boolean,
  ): StockStatus {
    if (availableStock <= 0) {
      return allowBackorder ? StockStatus.BACKORDERED : StockStatus.OUT_OF_STOCK;
    }
    if (availableStock <= threshold) {
      return StockStatus.LOW_STOCK;
    }
    return StockStatus.IN_STOCK;
  }

  async getInventoryMetrics(): Promise<InventoryMetrics> {
    // Try to get from cache first
    const cached = await this.cacheService.get<InventoryMetrics>(CACHE_KEYS.INVENTORY_METRICS);
    if (cached) {
      return cached;
    }

    const pipeline = [
      // Match active products
      { $match: { isDeleted: { $ne: true } } },
      
      // Unwind variants
      { $unwind: '$variants' },
      
      // Calculate stock value and status
      {
        $addFields: {
          availableStock: '$variants.inventory',
          stockValue: {
            $multiply: ['$variants.inventory', '$variants.price'],
          },
        },
      },
      
      // Categorize stock status
      {
        $addFields: {
          isOutOfStock: { $lte: ['$variants.inventory', 0] },
          isLowStock: {
            $and: [
              { $gt: ['$variants.inventory', 0] },
              { $lte: ['$variants.inventory', '$lowStockThreshold'] },
            ],
          },
        },
      },
      
      // Group and calculate totals
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalValue: { $sum: '$stockValue' },
          outOfStockCount: {
            $sum: { $cond: ['$isOutOfStock', 1, 0] },
          },
          lowStockCount: {
            $sum: { $cond: ['$isLowStock', 1, 0] },
          },
        },
      },
    ];

    const results = await Product.aggregate<InventoryMetricsResult>(pipeline as mongoose.PipelineStage[]);
    const metrics: InventoryMetrics = results.length > 0 && results[0] ? results[0] : {
      totalProducts: 0,
      totalValue: 0,
      outOfStockCount: 0,
      lowStockCount: 0,
    };

    // Cache the results
    await this.cacheService.set(CACHE_KEYS.INVENTORY_METRICS, metrics, CACHE_TTL.METRICS);

    return metrics;
  }

  async getStockValue(): Promise<number> {
    const pipeline: mongoose.PipelineStage[] = [
      // Match active products
      { $match: { isDeleted: { $ne: true } } },
      
      // Unwind variants
      { $unwind: '$variants' },
      
      // Calculate value per variant
      {
        $addFields: {
          variantValue: {
            $multiply: ['$variants.inventory', '$variants.price'],
          },
        },
      },
      
      // Sum all variant values
      {
        $group: {
          _id: null,
          totalValue: { $sum: '$variantValue' },
        },
      },
    ];

    const results = await Product.aggregate<StockValueResult>(pipeline);
    return results.length > 0 && results[0] ? results[0].totalValue : 0;
  }

  async getOutOfStockProducts(): Promise<{
    productId: string;
    productName: string;
    variantId: string;
    variantDetails: string;
    lastInStock?: Date;
  }[]> {
    // Try to get from cache first
    const cached = await this.cacheService.get<{
      productId: string;
      productName: string;
      variantId: string;
      variantDetails: string;
      lastInStock?: Date;
    }[]>(CACHE_KEYS.OUT_OF_STOCK_PRODUCTS);
    if (cached) {
      return cached;
    }

    const pipeline = [
      // Match active products that don't allow backorder
      { 
        $match: { 
          isDeleted: { $ne: true },
          allowBackorder: { $ne: true },
        }, 
      },
      
      // Unwind variants
      { $unwind: '$variants' },
      
      // Filter for out of stock items
      { $match: { 'variants.inventory': { $lte: 0 } } },
      
      // Lookup last in-stock date from history
      {
        $lookup: {
          from: 'inventoryhistories',
          let: {
            productId: { $toString: '$_id' },
            variantId: '$variants.variantId',
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$productId', '$$productId'] },
                    { $eq: ['$variantId', '$$variantId'] },
                    { $gt: ['$newQuantity', 0] },
                  ],
                },
              },
            },
            { $sort: { timestamp: -1 } },
            { $limit: 1 },
          ],
          as: 'lastInStockHistory',
        },
      },
      
      // Format output
      {
        $project: {
          _id: 0,
          productId: { $toString: '$_id' },
          productName: '$name',
          variantId: '$variants.variantId',
          variantDetails: {
            $trim: {
              input: {
                $concat: [
                  { $ifNull: ['$variants.size', ''] },
                  ' ',
                  { $ifNull: ['$variants.color', ''] },
                ],
              },
            },
          },
          lastInStock: { $first: '$lastInStockHistory.timestamp' },
        },
      },
    ];

    const results = await Product.aggregate<OutOfStockProductResult>(pipeline as mongoose.PipelineStage[]);
    
    // Cache the results
    await this.cacheService.set(CACHE_KEYS.OUT_OF_STOCK_PRODUCTS, results, CACHE_TTL.OUT_OF_STOCK);
    
    return results;
  }

  async getInventoryTurnover(
    dateRange: { start: Date; end: Date },
  ): Promise<InventoryTurnoverData[]> {
    const pipeline: mongoose.PipelineStage[] = [
      // Match sales within the date range
      {
        $match: {
          reason: 'sale',
          timestamp: { $gte: dateRange.start, $lte: dateRange.end },
        },
      },
      // Group by product and variant to get total sold
      {
        $group: {
          _id: {
            productId: '$productId',
            variantId: { $ifNull: ['$variantId', 'default'] },
          },
          soldQuantity: { $sum: { $abs: '$adjustment' } },
        },
      },
      // Lookup product information
      {
        $lookup: {
          from: 'products',
          let: { productId: { $toObjectId: '$_id.productId' } },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', '$$productId'] } } },
            { $unwind: '$variants' },
            {
              $match: {
                $expr: {
                  $eq: ['$variants.variantId', '$$ROOT._id.variantId'],
                },
              },
            },
            {
              $project: {
                name: 1,
                inventory: '$variants.inventory',
              },
            },
          ],
          as: 'productInfo',
        },
      },
      // Unwind product info
      { $unwind: { path: '$productInfo', preserveNullAndEmptyArrays: true } },
      // Calculate turnover rate
      {
        $addFields: {
          productName: '$productInfo.name',
          averageStock: { $ifNull: ['$productInfo.inventory', 0] },
          turnoverRate: {
            $cond: {
              if: { $gt: ['$productInfo.inventory', 0] },
              then: { $divide: ['$soldQuantity', '$productInfo.inventory'] },
              else: 0,
            },
          },
        },
      },
      // Format output
      {
        $project: {
          _id: 0,
          productId: '$_id.productId',
          productName: 1,
          variantId: {
            $cond: {
              if: { $eq: ['$_id.variantId', 'default'] },
              then: null,
              else: '$_id.variantId',
            },
          },
          soldQuantity: 1,
          averageStock: 1,
          turnoverRate: 1,
        },
      },
      // Sort by turnover rate (highest first)
      { $sort: { turnoverRate: -1 } },
    ];

    const results = await InventoryHistory.aggregate<Omit<InventoryTurnoverData, 'period'>>(pipeline);
    
    return results.map(item => ({
      ...item,
      period: dateRange,
    }));
  }

  private async invalidateInventoryCache(productId: string, variantId?: string, variantLabel?: string): Promise<void> {
    // TODO(#variant-migration): Coordinate with frontend for cache-key patterns
    // Invalidate all possible key combinations during dual-mode operation
    const keysToInvalidate: string[] = [
      // Primary key with all parameters
      CACHE_KEYS.PRODUCT_INVENTORY(productId, variantId, variantLabel),
    ];
    
    // During dual-mode, we need to invalidate both label and non-label versions
    if (USE_VARIANT_LABEL) {
      // Invalidate legacy key without label
      keysToInvalidate.push(CACHE_KEYS.PRODUCT_INVENTORY(productId, variantId, undefined));
      
      // Invalidate variant-less keys for both label and non-label
      if (variantLabel ?? variantId) {
        keysToInvalidate.push(CACHE_KEYS.PRODUCT_INVENTORY(productId, undefined, undefined));
      }
    } else {
      // In legacy mode, still invalidate label-based keys if they exist
      if (variantLabel) {
        keysToInvalidate.push(CACHE_KEYS.PRODUCT_INVENTORY(productId, variantId, variantLabel));
      }
    }
    
    // Invalidate all identified keys
    await Promise.all(keysToInvalidate.map(key => this.cacheService.del(key)));
    
    // Invalidate general metrics that might be affected
    await this.cacheService.del(CACHE_KEYS.INVENTORY_METRICS);
    await this.cacheService.del(CACHE_KEYS.OUT_OF_STOCK_PRODUCTS);
  }
}

export const inventoryService = new InventoryService();