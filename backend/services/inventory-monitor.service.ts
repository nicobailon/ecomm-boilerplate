import mongoose from 'mongoose';
import { websocketService } from '../lib/websocket.js';
import { CacheService } from './cache.service.js';
import { createLogger } from '../utils/logger.js';
import { Product } from '../models/product.model.js';
import { User } from '../models/user.model.js';
import type { InventoryUpdate, CartValidation } from '../lib/websocket.js';

const logger = createLogger({ service: 'InventoryMonitor' });
const cacheService = new CacheService();

const CACHE_KEY = 'inventory:snapshot';
const MONITOR_INTERVAL = 5000; // 5 seconds

export class InventoryMonitorService {
  private monitorInterval: NodeJS.Timeout | null = null;
  private isMonitoring = false;

  async startMonitoring(): Promise<void> {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    logger.info('Starting inventory monitoring');

    // Start periodic inventory checks
    this.monitorInterval = setInterval(() => {
      void this.checkInventoryChanges();
    }, MONITOR_INTERVAL);

    // Do initial check
    await this.checkInventoryChanges();
  }

  stopMonitoring(): void {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }

    this.isMonitoring = false;
    logger.info('Stopped inventory monitoring');
  }

  private async checkInventoryChanges(): Promise<void> {
    try {
      // Get current inventory snapshot
      const currentSnapshot = await this.getInventorySnapshot();
      
      // Get previous snapshot from cache
      const previousSnapshot = await cacheService.get<typeof currentSnapshot>(CACHE_KEY);
      
      if (previousSnapshot) {
        // Compare snapshots and broadcast changes
        await this.compareAndBroadcast(previousSnapshot, currentSnapshot);
      }
      
      // Save current snapshot
      await cacheService.set(CACHE_KEY, currentSnapshot, 60); // Cache for 1 minute
    } catch (error) {
      logger.error('Error checking inventory changes', error);
    }
  }

  private async getInventorySnapshot(): Promise<Record<string, {
    productId: string;
    variants: Record<string, {
      inventory: number;
      available: number;
    }>;
  }>> {
    const products = await Product.find(
      { isDeleted: { $ne: true } },
      { 
        _id: 1, 
        variants: 1, 
        lowStockThreshold: 1,
        allowBackorder: 1,
      },
    ).lean() as unknown as {
      _id: mongoose.Types.ObjectId;
      variants?: {
        variantId: string;
        inventory: number;
      }[];
      lowStockThreshold?: number;
      allowBackorder?: boolean;
    }[];

    const snapshot: Record<string, {
      productId: string;
      variants: Record<string, {
        inventory: number;
        available: number;
      }>;
    }> = {};

    for (const product of products) {
      const productId = String(product._id);
      snapshot[productId] = {
        productId,
        variants: {},
      };

      if (product.variants && product.variants.length > 0) {
        for (const variant of product.variants) {
          // In the Shopify-like model, available = inventory (no reservations)
          const available = variant.inventory;
          
          snapshot[productId].variants[variant.variantId] = {
            inventory: variant.inventory,
            available,
          };
        }
      }
    }

    return snapshot;
  }

  private async compareAndBroadcast(
    previous: Record<string, {
      productId: string;
      variants: Record<string, {
        inventory: number;
        available: number;
      }>;
    }>,
    current: Record<string, {
      productId: string;
      variants: Record<string, {
        inventory: number;
        available: number;
      }>;
    }>,
  ): Promise<void> {
    const updates: InventoryUpdate[] = [];

    for (const productId in current) {
      const currentProduct = current[productId];
      const previousProduct = previous[productId];

      if (!previousProduct) continue;

      for (const variantId in currentProduct.variants) {
        const currentVariant = currentProduct.variants[variantId];
        const previousVariant = previousProduct.variants?.[variantId];

        if (!previousVariant) continue;

        // Check if inventory changed
        if (currentVariant.inventory !== previousVariant.inventory) {
          const update: InventoryUpdate = {
            productId,
            variantId,
            availableStock: currentVariant.available,
            totalStock: currentVariant.inventory,
            stockStatus: this.getStockStatus(
              currentVariant.available,
              currentVariant.inventory,
            ),
            timestamp: Date.now(),
          };

          updates.push(update);

          // Broadcast the update
          await websocketService.publishInventoryUpdate(update);

          // Check if we need to validate any carts
          if (currentVariant.available < previousVariant.available) {
            await this.validateAffectedCarts(productId, variantId, currentVariant.available);
          }
        }
      }
    }

    if (updates.length > 0) {
      logger.info('inventory.changes.detected', {
        updateCount: updates.length,
        updates: updates.map(u => ({
          productId: u.productId,
          variantId: u.variantId,
          available: u.availableStock,
        })),
      });
    }
  }

  private getStockStatus(available: number, total: number): InventoryUpdate['stockStatus'] {
    if (available === 0) return 'out_of_stock';
    if (available <= 5 || available <= total * 0.2) return 'low_stock';
    return 'in_stock';
  }

  private async validateAffectedCarts(
    productId: string,
    variantId: string,
    availableStock: number,
  ): Promise<void> {
    // Find all users with this item in their cart
    const affectedUsers = await User.find({
      'cartItems.product': productId,
      'cartItems.variantId': variantId,
    }).select('_id cartItems');

    for (const user of affectedUsers) {
      const cartItem = user.cartItems.find(
        item => String(item.product) === productId && item.variantId === variantId,
      );

      if (!cartItem) continue;

      // Check if cart quantity exceeds available stock
      if (cartItem.quantity > availableStock) {
        const validation: CartValidation = {
          userId: String(user._id),
          productId,
          variantId,
          requestedQuantity: cartItem.quantity,
          availableQuantity: availableStock,
          action: availableStock === 0 ? 'remove' : 'reduce',
        };

        // Notify the user's session
        await websocketService.publishCartValidation(validation);

        logger.info('cart.validation.required', {
          userId: String(user._id),
          productId,
          variantId,
          requestedQuantity: cartItem.quantity,
          availableQuantity: availableStock,
          action: validation.action,
        });
      }
    }
  }
}

export const inventoryMonitor = new InventoryMonitorService();