import { router, publicProcedure, adminProcedure } from '../index.js';
import { z } from 'zod';
import { inventoryService } from '../../services/inventory.service.js';
import { createRateLimiter } from '../middleware/rateLimiter.js';
import {
  inventoryUpdateSchema,
  bulkInventoryUpdateSchema,
  inventoryCheckSchema,
  inventoryTurnoverQuerySchema,
} from '../../validations/inventory.validation.js';
import { TRPCError } from '@trpc/server';
import { isAppError } from '../../utils/error-types.js';

// Rate limiters for different operations
const inventoryCheckLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 checks per minute
  prefix: 'inventory:check:',
});

const inventoryUpdateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 updates per minute
  prefix: 'inventory:update:',
});

const inventoryQueryLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 queries per minute
  prefix: 'inventory:query:',
});

export const inventoryRouter = router({
  validateCheckout: publicProcedure
    .use(inventoryCheckLimiter)
    .input(
      z.object({
        products: z.array(
          z.object({
            _id: z.string(),
            quantity: z.number().positive().int(),
            variantId: z.string().optional(),
          }),
        ),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        const validationResult = {
          isValid: true,
          adjustments: [] as {
            productId: string;
            productName: string;
            variantDetails?: string;
            requestedQuantity: number;
            adjustedQuantity: number;
            availableStock: number;
          }[],
        };

        // Check each product's inventory
        for (const product of input.products) {
          const availableStock = await inventoryService.getAvailableInventory(
            product._id,
            product.variantId,
          );

          if (availableStock < product.quantity) {
            validationResult.isValid = false;
            
            const adjustedQuantity = Math.min(product.quantity, availableStock);
            
            validationResult.adjustments.push({
              productId: product._id,
              productName: product._id, // We'd need to fetch this from Product model
              variantDetails: product.variantId,
              requestedQuantity: product.quantity,
              adjustedQuantity,
              availableStock,
            });
          }
        }

        return validationResult;
      } catch (error) {
        if (isAppError(error)) {
          throw new TRPCError({
            code: error.statusCode === 404 ? 'NOT_FOUND' : 'BAD_REQUEST',
            message: error.message,
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to validate checkout inventory',
        });
      }
    }),

  getProductInventory: publicProcedure
    .use(inventoryQueryLimiter)
    .input(
      z.object({
        productId: z.string().min(1),
        variantId: z.string().optional(),
        variantLabel: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      try {
        return await inventoryService.getProductInventoryInfo(
          input.productId,
          input.variantId,
          input.variantLabel,
        );
      } catch (error) {
        if (isAppError(error)) {
          throw new TRPCError({
            code: error.statusCode === 404 ? 'NOT_FOUND' : 'BAD_REQUEST',
            message: error.message,
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch inventory information',
        });
      }
    }),

  checkAvailability: publicProcedure
    .use(inventoryCheckLimiter)
    .input(inventoryCheckSchema)
    .query(async ({ input }) => {
      try {
        const isAvailable = await inventoryService.checkAvailability(
          input.productId,
          input.variantId,
          input.quantity,
          input.variantLabel,
        );
        const availableStock = await inventoryService.getAvailableInventory(
          input.productId,
          input.variantId,
          input.variantLabel,
        );
        return {
          isAvailable,
          availableStock,
          requestedQuantity: input.quantity,
        };
      } catch (error) {
        if (isAppError(error)) {
          throw new TRPCError({
            code: error.statusCode === 404 ? 'NOT_FOUND' : 'BAD_REQUEST',
            message: error.message,
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to check availability',
        });
      }
    }),

  updateInventory: adminProcedure
    .use(inventoryUpdateLimiter)
    .input(inventoryUpdateSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        if (!ctx.user) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
          });
        }

        return await inventoryService.updateInventory(
          input.productId,
          input.variantId,
          input.adjustment,
          input.reason,
          ctx.user._id.toString(),
          input.metadata,
          0, // retryCount
          input.variantLabel,
        );
      } catch (error) {
        if (isAppError(error)) {
          throw new TRPCError({
            code: error.statusCode === 404 ? 'NOT_FOUND' : 'BAD_REQUEST',
            message: error.message,
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update inventory',
        });
      }
    }),

  bulkUpdateInventory: adminProcedure
    .use(inventoryUpdateLimiter)
    .input(bulkInventoryUpdateSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        if (!ctx.user) {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'User not authenticated',
          });
        }

        return await inventoryService.bulkUpdateInventory(
          input.updates,
          ctx.user._id.toString(),
        );
      } catch {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to perform bulk inventory update',
        });
      }
    }),

  getInventoryMetrics: adminProcedure
    .use(inventoryQueryLimiter)
    .query(async () => {
    try {
      return await inventoryService.getInventoryMetrics();
    } catch {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch inventory metrics',
      });
    }
  }),

  getOutOfStockProducts: adminProcedure
    .use(inventoryQueryLimiter)
    .query(async () => {
    try {
      return await inventoryService.getOutOfStockProducts();
    } catch {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch out of stock products',
      });
    }
  }),

  getInventoryTurnover: adminProcedure
    .use(inventoryQueryLimiter)
    .input(inventoryTurnoverQuerySchema)
    .query(async ({ input }) => {
      try {
        return await inventoryService.getInventoryTurnover({
          start: input.startDate,
          end: input.endDate,
        });
      } catch {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to calculate inventory turnover',
        });
      }
    }),
});