import mongoose, { Schema, Document } from 'mongoose';

export interface ICouponDocument extends Document {
  code: string;
  discountPercentage: number;
  expirationDate: Date;
  isActive: boolean;
  userId: mongoose.Types.ObjectId;
}

const couponSchema = new Schema<ICouponDocument>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
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
      required: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  },
);

couponSchema.index({ expirationDate: 1 });
couponSchema.index({ isActive: 1 });

export const Coupon = mongoose.model<ICouponDocument>('Coupon', couponSchema);