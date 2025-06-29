import { z } from 'zod';

// Auth validations
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const signupSchema = loginSchema.extend({
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

// Product validations are now in product.validation.ts

// Analytics validations
export const analyticsDataSchema = z.object({
  users: z.number(),
  products: z.number(),
  totalSales: z.number(),
  totalRevenue: z.number(),
});

export const dailySalesDataSchema = z.array(z.object({
  date: z.string(),
  sales: z.number(),
  revenue: z.number(),
}));

// Cart validations
export const addToCartSchema = z.object({
  productId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID format'),
  variantId: z.string().optional(),
  variantLabel: z.string().optional(),
});

export const updateQuantitySchema = z.object({
  quantity: z.number().int('Quantity must be an integer').min(0).max(99, 'Quantity cannot exceed 99'),
  variantId: z.string().optional(),
  variantLabel: z.string().optional(),
});

export const removeFromCartSchema = z.object({
  productId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID format'),
  variantId: z.string().optional(),
  variantLabel: z.string().optional(),
});

// Payment validations
export const checkoutSchema = z.object({
  products: z.array(z.object({
    _id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID format'),
    quantity: z.number().int('Quantity must be an integer').positive('Quantity must be positive'),
    variantId: z.string().optional(),
    variantLabel: z.string().optional(),
  })).min(1, 'At least one product is required'),
  couponCode: z.string().optional(),
});

export const checkoutSuccessSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
});

// Analytics validations
export const dateRangeSchema = z.object({
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid start date format',
  }).optional(),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid end date format',
  }).optional(),
});

// Pagination validation
export const paginationSchema = z.object({
  page: z.string().optional().transform((val) => {
    const parsed = parseInt(val ?? '1', 10);
    return Math.max(1, isNaN(parsed) ? 1 : parsed);
  }),
  limit: z.string().optional().transform((val) => {
    const parsed = parseInt(val ?? '12', 10);
    return Math.min(100, Math.max(1, isNaN(parsed) ? 12 : parsed));
  }),
  category: z.string().optional(),
});

// Product ID param validation
export const productIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID format'),
});

// Cart product ID param validation
export const cartProductIdParamSchema = z.object({
  productId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID format'),
});

// Category param validation

// Password reset schemas
export const passwordResetRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const passwordResetConfirmSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// Refresh token schema
export const refreshTokenSchema = z.object({
  refreshToken: z.string().optional(), // Optional since it might come from cookies
});

// Unsubscribe schema
export const unsubscribeSchema = z.object({
  token: z.string().min(1, 'Unsubscribe token is required'),
  email: z.string().email('Invalid email address').optional(),
});

// Export all validations from other files
export * from './coupon.validation.js';
export * from './product.validation.js';
export * from './inventory.validation.js';
