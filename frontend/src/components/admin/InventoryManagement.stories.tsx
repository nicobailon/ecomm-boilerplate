import type { Meta, StoryObj } from '@storybook/react-vite';
import { InventoryManagement } from './InventoryManagement';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { trpc } from '@/lib/trpc';
import { createTRPCClient } from '@/lib/trpc-client';
import { useState } from 'react';
import { within, userEvent, expect } from '@storybook/test';
import { withScenario, withEndpointOverrides, withNetworkCondition } from '@/mocks/story-helpers';
import { trpcMutation, trpcQuery } from '@/mocks/utils/trpc-mock';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Toaster, toast } from 'sonner';
import { AlertCircle, RefreshCw, Wifi, WifiOff, AlertTriangle, Database, TrendingDown } from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: Infinity },
  },
});

const meta = {
  title: 'Admin/InventoryManagement',
  component: InventoryManagement,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <trpc.Provider client={createTRPCClient()} queryClient={new QueryClient()}>
        <QueryClientProvider client={queryClient}>
          <div className="p-6 bg-background min-h-screen">
            <Story />
          </div>
        </QueryClientProvider>
      </trpc.Provider>
    ),
  ],
} satisfies Meta<typeof InventoryManagement>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const WithSearch: Story = {
  render: () => {
    const [searchQuery, setSearchQuery] = useState('');
    
    return (
      <div className="space-y-4">
        <div className="flex gap-4 items-center">
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-2 border rounded-md w-full max-w-md"
          />
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md">
            Search
          </button>
        </div>
        <InventoryManagement searchQuery={searchQuery} />
      </div>
    );
  },
};

export const WithSearchActive: Story = {
  args: {
    searchQuery: 'headphones',
  },
};

export const LoadingState: Story = {
  decorators: [
    (Story) => (
      <QueryClientProvider client={new QueryClient()}>
        <trpc.Provider client={createTRPCClient()} queryClient={new QueryClient()}>
          <div className="p-6 bg-background min-h-screen">
            <Story />
          </div>
        </trpc.Provider>
      </QueryClientProvider>
    ),
  ],
};

export const EmptyState: Story = {
  decorators: [
    (Story) => {
      const emptyQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: Infinity,
            retry: false,
          },
        },
      });
      
      emptyQueryClient.setQueryData(['product.list'], { products: [] });
      
      return (
        <QueryClientProvider client={emptyQueryClient}>
          <trpc.Provider client={createTRPCClient()} queryClient={new QueryClient()}>
            <div className="p-6 bg-background min-h-screen">
              <Story />
            </div>
          </trpc.Provider>
        </QueryClientProvider>
      );
    },
  ],
};

export const WithLowStockItems: Story = {
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
      
      const mockProducts = [
        {
          _id: '1',
          name: 'Low Stock T-Shirt',
          description: 'Running low on inventory',
          price: 29.99,
          imageUrl: '/placeholder.jpg',
          category: 'Clothing',
          featured: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          _id: '2',
          name: 'Out of Stock Jeans',
          description: 'Currently unavailable',
          price: 79.99,
          imageUrl: '/placeholder.jpg',
          category: 'Clothing',
          featured: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      
      mockQueryClient.setQueryData(['product.list'], { products: mockProducts });
      mockQueryClient.setQueryData(['inventory.metrics'], {
        totalProducts: 2,
        totalValue: 549.90,
        lowStockCount: 1,
        outOfStockCount: 1,
      });
      
      return (
        <QueryClientProvider client={mockQueryClient}>
          <trpc.Provider client={createTRPCClient()} queryClient={new QueryClient()}>
            <div className="p-6 bg-background min-h-screen">
              <Story />
            </div>
          </trpc.Provider>
        </QueryClientProvider>
      );
    },
  ],
};

export const WithSelectedItems: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Wait for checkboxes to be rendered
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Select first two items
    const checkboxes = canvas.getAllByRole('checkbox');
    if (checkboxes.length > 1) {
      await userEvent.click(checkboxes[0]);
      await userEvent.click(checkboxes[1]);
    }
  },
};

export const EditingInventory: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Wait for content to load
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Find and click edit button
    const editButtons = canvas.getAllByRole('button');
    const editButton = editButtons.find(btn => btn.querySelector('svg'));
    if (editButton) {
      await userEvent.click(editButton);
    }
  },
};

