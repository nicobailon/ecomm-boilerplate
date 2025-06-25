import type { Meta, StoryObj } from '@storybook/react-vite';
import ProductCard from './ProductCard';
import { mockProducts } from '@/test/mocks/products';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import type { Product } from '@/types';
import { trpc } from '@/lib/trpc';
import { createTRPCClient } from '@/lib/trpc-client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react';
import { within, userEvent, expect, waitFor } from '@storybook/test';
import { Alert, AlertDescription } from '@/components/ui/Alert';

const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

// Helper to convert mock product to Product type
const toProduct = (mockProduct: typeof mockProducts[0], overrides?: Partial<Product>): Product => {
  return {
    ...mockProduct,
    _id: mockProduct.id,
    image: mockProduct.imageUrl,
    isFeatured: mockProduct.featured,
    createdAt: mockProduct.createdAt.toISOString(),
    updatedAt: mockProduct.updatedAt.toISOString(),
    ...overrides,
  };
};

const meta = {
  title: 'Product/ProductCard',
  component: ProductCard,
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
              <div className="max-w-sm">
                <Story />
              </div>
            </BrowserRouter>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
} satisfies Meta<typeof ProductCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    product: toProduct(mockProducts[0], { _id: '1' }),
  },
};

export const Featured: Story = {
  args: {
    product: toProduct(mockProducts[0], { _id: '2', isFeatured: true }),
  },
};

export const OutOfStock: Story = {
  args: {
    product: toProduct(mockProducts[2], { _id: '3' }),
  },
};

export const OnSale: Story = {
  args: {
    product: toProduct(mockProducts[1], { _id: '4', price: 29.99 }),
  },
};

export const ProductGrid: Story = {
  args: {
    product: {
      _id: '1',
      name: 'Example Product',
      description: 'Description',
      price: 0,
      image: '',
      isFeatured: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  },
  render: () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {mockProducts.map((product, index) => (
        <ProductCard
          key={product.id}
          product={toProduct(product, { isFeatured: index === 0 })}
        />
      ))}
    </div>
  ),
};

export const ResponsiveGrid: Story = {
  args: {
    product: {
      _id: '1',
      name: 'Example Product',
      description: 'Description',
      price: 0,
      image: '',
      isFeatured: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  },
  render: () => (
    <div className="w-full">
      <h3 className="mb-4 text-lg font-semibold">Responsive Product Grid</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...mockProducts, ...mockProducts].slice(0, 8).map((product, index) => (
          <ProductCard
            key={`${product.id}-${index}`}
            product={toProduct(product, { _id: `${product.id}-${index}` })}
          />
        ))}
      </div>
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
    viewport: {
      defaultViewport: 'responsive',
    },
  },
};

export const LoadingState: Story = {
  args: {
    product: toProduct(mockProducts[0], { _id: '5' }),
  },
  parameters: {
    // Simulate loading state
    msw: {
      handlers: [
        // Mock API handlers can be added here
      ],
    },
  },
};

export const WithLongProductName: Story = {
  args: {
    product: toProduct(mockProducts[0], {
      _id: '6',
      name: 'Premium Wireless Noise-Cancelling Over-Ear Headphones with Extended Battery Life and Superior Sound Quality',
    }),
  },
};

export const AllStates: Story = {
  args: {
    product: {
      _id: '1',
      name: 'Example Product',
      description: 'Description',
      price: 0,
      image: '',
      isFeatured: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  },
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="mb-4 text-lg font-semibold">Product States</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <p className="mb-2 text-sm font-medium text-muted-foreground">Normal</p>
            <ProductCard
              product={toProduct(mockProducts[0], { _id: 'state-1', isFeatured: false })}
            />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-muted-foreground">Featured</p>
            <ProductCard
              product={toProduct(mockProducts[0], { _id: 'state-2', isFeatured: true })}
            />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-muted-foreground">On Sale</p>
            <ProductCard
              product={toProduct(mockProducts[0], { _id: 'state-3', isFeatured: false, price: 299.99 })}
            />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-muted-foreground">Out of Stock</p>
            <ProductCard
              product={toProduct(mockProducts[2], { _id: 'state-4', isFeatured: false })}
            />
          </div>
        </div>
      </div>
    </div>
  ),
};

