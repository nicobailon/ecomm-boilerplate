import { z } from 'zod';
import { PRODUCT_SIZES } from '../constants/variant-options.js'; // legacy - for backward compatibility
import { PRODUCT_LIMITS, VARIANT_LIMITS } from '../constants/app-limits.js';

export const colorValidationSchema = z.string().refine(
  (color) => {
    if (!color) return true;
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return hexRegex.test(color);
  },
  { message: 'Invalid color format. Use hex color codes (e.g., #000000)' },
);

export const skuValidationSchema = z.string().refine(
  (sku) => {
    if (!sku) return true;
    const skuRegex = /^[A-Z0-9-]+$/;
    return skuRegex.test(sku);
  },
  { message: 'SKU must contain only uppercase letters, numbers, and hyphens' },
);

export const productVariantSchema = z.object({
  variantId: z.string().min(VARIANT_LIMITS.MIN_VARIANT_ID_LENGTH, 'Variant ID is required'),
  label: z.string().min(1, 'Label is required').max(50, 'Label must be 50 characters or less'),
  size: z.enum(PRODUCT_SIZES).optional(),
  color: colorValidationSchema.optional(),
  price: z.number().min(PRODUCT_LIMITS.MIN_PRICE).max(PRODUCT_LIMITS.MAX_PRICE),
  inventory: z.number().int().min(PRODUCT_LIMITS.MIN_INVENTORY).max(PRODUCT_LIMITS.MAX_INVENTORY).default(0),
  images: z.array(z.string().url()).max(VARIANT_LIMITS.MAX_IMAGES_PER_VARIANT).default([]),
  sku: skuValidationSchema.optional(),
});

export const legacyProductVariantSchema = productVariantSchema.omit({ label: true });

export const productSlugSchema = z
  .string()
  .min(1, 'Slug is required')
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug format');

export const createProductSchema = z.object({
  name: z.string().min(PRODUCT_LIMITS.MIN_NAME_LENGTH).max(PRODUCT_LIMITS.MAX_NAME_LENGTH),
  description: z.string().min(PRODUCT_LIMITS.MIN_DESCRIPTION_LENGTH).max(PRODUCT_LIMITS.MAX_DESCRIPTION_LENGTH),
  price: z.number().min(PRODUCT_LIMITS.MIN_PRICE).max(PRODUCT_LIMITS.MAX_PRICE),
  image: z.string().url(),
  collectionId: z.string().optional(),
  isFeatured: z.boolean().default(false),
  slug: productSlugSchema.optional(),
  variants: z.array(productVariantSchema).max(PRODUCT_LIMITS.MAX_VARIANTS).default([]),
  relatedProducts: z.array(z.string()).max(PRODUCT_LIMITS.MAX_RELATED_PRODUCTS).default([]),
});

export const updateProductSchema = createProductSchema.partial();

export const productWithVariantsSchema = z.object({
  _id: z.string(),
  name: z.string(),
  description: z.string(),
  price: z.number(),
  image: z.string().url(),
  collectionId: z.union([
    z.string(),
    z.object({
      _id: z.string(),
      name: z.string(),
      slug: z.string(),
    }),
  ]).optional(),
  isFeatured: z.boolean(),
  slug: productSlugSchema,
  variants: z.array(productVariantSchema),
  relatedProducts: z.union([
    z.array(z.string()),
    z.array(z.object({
      _id: z.string(),
      name: z.string(),
      price: z.number(),
      image: z.string(),
      slug: z.string(),
    })),
  ]).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const getProductBySlugSchema = z.object({
  slug: productSlugSchema,
});

export const variantQuerySchema = z.object({
  includeVariants: z.boolean().optional(),
  variantId: z.string().optional(),
  variantLabel: z.string().optional(),
});

export const productListQuerySchema = z.object({
  collectionId: z.string().optional(),
  isFeatured: z.boolean().optional(),
  includeVariants: z.boolean().optional(),
  search: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  sortBy: z.enum(['createdAt', 'price', 'name']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const validateUniqueVariants = (variants: z.infer<typeof productVariantSchema>[]): boolean => {
  const labels = new Set<string>();
  
  for (const variant of variants) {
    const label = variant.label.toLowerCase().trim();
    if (labels.has(label)) {
      throw new z.ZodError([{
        code: 'custom',
        message: 'Duplicate variant label found',
        path: ['variants'],
      }]);
    }
    labels.add(label);
  }
  
  return true;
};

export const validateVariantInventory = (variants: z.infer<typeof productVariantSchema>[]): boolean => {
  const hasAnyInventory = variants.some((v: z.infer<typeof productVariantSchema>) => v.inventory > 0);
  
  if (variants.length > 0 && !hasAnyInventory) {
    console.warn('Product has variants but no inventory');
  }
  
  return true;
};

export type ProductVariant = z.infer<typeof productVariantSchema>;
export type LegacyProductVariant = z.infer<typeof legacyProductVariantSchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductWithVariants = z.infer<typeof productWithVariantsSchema>;
export type GetProductBySlugInput = z.infer<typeof getProductBySlugSchema>;
export type ProductListQuery = z.infer<typeof productListQuerySchema>;