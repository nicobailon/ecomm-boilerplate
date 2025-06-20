import React from 'react';
import { cn } from '@/lib/utils';
import { getStockStatus, getStockBadgeColor, formatInventoryForDisplay } from '@/utils/inventory';

interface InventoryBadgeProps {
  inventory: number;
  variant?: 'collection' | 'detail' | 'admin';
  threshold?: number;
  showCount?: boolean;
  className?: string;
}

export const InventoryBadge = React.memo(function InventoryBadge({
  inventory,
  variant = 'collection',
  threshold = 5,
  showCount = false,
  className,
}: InventoryBadgeProps) {
  const status = getStockStatus(inventory);
  const colorClasses = getStockBadgeColor(status);
  
  const sizeClasses = {
    collection: 'text-xs px-2 py-0.5',
    detail: 'text-sm px-3 py-1',
    admin: 'text-sm px-2.5 py-1',
  };

  const pulseAnimation = inventory <= 3 && inventory > 0 ? 'animate-pulse' : '';

  const displayText = showCount ? formatInventoryForDisplay(inventory) : (
    inventory === 0 ? 'Out of stock' :
    inventory <= threshold ? 'Low stock' :
    'In stock'
  );

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full border',
        colorClasses,
        sizeClasses[variant],
        pulseAnimation,
        className,
      )}
      aria-label={`Stock status: ${displayText}`}
      role="status"
    >
      {displayText}
    </span>
  );
});