export interface CheckoutProduct {
  id: string;
  quantity: number;
  variantId?: string;
  variantLabel?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  validatedProducts: ValidatedProduct[];
}

export interface ValidatedProduct {
  productId: string;
  variantId?: string;
  requestedQuantity: number;
  availableStock: number;
  productName: string;
  variantDetails?: string;
}

export interface AtomicInventoryCheckResult {
  success: boolean;
  availableStock: number;
  productName: string;
  variantDetails?: string;
}

export interface InventoryValidationError extends Error {
  code: 'INSUFFICIENT_INVENTORY' | 'PRODUCT_NOT_FOUND' | 'VARIANT_NOT_FOUND' | 'INVENTORY_LOCK_FAILED';
  details: {
    productId: string;
    variantId?: string;
    requestedQuantity: number;
    availableStock: number;
    productName?: string;
    variantDetails?: string;
  }[];
}

export interface InventoryLockResult {
  productId: string;
  variantId?: string;
  previousInventory: number;
  lockedInventory: number;
  lockVersion: number;
}