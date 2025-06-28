import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import mongoose from 'mongoose';
import { protectedProcedure, publicProcedure, router } from '../index.js';
import { createRateLimiter } from '../middleware/rateLimiter.js';
import { handleTRPCError } from '../../utils/trpcErrorHandler.js';
import {
  createCollectionSchema,
  updateCollectionSchema,
  updateHeroContentSchema,
  addProductsToCollectionSchema,
  removeProductsFromCollectionSchema,
  getCollectionByIdSchema,
  getCollectionBySlugSchema,
  deleteCollectionSchema,
  quickCreateCollectionSchema,
  checkAvailabilitySchema,
} from '../../validations/collection.validation.js';
import { collectionService } from '../../services/collection.service.js';

const collectionCreationLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  prefix: 'rl:collection:create:',
});

const collectionCheckLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60,
  prefix: 'rl:collection:check:',
});

export const collectionRouter = router({
  create: protectedProcedure
    .use(collectionCreationLimiter)
    .input(createCollectionSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const collection = await collectionService.create(ctx.userId, input);
        return collection;
      } catch (error) {
        handleTRPCError(error);
      }
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: updateCollectionSchema,
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const collection = await collectionService.update(
          input.id,
          ctx.userId,
          input.data,
        );
        return collection;
      } catch (error) {
        handleTRPCError(error);
      }
    }),

  delete: protectedProcedure
    .input(deleteCollectionSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        await collectionService.delete(input.id, ctx.userId);
        return { success: true };
      } catch (error) {
        handleTRPCError(error);
      }
    }),

  addProducts: protectedProcedure
    .input(
      z.object({
        collectionId: z.string(),
        productIds: addProductsToCollectionSchema.shape.productIds,
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const collection = await collectionService.addProducts(
          input.collectionId,
          ctx.userId,
          input.productIds,
        );
        return collection;
      } catch (error) {
        handleTRPCError(error);
      }
    }),

  removeProducts: protectedProcedure
    .input(
      z.object({
        collectionId: z.string(),
        productIds: removeProductsFromCollectionSchema.shape.productIds,
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const collection = await collectionService.removeProducts(
          input.collectionId,
          ctx.userId,
          input.productIds,
        );
        return collection;
      } catch (error) {
        handleTRPCError(error);
      }
    }),

  setProducts: protectedProcedure
    .input(
      z.object({
        collectionId: z.string(),
        productIds: z.array(z.string()),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      try {
        const collection = await collectionService.setProductsForCollection(
          input.collectionId,
          ctx.userId,
          input.productIds,
        );
        return collection;
      } catch (error) {
        handleTRPCError(error);
      }
    }),

  getById: publicProcedure
    .input(getCollectionByIdSchema)
    .query(async ({ input, ctx }) => {
      try {
        const collection = await collectionService.getById(
          input.id,
          ctx.user?._id?.toString(),
        );
        if (!collection) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Collection not found',
          });
        }
        return collection;
      } catch (error) {
        handleTRPCError(error);
      }
    }),

  getBySlug: publicProcedure
    .input(getCollectionBySlugSchema)
    .query(async ({ input, ctx }) => {
      try {
        const collection = await collectionService.getBySlug(
          input.slug,
          ctx.user?._id?.toString(),
        );
        if (!collection) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Collection not found',
          });
        }
        return collection;
      } catch (error) {
        handleTRPCError(error);
      }
    }),

  list: publicProcedure
    .input(
      z.object({
        userId: z.string().optional(),
        isPublic: z.boolean().optional(),
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      try {
        const result = await collectionService.list(input);
        return result;
      } catch (error) {
        handleTRPCError(error);
      }
    }),

  myCollections: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        cursor: z.string().optional(),
        // Page-based pagination
        page: z.number().min(1).optional(),
        // Sorting
        sortBy: z.enum(['name', 'createdAt', 'updatedAt', 'productCount']).default('createdAt').optional(),
        sortOrder: z.enum(['asc', 'desc']).default('desc').optional(),
        // Filtering
        search: z.string().optional(),
        isPublic: z.boolean().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      try {
        const result = await collectionService.getUserCollections(
          ctx.userId,
          input,
        );
        return result;
      } catch (error) {
        handleTRPCError(error);
      }
    }),

  quickCreate: protectedProcedure
    .use(collectionCreationLimiter)
    .input(quickCreateCollectionSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const collection = await collectionService.quickCreate(
          ctx.userId,
          input,
        );
        
        return {
          _id: (collection._id as mongoose.Types.ObjectId).toString(),
          name: collection.name,
          slug: collection.slug,
          isPublic: collection.isPublic,
        };
      } catch (error) {
        handleTRPCError(error);
      }
    }),
    
  checkAvailability: protectedProcedure
    .use(collectionCheckLimiter)
    .input(checkAvailabilitySchema)
    .query(async ({ input, ctx }) => {
      try {
        return await collectionService.checkNameAvailability(
          ctx.userId,
          input.name,
        );
      } catch (error) {
        handleTRPCError(error);
      }
    }),

  updateHeroContent: protectedProcedure
    .input(updateHeroContentSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const { id, ...heroData } = input;
        const collection = await collectionService.updateHeroContent(
          id,
          ctx.userId,
          heroData,
        );
        return collection;
      } catch (error) {
        handleTRPCError(error);
      }
    }),

  getFeaturedCollections: publicProcedure
    .query(async () => {
      try {
        const collections = await collectionService.getFeaturedCollections();
        return collections;
      } catch (error) {
        handleTRPCError(error);
      }
    }),
});