export const WithVariants: Story = {
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
      
      const mockProducts = [
        {
          _id: '1',
          name: 'Multi-Size T-Shirt',
          description: 'Available in multiple sizes',
          price: 29.99,
          imageUrl: '/placeholder.jpg',
          category: 'Clothing',
          featured: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          variants: [
            {
              variantId: 'v1',
              label: 'Small',
              price: 29.99,
              inventory: 15,
              sku: 'TSH-SM-001',
            },
            {
              variantId: 'v2',
              label: 'Medium',
              price: 29.99,
              inventory: 25,
              sku: 'TSH-MD-001',
            },
            {
              variantId: 'v3',
              label: 'Large',
              price: 29.99,
              inventory: 10,
              sku: 'TSH-LG-001',
            },
          ],
        },
      ];
      
      mockQueryClient.setQueryData(['product.list'], { products: mockProducts });
      
      return (
        <QueryClientProvider client={mockQueryClient}>
          <trpc.Provider client={createTRPCClient()} queryClient={new QueryClient()}>
            <div className="p-6 bg-background min-h-screen">
              <Story />
            </div>
          </trpc.Provider>
        </QueryClientProvider>
      );
    },
  ],
};

export const ExpandedVariants: Story = {
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
      
      const mockProducts = [
        {
          _id: '1',
          name: 'Multi-Size T-Shirt',
          description: 'Available in multiple sizes',
          price: 29.99,
          imageUrl: '/placeholder.jpg',
          category: 'Clothing',
          featured: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          variants: [
            {
              variantId: 'v1',
              label: 'Small',
              price: 29.99,
              inventory: 15,
              sku: 'TSH-SM-001',
            },
            {
              variantId: 'v2',
              label: 'Medium',
              price: 29.99,
              inventory: 25,
              sku: 'TSH-MD-001',
            },
            {
              variantId: 'v3',
              label: 'Large',
              price: 29.99,
              inventory: 10,
              sku: 'TSH-LG-001',
            },
          ],
        },
      ];
      
      mockQueryClient.setQueryData(['product.list'], { products: mockProducts });
      
      return (
        <QueryClientProvider client={mockQueryClient}>
          <trpc.Provider client={createTRPCClient()} queryClient={new QueryClient()}>
            <div className="p-6 bg-background min-h-screen">
              <Story />
            </div>
          </trpc.Provider>
        </QueryClientProvider>
      );
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Wait for content to load
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Find and click expand button
    const expandButtons = canvas.getAllByRole('button');
    const expandButton = expandButtons.find(btn => {
      const svg = btn.querySelector('svg');
      return svg && svg.classList.contains('w-4') && svg.classList.contains('h-4');
    });
    if (expandButton) {
      await userEvent.click(expandButton);
    }
  },
};

export const MobileView: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const TabletView: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};

export const QuickActions: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Wait for content to load
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Find quick action buttons
    const buttons = canvas.getAllByRole('button');
    
    // Look for increase/decrease buttons by their content
    const increaseButton = buttons.find(btn => {
      const svg = btn.querySelector('svg');
      return svg && btn.getAttribute('title')?.includes('Increase');
    });
    
    if (increaseButton) {
      // Click increase button multiple times
      await userEvent.click(increaseButton);
      await new Promise(resolve => setTimeout(resolve, 500));
      await userEvent.click(increaseButton);
    }
  },
};

export const BulkSelection: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Wait for content to load
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Select all checkboxes
    const checkboxes = canvas.getAllByRole('checkbox');
    for (const checkbox of checkboxes) {
      await userEvent.click(checkbox);
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  },
};

export const LargeDataset: Story = {
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
      
      // Create 100 mock products
      const mockProducts = Array.from({ length: 100 }, (_, i) => ({
        _id: `product-${i + 1}`,
        name: `Product ${i + 1}`,
        description: `Description for product ${i + 1}`,
        price: Math.floor(Math.random() * 100) + 10,
        imageUrl: '/placeholder.jpg',
        category: ['Electronics', 'Clothing', 'Home', 'Sports'][i % 4],
        featured: i % 10 === 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
      
      mockQueryClient.setQueryData(['product.list'], { products: mockProducts });
      mockQueryClient.setQueryData(['inventory.metrics'], {
        totalProducts: 100,
        totalValue: 45000,
        lowStockCount: 15,
        outOfStockCount: 5,
      });
      
      return (
        <QueryClientProvider client={mockQueryClient}>
          <trpc.Provider client={createTRPCClient()} queryClient={new QueryClient()}>
            <div className="p-6 bg-background min-h-screen">
              <Story />
            </div>
          </trpc.Provider>
        </QueryClientProvider>
      );
    },
  ],
};

export const ErrorState: Story = {
  decorators: [
    (Story) => {
      const errorQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: Infinity,
            retry: false,
          },
        },
      });
      
      errorQueryClient.setQueryData(['product.list'], {
        error: { message: 'Failed to load products' },
      });
      
      return (
        <QueryClientProvider client={errorQueryClient}>
          <trpc.Provider client={createTRPCClient()} queryClient={new QueryClient()}>
            <div className="p-6 bg-background min-h-screen">
              <Story />
            </div>
          </trpc.Provider>
        </QueryClientProvider>
      );
    },
  ],
};

