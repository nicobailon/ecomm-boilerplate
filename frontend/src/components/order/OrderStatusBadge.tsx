import React from 'react';
import { Badge } from '@/components/ui/Badge';
import { Clock, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import type { OrderStatus } from '@/types/order';

interface OrderStatusBadgeProps {
  status: OrderStatus;
}

const statusConfig: Record<OrderStatus, {
  variant: 'default' | 'secondary' | 'destructive' | 'warning';
  label: string;
  icon: React.ElementType;
  iconTestId: string;
}> = {
  pending: {
    variant: 'warning',
    label: 'Pending',
    icon: Clock,
    iconTestId: 'clock-icon',
  },
  completed: {
    variant: 'default',
    label: 'Completed',
    icon: CheckCircle,
    iconTestId: 'check-circle-icon',
  },
  cancelled: {
    variant: 'destructive',
    label: 'Cancelled',
    icon: XCircle,
    iconTestId: 'x-circle-icon',
  },
  refunded: {
    variant: 'secondary',
    label: 'Refunded',
    icon: RefreshCw,
    iconTestId: 'refresh-icon',
  },
};

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge
      variant={config.variant}
      data-variant={config.variant}
      role="status"
      aria-label={`Order status: ${status}`}
    >
      <Icon className="w-3 h-3 mr-1" data-testid={config.iconTestId} />
      {config.label}
    </Badge>
  );
}