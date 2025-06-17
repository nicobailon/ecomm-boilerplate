import { router, protectedProcedure } from '../index.js';
import { addToCartSchema, updateQuantitySchema } from '../../validations/index.js';
import { cartService } from '../../services/cart.service.js';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { MONGODB_OBJECTID_REGEX } from '../../utils/constants.js';

export const cartRouter = router({
  get: protectedProcedure
    .query(async ({ ctx }) => {
      try {
        return await cartService.getCartProducts(ctx.user);
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to get cart',
        });
      }
    }),
    
  add: protectedProcedure
    .input(addToCartSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        return await cartService.addToCart(ctx.user, input.productId);
      } catch (error: any) {
        if (error.statusCode === 404) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: error.message,
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to add to cart',
        });
      }
    }),
    
  updateQuantity: protectedProcedure
    .input(updateQuantitySchema.extend({
      productId: z.string().regex(MONGODB_OBJECTID_REGEX, 'Invalid product ID'),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        return await cartService.updateQuantity(ctx.user, input.productId, input.quantity);
      } catch (error: any) {
        if (error.statusCode === 404) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: error.message,
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to update quantity',
        });
      }
    }),
    
  remove: protectedProcedure
    .input(z.string().regex(MONGODB_OBJECTID_REGEX, 'Invalid product ID'))
    .mutation(async ({ input, ctx }) => {
      try {
        return await cartService.removeFromCart(ctx.user, input);
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to remove from cart',
        });
      }
    }),
    
  clear: protectedProcedure
    .mutation(async ({ ctx }) => {
      try {
        return await cartService.removeFromCart(ctx.user);
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message || 'Failed to clear cart',
        });
      }
    }),
});