// Enhanced Error State Stories
export const NetworkError: Story = {
  decorators: [
    (Story) => (
      <div className="p-6 bg-background min-h-screen">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Network error simulation - Unable to fetch inventory data
          </AlertDescription>
        </Alert>
        <Story />
        <Toaster position="top-right" />
      </div>
    ),
  ],
  ...withNetworkCondition('offline'),
};

export const ServerError: Story = {
  decorators: [
    (Story) => (
      <div className="p-6 bg-background min-h-screen">
        <Card className="p-4 mb-6 border-red-200 bg-red-50">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-red-600" />
            <h4 className="font-medium">Server Error Simulation</h4>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            The server is returning errors for all inventory operations
          </p>
        </Card>
        <Story />
        <Toaster position="top-right" />
      </div>
    ),
  ],
  ...withEndpointOverrides([
    trpcQuery('product.list', async () => {
      throw new Error('Internal server error');
    }),
    trpcQuery('inventory.metrics', async () => {
      throw new Error('Failed to fetch inventory metrics');
    }),
  ]),
};

export const InventoryUpdateError: Story = {
  decorators: [
    (Story) => {
      const [errorCount] = useState(0);
      
      return (
        <div className="p-6 bg-background min-h-screen">
          <Card className="p-4 mb-6">
            <h4 className="font-medium mb-2">Inventory Update Error Demo</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Try updating inventory levels - operations will fail
            </p>
            {errorCount > 0 && (
              <Badge variant="destructive">
                {errorCount} failed {errorCount === 1 ? 'update' : 'updates'}
              </Badge>
            )}
          </Card>
          <Story />
          <Toaster position="top-right" />
        </div>
      );
    },
  ],
  ...withEndpointOverrides([
    trpcMutation('inventory.update', async () => {
      throw new Error('Failed to update inventory');
    }),
    trpcMutation('inventory.bulkUpdate', async () => {
      throw new Error('Bulk update failed');
    }),
  ]),
};

export const ConcurrentUpdateConflict: Story = {
  decorators: [
    (Story) => {
      const [conflicts, setConflicts] = useState<string[]>([]);
      
      return (
        <div className="p-6 bg-background min-h-screen">
          <Card className="p-4 mb-6">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              Concurrent Update Conflicts
            </h4>
            <p className="text-sm text-muted-foreground mb-3">
              Simulates conflicts when multiple users update the same product
            </p>
            <Button
              size="sm"
              onClick={() => {
                const productId = `product-${Math.floor(Math.random() * 5) + 1}`;
                setConflicts(prev => [...prev, productId]);
                toast.error(`Conflict detected for ${productId}`);
              }}
            >
              Simulate Conflict
            </Button>
            {conflicts.length > 0 && (
              <div className="mt-3 space-y-1">
                {conflicts.slice(-3).map((id, i) => (
                  <Badge key={i} variant="outline" className="mr-2">
                    {id}
                  </Badge>
                ))}
              </div>
            )}
          </Card>
          <Story />
          <Toaster position="top-right" />
        </div>
      );
    },
  ],
  ...withEndpointOverrides([
    trpcMutation('inventory.update', async ({ productId, quantity }: any) => {
      if (Math.random() > 0.5) {
        throw new Error('Inventory was modified by another user');
      }
      return { productId, quantity };
    }),
  ]),
};

export const LowStockAlert: Story = {
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
      
      const lowStockProducts = [
        {
          _id: '1',
          name: 'Critical Stock - Laptop',
          description: 'Only 2 units remaining',
          price: 999.99,
          imageUrl: '/placeholder.jpg',
          category: 'Electronics',
          featured: true,
          inventory: 2,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          _id: '2',
          name: 'Out of Stock - Headphones',
          description: 'Currently unavailable',
          price: 199.99,
          imageUrl: '/placeholder.jpg',
          category: 'Electronics',
          featured: false,
          inventory: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          _id: '3',
          name: 'Low Stock - Mouse',
          description: '5 units remaining',
          price: 49.99,
          imageUrl: '/placeholder.jpg',
          category: 'Electronics',
          featured: false,
          inventory: 5,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      
      mockQueryClient.setQueryData(['product.list'], { products: lowStockProducts });
      mockQueryClient.setQueryData(['inventory.metrics'], {
        totalProducts: 3,
        totalValue: 1249.97,
        lowStockCount: 2,
        outOfStockCount: 1,
      });
      
      return (
        <QueryClientProvider client={mockQueryClient}>
          <trpc.Provider client={createTRPCClient()} queryClient={new QueryClient()}>
            <div className="p-6 bg-background min-h-screen">
              <Alert className="mb-6">
                <TrendingDown className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium">Low Stock Alert</div>
                  <p className="text-sm mt-1">2 products are running low on inventory</p>
                </AlertDescription>
              </Alert>
              <Story />
            </div>
          </trpc.Provider>
        </QueryClientProvider>
      );
    },
  ],
};

