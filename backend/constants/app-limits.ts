import { VARIANT_LIMITS } from '../../shared/constants/variant.constants.js';

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 12,
  MAX_LIMIT: 100,
  MIN_LIMIT: 1,
} as const;

export const PRODUCT_LIMITS = {
  MIN_PRICE: 0.01,
  MAX_PRICE: 999999.99,
  MAX_RELATED_PRODUCTS: 6,
  MIN_NAME_LENGTH: 1,
  MAX_NAME_LENGTH: 100,
  MIN_DESCRIPTION_LENGTH: 1,
  MAX_DESCRIPTION_LENGTH: 1000,
  MAX_VARIANTS: 50,
  MIN_INVENTORY: 0,
  MAX_INVENTORY: 999999,
} as const;

// Re-export VARIANT_LIMITS from shared constants
export { VARIANT_LIMITS };

export const RETRY_CONFIG = {
  MAX_INVENTORY_UPDATE_RETRIES: 3,
  BASE_RETRY_DELAY_MS: 100,
  EXPONENTIAL_BACKOFF_BASE: 2,
} as const;

export const REDIS_SCAN_CONFIG = {
  SCAN_COUNT: 100,
} as const;