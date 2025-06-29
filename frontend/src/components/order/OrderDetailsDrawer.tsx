import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Label } from '@/components/ui/Label';
import { OrderStatusBadge } from './OrderStatusBadge';
import { OrderProductsList } from './OrderProductsList';
import { OrderCustomerInfo } from './OrderCustomerInfo';
import { useGetOrderById, useGetMyOrderById, useUpdateOrderStatus } from '@/hooks/queries/useOrders';
import { useOrderStatusValidation } from '@/hooks/useOrderStatusValidation';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import type { OrderStatus } from '@/types/order';

interface OrderDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string | null;
  mode?: 'admin' | 'customer';
}

export function OrderDetailsDrawer({ isOpen, onClose, orderId, mode = 'admin' }: OrderDetailsDrawerProps) {
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | null>(null);
  
  // Use appropriate hook based on mode
  const adminQuery = useGetOrderById(mode === 'admin' ? orderId : null);
  const customerQuery = useGetMyOrderById(mode === 'customer' ? orderId : null);
  
  const { data: order, isLoading, error } = mode === 'admin' ? adminQuery : customerQuery;
  
  const updateStatusMutation = useUpdateOrderStatus();
  const { getValidNextStatuses } = useOrderStatusValidation();

  useEffect(() => {
    if (order) {
      setSelectedStatus(order.status);
    }
  }, [order]);

  const handleStatusUpdate = async () => {
    if (!orderId || !selectedStatus || selectedStatus === order?.status) return;

    await updateStatusMutation.mutateAsync({
      orderId,
      status: selectedStatus,
    });
  };

  const formatPaymentMethod = (method: string) => {
    const methods: Record<string, string> = {
      card: 'Credit Card',
      paypal: 'PayPal',
      stripe: 'Stripe',
      cash: 'Cash',
    };
    return methods[method] || method;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Order Details"
      description="View and manage order information"
      className="sm:max-w-2xl"
    >
      <div className="mt-6 overflow-y-auto max-h-[calc(100vh-180px)] pr-1">

        {isLoading && (
          <div className="flex justify-center py-8" data-testid="drawer-loading-spinner">
            <LoadingSpinner />
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">Failed to load order</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        )}

        {!isLoading && !error && !order && (
          <div className="text-center py-8 text-muted-foreground">
            Order not found
          </div>
        )}

        {order && (
          <div className="mt-6 space-y-6">
            {/* Order Header */}
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold">{order.orderNumber}</h3>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(order.createdAt), 'MMM dd, yyyy \'at\' h:mm a')}
                </p>
              </div>
              <OrderStatusBadge status={order.status} />
            </div>

            <div className="border-b my-4" />

            {/* Order Status Update - Admin only */}
            {mode === 'admin' && (
              <>
                <div className="space-y-3">
                  <h3 className="font-semibold">Order Status</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Current Status:</span>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status-select">Update Status</Label>
                    {getValidNextStatuses(order.status).length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        This order is in a final status and cannot be changed.
                      </p>
                    ) : (
                      <div className="flex gap-2">
                        <Select
                          id="status-select"
                          value={selectedStatus ?? order.status}
                          onChange={(e) => setSelectedStatus(e.target.value as OrderStatus)}
                          options={getValidNextStatuses(order.status).map(status => ({
                            value: status,
                            label: status.charAt(0).toUpperCase() + status.slice(1),
                          }))}
                          aria-label="Status"
                        />
                        <Button
                          onClick={() => void handleStatusUpdate()}
                          disabled={
                            !selectedStatus ||
                            selectedStatus === order.status ||
                            updateStatusMutation.isPending
                          }
                        >
                          {updateStatusMutation.isPending && (
                            <span className="mr-2">Loading...</span>
                          )}
                          Update Status
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-b my-4" />
              </>
            )}

            {/* Customer Information */}
            <OrderCustomerInfo order={order} />

            <div className="border-b my-4" />

            {/* Order Items */}
            {order.products.length > 0 ? (
              <OrderProductsList products={order.products} />
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                No items in this order
              </div>
            )}

            <div className="border-b my-4" />

            {/* Order Summary */}
            <div className="space-y-3">
              <h3 className="font-semibold">Order Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(order.subtotal ?? order.totalAmount)}</span>
                </div>
                {order.tax !== undefined && (
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>{formatCurrency(order.tax)}</span>
                  </div>
                )}
                {order.shipping !== undefined && (
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>{formatCurrency(order.shipping)}</span>
                  </div>
                )}
                {order.discount !== undefined && order.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(order.discount)}</span>
                  </div>
                )}
                <div className="border-b my-4" />
                <div className="flex justify-between font-semibold text-base">
                  <span>Total</span>
                  <span>{formatCurrency(order.totalAmount)}</span>
                </div>
              </div>
            </div>

            <div className="border-b my-4" />

            {/* Payment Information */}
            <div className="space-y-3">
              <h3 className="font-semibold">Payment Method</h3>
              <p>{order.paymentMethod ? formatPaymentMethod(order.paymentMethod) : 'N/A'}</p>
              {order.paymentIntentId && (
                <p className="text-xs text-muted-foreground font-mono">
                  {order.paymentIntentId}
                </p>
              )}
            </div>

            {/* Address Display (if not already shown in CustomerInfo) */}
            {!order.shippingAddress && !order.billingAddress && (
              <>
                <div className="border-b my-4" />
                <div className="space-y-3">
                  <h3 className="font-semibold">Shipping Address</h3>
                  <p className="text-muted-foreground">No shipping address</p>
                </div>
                <div className="space-y-3">
                  <h3 className="font-semibold">Billing Address</h3>
                  <p className="text-muted-foreground">No billing address</p>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </Drawer>
  );
}