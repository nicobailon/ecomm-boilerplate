import { router, publicProcedure, adminProcedure } from '../index.js';
import { z } from 'zod';
import { productService } from '../../services/product.service.js';
import { 
  updateProductSchema,
  getProductBySlugSchema,
} from '../../validations/index.js';
import { baseProductSchema } from '../../validations/product.validation.js';
import { TRPCError } from '@trpc/server';
import { MONGODB_OBJECTID_REGEX } from '../../utils/constants.js';
import { isAppError } from '../../utils/error-types.js';

export const productRouter = router({
  list: publicProcedure
    .input(z.object({
      page: z.number().min(1).optional().default(() => 1),
      limit: z.number().min(1).max(100).optional().default(() => 12),
      search: z.string().optional(),
      includeVariants: z.boolean().optional().default(false),
      collectionId: z.string().optional(),
      isFeatured: z.boolean().optional(),
    }))
    .query(async ({ input }) => {
      try {
        const result = await productService.getAllProducts(input.page, input.limit, input.search, input.includeVariants);
        return result;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch products';
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: message ?? 'Failed to fetch products',
        });
      }
    }),

  featured: publicProcedure
    .query(async () => {
      try {
        return await productService.getFeaturedProducts();
      } catch (error) {
        if (isAppError(error) && error.statusCode === 404) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: error.message,
          });
        }
        const message = error instanceof Error ? error.message : 'Failed to fetch featured products';
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: message ?? 'Failed to fetch featured products',
        });
      }
    }),

  recommended: publicProcedure
    .query(async () => {
      try {
        return await productService.getRecommendedProducts();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch recommended products';
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: message ?? 'Failed to fetch recommended products',
        });
      }
    }),

  byId: publicProcedure
    .input(z.string().regex(MONGODB_OBJECTID_REGEX, 'Invalid product ID'))
    .query(async ({ input }) => {
      try {
        return await productService.getProductById(input);
      } catch (error) {
        if (isAppError(error) && error.statusCode === 404) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: error.message,
          });
        }
        const message = error instanceof Error ? error.message : 'Failed to fetch product';
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: message ?? 'Failed to fetch product',
        });
      }
    }),

  create: adminProcedure
    .input(baseProductSchema.extend({
      collectionId: z.string().optional(),
      collectionName: z.string()
        .min(1)
        .max(100)
        .optional()
        .refine(
          (name) => !name || name.trim().length > 0,
          'Collection name cannot be empty',
        ),
    }).refine(
      (data) => !(data.collectionId && data.collectionName),
      {
        message: 'Provide either collectionId or collectionName, not both',
        path: ['collectionName'],
      },
    ).refine((data) => {
      // Apply the same variant attributes validation from createProductSchema
      const USE_VARIANT_ATTRIBUTES = process.env.USE_VARIANT_ATTRIBUTES === 'true';
      if (!USE_VARIANT_ATTRIBUTES || !data.variantTypes || data.variantTypes.length === 0) {
        return true;
      }
      
      const allowedKeys = new Set(data.variantTypes);
      
      for (const variant of data.variants) {
        if (variant.attributes) {
          for (const key of Object.keys(variant.attributes)) {
            if (!allowedKeys.has(key)) {
              throw new z.ZodError([{
                code: 'custom',
                message: `Variant attribute key '${key}' is not in variantTypes`,
                path: ['variants', data.variants.indexOf(variant), 'attributes'],
              }]);
            }
          }
        }
      }
      
      return true;
    }, {
      message: 'Variant attributes must match variantTypes',
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const result = await productService.createProductWithCollection(
          ctx.userId,
          input,
        );
        
        return {
          product: result.product,
          collection: result.collection,
          created: result.created,
        };
      } catch (error) {
        if (isAppError(error) && error.statusCode === 400) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: error.message,
          });
        }
        const message = error instanceof Error ? error.message : 'Failed to create product';
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: message ?? 'Failed to create product',
        });
      }
    }),

  update: adminProcedure
    .input(z.object({
      id: z.string(),
      data: updateProductSchema,
    }))
    .mutation(async ({ input }) => {
      try {
        return await productService.updateProduct(input.id, input.data);
      } catch (error) {
        if (isAppError(error) && error.statusCode === 404) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: error.message,
          });
        }
        const message = error instanceof Error ? error.message : 'Failed to update product';
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: message ?? 'Failed to update product',
        });
      }
    }),

  delete: adminProcedure
    .input(z.string())
    .mutation(async ({ input }) => {
      try {
        await productService.deleteProduct(input);
        return { success: true };
      } catch (error) {
        if (isAppError(error) && error.statusCode === 404) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: error.message,
          });
        }
        const message = error instanceof Error ? error.message : 'Failed to delete product';
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: message ?? 'Failed to delete product',
        });
      }
    }),

  toggleFeatured: adminProcedure
    .input(z.string())
    .mutation(async ({ input }) => {
      try {
        return await productService.toggleFeaturedProduct(input);
      } catch (error) {
        if (isAppError(error) && error.statusCode === 404) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: error.message,
          });
        }
        const message = error instanceof Error ? error.message : 'Failed to toggle featured status';
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: message ?? 'Failed to toggle featured status',
        });
      }
    }),

  bySlug: publicProcedure
    .input(getProductBySlugSchema)
    .query(async ({ input }) => {
      try {
        const product = await productService.getProductBySlug(input.slug);
        
        return {
          product,
        };
      } catch (error) {
        if (isAppError(error) && error.statusCode === 404) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: error.message,
          });
        }
        const message = error instanceof Error ? error.message : 'Failed to fetch product';
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: message ?? 'Failed to fetch product',
        });
      }
    }),

  related: publicProcedure
    .input(z.object({
      productId: z.string().regex(MONGODB_OBJECTID_REGEX, 'Invalid product ID'),
      limit: z.number().min(1).max(20).optional().default(() => 6),
    }))
    .query(async ({ input }) => {
      try {
        const products = await productService.getRelatedProducts(input.productId, input.limit);
        return products;
      } catch (error) {
        if (isAppError(error) && error.statusCode === 404) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: error.message,
          });
        }
        const message = error instanceof Error ? error.message : 'Failed to fetch related products';
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: message ?? 'Failed to fetch related products',
        });
      }
    }),

  checkVariantAvailability: publicProcedure
    .input(z.object({
      productId: z.string().regex(MONGODB_OBJECTID_REGEX, 'Invalid product ID'),
      variantId: z.string().optional(),
      variantLabel: z.string().optional(),
    }).refine(
      (data) => data.variantId || data.variantLabel,
      {
        message: 'Either variantId or variantLabel must be provided',
      }
    ))
    .query(async ({ input }) => {
      try {
        const available = await productService.checkVariantAvailability(
          input.productId,
          input.variantId,
          input.variantLabel,
        );
        return { available };
      } catch (error) {
        if (isAppError(error) && error.statusCode === 404) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: error.message,
          });
        }
        const message = error instanceof Error ? error.message : 'Failed to check variant availability';
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: message ?? 'Failed to check variant availability',
        });
      }
    }),

  updateVariantInventory: adminProcedure
    .input(z.object({
      productId: z.string().regex(MONGODB_OBJECTID_REGEX, 'Invalid product ID'),
      variantId: z.string().optional(),
      variantLabel: z.string().optional(),
      quantity: z.number().int(),
      operation: z.enum(['increment', 'decrement', 'set']),
    }).refine(
      (data) => data.variantId || data.variantLabel,
      {
        message: 'Either variantId or variantLabel must be provided',
      }
    ))
    .mutation(async ({ input }) => {
      try {
        const variant = await productService.updateVariantInventory(
          input.productId,
          input.variantId,
          input.quantity,
          input.operation,
          3, // maxRetries
          input.variantLabel,
        );
        return { variant };
      } catch (error) {
        if (isAppError(error)) {
          throw new TRPCError({
            code: error.statusCode === 404 ? 'NOT_FOUND' : 'BAD_REQUEST',
            message: error.message,
          });
        }
        const message = error instanceof Error ? error.message : 'Failed to update variant inventory';
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: message ?? 'Failed to update variant inventory',
        });
      }
    }),
});