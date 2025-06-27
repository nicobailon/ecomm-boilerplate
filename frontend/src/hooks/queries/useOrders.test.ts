import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  useListOrders,
  useGetOrderById,
  useUpdateOrderStatus,
  useBulkUpdateOrderStatus,
} from './useOrders';
import { trpc } from '@/lib/trpc';
import { createWrapper } from '@/test/test-utils';
import type { RouterOutputs } from '@/lib/trpc';

// Mock tRPC
vi.mock('@/lib/trpc', () => ({
  trpc: {
    order: {
      listAll: {
        useQuery: vi.fn(),
      },
      getById: {
        useQuery: vi.fn(),
      },
      updateStatus: {
        useMutation: vi.fn(),
      },
      bulkUpdateStatus: {
        useMutation: vi.fn(),
      },
    },
    useContext: vi.fn(() => ({
      order: {
        listAll: {
          invalidate: vi.fn(),
        },
        getById: {
          invalidate: vi.fn(),
        },
      },
    })),
  },
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
  },
}));

// Sample data
const mockOrderList: RouterOutputs['order']['listAll'] = {
  orders: [
    {
      _id: 'order1' as any,
      orderNumber: 'ORD-001',
      user: {
        _id: 'user1' as any,
        name: 'John Doe',
        email: 'customer1@example.com',
      },
      email: 'customer1@example.com',
      status: 'pending',
      products: [],
      totalAmount: 99.99,
      subtotal: 99.99,
      tax: 0,
      shipping: 0,
      discount: 0,
      shippingAddress: {
        fullName: 'John Doe',
        line1: '123 Main St',
        line2: undefined,
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'US',
      },
      billingAddress: undefined,
      paymentMethod: 'card',
      paymentIntentId: 'pi_123',
      createdAt: new Date() as any,
      updatedAt: new Date() as any,
    },
  ],
  totalCount: 1,
  currentPage: 1,
  totalPages: 1,
};

