import mongoose from 'mongoose';
import { Product } from '../models/product.model.js';
import { IUserDocument } from '../models/user.model.js';
import { AppError } from '../utils/AppError.js';
import { inventoryService } from './inventory.service.js';

interface CartItem {
  product: mongoose.Types.ObjectId;
  quantity: number;
  variantId?: string;
  variantDetails?: {
    label?: string;
    size?: string;
    color?: string;
    price: number;
    sku?: string;
  };
  reservationId?: string;
}

interface CartProductWithQuantity {
  _id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  collectionId?: mongoose.Types.ObjectId;
  isFeatured: boolean;
  quantity: number;
  variantId?: string;
  variantDetails?: {
    label?: string;
    size?: string;
    color?: string;
    price: number;
    sku?: string;
  };
}

export interface CartResponse {
  cartItems: CartProductWithQuantity[];
  subtotal: number;
  totalAmount: number;
  appliedCoupon: {
    code: string;
    discountPercentage: number;
  } | null;
}

export class CartService {
  async clearCartReservations(user: IUserDocument): Promise<void> {
    const sessionId = user._id.toString();
    await inventoryService.releaseSessionReservations(sessionId);
    
    // Also clear reservation IDs from cart items
    for (const item of user.cartItems) {
      item.reservationId = undefined;
    }
  }
  async getCartProducts(user: IUserDocument): Promise<CartProductWithQuantity[]> {
    // Group by unique products to minimize queries
    const productMap = new Map<string, { variantIds: Set<string>, cartItems: typeof user.cartItems[0][] }>();
    
    user.cartItems.forEach(item => {
      const productId = item.product.toString();
      if (!productMap.has(productId)) {
        productMap.set(productId, { variantIds: new Set(), cartItems: [] });
      }
      const data = productMap.get(productId);
      if (!data) return; // This should never happen due to the check above
      if (item.variantId) {
        data.variantIds.add(item.variantId);
      }
      data.cartItems.push(item);
    });
    
    // Fetch products with only required fields
    const products = await Product.find(
      { _id: { $in: Array.from(productMap.keys()) } },
      {
        name: 1,
        description: 1,
        price: 1,
        image: 1,
        collectionId: 1,
        isFeatured: 1,
        variants: 1,
      },
    ).lean();

    const cartItems: CartProductWithQuantity[] = [];
    
    // Process each cart item to ensure we handle all items including different variants
    for (const cartItem of user.cartItems) {
      const product = products.find(p => p._id.toString() === cartItem.product.toString());
      
      if (!product) {
        // Skip if product not found (might have been deleted)
        continue;
      }
      
      const productIdStr = product._id.toString();
      
      // Get the base price, or use variant price if available
      let price = product.price;
      let variantDetails: CartItem['variantDetails'] = cartItem.variantDetails;
      
      // If variantId is specified but no cached details, fetch variant info
      if (cartItem.variantId && !variantDetails) {
        const variant = product.variants?.find(v => v.variantId === cartItem.variantId);
        if (variant) {
          variantDetails = {
            label: variant.label,
            size: variant.size,
            color: variant.color,
            price: variant.price,
            sku: variant.sku,
          };
          price = variant.price;
        }
      } else if (variantDetails) {
        price = variantDetails.price;
      }
      
      cartItems.push({
        _id: productIdStr,
        name: product.name,
        description: product.description,
        price,
        image: product.image,
        collectionId: product.collectionId,
        isFeatured: product.isFeatured,
        quantity: cartItem.quantity,
        variantId: cartItem.variantId,
        variantDetails,
      });
    }

    return cartItems;
  }

  async calculateCartTotals(user: IUserDocument): Promise<CartResponse> {
    const cartItems = await this.getCartProducts(user);
    
    const subtotal = cartItems.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);

    let totalAmount = subtotal;
    
    if (user.appliedCoupon) {
      const discount = subtotal * (user.appliedCoupon.discountPercentage / 100);
      totalAmount = subtotal - discount;
    }

    return {
      cartItems,
      subtotal: Math.round(subtotal * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
      appliedCoupon: user.appliedCoupon,
    };
  }

