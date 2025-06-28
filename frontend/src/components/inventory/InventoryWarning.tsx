import { AlertCircle, Package } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { InventoryErrorDetail, formatInventoryError } from '@/utils/inventory-errors';

interface InventoryWarningProps {
  type: 'error' | 'warning' | 'info';
  title?: string;
  details?: InventoryErrorDetail[];
  message?: string;
  onAction?: () => void;
  actionLabel?: string;
  className?: string;
}

export function InventoryWarning({
  type,
  title,
  details,
  message,
  onAction,
  actionLabel = 'Update Cart',
  className,
}: InventoryWarningProps) {
  const variant = type === 'error' ? 'destructive' : 'default';
  const Icon = type === 'error' ? AlertCircle : Package;
  
  const defaultTitle = {
    error: 'Insufficient Stock',
    warning: 'Stock Limited',
    info: 'Stock Update',
  }[type];

  const displayTitle = title ?? defaultTitle;
  const messages = details ? details.map(formatInventoryError) : message ? [message] : [];

  if (messages.length === 0) {
    return null;
  }

  return (
    <Alert variant={variant} className={className}>
      <Icon className="h-4 w-4" />
      <AlertTitle>{displayTitle}</AlertTitle>
      <AlertDescription className="mt-2 space-y-1">
        {messages.map((msg, index) => (
          <p key={index} className="text-sm">
            {msg}
          </p>
        ))}
        {onAction && (
          <Button
            variant={type === 'error' ? 'destructive' : 'default'}
            size="sm"
            onClick={onAction}
            className="mt-3"
          >
            {actionLabel}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

interface InlineInventoryWarningProps {
  availableStock: number;
  requestedQuantity?: number;
  className?: string;
}

export function InlineInventoryWarning({
  availableStock,
  requestedQuantity,
  className,
}: InlineInventoryWarningProps) {
  if (availableStock > 5 && (!requestedQuantity || requestedQuantity <= availableStock)) {
    return null;
  }

  const isOutOfStock = availableStock === 0;
  const isLowStock = availableStock > 0 && availableStock <= 5;
  const isInsufficientStock = requestedQuantity && requestedQuantity > availableStock;

  if (isOutOfStock) {
    return (
      <span className={`text-sm font-medium text-red-600 dark:text-red-400 ${className}`}>
        Out of stock
      </span>
    );
  }

  if (isInsufficientStock) {
    return (
      <span className={`text-sm font-medium text-red-600 dark:text-red-400 ${className}`}>
        Only {availableStock} available
      </span>
    );
  }

  if (isLowStock) {
    return (
      <span className={`text-sm font-medium text-orange-600 dark:text-orange-400 ${className}`}>
        Only {availableStock} left in stock
      </span>
    );
  }

  return null;
}