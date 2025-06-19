import { Coupon, ICouponDocument } from '../models/coupon.model.js';
import { IUserDocument } from '../models/user.model.js';
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

  async applyCouponToUser(user: IUserDocument, code: string): Promise<void> {
    const validationResult = await this.validateCoupon(user._id as string, code);
    
    user.appliedCoupon = {
      code: validationResult.code,
      discountPercentage: validationResult.discountPercentage
    };
    
    await user.save();
  }

  async removeCouponFromUser(user: IUserDocument): Promise<void> {
    user.appliedCoupon = null;
    await user.save();
  }
}

export const couponService = new CouponService();