  async addToCart(user: IUserDocument, productId: string, variantId?: string, variantLabel?: string): Promise<CartItem[]> {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Lock the product document for update
      const product = await Product.findById(productId).session(session);
      if (!product) {
        throw new AppError('Product not found', 404);
      }

      let variantDetails: CartItem['variantDetails'] | undefined;
      
      // If variantId is provided, validate and get variant details
      if (variantId) {
        const variant = product.variants?.find(v => v.variantId === variantId);
        if (!variant) {
          throw new AppError(`Variant with ID ${variantId} not found for this product`, 404);
        }
        
        variantDetails = {
          label: variantLabel ?? variant.label,
          size: variant.size,
          color: variant.color,
          price: variant.price,
          sku: variant.sku,
        };
      }

      // Generate session ID for cart (use user ID for logged-in users)
      const sessionId = user._id.toString();

      // Find existing item with same product and variant combination
      const existingItem = user.cartItems.find(
        (item) => item.product.toString() === productId && item.variantId === variantId,
      );

      if (existingItem) {
        // Update quantity for existing item
        const newQuantity = existingItem.quantity + 1;
        
        // Check availability using inventory service
        const isAvailable = await inventoryService.checkAvailability(
          productId,
          variantId,
          newQuantity,
        );
        
        if (!isAvailable) {
          const availableStock = await inventoryService.getAvailableInventory(
            productId,
            variantId,
          );
          throw new AppError(`Cannot add more items. Only ${availableStock} available in stock`, 400);
        }
        
        // Update or create reservation
        if (existingItem.reservationId) {
          // Release old reservation and create new one with updated quantity
          await inventoryService.releaseReservation(existingItem.reservationId);
        }
        
        const reservationResult = await inventoryService.reserveInventory(
          productId,
          variantId,
          newQuantity,
          sessionId,
          30 * 60 * 1000, // 30 minutes
          user._id.toString(),
        );
        
        if (!reservationResult.success) {
          throw new AppError(reservationResult.message ?? 'Failed to reserve inventory', 400);
        }
        
        existingItem.quantity = newQuantity;
        existingItem.reservationId = reservationResult.reservationId;
      } else {
        // For new items, create reservation
        const reservationResult = await inventoryService.reserveInventory(
          productId,
          variantId,
          1,
          sessionId,
          30 * 60 * 1000, // 30 minutes
          user._id.toString(),
        );
        
        if (!reservationResult.success) {
          throw new AppError(reservationResult.message ?? 'Product out of stock', 400);
        }
        
        user.cartItems.push({ 
          product: new mongoose.Types.ObjectId(productId), 
          quantity: 1,
          variantId,
          variantDetails,
          reservationId: reservationResult.reservationId,
        });
      }

      await user.save({ session });
      await session.commitTransaction();
      
      return user.cartItems;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async removeFromCart(user: IUserDocument, productId?: string, variantId?: string): Promise<CartItem[]> {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      if (!productId) {
        // Clear entire cart and release all reservations
        for (const item of user.cartItems) {
          if (item.reservationId) {
            await inventoryService.releaseReservation(item.reservationId);
          }
        }
        user.cartItems = [];
      } else {
        // Find items to remove and release their reservations
        const itemsToRemove = user.cartItems.filter((item) => {
          const matchesProduct = item.product.toString() === productId;
          // If variantId is specified, match both product and variant
          // If no variantId, only remove items without variantId (backward compatibility)
          if (variantId !== undefined) {
            return matchesProduct && item.variantId === variantId;
          } else {
            return matchesProduct && !item.variantId;
          }
        });
        
        // Release reservations for items being removed
        for (const item of itemsToRemove) {
          if (item.reservationId) {
            await inventoryService.releaseReservation(item.reservationId);
          }
        }
        
        // Remove items from cart
        user.cartItems = user.cartItems.filter((item) => {
          const matchesProduct = item.product.toString() === productId;
          if (variantId !== undefined) {
            return !(matchesProduct && item.variantId === variantId);
          } else {
            return !(matchesProduct && !item.variantId);
          }
        });
      }
      
      await user.save({ session });
      await session.commitTransaction();
      
      return user.cartItems;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async updateQuantity(user: IUserDocument, productId: string, quantity: number, variantId?: string): Promise<CartItem[]> {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const existingItem = user.cartItems.find((item) => 
        item.product.toString() === productId && item.variantId === variantId,
      );

      if (!existingItem) {
        throw new AppError('Product not found in cart', 404);
      }

      const sessionId = user._id.toString();

      if (quantity === 0) {
        // Release reservation and remove item
        if (existingItem.reservationId) {
          await inventoryService.releaseReservation(existingItem.reservationId);
        }
        
        // Remove item if quantity is 0
        user.cartItems = user.cartItems.filter((item) => {
          const matchesProduct = item.product.toString() === productId;
          if (variantId !== undefined) {
            return !(matchesProduct && item.variantId === variantId);
          } else {
            return !(matchesProduct && !item.variantId);
          }
        });
      } else {
        // Check availability for new quantity
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
          throw new AppError(`Cannot update quantity. Only ${availableStock} available in stock`, 400);
        }
        
        // Release old reservation if exists
        if (existingItem.reservationId) {
          await inventoryService.releaseReservation(existingItem.reservationId);
        }
        
        // Create new reservation with updated quantity
        const reservationResult = await inventoryService.reserveInventory(
          productId,
          variantId,
          quantity,
          sessionId,
          30 * 60 * 1000, // 30 minutes
          user._id.toString(),
        );
        
        if (!reservationResult.success) {
          throw new AppError(reservationResult.message ?? 'Failed to reserve inventory', 400);
        }
        
        existingItem.quantity = quantity;
        existingItem.reservationId = reservationResult.reservationId;
      }

      await user.save({ session });
      await session.commitTransaction();
      
      return user.cartItems;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }
}

export const cartService = new CartService();