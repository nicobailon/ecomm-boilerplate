import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { apiClient } from '@/lib/api-client';
import type { Product } from '@/types';
import type { AxiosResponse } from 'axios';
import { AxiosHeaders } from 'axios';
import type { ReactElement } from 'react';
import { toast } from 'sonner';

vi.mock('@/lib/api-client');
vi.mock('sonner');

// Import the actual hook
import { useToggleFeatured } from './useProducts';

// Define proper types for toast element structure
interface ToastElementProps {
  children: [ReactElement<{ children: string }>, ReactElement<{ href: string; target: string; children: string }>];
}

// Create a custom wrapper without ThemeProvider to avoid window.matchMedia issues
const createTestWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });

  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </BrowserRouter>
  );

  return { wrapper: TestWrapper, queryClient };
};

// Helper function to create mock axios responses
const createMockAxiosResponse = <T,>(data: T): AxiosResponse<T> => ({
  data,
  status: 200,
  statusText: 'OK',
  headers: {},
  config: {
    url: '',
    method: 'PATCH',
    headers: new AxiosHeaders({
      Accept: 'application/json, text/plain, */*',
      'Content-Type': 'application/json',
    }),
    transformRequest: [],
    transformResponse: [],
    timeout: 0,
    xsrfCookieName: 'XSRF-TOKEN',
    xsrfHeaderName: 'X-XSRF-TOKEN',
    maxContentLength: -1,
    maxBodyLength: -1,
    validateStatus: (status: number) => status >= 200 && status < 300,
    transitional: {
      silentJSONParsing: true,
      forcedJSONParsing: true,
      clarifyTimeoutError: false,
    },
  },
});

