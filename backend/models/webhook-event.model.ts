import mongoose, { Schema, Document } from 'mongoose';

export interface IWebhookEventDocument extends Document {
  _id: mongoose.Types.ObjectId;
  stripeEventId: string;
  type: string;
  eventType?: string;
  data?: unknown;
  rawBody?: string;
  processed: boolean;
  processedAt?: Date;
  orderId?: mongoose.Types.ObjectId;
  error?: string;
  retryCount: number;
  attempts?: number;
  lastError?: string;
  lastAttemptAt?: Date;
  receivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const webhookEventSchema = new Schema<IWebhookEventDocument>(
  {
    stripeEventId: {
      type: String,
      required: true,
      unique: true,
    },
    type: {
      type: String,
      required: true,
    },
    eventType: {
      type: String,
      required: false,
    },
    data: {
      type: Schema.Types.Mixed,
      required: false,
    },
    rawBody: {
      type: String,
      required: false,
    },
    processed: {
      type: Boolean,
      required: true,
      default: false,
    },
    processedAt: {
      type: Date,
      required: false,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: false,
    },
    error: {
      type: String,
      required: false,
    },
    retryCount: {
      type: Number,
      required: true,
      default: 0,
    },
    attempts: {
      type: Number,
      required: false,
      default: 0,
    },
    lastError: {
      type: String,
      required: false,
    },
    lastAttemptAt: {
      type: Date,
      required: false,
    },
    receivedAt: {
      type: Date,
      required: false,
      default: Date.now,
    },
  },
  { timestamps: true },
);

webhookEventSchema.index({ type: 1 });
webhookEventSchema.index({ processed: 1 });
webhookEventSchema.index({ createdAt: -1 });
webhookEventSchema.index({ processed: 1, retryCount: 1 });

export const WebhookEvent = mongoose.model<IWebhookEventDocument>('WebhookEvent', webhookEventSchema);