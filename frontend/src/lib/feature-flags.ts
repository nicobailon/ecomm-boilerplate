import {
  USE_TRPC_CART,
  USE_TRPC_ANALYTICS,
  USE_TRPC_COUPONS,
  USE_TRPC_PAYMENT,
  isAnyTrpcEnabled,
} from './env';

// Feature flags for gradual migration
// AUTH HAS BEEN MIGRATED - DO NOT ADD BACK
// PRODUCTS HAS BEEN MIGRATED - DO NOT ADD BACK
export const FEATURE_FLAGS = {
  USE_TRPC_PRODUCTS: true, // Fully migrated - always enabled
  USE_TRPC_CART,
  USE_TRPC_ANALYTICS,
  USE_TRPC_COUPONS,
  USE_TRPC_PAYMENT,
  USE_VARIANT_ATTRIBUTES: false, // Will be toggled based on backend /status route (Gate G-3)
  USE_MEDIA_GALLERY: process.env.NODE_ENV === 'development', // Enable in development for testing
} as const;

// Helper to check if any tRPC feature is enabled
export const isAnyTRPCEnabled = isAnyTrpcEnabled;