import { Coupon, ICouponDocument } from '../models/coupon.model.js';
import { AppError } from '../utils/AppError.js';

interface ValidCouponResponse {
  message: string;
  code: string;
  discountPercentage: number;
}

export class CouponService {
  async getCoupon(userId: string): Promise<ICouponDocument | null> {
    const coupon = await Coupon.findOne({ userId, isActive: true });
    return coupon;
  }

  async validateCoupon(userId: string, code: string): Promise<ValidCouponResponse> {
    const coupon = await Coupon.findOne({ code, userId, isActive: true });

    if (!coupon) {
      throw new AppError("Coupon not found", 404);
    }

    if (coupon.expirationDate < new Date()) {
      coupon.isActive = false;
      await coupon.save();
      throw new AppError("Coupon expired", 404);
    }

    return {
      message: "Coupon is valid",
      code: coupon.code,
      discountPercentage: coupon.discountPercentage,
    };
  }
}

export const couponService = new CouponService();