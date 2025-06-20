import { router, protectedProcedure } from '../index.js';
import { addToCartSchema, updateQuantitySchema, removeFromCartSchema } from '../../validations/index.js';
import { cartService } from '../../services/cart.service.js';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { MONGODB_OBJECTID_REGEX } from '../../utils/constants.js';
import { isAppError } from '../../utils/error-types.js';

export const cartRouter = router({
  get: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        return await cartService.calculateCartTotals(ctx.user);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to get cart';
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: message ?? 'Failed to get cart',
        });
      }
    }),
    
  add: protectedProcedure
    .input(addToCartSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        await cartService.addToCart(ctx.user, input.productId, input.variantId);
        return await cartService.calculateCartTotals(ctx.user);
      } catch (error) {
        if (isAppError(error)) {
          throw new TRPCError({
            code: error.statusCode === 404 ? 'NOT_FOUND' : 'BAD_REQUEST',
            message: error.message,
          });
        }
        const message = error instanceof Error ? error.message : 'Failed to add to cart';
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: message ?? 'Failed to add to cart',
        });
      }
    }),
    
  updateQuantity: protectedProcedure
    .input(updateQuantitySchema.extend({
      productId: z.string().regex(MONGODB_OBJECTID_REGEX, 'Invalid product ID'),
      variantId: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        await cartService.updateQuantity(ctx.user, input.productId, input.quantity, input.variantId);
        return await cartService.calculateCartTotals(ctx.user);
      } catch (error) {
        if (isAppError(error)) {
          throw new TRPCError({
            code: error.statusCode === 404 ? 'NOT_FOUND' : 'BAD_REQUEST',
            message: error.message,
          });
        }
        const message = error instanceof Error ? error.message : 'Failed to update quantity';
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: message ?? 'Failed to update quantity',
        });
      }
    }),
    
  remove: protectedProcedure
    .input(removeFromCartSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        await cartService.removeFromCart(ctx.user, input.productId, input.variantId);
        return await cartService.calculateCartTotals(ctx.user);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to remove from cart';
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: message ?? 'Failed to remove from cart',
        });
      }
    }),
    
  clear: protectedProcedure
    .mutation(async ({ ctx }) => {
      try {
        await cartService.removeFromCart(ctx.user);
        return await cartService.calculateCartTotals(ctx.user);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to clear cart';
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: message ?? 'Failed to clear cart',
        });
      }
    }),
});