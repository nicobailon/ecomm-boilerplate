import { Response } from 'express';
import { AuthRequest } from '../types/express.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { cartService } from '../services/cart.service.js';




export const getCartProducts = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = req.user!;
  const cartResponse = await cartService.calculateCartTotals(user);
  res.json(cartResponse);
});

export const addToCart = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { productId } = req.body;
  const user = req.user!;
  
  await cartService.addToCart(user, productId);
  const cartResponse = await cartService.calculateCartTotals(user);
  res.json(cartResponse);
});

export const removeFromCart = asyncHandler(async (req: AuthRequest, res: Response) => {
  const productId = req.params.productId || req.body.productId;
  const user = req.user!;
  
  await cartService.removeFromCart(user, productId);
  const cartResponse = await cartService.calculateCartTotals(user);
  res.json(cartResponse);
});

export const updateQuantity = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id: productId } = req.params;
  const { quantity } = req.body;
  const user = req.user!;
  
  await cartService.updateQuantity(user, productId, quantity);
  const cartResponse = await cartService.calculateCartTotals(user);
  res.json(cartResponse);
});