// Real-time inventory component wrapper
const ProductCardWithRealtimeInventory = ({ product }: { product: Product }) => {
  const [inventory, setInventory] = useState(50);
  const [isConnected, setIsConnected] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  
  useEffect(() => {
    // Simulate real-time inventory updates
    const interval = setInterval(() => {
      if (isConnected && Math.random() > 0.7) {
        setInventory(prev => {
          const change = Math.floor(Math.random() * 5) - 2; // -2 to +2
          return Math.max(0, prev + change);
        });
        setLastUpdate(new Date());
      }
    }, 3000);
    
    return () => clearInterval(interval);
  }, [isConnected]);
  
  const productWithInventory = {
    ...product,
    stock: inventory,
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
        <div className="flex items-center gap-2">
          {isConnected ? (
            <>
              <Wifi className="w-4 h-4 text-green-500" />
              <span className="text-sm">Connected</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 text-red-500" />
              <span className="text-sm">Disconnected</span>
            </>
          )}
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsConnected(!isConnected)}
        >
          Toggle Connection
        </Button>
      </div>
      
      <ProductCard product={productWithInventory} />
      
      <div className="p-3 bg-muted rounded-lg space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Current Stock:</span>
          <Badge variant={inventory > 10 ? 'default' : inventory > 0 ? 'secondary' : 'destructive'}>
            {inventory} units
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
};

export const WithRealtimeInventory: Story = {
  args: {
    product: toProduct(mockProducts[0], { _id: 'realtime-1' }),
  },
  decorators: [
    (_, context) => (
      <div className="max-w-sm">
        <ProductCardWithRealtimeInventory product={context.args.product} />
      </div>
    ),
  ],
};

// Network error simulation
const ProductCardWithNetworkError = ({ product }: { product: Product }) => {
  const [hasError, setHasError] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  
  const simulateError = () => {
    setHasError(true);
  };
  
  const retry = async () => {
    setIsRetrying(true);
    // Simulate network request
    await new Promise(resolve => setTimeout(resolve, 2000));
    setHasError(false);
    setIsRetrying(false);
  };
  
  if (hasError) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-destructive" />
          <div>
            <h3 className="font-semibold">Network Error</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Failed to load product information
            </p>
          </div>
          <Button
            onClick={() => { void retry(); }}
            disabled={isRetrying}
            size="sm"
          >
            {isRetrying ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Retrying...
              </>
            ) : (
              'Retry'
            )}
          </Button>
        </div>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      <Button
        variant="destructive"
        onClick={simulateError}
        className="w-full"
      >
        Simulate Network Error
      </Button>
      <ProductCard product={product} />
    </div>
  );
};

export const WithNetworkError: Story = {
  args: {
    product: toProduct(mockProducts[0], { _id: 'error-1' }),
  },
  decorators: [
    (_, context) => (
      <div className="max-w-sm">
        <ProductCardWithNetworkError product={context.args.product} />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Click simulate error button
    const errorButton = canvas.getByRole('button', { name: /simulate network error/i });
    await userEvent.click(errorButton);
    
    // Should show error state
    await expect(canvas.getByText('Network Error')).toBeInTheDocument();
    await expect(canvas.getByText('Failed to load product information')).toBeInTheDocument();
    
    // Click retry
    const retryButton = canvas.getByRole('button', { name: /retry/i });
    await userEvent.click(retryButton);
    
    // Should show retrying state
    await expect(canvas.getByText('Retrying...')).toBeInTheDocument();
  },
};

// Loading error with retry
const ProductCardWithLoadingError = ({ product }: { product: Product }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        // Simulate 50% chance of error
        if (Math.random() > 0.5 || retryCount > 0) {
          setIsLoading(false);
          setHasError(false);
        } else {
          setIsLoading(false);
          setHasError(true);
        }
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [isLoading, retryCount]);
  
  const retry = () => {
    setRetryCount(prev => prev + 1);
    setIsLoading(true);
    setHasError(false);
  };
  
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <div className="animate-pulse">
            <div className="aspect-square bg-gray-200 rounded-lg mb-4" />
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      </Card>
    );
  }
  
  if (hasError) {
    return (
      <Card className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p>Failed to load product</p>
              <Button
                size="sm"
                variant="outline"
                onClick={retry}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try again
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
        <span className="text-sm">Loaded successfully</span>
        {retryCount > 0 && (
          <Badge variant="secondary">Retry #{retryCount}</Badge>
        )}
      </div>
      <ProductCard product={product} />
    </div>
  );
};

