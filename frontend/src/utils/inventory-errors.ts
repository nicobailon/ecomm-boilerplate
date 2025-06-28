export interface InventoryErrorDetail {
  productId: string;
  productName?: string;
  variantId?: string;
  variantDetails?: string;
  requestedQuantity: number;
  availableStock: number;
}

export interface InventoryError {
  code: 'INSUFFICIENT_INVENTORY' | 'PRODUCT_NOT_FOUND' | 'VARIANT_NOT_FOUND' | 'INVENTORY_LOCK_FAILED';
  message: string;
  details?: InventoryErrorDetail[];
}

export function isInventoryError(error: unknown): error is InventoryError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    ['INSUFFICIENT_INVENTORY', 'PRODUCT_NOT_FOUND', 'VARIANT_NOT_FOUND', 'INVENTORY_LOCK_FAILED'].includes(
      (error as { code: string }).code
    )
  );
}

export function formatInventoryError(detail: InventoryErrorDetail): string {
  const productName = detail.productName ?? 'Product';
  const variantInfo = detail.variantDetails ? ` (${detail.variantDetails})` : '';
  
  if (detail.availableStock === 0) {
    return `${productName}${variantInfo} is out of stock`;
  }
  
  return `${productName}${variantInfo}: Only ${detail.availableStock} available, you requested ${detail.requestedQuantity}`;
}

export function formatInventoryErrors(details: InventoryErrorDetail[]): string[] {
  return details.map(formatInventoryError);
}

export function getInventoryErrorTitle(code: InventoryError['code']): string {
  switch (code) {
    case 'INSUFFICIENT_INVENTORY':
      return 'Not Enough Stock Available';
    case 'PRODUCT_NOT_FOUND':
      return 'Product Not Found';
    case 'VARIANT_NOT_FOUND':
      return 'Product Variant Not Found';
    case 'INVENTORY_LOCK_FAILED':
      return 'Unable to Reserve Items';
    default:
      return 'Inventory Error';
  }
}

export function getInventoryErrorMessage(error: InventoryError): {
  title: string;
  messages: string[];
} {
  const title = getInventoryErrorTitle(error.code);
  const messages = error.details ? formatInventoryErrors(error.details) : [error.message];
  
  return { title, messages };
}

export interface InventoryAdjustment {
  productId: string;
  productName: string;
  variantDetails?: string;
  requestedQuantity: number;
  adjustedQuantity: number;
  availableStock: number;
}

export function formatInventoryAdjustment(adjustment: InventoryAdjustment): string {
  const variantInfo = adjustment.variantDetails ? ` (${adjustment.variantDetails})` : '';
  
  if (adjustment.adjustedQuantity === 0) {
    return `${adjustment.productName}${variantInfo} was removed from your cart (out of stock)`;
  }
  
  return `${adjustment.productName}${variantInfo} quantity adjusted from ${adjustment.requestedQuantity} to ${adjustment.adjustedQuantity}`;
}

export function formatInventoryAdjustments(adjustments: InventoryAdjustment[]): {
  title: string;
  messages: string[];
} {
  if (adjustments.length === 0) {
    return { title: '', messages: [] };
  }
  
  const title = adjustments.length === 1 
    ? 'Cart Item Adjusted' 
    : 'Cart Items Adjusted';
    
  const messages = adjustments.map(formatInventoryAdjustment);
  
  return { title, messages };
}