import { z } from 'zod';
import type { AnalyticsData, DailySalesData } from '@/types';
import { findDuplicateLabels } from '@/utils/variant-validation';

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

const variantSchema = z.object({
  variantId: z.string().optional(), // Optional in form, Dev 1 will generate if missing
  label: z.string().min(1, 'Variant label is required'),
  priceAdjustment: z.number().optional().default(0),
  inventory: z.number().min(0, 'Inventory cannot be negative').default(0),
  sku: z.string().optional(),
  attributes: z.record(z.string()).optional(),
});

const variantTypeSchema = z.object({
  name: z.string().min(1, 'Variant type name is required'),
  values: z.array(z.string().min(1)).min(1, 'At least one value is required'),
});

export const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.number().positive('Price must be positive'),
  collectionId: z.string().optional(),
  image: z.string().url('Invalid image URL'),
  variantTypes: z.array(variantTypeSchema).optional(),
  variants: z.array(variantSchema).optional(),
}).superRefine((data, ctx) => {
  // Validate unique variant labels
  if (data.variants && data.variants.length > 0) {
    const { duplicateIndices } = findDuplicateLabels(data.variants);
    
    // Add issues for all duplicate indices
    duplicateIndices.forEach((indices) => {
      indices.forEach(index => {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Variant labels must be unique',
          path: ['variants', index, 'label'],
        });
      });
    });
  }
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

export const discountFormSchema = z.object({
  code: z.string()
    .min(3, 'Code must be at least 3 characters')
    .transform(val => val.toUpperCase()),
  discountPercentage: z.number()
    .min(0, 'Discount must be at least 0%')
    .max(100, 'Discount cannot exceed 100%'),
  expirationDate: z.date()
    .refine(date => date > new Date(), 'Expiration date must be in the future'),
  isActive: z.boolean(),
  description: z.string()
    .max(500, 'Description cannot exceed 500 characters')
    .optional(),
  maxUses: z.number()
    .min(1, 'Maximum uses must be at least 1')
    .optional(),
  minimumPurchaseAmount: z.number()
    .min(0, 'Minimum purchase amount cannot be negative')
    .optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type VariantInput = z.infer<typeof variantSchema>;
export type VariantTypeInput = z.infer<typeof variantTypeSchema>;
export type DiscountFormInput = z.infer<typeof discountFormSchema>;

// Form input type with optional fields for variants
export type ProductFormInput = Omit<ProductInput, 'variants' | 'variantTypes'> & {
  variantTypes?: Array<{
    name: string;
    values: string[];
  }>;
  variants?: Array<{
    variantId?: string;
    label: string;
    priceAdjustment?: number;
    inventory?: number;
    sku?: string;
    attributes?: Record<string, string>;
  }>;
};