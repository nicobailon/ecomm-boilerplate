export const CACHE_TTL = {
  PRODUCT_DETAIL: 5 * 60, // 5 minutes
  FEATURED_PRODUCTS: 60 * 60, // 1 hour
  RELATED_PRODUCTS: 10 * 60, // 10 minutes
  ANALYTICS_DATA: 15 * 60, // 15 minutes
} as const;

export const CACHE_KEYS = {
  PRODUCT_SLUG: (slug: string) => `product:slug:${slug}`,
  FEATURED_PRODUCTS: 'featured_products',
  RELATED_PRODUCTS: (productId: string, limit: number) => `related:${productId}:${limit}`,
  PRODUCT_COLLECTION: (collectionId: string) => `products:collection:${collectionId}`,
  PRODUCT_SEARCH: (query: string, page: number) => `products:search:${query}:${page}`,
} as const;

export const CACHE_PATTERNS = {
  ALL_PRODUCTS: 'product:*',
  ALL_FEATURED: 'featured_*',
  ALL_RELATED: 'related:*',
  PRODUCT_BY_SLUG: 'product:slug:*',
} as const;