export const BulkOperationError: Story = {
  decorators: [
    (Story) => {
      const [bulkError, setBulkError] = useState<string | null>(null);
      const [selectedCount, setSelectedCount] = useState(0);
      
      return (
        <div className="p-6 bg-background min-h-screen">
          <Card className="p-4 mb-6">
            <h4 className="font-medium mb-2">Bulk Operation Error Demo</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Select multiple items and try bulk operations
            </p>
            <div className="flex items-center gap-3">
              <Button
                size="sm"
                onClick={() => {
                  setBulkError('Failed to update 3 products: Insufficient permissions');
                  toast.error('Bulk update failed');
                }}
                disabled={selectedCount === 0}
              >
                Bulk Update ({selectedCount} selected)
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedCount(prev => (prev + 1) % 4)}
              >
                Toggle Selection ({selectedCount})
              </Button>
            </div>
          </Card>
          
          {bulkError && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <span>{bulkError}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setBulkError(null)}
                  >
                    Dismiss
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          <Story />
          <Toaster position="top-right" />
        </div>
      );
    },
  ],
};

export const ValidationError: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Wait for content to load
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Try to set invalid inventory value
    const editButtons = canvas.getAllByRole('button');
    const editButton = editButtons.find(btn => btn.querySelector('svg'));
    if (editButton) {
      await userEvent.click(editButton);
      
      // Try to enter negative value
      const input = canvas.getByRole('spinbutton');
      await userEvent.clear(input);
      await userEvent.type(input, '-5');
      
      // Should show validation error
      await expect(canvas.getByText(/must be a positive number/i)).toBeInTheDocument();
    }
  },
  ...withEndpointOverrides([
    trpcMutation('inventory.update', async ({ quantity }: any) => {
      if (quantity < 0) {
        throw new Error('Inventory must be a positive number');
      }
      if (quantity > 9999) {
        throw new Error('Inventory cannot exceed 9999');
      }
      return { success: true };
    }),
  ]),
};

export const ErrorRecovery: Story = {
  decorators: [
    (Story) => {
      const [error, setError] = useState<string | null>('Failed to load inventory data');
      const [retryCount, setRetryCount] = useState(0);
      const [isRetrying, setIsRetrying] = useState(false);
      
      const retry = async () => {
        setIsRetrying(true);
        setRetryCount(prev => prev + 1);
        
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        if (retryCount >= 1) {
          setError(null);
          toast.success('Inventory data loaded successfully!');
        } else {
          toast.error('Still having issues. Please try again.');
        }
        
        setIsRetrying(false);
      };
      
      return (
        <div className="p-6 bg-background min-h-screen">
          {error ? (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-3">
                  <p>{error}</p>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={retry}
                      disabled={isRetrying}
                    >
                      {isRetrying ? (
                        <>
                          <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                          Retrying...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Retry ({retryCount + 1}/2)
                        </>
                      )}
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      {retryCount === 0 ? 'First retry will fail' : 'This retry will succeed'}
                    </span>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          ) : (
            <Story />
          )}
          <Toaster position="top-right" />
        </div>
      );
    },
  ],
};

export const MSWIntegration: Story = {
  decorators: [
    (Story) => (
      <div className="p-6 bg-background min-h-screen">
        <Card className="p-4 mb-6">
          <h4 className="font-medium mb-2">MSW Integration</h4>
          <p className="text-sm text-muted-foreground">
            This story uses Mock Service Worker for realistic API behavior
          </p>
        </Card>
        <Story />
        <Toaster position="top-right" />
      </div>
    ),
  ],
  ...withScenario('default'),
};

export const OfflineMode: Story = {
  decorators: [
    (Story) => {
      const [isOffline, setIsOffline] = useState(true);
      
      return (
        <div className="p-6 bg-background min-h-screen">
          <Card className="p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isOffline ? (
                  <WifiOff className="w-4 h-4 text-red-500" />
                ) : (
                  <Wifi className="w-4 h-4 text-green-500" />
                )}
                <div>
                  <h4 className="font-medium">Offline Mode</h4>
                  <p className="text-sm text-muted-foreground">
                    {isOffline ? 'Working with cached data' : 'Connected to server'}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsOffline(!isOffline)}
              >
                {isOffline ? 'Go Online' : 'Go Offline'}
              </Button>
            </div>
          </Card>
          
          {isOffline && (
            <Alert className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You're working offline. Changes will be synced when connection is restored.
              </AlertDescription>
            </Alert>
          )}
          
          <Story />
          <Toaster position="top-right" />
        </div>
      );
    },
  ],
};