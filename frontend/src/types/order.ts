import type { RouterOutputs } from '@/lib/trpc';

export type Order = RouterOutputs['order']['getById'];
export type OrderListItem = RouterOutputs['order']['listAll']['orders'][number];
export type OrderStatus = 'pending' | 'completed' | 'cancelled' | 'refunded' | 'pending_inventory';

// Status history entry type
export interface StatusHistoryEntry {
  from: OrderStatus;
  to: OrderStatus;
  timestamp: Date;
  userId?: string;
  reason?: string;
}

// Update to use 'products' instead of 'items'
export type OrderProduct = Order['products'][number];
export type ShippingAddress = NonNullable<Order['shippingAddress']>;
export type BillingAddress = NonNullable<Order['billingAddress']>;

// Extract statusHistory type from Order
export type OrderStatusHistory = Order['statusHistory'];

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

export interface OrderExportFilters extends OrderFilters {
  selectedOnly?: boolean;
  selectedIds?: string[];
  includeAddresses?: boolean;
  includeStatusHistory?: boolean;
  format?: 'csv' | 'json' | 'excel';
}