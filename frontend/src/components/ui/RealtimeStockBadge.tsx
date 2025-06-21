import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Wifi, WifiOff } from 'lucide-react';
import { useRealtimeInventory } from '@/hooks/useRealtimeInventory';

interface RealtimeStockBadgeProps {
  inventory: number;
  productId: string;
  variantId?: string;
  className?: string;
  showCount?: boolean;
  showConnectionStatus?: boolean;
  size?: 'xs' | 'sm' | 'md';
}

export const RealtimeStockBadge = React.memo(function RealtimeStockBadge({ 
  inventory: initialInventory, 
  productId,
  className, 
  showCount = false, 
  showConnectionStatus = false,
  size = 'xs' 
}: RealtimeStockBadgeProps) {
  const [inventory, setInventory] = useState(initialInventory);
  const [isUpdating, setIsUpdating] = useState(false);
  const { isConnected, subscribeToProduct, unsubscribeFromProduct } = useRealtimeInventory();

  useEffect(() => {
    setInventory(initialInventory);
  }, [initialInventory]);

  useEffect(() => {
    // Subscribe to real-time updates for this product
    // Note: The current implementation tracks at product level, not variant level
    subscribeToProduct(productId);

    return () => {
      unsubscribeFromProduct(productId);
    };
  }, [productId, subscribeToProduct, unsubscribeFromProduct]);

  useEffect(() => {
    // Show update animation when inventory changes
    if (inventory !== initialInventory) {
      setIsUpdating(true);
      const timer = setTimeout(() => setIsUpdating(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [inventory, initialInventory]);

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
    <div className="inline-flex items-center gap-2">
      <span
        className={cn(
          'inline-flex items-center rounded-full font-medium border transition-all duration-300',
          statusClassName,
          sizeClasses[size],
          shouldPulse && 'animate-pulse',
          isUpdating && 'ring-2 ring-offset-1 ring-primary',
          className,
        )}
        role="status"
        aria-label={`Stock status: ${label}`}
        aria-live="polite"
      >
        {label}
      </span>
      {showConnectionStatus && (
        <span
          className={cn(
            'inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full',
            isConnected 
              ? 'bg-green-100 text-green-700' 
              : 'bg-gray-100 text-gray-600'
          )}
          title={isConnected ? 'Real-time updates active' : 'Real-time updates disconnected'}
        >
          {isConnected ? (
            <>
              <Wifi className="w-3 h-3" />
              <span className="sr-only">Connected</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3" />
              <span className="sr-only">Disconnected</span>
            </>
          )}
        </span>
      )}
    </div>
  );
});