import React from 'react';
import { cn } from '@/lib/utils';

interface StockBadgeProps {
  inventory: number;
  className?: string;
  showCount?: boolean;
  size?: 'xs' | 'sm' | 'md';
}

export const StockBadge = React.memo(function StockBadge({ inventory, className, showCount = false, size = 'xs' }: StockBadgeProps) {
  const getStockStatus = () => {
    if (inventory === 0) {
      return {
        label: 'Out of stock',
        className: 'bg-red-100 text-red-900 border-red-300',
        shouldPulse: false,
      };
    }
    if (inventory <= 3) {
      return {
        label: showCount ? `${inventory} left` : `Only ${inventory} left`,
        className: 'bg-amber-100 text-amber-900 border-amber-300',
        shouldPulse: true,
      };
    }
    if (inventory <= 5) {
      return {
        label: showCount ? `${inventory} left` : `Only ${inventory} left`,
        className: 'bg-amber-100 text-amber-900 border-amber-300',
        shouldPulse: false,
      };
    }
    if (inventory <= 10) {
      return {
        label: showCount ? `${inventory} in stock` : 'Low Stock',
        className: 'bg-amber-100 text-amber-900 border-amber-300',
        shouldPulse: false,
      };
    }
    return {
      label: showCount && inventory <= 99 ? `${inventory} in stock` : 'In stock',
      className: 'bg-green-100 text-green-900 border-green-300',
      shouldPulse: false,
    };
  };

  const { label, className: statusClassName, shouldPulse } = getStockStatus();

  const sizeClasses = {
    xs: 'px-2 py-0.5 text-xs',
    sm: 'px-2.5 py-0.5 text-sm',
    md: 'px-3 py-1 text-sm',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium border',
        statusClassName,
        sizeClasses[size],
        shouldPulse && 'animate-pulse',
        className,
      )}
      role="status"
      aria-label={`Stock status: ${label}`}
    >
      {label}
    </span>
  );
});