import { z } from 'zod';

export const listOrdersSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  status: z.enum(['pending', 'completed', 'cancelled', 'refunded', 'all']).default('all'),
  sortBy: z.enum(['createdAt', 'total', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

export const updateOrderStatusSchema = z.object({
  orderId: z.string().min(1),
  status: z.enum(['pending', 'completed', 'cancelled', 'refunded']),
});

export const bulkUpdateOrderStatusSchema = z.object({
  orderIds: z.array(z.string().min(1)).min(1),
  status: z.enum(['pending', 'completed', 'cancelled', 'refunded']),
});

export const getOrderByIdSchema = z.object({
  orderId: z.string().min(1),
});

export const getOrderStatsSchema = z.object({
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
});

export type ListOrdersInput = z.infer<typeof listOrdersSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type BulkUpdateOrderStatusInput = z.infer<typeof bulkUpdateOrderStatusSchema>;
export type GetOrderByIdInput = z.infer<typeof getOrderByIdSchema>;
export type GetOrderStatsInput = z.infer<typeof getOrderStatsSchema>;