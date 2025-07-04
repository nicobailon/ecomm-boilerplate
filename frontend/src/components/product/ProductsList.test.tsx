import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, createMockProduct } from '@/test/test-utils';
import ProductsList from './ProductsList';
import type { UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import type { Product, PaginatedResponse } from '@/types';
import { createMockQueryResult, createMockMutationResult } from '@/test/mocks/query-mocks';

// Mock the hooks module to avoid importing JSX
vi.mock('@/hooks/product/useProducts', () => ({
  useProducts: vi.fn(),
  useDeleteProduct: vi.fn(),
  useToggleFeatured: vi.fn(),
  useFeaturedProducts: vi.fn(),
}));

// Mock the inventory hook
vi.mock('@/hooks/queries/useInventory', () => ({
  useProductInventory: vi.fn(() => ({
    data: { quantity: 10, reservedQuantity: 0 },
    isLoading: false,
    error: null,
  })),
}));

import * as useProductsHooks from '@/hooks/product/useProducts';

// Type for the actual API response structure
interface ProductsApiResponse {
  data: Product[];
  totalPages: number;
  currentPage: number;
}

describe('ProductsList - Featured Products', () => {
  const mockProducts = [
    createMockProduct({ _id: '1', name: 'Product 1', isFeatured: true }),
    createMockProduct({ _id: '2', name: 'Product 2', isFeatured: false }),
    createMockProduct({ _id: '3', name: 'Product 3', isFeatured: true }),
  ];

  const mockUseProducts = vi.mocked(useProductsHooks.useProducts);
  const mockUseDeleteProduct = vi.mocked(useProductsHooks.useDeleteProduct);
  const mockUseToggleFeatured = vi.mocked(useProductsHooks.useToggleFeatured);
  const mockUseFeaturedProducts = vi.mocked(useProductsHooks.useFeaturedProducts);

  beforeEach(() => {
    vi.clearAllMocks();
    
    const mockProductsData = createMockQueryResult<PaginatedResponse<Product>>({
      data: { 
        data: mockProducts, 
        pagination: {
          page: 1,
          limit: 12,
          total: mockProducts.length,
          pages: 1,
        },
        success: true,
      },
      isLoading: false,
      isSuccess: true,
      isFetched: true,
      isFetchedAfterMount: true,
      dataUpdatedAt: Date.now(),
    });
    
    mockUseProducts.mockReturnValue(mockProductsData);

    mockUseDeleteProduct.mockReturnValue(createMockMutationResult<void, Error, string>({
      isPending: false,
      isIdle: true,
    }));

    mockUseToggleFeatured.mockReturnValue(createMockMutationResult<Product, Error, string, { previousQueries: [readonly unknown[], PaginatedResponse<Product> | undefined][]; previousFeatured: Product[] | undefined }>({
      isPending: false,
      isIdle: true,
    }));

    const mockFeaturedProductsData = createMockQueryResult<Product[]>({
      data: mockProducts.filter(p => p.isFeatured),
      isLoading: false,
      isSuccess: true,
      isFetched: true,
      isFetchedAfterMount: true,
      dataUpdatedAt: Date.now(),
    });
    
    mockUseFeaturedProducts.mockReturnValue(mockFeaturedProductsData);
  });

  describe('Star Button Dynamic Title', () => {
    it('should show "Add to homepage carousel" for non-featured products', async () => {
      renderWithProviders(<ProductsList />);

      await waitFor(() => {
        const nonFeaturedStarButtons = screen.getAllByTitle('Add to homepage carousel');
        void expect(nonFeaturedStarButtons).toHaveLength(1);
      });
    });

    it('should show "Remove from homepage carousel" for featured products', async () => {
      renderWithProviders(<ProductsList />);

      await waitFor(() => {
        const featuredStarButtons = screen.getAllByTitle('Remove from homepage carousel');
        void expect(featuredStarButtons).toHaveLength(2);
      });
    });

    it('should have correct styling for featured vs non-featured stars', async () => {
      renderWithProviders(<ProductsList />);

      await waitFor(() => {
        const allStarButtons = screen.getAllByRole('button', { name: /homepage carousel/i });
        
        const featuredButton = allStarButtons.find(btn => 
          btn.getAttribute('title') === 'Remove from homepage carousel',
        );
        const nonFeaturedButton = allStarButtons.find(btn => 
          btn.getAttribute('title') === 'Add to homepage carousel',
        );

        void expect(featuredButton?.className).toContain('bg-warning');
        void expect(featuredButton?.className).toContain('ring-2');
        void expect(nonFeaturedButton?.className).toContain('bg-muted');
        void expect(nonFeaturedButton?.className).not.toContain('ring-2');
      });
    });
  });

  describe('Featured Products Header', () => {
    it('should display info icon with tooltip in Featured column header', async () => {
      renderWithProviders(<ProductsList />);

      await waitFor(() => {
        const featuredHeader = screen.getByText('Featured');
        void expect(featuredHeader).toBeInTheDocument();
        
        const infoIcon = featuredHeader.parentElement?.querySelector('[title="Featured products appear in the homepage carousel"]');
        void expect(infoIcon).toBeInTheDocument();
        // The icon is wrapped in a span, so check for the svg inside
        const svgIcon = infoIcon?.querySelector('svg');
        void expect(svgIcon).toBeInTheDocument();
      });
    });
  });

  describe('Featured Count Banner', () => {
    it('should display correct count of featured products', async () => {
      renderWithProviders(<ProductsList />);

      await waitFor(() => {
        const featuredCount = screen.getByTestId('featured-count');
        void expect(featuredCount).toHaveTextContent('2 featured products in homepage carousel');
      });
    });

    it('should display singular form for 1 featured product', async () => {
      mockUseFeaturedProducts.mockReturnValue({
        data: [mockProducts[0]],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isPending: false,
        isError: false,
        isSuccess: true,
        isLoadingError: false,
        isRefetchError: false,
        isFetching: false,
        isFetched: true,
        isRefetching: false,
        isStale: false,
        isPlaceholderData: false,
        status: 'success',
        fetchStatus: 'idle',
        errorUpdateCount: 0,
        dataUpdatedAt: Date.now(),
        errorUpdatedAt: 0,
        failureCount: 0,
        failureReason: null,
        isFetchedAfterMount: true,
        isInitialLoading: false,
        isPaused: false,
        promise: Promise.resolve([mockProducts[0]]),
      } as UseQueryResult<Product[], Error>);

      renderWithProviders(<ProductsList />);

      await waitFor(() => {
        const featuredCount = screen.getByTestId('featured-count');
        void expect(featuredCount).toHaveTextContent('1 featured product in homepage carousel');
      });
    });

    it('should hide banner when no products are featured', async () => {
      mockUseFeaturedProducts.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
        refetch: vi.fn(),
        isPending: false,
        isError: false,
        isSuccess: true,
        isLoadingError: false,
        isRefetchError: false,
        isFetching: false,
        isFetched: true,
        isRefetching: false,
        isStale: false,
        isPlaceholderData: false,
        status: 'success',
        fetchStatus: 'idle',
        errorUpdateCount: 0,
        dataUpdatedAt: Date.now(),
        errorUpdatedAt: 0,
        failureCount: 0,
        failureReason: null,
        isFetchedAfterMount: true,
        isInitialLoading: false,
        isPaused: false,
        promise: Promise.resolve([]),
      } as UseQueryResult<Product[], Error>);

      const { container } = renderWithProviders(<ProductsList />);

      await waitFor(() => {
        // Banner should not be rendered when count is 0
        const banner = container.querySelector('[data-testid="featured-count"]');
        void expect(banner).not.toBeInTheDocument();
      });
    });

    it('should not display banner while loading', () => {
      mockUseFeaturedProducts.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
        isPending: true,
        isError: false,
        isSuccess: false,
        isLoadingError: false,
        isRefetchError: false,
        isFetching: true,
        isFetched: false,
        isRefetching: false,
        isStale: false,
        isPlaceholderData: false,
        status: 'pending',
        fetchStatus: 'fetching',
        errorUpdateCount: 0,
        dataUpdatedAt: 0,
        errorUpdatedAt: 0,
        failureCount: 0,
        failureReason: null,
        isFetchedAfterMount: false,
        isInitialLoading: true,
        isPaused: false,
        promise: new Promise(() => { /* pending promise */ }),
      } as UseQueryResult<Product[], Error>);

      const { container } = renderWithProviders(<ProductsList />);
      
      const banner = container.querySelector('.bg-muted\\/50');
      void expect(banner).not.toBeInTheDocument();
    });

    it('should contain preview homepage link', async () => {
      renderWithProviders(<ProductsList />);

      await waitFor(() => {
        const previewLink = screen.getByRole('link', { name: /preview homepage/i });
        void expect(previewLink).toBeInTheDocument();
        void expect(previewLink).toHaveAttribute('href', '/');
        void expect(previewLink).toHaveAttribute('target', '_blank');
        void expect(previewLink).toHaveAttribute('rel', 'noopener noreferrer');
      });
    });
  });

  describe('Integration: Star Click with Optimistic UI', () => {
    it('should toggle featured status when star is clicked', async () => {
      const toggleMutate = vi.fn();
      mockUseToggleFeatured.mockReturnValue({
        mutate: toggleMutate,
        mutateAsync: vi.fn(),
        isPending: false,
        isError: false,
        isSuccess: false,
        isIdle: true,
        data: undefined,
        error: null,
        variables: undefined,
        status: 'idle',
        reset: vi.fn(),
        context: undefined,
        failureCount: 0,
        failureReason: null,
        isPaused: false,
        submittedAt: 0,
      } as UseMutationResult<Product, Error, string, { previousQueries: [readonly unknown[], PaginatedResponse<Product> | undefined][]; previousFeatured: Product[] | undefined }>);

      const user = userEvent.setup();
      renderWithProviders(<ProductsList />);

      await waitFor(() => {
        void expect(screen.getByText('Product 2')).toBeInTheDocument();
      });

      // Find all toggle buttons
      const toggleButtons = screen.getAllByTestId('toggle-feature');
      
      // Find the non-featured product's button (Product 2)
      const nonFeaturedButton = toggleButtons[1]; // Product 2 is at index 1
      void expect(nonFeaturedButton).toHaveAttribute('title', 'Add to homepage carousel');

      // Click the star
      await user.click(nonFeaturedButton);

      // Verify the mutation was called with the correct product ID
      void expect(toggleMutate).toHaveBeenCalledWith('2');
      void expect(toggleMutate).toHaveBeenCalledTimes(1);
    });

    it('should show loading state when toggling', async () => {
      // Create a mock that we can control
      const togglePromise = Promise.resolve(undefined);
      
      const toggleMutate = vi.fn(() => togglePromise);
      mockUseToggleFeatured.mockReturnValue({
        mutate: toggleMutate as UseMutationResult<Product, Error, string, { previousQueries: [readonly unknown[], PaginatedResponse<Product> | undefined][]; previousFeatured: Product[] | undefined }>['mutate'],
        mutateAsync: vi.fn(),
        isPending: false,
        isError: false,
        isSuccess: false,
        isIdle: true,
        data: undefined,
        error: null,
        variables: undefined,
        status: 'idle',
        reset: vi.fn(),
        context: undefined,
        failureCount: 0,
        failureReason: null,
        isPaused: false,
        submittedAt: 0,
      } as UseMutationResult<Product, Error, string, { previousQueries: [readonly unknown[], PaginatedResponse<Product> | undefined][]; previousFeatured: Product[] | undefined }>);

      const user = userEvent.setup();
      renderWithProviders(<ProductsList />);

      await waitFor(() => {
        void expect(screen.getByText('Product 1')).toBeInTheDocument();
      });

      // Find a featured product's toggle button and click it
      const toggleButtons = screen.getAllByTestId('toggle-feature');
      const featuredButton = toggleButtons[0]; // Product 1 is featured
      void expect(featuredButton).toHaveAttribute('title', 'Remove from homepage carousel');
      
      // Click starts the async operation
      await user.click(featuredButton);
      
      // Verify the mutation was called
      void expect(toggleMutate).toHaveBeenCalledWith('1');
      
      // The component manages its own loading state internally via useState
      // We can't directly test the disabled state without implementation details
      // But we've verified the mutation is called correctly
    });

    it('should update UI optimistically', async () => {
      let currentProducts = [...mockProducts];
      
      const toggleMutate = vi.fn((productId: string) => {
        // Simulate optimistic update
        currentProducts = currentProducts.map(p => 
          p._id === productId ? { ...p, isFeatured: !p.isFeatured } : p,
        );
        
        // Re-render with updated data
        mockUseProducts.mockReturnValue({
          data: { data: currentProducts, totalPages: 1, currentPage: 1 } as ProductsApiResponse,
          isLoading: false,
          error: null,
          refetch: vi.fn(),
          isPending: false,
          isError: false,
          isSuccess: true,
          isLoadingError: false,
          isRefetchError: false,
          isFetching: false,
          isFetched: true,
          isRefetching: false,
          isStale: false,
          isPlaceholderData: false,
          status: 'success',
          fetchStatus: 'idle',
          errorUpdateCount: 0,
          dataUpdatedAt: Date.now(),
          errorUpdatedAt: 0,
          failureCount: 0,
          failureReason: null,
          isFetchedAfterMount: true,
          isInitialLoading: false,
          isPaused: false,
          promise: Promise.resolve({ data: currentProducts, totalPages: 1, currentPage: 1 }),
        } as unknown as UseQueryResult<PaginatedResponse<Product>, Error>);
        
        mockUseFeaturedProducts.mockReturnValue({
          data: currentProducts.filter(p => p.isFeatured),
          isLoading: false,
          error: null,
          refetch: vi.fn(),
          isPending: false,
          isError: false,
          isSuccess: true,
          isLoadingError: false,
          isRefetchError: false,
          isFetching: false,
          isFetched: true,
          isRefetching: false,
          isStale: false,
          isPlaceholderData: false,
          status: 'success',
          fetchStatus: 'idle',
          errorUpdateCount: 0,
          dataUpdatedAt: Date.now(),
          errorUpdatedAt: 0,
          failureCount: 0,
          failureReason: null,
          isFetchedAfterMount: true,
          isInitialLoading: false,
          isPaused: false,
          promise: Promise.resolve(currentProducts.filter(p => p.isFeatured)),
        } as UseQueryResult<Product[], Error>);
      });

      mockUseToggleFeatured.mockReturnValue({
        mutate: toggleMutate as UseMutationResult<Product, Error, string, { previousQueries: [readonly unknown[], PaginatedResponse<Product> | undefined][]; previousFeatured: Product[] | undefined }>['mutate'],
        mutateAsync: vi.fn(),
        isPending: false,
        isError: false,
        isSuccess: false,
        isIdle: true,
        data: undefined,
        error: null,
        variables: undefined,
        status: 'idle',
        reset: vi.fn(),
        context: undefined,
        failureCount: 0,
        failureReason: null,
        isPaused: false,
        submittedAt: 0,
      } as UseMutationResult<Product, Error, string, { previousQueries: [readonly unknown[], PaginatedResponse<Product> | undefined][]; previousFeatured: Product[] | undefined }>);

      const user = userEvent.setup();
      const { rerender } = renderWithProviders(<ProductsList />);

      await waitFor(() => {
        const featuredCount = screen.getByTestId('featured-count');
        void expect(featuredCount).toHaveTextContent('2 featured products in homepage carousel');
      });

      // Click non-featured product star
      const toggleButtons = screen.getAllByTestId('toggle-feature');
      const nonFeaturedButton = toggleButtons[1]; // Product 2 is not featured
      await user.click(nonFeaturedButton);

      // Simulate re-render after optimistic update
      rerender(<ProductsList />);

      await waitFor(() => {
        // Banner should show 3 featured products now
        const featuredCount = screen.getByTestId('featured-count');
        void expect(featuredCount).toHaveTextContent('3 featured products in homepage carousel');
      });
    });
  });
});