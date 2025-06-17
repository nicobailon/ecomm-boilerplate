import { Product } from '../models/product.model.js';
import { IUserDocument } from '../models/user.model.js';
import { AppError } from '../utils/AppError.js';

interface CartItem {
  product: any;
  quantity: number;
}

interface CartProductWithQuantity {
  _id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  isFeatured: boolean;
  quantity: number;
}

export class CartService {
  async getCartProducts(user: IUserDocument): Promise<CartProductWithQuantity[]> {
    const productIds = user.cartItems.map((item: any) => item.product);
    const products = await Product.find({ _id: { $in: productIds } });

    const cartItems = products.map((product: any) => {
      const item = user.cartItems.find((cartItem: any) => cartItem.product.toString() === product._id.toString());
      return { ...product.toJSON(), quantity: item?.quantity || 0 };
    });

    return cartItems;
  }

  async addToCart(user: IUserDocument, productId: string): Promise<CartItem[]> {
    const product = await Product.findById(productId);
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    const existingItem = user.cartItems.find(
      (item: any) => item.product.toString() === productId
    );

    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      user.cartItems.push({ product: productId as any, quantity: 1 });
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
      user.cartItems = user.cartItems.filter((item: any) => item.product.toString() !== productId);
    }
    
    await user.save();
    return user.cartItems;
  }

  async updateQuantity(user: IUserDocument, productId: string, quantity: number): Promise<CartItem[]> {
    const existingItem = user.cartItems.find((item: any) => item.product.toString() === productId);

    if (!existingItem) {
      throw new AppError('Product not found in cart', 404);
    }

    if (quantity === 0) {
      // Remove item if quantity is 0
      user.cartItems = user.cartItems.filter((item: any) => item.product.toString() !== productId);
    } else {
      existingItem.quantity = quantity;
    }

    await user.save();
    return user.cartItems;
  }
}

export const cartService = new CartService();