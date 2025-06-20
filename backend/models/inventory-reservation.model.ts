import mongoose, { Schema, Document } from 'mongoose';
import { IInventoryReservation } from '../../shared/types/inventory.types.js';

export interface IInventoryReservationDocument extends Omit<IInventoryReservation, '_id'>, Document {}

const inventoryReservationSchema = new Schema<IInventoryReservationDocument>(
  {
    productId: {
      type: String,
      required: true,
    },
    variantId: {
      type: String,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    sessionId: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expireAfterSeconds: 0 },
    },
    type: {
      type: String,
      enum: ['cart', 'checkout'],
      default: 'cart',
    },
  },
  {
    timestamps: true,
  },
);

inventoryReservationSchema.index({ productId: 1, variantId: 1 });
inventoryReservationSchema.index({ sessionId: 1 });
inventoryReservationSchema.index({ userId: 1 });

export const InventoryReservation = mongoose.model<IInventoryReservationDocument>(
  'InventoryReservation',
  inventoryReservationSchema,
);