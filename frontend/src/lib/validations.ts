import { z } from 'zod';
import type { AnalyticsData, DailySalesData } from '@/types';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const signupSchema = loginSchema.extend({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords don\'t match',
  path: ['confirmPassword'],
});

export const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.number().positive('Price must be positive'),
  collectionId: z.string().optional(),
  image: z.string().url('Invalid image URL'),
});

export const analyticsSchema = z.object({
  users: z.number(),
  products: z.number(),
  totalSales: z.number(),
  totalRevenue: z.number(),
}) satisfies z.ZodType<AnalyticsData>;

export const dailySalesDataSchema = z.object({
  name: z.string(),
  sales: z.number(),
  revenue: z.number(),
}) satisfies z.ZodType<DailySalesData>;

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type ProductInput = z.infer<typeof productSchema>;