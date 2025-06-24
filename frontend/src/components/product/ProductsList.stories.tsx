import type { Meta, StoryObj } from '@storybook/react-vite';
import ProductsList from './ProductsList';
import type { ProductsListProps } from '@/types';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { trpc } from '@/lib/trpc';
import { createTRPCClient } from '@/lib/trpc-client';
import { fn } from '@storybook/test';
import { within, userEvent, expect, waitFor } from '@storybook/test';
import type { RouterOutputs } from '@/lib/trpc';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Grid2X2, List, ChevronLeft, ChevronRight, Cloud, CloudOff, AlertTriangle } from 'lucide-react';
import { BrowserRouter } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Toaster, toast } from 'sonner';

type Product = RouterOutputs['product']['list']['products'][0];

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: Infinity },
  },
});

const mockCollection = {
  _id: 'col1',
  name: 'Summer Collection',
  slug: 'summer-collection',
  description: 'Summer styles',
  isPublic: true,
  products: [],
  owner: {
    _id: 'user1',
    name: 'John Doe',
    email: 'john@example.com',
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const createMockProducts = (count: number): Product[] => {
  return Array.from({ length: count }, (_, i) => ({
    _id: `prod${i + 1}`,
    name: `Product ${i + 1}`,
    description: `Description for product ${i + 1}`,
    price: Math.floor(Math.random() * 100) + 10,
    image: `https://images.unsplash.com/photo-${1542291026 + i}-7eec264c27ff?w=500`,
    collectionId: i % 3 === 0 ? mockCollection._id : undefined,
    isFeatured: i % 4 === 0,
    slug: `product-${i + 1}`,
    variants: i % 5 === 0 ? [
      {
        variantId: `var${i}-1`,
        label: 'Small',
        price: Math.floor(Math.random() * 100) + 10,
        inventory: 10,
        images: [],
        sku: `SKU-${i}-S`,
      },
      {
        variantId: `var${i}-2`,
        label: 'Large',
        price: Math.floor(Math.random() * 100) + 20,
        inventory: 5,
        images: [],
        sku: `SKU-${i}-L`,
      },
    ] : [],
    mediaGallery: [],
    createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
  }));
};

const mockProducts = createMockProducts(10);
const mockFeaturedProducts = mockProducts.filter(p => p.isFeatured);

const meta: Meta<ProductsListProps> = {
  title: 'Product/ProductsList',
  component: ProductsList,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <div className="p-6 bg-background min-h-screen">
            <Story />
          </div>
        </QueryClientProvider>
      </trpc.Provider>
    ),
  ],
  args: {
    onEditProduct: fn(),
    onHighlightComplete: fn(),
  },
};

export default meta;
type Story = StoryObj<ProductsListProps>;

export const Default: Story = {
  args: {
    onEditProduct: fn(),
    onHighlightComplete: fn(),
  },
  decorators: [
    (Story) => {
      const mockQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: Infinity,
            retry: false,
          },
        },
      });
      
      mockQueryClient.setQueryData(['product.list', undefined], {
        products: mockProducts,
        pagination: {
          page: 1,
          pages: 1,
          total: mockProducts.length,
          limit: 20,
        },
      });
      
      mockQueryClient.setQueryData(['product.featured'], mockFeaturedProducts);
      
      // Mock inventory data for each product
      mockProducts.forEach(product => {
        mockQueryClient.setQueryData(['inventory.product', product._id], {
          productId: product._id,
          availableStock: Math.floor(Math.random() * 50),
          lowStockThreshold: 5,
          allowBackorder: false,
        });
      });
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={mockQueryClient}>
          <QueryClientProvider client={mockQueryClient}>
            <div className="p-6 bg-background min-h-screen">
              <Story />
            </div>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
};

