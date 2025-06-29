import { OrderWithPopulatedData } from '../types/order.types.js';

// Serialized types that represent what goes over the wire
export interface SerializedOrderProduct {
  product: {
    _id: string;
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
}

export interface SerializedOrder {
  _id: string;
  orderNumber: string;
  user: {
    _id: string;
    email: string;
    name: string;
  };
  email: string;
  products: SerializedOrderProduct[];
  totalAmount: number;
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  stripeSessionId: string;
  status: 'pending' | 'completed' | 'cancelled' | 'refunded' | 'pending_inventory';
  shippingAddress?: {
    fullName: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone?: string;
  };
  billingAddress?: {
    fullName: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  paymentMethod?: string;
  paymentIntentId?: string;
  couponCode?: string;
  originalAmount?: number;
  statusHistory: {
    from: 'pending' | 'completed' | 'cancelled' | 'refunded' | 'pending_inventory';
    to: 'pending' | 'completed' | 'cancelled' | 'refunded' | 'pending_inventory';
    timestamp: Date;
    userId?: string;
    reason?: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SerializedOrderListResponse {
  orders: SerializedOrder[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

export interface SerializedOrderStats {
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
    _id: string;
    name: string;
    totalSold: number;
    revenue: number;
  }[];
}

export function toSerializedOrder(order: OrderWithPopulatedData): SerializedOrder {
  return {
    _id: order._id.toString(),
    orderNumber: order.orderNumber,
    user: {
      _id: order.user._id.toString(),
      email: order.user.email,
      name: order.user.name,
    },
    email: order.email,
    products: order.products.map(p => ({
      product: {
        _id: p.product._id.toString(),
        name: p.product.name,
        image: p.product.image,
      },
      quantity: p.quantity,
      price: p.price,
      variantId: p.variantId,
      variantDetails: p.variantDetails,
      variantLabel: p.variantLabel,
    })),
    totalAmount: order.totalAmount,
    subtotal: order.subtotal,
    tax: order.tax,
    shipping: order.shipping,
    discount: order.discount,
    stripeSessionId: order.stripeSessionId,
    status: order.status,
    shippingAddress: order.shippingAddress,
    billingAddress: order.billingAddress,
    paymentMethod: order.paymentMethod,
    paymentIntentId: order.paymentIntentId,
    couponCode: order.couponCode,
    originalAmount: order.originalAmount,
    statusHistory: order.statusHistory.map(entry => ({
      from: entry.from,
      to: entry.to,
      timestamp: entry.timestamp,
      userId: entry.userId?.toString(),
      reason: entry.reason,
    })),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

export function toSerializedOrderStats(stats: any): SerializedOrderStats {
  return {
    ...stats,
    topProducts: stats.topProducts.map((p: any) => ({
      ...p,
      _id: p._id.toString(),
    })),
  };
}