export const WithLoadingError: Story = {
  args: {
    product: toProduct(mockProducts[0], { _id: 'loading-error-1' }),
  },
  decorators: [
    (_, context) => (
      <div className="max-w-sm">
        <Alert className="mb-4">
          <AlertDescription>
            This demo has a 50% chance of error on first load. Retry always succeeds.
          </AlertDescription>
        </Alert>
        <ProductCardWithLoadingError product={context.args.product} />
      </div>
    ),
  ],
};

// Accessibility showcase
export const Accessibility: Story = {
  args: {
    product: toProduct(mockProducts[0], { _id: 'a11y-1' }),
  },
  decorators: [
    (_, context) => (
      <div className="space-y-8">
        <div>
          <h3 className="text-lg font-semibold mb-4">Accessibility Features</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">Keyboard Navigation</h4>
              <p className="text-sm text-muted-foreground mb-4">
                All interactive elements are keyboard accessible. Try tabbing through the card.
              </p>
              <ProductCard product={context.args.product} />
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Screen Reader Support</h4>
              <div className="space-y-3">
                <Card className="p-4">
                  <p className="text-sm font-mono">aria-label=&quot;Product: {context.args.product.name}&quot;</p>
                </Card>
                <Card className="p-4">
                  <p className="text-sm font-mono">role=&quot;article&quot;</p>
                </Card>
                <Card className="p-4">
                  <p className="text-sm font-mono">Price announced as &quot;${context.args.product.price}&quot;</p>
                </Card>
              </div>
            </div>
          </div>
        </div>
        
        <div>
          <h4 className="font-medium mb-2">High Contrast Mode</h4>
          <div className="p-6 bg-black text-white rounded-lg">
            <style dangerouslySetInnerHTML={{ __html: `
              .high-contrast * {
                filter: contrast(2);
              }
            `}} />
            <div className="high-contrast">
              <ProductCard product={context.args.product} />
            </div>
          </div>
        </div>
      </div>
    ),
  ],
};

// Inventory states
export const InventoryStates: Story = {
  args: {
    product: toProduct(mockProducts[0], { _id: 'inv-1' }),
  },
  render: () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Inventory Status Variations</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <p className="mb-2 text-sm font-medium text-green-600">In Stock (50+ units)</p>
          <ProductCard
            product={toProduct(mockProducts[0], { 
              _id: 'inv-high',
              inventory: 50, 
            })}
          />
        </div>
        <div>
          <p className="mb-2 text-sm font-medium text-yellow-600">Low Stock (5 units)</p>
          <ProductCard
            product={toProduct(mockProducts[0], { 
              _id: 'inv-low',
              inventory: 5, 
            })}
          />
        </div>
        <div>
          <p className="mb-2 text-sm font-medium text-red-600">Out of Stock</p>
          <ProductCard
            product={toProduct(mockProducts[0], { 
              _id: 'inv-out',
              inventory: 0, 
            })}
          />
        </div>
      </div>
    </div>
  ),
};

