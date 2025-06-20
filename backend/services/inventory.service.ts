import mongoose from 'mongoose';
import { Product } from '../models/product.model.js';
import { InventoryReservation } from '../models/inventory-reservation.model.js';
import { InventoryHistory } from '../models/inventory-history.model.js';
import { AppError } from '../utils/AppError.js';
import { CacheService } from './cache.service.js';
import { createLogger, generateCorrelationId } from '../utils/logger.js';
import {
  StockStatus,
  ReservationResult,
  InventoryAdjustmentResult,
  ProductInventoryInfo,
  BulkInventoryUpdate,
  InventoryUpdateReason,
  LowStockAlert,
  InventoryMetrics,
  InventoryTurnoverData,
} from '../../shared/types/inventory.types.js';

const CACHE_KEYS = {
  INVENTORY_METRICS: 'inventory:metrics',
  LOW_STOCK_PRODUCTS: 'inventory:low-stock',
  OUT_OF_STOCK_PRODUCTS: 'inventory:out-of-stock',
  PRODUCT_INVENTORY: (productId: string, variantId?: string) => 
    `inventory:product:${productId}${variantId ? `:${variantId}` : ''}`,
};

const CACHE_TTL = {
  METRICS: 60, // 1 minute
  LOW_STOCK: 300, // 5 minutes
  OUT_OF_STOCK: 300, // 5 minutes
  PRODUCT_INVENTORY: 30, // 30 seconds
};

export class InventoryService {
  private cacheService: CacheService;
  private logger = createLogger({ service: 'InventoryService' });

