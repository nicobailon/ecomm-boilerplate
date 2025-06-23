import type { Meta, StoryObj } from '@storybook/react-vite';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { VirtualizedProductGrid } from './VirtualizedProductGrid';
import { trpc } from '@/lib/trpc';
import { createTRPCClient } from '@/lib/trpc-client';
import type { Product } from '@/types';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { RefreshCw, Grid3X3, Grid2X2, Maximize } from 'lucide-react';
import { Toaster } from 'sonner';

const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

// Generate large product dataset
const generateProducts = (count: number): Product[] => {
  const categories = ['Electronics', 'Fashion', 'Home', 'Sports', 'Books', 'Toys'];
  const conditions = ['New', 'Like New', 'Good', 'Fair'];
  
  return Array.from({ length: count }, (_, i) => ({
    _id: `prod${i + 1}`,
    name: `Product ${i + 1} - ${categories[i % categories.length]}`,
    description: `High-quality ${categories[i % categories.length].toLowerCase()} item. ${conditions[i % conditions.length]} condition. Lorem ipsum dolor sit amet, consectetur adipiscing elit.`,
    price: Math.floor(Math.random() * 900) + 10 + (i % 10) * 0.99,
    image: `https://images.unsplash.com/photo-${1542291026 + i * 1000}-7eec264c27ff?w=500&h=500&fit=crop`,
    isFeatured: i % 20 === 0,
    slug: `product-${i + 1}-${categories[i % categories.length].toLowerCase()}`,
    createdAt: new Date(Date.now() - i * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - i * 43200000).toISOString(),
  }));
};

// Infinite scroll wrapper
const InfiniteScrollWrapper = ({ initialCount = 100 }: { initialCount?: number }) => {
  const [products, setProducts] = useState<Product[]>(generateProducts(initialCount));
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadMore = async () => {
    if (isLoading || !hasMore) return;
    
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newProducts = generateProducts(50);
    setProducts(prev => [...prev, ...newProducts]);
    
    if (products.length >= 500) {
      setHasMore(false);
    }
    
    setIsLoading(false);
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight * 1.5 && hasMore && !isLoading) {
      loadMore();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
        <div>
          <h3 className="font-semibold">Infinite Scroll Demo</h3>
          <p className="text-sm text-muted-foreground">
            {products.length} products loaded {hasMore ? '(scroll for more)' : '(all loaded)'}
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setProducts(generateProducts(100));
            setHasMore(true);
          }}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Reset
        </Button>
      </div>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="border rounded-lg overflow-auto"
      >
        <VirtualizedProductGrid
          products={products}
          columnCount={4}
          width={1200}
          height={600}
        />
        {isLoading && (
          <div className="flex items-center justify-center p-8">
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span>Loading more products...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Responsive grid wrapper
const ResponsiveGridWrapper = ({ products }: { products: Product[] }) => {
  const [columnCount, setColumnCount] = useState(4);
  const [dimensions, setDimensions] = useState({ width: 1200, height: 600 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        setDimensions({
          width,
          height: window.innerHeight - 300,
        });
        
        // Adjust columns based on width
        if (width < 640) setColumnCount(2);
        else if (width < 1024) setColumnCount(3);
        else if (width < 1536) setColumnCount(4);
        else setColumnCount(5);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div ref={containerRef} className="w-full">
      <div className="mb-4 p-4 bg-muted rounded-lg">
        <p className="text-sm text-muted-foreground">
          Responsive grid: {columnCount} columns at {dimensions.width}px width
        </p>
      </div>
      <div className="border rounded-lg overflow-hidden">
        <VirtualizedProductGrid
          products={products}
          columnCount={columnCount}
          width={dimensions.width}
          height={dimensions.height}
        />
      </div>
    </div>
  );
};

const meta = {
  title: 'Product/VirtualizedProductGrid',
  component: VirtualizedProductGrid,
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
              <Story />
              <Toaster position="top-right" />
            </BrowserRouter>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
} satisfies Meta<typeof VirtualizedProductGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    products: generateProducts(100),
    columnCount: 4,
    width: 1200,
    height: 600,
  },
};

export const LargeDataset: Story = {
  args: {
    products: generateProducts(1000),
    columnCount: 4,
    width: 1200,
    height: 600,
  },
  decorators: [
    (Story) => (
      <div className="space-y-4">
        <div className="p-4 bg-muted rounded-lg">
          <h3 className="font-semibold mb-2">1000 Products</h3>
          <p className="text-sm text-muted-foreground">
            Smooth scrolling performance with virtualization
          </p>
        </div>
        <div className="border rounded-lg overflow-hidden">
          <Story />
        </div>
      </div>
    ),
  ],
};

export const ExtraLargeDataset: Story = {
  args: {
    products: generateProducts(10000),
    columnCount: 4,
    width: 1200,
    height: 600,
  },
  decorators: [
    (Story) => (
      <div className="space-y-4">
        <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
          <h3 className="font-semibold mb-2 text-warning">10,000 Products</h3>
          <p className="text-sm">
            Extreme performance test - virtualization handles massive datasets efficiently
          </p>
        </div>
        <div className="border rounded-lg overflow-hidden">
          <Story />
        </div>
      </div>
    ),
  ],
};

export const InfiniteScroll: Story = {
  args: {
    products: [],
    columnCount: 4,
    height: 600,
    width: 800,
  },
  decorators: [
    () => <InfiniteScrollWrapper initialCount={100} />,
  ],
};

export const ResponsiveColumns: Story = {
  args: {
    products: [],
    columnCount: 4,
    height: 600,
    width: 800,
  },
  decorators: [
    () => <ResponsiveGridWrapper products={generateProducts(200)} />,
  ],
};

export const VariableColumnCounts: Story = {
  args: {
    products: [],
    columnCount: 4,
    height: 600,
    width: 800,
  },
  decorators: [
    () => {
      const [columnCount, setColumnCount] = useState(4);
      const products = generateProducts(100);
      
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
            <span className="text-sm font-medium">Columns:</span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={columnCount === 2 ? "default" : "outline"}
                onClick={() => setColumnCount(2)}
              >
                <Grid2X2 className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant={columnCount === 3 ? "default" : "outline"}
                onClick={() => setColumnCount(3)}
              >
                3
              </Button>
              <Button
                size="sm"
                variant={columnCount === 4 ? "default" : "outline"}
                onClick={() => setColumnCount(4)}
              >
                4
              </Button>
              <Button
                size="sm"
                variant={columnCount === 5 ? "default" : "outline"}
                onClick={() => setColumnCount(5)}
              >
                5
              </Button>
              <Button
                size="sm"
                variant={columnCount === 6 ? "default" : "outline"}
                onClick={() => setColumnCount(6)}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div className="border rounded-lg overflow-hidden">
            <VirtualizedProductGrid
              products={products}
              columnCount={columnCount}
              width={1200}
              height={600}
            />
          </div>
        </div>
      );
    },
  ],
};

