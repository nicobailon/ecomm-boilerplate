// Inventory-related types
export interface InventoryData {
  productId: string;
  variantId?: string;
  currentStock: number;
  reservedStock: number;
  availableStock: number;
  lowStockThreshold: number;
  allowBackorder: boolean;
  restockDate?: string;
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock' | 'backordered';
}

export interface InventoryUpdateParams {
  productId: string;
  variantId?: string;
  adjustment: number;
  reason: 'sale' | 'return' | 'restock' | 'adjustment' | 'damage' | 'theft' | 'transfer' | 'reservation_expired' | 'manual_correction';
  metadata?: Record<string, unknown>;
}

export interface InventoryUpdateResponse {
  success: boolean;
  updatedInventory: number;
}

export interface BulkInventoryUpdate {
  productId: string;
  variantId?: string;
  adjustment: number;
  reason: 'sale' | 'return' | 'restock' | 'adjustment' | 'damage' | 'theft' | 'transfer' | 'reservation_expired' | 'manual_correction';
  metadata?: Record<string, unknown>;
}

export interface BulkUpdateResponse {
  success: boolean;
  updatedCount: number;
}


// Type guards
export function isInventoryData(data: unknown): data is InventoryData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'productId' in data &&
    'currentStock' in data &&
    'availableStock' in data
  );
}