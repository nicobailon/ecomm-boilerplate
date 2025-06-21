/**
 * Shared variant-related constants used by both frontend and backend
 * This ensures consistency across the application
 */

export const VARIANT_LIMITS = {
  MIN_VARIANT_ID_LENGTH: 1,
  MAX_SKU_LENGTH: 50,
  MAX_IMAGES_PER_VARIANT: 10,
  NANOID_LENGTH: 6, // Length of generated IDs using nanoid
} as const;