export const EmptyState: Story = {
  args: {
    onEditProduct: fn(),
    onHighlightComplete: fn(),
  },
  decorators: [
    () => {
      const mockQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: Infinity,
            retry: false,
          },
        },
      });
      
      mockQueryClient.setQueryData(['product.list', undefined], {
        products: [],
        pagination: {
          page: 1,
          pages: 1,
          total: 0,
          limit: 20,
        },
      });
      
      mockQueryClient.setQueryData(['product.featured'], []);
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={mockQueryClient}>
          <QueryClientProvider client={mockQueryClient}>
            <div className="p-6 bg-background min-h-screen">
              <div className="bg-card shadow-lg rounded-lg overflow-hidden max-w-4xl mx-auto">
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Grid2X2 className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No Products Yet</h3>
                  <p className="text-muted-foreground mb-4">Start by creating your first product</p>
                  <Button>Create Product</Button>
                </div>
              </div>
            </div>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
};

export const WithHighlightedProduct: Story = {
  args: {
    ...meta.args,
    highlightProductId: 'prod3',
  },
  decorators: [
    (Story) => {
      const mockQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: Infinity,
            retry: false,
          },
        },
      });
      
      mockQueryClient.setQueryData(['product.list', undefined], {
        products: mockProducts,
        pagination: {
          page: 1,
          pages: 1,
          total: mockProducts.length,
          limit: 20,
        },
      });
      
      mockQueryClient.setQueryData(['product.featured'], mockFeaturedProducts);
      
      mockProducts.forEach(product => {
        mockQueryClient.setQueryData(['inventory.product', product._id], {
          productId: product._id,
          availableStock: Math.floor(Math.random() * 50),
          lowStockThreshold: 5,
          allowBackorder: false,
        });
      });
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={mockQueryClient}>
          <QueryClientProvider client={mockQueryClient}>
            <div className="p-6 bg-background min-h-screen">
              <Story />
            </div>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
};

export const LoadingState: Story = {
  args: {
    onEditProduct: fn(),
    onHighlightComplete: fn(),
  },
  decorators: [
    (Story) => (
      <QueryClientProvider client={new QueryClient()}>
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <div className="p-6 bg-background min-h-screen">
            <Story />
          </div>
        </trpc.Provider>
      </QueryClientProvider>
    ),
  ],
};

export const LowStockProducts: Story = {
  args: {
    onEditProduct: fn(),
    onHighlightComplete: fn(),
  },
  decorators: [
    (Story) => {
      const mockQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: Infinity,
            retry: false,
          },
        },
      });
      
      const lowStockProducts = createMockProducts(5).map(p => ({
        ...p,
        lowStockThreshold: 10,
        allowBackorder: false,
      }));
      
      mockQueryClient.setQueryData(['product.list', undefined], {
        products: lowStockProducts,
        pagination: {
          page: 1,
          pages: 1,
          total: lowStockProducts.length,
          limit: 20,
        },
      });
      
      mockQueryClient.setQueryData(['product.featured'], []);
      
      // Set low stock for all products
      lowStockProducts.forEach(product => {
        mockQueryClient.setQueryData(['inventory.product', product._id], {
          productId: product._id,
          availableStock: 3, // Below threshold
          lowStockThreshold: 5,
          allowBackorder: false,
        });
      });
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={mockQueryClient}>
          <QueryClientProvider client={mockQueryClient}>
            <div className="p-6 bg-background min-h-screen">
              <Story />
            </div>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
};

export const OutOfStockProducts: Story = {
  args: {
    onEditProduct: fn(),
    onHighlightComplete: fn(),
  },
  decorators: [
    (Story) => {
      const mockQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: Infinity,
            retry: false,
          },
        },
      });
      
      const outOfStockProducts = createMockProducts(5);
      
      mockQueryClient.setQueryData(['product.list', undefined], {
        products: outOfStockProducts,
        pagination: {
          page: 1,
          pages: 1,
          total: outOfStockProducts.length,
          limit: 20,
        },
      });
      
      mockQueryClient.setQueryData(['product.featured'], []);
      
      // Set zero stock for all products
      outOfStockProducts.forEach(product => {
        mockQueryClient.setQueryData(['inventory.product', product._id], {
          productId: product._id,
          availableStock: 0,
          lowStockThreshold: 5,
          allowBackorder: false,
        });
      });
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={mockQueryClient}>
          <QueryClientProvider client={mockQueryClient}>
            <div className="p-6 bg-background min-h-screen">
              <Story />
            </div>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
};

