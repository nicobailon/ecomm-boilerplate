import { useState } from 'react';
import { OrdersTable } from '@/components/order/OrdersTable';
import { OrderDetailsDrawer } from '@/components/order/OrderDetailsDrawer';
import type { RouterOutputs } from '@/lib/trpc';

type Order = RouterOutputs['order']['listAll']['orders'][0];

export function OrdersTab() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleEditOrder = (order: Order) => {
    setSelectedOrder(order);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    // Keep selected order for animation purposes
    setTimeout(() => {
      setSelectedOrder(null);
    }, 300);
  };

  return (
    <div role="tabpanel" aria-labelledby="orders-tab" className="space-y-4">
      <OrdersTable onEditOrder={handleEditOrder} />
      <OrderDetailsDrawer
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        orderId={selectedOrder?._id.toString() || null}
      />
    </div>
  );
}