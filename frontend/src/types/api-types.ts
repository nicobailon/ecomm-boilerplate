import type { MediaItem } from './media';

export interface IUser {
  _id?: string;
  name: string;
  email: string;
  password: string;
  role: 'customer' | 'admin';
  cartItems: ICartItem[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICartItem {
  product: string;
  quantity: number;
}

export interface IProduct {
  _id?: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  isFeatured: boolean;
  mediaGallery?: MediaItem[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IOrder {
  _id?: string;
  user: string;
  products: {
    product: string;
    quantity: number;
    price: number;
  }[];
  totalAmount: number;
  stripeSessionId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICoupon {
  _id?: string;
  code: string;
  discountPercentage: number;
  expirationDate: Date;
  isActive: boolean;
  userId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AnalyticsData {
  users: number;
  products: number;
  totalSales: number;
  totalRevenue: number;
}

export interface DailySalesData {
  date: string;
  sales: number;
  revenue: number;
}

// UploadThing file router type - this would normally come from the backend
// This is a mock type that satisfies the FileRouter constraint
// In production, this should be imported from the backend's uploadthing configuration
export type OurFileRouter = Record<string, unknown>;