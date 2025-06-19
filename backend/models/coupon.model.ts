import mongoose, { Schema, Document } from 'mongoose';

export interface ICouponDocument extends Document {
  code: string;
  discountPercentage: number;
  expirationDate: Date;
  isActive: boolean;
  userId?: mongoose.Types.ObjectId;
  description?: string;
  maxUses?: number;
  currentUses: number;
  minimumPurchaseAmount?: number;
}

const couponSchema = new Schema<ICouponDocument>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    discountPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    expirationDate: {
      type: Date,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
      // Removed unique constraint to allow multiple general discount codes
    },
    description: {
      type: String,
      maxlength: 500,
    },
    maxUses: {
      type: Number,
      min: 1,
    },
    currentUses: {
      type: Number,
      default: 0,
    },
    minimumPurchaseAmount: {
      type: Number,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
);

couponSchema.index({ expirationDate: 1 });
couponSchema.index({ isActive: 1 });
couponSchema.index({ code: 1, isActive: 1 });

export const Coupon = mongoose.model<ICouponDocument>('Coupon', couponSchema);