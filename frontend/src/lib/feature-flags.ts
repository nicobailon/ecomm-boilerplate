// Feature flags for gradual migration
// AUTH HAS BEEN MIGRATED - DO NOT ADD BACK
export const FEATURE_FLAGS = {
  USE_TRPC_PRODUCTS: import.meta.env.VITE_USE_TRPC_PRODUCTS === 'true',
  USE_TRPC_CART: import.meta.env.VITE_USE_TRPC_CART === 'true',
  USE_TRPC_ANALYTICS: import.meta.env.VITE_USE_TRPC_ANALYTICS === 'true',
  USE_TRPC_COUPONS: import.meta.env.VITE_USE_TRPC_COUPONS === 'true',
  USE_TRPC_PAYMENT: import.meta.env.VITE_USE_TRPC_PAYMENT === 'true',
} as const;

// Helper to check if any tRPC feature is enabled
export const isAnyTRPCEnabled = Object.values(FEATURE_FLAGS).some(flag => flag);