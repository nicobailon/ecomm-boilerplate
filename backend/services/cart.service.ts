import mongoose from 'mongoose';
import { Product } from '../models/product.model.js';
import { IUserDocument } from '../models/user.model.js';
import { AppError } from '../utils/AppError.js';

interface CartItem {
  product: mongoose.Types.ObjectId;
  quantity: number;
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
  async getCartProducts(user: IUserDocument): Promise<CartProductWithQuantity[]> {
    const productIds = user.cartItems.map((item) => item.product);
    const products = await Product.find({ _id: { $in: productIds } });

    const cartItems = products.map((product) => {
      const productIdStr = (product._id as mongoose.Types.ObjectId).toString();
      const item = user.cartItems.find((cartItem) => cartItem.product.toString() === productIdStr);
      return {
        _id: productIdStr,
        name: product.name,
        description: product.description,
        price: product.price,
        image: product.image,
        collectionId: product.collectionId,
        isFeatured: product.isFeatured,
        quantity: item?.quantity ?? 0,
      };
    });

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

  async addToCart(user: IUserDocument, productId: string): Promise<CartItem[]> {
    const product = await Product.findById(productId);
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    const existingItem = user.cartItems.find(
      (item) => item.product.toString() === productId,
    );

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      user.cartItems.push({ product: new mongoose.Types.ObjectId(productId), quantity: 1 });
    }

    await user.save();
    return user.cartItems;
  }

  async removeFromCart(user: IUserDocument, productId?: string): Promise<CartItem[]> {
    if (!productId) {
      // Clear entire cart
      user.cartItems = [];
    } else {
      // Remove specific product
      user.cartItems = user.cartItems.filter((item) => item.product.toString() !== productId);
    }
    
    await user.save();
    return user.cartItems;
  }

  async updateQuantity(user: IUserDocument, productId: string, quantity: number): Promise<CartItem[]> {
    const existingItem = user.cartItems.find((item) => item.product.toString() === productId);

    if (!existingItem) {
      throw new AppError('Product not found in cart', 404);
    }

    if (quantity === 0) {
      // Remove item if quantity is 0
      user.cartItems = user.cartItems.filter((item) => item.product.toString() !== productId);
    } else {
      existingItem.quantity = quantity;
    }

    await user.save();
    return user.cartItems;
  }
}

export const cartService = new CartService();