// Mobile responsiveness
export const MobileView: Story = {
  args: {
    product: toProduct(mockProducts[0], { _id: 'mobile-1' }),
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const TabletView: Story = {
  args: {
    product: toProduct(mockProducts[0], { _id: 'tablet-1' }),
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};

export const KeyboardNavigation: Story = {
  args: {
    product: toProduct(mockProducts[0], { _id: 'keyboard-1' }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Focus on the card
    const card = canvas.getByRole('article');
    card.focus();
    void expect(document.activeElement).toBe(card);
    
    // Tab to product link
    await userEvent.tab();
    const productLink = canvas.getByRole('link', { name: mockProducts[0].name });
    void expect(document.activeElement).toBe(productLink);
    
    // Tab to add to cart button
    await userEvent.tab();
    const addToCartButton = canvas.getByRole('button', { name: /add to cart/i });
    void expect(document.activeElement).toBe(addToCartButton);
    
    // Enter to activate button
    await userEvent.keyboard('{Enter}');
    
    // Should trigger add to cart action
    await waitFor(() => {
      void expect(canvas.getByText(/added to cart/i)).toBeInTheDocument();
    });
  },
};

export const QuickActionShortcuts: Story = {
  args: {
    product: toProduct(mockProducts[0], { _id: 'shortcuts-1' }),
  },
  decorators: [
    (Story) => (
      <div className="space-y-4">
        <div className="p-4 bg-muted rounded-lg">
          <h3 className="font-semibold mb-2">Quick Action Shortcuts</h3>
          <div className="text-sm text-muted-foreground space-y-1">
            <p><kbd>A</kbd> - Add to cart</p>
            <p><kbd>V</kbd> - View details</p>
            <p><kbd>F</kbd> - Add to favorites</p>
            <p><kbd>S</kbd> - Share product</p>
          </div>
        </div>
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Focus on the card
    const card = canvas.getByRole('article');
    card.focus();
    
    // Press 'A' for add to cart
    await userEvent.keyboard('a');
    
    // Should trigger add to cart
    await waitFor(() => {
      void expect(canvas.getByText(/added to cart/i)).toBeInTheDocument();
    });
    
    // Press 'V' for view details
    await userEvent.keyboard('v');
    // Would navigate to product details in real app
  },
};

export const ScreenReaderOptimized: Story = {
  args: {
    product: toProduct(mockProducts[0], {
      _id: 'sr-1',
      inventory: 5,
      isFeatured: true,
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Check ARIA labels
    const card = canvas.getByRole('article');
    void expect(card).toHaveAttribute('aria-label', expect.stringContaining(mockProducts[0].name));
    
    // Check price announcement
    const priceElement = canvas.getByText(`$${mockProducts[0].price}`);
    void expect(priceElement).toHaveAttribute('aria-label', expect.stringContaining('price'));
    
    // Check stock status announcement
    const stockBadge = canvas.getByText(/low stock/i);
    void expect(stockBadge).toHaveAttribute('role', 'status');
    
    // Check featured badge
    const featuredBadge = canvas.getByText(/featured/i);
    void expect(featuredBadge).toHaveAttribute('aria-label', 'Featured product');
  },
};

export const FocusIndicators: Story = {
  args: {
    product: toProduct(mockProducts[0], { _id: 'focus-1' }),
  },
  decorators: [
    (Story) => (
      <div className="space-y-4">
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            Tab through the card to see focus indicators on interactive elements
          </p>
        </div>
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Tab through all focusable elements
    const card = canvas.getByRole('article');
    card.focus();
    
    // Check focus styles are visible
    void expect(card).toHaveClass('focus-visible:ring-2');
    
    await userEvent.tab();
    const link = canvas.getByRole('link');
    void expect(document.activeElement).toBe(link);
    void expect(link).toHaveClass('focus-visible:outline-none');
    
    await userEvent.tab();
    const button = canvas.getByRole('button');
    void expect(document.activeElement).toBe(button);
    void expect(button).toHaveClass('focus-visible:ring-2');
  },
};