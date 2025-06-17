import { Response } from 'express';
import { AuthRequest } from '../types/express.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { couponService } from '../services/coupon.service.js';




export const getCoupon = asyncHandler(async (req: AuthRequest, res: Response) => {
  const coupon = await couponService.getCoupon(req.user!._id as string);
  res.json(coupon || null);
});

export const validateCoupon = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { code } = req.body;
  const result = await couponService.validateCoupon(req.user!._id as string, code);
  res.json(result);
});
