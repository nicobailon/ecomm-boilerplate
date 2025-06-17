import { Response } from 'express';
import { AuthRequest } from '../types/express.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { AppError } from '../utils/AppError.js';
import { Coupon } from '../models/coupon.model.js';




export const getCoupon = asyncHandler(async (req: AuthRequest, res: Response) => {
  const coupon = await Coupon.findOne({ userId: req.user!._id, isActive: true });
  res.json(coupon || null);
});

export const validateCoupon = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { code } = req.body;
  const coupon = await Coupon.findOne({ code: code, userId: req.user!._id, isActive: true });

  if (!coupon) {
    throw new AppError("Coupon not found", 404);
  }

  if (coupon.expirationDate < new Date()) {
    coupon.isActive = false;
    await coupon.save();
    throw new AppError("Coupon expired", 404);
  }

  res.json({
    message: "Coupon is valid",
    code: coupon.code,
    discountPercentage: coupon.discountPercentage,
  });
});