export const ToggleFeaturedInteraction: Story = {
  args: {
    onEditProduct: fn(),
    onHighlightComplete: fn(),
  },
  decorators: [
    (Story) => {
      const mockQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: Infinity,
            retry: false,
          },
        },
      });
      
      mockQueryClient.setQueryData(['product.list', undefined], {
        products: mockProducts.slice(0, 3),
        pagination: {
          page: 1,
          pages: 1,
          total: 3,
          limit: 20,
        },
      });
      
      mockQueryClient.setQueryData(['product.featured'], []);
      
      mockProducts.slice(0, 3).forEach(product => {
        mockQueryClient.setQueryData(['inventory.product', product._id], {
          productId: product._id,
          availableStock: 20,
          lowStockThreshold: 5,
          allowBackorder: false,
        });
      });
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={mockQueryClient}>
          <QueryClientProvider client={mockQueryClient}>
            <div className="p-6 bg-background min-h-screen">
              <Story />
            </div>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    await waitFor(() => {
      expect(canvas.getByText('Product 1')).toBeInTheDocument();
    });
    
    // Find the first toggle button
    const toggleButtons = canvas.getAllByTestId('toggle-feature');
    const firstToggle = toggleButtons[0];
    
    await userEvent.click(firstToggle);
    
    // The star should now be filled (featured)
    await waitFor(() => {
      const star = firstToggle.querySelector('svg');
      expect(star).toHaveClass('fill-current');
    });
  },
};

export const EditProductInteraction: Story = {
  args: {
    onEditProduct: fn(),
  },
  decorators: [
    (Story) => {
      const mockQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: Infinity,
            retry: false,
          },
        },
      });
      
      mockQueryClient.setQueryData(['product.list', undefined], {
        products: mockProducts.slice(0, 3),
        pagination: {
          page: 1,
          pages: 1,
          total: 3,
          limit: 20,
        },
      });
      
      mockQueryClient.setQueryData(['product.featured'], []);
      
      mockProducts.slice(0, 3).forEach(product => {
        mockQueryClient.setQueryData(['inventory.product', product._id], {
          productId: product._id,
          availableStock: 20,
          lowStockThreshold: 5,
          allowBackorder: false,
        });
      });
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={mockQueryClient}>
          <QueryClientProvider client={mockQueryClient}>
            <div className="p-6 bg-background min-h-screen">
              <Story />
            </div>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    
    await waitFor(() => {
      expect(canvas.getByText('Product 1')).toBeInTheDocument();
    });
    
    // Click on the product row
    const productRow = canvas.getByText('Product 1').closest('tr');
    if (productRow) {
      await userEvent.click(productRow);
    }
    
    // Check that onEditProduct was called
    await waitFor(() => {
      expect(args.onEditProduct).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Product 1',
        }),
      );
    });
  },
};

