export interface IInventoryHistory {
  productId: string;
  variantId?: string;
  previousQuantity: number;
  newQuantity: number;
  adjustment: number;
  reason: InventoryUpdateReason;
  userId: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export enum StockStatus {
  IN_STOCK = 'in_stock',
  LOW_STOCK = 'low_stock',
  OUT_OF_STOCK = 'out_of_stock',
  BACKORDERED = 'backordered'
}

export type InventoryUpdateReason = 
  | 'sale'
  | 'return'
  | 'restock'
  | 'adjustment'
  | 'damage'
  | 'theft'
  | 'transfer'
  | 'manual_correction';

export interface BulkInventoryUpdate {
  productId: string;
  variantId?: string;
  adjustment: number;
  reason: InventoryUpdateReason;
  metadata?: Record<string, unknown>;
}

export interface InventoryMetrics {
  totalProducts: number;
  totalValue: number;
  outOfStockCount: number;
  lowStockCount: number;
  turnoverRate?: number;
  averageStockLevel?: number;
}

export interface ProductInventoryInfo {
  productId: string;
  variantId?: string;
  currentStock: number;
  availableStock: number;
  lowStockThreshold: number;
  allowBackorder: boolean;
  restockDate?: Date;
  stockStatus: StockStatus;
}

export interface InventoryAdjustmentResult {
  success: boolean;
  previousQuantity: number;
  newQuantity: number;
  availableStock: number;
  historyRecord: IInventoryHistory;
}

export interface InventoryQueryParams {
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'stock' | 'value' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
  stockStatus?: StockStatus;
  search?: string;
}


export interface InventoryTurnoverData {
  productId: string;
  productName: string;
  variantId?: string;
  soldQuantity: number;
  averageStock: number;
  turnoverRate: number;
  period: {
    start: Date;
    end: Date;
  };
}