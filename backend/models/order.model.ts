import mongoose, { Schema, Document } from 'mongoose';

export interface IOrderDocument extends Document {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  products: {
    product: mongoose.Types.ObjectId;
    quantity: number;
    price: number;
    variantId?: string;
    variantDetails?: {
      size?: string;
      color?: string;
      sku?: string;
    };
  }[];
  totalAmount: number;
  stripeSessionId: string;
  status: 'pending' | 'completed' | 'cancelled' | 'refunded';
}

const orderSchema = new Schema<IOrderDocument>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
        variantId: {
          type: String,
          required: false,
        },
        variantDetails: {
          type: {
            size: {
              type: String,
              required: false,
            },
            color: {
              type: String,
              required: false,
            },
            sku: {
              type: String,
              required: false,
            },
          },
          required: false,
        },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    stripeSessionId: {
      type: String,
      unique: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled', 'refunded'],
      default: 'completed',
      required: true,
    },
  },
  { timestamps: true },
);

orderSchema.index({ user: 1 });
orderSchema.index({ createdAt: -1 });

export const Order = mongoose.model<IOrderDocument>('Order', orderSchema);