// Network Error Scenarios for ProductsList
export const OfflineProductsLoad: Story = {
  args: {
    onEditProduct: fn(),
    onHighlightComplete: fn(),
  },
  decorators: [
    (Story) => {
      const mockQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: Infinity,
            retry: false,
          },
        },
      });
      
      const [isOnline, setIsOnline] = useState(navigator.onLine);
      const [cacheProducts, _setCacheProducts] = useState(mockProducts.slice(0, 3));
      const [syncQueue, setSyncQueue] = useState<string[]>([]);
      
      const simulateOffline = () => {
        setIsOnline(false);
        mockQueryClient.setQueryData(['product.list', undefined], {
          products: cacheProducts,
          pagination: {
            page: 1,
            pages: 1,
            total: cacheProducts.length,
            limit: 20,
          },
          _cached: true,
          _lastSync: new Date(Date.now() - 300000),
        });
        toast.info('Offline mode - showing cached products');
      };
      
      const simulateOnline = () => {
        setIsOnline(true);
        if (syncQueue.length > 0) {
          toast.success(`Reconnected - syncing ${syncQueue.length} changes`);
          setTimeout(() => {
            setSyncQueue([]);
            toast.success('All changes synced successfully');
          }, 2000);
        } else {
          toast.success('Connection restored');
        }
        
        mockQueryClient.setQueryData(['product.list', undefined], {
          products: mockProducts.slice(0, 8),
          pagination: {
            page: 1,
            pages: 1,
            total: 8,
            limit: 20,
          },
        });
      };
      
      const queueChange = (action: string) => {
        setSyncQueue(prev => [...prev, action]);
        toast.info(`Queued: ${action}`);
      };
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={mockQueryClient}>
          <QueryClientProvider client={mockQueryClient}>
            <BrowserRouter>
              <div className="space-y-4">
                <Card className={`p-4 ${
                  isOnline ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isOnline ? (
                        <><Cloud className="w-4 h-4 text-green-600" />
                        <span className="font-medium">Online</span></>
                      ) : (
                        <><CloudOff className="w-4 h-4 text-orange-600" />
                        <span className="font-medium">Offline Mode</span></>
                      )}
                      {syncQueue.length > 0 && (
                        <Badge variant="secondary">{syncQueue.length} queued</Badge>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={simulateOffline} disabled={!isOnline}>
                        Go Offline
                      </Button>
                      <Button size="sm" onClick={simulateOnline} disabled={isOnline}>
                        Reconnect
                      </Button>
                      {!isOnline && (
                        <Button size="sm" variant="outline" onClick={() => queueChange('Product Edit')}>
                          Queue Change
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {!isOnline && (
                    <Alert className="mt-3">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Showing cached data from 5 minutes ago. Changes will be queued until connection is restored.
                      </AlertDescription>
                    </Alert>
                  )}
                </Card>
                
                <Story />
              </div>
              <Toaster position="top-right" />
            </BrowserRouter>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
};

export const MobileView: Story = {
  args: {
    onEditProduct: fn(),
    onHighlightComplete: fn(),
  },
  decorators: [
    (Story) => {
      const mockQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: Infinity,
            retry: false,
          },
        },
      });
      
      mockQueryClient.setQueryData(['product.list', undefined], {
        products: mockProducts.slice(0, 5),
        pagination: {
          page: 1,
          pages: 1,
          total: 5,
          limit: 20,
        },
      });
      
      mockQueryClient.setQueryData(['product.featured'], mockProducts.slice(0, 2));
      
      mockProducts.slice(0, 5).forEach(product => {
        mockQueryClient.setQueryData(['inventory.product', product._id], {
          productId: product._id,
          availableStock: Math.floor(Math.random() * 50),
          lowStockThreshold: 5,
          allowBackorder: false,
        });
      });
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={mockQueryClient}>
          <QueryClientProvider client={mockQueryClient}>
            <div className="p-6 bg-background min-h-screen">
              <Story />
            </div>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const TabletView: Story = {
  args: {
    onEditProduct: fn(),
    onHighlightComplete: fn(),
  },
  decorators: [
    (Story) => {
      const mockQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: Infinity,
            retry: false,
          },
        },
      });
      
      mockQueryClient.setQueryData(['product.list', undefined], {
        products: mockProducts,
        pagination: {
          page: 1,
          pages: 1,
          total: mockProducts.length,
          limit: 20,
        },
      });
      
      mockQueryClient.setQueryData(['product.featured'], mockFeaturedProducts);
      
      mockProducts.forEach(product => {
        mockQueryClient.setQueryData(['inventory.product', product._id], {
          productId: product._id,
          availableStock: Math.floor(Math.random() * 50),
          lowStockThreshold: 5,
          allowBackorder: false,
        });
      });
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={mockQueryClient}>
          <QueryClientProvider client={mockQueryClient}>
            <div className="p-6 bg-background min-h-screen">
              <Story />
            </div>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};

// Enhanced ProductsList component with view toggle and sorting
const EnhancedProductsList = (props: ProductsListProps) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'date'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  
  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-wrap gap-4 items-center justify-between bg-card p-4 rounded-lg shadow">
        {/* View Toggle */}
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
            data-testid="view-grid"
          >
            <Grid2X2 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
            data-testid="view-list"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Sort Controls */}
        <div className="flex gap-2 items-center">
          <span className="text-sm text-muted-foreground">Sort by:</span>
          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'price' | 'date')}
            options={[
              { value: 'name', label: 'Name' },
              { value: 'price', label: 'Price' },
              { value: 'date', label: 'Date Added' },
            ]}
            className="w-[140px]"
            data-testid="sort-select"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            data-testid="sort-order"
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </Button>
        </div>
      </div>
      
      {/* Products Display */}
      {viewMode === 'list' ? (
        <ProductsList {...props} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <div className="col-span-full text-center text-muted-foreground p-8">
            Grid view would display products as cards here
          </div>
        </div>
      )}
      
      {/* Pagination */}
      <div className="flex justify-center items-center gap-4 mt-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          data-testid="pagination-prev"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <span className="text-sm text-muted-foreground">
          Page {currentPage} of 3
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage(currentPage + 1)}
          disabled={currentPage === 3}
          data-testid="pagination-next"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export const GridListViewToggle: Story = {
  args: {
    onEditProduct: fn(),
    onHighlightComplete: fn(),
  },
  decorators: [
    (_, { args }) => {
      const mockQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: Infinity,
            retry: false,
          },
        },
      });
      
      mockQueryClient.setQueryData(['product.list', undefined], {
        products: mockProducts.slice(0, 8),
        pagination: {
          page: 1,
          pages: 3,
          total: 24,
          limit: 8,
        },
      });
      
      mockQueryClient.setQueryData(['product.featured'], mockFeaturedProducts);
      
      mockProducts.slice(0, 8).forEach(product => {
        mockQueryClient.setQueryData(['inventory.product', product._id], {
          productId: product._id,
          availableStock: Math.floor(Math.random() * 50),
          lowStockThreshold: 5,
          allowBackorder: false,
        });
      });
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={mockQueryClient}>
          <QueryClientProvider client={mockQueryClient}>
            <div className="p-6 bg-background min-h-screen">
              <EnhancedProductsList {...args} />
            </div>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Wait for initial render
    await waitFor(() => {
      expect(canvas.getByTestId('view-list')).toBeInTheDocument();
    });
    
    // Test view toggle
    const gridButton = canvas.getByTestId('view-grid');
    await userEvent.click(gridButton);
    
    // Should show grid placeholder
    await waitFor(() => {
      expect(canvas.getByText(/Grid view would display products as cards here/i)).toBeInTheDocument();
    });
    
    // Switch back to list
    const listButton = canvas.getByTestId('view-list');
    await userEvent.click(listButton);
    
    // Should show table
    await waitFor(() => {
      expect(canvas.getByText('Product 1')).toBeInTheDocument();
    });
  },
};

export const SortingFunctionality: Story = {
  args: {
    onEditProduct: fn(),
    onHighlightComplete: fn(),
  },
  decorators: [
    (_, { args }) => {
      const mockQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: Infinity,
            retry: false,
          },
        },
      });
      
      // Create products with different prices and dates for sorting
      const sortableProducts = [
        { ...mockProducts[0], name: 'Alpha Product', price: 99.99 },
        { ...mockProducts[1], name: 'Beta Product', price: 19.99 },
        { ...mockProducts[2], name: 'Gamma Product', price: 149.99 },
        { ...mockProducts[3], name: 'Delta Product', price: 49.99 },
      ];
      
      mockQueryClient.setQueryData(['product.list', undefined], {
        products: sortableProducts,
        pagination: {
          page: 1,
          pages: 1,
          total: sortableProducts.length,
          limit: 20,
        },
      });
      
      mockQueryClient.setQueryData(['product.featured'], []);
      
      sortableProducts.forEach(product => {
        mockQueryClient.setQueryData(['inventory.product', product._id], {
          productId: product._id,
          availableStock: 10,
          lowStockThreshold: 5,
          allowBackorder: false,
        });
      });
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={mockQueryClient}>
          <QueryClientProvider client={mockQueryClient}>
            <div className="p-6 bg-background min-h-screen">
              <EnhancedProductsList {...args} />
            </div>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Wait for products to load
    await waitFor(() => {
      expect(canvas.getByText('Alpha Product')).toBeInTheDocument();
    });
    
    // Change sort option
    const sortSelect = canvas.getByTestId('sort-select');
    await userEvent.selectOptions(sortSelect, 'price');
    
    // Toggle sort order
    const sortOrderButton = canvas.getByTestId('sort-order');
    await userEvent.click(sortOrderButton);
    
    // Verify sort order changed
    expect(sortOrderButton).toHaveTextContent('↓');
  },
};

export const PaginationControls: Story = {
  args: {
    onEditProduct: fn(),
    onHighlightComplete: fn(),
  },
  decorators: [
    (_, { args }) => {
      const mockQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: Infinity,
            retry: false,
          },
        },
      });
      
      // Create 24 products for pagination
      const paginatedProducts = createMockProducts(24);
      
      mockQueryClient.setQueryData(['product.list', undefined], {
        products: paginatedProducts.slice(0, 8),
        pagination: {
          page: 1,
          pages: 3,
          total: 24,
          limit: 8,
        },
      });
      
      mockQueryClient.setQueryData(['product.featured'], []);
      
      paginatedProducts.slice(0, 8).forEach(product => {
        mockQueryClient.setQueryData(['inventory.product', product._id], {
          productId: product._id,
          availableStock: 20,
          lowStockThreshold: 5,
          allowBackorder: false,
        });
      });
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={mockQueryClient}>
          <QueryClientProvider client={mockQueryClient}>
            <div className="p-6 bg-background min-h-screen">
              <EnhancedProductsList {...args} />
            </div>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Wait for pagination controls
    await waitFor(() => {
      expect(canvas.getByTestId('pagination-next')).toBeInTheDocument();
    });
    
    // Check initial state
    expect(canvas.getByText('Page 1 of 3')).toBeInTheDocument();
    expect(canvas.getByTestId('pagination-prev')).toBeDisabled();
    
    // Navigate to next page
    const nextButton = canvas.getByTestId('pagination-next');
    await userEvent.click(nextButton);
    
    // Check page 2 state
    await waitFor(() => {
      expect(canvas.getByText('Page 2 of 3')).toBeInTheDocument();
    });
    expect(canvas.getByTestId('pagination-prev')).not.toBeDisabled();
    
    // Navigate to page 3
    await userEvent.click(nextButton);
    
    // Check page 3 state
    await waitFor(() => {
      expect(canvas.getByText('Page 3 of 3')).toBeInTheDocument();
    });
    expect(canvas.getByTestId('pagination-next')).toBeDisabled();
  },
};

export const LoadingStatePagination: Story = {
  args: {
    onEditProduct: fn(),
    onHighlightComplete: fn(),
  },
  decorators: [
    (Story) => {
      const mockQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 0,
            retry: false,
          },
        },
      });
      
      // Set loading state - simulate by not setting any data
      // This will trigger the loading state in the component
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={mockQueryClient}>
          <QueryClientProvider client={mockQueryClient}>
            <div className="p-6 bg-background min-h-screen">
              <Story />
            </div>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
};

export const ErrorState: Story = {
  args: {
    onEditProduct: fn(),
    onHighlightComplete: fn(),
  },
  decorators: [
    () => {
      const mockQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: Infinity,
            retry: false,
          },
        },
      });
      
      // Simulate error state by setting null data
      mockQueryClient.setQueryData(['product.list', undefined], null);
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={mockQueryClient}>
          <QueryClientProvider client={mockQueryClient}>
            <div className="p-6 bg-background min-h-screen">
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-center">
                <p className="text-destructive">Error: Failed to fetch products</p>
                <Button variant="outline" size="sm" className="mt-2">
                  Retry
                </Button>
              </div>
            </div>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
};

export const WithMultipleVariants: Story = {
  args: {
    onEditProduct: fn(),
    onHighlightComplete: fn(),
  },
  decorators: [
    (Story) => {
      const mockQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: Infinity,
            retry: false,
          },
        },
      });
      
      const variantProducts = createMockProducts(5).map((p, i) => ({
        ...p,
        variants: [
          {
            variantId: `var${i}-1`,
            label: 'Small / Red',
            price: p.price,
            inventory: 10,
            images: [],
            sku: `SKU-${i}-SR`,
          },
          {
            variantId: `var${i}-2`,
            label: 'Medium / Blue',
            price: p.price + 5,
            inventory: 15,
            images: [],
            sku: `SKU-${i}-MB`,
          },
          {
            variantId: `var${i}-3`,
            label: 'Large / Green',
            price: p.price + 10,
            inventory: 5,
            images: [],
            sku: `SKU-${i}-LG`,
          },
        ],
      }));
      
      mockQueryClient.setQueryData(['product.list', undefined], {
        products: variantProducts,
        pagination: {
          page: 1,
          pages: 1,
          total: variantProducts.length,
          limit: 20,
        },
      });
      
      mockQueryClient.setQueryData(['product.featured'], []);
      
      variantProducts.forEach(product => {
        mockQueryClient.setQueryData(['inventory.product', product._id], {
          productId: product._id,
          availableStock: 30, // Sum of variant inventories
          lowStockThreshold: 5,
          allowBackorder: false,
        });
      });
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={mockQueryClient}>
          <QueryClientProvider client={mockQueryClient}>
            <div className="p-6 bg-background min-h-screen">
              <Story />
            </div>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
};

export const DeleteProductInteraction: Story = {
  args: {
    onEditProduct: fn(),
    onHighlightComplete: fn(),
  },
  decorators: [
    (Story) => {
      const mockQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: Infinity,
            retry: false,
          },
        },
      });
      
      mockQueryClient.setQueryData(['product.list', undefined], {
        products: mockProducts.slice(0, 3),
        pagination: {
          page: 1,
          pages: 1,
          total: 3,
          limit: 20,
        },
      });
      
      mockQueryClient.setQueryData(['product.featured'], []);
      
      mockProducts.slice(0, 3).forEach(product => {
        mockQueryClient.setQueryData(['inventory.product', product._id], {
          productId: product._id,
          availableStock: 20,
          lowStockThreshold: 5,
          allowBackorder: false,
        });
      });
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={mockQueryClient}>
          <QueryClientProvider client={mockQueryClient}>
            <div className="p-6 bg-background min-h-screen">
              <Story />
            </div>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    await waitFor(() => {
      expect(canvas.getByText('Product 1')).toBeInTheDocument();
    });
    
    // Mock window.confirm
    const originalConfirm = window.confirm;
    window.confirm = () => true;
    
    // Find and click the first delete button
    const deleteButtons = canvas.getAllByRole('button');
    const deleteButton = deleteButtons.find(btn => {
      const svg = btn.querySelector('svg');
      return svg && btn.className.includes('text-destructive');
    });
    
    if (deleteButton) {
      await userEvent.click(deleteButton);
    }
    
    // Restore original confirm
    window.confirm = originalConfirm;
  },
};