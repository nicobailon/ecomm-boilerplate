import { router, publicProcedure, adminProcedure } from '../index.js';
import { z } from 'zod';
import { productService } from '../../services/product.service.js';
import { createProductSchema, updateProductSchema } from '../../validations/index.js';
import { TRPCError } from '@trpc/server';
import { MONGODB_OBJECTID_REGEX } from '../../utils/constants.js';
import { isAppError } from '../../utils/error-types.js';

export const productRouter = router({
  list: publicProcedure
    .input(z.object({
      page: z.number().min(1).optional().default(1),
      limit: z.number().min(1).max(100).optional().default(12),
      search: z.string().optional(),
    }))
    .query(async ({ input }) => {
      try {
        return await productService.getAllProducts(input.page, input.limit, input.search);
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
    .input(createProductSchema.extend({
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
    ))
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
});