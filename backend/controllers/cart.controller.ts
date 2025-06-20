import { Response } from 'express';
import { AuthRequest } from '../types/express.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { cartService } from '../services/cart.service.js';

export const getCartProducts = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  const user = req.user;
  const cartResponse = await cartService.calculateCartTotals(user);
  res.json(cartResponse);
});

export const addToCart = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { productId, variantId } = req.body as { productId: string; variantId?: string };
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  const user = req.user;
  
  await cartService.addToCart(user, productId, variantId);
  const cartResponse = await cartService.calculateCartTotals(user);
  res.json(cartResponse);
});

export const removeFromCart = asyncHandler(async (req: AuthRequest, res: Response) => {
  const productId = req.params.productId || (req.body as { productId?: string; variantId?: string }).productId;
  const variantId = (req.body as { productId?: string; variantId?: string }).variantId;
  
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  const user = req.user;
  
  await cartService.removeFromCart(user, productId, variantId);
  const cartResponse = await cartService.calculateCartTotals(user);
  res.json(cartResponse);
});

export const updateQuantity = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id: productId } = req.params;
  const { quantity, variantId } = req.body as { quantity: number; variantId?: string };
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  const user = req.user;
  
  await cartService.updateQuantity(user, productId, quantity, variantId);
  const cartResponse = await cartService.calculateCartTotals(user);
  res.json(cartResponse);
});
