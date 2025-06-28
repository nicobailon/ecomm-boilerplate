import { useState } from 'react';
import { OrdersTable } from '@/components/order/OrdersTable';
import { OrderDetailsDrawer } from '@/components/order/OrderDetailsDrawer';
import { useListMyOrders } from '@/hooks/queries/useOrders';
import type { OrderListItem, OrderFilters } from '@/types/order';

export default function AccountOrdersPage() {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [filters] = useState<Omit<OrderFilters, 'search'>>({});

  const { data, isLoading, error } = useListMyOrders(filters);

  const handleViewOrder = (order: OrderListItem) => {
    setSelectedOrderId(order._id);
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">My Orders</h1>
          <p className="text-red-600">Failed to load orders. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">My Orders</h1>
        <p className="text-muted-foreground">View your order history and track deliveries</p>
      </div>

      <OrdersTable
        mode="customer"
        data={data}
        isLoading={isLoading}
        onEditOrder={handleViewOrder}
      />

      <OrderDetailsDrawer
        isOpen={!!selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
        orderId={selectedOrderId}
        mode="customer"
      />
    </div>
  );
}