const mockOrderDetail: RouterOutputs['order']['getById'] = {
  _id: 'order1' as any,
  orderNumber: 'ORD-001',
  user: {
    _id: 'user1' as any,
    name: 'John Doe',
    email: 'customer1@example.com',
  },
  email: 'customer1@example.com',
  status: 'pending',
  products: [
    {
      product: {
        _id: 'prod1' as any,
        name: 'Product 1',
        image: 'image.jpg',
      },
      price: 99.99,
      quantity: 1,
      variantId: undefined,
      variantDetails: undefined,
      variantLabel: undefined,
    },
  ],
  totalAmount: 99.99,
  subtotal: 99.99,
  tax: 0,
  shipping: 0,
  discount: 0,
  shippingAddress: {
    fullName: 'John Doe',
    line1: '123 Main St',
    line2: undefined,
    city: 'New York',
    state: 'NY',
    postalCode: '10001',
    country: 'US',
    phone: '+1234567890',
  },
  billingAddress: {
    fullName: 'John Doe',
    line1: '123 Main St',
    line2: undefined,
    city: 'New York',
    state: 'NY',
    postalCode: '10001',
    country: 'US',
  },
  paymentMethod: 'card',
  paymentIntentId: 'pi_123',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('useOrders hooks', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  describe('useListOrders', () => {
    it('should fetch orders with pagination and filters', () => {
      const mockUseQuery = vi.fn().mockReturnValue({
        data: mockOrderList,
        isLoading: false,
        error: null,
      });
      (trpc.order.listAll.useQuery as any).mockImplementation(mockUseQuery);

      const { result } = renderHook(
        () => useListOrders({
          page: 1,
          limit: 10,
          search: 'test',
          status: 'pending',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
          sortBy: 'createdAt',
          sortOrder: 'desc',
        }),
        { wrapper: createWrapper(false) }
      );

      expect(mockUseQuery).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        search: 'test',
        status: 'pending',
        dateFrom: '2024-01-01T00:00:00.000Z',
        dateTo: '2024-01-31T00:00:00.000Z',
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      expect(result.current.data).toEqual(mockOrderList);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should handle default parameters', () => {
      const mockUseQuery = vi.fn().mockReturnValue({
        data: mockOrderList,
        isLoading: false,
        error: null,
      });
      (trpc.order.listAll.useQuery as any).mockImplementation(mockUseQuery);

      renderHook(
        () => useListOrders({}),
        { wrapper: createWrapper(false) }
      );

      expect(mockUseQuery).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
    });

    it('should handle loading state', () => {
      const mockUseQuery = vi.fn().mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      });
      (trpc.order.listAll.useQuery as any).mockImplementation(mockUseQuery);

      const { result } = renderHook(
        () => useListOrders({}),
        { wrapper: createWrapper(false) }
      );

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();
    });

    it('should handle error state', () => {
      const mockError = new Error('Failed to fetch orders');
      const mockUseQuery = vi.fn().mockReturnValue({
        data: undefined,
        isLoading: false,
        error: mockError,
      });
      (trpc.order.listAll.useQuery as any).mockImplementation(mockUseQuery);

      const { result } = renderHook(
        () => useListOrders({}),
        { wrapper: createWrapper(false) }
      );

      expect(result.current.error).toEqual(mockError);
      expect(result.current.data).toBeUndefined();
    });
  });

  describe('useGetOrderById', () => {
    it('should fetch order by ID', () => {
      const mockUseQuery = vi.fn().mockReturnValue({
        data: mockOrderDetail,
        isLoading: false,
        error: null,
      });
      (trpc.order.getById.useQuery as any).mockImplementation(mockUseQuery);

      const { result } = renderHook(
        () => useGetOrderById('order1'),
        { wrapper: createWrapper(false) }
      );

      expect(mockUseQuery).toHaveBeenCalledWith(
        { orderId: 'order1' },
        { enabled: true }
      );

      expect(result.current.data).toEqual(mockOrderDetail);
    });

    it('should not fetch when ID is null', () => {
      const mockUseQuery = vi.fn().mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });
      (trpc.order.getById.useQuery as any).mockImplementation(mockUseQuery);

      renderHook(
        () => useGetOrderById(null),
        { wrapper: createWrapper(false) }
      );

      expect(mockUseQuery).toHaveBeenCalledWith(
        { orderId: '' },
        { enabled: false }
      );
    });
  });

  describe('useUpdateOrderStatus', () => {
    it('should update order status with optimistic update', async () => {
      const mockMutate = vi.fn();
      const mockInvalidate = vi.fn();
      const mockUseMutation = vi.fn((options) => ({
        mutate: mockMutate,
        mutateAsync: async (data: any) => {
          await options.onSuccess?.(mockOrderDetail, data);
          return mockOrderDetail;
        },
        isLoading: false,
      }));

      (trpc.order.updateStatus.useMutation as any).mockImplementation(mockUseMutation);
      (trpc.useContext as any).mockReturnValue({
        order: {
          listAll: { invalidate: mockInvalidate },
          getById: { invalidate: mockInvalidate },
        },
      });

      const { result } = renderHook(
        () => useUpdateOrderStatus(),
        { wrapper: createWrapper(false) }
      );

      await result.current.mutateAsync({
        orderId: 'order1',
        status: 'completed',
      });

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Order status updated successfully');
        expect(mockInvalidate).toHaveBeenCalledTimes(2);
      });
    });

    it('should handle update error', async () => {
      const mockError = new Error('Update failed');
      const mockUseMutation = vi.fn((options) => ({
        mutate: vi.fn(),
        mutateAsync: async (data: any) => {
          await options.onError?.(mockError, data);
          throw mockError;
        },
        isLoading: false,
      }));

      (trpc.order.updateStatus.useMutation as any).mockImplementation(mockUseMutation);

      const { result } = renderHook(
        () => useUpdateOrderStatus(),
        { wrapper: createWrapper(false) }
      );

      await expect(
        result.current.mutateAsync({
          orderId: 'order1',
          status: 'completed',
        })
      ).rejects.toThrow('Update failed');

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Update failed');
      });
    });
  });

  describe('useBulkUpdateOrderStatus', () => {
    it('should update multiple orders status', async () => {
      const mockMutate = vi.fn();
      const mockInvalidate = vi.fn();
      const mockUseMutation = vi.fn((options) => ({
        mutate: mockMutate,
        mutateAsync: async (data: any) => {
          await options.onSuccess?.({ modifiedCount: 2 }, data);
          return { modifiedCount: 2 };
        },
        isLoading: false,
      }));

      (trpc.order.bulkUpdateStatus.useMutation as any).mockImplementation(mockUseMutation);
      (trpc.useContext as any).mockReturnValue({
        order: {
          listAll: { invalidate: mockInvalidate },
        },
      });

      const { result } = renderHook(
        () => useBulkUpdateOrderStatus(),
        { wrapper: createWrapper(false) }
      );

      await result.current.mutateAsync({
        orderIds: ['order1', 'order2'],
        status: 'completed',
      });

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('2 orders updated successfully');
        expect(mockInvalidate).toHaveBeenCalled();
      });
    });

    it('should handle bulk update error', async () => {
      const mockError = new Error('Bulk update failed');
      const mockUseMutation = vi.fn((options) => ({
        mutate: vi.fn(),
        mutateAsync: async (data: any) => {
          await options.onError?.(mockError, data);
          throw mockError;
        },
        isLoading: false,
      }));

      (trpc.order.bulkUpdateStatus.useMutation as any).mockImplementation(mockUseMutation);

      const { result } = renderHook(
        () => useBulkUpdateOrderStatus(),
        { wrapper: createWrapper(false) }
      );

      await expect(
        result.current.mutateAsync({
          orderIds: ['order1', 'order2'],
          status: 'completed',
        })
      ).rejects.toThrow('Bulk update failed');

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Bulk update failed');
      });
    });

    it('should show loading toast during bulk update', async () => {
      const mockLoadingToast = vi.fn().mockReturnValue('toast-id');
      (toast.loading as any).mockImplementation(mockLoadingToast);

      const mockUseMutation = vi.fn((options) => ({
        mutate: vi.fn(),
        mutateAsync: async (data: any) => {
          const toastId = await options.onMutate?.(data);
          expect(toastId).toBe('toast-id');
          await options.onSuccess?.({ modifiedCount: 3 }, data);
          return { modifiedCount: 3 };
        },
        isLoading: false,
      }));

      (trpc.order.bulkUpdateStatus.useMutation as any).mockImplementation(mockUseMutation);

      const { result } = renderHook(
        () => useBulkUpdateOrderStatus(),
        { wrapper: createWrapper(false) }
      );

      await result.current.mutateAsync({
        orderIds: ['order1', 'order2', 'order3'],
        status: 'cancelled',
      });

      expect(toast.loading).toHaveBeenCalledWith('Updating 3 orders...');
    });
  });

  /*
  // useExportOrders is not yet implemented in the backend
  describe('useExportOrders', () => {
    it('should export orders with current filters', async () => {
      const mockBlob = new Blob(['csv data'], { type: 'text/csv' });
      const mockUseMutation = vi.fn((options) => ({
        mutate: vi.fn(),
        mutateAsync: async (data: any) => {
          await options.onSuccess?.(mockBlob, data);
          return mockBlob;
        },
        isLoading: false,
      }));

      (trpc.order.exportOrders.useMutation as any).mockImplementation(mockUseMutation);

      // Mock URL.createObjectURL and document.createElement
      const mockCreateObjectURL = vi.fn().mockReturnValue('blob:url');
      const mockClick = vi.fn();
      const mockRemove = vi.fn();
      global.URL.createObjectURL = mockCreateObjectURL;
      global.URL.revokeObjectURL = vi.fn();
      
      const mockAnchor = {
        click: mockClick,
        remove: mockRemove,
        href: '',
        download: '',
      };
      vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any);
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockAnchor as any);

      const { result } = renderHook(
        () => useExportOrders(),
        { wrapper: createWrapper(false) }
      );

      await result.current.mutateAsync({
        search: 'test',
        status: 'completed',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      });

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Orders exported successfully');
        expect(mockCreateObjectURL).toHaveBeenCalledWith(mockBlob);
        expect(mockAnchor.href).toBe('blob:url');
        expect(mockAnchor.download).toMatch(/orders-\d{4}-\d{2}-\d{2}\.csv/);
        expect(mockClick).toHaveBeenCalled();
        expect(mockRemove).toHaveBeenCalled();
      });
    });

    it('should handle export error', async () => {
      const mockError = new Error('Export failed');
      const mockUseMutation = vi.fn((options) => ({
        mutate: vi.fn(),
        mutateAsync: async (data: any) => {
          await options.onError?.(mockError, data);
          throw mockError;
        },
        isLoading: false,
      }));

      (trpc.order.exportOrders.useMutation as any).mockImplementation(mockUseMutation);

      const { result } = renderHook(
        () => useExportOrders(),
        { wrapper: createWrapper(false) }
      );

      await expect(
        result.current.mutateAsync({})
      ).rejects.toThrow('Export failed');

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to export orders');
      });
    });
  });
  */

  describe('invalidation and cache management', () => {
    it('should invalidate queries after successful update', async () => {
      const mockInvalidateListAll = vi.fn();
      const mockInvalidateGetById = vi.fn();
      
      (trpc.useContext as any).mockReturnValue({
        order: {
          listAll: { invalidate: mockInvalidateListAll },
          getById: { invalidate: mockInvalidateGetById },
        },
      });

      const mockUseMutation = vi.fn((options) => ({
        mutate: vi.fn(),
        mutateAsync: async (data: any) => {
          await options.onSuccess?.(mockOrderDetail, data);
          return mockOrderDetail;
        },
        isLoading: false,
      }));

      (trpc.order.updateStatus.useMutation as any).mockImplementation(mockUseMutation);

      const { result } = renderHook(
        () => useUpdateOrderStatus(),
        { wrapper: createWrapper(false) }
      );

      await result.current.mutateAsync({
        orderId: 'order1',
        status: 'completed',
      });

      await waitFor(() => {
        expect(mockInvalidateListAll).toHaveBeenCalled();
        expect(mockInvalidateGetById).toHaveBeenCalled();
      });
    });
  });
});

// Type-level tests
type AssertEqual<T, U> = T extends U ? (U extends T ? true : false) : false;

// Test that hook return types are properly typed
type TestListOrdersReturn = AssertEqual<
  ReturnType<typeof useListOrders>,
  {
    data: RouterOutputs['order']['listAll'] | undefined;
    isLoading: boolean;
    error: any;
  }
>;

type TestGetOrderByIdReturn = AssertEqual<
  ReturnType<typeof useGetOrderById>,
  {
    data: RouterOutputs['order']['getById'] | undefined;
    isLoading: boolean;
    error: any;
  }
>;

// const _testListOrdersReturn: TestListOrdersReturn = true;
// const _testGetOrderByIdReturn: TestGetOrderByIdReturn = true;