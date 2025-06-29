import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { useState, useCallback } from 'react';
import type { OrderFilters, OrderListItem, OrderExportFilters } from '@/types/order';
import { arrayToCSV, downloadFile, formatAddressForCSV, formatDateForCSV } from '@/utils/export';

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
    { orderId: orderId ?? '' },
    { enabled: !!orderId },
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
    onMutate: ({ orderIds }) => {
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

// Export functionality (client-side implementation)
// Customer order hooks
export function useListMyOrders(filters: Omit<OrderFilters, 'search'> = {}) {
  const {
    page = 1,
    limit = 10,
    status,
    startDate,
    endDate,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = filters;

  const { data, isLoading, error } = trpc.order.listMine.useQuery({
    page,
    limit,
    status,
    dateFrom: startDate?.toISOString(),
    dateTo: endDate?.toISOString(),
    sortBy: sortBy === 'totalAmount' ? 'total' : sortBy,
    sortOrder,
  });

  return { data, isLoading, error };
}

export function useGetMyOrderById(orderId: string | null) {
  const { data, isLoading, error } = trpc.order.getMine.useQuery(
    { orderId: orderId ?? '' },
    { enabled: !!orderId },
  );

  return { data, isLoading, error };
}

// Export functionality (client-side implementation)
export function useExportOrders() {
  const [isExporting, setIsExporting] = useState(false);
  
  const exportOrders = useCallback(async (
    orders: OrderListItem[], 
    options?: Partial<OrderExportFilters>,
  ) => {
    try {
      setIsExporting(true);
      
      // Filter orders if selectedOnly is true
      const ordersToExport = options?.selectedOnly && options?.selectedIds
        ? orders.filter(order => options.selectedIds?.includes(order._id))
        : orders;
      
      // Simulate a small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Prepare data for CSV export
      const exportData = ordersToExport.map(order => {
        const baseData = {
          orderNumber: order.orderNumber,
          orderId: String(order._id).slice(-8),
          customerEmail: order.email,
          customerName: order.shippingAddress?.fullName ?? '',
          status: order.status,
          totalAmount: order.totalAmount.toFixed(2),
          items: order.products?.length ?? 0,
          paymentMethod: order.paymentMethod ?? 'N/A',
          date: formatDateForCSV(order.createdAt),
        };
        
        // Optionally include addresses
        if (options?.includeAddresses !== false) {
          return {
            ...baseData,
            shippingAddress: formatAddressForCSV(order.shippingAddress ?? {}),
            billingAddress: formatAddressForCSV(order.billingAddress ?? {}),
          };
        }
        
        return baseData;
      });
      
      // Define columns for CSV with proper typing
      interface BaseExportData {
        orderNumber: string;
        orderId: string;
        customerEmail: string;
        customerName: string;
        status: string;
        totalAmount: string;
        items: number;
        paymentMethod: string;
        date: string;
      }
      
      type FullExportData = BaseExportData & {
        shippingAddress: string;
        billingAddress: string;
      };
      
      const baseColumns: { key: keyof BaseExportData; label: string }[] = [
        { key: 'orderNumber', label: 'Order Number' },
        { key: 'orderId', label: 'Order ID' },
        { key: 'customerEmail', label: 'Customer Email' },
        { key: 'customerName', label: 'Customer Name' },
        { key: 'status', label: 'Status' },
        { key: 'totalAmount', label: 'Total Amount' },
        { key: 'items', label: 'Items' },
        { key: 'paymentMethod', label: 'Payment Method' },
        { key: 'date', label: 'Date' },
      ];
      
      // Generate CSV with proper type inference
      let csv: string;
      if (options?.includeAddresses !== false) {
        const fullColumns: { key: keyof FullExportData; label: string }[] = [
          ...baseColumns,
          { key: 'shippingAddress', label: 'Shipping Address' },
          { key: 'billingAddress', label: 'Billing Address' },
        ];
        csv = arrayToCSV(exportData as FullExportData[], fullColumns);
      } else {
        csv = arrayToCSV(exportData as BaseExportData[], baseColumns);
      }
      
      // Generate filename with context
      const dateStr = new Date().toISOString().split('T')[0];
      const parts = [];
      
      // Add base prefix
      if (options?.selectedOnly) {
        parts.push('selected-orders');
      } else {
        parts.push('orders');
      }
      
      // Add status filter if present
      if (options?.status) {
        parts.push(options.status);
      }
      
      // Add date range if present
      if (options?.startDate || options?.endDate) {
        const start = options.startDate ? new Date(options.startDate).toISOString().split('T')[0] : 'start';
        const end = options.endDate ? new Date(options.endDate).toISOString().split('T')[0] : 'end';
        parts.push(`${start}_to_${end}`);
      }
      
      // Add current date
      parts.push(dateStr);
      
      const filename = `${parts.join('-')}.csv`;
      
      // Download file
      downloadFile(csv, filename);
      
      toast.success(`Exported ${ordersToExport.length} orders`);
      
      return { success: true, count: ordersToExport.length };
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export orders');
      return { success: false, error };
    } finally {
      setIsExporting(false);
    }
  }, []);
  
  return {
    exportOrders,
    isExporting,
  };
}