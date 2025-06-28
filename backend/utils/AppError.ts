export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode = 500,
    public isOperational = true,
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class InventoryError extends AppError {
  constructor(
    message: string,
    public code: 'INSUFFICIENT_INVENTORY' | 'PRODUCT_NOT_FOUND' | 'VARIANT_NOT_FOUND' | 'INVENTORY_LOCK_FAILED',
    public details?: Array<{
      productId: string;
      productName?: string;
      variantId?: string;
      variantDetails?: string;
      requestedQuantity: number;
      availableStock: number;
    }>
  ) {
    super(message, 400);
    this.name = 'InventoryError';
  }
}