import { Response } from 'express';
import { AuthRequest } from '../types/express.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { cartService } from '../services/cart.service.js';




export const getCartProducts = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const cartItems = await cartService.getCartProducts(user);
  res.json(cartItems);
});

export const addToCart = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { productId } = req.body;
  const user = req.user!;
  
  const cartItems = await cartService.addToCart(user, productId);
  res.json({ cartItems });
});

export const removeAllFromCart = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { productId } = req.body;
  const user = req.user!;
  
  const cartItems = await cartService.removeFromCart(user, productId);
  res.json(cartItems);
});

export const updateQuantity = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id: productId } = req.params;
  const { quantity } = req.body;
  const user = req.user!;
  
  const cartItems = await cartService.updateQuantity(user, productId, quantity);
  res.json(cartItems);
});
