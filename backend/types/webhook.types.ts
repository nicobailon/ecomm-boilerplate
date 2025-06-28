import { z } from 'zod';
import { IWebhookEventDocument } from '../models/webhook-event.model.js';
import { IOrderDocument } from '../models/order.model.js';

export const webhookEventTypes = [
  'payment_intent.succeeded',
  'payment_intent.payment_failed',
  'checkout.session.completed',
] as const;

export type WebhookEventType = typeof webhookEventTypes[number];

export interface WebhookProcessingResult {
  success: boolean;
  orderId?: string;
  message?: string;
  error?: string;
  shouldRetry?: boolean;
}

export interface WebhookEventMetadata {
  sessionId?: string;
  userId?: string;
  orderId?: string;
}

export interface ProcessedWebhookEvent {
  event: IWebhookEventDocument;
  order?: IOrderDocument;
}

export const webhookEventSchema = z.object({
  id: z.string(),
  type: z.enum(webhookEventTypes),
  created: z.number(),
  data: z.object({
    object: z.any(),
  }),
});

export type ValidatedWebhookEvent = z.infer<typeof webhookEventSchema>;

export interface WebhookServiceOptions {
  maxRetries: number;
  retryDelay: number;
}

export interface WebhookErrorResponse {
  error: string;
  code: string;
  statusCode: number;
  shouldRetry: boolean;
}

export class WebhookError extends Error {
  public code: string;
  public statusCode: number;
  public shouldRetry: boolean;

  constructor(message: string, code: string, statusCode: number, shouldRetry = false) {
    super(message);
    this.name = 'WebhookError';
    this.code = code;
    this.statusCode = statusCode;
    this.shouldRetry = shouldRetry;
  }
}