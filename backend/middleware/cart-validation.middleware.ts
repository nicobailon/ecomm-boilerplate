import { Request, Response, NextFunction } from 'express';
import { inventoryService } from '../services/inventory.service.js';
import { websocketService } from '../lib/websocket.js';
import { AppError } from '../utils/AppError.js';
import { createLogger } from '../utils/logger.js';
import type { CartValidation } from '../lib/websocket.js';

const logger = createLogger({ service: 'CartValidationMiddleware' });

interface CartValidationRequest extends Request {
  validatedCart?: {
    items: Array<{
      productId: string;
      variantId?: string;
      requestedQuantity: number;
      availableQuantity: number;
      validated: boolean;
    }>;
    hasChanges: boolean;
    removedItems: number;
    reducedItems: number;
  };
}

/**
 * Middleware to validate cart items against real-time inventory
 * This prevents users from checking out with more items than available
 */
export const validateCartInventory = async (
  req: CartValidationRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { cartItems } = req.body;
    if (!cartItems || !Array.isArray(cartItems)) {
      return next();
    }

    const validatedItems = [];
    let hasChanges = false;
    let removedItems = 0;
    let reducedItems = 0;

    for (const item of cartItems) {
      const availableStock = await inventoryService.getAvailableInventory(
        item.productId,
        item.variantId,
      );

      if (availableStock === 0) {
        // Item is out of stock - remove from cart
        hasChanges = true;
        removedItems++;

        // Notify user via WebSocket
        if (req.user?._id) {
          const validation: CartValidation = {
            userId: req.user._id.toString(),
            productId: item.productId,
            variantId: item.variantId,
            requestedQuantity: item.quantity,
            availableQuantity: 0,
            action: 'remove',
          };
          await websocketService.publishCartValidation(validation);
        }

        logger.info('cart.validation.item.removed', {
          userId: req.user?._id,
          productId: item.productId,
          variantId: item.variantId,
          requestedQuantity: item.quantity,
        });
      } else if (item.quantity > availableStock) {
        // Reduce quantity to available stock
        hasChanges = true;
        reducedItems++;

        validatedItems.push({
          ...item,
          requestedQuantity: item.quantity,
          availableQuantity: availableStock,
          quantity: availableStock,
          validated: true,
        });

        // Notify user via WebSocket
        if (req.user?._id) {
          const validation: CartValidation = {
            userId: req.user._id.toString(),
            productId: item.productId,
            variantId: item.variantId,
            requestedQuantity: item.quantity,
            availableQuantity: availableStock,
            action: 'reduce',
          };
          await websocketService.publishCartValidation(validation);
        }

        logger.info('cart.validation.quantity.reduced', {
          userId: req.user?._id,
          productId: item.productId,
          variantId: item.variantId,
          requestedQuantity: item.quantity,
          adjustedTo: availableStock,
        });
      } else {
        // Item is valid
        validatedItems.push({
          ...item,
          requestedQuantity: item.quantity,
          availableQuantity: availableStock,
          validated: true,
        });
      }
    }

    // Attach validated cart to request
    req.validatedCart = {
      items: validatedItems,
      hasChanges,
      removedItems,
      reducedItems,
    };

    // Update request body with validated items
    req.body.cartItems = validatedItems;

    next();
  } catch (error) {
    logger.error('Cart validation error', error);
    next(error);
  }
};

/**
 * Middleware to check inventory before adding to cart
 * Prevents adding items that are already out of stock
 */
export const validateAddToCart = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { productId, variantId, quantity = 1 } = req.body;

    const isAvailable = await inventoryService.checkAvailability(
      productId,
      variantId,
      quantity,
    );

    if (!isAvailable) {
      const availableStock = await inventoryService.getAvailableInventory(
        productId,
        variantId,
      );

      throw new AppError(
        `Cannot add to cart. Only ${availableStock} items available.`,
        400,
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Response interceptor to include validation warnings
 */
export const includeCartValidationWarnings = (
  req: CartValidationRequest,
  res: Response,
  next: NextFunction,
) => {
  if (req.validatedCart?.hasChanges) {
    const originalJson = res.json.bind(res);
    res.json = function (data: any) {
      return originalJson({
        ...data,
        cartValidation: {
          hasChanges: req.validatedCart!.hasChanges,
          removedItems: req.validatedCart!.removedItems,
          reducedItems: req.validatedCart!.reducedItems,
          message: `Cart updated: ${req.validatedCart!.removedItems} items removed, ${req.validatedCart!.reducedItems} items reduced due to stock availability.`,
        },
      });
    };
  }
  next();
};