describe('useToggleFeatured Hook', () => {
  const mockApiClient = vi.mocked(apiClient);
  const mockToast = vi.mocked(toast) as unknown as {
    success: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
    [key: string]: unknown;
  };

  const mockProduct: Product = {
    _id: 'test-id',
    name: 'Test Product',
    isFeatured: false,
    description: 'Test description',
    price: 99.99,
    image: 'test.jpg',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Setup toast mocks
    mockToast.success = vi.fn();
    mockToast.error = vi.fn();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should call the correct API endpoint', async () => {
    const updatedProduct = { ...mockProduct, isFeatured: true };
    mockApiClient.patch.mockResolvedValueOnce(createMockAxiosResponse(updatedProduct));

    const { wrapper } = createTestWrapper();
    const { result } = renderHook(() => useToggleFeatured(), { wrapper });

    act(() => {
      result.current.mutate('test-id');
    });

    await waitFor(() => {
      // eslint-disable-next-line @typescript-eslint/unbound-method
      const patchFn = mockApiClient.patch;
      expect(patchFn).toHaveBeenCalledWith('/products/toggle-featured/test-id');
      expect(patchFn).toHaveBeenCalledTimes(1);
    });
  });

  it('should show success toast when product is featured', async () => {
    const updatedProduct = { ...mockProduct, isFeatured: true };
    mockApiClient.patch.mockResolvedValueOnce(createMockAxiosResponse(updatedProduct));

    const { wrapper } = createTestWrapper();
    const { result } = renderHook(() => useToggleFeatured(), { wrapper });

    act(() => {
      result.current.mutate('test-id');
    });

    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalled();
      // Verify the toast was called with JSX content containing the correct message
      const toastCall = mockToast.success.mock.calls[0][0] as ReactElement<ToastElementProps>;
      expect(toastCall).toBeTruthy();
      // The toast content is JSX, so we check its structure
      expect(toastCall.props?.children).toBeDefined();
      const [messageSpan, linkElement] = toastCall.props.children;
      expect(messageSpan.props.children).toContain('Test Product added to homepage carousel');
      // Verify the link element
      expect(linkElement.type).toBe('a');
      expect(linkElement.props.href).toBe('/');
      expect(linkElement.props.target).toBe('_blank');
      expect(linkElement.props.children).toContain('View on homepage →');
    });
  });

  it('should show success toast when product is unfeatured', async () => {
    const featuredProduct = { ...mockProduct, isFeatured: true };
    const updatedProduct = { ...featuredProduct, isFeatured: false };
    mockApiClient.patch.mockResolvedValueOnce(createMockAxiosResponse(updatedProduct));

    const { wrapper } = createTestWrapper();
    const { result } = renderHook(() => useToggleFeatured(), { wrapper });

    act(() => {
      result.current.mutate('test-id');
    });

    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalled();
      const toastCall = mockToast.success.mock.calls[0][0] as ReactElement<ToastElementProps>;
      expect(toastCall).toBeTruthy();
      // Verify the unfeatured message
      expect(toastCall.props?.children).toBeDefined();
      const [messageSpan, linkElement] = toastCall.props.children;
      expect(messageSpan.props.children).toContain('Test Product removed from homepage carousel');
      // Verify the link is still present
      expect(linkElement.type).toBe('a');
      expect(linkElement.props.href).toBe('/');
    });
  });

  it('should show error toast on failure', async () => {
    mockApiClient.patch.mockRejectedValueOnce(new Error('Network error'));

    const { wrapper } = createTestWrapper();
    const { result } = renderHook(() => useToggleFeatured(), { wrapper });

    act(() => {
      result.current.mutate('test-id');
    });

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('Failed to update featured status');
    });
  });

  it('should handle optimistic updates', async () => {
    const updatedProduct = { ...mockProduct, isFeatured: true };
    mockApiClient.patch.mockResolvedValueOnce(createMockAxiosResponse(updatedProduct));

    const { wrapper, queryClient } = createTestWrapper();
    const { result } = renderHook(() => useToggleFeatured(), { wrapper });

    // Set initial query data
    queryClient.setQueryData(['products', 1, 12], {
      data: [mockProduct],
      totalPages: 1,
      currentPage: 1,
    });
    queryClient.setQueryData(['products', 'featured'], []);

    act(() => {
      result.current.mutate('test-id');
    });

    // The hook's onMutate should have optimistically updated the data
    await waitFor(() => {
      // eslint-disable-next-line @typescript-eslint/unbound-method
      const patchFn = mockApiClient.patch;
      expect(patchFn).toHaveBeenCalled();
    });
  });

  it('should rollback on error', async () => {
    mockApiClient.patch.mockRejectedValueOnce(new Error('Network error'));

    const { wrapper, queryClient } = createTestWrapper();
    const { result } = renderHook(() => useToggleFeatured(), { wrapper });

    // Set initial data
    queryClient.setQueryData(['products', 1, 12], {
      data: [mockProduct],
      totalPages: 1,
      currentPage: 1,
    });
    queryClient.setQueryData(['products', 'featured'], []);

    act(() => {
      result.current.mutate('test-id');
    });

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalled();
      
      // Data should be rolled back to original state
      const productsData = queryClient.getQueryData<{ data: Product[]; totalPages: number; currentPage: number }>(['products', 1, 12]);
      expect(productsData).toBeDefined();
      expect(productsData?.data).toBeDefined();
      if (!productsData?.data) throw new Error('No products data');
      expect(productsData.data[0].isFeatured).toBe(false);
    });
  });

  it('should properly update featured products list', async () => {
    const updatedProduct = { ...mockProduct, isFeatured: true };
    mockApiClient.patch.mockResolvedValueOnce(createMockAxiosResponse(updatedProduct));

    const { wrapper, queryClient } = createTestWrapper();
    const { result } = renderHook(() => useToggleFeatured(), { wrapper });

    // Set initial data
    queryClient.setQueryData(['products', 1, 12], {
      data: [mockProduct, { ...mockProduct, _id: '2', name: 'Product 2' }],
      totalPages: 1,
      currentPage: 1,
    });
    queryClient.setQueryData(['products', 'featured'], []);

    act(() => {
      result.current.mutate('test-id');
    });

    await waitFor(() => {
      // eslint-disable-next-line @typescript-eslint/unbound-method
      const patchFn = mockApiClient.patch;
      expect(patchFn).toHaveBeenCalledWith('/products/toggle-featured/test-id');
    });
  });
});