export const FullscreenMode: Story = {
  args: {
    products: [],
    columnCount: 4,
    height: 600,
    width: 800,
  },
  decorators: [
    () => {
      const [isFullscreen, setIsFullscreen] = useState(false);
      const products = generateProducts(500);
      
      return (
        <div className={isFullscreen ? 'fixed inset-0 z-50 bg-background p-4' : 'space-y-4'}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">
              {isFullscreen ? 'Fullscreen Mode' : 'Normal View'}
            </h3>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              <Maximize className="w-4 h-4 mr-2" />
              {isFullscreen ? 'Exit' : 'Enter'} Fullscreen
            </Button>
          </div>
          <div className="border rounded-lg overflow-hidden" style={{ height: isFullscreen ? 'calc(100vh - 100px)' : '600px' }}>
            <VirtualizedProductGrid
              products={products}
              columnCount={isFullscreen ? 6 : 4}
              width={isFullscreen ? window.innerWidth - 32 : 1200}
              height={isFullscreen ? window.innerHeight - 100 : 600}
            />
          </div>
        </div>
      );
    },
  ],
};

export const ScrollToPosition: Story = {
  args: {
    products: [],
    columnCount: 4,
    height: 600,
    width: 800,
  },
  decorators: [
    () => {
      const products = generateProducts(500);
      const gridRef = useRef<any>(null);
      
      const scrollToPosition = (position: 'top' | 'middle' | 'bottom') => {
        if (!gridRef.current) return;
        
        const positions = {
          top: 0,
          middle: Math.floor(products.length / 8) * 380 / 2,
          bottom: Math.ceil(products.length / 4) * 380,
        };
        
        gridRef.current.scrollTo({ scrollTop: positions[position] });
      };
      
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
            <span className="text-sm font-medium">Scroll to:</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => scrollToPosition('top')}>
                Top
              </Button>
              <Button size="sm" variant="outline" onClick={() => scrollToPosition('middle')}>
                Middle
              </Button>
              <Button size="sm" variant="outline" onClick={() => scrollToPosition('bottom')}>
                Bottom
              </Button>
            </div>
          </div>
          <div className="border rounded-lg overflow-hidden">
            <VirtualizedProductGrid
              products={products}
              columnCount={4}
              width={1200}
              height={600}
            />
          </div>
        </div>
      );
    },
  ],
};

export const EmptyState: Story = {
  args: {
    products: [],
    columnCount: 4,
    width: 1200,
    height: 600,
  },
  decorators: [
    (Story) => (
      <div className="space-y-4">
        <div className="border rounded-lg overflow-hidden">
          <Story />
          <div className="flex flex-col items-center justify-center h-[600px] text-center p-8">
            <h3 className="text-lg font-semibold mb-2">No Products Found</h3>
            <p className="text-muted-foreground">
              Try adjusting your filters or search criteria
            </p>
          </div>
        </div>
      </div>
    ),
  ],
};

