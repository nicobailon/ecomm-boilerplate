import { Request, Response, NextFunction } from 'express';
import { inventoryService } from '../services/inventory.service.js';
import { websocketService } from '../lib/websocket.js';
import { AppError } from '../utils/AppError.js';
import { createLogger } from '../utils/logger.js';
import type { CartValidation } from '../lib/websocket.js';

const logger = createLogger({ service: 'CartValidationMiddleware' });

interface CartItem {
  productId: string;
  variantId?: string;
  quantity: number;
  [key: string]: unknown;
}

interface ValidatedCartItem extends CartItem {
  requestedQuantity: number;
  availableQuantity: number;
  validated: boolean;
}

interface CartValidationRequest extends Request {
  validatedCart?: {
    items: ValidatedCartItem[];
    hasChanges: boolean;
    removedItems: number;
    reducedItems: number;
  };
  body: {
    cartItems?: CartItem[];
    productId?: string;
    variantId?: string;
    quantity?: number;
  };
  user?: {
    _id: {
      toString(): string;
    };
  };
}

/**
 * Middleware to validate cart items against real-time inventory
 * This prevents users from checking out with more items than available
 */
export const validateCartInventory = async (
  req: CartValidationRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { cartItems } = req.body;
    if (!cartItems || !Array.isArray(cartItems)) {
      return next();
    }

    const validatedItems: ValidatedCartItem[] = [];
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
          userId: req.user?._id?.toString(),
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
          userId: req.user?._id?.toString(),
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
  req: CartValidationRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { productId, variantId, quantity = 1 } = req.body;

    if (!productId) {
      throw new AppError('Product ID is required', 400);
    }

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
): void => {
  if (req.validatedCart?.hasChanges) {
    const originalJson = res.json.bind(res);
    res.json = function <T>(data: T): Response<T> {
      const validatedCart = req.validatedCart;
      if (!validatedCart) {
        return originalJson(data);
      }
      const { hasChanges, removedItems, reducedItems } = validatedCart;
      return originalJson({
        ...data,
        cartValidation: {
          hasChanges,
          removedItems,
          reducedItems,
          message: `Cart updated: ${removedItems} items removed, ${reducedItems} items reduced due to stock availability.`,
        },
      });
    };
  }
  next();
};