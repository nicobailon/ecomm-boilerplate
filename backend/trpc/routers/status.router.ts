import { z } from 'zod';
import { router, publicProcedure } from '../index.js';
import { USE_VARIANT_LABEL, USE_VARIANT_ATTRIBUTES } from '../../utils/featureFlags.js';

export const statusRouter = router({
  flags: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/status/flags',
        tags: ['status'],
        summary: 'Get feature flags status',
        description: 'Returns the current state of feature flags for frontend synchronization',
      },
    })
    .output(
      z.object({
        useVariantLabel: z.boolean(),
        useVariantAttributes: z.boolean(),
        timestamp: z.string(),
      })
    )
    .query(async () => {
      return {
        useVariantLabel: USE_VARIANT_LABEL,
        useVariantAttributes: USE_VARIANT_ATTRIBUTES,
        timestamp: new Date().toISOString(),
      };
    }),
    
  health: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/status/health',
        tags: ['status'],
        summary: 'Health check endpoint',
      },
    })
    .output(
      z.object({
        status: z.literal('ok'),
        timestamp: z.string(),
      })
    )
    .query(async () => {
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
      };
    }),
});