import { z } from 'zod';

export const webhookEventSchema = z.object({
  id: z.string(),
  type: z.string(),
  created: z.number(),
  data: z.object({
    object: z.any(),
  }),
});

export const webhookPayloadSchema = z.object({
  body: webhookEventSchema,
  headers: z.object({
    'stripe-signature': z.string(),
  }),
});

export type WebhookPayload = z.infer<typeof webhookPayloadSchema>;