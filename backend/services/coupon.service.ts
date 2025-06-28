import mongoose from 'mongoose';
import { Coupon, ICouponDocument } from '../models/coupon.model.js';
import { IUserDocument } from '../models/user.model.js';
import { NotFoundError, ValidationError, ConflictError } from '../utils/AppError.js';
import type { CreateDiscountInput, UpdateDiscountInput, ListDiscountsInput } from '../validations/coupon.validation.js';

interface ValidCouponResponse {
  message: string;
  code: string;
  discountPercentage: number;
}

interface ListDiscountsResponse {
  discounts: ICouponDocument[];
  total: number;
}

export class CouponService {
  async getCoupon(userId: string): Promise<ICouponDocument | null> {
    const coupon = await Coupon.findOne({ userId, isActive: true });
    return coupon;
  }

  async validateCoupon(userId: string, code: string, cartTotal?: number): Promise<ValidCouponResponse> {
    const upperCode = code.toUpperCase();
    
    // First try to find a user-specific coupon
    let coupon = await Coupon.findOne({ code: upperCode, userId, isActive: true });
    
    // If not found, try to find a general discount code
    coupon ??= await Coupon.findOne({ code: upperCode, userId: { $exists: false }, isActive: true });

    if (!coupon) {
      throw new NotFoundError('Coupon');
    }

    if (coupon.expirationDate < new Date()) {
      coupon.isActive = false;
      await coupon.save();
      throw new ValidationError('Coupon expired');
    }

    // Check if max uses has been reached
    if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) {
      throw new ValidationError('Coupon has reached maximum usage limit');
    }

    // Check minimum purchase amount if provided
    if (cartTotal !== undefined && coupon.minimumPurchaseAmount && cartTotal < coupon.minimumPurchaseAmount) {
      throw new ValidationError(`Minimum purchase amount of $${coupon.minimumPurchaseAmount} required`);
    }

    return {
      message: 'Coupon is valid',
      code: coupon.code,
      discountPercentage: coupon.discountPercentage,
    };
  }

  async applyCouponToUser(user: IUserDocument, code: string): Promise<void> {
    const validationResult = await this.validateCoupon(user._id.toString(), code);
    
    user.appliedCoupon = {
      code: validationResult.code,
      discountPercentage: validationResult.discountPercentage,
    };
    
    await user.save();
  }

  async removeCouponFromUser(user: IUserDocument): Promise<void> {
    user.appliedCoupon = null;
    await user.save();
  }

  async listAllDiscounts(options: ListDiscountsInput): Promise<ListDiscountsResponse> {
    const { 
      page = 1, 
      limit = 20, 
      sortBy = 'createdAt', 
      sortOrder = 'desc', 
      isActive,
      search,
      status = 'all',
      expirationDateFrom,
      expirationDateTo,
      usageStatus = 'all'
    } = options;
    
    const query: mongoose.FilterQuery<ICouponDocument> = {};
    
    // Search filter
    if (search) {
      query.$or = [
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Status filter
    const now = new Date();
    switch (status) {
      case 'active':
        query.isActive = true;
        query.expirationDate = { $gt: now };
        break;
      case 'inactive':
        query.isActive = false;
        break;
      case 'expired':
        query.expirationDate = { $lte: now };
        break;
      case 'all':
        if (isActive !== undefined) query.isActive = isActive;
        break;
    }
    
    // Date range filter
    if (expirationDateFrom || expirationDateTo) {
      query.expirationDate = {};
      if (expirationDateFrom) {
        query.expirationDate.$gte = new Date(expirationDateFrom);
      }
      if (expirationDateTo) {
        query.expirationDate.$lte = new Date(expirationDateTo);
      }
    }
    
    // Usage status filter
    switch (usageStatus) {
      case 'never':
        query.currentUses = 0;
        break;
      case 'low':
        query.currentUses = { $gt: 0, $lte: 10 };
        break;
      case 'high':
        query.currentUses = { $gt: 10 };
        break;
    }
    
    const [discounts, total] = await Promise.all([
      Coupon.find(query)
        .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
        .limit(limit)
        .skip((page - 1) * limit)
        .lean(),
      Coupon.countDocuments(query),
    ]);
    
    return { discounts, total };
  }

  async createDiscount(data: CreateDiscountInput): Promise<ICouponDocument> {
    const existingCoupon = await Coupon.findOne({ code: data.code.toUpperCase() });
    if (existingCoupon) {
      throw new ConflictError('Discount code', 'name');
    }

    const coupon = new Coupon({
      ...data,
      code: data.code.toUpperCase(),
      currentUses: 0,
    });

    await coupon.save();
    return coupon;
  }

  async updateDiscount(id: string, data: UpdateDiscountInput['data']): Promise<ICouponDocument> {
    const coupon = await Coupon.findById(id);
    if (!coupon) {
      throw new NotFoundError('Discount');
    }

    Object.assign(coupon, data);
    await coupon.save();
    return coupon;
  }

  async deleteDiscount(id: string): Promise<{ success: boolean; message: string }> {
    const coupon = await Coupon.findById(id);
    if (!coupon) {
      throw new NotFoundError('Discount');
    }

    if (coupon.currentUses > 0) {
      coupon.isActive = false;
      await coupon.save();
      return { 
        success: true, 
        message: 'Discount has been deactivated (has existing uses)', 
      };
    }

    await Coupon.findByIdAndDelete(id);
    return { 
      success: true, 
      message: 'Discount has been permanently deleted', 
    };
  }

  async incrementUsage(code: string): Promise<void> {
    const upperCode = code.toUpperCase();
    
    // Use atomic operation to increment usage
    const result = await Coupon.findOneAndUpdate(
      { 
        code: upperCode,
        isActive: true,
        $or: [
          { maxUses: { $exists: false } },
          { $expr: { $lt: ['$currentUses', '$maxUses'] } },
        ],
      },
      { 
        $inc: { currentUses: 1 },
      },
      { 
        new: true,
        runValidators: true,
      },
    );
    
    if (!result) {
      // Check if coupon exists but is inactive or at max usage
      const coupon = await Coupon.findOne({ code: upperCode });
      if (!coupon) {
        throw new NotFoundError('Coupon');
      }
      if (!coupon.isActive) {
        throw new ValidationError('Coupon is no longer active');
      }
      if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) {
        throw new ValidationError('Coupon has reached maximum usage limit');
      }
    }
    
    // Check if we need to deactivate after increment
    if (result) {
      // Deactivate if it's a user-specific coupon or if max uses reached
      if (result.userId ?? (result.maxUses && result.currentUses >= result.maxUses)) {
        result.isActive = false;
        await result.save();
      }
    }
  }
}

export const couponService = new CouponService();