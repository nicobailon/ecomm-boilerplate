export type StockStatus = 'in-stock' | 'low-stock' | 'out-of-stock';

export function getStockStatus(inventory: number): StockStatus {
  if (inventory === 0) {
    return 'out-of-stock';
  }
  if (inventory <= 5) {
    return 'low-stock';
  }
  return 'in-stock';
}

export function getStockMessage(inventory: number): string {
  if (inventory === 0) {
    return 'Out of stock';
  }
  if (inventory === 1) {
    return 'Only 1 left in stock';
  }
  if (inventory <= 5) {
    return `Only ${inventory} left in stock`;
  }
  return 'In stock';
}

export function getStockBadgeColor(status: StockStatus): string {
  switch (status) {
    case 'out-of-stock':
      return 'bg-red-100 text-red-900 border-red-300';
    case 'low-stock':
      return 'bg-amber-100 text-amber-900 border-amber-300';
    case 'in-stock':
      return 'bg-green-100 text-green-900 border-green-300';
    default:
      return 'bg-gray-100 text-gray-900 border-gray-300';
  }
}

export function canAddToCart(inventory: number, currentQty: number): boolean {
  return inventory > 0 && currentQty < inventory;
}

export function getMaxQuantity(inventory: number): number {
  return Math.min(inventory, 10);
}

export function formatInventoryForDisplay(inventory: number): string {
  if (inventory === 0) {
    return 'Out of stock';
  }
  if (inventory > 99) {
    return '99+';
  }
  return inventory.toString();
}

export function shouldShowLowStockWarning(inventory: number): boolean {
  return inventory > 0 && inventory <= 5;
}

export function getInventoryPercentage(inventory: number, maxStock = 100): number {
  if (maxStock === 0) return 0;
  return Math.round((inventory / maxStock) * 100);
}

export function isLowStock(inventory: number, threshold = 5): boolean {
  return inventory > 0 && inventory <= threshold;
}

export function getRestockUrgency(inventory: number): 'critical' | 'urgent' | 'normal' | 'none' {
  if (inventory === 0) return 'critical';
  if (inventory <= 3) return 'urgent';
  if (inventory <= 10) return 'normal';
  return 'none';
}