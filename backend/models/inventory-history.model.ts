import mongoose, { Schema, Document } from 'mongoose';
import { IInventoryHistory } from '../../shared/types/inventory.types.js';

export interface IInventoryHistoryDocument extends IInventoryHistory, Document {}

const inventoryHistorySchema = new Schema<IInventoryHistoryDocument>(
  {
    productId: {
      type: String,
      required: true,
    },
    variantId: {
      type: String,
    },
    previousQuantity: {
      type: Number,
      required: true,
      min: 0,
    },
    newQuantity: {
      type: Number,
      required: true,
      min: 0,
    },
    adjustment: {
      type: Number,
      required: true,
    },
    reason: {
      type: String,
      required: true,
      enum: [
        'sale',
        'return',
        'restock',
        'adjustment',
        'damage',
        'theft',
        'transfer',
        'reservation_expired',
        'manual_correction',
      ],
    },
    userId: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: false,
  },
);

inventoryHistorySchema.index({ productId: 1, timestamp: -1 });
inventoryHistorySchema.index({ productId: 1, variantId: 1, timestamp: -1 });
inventoryHistorySchema.index({ userId: 1, timestamp: -1 });
inventoryHistorySchema.index({ timestamp: -1 });

export const InventoryHistory = mongoose.model<IInventoryHistoryDocument>(
  'InventoryHistory',
  inventoryHistorySchema,
);