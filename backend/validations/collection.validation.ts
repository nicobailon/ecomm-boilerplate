import { z } from 'zod';

export const createCollectionSchema = z.object({
  name: z
    .string()
    .min(1, 'Collection name is required')
    .max(100, 'Collection name cannot exceed 100 characters')
    .trim(),
  description: z
    .string()
    .max(500, 'Collection description cannot exceed 500 characters')
    .trim()
    .optional(),
  isPublic: z.boolean().default(true),
  products: z.array(z.string()).default([]),
});

export const updateCollectionSchema = z.object({
  name: z
    .string()
    .min(1, 'Collection name is required')
    .max(100, 'Collection name cannot exceed 100 characters')
    .trim()
    .optional(),
  description: z
    .string()
    .max(500, 'Collection description cannot exceed 500 characters')
    .trim()
    .optional(),
  isPublic: z.boolean().optional(),
});

export const updateHeroContentSchema = z.object({
  id: z.string(),
  heroImage: z.string().url().optional(),
  heroTitle: z.string().max(100, 'Hero title cannot exceed 100 characters').trim().optional(),
  heroSubtitle: z.string().max(200, 'Hero subtitle cannot exceed 200 characters').trim().optional(),
  isFeatured: z.boolean().optional(),
});

export const addProductsToCollectionSchema = z.object({
  productIds: z.array(z.string()).min(1, 'At least one product ID is required'),
});

export const removeProductsFromCollectionSchema = z.object({
  productIds: z.array(z.string()).min(1, 'At least one product ID is required'),
});

export const getCollectionByIdSchema = z.object({
  id: z.string(),
});

export const getCollectionBySlugSchema = z.object({
  slug: z.string(),
});

export const deleteCollectionSchema = z.object({
  id: z.string(),
});

export const quickCreateCollectionSchema = z.object({
  name: z.string()
    .min(1, 'Collection name is required')
    .max(100, 'Collection name must be less than 100 characters')
    .trim()
    .refine(
      (name) => name.length > 0,
      'Collection name cannot be empty',
    ),
  isPublic: z.boolean().optional().default(true),
});

export const checkAvailabilitySchema = z.object({
  name: z.string().min(1).max(100).trim(),
});

export type CreateCollectionInput = z.infer<typeof createCollectionSchema>;
export type UpdateCollectionInput = z.infer<typeof updateCollectionSchema>;
export type UpdateHeroContentInput = z.infer<typeof updateHeroContentSchema>;
export type AddProductsToCollectionInput = z.infer<typeof addProductsToCollectionSchema>;
export type RemoveProductsFromCollectionInput = z.infer<typeof removeProductsFromCollectionSchema>;
export type QuickCreateCollectionInput = z.infer<typeof quickCreateCollectionSchema>;
export type CheckAvailabilityInput = z.infer<typeof checkAvailabilitySchema>;