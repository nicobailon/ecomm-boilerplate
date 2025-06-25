import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';
import ProductDetailPage from './ProductDetailPage';
import type { Product } from '@/types';
import { createMockQueryResult } from '@/test/mocks/query-mocks';

// Mocks must be hoisted
vi.mock('@/hooks/queries/useProduct');
vi.mock('@/hooks/useProductAnalytics');
vi.mock('@/hooks/cart/useUnifiedCart');
vi.mock('@/hooks/queries/useRelatedProducts');

// Import the mocked modules
import { useProduct } from '@/hooks/queries/useProduct';
import { useProductAnalytics } from '@/hooks/useProductAnalytics';
import { useUnifiedAddToCart } from '@/hooks/cart/useUnifiedCart';
import { useRelatedProducts } from '@/hooks/queries/useRelatedProducts';

// Type the mocks properly
const mockUseProduct = vi.mocked(useProduct);
const mockUseProductAnalytics = vi.mocked(useProductAnalytics);
const mockUseUnifiedAddToCart = vi.mocked(useUnifiedAddToCart);
const mockUseRelatedProducts = vi.mocked(useRelatedProducts);

describe('ProductDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementations
    const mockProductData = {
      ...createMockQueryResult<{ product: Product }>({
        data: {
          product: {
            _id: '123',
            name: 'Test Product',
            slug: 'test-product',
            description: 'Test description',
            price: 29.99,
            image: 'https://example.com/image.jpg',
            variants: [
              {
                variantId: 'v1',
                label: 'Size M',
                color: '#000000',
                price: 29.99,
                inventory: 50,
                images: ['https://example.com/variant.jpg'],
                sku: 'TEST-SKU',
              },
            ],
            collectionId: {
              _id: 'col123',
              name: 'Test Collection',
              slug: 'test-collection',
            },
            isFeatured: false,
            createdAt: '2025-01-01T00:00:00.000Z',
            updatedAt: '2025-01-01T00:00:00.000Z',
          },
        },
        isLoading: false,
        isSuccess: true,
        isFetched: true,
        isFetchedAfterMount: true,
        dataUpdatedAt: Date.now(),
      }),
      trpc: {
        path: 'product.bySlug',
        queryKey: ['product.bySlug', { slug: 'test-product' }],
      },
    };
    
    mockUseProduct.mockReturnValue(mockProductData as unknown as ReturnType<typeof useProduct>);

    // useProductAnalytics returns void
    mockUseProductAnalytics.mockReturnValue(undefined);

    const mockAddToCartMutation = {
      mutate: vi.fn(),
      mutateAsync: vi.fn().mockResolvedValue(undefined),
      isPending: false,
      isError: false,
      error: null,
    };
    
    mockUseUnifiedAddToCart.mockReturnValue(mockAddToCartMutation as ReturnType<typeof useUnifiedAddToCart>);

    const mockRelatedProductsData = {
      ...createMockQueryResult<Product[]>({
        data: [],
        isLoading: false,
        isSuccess: true,
        isFetched: true,
        isFetchedAfterMount: true,
        dataUpdatedAt: Date.now(),
      }),
      trpc: {
        path: 'product.related',
        queryKey: ['product.related', { productId: '123' }],
      },
    };
    
    mockUseRelatedProducts.mockReturnValue(mockRelatedProductsData as ReturnType<typeof useRelatedProducts>);
  });

  const renderProductDetailPage = (slug = 'test-product') => {
    return render(
      <MemoryRouter initialEntries={[`/products/${slug}`]}>
        <Routes>
          <Route path="/products/:slug" element={<ProductDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );
  };

  it('renders product details correctly', () => {
    renderProductDetailPage();

    // Product name appears in multiple places (breadcrumb and heading)
    const productNames = screen.getAllByText('Test Product');
    expect(productNames.length).toBeGreaterThan(0);
    
    expect(screen.getByText('Test description')).toBeInTheDocument();
    expect(screen.getByText('$29.99')).toBeInTheDocument();
  });

  it('displays breadcrumb navigation', () => {
    renderProductDetailPage();

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Test Collection')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
  });

  it('shows variant selector when variants exist', () => {
    renderProductDetailPage();

    expect(screen.getByText('Size')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Size M/ })).toBeInTheDocument();
  });

  it('displays loading state', () => {
    const mockLoadingData = {
      ...createMockQueryResult<{ product: Product }>({
        data: undefined,
        isLoading: true,
        isPending: true,
        isSuccess: false,
        isFetched: false,
        status: 'pending',
        fetchStatus: 'fetching',
      }),
      trpc: {
        path: 'product.bySlug',
        queryKey: ['product.bySlug', { slug: 'test-product' }],
      },
    };
    
    mockUseProduct.mockReturnValueOnce(mockLoadingData as unknown as ReturnType<typeof useProduct>);

    renderProductDetailPage();

    // Check for skeleton elements
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('displays error state', () => {
    const mockErrorData = {
      ...createMockQueryResult<{ product: Product }>({
        data: undefined,
        isLoading: false,
        error: new Error('Not found'),
        isError: true,
        isSuccess: false,
        isFetched: true,
        isFetchedAfterMount: true,
        errorUpdatedAt: Date.now(),
        status: 'error',
      }),
      trpc: {
        path: 'product.bySlug',
        queryKey: ['product.bySlug', { slug: 'test-product' }],
      },
    };
    
    mockUseProduct.mockReturnValueOnce(mockErrorData as unknown as ReturnType<typeof useProduct>);

    renderProductDetailPage();

    expect(screen.getByText('Product Not Found')).toBeInTheDocument();
  });
});