import type { RouterOutputs } from '@/lib/trpc';

export type Order = RouterOutputs['order']['getById'];
export type OrderListItem = RouterOutputs['order']['listAll']['orders'][number];
export type OrderStatus = 'pending' | 'completed' | 'cancelled' | 'refunded';

// Update to use 'products' instead of 'items'
export type OrderProduct = Order['products'][number];
export type ShippingAddress = NonNullable<Order['shippingAddress']>;
export type BillingAddress = NonNullable<Order['billingAddress']>;

// For backward compatibility during migration
export type OrderItem = OrderProduct;

export interface OrderFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: OrderStatus;
  startDate?: Date;
  endDate?: Date;
  sortBy?: 'createdAt' | 'totalAmount' | 'status';
  sortOrder?: 'asc' | 'desc';
}

export interface OrderStatusUpdate {
  orderId: string;
  status: OrderStatus;
}

export interface BulkOrderStatusUpdate {
  orderIds: string[];
  status: OrderStatus;
}