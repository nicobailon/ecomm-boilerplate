import { Response } from 'express';
import { AuthRequest } from '../types/express.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { couponService } from '../services/coupon.service.js';
import { cartService } from '../services/cart.service.js';

export const getCoupon = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  const coupon = await couponService.getCoupon(req.user._id.toString());
  res.json(coupon ?? null);
});

export const validateCoupon = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  const { code } = req.body as { code: string };
  const result = await couponService.validateCoupon(req.user._id.toString(), code);
  res.json(result);
});

export const applyCoupon = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  const { code } = req.body as { code: string };
  const user = req.user;
  
  await couponService.applyCouponToUser(user, code);
  const cart = await cartService.calculateCartTotals(user);
  
  res.json({
    success: true,
    message: 'Coupon applied successfully',
    cart,
  });
});

export const removeCoupon = asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }
  const user = req.user;
  
  await couponService.removeCouponFromUser(user);
  const cart = await cartService.calculateCartTotals(user);
  
  res.json({
    success: true,
    message: 'Coupon removed successfully',
    cart,
  });
});
