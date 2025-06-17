import { router, publicProcedure, adminProcedure } from '../index.js';
import { z } from 'zod';
import { productService } from '../../services/product.service.js';
import { createProductSchema, updateProductSchema } from '../../validations/index.js';
import { TRPCError } from '@trpc/server';
import { MONGODB_OBJECTID_REGEX } from '../../utils/constants.js';

export const productRouter = router({
  list: publicProcedure
    .input(z.object({
      page: z.number().min(1).optional().default(1),
      limit: z.number().min(1).max(100).optional().default(12),
      category: z.string().optional(),
    }))
    .query(async ({ input }) => {
      try {
        return await productService.getAllProducts(input.page, input.limit, input.category);
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to fetch products',
        });
      }
    }),

  byCategory: publicProcedure
    .input(z.string())
    .query(async ({ input }) => {
      try {
        return await productService.getProductsByCategory(input);
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to fetch products by category',
        });
      }
    }),

  featured: publicProcedure
    .query(async () => {
      try {
        return await productService.getFeaturedProducts();
      } catch (error: any) {
        if (error.statusCode === 404) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: error.message,
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to fetch featured products',
        });
      }
    }),

  recommended: publicProcedure
    .query(async () => {
      try {
        return await productService.getRecommendedProducts();
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to fetch recommended products',
        });
      }
    }),

  byId: publicProcedure
    .input(z.string().regex(MONGODB_OBJECTID_REGEX, 'Invalid product ID'))
    .query(async ({ input }) => {
      try {
        return await productService.getProductById(input);
      } catch (error: any) {
        if (error.statusCode === 404) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: error.message,
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to fetch product',
        });
      }
    }),

  create: adminProcedure
    .input(createProductSchema)
    .mutation(async ({ input }) => {
      try {
        return await productService.createProduct(input);
      } catch (error: any) {
        if (error.statusCode === 400) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: error.message,
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to create product',
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
      } catch (error: any) {
        if (error.statusCode === 404) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: error.message,
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to update product',
        });
      }
    }),

  delete: adminProcedure
    .input(z.string())
    .mutation(async ({ input }) => {
      try {
        await productService.deleteProduct(input);
        return { success: true };
      } catch (error: any) {
        if (error.statusCode === 404) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: error.message,
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to delete product',
        });
      }
    }),

  toggleFeatured: adminProcedure
    .input(z.string())
    .mutation(async ({ input }) => {
      try {
        return await productService.toggleFeaturedProduct(input);
      } catch (error: any) {
        if (error.statusCode === 404) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: error.message,
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to toggle featured status',
        });
      }
    }),
});