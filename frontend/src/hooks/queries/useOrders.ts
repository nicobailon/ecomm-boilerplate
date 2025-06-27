import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import type { OrderFilters } from '@/types/order';

export function useListOrders(filters: OrderFilters = {}) {
  const {
    page = 1,
    limit = 10,
    search,
    status,
    startDate,
    endDate,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = filters;

  const { data, isLoading, error } = trpc.order.listAll.useQuery({
    page,
    limit,
    search,
    status,
    dateFrom: startDate?.toISOString(),
    dateTo: endDate?.toISOString(),
    sortBy: sortBy === 'totalAmount' ? 'total' : sortBy,
    sortOrder,
  });

  return { data, isLoading, error };
}

export function useGetOrderById(orderId: string | null) {
  const { data, isLoading, error } = trpc.order.getById.useQuery(
    { orderId: orderId || '' },
    { enabled: !!orderId }
  );

  return { data, isLoading, error };
}

export function useUpdateOrderStatus() {
  const utils = trpc.useContext();

  return trpc.order.updateStatus.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.order.listAll.invalidate(),
        utils.order.getById.invalidate(),
      ]);
      toast.success('Order status updated successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update order status');
    },
  });
}

export function useBulkUpdateOrderStatus() {
  const utils = trpc.useContext();

  return trpc.order.bulkUpdateStatus.useMutation({
    onMutate: async ({ orderIds }) => {
      const toastId = toast.loading(`Updating ${orderIds.length} orders...`);
      return toastId;
    },
    onSuccess: async (data, _variables, toastId) => {
      await utils.order.listAll.invalidate();
      if (typeof toastId === 'string') {
        toast.dismiss(toastId);
      }
      toast.success(`${data.modifiedCount} orders updated successfully`);
    },
    onError: (error, _variables, toastId) => {
      if (typeof toastId === 'string') {
        toast.dismiss(toastId);
      }
      toast.error(error.message || 'Failed to update orders');
    },
  });
}

// Export functionality not yet implemented in backend
// export function useExportOrders() {