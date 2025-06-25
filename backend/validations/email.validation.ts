import { z } from 'zod';
import { EmailTemplate } from '../types/email.types.js';

// Base email schema
export const emailAddressSchema = z.string().email('Invalid email address');

// Send email schema
export const sendEmailSchema = z.object({
  to: z.union([
    emailAddressSchema,
    z.array(emailAddressSchema).min(1, 'At least one email address is required'),
  ]),
  subject: z.string().min(1, 'Subject is required').max(200, 'Subject is too long'),
  template: z.nativeEnum(EmailTemplate),
  data: z.record(z.unknown()),
  attachments: z.array(z.object({
    filename: z.string(),
    content: z.union([z.string(), z.instanceof(Buffer)]),
    contentType: z.string().optional(),
  })).optional(),
  unsubscribeToken: z.string().optional(),
});

// Email preferences schema
export const emailPreferencesSchema = z.object({
  marketing: z.boolean(),
  orderUpdates: z.boolean(),
  stockNotifications: z.boolean(),
});

// Update email preferences schema
export const updateEmailPreferencesSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  preferences: emailPreferencesSchema,
});

// Stock notification subscription schema
export const stockNotificationSubscriptionSchema = z.object({
  email: emailAddressSchema,
  productId: z.string().min(1, 'Product ID is required'),
  variantId: z.string().optional(),
});

// Password reset request schema
export const passwordResetRequestSchema = z.object({
  email: emailAddressSchema,
});

// Password reset confirm schema
export const passwordResetConfirmSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

// Unsubscribe query schema
export const unsubscribeQuerySchema = z.object({
  token: z.string().min(1, 'Unsubscribe token is required'),
  type: z.enum(['all', 'marketing', 'orderUpdates', 'stockNotifications']).default('all'),
});

// Resend webhook event schema (for future use)
export const resendWebhookEventSchema = z.object({
  type: z.enum(['email.sent', 'email.delivered', 'email.bounced', 'email.complained']),
  timestamp: z.string(),
  data: z.object({
    emailId: z.string(),
    to: z.union([z.string(), z.array(z.string())]),
    subject: z.string(),
    status: z.string().optional(),
    reason: z.string().optional(),
  }),
});