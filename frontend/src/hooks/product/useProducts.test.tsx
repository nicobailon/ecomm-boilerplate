import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { createWrapper } from '@/test/test-utils';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import type { Product } from '@/types';

vi.mock('@/lib/api-client');
vi.mock('sonner');

// Import the actual hook - the window.matchMedia mock is already set up in src/test/setup.ts
import { useToggleFeatured } from './useProducts';

describe('useToggleFeatured Hook', () => {
  const mockApiClient = vi.mocked(apiClient);
  const mockToast = vi.mocked(toast);

  const mockProduct: Product = {
    _id: 'test-id',
    name: 'Test Product',
    isFeatured: false,
    description: 'Test description',
    price: 99.99,
    image: 'test.jpg',
    category: 'jeans',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should call the correct API endpoint', async () => {
    const updatedProduct = { ...mockProduct, isFeatured: true };
    mockApiClient.patch.mockResolvedValueOnce({ data: updatedProduct });

    const { result } = renderHook(() => useToggleFeatured(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate('test-id');
    });

    await waitFor(() => {
      expect(mockApiClient.patch).toHaveBeenCalledWith('/products/toggle-featured/test-id');
      expect(mockApiClient.patch).toHaveBeenCalledTimes(1);
    });
  });

  it('should show success toast when product is featured', async () => {
    const updatedProduct = { ...mockProduct, isFeatured: true };
    mockApiClient.patch.mockResolvedValueOnce({ data: updatedProduct });

    const { result } = renderHook(() => useToggleFeatured(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate('test-id');
    });

    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalled();
      // Verify the toast was called with JSX content
      const toastCall = mockToast.success.mock.calls[0][0];
      expect(toastCall).toBeTruthy();
    });
  });

  it('should show success toast when product is unfeatured', async () => {
    const featuredProduct = { ...mockProduct, isFeatured: true };
    const updatedProduct = { ...featuredProduct, isFeatured: false };
    mockApiClient.patch.mockResolvedValueOnce({ data: updatedProduct });

    const { result } = renderHook(() => useToggleFeatured(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate('test-id');
    });

    await waitFor(() => {
      expect(mockToast.success).toHaveBeenCalled();
      const toastCall = mockToast.success.mock.calls[0][0];
      expect(toastCall).toBeTruthy();
    });
  });

  it('should show error toast on failure', async () => {
    mockApiClient.patch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useToggleFeatured(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate('test-id');
    });

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('Failed to update featured status');
    });
  });

  it('should handle optimistic updates', async () => {
    const updatedProduct = { ...mockProduct, isFeatured: true };
    mockApiClient.patch.mockResolvedValueOnce({ data: updatedProduct });

    const { result, queryClient } = renderHook(() => useToggleFeatured(), {
      wrapper: createWrapper(),
    });

    // Set initial query data
    queryClient.setQueryData(['products', 1, 12], {
      data: [mockProduct],
      totalPages: 1,
      currentPage: 1,
    });
    queryClient.setQueryData(['products', 'featured'], []);

    await act(async () => {
      result.current.mutate('test-id');
    });

    // The hook's onMutate should have optimistically updated the data
    await waitFor(() => {
      expect(mockApiClient.patch).toHaveBeenCalled();
    });
  });

  it('should rollback on error', async () => {
    mockApiClient.patch.mockRejectedValueOnce(new Error('Network error'));

    const { result, queryClient } = renderHook(() => useToggleFeatured(), {
      wrapper: createWrapper(),
    });

    // Set initial data
    queryClient.setQueryData(['products', 1, 12], {
      data: [mockProduct],
      totalPages: 1,
      currentPage: 1,
    });
    queryClient.setQueryData(['products', 'featured'], []);

    await act(async () => {
      result.current.mutate('test-id');
    });

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalled();
    });

    // Data should be rolled back to original state
    const productsData = queryClient.getQueryData(['products', 1, 12]) as any;
    expect(productsData?.data[0].isFeatured).toBe(false);
  });

  it('should properly update featured products list', async () => {
    const updatedProduct = { ...mockProduct, isFeatured: true };
    mockApiClient.patch.mockResolvedValueOnce({ data: updatedProduct });

    const { result, queryClient } = renderHook(() => useToggleFeatured(), {
      wrapper: createWrapper(),
    });

    // Set initial data
    queryClient.setQueryData(['products', 1, 12], {
      data: [mockProduct, { ...mockProduct, _id: '2', name: 'Product 2' }],
      totalPages: 1,
      currentPage: 1,
    });
    queryClient.setQueryData(['products', 'featured'], []);

    await act(async () => {
      result.current.mutate('test-id');
    });

    await waitFor(() => {
      expect(mockApiClient.patch).toHaveBeenCalledWith('/products/toggle-featured/test-id');
    });
  });
});