import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';
import ProductDetailPage from './ProductDetailPage';

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

// Type the mocks
const mockUseProduct = useProduct as ReturnType<typeof vi.fn>;
const mockUseProductAnalytics = useProductAnalytics as ReturnType<typeof vi.fn>;
const mockUseUnifiedAddToCart = useUnifiedAddToCart as ReturnType<typeof vi.fn>;
const mockUseRelatedProducts = useRelatedProducts as ReturnType<typeof vi.fn>;

describe('ProductDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementations
    mockUseProduct.mockReturnValue({
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
              size: 'M',
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
      error: null,
    } as any);

    mockUseProductAnalytics.mockReturnValue({
      trackView: vi.fn(),
    } as any);

    mockUseUnifiedAddToCart.mockReturnValue({
      mutate: vi.fn(),
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    mockUseRelatedProducts.mockReturnValue({
      data: {
        products: [],
      },
    } as any);
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
    mockUseProduct.mockReturnValueOnce({
      data: null,
      isLoading: true,
      error: null,
      isError: false,
    } as any);

    renderProductDetailPage();

    // Check for skeleton elements
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('displays error state', () => {
    mockUseProduct.mockReturnValueOnce({
      data: null,
      isLoading: false,
      error: { message: 'Not found' },
      isError: true,
    } as any);

    renderProductDetailPage();

    expect(screen.getByText('Product Not Found')).toBeInTheDocument();
  });
});