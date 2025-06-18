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
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  product: string | Product;
  quantity: number;
}


export interface Coupon {
  code: string;
  discountPercentage: number;
  expirationDate: string;
  isActive: boolean;
}

// API Response types
export interface ApiResponse<T = any> {
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

export type TabId = 'create' | 'products' | 'analytics' | 'collections';

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