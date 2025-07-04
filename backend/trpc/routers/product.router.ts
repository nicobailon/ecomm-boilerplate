import { router, publicProcedure, adminProcedure } from '../index.js';
import { z } from 'zod';
import { productService } from '../../services/product.service.js';
import { 
  updateProductSchema,
  getProductBySlugSchema,
} from '../../validations/index.js';
import { baseProductSchema } from '../../validations/product.validation.js';
import { TRPCError } from '@trpc/server';
import { ZodError } from 'zod';
import { MONGODB_OBJECTID_REGEX } from '../../utils/constants.js';
import { isAppError } from '../../utils/error-types.js';
import { logProductCreation, logValidationError } from '../../lib/logger.js';

export const productRouter = router({
  list: publicProcedure
    .input(z.object({
      page: z.number().min(1).optional().default(() => 1),
      limit: z.number().min(1).max(100).optional().default(() => 12),
      search: z.string().optional(),
      includeVariants: z.boolean().optional().default(false),
      collectionId: z.string().optional(),
      isFeatured: z.boolean().optional(),
      sortBy: z.enum(['name', 'price', 'createdAt', 'updatedAt']).optional(),
      sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
      stockStatus: z.enum(['all', 'inStock', 'lowStock', 'outOfStock']).optional(),
    }))
    .query(async ({ input }) => {
      try {
        const result = await productService.getAllProducts(
          input.page, 
          input.limit, 
          input.search, 
          input.includeVariants,
          {
            collectionId: input.collectionId,
            isFeatured: input.isFeatured,
            sortBy: input.sortBy,
            sortOrder: input.sortOrder,
            stockStatus: input.stockStatus,
          },
        );
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
        logProductCreation.start({
          userId: ctx.userId,
          inputKeys: Object.keys(input),
          hasMediaGallery: 'mediaGallery' in input,
          mediaGalleryLength: input.mediaGallery?.length ?? 0,
        });

        const result = await productService.createProductWithCollection(
          ctx.userId,
          input,
        );

        logProductCreation.success({
          productId: result.product._id ?? 'unknown',
          productName: result.product.name,
          collectionCreated: result.created.collection,
          userId: ctx.userId,
        });

        return {
          product: result.product,
          collection: result.collection,
          created: result.created,
        };
      } catch (error) {
        logProductCreation.error({
          userId: ctx.userId,
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          inputData: {
            name: input.name,
            hasImage: !!input.image,
            hasMediaGallery: 'mediaGallery' in input,
            mediaGalleryLength: input.mediaGallery?.length ?? 0,
            variantsCount: input.variants?.length ?? 0,
          },
        });

        // Handle validation errors specifically
        if (error instanceof ZodError) {
          const validationErrors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);

          logValidationError({
            operation: 'product.create',
            userId: ctx.userId,
            validationErrors,
            inputData: { name: input.name, hasMediaGallery: 'mediaGallery' in input },
          });

          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Validation failed: ${validationErrors.join(', ')}`,
          });
        }

        if (isAppError(error) && error.statusCode === 400) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: error.message,
          });
        }

        // Enhanced error message for debugging (sanitized for production)
        const message = error instanceof Error ? error.message : 'Failed to create product';
        const enhancedMessage = process.env.NODE_ENV === 'development'
          ? `Product creation failed: ${message}. Check server logs for details.`
          : 'Product creation failed. Please try again or contact support.';

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: enhancedMessage,
        });
      }
    }),

  update: adminProcedure
    .input(z.object({
      id: z.string().regex(MONGODB_OBJECTID_REGEX, 'Invalid product ID'),
      data: updateProductSchema
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

  bulkUpdate: adminProcedure
    .input(z.object({
      updates: z.array(z.object({
        id: z.string().regex(MONGODB_OBJECTID_REGEX, 'Invalid product ID'),
        data: updateProductSchema
      })).min(1, 'At least one update is required').max(50, 'Maximum 50 updates allowed')
    }))
    .mutation(async ({ input }) => {
      try {
        const results = await productService.bulkUpdateProducts(input.updates);
        return {
          success: results.success,
          updated: results.updated,
          failed: results.failed,
          errors: results.errors
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to bulk update products';
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: message ?? 'Failed to bulk update products',
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
      (data) => Boolean(data.variantId ?? data.variantLabel),
      {
        message: 'Either variantId or variantLabel must be provided',
      },
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
      (data) => Boolean(data.variantId ?? data.variantLabel),
      {
        message: 'Either variantId or variantLabel must be provided',
      },
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