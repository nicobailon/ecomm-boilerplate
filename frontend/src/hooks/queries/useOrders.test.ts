import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  useListOrders,
  useGetOrderById,
  useUpdateOrderStatus,
  useBulkUpdateOrderStatus,
  useExportOrders,
  useListMyOrders,
  useGetMyOrderById,
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
      listMine: {
        useQuery: vi.fn(),
      },
      getMine: {
        useQuery: vi.fn(),
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
        listMine: {
          invalidate: vi.fn(),
        },
        getMine: {
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
      _id: '507f1f77bcf86cd799439011',
      orderNumber: 'ORD-001',
      user: {
        _id: '507f1f77bcf86cd799439012',
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
      createdAt: new Date(),
      updatedAt: new Date(),
      stripeSessionId: 'cs_test_123456',
      statusHistory: [],
    },
  ],
  totalCount: 1,
  currentPage: 1,
  totalPages: 1,
};

const mockOrderDetail: RouterOutputs['order']['getById'] = {
  _id: '507f1f77bcf86cd799439011',
  orderNumber: 'ORD-001',
  user: {
    _id: '507f1f77bcf86cd799439012',
    name: 'John Doe',
    email: 'customer1@example.com',
  },
  email: 'customer1@example.com',
  status: 'pending',
  products: [
    {
      product: {
        _id: '507f1f77bcf86cd799439013',
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
  createdAt: new Date(),
  updatedAt: new Date(),
  stripeSessionId: 'cs_test_123',
  statusHistory: [],
};

describe('useOrders hooks', () => {

  beforeEach(() => {
    vi.clearAllMocks();
    new QueryClient({
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
        { wrapper: createWrapper(false) },
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
        { wrapper: createWrapper(false) },
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
        { wrapper: createWrapper(false) },
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
        { wrapper: createWrapper(false) },
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
        { wrapper: createWrapper(false) },
      );

      expect(mockUseQuery).toHaveBeenCalledWith(
        { orderId: 'order1' },
        { enabled: true },
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
        { wrapper: createWrapper(false) },
      );

      expect(mockUseQuery).toHaveBeenCalledWith(
        { orderId: '' },
        { enabled: false },
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
        { wrapper: createWrapper(false) },
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
        { wrapper: createWrapper(false) },
      );

      await expect(
        result.current.mutateAsync({
          orderId: 'order1',
          status: 'completed',
        }),
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
        { wrapper: createWrapper(false) },
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
        { wrapper: createWrapper(false) },
      );

      await expect(
        result.current.mutateAsync({
          orderIds: ['order1', 'order2'],
          status: 'completed',
        }),
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
        { wrapper: createWrapper(false) },
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

  describe('useExportOrders', () => {
    let originalCreateElement: any;
    let originalAppendChild: any;
    let originalRemoveChild: any;
    let originalCreateObjectURL: any;
    let originalRevokeObjectURL: any;

    beforeEach(() => {
      // Save original methods
      originalCreateElement = document.createElement.bind(document);
      originalAppendChild = document.body.appendChild.bind(document.body);
      originalRemoveChild = document.body.removeChild.bind(document.body);
      originalCreateObjectURL = URL.createObjectURL;
      originalRevokeObjectURL = URL.revokeObjectURL;
    });

    afterEach(() => {
      // Restore original methods
      document.createElement = originalCreateElement;
      document.body.appendChild = originalAppendChild;
      document.body.removeChild = originalRemoveChild;
      URL.createObjectURL = originalCreateObjectURL;
      URL.revokeObjectURL = originalRevokeObjectURL;
      vi.clearAllMocks();
    });

    it('should export orders successfully', async () => {
      const { result } = renderHook(
        () => useExportOrders(),
        { wrapper: createWrapper(false) }
      );

      // Mock document methods after rendering
      const mockClick = vi.fn();
      const mockAnchor = {
        click: mockClick,
        href: '',
        download: '',
      };
      vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any);
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockAnchor as any);
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockAnchor as any);
      
      // Mock URL methods
      const mockCreateObjectURL = vi.fn().mockReturnValue('blob:url');
      const mockRevokeObjectURL = vi.fn();
      global.URL.createObjectURL = mockCreateObjectURL;
      global.URL.revokeObjectURL = mockRevokeObjectURL;

      const mockOrders = [
        {
          _id: 'order1',
          orderNumber: 'ORD-001',
          email: 'test@example.com',
          status: 'completed' as const,
          totalAmount: 99.99,
          products: [{ _id: 'prod1', name: 'Product 1' }],
          paymentMethod: 'card',
          createdAt: '2024-01-01T00:00:00Z',
          shippingAddress: {
            fullName: 'John Doe',
            line1: '123 Main St',
            city: 'New York',
            state: 'NY',
            postalCode: '10001',
          },
        },
      ] as any[];

      const exportResult = await result.current.exportOrders(mockOrders, {
        includeAddresses: true,
      });

      expect(exportResult).toEqual({ success: true, count: 1 });
      expect(toast.success).toHaveBeenCalledWith('Exported 1 orders');
      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockAnchor.download).toMatch(/orders-\d{4}-\d{2}-\d{2}\.csv/);
      expect(mockClick).toHaveBeenCalled();
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('blob:url');
    });

    it('should export selected orders only', async () => {
      const { result } = renderHook(
        () => useExportOrders(),
        { wrapper: createWrapper(false) }
      );

      // Mock document methods after rendering
      const mockClick = vi.fn();
      const mockAnchor = {
        click: mockClick,
        href: '',
        download: '',
      };
      vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any);
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockAnchor as any);
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockAnchor as any);
      
      // Mock URL methods
      global.URL.createObjectURL = vi.fn().mockReturnValue('blob:url');
      global.URL.revokeObjectURL = vi.fn();

      const mockOrders = [
        { 
          _id: 'order1', 
          orderNumber: 'ORD-001', 
          status: 'pending',
          email: 'test1@example.com',
          totalAmount: 100.00,
          products: [],
          paymentMethod: 'card',
          createdAt: '2024-01-01T00:00:00Z',
          shippingAddress: { fullName: 'User 1' }
        },
        { 
          _id: 'order2', 
          orderNumber: 'ORD-002', 
          status: 'pending',
          email: 'test2@example.com',
          totalAmount: 200.00,
          products: [],
          paymentMethod: 'card',
          createdAt: '2024-01-01T00:00:00Z',
          shippingAddress: { fullName: 'User 2' }
        },
        { 
          _id: 'order3', 
          orderNumber: 'ORD-003', 
          status: 'pending',
          email: 'test3@example.com',
          totalAmount: 300.00,
          products: [],
          paymentMethod: 'card',
          createdAt: '2024-01-01T00:00:00Z',
          shippingAddress: { fullName: 'User 3' }
        },
      ] as any[];

      const exportResult = await result.current.exportOrders(mockOrders, {
        selectedOnly: true,
        selectedIds: ['order1', 'order3'],
      });

      expect(exportResult).toEqual({ success: true, count: 2 });
      expect(toast.success).toHaveBeenCalledWith('Exported 2 orders');
      expect(mockAnchor.download).toMatch(/selected-orders-\d{4}-\d{2}-\d{2}\.csv/);
    });

    it('should handle export error', async () => {
      const { result } = renderHook(
        () => useExportOrders(),
        { wrapper: createWrapper(false) }
      );

      // Mock document.createElement to throw an error after rendering
      vi.spyOn(document, 'createElement').mockImplementation(() => {
        throw new Error('DOM error');
      });

      const exportResult = await result.current.exportOrders([], {});

      expect(exportResult).toEqual({ success: false, error: expect.any(Error) });
      expect(toast.error).toHaveBeenCalledWith('Failed to export orders');
    });

    it('should track loading state', async () => {
      const { result } = renderHook(
        () => useExportOrders(),
        { wrapper: createWrapper(false) }
      );

      // Mock document methods after rendering
      vi.spyOn(document, 'createElement').mockReturnValue({
        click: vi.fn(),
        href: '',
        download: '',
      } as any);
      vi.spyOn(document.body, 'appendChild').mockImplementation(() => null as any);
      vi.spyOn(document.body, 'removeChild').mockImplementation(() => null as any);
      global.URL.createObjectURL = vi.fn().mockReturnValue('blob:url');
      global.URL.revokeObjectURL = vi.fn();

      expect(result.current.isExporting).toBe(false);

      // Start export without awaiting immediately
      act(() => {
        result.current.exportOrders([], {});
      });

      // Check loading state is true
      expect(result.current.isExporting).toBe(true);

      // Wait for export to complete
      await waitFor(() => {
        expect(result.current.isExporting).toBe(false);
      });
    });
  });

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
        { wrapper: createWrapper(false) },
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

  describe('useListMyOrders', () => {
    it('should fetch customer orders with pagination and filters', () => {
      const mockUseQuery = vi.fn().mockReturnValue({
        data: mockOrderList,
        isLoading: false,
        error: null,
      });
      (trpc.order.listMine.useQuery as any).mockImplementation(mockUseQuery);

      const { result } = renderHook(
        () => useListMyOrders({
          page: 1,
          limit: 10,
          status: 'pending',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31'),
          sortBy: 'createdAt',
          sortOrder: 'desc',
        }),
        { wrapper: createWrapper(false) },
      );

      expect(mockUseQuery).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
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
      (trpc.order.listMine.useQuery as any).mockImplementation(mockUseQuery);

      renderHook(
        () => useListMyOrders({}),
        { wrapper: createWrapper(false) },
      );

      expect(mockUseQuery).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
    });

    it('should not include search parameter', () => {
      const mockUseQuery = vi.fn().mockReturnValue({
        data: mockOrderList,
        isLoading: false,
        error: null,
      });
      (trpc.order.listMine.useQuery as any).mockImplementation(mockUseQuery);

      // Even if search is passed in the type, it should be omitted
      const filters = {
        page: 1,
        limit: 10,
        status: 'pending' as const,
      };

      renderHook(
        () => useListMyOrders(filters),
        { wrapper: createWrapper(false) },
      );

      const calledWith = mockUseQuery.mock.calls[0][0];
      expect(calledWith).not.toHaveProperty('search');
    });

    it('should handle loading state', () => {
      const mockUseQuery = vi.fn().mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      });
      (trpc.order.listMine.useQuery as any).mockImplementation(mockUseQuery);

      const { result } = renderHook(
        () => useListMyOrders({}),
        { wrapper: createWrapper(false) },
      );

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();
    });

    it('should handle error state', () => {
      const mockError = new Error('Failed to fetch customer orders');
      const mockUseQuery = vi.fn().mockReturnValue({
        data: undefined,
        isLoading: false,
        error: mockError,
      });
      (trpc.order.listMine.useQuery as any).mockImplementation(mockUseQuery);

      const { result } = renderHook(
        () => useListMyOrders({}),
        { wrapper: createWrapper(false) },
      );

      expect(result.current.error).toEqual(mockError);
      expect(result.current.data).toBeUndefined();
    });

    it('should convert sortBy totalAmount to total', () => {
      const mockUseQuery = vi.fn().mockReturnValue({
        data: mockOrderList,
        isLoading: false,
        error: null,
      });
      (trpc.order.listMine.useQuery as any).mockImplementation(mockUseQuery);

      renderHook(
        () => useListMyOrders({
          sortBy: 'totalAmount',
          sortOrder: 'asc',
        }),
        { wrapper: createWrapper(false) },
      );

      expect(mockUseQuery).toHaveBeenCalledWith({
        page: 1,
        limit: 10,
        sortBy: 'total',
        sortOrder: 'asc',
      });
    });
  });

  describe('useGetMyOrderById', () => {
    it('should fetch customer order by ID', () => {
      const mockUseQuery = vi.fn().mockReturnValue({
        data: mockOrderDetail,
        isLoading: false,
        error: null,
      });
      (trpc.order.getMine.useQuery as any).mockImplementation(mockUseQuery);

      const { result } = renderHook(
        () => useGetMyOrderById('order1'),
        { wrapper: createWrapper(false) },
      );

      expect(mockUseQuery).toHaveBeenCalledWith(
        { orderId: 'order1' },
        { enabled: true },
      );

      expect(result.current.data).toEqual(mockOrderDetail);
    });

    it('should not fetch when ID is null', () => {
      const mockUseQuery = vi.fn().mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      });
      (trpc.order.getMine.useQuery as any).mockImplementation(mockUseQuery);

      renderHook(
        () => useGetMyOrderById(null),
        { wrapper: createWrapper(false) },
      );

      expect(mockUseQuery).toHaveBeenCalledWith(
        { orderId: '' },
        { enabled: false },
      );
    });

    it('should handle loading state', () => {
      const mockUseQuery = vi.fn().mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      });
      (trpc.order.getMine.useQuery as any).mockImplementation(mockUseQuery);

      const { result } = renderHook(
        () => useGetMyOrderById('order1'),
        { wrapper: createWrapper(false) },
      );

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();
    });

    it('should handle error state', () => {
      const mockError = new Error('Order not found or access denied');
      const mockUseQuery = vi.fn().mockReturnValue({
        data: undefined,
        isLoading: false,
        error: mockError,
      });
      (trpc.order.getMine.useQuery as any).mockImplementation(mockUseQuery);

      const { result } = renderHook(
        () => useGetMyOrderById('order1'),
        { wrapper: createWrapper(false) },
      );

      expect(result.current.error).toEqual(mockError);
      expect(result.current.data).toBeUndefined();
    });
  });
});

