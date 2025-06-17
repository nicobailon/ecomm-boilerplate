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
  category: ProductCategory;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  product: string | Product;
  quantity: number;
}

export type ProductCategory = 'jeans' | 't-shirts' | 'shoes' | 'glasses' | 'jackets' | 'suits' | 'bags';

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