export const LoadingState: Story = {
  args: {
    products: [],
    columnCount: 4,
    height: 600,
    width: 800,
  },
  decorators: [
    () => {
      const [isLoading, setIsLoading] = useState(true);
      const [products, setProducts] = useState<Product[]>([]);
      
      useEffect(() => {
        const timer = setTimeout(() => {
          setProducts(generateProducts(100));
          setIsLoading(false);
        }, 2000);
        
        return () => clearTimeout(timer);
      }, []);
      
      return (
        <div className="space-y-4">
          <div className="border rounded-lg overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center h-[600px]">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading products...</p>
                </div>
              </div>
            ) : (
              <VirtualizedProductGrid
                products={products}
                columnCount={4}
                width={1200}
                height={600}
              />
            )}
          </div>
        </div>
      );
    },
  ],
};

export const MobileView: Story = {
  args: {
    products: generateProducts(50),
    columnCount: 2,
    width: 375,
    height: 667,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const TabletView: Story = {
  args: {
    products: generateProducts(100),
    columnCount: 3,
    width: 768,
    height: 1024,
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};

export const PerformanceMonitor: Story = {
  args: {
    products: [],
    columnCount: 4,
    height: 600,
    width: 800,
  },
  decorators: [
    () => {
      const [renderCount] = useState(0);
      const [scrollPosition, setScrollPosition] = useState(0);
      const products = generateProducts(5000);
      
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{products.length}</div>
              <div className="text-sm text-muted-foreground">Total Products</div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{renderCount}</div>
              <div className="text-sm text-muted-foreground">Render Count</div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{scrollPosition}px</div>
              <div className="text-sm text-muted-foreground">Scroll Position</div>
            </div>
          </div>
          <div 
            className="border rounded-lg overflow-hidden"
            onScroll={(e) => setScrollPosition(Math.round(e.currentTarget.scrollTop))}
          >
            <VirtualizedProductGrid
              products={products}
              columnCount={4}
              width={1200}
              height={600}
            />
          </div>
          <div className="p-4 bg-info/10 border border-info/20 rounded-lg">
            <p className="text-sm">
              React Window only renders visible items. Even with 5000 products, 
              only ~20-30 DOM nodes exist at any time.
            </p>
          </div>
        </div>
      );
    },
  ],
};

export const ErrorBoundary: Story = {
  args: {
    products: [],
    columnCount: 4,
    height: 600,
    width: 800,
  },
  decorators: [
    () => {
      const [hasError, setHasError] = useState(false);
      
      if (hasError) {
        return (
          <div className="border rounded-lg p-8">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-destructive mb-2">
                Error Loading Products
              </h3>
              <p className="text-muted-foreground mb-4">
                Something went wrong while loading the product grid
              </p>
              <Button onClick={() => setHasError(false)}>
                Try Again
              </Button>
            </div>
          </div>
        );
      }
      
      return (
        <div className="space-y-4">
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm">
              Click the button to simulate an error
            </p>
            <Button
              size="sm"
              variant="destructive"
              className="mt-2"
              onClick={() => setHasError(true)}
            >
              Trigger Error
            </Button>
          </div>
          <div className="border rounded-lg overflow-hidden">
            <VirtualizedProductGrid
              products={generateProducts(100)}
              columnCount={4}
              width={1200}
              height={600}
            />
          </div>
        </div>
      );
    },
  ],
};

export const DynamicLoading: Story = {
  args: {
    products: [],
    columnCount: 4,
    height: 600,
    width: 800,
  },
  decorators: [
    () => {
      const [products, setProducts] = useState<Product[]>([]);
      const [loadingCells, setLoadingCells] = useState<Set<number>>(new Set());
      
      useEffect(() => {
        // Simulate loading products in batches
        const loadBatch = (startIndex: number, count: number) => {
          const newLoadingCells = new Set(loadingCells);
          for (let i = startIndex; i < startIndex + count; i++) {
            newLoadingCells.add(i);
          }
          setLoadingCells(newLoadingCells);
          
          setTimeout(() => {
            const newProducts = generateProducts(count);
            setProducts(prev => {
              const updated = [...prev];
              newProducts.forEach((product, i) => {
                updated[startIndex + i] = product;
              });
              return updated;
            });
            
            setLoadingCells(prev => {
              const updated = new Set(prev);
              for (let i = startIndex; i < startIndex + count; i++) {
                updated.delete(i);
              }
              return updated;
            });
          }, Math.random() * 1000 + 500);
        };
        
        // Initialize with placeholders
        setProducts(Array(100).fill(null));
        
        // Load in batches
        for (let i = 0; i < 100; i += 10) {
          setTimeout(() => loadBatch(i, 10), i * 100);
        }
      }, []);
      
      return (
        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">Dynamic Batch Loading</h3>
            <p className="text-sm text-muted-foreground">
              Products load in batches as you would see in a real application
            </p>
          </div>
          <div className="border rounded-lg overflow-hidden">
            <VirtualizedProductGrid
              products={products.filter(Boolean) as Product[]}
              columnCount={4}
              width={1200}
              height={600}
            />
          </div>
        </div>
      );
    },
  ],
};