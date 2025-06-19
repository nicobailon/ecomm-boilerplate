import { z } from 'zod';

export const createDiscountSchema = z.object({
  code: z.string().min(1).max(50).toUpperCase(),
  discountPercentage: z.number().min(0).max(100),
  expirationDate: z.string().refine((date) => {
    return !isNaN(Date.parse(date));
  }, 'Invalid date format'),
  isActive: z.boolean().default(true),
  description: z.string().max(500).optional(),
  maxUses: z.number().int().positive().optional(),
  minimumPurchaseAmount: z.number().min(0).optional(),
});

export const updateDiscountSchema = z.object({
  id: z.string(),
  data: z.object({
    discountPercentage: z.number().min(0).max(100).optional(),
    expirationDate: z.string().refine((date) => {
      return !isNaN(Date.parse(date));
    }, 'Invalid date format').optional(),
    isActive: z.boolean().optional(),
    description: z.string().max(500).optional(),
    maxUses: z.number().int().positive().optional(),
    minimumPurchaseAmount: z.number().min(0).optional(),
  }),
});

export const listDiscountsSchema = z.object({
  page: z.number().int().positive().default(1).optional(),
  limit: z.number().int().positive().max(100).default(20).optional(),
  sortBy: z.enum(['code', 'discountPercentage', 'expirationDate', 'createdAt', 'updatedAt']).default('createdAt').optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc').optional(),
  isActive: z.boolean().optional(),
});

export const deleteDiscountSchema = z.object({
  id: z.string(),
});

export const validateCouponSchema = z.object({
  code: z.string(),
  userId: z.string().optional(),
  cartTotal: z.number().positive(),
});

export const applyCouponSchema = z.object({
  code: z.string().min(1, 'Coupon code is required').max(20, 'Coupon code is too long'),
});

export type CreateDiscountInput = z.infer<typeof createDiscountSchema>;
export type UpdateDiscountInput = z.infer<typeof updateDiscountSchema>;
export type ListDiscountsInput = z.infer<typeof listDiscountsSchema>;
export type DeleteDiscountInput = z.infer<typeof deleteDiscountSchema>;
export type ValidateCouponInput = z.infer<typeof validateCouponSchema>;