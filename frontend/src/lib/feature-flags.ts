import {
  USE_TRPC_PRODUCTS,
  USE_TRPC_CART,
  USE_TRPC_ANALYTICS,
  USE_TRPC_COUPONS,
  USE_TRPC_PAYMENT,
  isAnyTrpcEnabled,
} from './env';

// Feature flags for gradual migration
// AUTH HAS BEEN MIGRATED - DO NOT ADD BACK
export const FEATURE_FLAGS = {
  USE_TRPC_PRODUCTS,
  USE_TRPC_CART,
  USE_TRPC_ANALYTICS,
  USE_TRPC_COUPONS,
  USE_TRPC_PAYMENT,
} as const;

// Helper to check if any tRPC feature is enabled
export const isAnyTRPCEnabled = isAnyTrpcEnabled;