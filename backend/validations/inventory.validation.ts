import { z } from 'zod';

export const inventoryUpdateReasonSchema = z.enum([
  'sale',
  'return',
  'restock',
  'adjustment',
  'damage',
  'theft',
  'transfer',
  'reservation_expired',
  'manual_correction',
]);

export const stockStatusSchema = z.enum([
  'in_stock',
  'low_stock',
  'out_of_stock',
  'backordered',
]);

export const inventoryUpdateSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  variantId: z.string().optional(),
  variantLabel: z.string().optional(),
  adjustment: z.number().int('Adjustment must be an integer'),
  reason: inventoryUpdateReasonSchema,
  metadata: z.record(z.unknown()).optional(),
}).refine(
  (data) => {
    // Prevent extremely large adjustments that could be mistakes
    const MAX_ADJUSTMENT = 10000;
    return Math.abs(data.adjustment) <= MAX_ADJUSTMENT;
  },
  {
    message: 'Adjustment value is too large (max: ±10000)',
    path: ['adjustment'],
  },
).refine(
  (data) => {
    // For certain reasons, only allow negative adjustments
    const negativeOnlyReasons = ['sale', 'damage', 'theft', 'transfer'];
    if (negativeOnlyReasons.includes(data.reason)) {
      return data.adjustment <= 0;
    }
    // For returns and restocks, only allow positive adjustments
    const positiveOnlyReasons = ['return', 'restock'];
    if (positiveOnlyReasons.includes(data.reason)) {
      return data.adjustment >= 0;
    }
    return true;
  },
  {
    message: 'Adjustment sign does not match the reason',
    path: ['adjustment'],
  },
);

export const bulkInventoryUpdateSchema = z.object({
  updates: z.array(inventoryUpdateSchema).min(1, 'At least one update is required'),
});

export const inventoryQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(['name', 'stock', 'value', 'updatedAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  stockStatus: stockStatusSchema.optional(),
  search: z.string().optional(),
});

export const inventoryHistoryQuerySchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  variantId: z.string().optional(),
  variantLabel: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export const inventoryReservationSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  variantId: z.string().optional(),
  variantLabel: z.string().optional(),
  quantity: z.number().int().positive('Quantity must be positive'),
  sessionId: z.string().min(1, 'Session ID is required'),
  duration: z.number().int().positive().optional(),
});

export const inventoryCheckSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  variantId: z.string().optional(),
  variantLabel: z.string().optional(),
  quantity: z.number().int().positive('Quantity must be positive').default(1),
});

export const lowStockQuerySchema = z.object({
  threshold: z.coerce.number().int().min(0).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const inventoryTurnoverQuerySchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

export type InventoryUpdateInput = z.infer<typeof inventoryUpdateSchema>;
export type BulkInventoryUpdateInput = z.infer<typeof bulkInventoryUpdateSchema>;
export type InventoryQueryInput = z.infer<typeof inventoryQuerySchema>;
export type InventoryHistoryQueryInput = z.infer<typeof inventoryHistoryQuerySchema>;
export type InventoryReservationInput = z.infer<typeof inventoryReservationSchema>;
export type InventoryCheckInput = z.infer<typeof inventoryCheckSchema>;
export type LowStockQueryInput = z.infer<typeof lowStockQuerySchema>;
export type InventoryTurnoverQueryInput = z.infer<typeof inventoryTurnoverQuerySchema>;