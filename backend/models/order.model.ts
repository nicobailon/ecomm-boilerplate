import mongoose, { Schema, Document } from 'mongoose';

export interface IOrderDocument extends Document {
  _id: mongoose.Types.ObjectId;
  orderNumber: string;
  user: mongoose.Types.ObjectId;
  email: string;
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
    variantLabel?: string;
  }[];
  totalAmount: number;
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  stripeSessionId: string;
  status: 'pending' | 'completed' | 'cancelled' | 'refunded' | 'pending_inventory';
  inventoryIssues?: string[];
  shippingAddress?: {
    fullName: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone?: string;
  };
  billingAddress?: {
    fullName: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  paymentMethod?: string;
  paymentIntentId?: string;
  couponCode?: string;
  originalAmount?: number;
  webhookEventId?: string;
  statusHistory: {
    from: 'pending' | 'completed' | 'cancelled' | 'refunded' | 'pending_inventory';
    to: 'pending' | 'completed' | 'cancelled' | 'refunded' | 'pending_inventory';
    timestamp: Date;
    userId?: mongoose.Types.ObjectId;
    reason?: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<IOrderDocument>(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    email: {
      type: String,
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
        variantLabel: {
          type: String,
          required: false,
        },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    tax: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    shipping: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    discount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    stripeSessionId: {
      type: String,
      required: false,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled', 'refunded', 'pending_inventory'],
      default: 'completed',
      required: true,
    },
    inventoryIssues: {
      type: [String],
      required: false,
    },
    shippingAddress: {
      type: {
        fullName: { type: String, required: true },
        line1: { type: String, required: true },
        line2: { type: String },
        city: { type: String, required: true },
        state: { type: String, required: true },
        postalCode: { type: String, required: true },
        country: { type: String, required: true },
        phone: { type: String },
      },
      required: false,
    },
    billingAddress: {
      type: {
        fullName: { type: String, required: true },
        line1: { type: String, required: true },
        line2: { type: String },
        city: { type: String, required: true },
        state: { type: String, required: true },
        postalCode: { type: String, required: true },
        country: { type: String, required: true },
      },
      required: false,
    },
    paymentMethod: {
      type: String,
      required: false,
    },
    paymentIntentId: {
      type: String,
      required: false,
    },
    couponCode: {
      type: String,
      required: false,
    },
    originalAmount: {
      type: Number,
      required: false,
      min: 0,
    },
    webhookEventId: {
      type: String,
      required: false,
    },
    statusHistory: [
      {
        from: {
          type: String,
          enum: ['pending', 'completed', 'cancelled', 'refunded', 'pending_inventory'],
          required: true,
        },
        to: {
          type: String,
          enum: ['pending', 'completed', 'cancelled', 'refunded', 'pending_inventory'],
          required: true,
        },
        timestamp: {
          type: Date,
          required: true,
          default: Date.now,
        },
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: false,
        },
        reason: {
          type: String,
          required: false,
        },
      },
    ],
  },
  { timestamps: true },
);

orderSchema.index({ user: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ 'statusHistory.timestamp': -1 });
orderSchema.index({ stripeSessionId: 1 }, { unique: true, sparse: true });
orderSchema.index({ paymentIntentId: 1 }, { unique: true, sparse: true });

export const Order = mongoose.model<IOrderDocument>('Order', orderSchema);