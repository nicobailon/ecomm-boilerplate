import type { Meta, StoryObj } from '@storybook/react-vite';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { RelatedProducts } from './RelatedProducts';
import { trpc } from '@/lib/trpc';
import { createTRPCClient } from '@/lib/trpc-client';
import type { Product, Collection } from '@/types';
import { within, userEvent, expect, waitFor } from '@storybook/test';
import { Toaster } from 'sonner';
import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/Skeleton';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader2, RefreshCw, Package } from 'lucide-react';

const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const mockCollection: Collection = {
  _id: 'col1',
  name: 'Summer Collection',
  slug: 'summer-collection',
  description: 'Fresh styles for the summer season',
  isPublic: true,
  products: [],
  owner: 'owner1',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const createMockProducts = (count: number): Product[] => {
  return Array.from({ length: count }, (_, i) => ({
    _id: `prod${i + 1}`,
    name: `Product ${i + 1}`,
    description: `Description for product ${i + 1}`,
    price: Math.floor(Math.random() * 100) + 20,
    image: `https://images.unsplash.com/photo-${1542291026 + i * 1000}-7eec264c27ff?w=500`,
    isFeatured: i % 3 === 0,
    slug: `product-${i + 1}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
};

const mockProducts = createMockProducts(8);

const meta = {
  title: 'Product/RelatedProducts',
  component: RelatedProducts,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => {
      const queryClient = createQueryClient();
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              <div className="container mx-auto">
                <Story />
              </div>
              <Toaster position="top-right" />
            </BrowserRouter>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
} satisfies Meta<typeof RelatedProducts>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    products: mockProducts.slice(0, 4),
  },
};

export const WithCollection: Story = {
  args: {
    products: mockProducts.slice(0, 6),
    collection: mockCollection,
  },
};

export const ManyProducts: Story = {
  args: {
    products: createMockProducts(12),
    collection: mockCollection,
  },
};

export const FewProducts: Story = {
  args: {
    products: mockProducts.slice(0, 2),
  },
};

export const EmptyState: Story = {
  args: {
    products: [],
  },
};

export const EmptyWithCollection: Story = {
  args: {
    products: [],
    collection: mockCollection,
  },
};

export const HorizontalScrolling: Story = {
  args: {
    products: createMockProducts(10),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Find scroll buttons
    const scrollRightButton = canvas.getByRole('button', { name: /scroll right/i });
    
    // Click to scroll right
    await userEvent.click(scrollRightButton);
    
    // Wait a bit for smooth scroll
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Click scroll left
    const scrollLeftButton = canvas.getByRole('button', { name: /scroll left/i });
    await userEvent.click(scrollLeftButton);
  },
};

export const GridLayout: Story = {
  args: {
    products: mockProducts.slice(0, 4),
  },
  decorators: [
    (Story) => (
      <div>
        <div className="mb-4 p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            Products are displayed in a horizontal scrollable layout
          </p>
        </div>
        <Story />
      </div>
    ),
  ],
};

export const ResponsiveBehavior: Story = {
  args: {
    products: createMockProducts(8),
    collection: mockCollection,
  },
  parameters: {
    viewport: {
      defaultViewport: 'responsive',
    },
  },
  decorators: [
    (Story) => (
      <div>
        <div className="mb-4 p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            Resize the viewport to see responsive behavior. Scroll buttons hide on mobile.
          </p>
        </div>
        <Story />
      </div>
    ),
  ],
};

export const MobileView: Story = {
  args: {
    products: createMockProducts(6),
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const TabletView: Story = {
  args: {
    products: createMockProducts(6),
    collection: mockCollection,
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};

export const LoadingState: Story = {
  args: {
    products: [],
  },
  decorators: [
    () => {
      const queryClient = createQueryClient();
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              <div className="container mx-auto">
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
                  <div className="flex gap-4 overflow-hidden">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex-none w-72">
                        <div className="bg-gray-200 rounded-lg h-80"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <Toaster position="top-right" />
            </BrowserRouter>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
};

export const CollectionLink: Story = {
  args: {
    products: mockProducts.slice(0, 4),
    collection: mockCollection,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Find the collection link
    const collectionLink = canvas.getByRole('link', { name: /view all summer collection/i });
    expect(collectionLink).toBeInTheDocument();
    expect(collectionLink).toHaveAttribute('href', '/collections/summer-collection');
  },
};

export const EmptyStateLink: Story = {
  args: {
    products: [],
    collection: mockCollection,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Find the browse collection link
    const browseLink = canvas.getByRole('link', { name: /browse summer collection/i });
    expect(browseLink).toBeInTheDocument();
    expect(browseLink).toHaveAttribute('href', '/collections/summer-collection');
  },
};

export const ScrollIndicators: Story = {
  args: {
    products: createMockProducts(8),
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  decorators: [
    (Story) => (
      <div>
        <div className="mb-4 p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            Scroll indicators appear on mobile devices
          </p>
        </div>
        <Story />
      </div>
    ),
  ],
};

export const ProductInteraction: Story = {
  args: {
    products: mockProducts.slice(0, 4),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Find first product card
    await waitFor(() => {
      const firstProduct = canvas.getByText('Product 1');
      expect(firstProduct).toBeInTheDocument();
    });
    
    // Click on product (should navigate in real app)
    const productLink = canvas.getAllByRole('link')[0];
    expect(productLink).toHaveAttribute('href', expect.stringContaining('/products/'));
  },
};

export const SmoothScrollAnimation: Story = {
  args: {
    products: createMockProducts(15),
    collection: mockCollection,
  },
  decorators: [
    (Story) => (
      <div>
        <div className="mb-4 p-4 bg-muted rounded-lg">
          <h3 className="font-semibold mb-2">Smooth Scroll Demo</h3>
          <p className="text-sm text-muted-foreground">
            Click the arrow buttons to see smooth horizontal scrolling
          </p>
        </div>
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Automated scrolling demo
    const scrollRight = canvas.getByRole('button', { name: /scroll right/i });
    
    // Scroll right multiple times
    for (let i = 0; i < 3; i++) {
      await userEvent.click(scrollRight);
      await new Promise(resolve => setTimeout(resolve, 600));
    }
    
    // Scroll back
    const scrollLeft = canvas.getByRole('button', { name: /scroll left/i });
    for (let i = 0; i < 3; i++) {
      await userEvent.click(scrollLeft);
      await new Promise(resolve => setTimeout(resolve, 600));
    }
  },
};

// Enhanced Loading State Stories
export const SkeletonLoading: Story = {
  decorators: [
    () => (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex-none w-72">
              <Card className="overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <div className="flex justify-between items-center pt-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-9 w-24" />
                  </div>
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>
    ),
  ],
  args: {
    products: [],
  },
  render: () => <div></div>,
};

export const ShimmerEffect: Story = {
  args: {
    products: [],
  },
  decorators: [
    () => (
      <BrowserRouter>
        <div className="container mx-auto">
          <div className="space-y-6">
            <div className="flex gap-4 overflow-hidden">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex-none w-72">
                  <div className="aspect-[4/3] bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer rounded-lg" />
                  <div className="mt-4 space-y-3">
                    <div className="h-6 w-3/4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer rounded" />
                    <div className="h-4 w-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer rounded" />
                    <div className="h-4 w-1/2 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <style>{`
            @keyframes shimmer {
              0% { background-position: -200% 0; }
              100% { background-position: 200% 0; }
            }
            .animate-shimmer {
              background-size: 200% 100%;
              animation: shimmer 1.5s infinite;
            }
          `}</style>
        </div>
      </BrowserRouter>
    ),
  ],
  render: () => <div></div>,
};

export const LazyLoadingProducts: Story = {
  args: {
    products: [],
  },
  render: () => {
    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState<Product[]>([]);
    
    useEffect(() => {
      const timer = setTimeout(() => {
        setProducts(createMockProducts(6));
        setLoading(false);
      }, 2000);
      
      return () => clearTimeout(timer);
    }, []);
    
    if (loading) {
      return (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-muted-foreground">Loading related products...</span>
            </div>
          </Card>
          
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex-none w-72">
                <Skeleton className="h-80 w-full rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    return <RelatedProducts products={products} collection={mockCollection} />;
  },
};

export const ProgressiveLoading: Story = {
  args: {
    products: [],
  },
  render: () => {
    const [loadedProducts, setLoadedProducts] = useState<Product[]>([]);
    const allProducts = createMockProducts(8);
    
    useEffect(() => {
      const loadProducts = async () => {
              for (const product of allProducts) {
        await new Promise(resolve => setTimeout(resolve, 300));
        setLoadedProducts(prev => [...prev, product]);
      }
      };
      
      loadProducts();
    }, [allProducts]);
    
    return (
      <div className="space-y-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium">Progressive Loading Demo</h4>
              <p className="text-xs text-muted-foreground">
                Products load one by one
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              <span className="text-sm">{loadedProducts.length}/{allProducts.length}</span>
            </div>
          </div>
        </Card>
        
        <RelatedProducts products={loadedProducts} />
      </div>
    );
  },
};

export const InfiniteScrollLoading: Story = {
  args: {
    products: [],
  },
  render: () => {
    const [products, setProducts] = useState(createMockProducts(4));
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    
    const loadMore = async () => {
      setLoading(true);
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const newProducts = createMockProducts(4).map((p, i) => ({
        ...p,
        _id: `prod${products.length + i + 1}`,
        name: `Product ${products.length + i + 1}`,
      }));
      
      setProducts(prev => [...prev, ...newProducts]);
      setLoading(false);
      
      if (products.length >= 12) {
        setHasMore(false);
      }
    };
    
    return (
      <div className="space-y-4">
        <RelatedProducts products={products} />
        
        {hasMore && (
          <div className="flex justify-center pt-4">
            <Button
              onClick={loadMore}
              disabled={loading}
              variant="outline"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading more...
                </>
              ) : (
                'Load More Products'
              )}
            </Button>
          </div>
        )}
        
        {!hasMore && (
          <div className="text-center text-sm text-muted-foreground py-4">
            No more products to load
          </div>
        )}
      </div>
    );
  },
};

export const RefreshableProducts: Story = {
  args: {
    products: [],
  },
  render: () => {
    const [loading, setLoading] = useState(false);
    const [products, setProducts] = useState(createMockProducts(4));
    const [lastRefreshed, setLastRefreshed] = useState(new Date());
    
    const refreshProducts = async () => {
      setLoading(true);
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate getting different products
      const newProducts = createMockProducts(4).map((p, i) => ({
        ...p,
        name: `Fresh Product ${i + 1}`,
        price: Math.floor(Math.random() * 150) + 50,
      }));
      
      setProducts(newProducts);
      setLastRefreshed(new Date());
      setLoading(false);
    };
    
    return (
      <div className="space-y-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium">Related Products</h4>
              <p className="text-xs text-muted-foreground">
                Last updated: {lastRefreshed.toLocaleTimeString()}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={refreshProducts}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Refresh
                </>
              )}
            </Button>
          </div>
        </Card>
        
        <div className={loading ? 'opacity-50 pointer-events-none' : ''}>
          <RelatedProducts products={products} />
        </div>
      </div>
    );
  },
};

export const PlaceholderWhileLoading: Story = {
  args: {
    products: [],
  },
  render: () => {
    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState<Product[]>([]);
    
    useEffect(() => {
      const timer = setTimeout(() => {
        setProducts(createMockProducts(6));
        setLoading(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }, []);
    
    return (
      <div>
        {loading ? (
          <div className="space-y-6">
            <div className="text-center py-12">
              <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Finding Related Products</h3>
              <p className="text-sm text-muted-foreground mb-4">
                We&apos;re searching for products you might like...
              </p>
              <Loader2 className="w-6 h-6 animate-spin mx-auto" />
            </div>
          </div>
        ) : (
          <RelatedProducts products={products} collection={mockCollection} />
        )}
      </div>
    );
  },
};

export const LoadingWithError: Story = {
  args: {
    products: [],
  },
  render: () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    
    useEffect(() => {
      const timer = setTimeout(() => {
        setLoading(false);
        setError(true);
      }, 2000);
      
      return () => clearTimeout(timer);
    }, []);
    
    const retry = () => {
      setLoading(true);
      setError(false);
      
      setTimeout(() => {
        setProducts(createMockProducts(4));
        setLoading(false);
      }, 1500);
    };
    
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      );
    }
    
    if (error) {
      return (
        <Card className="p-8">
          <div className="text-center">
            <div className="text-muted-foreground mb-4">
              <Package className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium mb-2">Unable to Load Products</h3>
            <p className="text-sm text-muted-foreground mb-4">
              We couldn&apos;t fetch related products at this time.
            </p>
            <Button onClick={retry}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        </Card>
      );
    }
    
    return <RelatedProducts products={products} />;
  },
};

export const PartialLoadingState: Story = {
  args: {
    products: [],
  },
  render: () => {
    const [initialProducts] = useState(createMockProducts(2));
    const [additionalProducts, setAdditionalProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
      const timer = setTimeout(() => {
        setAdditionalProducts(createMockProducts(4).map((p, i) => ({
          ...p,
          _id: `additional${i + 1}`,
        })));
        setLoading(false);
      }, 2000);
      
      return () => clearTimeout(timer);
    }, []);
    
    return (
      <div className="space-y-4">
        <Card className="p-4">
          <h4 className="text-sm font-medium mb-1">Partial Loading Demo</h4>
          <p className="text-xs text-muted-foreground">
            Showing {initialProducts.length} products, loading {loading ? '...' : additionalProducts.length} more
          </p>
        </Card>
        
        <div className="relative">
          <RelatedProducts products={[...initialProducts, ...additionalProducts]} />
          
          {loading && (
            <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
              <Card className="p-4">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Loading more products...</span>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    );
  },
};