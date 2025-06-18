export const APP_ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  ADMIN: '/admin',
  CART: '/cart',
  CATEGORY: (category: string) => `/${category}`,
  PURCHASE_SUCCESS: '/purchase-success',
  PURCHASE_CANCEL: '/purchase-cancel',
} as const;

export const LOCAL_STORAGE_KEYS = {
  THEME: 'app-theme',
  AUTH_TOKEN: 'auth-token',
  CART_ITEMS: 'cart-items',
  PRODUCT_DRAFT: 'productDraft',
} as const;

export const QUERY_KEYS = {
  USER: ['user'],
  PRODUCTS: ['products'],
  FEATURED_PRODUCTS: ['featured-products'],
  PRODUCT_RECOMMENDATIONS: ['product-recommendations'],
  CART: ['cart'],
  ANALYTICS: ['analytics'],
} as const;

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    SIGNUP: '/auth/signup',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
    REFRESH: '/auth/refresh',
  },
  PRODUCTS: {
    BASE: '/products',
    FEATURED: '/products/featured',
    RECOMMENDATIONS: '/products/recommendations',
    TOGGLE_FEATURED: (id: string) => `/products/${id}/toggle-featured`,
  },
  CART: {
    BASE: '/cart',
    COUPONS: '/cart/coupons',
  },
  ANALYTICS: '/analytics',
  PAYMENTS: {
    CREATE_SESSION: '/payments/create-checkout-session',
    SUCCESS: '/payments/checkout-success',
  },
} as const;

export const UI_CONSTANTS = {
  NAVIGATION_DELAY: 500,
  TOAST_DURATION: 4000,
  DEBOUNCE_DELAY: 300,
  PRODUCTS_PER_PAGE: 20,
  MIN_PASSWORD_LENGTH: 6,
} as const;

export const PRODUCT_CATEGORIES = [
  { value: 'jeans', label: 'Jeans' },
  { value: 't-shirts', label: 'T-Shirts' },
  { value: 'shoes', label: 'Shoes' },
  { value: 'glasses', label: 'Glasses' },
  { value: 'jackets', label: 'Jackets' },
  { value: 'suits', label: 'Suits' },
  { value: 'bags', label: 'Bags' },
] as const;

export const ERROR_MESSAGES = {
  GENERIC: 'Something went wrong. Please try again.',
  NETWORK: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'Please login to continue.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION: 'Please check your input and try again.',
} as const;