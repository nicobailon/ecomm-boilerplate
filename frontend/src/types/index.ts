import type { MediaItem } from './media';

export type { MediaItem } from './media';

// These will be imported from backend later
export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'customer' | 'admin';
  cartItems: CartItem[];
}

export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  collectionId?: string | { _id: string; name: string; slug: string };
  isFeatured: boolean;
  slug?: string;
  sku?: string;
  variants?: {
    variantId: string;
    label?: string;
    color?: string;
    price: number;
    inventory: number;
    reservedInventory?: number;
    images?: string[];
    sku?: string;
  }[];
  inventory?: number;
  lowStockThreshold?: number;
  mediaGallery?: MediaItem[];
  createdAt: string;
  updatedAt: string;
}

// Extended product type with inventory information
export interface ProductWithInventory extends Product {
  inventory?: number;
}

export interface CartItem {
  product: string | Product;
  quantity: number;
  variantId?: string;
  variantDetails?: {
    label?: string;
    color?: string;
    price: number;
    sku?: string;
    attributes?: Record<string, string>;
  };
}

export interface Cart {
  cartItems: (CartItem & { 
    product: Product;
  })[];
  subtotal: number;
  totalAmount: number;
  appliedCoupon: {
    code: string;
    discountPercentage: number;
  } | null;
}

export interface Coupon {
  code: string;
  discountPercentage: number;
  expirationDate: string;
  isActive: boolean;
}

export interface Collection {
  _id: string;
  name: string;
  description?: string;
  slug: string;
  owner: string | { _id: string; name: string; email: string };
  products: (string | Product)[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CollectionListResponse {
  collections: Collection[];
  nextCursor: string | null;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface AnalyticsData {
  users: number;
  products: number;
  totalSales: number;
  totalRevenue: number;
}

export interface DailySalesData {
  name: string;
  sales: number;
  revenue: number;
}

// Shared constants for navigation
export const NAVIGATION_DELAY = 1500; // ms

// Product creation types for form/navigation integration
export interface ProductCreationResult {
  productId: string;
  timestamp: number;
  bulkMode: boolean;
}

// Navigation state types
export interface NavigationState {
  isNavigating: boolean;
  targetTab?: TabId;
  highlightId?: string;
}

export type TabId = 'create' | 'products' | 'analytics' | 'collections' | 'discounts' | 'inventory';

// CreateProductForm callback props
export interface CreateProductFormProps {
  onProductCreated?: (productId: string) => void;
}

// ProductsList props for highlighting
export interface ProductsListProps {
  highlightProductId?: string | null;
  onHighlightComplete?: () => void;
  onEditProduct?: (product: Product) => void;
}

// ProductEditDrawer props
export interface ProductEditDrawerProps {
  isOpen: boolean;
  product: Product | null;
  onClose: () => void;
}

// ProductForm types
export type ProductFormMode = 'create' | 'edit';

export interface ProductFormProps {
  mode: ProductFormMode;
  initialData?: Product;
  onSuccess?: (product: Product) => void;
}

/**
 * FormVariant represents the variant data structure used in the form UI.
 * This is what users see and interact with when creating/editing variants.
 * The variantId is optional because new variants won't have it initially - it's generated before submission.
 */
export interface FormVariant {
  variantId?: string; // Optional because new variants won't have it initially
  label: string;
  priceAdjustment?: number; // Optional with default 0 in schema
  inventory: number;
  reservedInventory?: number; // Optional with default 0
  images?: string[]; // Optional with default empty array
  sku?: string;
}

/**
 * VariantSubmission represents the data structure that must be sent to the backend.
 * This matches the backend's expectations for variant data.
 * The key differences from FormVariant are:
 * - variantId is required
 * - price is absolute (not an adjustment)
 * - color is optional for backward compatibility
 */
export interface VariantSubmission {
  variantId: string; // Required for submission
  label: string;
  color?: string; // Keep optional for backward compatibility
  price: number; // Absolute price, not adjustment
  inventory: number;
  reservedInventory: number; // Required for backend
  images: string[]; // Required for backend
  sku?: string;
}

/**
 * VariantTransform is a function type that converts a FormVariant to a VariantSubmission.
 * This transformation includes:
 * - Generating variantId if missing
 * - Converting priceAdjustment to absolute price using basePrice
 * - Adding optional color field for backward compatibility
 */
export type VariantTransform = (variant: FormVariant, basePrice: number) => VariantSubmission;