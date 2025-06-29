// All API routes have been migrated to tRPC
// These flags now default to true but can be overridden via env vars for testing
export const FEATURE_FLAGS = {
  USE_TRPC_PRODUCTS: true,
  USE_TRPC_CART: true,
  USE_TRPC_ANALYTICS: true,
  USE_TRPC_COUPONS: true,
  USE_TRPC_PAYMENT: true,
  USE_VARIANT_ATTRIBUTES: false, // Will be toggled based on backend /status route (Gate G-3)
  USE_MEDIA_GALLERY: process.env.NODE_ENV === 'development', // Enable in development for testing
} as const;

// Helper to check if any tRPC feature is enabled (always true now)
export const isAnyTRPCEnabled = true;