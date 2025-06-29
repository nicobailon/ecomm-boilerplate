import type { IOrderDocument } from '../models/order.model.js';
import type mongoose from 'mongoose';

export interface OrderWithPopulatedData extends Omit<IOrderDocument, 'user' | 'products'> {
  user: {
    _id: mongoose.Types.ObjectId;
    email: string;
    name: string;
  };
  products: {
    product: {
      _id: mongoose.Types.ObjectId;
      name: string;
      image: string;
    };
    quantity: number;
    price: number;
    variantId?: string;
    variantDetails?: {
      size?: string;
      color?: string;
      sku?: string;
    };
    variantLabel?: string;
  }[];
}

export interface OrderListResponse {
  orders: OrderWithPopulatedData[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

export interface BulkUpdateResponse {
  success: boolean;
  message: string;
  matchedCount: number;
  modifiedCount: number;
}

export interface OrderStats {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  statusBreakdown: {
    pending: number;
    completed: number;
    cancelled: number;
    refunded: number;
  };
  revenueByDay: {
    _id: {
      year: number;
      month: number;
      day: number;
    };
    revenue: number;
    count: number;
  }[];
  topProducts: {
    _id: mongoose.Types.ObjectId;
    name: string;
    totalSold: number;
    revenue: number;
  }[];
}