  constructor() {
    this.cacheService = new CacheService();
  }
  async checkAvailability(
    productId: string,
    variantId?: string,
    quantity: number = 1
  ): Promise<boolean> {
    // Build aggregation pipeline for atomic availability check
    const basePipeline: mongoose.PipelineStage[] = [
      { $match: { _id: new mongoose.Types.ObjectId(productId) } },
      { $unwind: '$variants' }
    ];
    
    // Add variant filter if specified
    if (variantId) {
      basePipeline.push({ $match: { 'variants.variantId': variantId } });
    }
    
    // Build lookup conditions
    const lookupConditions = variantId
      ? [
          { $eq: ['$productId', '$$productId'] },
          { $eq: ['$variantId', '$$variantId'] },
          { $gt: ['$expiresAt', new Date()] }
        ]
      : [
          { $eq: ['$productId', '$$productId'] },
          { $gt: ['$expiresAt', new Date()] }
        ];
    
    // Add lookup and aggregation stages
    const fullPipeline: mongoose.PipelineStage[] = [
      ...basePipeline,
      {
        $lookup: {
          from: 'inventoryreservations',
          let: {
            productId: { $toString: '$_id' },
            variantId: '$variants.variantId'
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: lookupConditions
                }
              }
            },
            {
              $group: {
                _id: null,
                totalReserved: { $sum: '$quantity' }
              }
            }
          ],
          as: 'reservations'
        }
      },
      {
        $group: {
          _id: null,
          totalInventory: { $sum: '$variants.inventory' },
          totalReserved: { $sum: { $ifNull: [{ $first: '$reservations.totalReserved' }, 0] } }
        }
      },
      {
        $project: {
          availableStock: {
            $subtract: ['$totalInventory', '$totalReserved']
          }
        }
      }
    ];

    const result = await Product.aggregate(fullPipeline);
    const availableStock = result[0]?.availableStock || 0;
    return availableStock >= quantity;
  }

  async reserveInventory(
    productId: string,
    variantId: string | undefined,
    quantity: number,
    sessionId: string,
    duration: number = 30 * 60 * 1000,
    userId?: string
  ): Promise<ReservationResult> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Lock the product document for reading to prevent concurrent modifications
      const product = await Product.findById(productId).session(session);
      if (!product) {
        throw new AppError('Product not found', 404);
      }

      // Calculate current inventory
      let currentInventory = 0;
      if (variantId) {
        const variant = product.variants.find(v => v.variantId === variantId);
        if (!variant) {
          throw new AppError('Variant not found', 404);
        }
        currentInventory = variant.inventory;
      } else {
        currentInventory = product.variants.reduce((sum, v) => sum + v.inventory, 0);
      }

      // Get existing reservations atomically within the same transaction
      const existingReservations = await InventoryReservation.aggregate([
        {
          $match: {
            productId,
            ...(variantId && { variantId }),
            expiresAt: { $gt: new Date() },
          },
        },
        {
          $group: {
            _id: null,
            totalReserved: { $sum: '$quantity' },
          },
        },
      ]).session(session);

      const totalReserved = existingReservations[0]?.totalReserved || 0;
      const availableStock = Math.max(0, currentInventory - totalReserved);

      // Check if requested quantity is available
      if (availableStock < quantity) {
        await session.abortTransaction();
        return {
          success: false,
          availableStock,
          message: `Only ${availableStock} items available`,
        };
      }

      // Check for existing reservation for this session
      const existingReservation = await InventoryReservation.findOne({
        productId,
        variantId,
        sessionId,
      }).session(session);

      if (existingReservation) {
        // Update existing reservation
        existingReservation.quantity = quantity;
        existingReservation.expiresAt = new Date(Date.now() + duration);
        await existingReservation.save({ session });

        await session.commitTransaction();
        return {
          success: true,
          reservationId: (existingReservation._id as mongoose.Types.ObjectId).toString(),
          availableStock: availableStock - quantity,
        };
      }

      // Create new reservation
      const reservation = new InventoryReservation({
        productId,
        variantId,
        quantity,
        sessionId,
        userId,
        expiresAt: new Date(Date.now() + duration),
        type: 'cart',
      });

      await reservation.save({ session });

      await session.commitTransaction();
      return {
        success: true,
        reservationId: (reservation._id as mongoose.Types.ObjectId).toString(),
        availableStock: availableStock - quantity,
      };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  async releaseReservation(reservationId: string): Promise<void> {
    await InventoryReservation.findByIdAndDelete(reservationId);
  }

  async releaseSessionReservations(sessionId: string): Promise<void> {
    await InventoryReservation.deleteMany({ sessionId });
  }

  async getAvailableInventory(
    productId: string,
    variantId?: string
  ): Promise<number> {
    const product = await Product.findById(productId);
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    let totalInventory = 0;

    if (variantId) {
      const variant = product.variants.find(v => v.variantId === variantId);
      if (!variant) {
        throw new AppError('Variant not found', 404);
      }
      totalInventory = variant.inventory;
    } else {
      totalInventory = product.variants.reduce((sum, v) => sum + v.inventory, 0);
    }

    const reservations = await InventoryReservation.aggregate([
      {
        $match: {
          productId,
          ...(variantId && { variantId }),
          expiresAt: { $gt: new Date() },
        },
      },
      {
        $group: {
          _id: null,
          totalReserved: { $sum: '$quantity' },
        },
      },
    ]);

    const totalReserved = reservations[0]?.totalReserved || 0;
    return Math.max(0, totalInventory - totalReserved);
  }

  async updateInventory(
    productId: string,
    variantId: string | undefined,
    adjustment: number,
    reason: InventoryUpdateReason,
    userId: string,
    metadata?: Record<string, unknown>,
    retryCount: number = 0
  ): Promise<InventoryAdjustmentResult> {
    const MAX_INVENTORY = 999999;
    const MAX_RETRIES = 3;
    const correlationId = metadata?.correlationId as string || generateCorrelationId();
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
      // Use atomic operation
      const updateQuery = variantId
        ? {
            _id: productId,
            'variants.variantId': variantId,
            'variants.inventory': { 
              $gte: adjustment < 0 ? Math.abs(adjustment) : 0,
              $lte: adjustment > 0 ? MAX_INVENTORY - adjustment : MAX_INVENTORY
            }
          }
        : {
            _id: productId,
            'variants.0.inventory': { 
              $gte: adjustment < 0 ? Math.abs(adjustment) : 0,
              $lte: adjustment > 0 ? MAX_INVENTORY - adjustment : MAX_INVENTORY
            }
          };
      
      // Additional validation for sales
      if (reason === 'sale' && adjustment < 0) {
        const availableStock = await this.getAvailableInventory(productId, variantId);
        if (Math.abs(adjustment) > availableStock) {
          throw new AppError(
            `Cannot sell ${Math.abs(adjustment)} items. Only ${availableStock} available (excluding reservations)`,
            400
          );
        }
      }
      
      const updateOperation = variantId
        ? { $inc: { 'variants.$.inventory': adjustment } }
        : { $inc: { 'variants.0.inventory': adjustment } };
      
      const updatedProduct = await Product.findOneAndUpdate(
        updateQuery,
        updateOperation,
        { new: true, runValidators: true }
      );
      
      if (!updatedProduct) {
        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
          throw new AppError('Product not found', 404);
        }
        
        if (variantId) {
          const variant = product.variants.find(v => v.variantId === variantId);
          if (!variant) {
            throw new AppError('Variant not found', 404);
          }
        }
        
        throw new AppError(
          adjustment < 0 
            ? `Insufficient inventory. Current: ${product.variants[0]?.inventory || 0}, Requested adjustment: ${adjustment}`
            : `Inventory limit exceeded. Maximum allowed: ${MAX_INVENTORY}`,
          400
        );
      }
      
      // Get the variant data for history
      const variant = variantId
        ? updatedProduct.variants.find(v => v.variantId === variantId)
        : updatedProduct.variants[0];
      
      if (!variant) {
        throw new AppError('Variant not found after update', 500);
      }
      
      const previousQuantity = variant.inventory - adjustment;
      const newQuantity = variant.inventory;
      
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
      await this.invalidateInventoryCache(productId, variantId);
      
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
          error: error.message,
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
          retryCount + 1
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
    userId: string
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
          update.metadata
        );
        results.push(result);
      } catch (error) {
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

  async getInventoryHistory(
    productId: string,
    variantId?: string,
    limit: number = 50,
    offset: number = 0
  ) {
    const query: { productId: string; variantId?: string } = { productId };
    if (variantId) {
      query.variantId = variantId;
    }

    const [history, total] = await Promise.all([
      InventoryHistory.find(query)
        .sort({ timestamp: -1 })
        .limit(limit)
        .skip(offset)
        .lean(),
      InventoryHistory.countDocuments(query),
    ]);

    return {
      history,
      total,
      page: Math.floor(offset / limit) + 1,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getLowStockProducts(threshold?: number): Promise<LowStockAlert[]> {
    // Create cache key with threshold
    const cacheKey = `${CACHE_KEYS.LOW_STOCK_PRODUCTS}:${threshold || 'default'}`;
    
    // Try to get from cache first
    const cached = await this.cacheService.get<LowStockAlert[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const pipeline = [
      // Match active products
      { $match: { isDeleted: { $ne: true } } },
      
      // Unwind variants to process each variant separately
      { $unwind: '$variants' },
      
      // Calculate effective threshold
      {
        $addFields: {
          effectiveThreshold: threshold ?? { $ifNull: ['$lowStockThreshold', 5] }
        }
      },
      
      // Lookup reservations for each variant
      {
        $lookup: {
          from: 'inventoryreservations',
          let: {
            productId: { $toString: '$_id' },
            variantId: '$variants.variantId'
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$productId', '$$productId'] },
                    { $eq: ['$variantId', '$$variantId'] },
                    { $gt: ['$expiresAt', new Date()] }
                  ]
                }
              }
            },
            {
              $group: {
                _id: null,
                totalReserved: { $sum: '$quantity' }
              }
            }
          ],
          as: 'reservations'
        }
      },
      
      // Calculate available inventory
      {
        $addFields: {
          totalReserved: {
            $ifNull: [{ $first: '$reservations.totalReserved' }, 0]
          },
          availableStock: {
            $subtract: [
              '$variants.inventory',
              { $ifNull: [{ $first: '$reservations.totalReserved' }, 0] }
            ]
          }
        }
      },
      
      // Filter for low stock items
      {
        $match: {
          $expr: {
            $lte: ['$availableStock', '$effectiveThreshold']
          }
        }
      },
      
      // Lookup last restock history
      {
        $lookup: {
          from: 'inventoryhistories',
          let: {
            productId: { $toString: '$_id' },
            variantId: '$variants.variantId'
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$productId', '$$productId'] },
                    { $eq: ['$variantId', '$$variantId'] },
                    { $eq: ['$reason', 'restock'] }
                  ]
                }
              }
            },
            { $sort: { timestamp: -1 } },
            { $limit: 1 }
          ],
          as: 'restockHistory'
        }
      },
      
      // Format the output
      {
        $project: {
          _id: 0,
          productId: { $toString: '$_id' },
          productName: '$name',
          variantId: '$variants.variantId',
          variantName: {
            $trim: {
              input: {
                $concat: [
                  { $ifNull: ['$variants.size', ''] },
                  ' ',
                  { $ifNull: ['$variants.color', ''] }
                ]
              }
            }
          },
          currentStock: '$availableStock',
          threshold: '$effectiveThreshold',
          lastRestocked: { $first: '$restockHistory.timestamp' },
          restockDate: '$restockDate'
        }
      }
    ];

    const alerts = await Product.aggregate(pipeline as mongoose.PipelineStage[]);
    const results = alerts as LowStockAlert[];
    
    // Cache the results
    await this.cacheService.set(cacheKey, results, CACHE_TTL.LOW_STOCK);
    
    return results;
  }

  async getProductInventoryInfo(
    productId: string,
    variantId?: string
  ): Promise<ProductInventoryInfo> {
    const product = await Product.findById(productId);
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    const availableStock = await this.getAvailableInventory(productId, variantId);

    let currentStock = 0;
    let reservedStock = 0;

    if (variantId) {
      const variant = product.variants.find(v => v.variantId === variantId);
      if (!variant) {
        throw new AppError('Variant not found', 404);
      }
      currentStock = variant.inventory;
      reservedStock = variant.reservedInventory || 0;
    } else {
      currentStock = product.variants.reduce((sum, v) => sum + v.inventory, 0);
      reservedStock = product.variants.reduce(
        (sum, v) => sum + (v.reservedInventory || 0),
        0
      );
    }

    const stockStatus = this.calculateStockStatus(
      availableStock,
      product.lowStockThreshold,
      product.allowBackorder
    );

    return {
      productId,
      variantId,
      currentStock,
      reservedStock,
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
    allowBackorder: boolean
  ): StockStatus {
    if (availableStock <= 0) {
      return allowBackorder ? StockStatus.BACKORDERED : StockStatus.OUT_OF_STOCK;
    }
    if (availableStock <= threshold) {
      return StockStatus.LOW_STOCK;
    }
    return StockStatus.IN_STOCK;
  }

  async convertReservationToPermanent(
    reservationId: string,
    orderId: string
  ): Promise<void> {
    const correlationId = generateCorrelationId();
    const startTime = Date.now();
    
    this.logger.info('inventory.reservation.convert.start', {
      correlationId,
      reservationId,
      orderId,
    });
    
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const reservation = await InventoryReservation.findById(reservationId).session(
        session
      );
      if (!reservation) {
        throw new AppError('Reservation not found', 404);
      }

      await this.updateInventory(
        reservation.productId,
        reservation.variantId,
        -reservation.quantity,
        'sale',
        reservation.userId || 'system',
        { orderId, correlationId }
      );

      await reservation.deleteOne({ session });

      await session.commitTransaction();
      
      this.logger.info('inventory.reservation.convert.success', {
        correlationId,
        reservationId,
        orderId,
        productId: reservation.productId,
        variantId: reservation.variantId,
        quantity: reservation.quantity,
        duration: Date.now() - startTime,
      });
    } catch (error) {
      await session.abortTransaction();
      
      this.logger.error('inventory.reservation.convert.error', error, {
        correlationId,
        reservationId,
        orderId,
        duration: Date.now() - startTime,
      });
      
      throw error;
    } finally {
      session.endSession();
    }
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
      
      // Lookup reservations for each variant
      {
        $lookup: {
          from: 'inventoryreservations',
          let: {
            productId: { $toString: '$_id' },
            variantId: '$variants.variantId'
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$productId', '$$productId'] },
                    { $eq: ['$variantId', '$$variantId'] },
                    { $gt: ['$expiresAt', new Date()] }
                  ]
                }
              }
            },
            {
              $group: {
                _id: null,
                totalReserved: { $sum: '$quantity' }
              }
            }
          ],
          as: 'reservations'
        }
      },
      
      // Calculate available stock and stock status
      {
        $addFields: {
          totalReserved: {
            $ifNull: [{ $first: '$reservations.totalReserved' }, 0]
          },
          availableStock: {
            $subtract: [
              '$variants.inventory',
              { $ifNull: [{ $first: '$reservations.totalReserved' }, 0] }
            ]
          },
          stockValue: {
            $multiply: ['$variants.inventory', '$variants.price']
          }
        }
      },
      
      // Categorize stock status
      {
        $addFields: {
          isOutOfStock: { $lte: ['$availableStock', 0] },
          isLowStock: {
            $and: [
              { $gt: ['$availableStock', 0] },
              { $lte: ['$availableStock', '$lowStockThreshold'] }
            ]
          }
        }
      },
      
      // Group and calculate totals
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalValue: { $sum: '$stockValue' },
          outOfStockCount: {
            $sum: { $cond: ['$isOutOfStock', 1, 0] }
          },
          lowStockCount: {
            $sum: { $cond: ['$isLowStock', 1, 0] }
          },
          totalReserved: {
            $sum: { $ifNull: ['$variants.reservedInventory', 0] }
          }
        }
      }
    ];

    const results = await Product.aggregate(pipeline as mongoose.PipelineStage[]);
    const metrics = results[0] || {
      totalProducts: 0,
      totalValue: 0,
      outOfStockCount: 0,
      lowStockCount: 0,
      totalReserved: 0,
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
            $multiply: ['$variants.inventory', '$variants.price']
          }
        }
      },
      
      // Sum all variant values
      {
        $group: {
          _id: null,
          totalValue: { $sum: '$variantValue' }
        }
      }
    ];

    const results = await Product.aggregate(pipeline);
    return results[0]?.totalValue || 0;
  }

  async getOutOfStockProducts() {
    // Try to get from cache first
    const cached = await this.cacheService.get<Array<{
      productId: string;
      productName: string;
      variantId: string;
      variantDetails: string;
      lastInStock?: Date;
    }>>(CACHE_KEYS.OUT_OF_STOCK_PRODUCTS);
    if (cached) {
      return cached;
    }

    const pipeline = [
      // Match active products that don't allow backorder
      { 
        $match: { 
          isDeleted: { $ne: true },
          allowBackorder: { $ne: true }
        } 
      },
      
      // Unwind variants
      { $unwind: '$variants' },
      
      // Lookup reservations
      {
        $lookup: {
          from: 'inventoryreservations',
          let: {
            productId: { $toString: '$_id' },
            variantId: '$variants.variantId'
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$productId', '$$productId'] },
                    { $eq: ['$variantId', '$$variantId'] },
                    { $gt: ['$expiresAt', new Date()] }
                  ]
                }
              }
            },
            {
              $group: {
                _id: null,
                totalReserved: { $sum: '$quantity' }
              }
            }
          ],
          as: 'reservations'
        }
      },
      
      // Calculate available stock
      {
        $addFields: {
          availableStock: {
            $subtract: [
              '$variants.inventory',
              { $ifNull: [{ $first: '$reservations.totalReserved' }, 0] }
            ]
          }
        }
      },
      
      // Filter for out of stock items
      { $match: { availableStock: { $lte: 0 } } },
      
      // Lookup last in-stock date from history
      {
        $lookup: {
          from: 'inventoryhistories',
          let: {
            productId: { $toString: '$_id' },
            variantId: '$variants.variantId'
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$productId', '$$productId'] },
                    { $eq: ['$variantId', '$$variantId'] },
                    { $gt: ['$newQuantity', 0] }
                  ]
                }
              }
            },
            { $sort: { timestamp: -1 } },
            { $limit: 1 }
          ],
          as: 'lastInStockHistory'
        }
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
                  { $ifNull: ['$variants.color', ''] }
                ]
              }
            }
          },
          lastInStock: { $first: '$lastInStockHistory.timestamp' }
        }
      }
    ];

    const results = await Product.aggregate(pipeline as mongoose.PipelineStage[]);
    
    // Cache the results
    await this.cacheService.set(CACHE_KEYS.OUT_OF_STOCK_PRODUCTS, results, CACHE_TTL.OUT_OF_STOCK);
    
    return results;
  }


  async getInventoryTurnover(
    dateRange: { start: Date; end: Date }
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

    const results = await InventoryHistory.aggregate(pipeline);
    
    return results.map(item => ({
      ...item,
      period: dateRange,
    })) as InventoryTurnoverData[];
  }


  private async invalidateInventoryCache(productId: string, variantId?: string): Promise<void> {
    // Invalidate specific product inventory cache
    await this.cacheService.del(CACHE_KEYS.PRODUCT_INVENTORY(productId, variantId));
    
    // Invalidate general metrics that might be affected
    await this.cacheService.del(CACHE_KEYS.INVENTORY_METRICS);
    await this.cacheService.del(`${CACHE_KEYS.LOW_STOCK_PRODUCTS}:default`);
    await this.cacheService.del(CACHE_KEYS.OUT_OF_STOCK_PRODUCTS);
    
    // Also invalidate any threshold-specific low stock caches
    // In a production system, you might want to track these keys more precisely
    const thresholds = [5, 10, 20, 50]; // Common thresholds
    for (const threshold of thresholds) {
      await this.cacheService.del(`${CACHE_KEYS.LOW_STOCK_PRODUCTS}:${threshold}`);
    }
  }
}

export const inventoryService = new InventoryService();