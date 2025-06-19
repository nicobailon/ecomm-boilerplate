import { z } from 'zod';

// Auth validations
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const signupSchema = loginSchema.extend({
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

// Product validations
export const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.number().positive('Price must be a positive number'),
  collectionId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid collection ID format').optional(),
  image: z.string().url('Image must be a valid URL'),
});

export const updateProductSchema = createProductSchema.partial();

// Cart validations
export const addToCartSchema = z.object({
  productId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID format'),
});

export const updateQuantitySchema = z.object({
  quantity: z.number().int('Quantity must be an integer').min(0).max(99, 'Quantity cannot exceed 99'),
});


// Payment validations
export const checkoutSchema = z.object({
  products: z.array(z.object({
    _id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID format'),
    quantity: z.number().int('Quantity must be an integer').positive('Quantity must be positive'),
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

// Category param validation

// Export all validations from coupon.validation.ts
export * from './coupon.validation.js';
