import mongoose from 'mongoose';
import { Product } from '../models/product.model.js';
import { IUserDocument } from '../models/user.model.js';
import { AppError } from '../utils/AppError.js';
import { inventoryService } from './inventory.service.js';
import type { CartProductWithQuantity } from '../types/cart-types.js';

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

interface CartAdjustment {
  productId: string;
  productName: string;
  variantDetails?: string;
  requestedQuantity: number;
  adjustedQuantity: number;
  availableStock: number;
  removed: boolean;
}

export class CartService {
  async getCartProducts(user: IUserDocument): Promise<CartProductWithQuantity[]> {
    // Group by unique products to minimize queries
    const productMap = new Map<string, { variantIds: Set<string>, cartItems: typeof user.cartItems[0][] }>();
    
    user.cartItems.forEach(item => {
      const productId = String(item.product);
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
        slug: 1,
      },
    ).lean() as unknown as {
      _id: mongoose.Types.ObjectId;
      name: string;
      description: string;
      price: number;
      image: string;
      collectionId?: mongoose.Types.ObjectId;
      isFeatured: boolean;
      slug?: string;
      variants?: {
        variantId: string;
        label?: string;
        size?: string;
        color?: string;
        price: number;
        sku?: string;
      }[];
    }[];

    const cartItems: CartProductWithQuantity[] = [];
    
    // Process each cart item to ensure we handle all items including different variants
    for (const cartItem of user.cartItems) {
      const product = products.find(p => {
        // MongoDB ObjectId has toString() method
        return String(p._id) === String(cartItem.product);
      });
      
      if (!product) {
        // Skip if product not found (might have been deleted)
        continue;
      }
      
      const productIdStr = String(product._id);
      
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
        slug: product.slug,
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
      // Normalize variantId to handle undefined/null/empty string consistently
      const normalizedVariantId = variantId ?? undefined;
      
      // Lock the product document for update
      const product = await Product.findById(productId).session(session);
      if (!product) {
        throw new AppError('Product not found', 404);
      }

      let variantDetails: CartItem['variantDetails'] | undefined;
      
      // If variantId is provided, validate and get variant details
      if (normalizedVariantId) {
        const variant = product.variants?.find(v => v.variantId === normalizedVariantId);
        if (!variant) {
          throw new AppError(`Variant with ID ${normalizedVariantId} not found for this product`, 404);
        }
        
        // Check if variant is in stock
        const availableStock = await inventoryService.getAvailableInventory(
          productId,
          normalizedVariantId,
        );
        
        if (availableStock === 0) {
          throw new AppError(
            `${variant.label ?? 'This variant'} is currently out of stock`,
            400,
          );
        }
        
        variantDetails = {
          label: variantLabel ?? variant.label,
          size: variant.size,
          color: variant.color,
          price: variant.price,
          sku: variant.sku,
        };
      } else {
        // Check base product inventory
        const availableStock = await inventoryService.getAvailableInventory(productId);
        
        if (availableStock === 0) {
          throw new AppError('This product is currently out of stock', 400);
        }
      }

      // Find existing item with same product and variant combination
      const existingItem = user.cartItems.find((item) => {
        const itemVariantId = item.variantId ?? undefined;
        return String(item.product) === productId && itemVariantId === normalizedVariantId;
      });

      if (existingItem) {
        // Check if we can add one more
        const newQuantity = existingItem.quantity + 1;
        const availableStock = await inventoryService.getAvailableInventory(
          productId,
          normalizedVariantId,
        );
        
        if (availableStock < newQuantity) {
          throw new AppError(
            `Cannot add more items. Only ${availableStock} available in stock`,
            400,
          );
        }
        
        // Update quantity for existing item
        existingItem.quantity = newQuantity;
      } else {
        // Add new item to cart
        user.cartItems.push({ 
          product: new mongoose.Types.ObjectId(productId), 
          quantity: 1,
          variantId: normalizedVariantId,
          variantDetails,
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
        // Clear entire cart
        user.cartItems = [];
      } else {
        // Normalize variantId to handle undefined/null/empty string consistently
        const normalizedVariantId = variantId ?? undefined;
        
        // Remove items from cart
        user.cartItems = user.cartItems.filter((item) => {
          const itemVariantId = item.variantId ?? undefined;
          const matchesProduct = String(item.product) === productId;
          return !(matchesProduct && itemVariantId === normalizedVariantId);
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
      // Normalize variantId to handle undefined/null/empty string consistently
      const normalizedVariantId = variantId ?? undefined;
      
      const existingItem = user.cartItems.find((item) => {
        const itemVariantId = item.variantId ?? undefined;
        return String(item.product) === productId && itemVariantId === normalizedVariantId;
      });

      if (!existingItem) {
        throw new AppError('Product not found in cart', 404);
      }

      if (quantity === 0) {
        // Remove item if quantity is 0
        user.cartItems = user.cartItems.filter((item) => {
          const itemVariantId = item.variantId ?? undefined;
          const matchesProduct = String(item.product) === productId;
          return !(matchesProduct && itemVariantId === normalizedVariantId);
        });
      } else {
        // Check inventory availability for the new quantity
        const availableStock = await inventoryService.getAvailableInventory(
          productId,
          normalizedVariantId,
        );
        
        if (availableStock < quantity) {
          throw new AppError(
            `Cannot update quantity to ${quantity}. Only ${availableStock} available in stock`,
            400,
          );
        }
        
        // Update quantity
        existingItem.quantity = quantity;
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

  async validateCartInventory(user: IUserDocument): Promise<CartAdjustment[]> {
    const adjustments: CartAdjustment[] = [];
    
    // Get product details for all cart items
    const productIds = user.cartItems.map(item => item.product);
    const products = await Product.find({ _id: { $in: productIds } });
    
    // Create a map for quick product lookup
    const productMap = new Map(products.map(p => [String(p._id), p]));
    
    for (const cartItem of user.cartItems) {
      const product = productMap.get(String(cartItem.product));
      if (!product) {
        // Product no longer exists
        adjustments.push({
          productId: String(cartItem.product),
          productName: 'Product not found',
          variantDetails: undefined,
          requestedQuantity: cartItem.quantity,
          adjustedQuantity: 0,
          availableStock: 0,
          removed: true,
        });
        continue;
      }
      
      // Get available inventory
      const availableStock = await inventoryService.getAvailableInventory(
        String(product._id),
        cartItem.variantId,
      );
      
      // Build variant details string for display
      let variantDetails: string | undefined;
      if (cartItem.variantId && cartItem.variantDetails) {
        const details = [];
        if (cartItem.variantDetails.size) details.push(`Size: ${cartItem.variantDetails.size}`);
        if (cartItem.variantDetails.color) details.push(`Color: ${cartItem.variantDetails.color}`);
        variantDetails = details.length > 0 ? details.join(', ') : cartItem.variantDetails.label;
      }
      
      if (availableStock === 0) {
        adjustments.push({
          productId: String(product._id),
          productName: product.name,
          variantDetails,
          requestedQuantity: cartItem.quantity,
          adjustedQuantity: 0,
          availableStock: 0,
          removed: true,
        });
      } else if (availableStock < cartItem.quantity) {
        adjustments.push({
          productId: String(product._id),
          productName: product.name,
          variantDetails,
          requestedQuantity: cartItem.quantity,
          adjustedQuantity: availableStock,
          availableStock,
          removed: false,
        });
      }
    }
    
    return adjustments;
  }

  async adjustCartToAvailableInventory(user: IUserDocument): Promise<CartAdjustment[]> {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const adjustments: CartAdjustment[] = [];
      
      // Get product details for all cart items
      const productIds = user.cartItems.map(item => item.product);
      const products = await Product.find({ _id: { $in: productIds } }).session(session);
      
      // Create a map for quick product lookup
      const productMap = new Map(products.map(p => [String(p._id), p]));
      
      // Track items to keep after adjustment
      const itemsToKeep: typeof user.cartItems = [];
      
      for (const cartItem of user.cartItems) {
        const product = productMap.get(String(cartItem.product));
        if (!product) {
          // Product no longer exists, skip it
          continue;
        }
        
        // Get available inventory
        const availableStock = await inventoryService.getAvailableInventory(
          String(product._id),
          cartItem.variantId,
        );
        
        // Build variant details string for display
        let variantDetails: string | undefined;
        if (cartItem.variantId && cartItem.variantDetails) {
          const details = [];
          if (cartItem.variantDetails.size) details.push(`Size: ${cartItem.variantDetails.size}`);
          if (cartItem.variantDetails.color) details.push(`Color: ${cartItem.variantDetails.color}`);
          variantDetails = details.length > 0 ? details.join(', ') : cartItem.variantDetails.label;
        }
        
        if (availableStock === 0) {
          // Remove item completely
          adjustments.push({
            productId: String(product._id),
            productName: product.name,
            variantDetails,
            requestedQuantity: cartItem.quantity,
            adjustedQuantity: 0,
            availableStock: 0,
            removed: true,
          });
        } else if (availableStock < cartItem.quantity) {
          // Adjust quantity down
          adjustments.push({
            productId: String(product._id),
            productName: product.name,
            variantDetails,
            requestedQuantity: cartItem.quantity,
            adjustedQuantity: availableStock,
            availableStock,
            removed: false,
          });
          
          cartItem.quantity = availableStock;
          itemsToKeep.push(cartItem);
        } else {
          // Quantity is fine, keep as is
          itemsToKeep.push(cartItem);
        }
      }
      
      // Update user's cart with adjusted items
      user.cartItems = itemsToKeep;
      await user.save({ session });
      await session.commitTransaction();
      
      return adjustments;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }
  }
}

export const cartService = new CartService();