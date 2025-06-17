import { Response } from 'express';
import { AuthRequest } from '../types/express.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import { Product } from '../models/product.model.js';




export const getCartProducts = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const productIds = user.cartItems.map((item: any) => item.product);
  const products = await Product.find({ _id: { $in: productIds } });

  const cartItems = products.map((product: any) => {
    const item = user.cartItems.find((cartItem: any) => cartItem.product.toString() === (product._id as string));
    return { ...product.toJSON(), quantity: item?.quantity || 0 };
  });

  res.json(cartItems);
});

export const addToCart = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { productId } = req.body;
  const user = req.user!;
  
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
    user.cartItems.push({ product: productId, quantity: 1 });
  }

  await user.save();
  res.json({ cartItems: user.cartItems });
});

export const removeAllFromCart = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { productId } = req.body;
  const user = req.user!;
  
  if (!productId) {
    user.cartItems = [];
  } else {
    user.cartItems = user.cartItems.filter((item: any) => item.product.toString() !== productId);
  }
  
  await user.save();
  res.json(user.cartItems);
});

export const updateQuantity = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id: productId } = req.params;
  const { quantity } = req.body;
  const user = req.user!;
  
  const existingItem = user.cartItems.find((item: any) => item.product.toString() === productId);

  if (existingItem) {
    if (quantity === 0) {
      user.cartItems = user.cartItems.filter((item: any) => item.product.toString() !== productId);
      await user.save();
      res.json(user.cartItems);
      return;
    }

    existingItem.quantity = quantity;
    await user.save();
    res.json(user.cartItems);
  } else {
    throw new AppError('Product not found', 404);
  }
});
