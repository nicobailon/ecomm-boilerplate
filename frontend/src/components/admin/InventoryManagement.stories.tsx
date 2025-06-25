import type { Meta, StoryObj } from '@storybook/react-vite';
import { InventoryManagement } from './InventoryManagement';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { trpc } from '@/lib/trpc';
import { createTRPCClient } from '@/lib/trpc-client';
import { useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { within, userEvent, expect } from '@storybook/test';
import { withScenario, withEndpointOverrides, withNetworkCondition } from '@/mocks/story-helpers';
import { trpcMutation, trpcQuery } from '@/mocks/utils/trpc-mock';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Toaster, toast } from 'sonner';
import { AlertCircle, RefreshCw, Wifi, WifiOff, AlertTriangle, Database, TrendingDown, Users, CheckCircle2 } from 'lucide-react';

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

// Inventory Sync Stories - Multi-user updates, conflicts, out-of-sync, recovery
export const MultiUserInventorySync: Story = {
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
      
      interface User {
        id: string;
        name: string;
        active: boolean;
        color: string;
      }
      
      const [_users] = useState<User[]>([
        { id: 'user1', name: 'Alice (You)', active: true, color: 'bg-blue-500' },
        { id: 'user2', name: 'Bob', active: true, color: 'bg-green-500' },
        { id: 'user3', name: 'Carol', active: false, color: 'bg-purple-500' },
      ]);
      
      const [inventoryUpdates, setInventoryUpdates] = useState<any[]>([]);
      interface ConflictItem {
        id: string;
        description: string;
        timestamp: Date;
        resolved: boolean;
      }
      
      const [conflicts, setConflicts] = useState<ConflictItem[]>([]);
      
      const simulateUserUpdate = (userId: string, productId: string, newQuantity: number) => {
        const user = _users.find((u) => u.id === userId);
        const timestamp = new Date();
        
        // Simulate potential conflict
        const hasConflict = Math.random() > 0.7;
        
        const update = {
          id: Date.now().toString(),
          userId,
          userName: user?.name || 'Unknown',
          productId,
          quantity: newQuantity,
          timestamp,
          hasConflict,
          conflictReason: hasConflict ? 'Concurrent modification detected' : null,
        };
        
        setInventoryUpdates(prev => [...prev.slice(-9), update]);
        
        if (hasConflict) {
          setConflicts(prev => [...prev.slice(-4), {
            id: update.id,
            description: `${user?.name} tried to update ${productId} but another user modified it first`,
            timestamp,
            resolved: false,
          }]);
          toast.error(`Conflict detected: ${user?.name}'s update to ${productId}`);
        } else {
          toast.success(`${user?.name} updated ${productId} to ${newQuantity} units`);
        }
      };
      
      const simulateAutoUpdates = () => {
        const interval = setInterval(() => {
          const activeUsers = _users.filter((u) => u.active && u.id !== 'user1');
          if (activeUsers.length > 0) {
            const user = activeUsers[Math.floor(Math.random() * activeUsers.length)];
            const productId = `prod${Math.floor(Math.random() * 5) + 1}`;
            const quantity = Math.floor(Math.random() * 100) + 10;
            simulateUserUpdate(user.id, productId, quantity);
          }
        }, 3000);
        
        return () => clearInterval(interval);
      };
      
      const resolveConflict = (conflictId: string) => {
        setConflicts(prev => prev.map(c => 
          c.id === conflictId ? { ...c, resolved: true } : c,
        ));
        toast.success('Conflict resolved');
      };
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={mockQueryClient}>
          <QueryClientProvider client={mockQueryClient}>
            <BrowserRouter>
              <div className="space-y-4">
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Multi-User Inventory Sync
                    </h4>
                    <Button size="sm" onClick={simulateAutoUpdates}>
                      Start Auto Updates
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Active Users */}
                    <div>
                      <h5 className="text-sm font-medium mb-2">Active Users</h5>
                      <div className="space-y-2">
                        {_users.map((user) => (
                          <div key={user.id} className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${user.color}`} />
                            <span className="text-sm">{user.name}</span>
                            <Badge variant={user.active ? 'default' : 'secondary'}>
                              {user.active ? 'Online' : 'Offline'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Recent Updates */}
                    <div>
                      <h5 className="text-sm font-medium mb-2">Recent Updates</h5>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {inventoryUpdates.slice(-5).reverse().map(update => (
                          <div key={update.id} className="text-xs p-2 bg-muted rounded">
                            <div className="flex justify-between">
                              <span className="font-medium">{update.userName}</span>
                              <span className="text-muted-foreground">
                                {update.timestamp.toLocaleTimeString()}
                              </span>
                            </div>
                            <div className="text-muted-foreground">
                              {update.productId}: {update.quantity} units
                            </div>
                            {update.hasConflict && (
                              <div className="text-red-600 text-xs mt-1">
                                ⚠️ Conflict detected
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Conflicts */}
                    <div>
                      <h5 className="text-sm font-medium mb-2">Conflicts ({conflicts.filter(c => !c.resolved).length})</h5>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {conflicts.filter(c => !c.resolved).map(conflict => (
                          <div key={conflict.id} className="text-xs p-2 bg-red-50 border border-red-200 rounded">
                            <div className="text-red-800 mb-1">{conflict.description}</div>
                            <Button size="sm" onClick={() => resolveConflict(conflict.id)}>
                              Resolve
                            </Button>
                          </div>
                        ))}
                        {conflicts.filter(c => !c.resolved).length === 0 && (
                          <div className="text-sm text-muted-foreground text-center py-2">
                            No conflicts
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex gap-2">
                    <Button size="sm" onClick={() => simulateUserUpdate('user1', 'prod1', 50)}>
                      Update Product 1
                    </Button>
                    <Button size="sm" onClick={() => simulateUserUpdate('user1', 'prod2', 75)}>
                      Update Product 2
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setConflicts([])}>
                      Clear Conflicts
                    </Button>
                  </div>
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
  ...withEndpointOverrides([
    trpcMutation('inventory.update', async ({ productId, quantity }: any) => {
      // Simulate random conflicts
      if (Math.random() > 0.6) {
        throw new Error(`Inventory conflict: ${productId} was modified by another user`);
      }
      return { productId, quantity, timestamp: Date.now() };
    }),
  ]),
};

export const OutOfSyncRecovery: Story = {
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
      
      const [syncState, setSyncState] = useState<'synced' | 'out-of-sync' | 'syncing' | 'error'>('synced');
      const [lastSync, setLastSync] = useState(new Date());
      const [localChanges, setLocalChanges] = useState<any[]>([]);
      const [serverChanges, setServerChanges] = useState<any[]>([]);
      
      const simulateOutOfSync = () => {
        setSyncState('out-of-sync');
        setLastSync(new Date(Date.now() - 300000)); // 5 minutes ago
        
        // Simulate server changes
        const serverUpdates = [
          { productId: 'prod1', quantity: 25, user: 'Server Admin', timestamp: new Date() },
          { productId: 'prod3', quantity: 0, user: 'Auto System', timestamp: new Date() },
        ];
        setServerChanges(serverUpdates);
        
        // Simulate local changes
        const localUpdates = [
          { productId: 'prod1', quantity: 30, user: 'You', timestamp: new Date() },
          { productId: 'prod2', quantity: 15, user: 'You', timestamp: new Date() },
        ];
        setLocalChanges(localUpdates);
        
        toast.warning('Inventory data is out of sync with server');
      };
      
      const attemptSync = async () => {
        setSyncState('syncing');
        
        // Simulate sync process
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Randomly succeed or fail
        if (Math.random() > 0.3) {
          setSyncState('synced');
          setLastSync(new Date());
          setLocalChanges([]);
          setServerChanges([]);
          toast.success('Inventory data synchronized successfully');
        } else {
          setSyncState('error');
          toast.error('Sync failed - please try again');
        }
      };
      
      const forcePull = () => {
        setSyncState('syncing');
        setTimeout(() => {
          setSyncState('synced');
          setLastSync(new Date());
          setLocalChanges([]);
          setServerChanges([]);
          toast.info('Force pulled latest data from server');
        }, 1000);
      };
      
      const getSyncStateColor = () => {
        switch (syncState) {
          case 'synced': return 'border-green-200 bg-green-50';
          case 'out-of-sync': return 'border-yellow-200 bg-yellow-50';
          case 'syncing': return 'border-blue-200 bg-blue-50';
          case 'error': return 'border-red-200 bg-red-50';
        }
      };
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={mockQueryClient}>
          <QueryClientProvider client={mockQueryClient}>
            <BrowserRouter>
              <div className="space-y-4">
                <Card className={`p-4 ${getSyncStateColor()}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      {syncState === 'synced' && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                      {syncState === 'out-of-sync' && <AlertTriangle className="w-5 h-5 text-yellow-600" />}
                      {syncState === 'syncing' && <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />}
                      {syncState === 'error' && <AlertCircle className="w-5 h-5 text-red-600" />}
                      <h4 className="font-medium">Sync Status: {syncState.replace('-', ' ')}</h4>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={simulateOutOfSync} disabled={syncState === 'syncing'}>
                        Simulate Out-of-Sync
                      </Button>
                      <Button size="sm" onClick={attemptSync} disabled={syncState === 'syncing' || syncState === 'synced'}>
                        {syncState === 'syncing' ? 'Syncing...' : 'Sync Now'}
                      </Button>
                      <Button size="sm" variant="outline" onClick={forcePull} disabled={syncState === 'syncing'}>
                        Force Pull
                      </Button>
                    </div>
                  </div>
                  
                  <div className="text-sm text-muted-foreground mb-4">
                    Last sync: {lastSync.toLocaleString()}
                  </div>
                  
                  {syncState === 'out-of-sync' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="text-sm font-medium mb-2 text-yellow-800">Local Changes</h5>
                        <div className="space-y-1">
                          {localChanges.map((change, i) => (
                            <div key={i} className="text-xs p-2 bg-yellow-100 rounded">
                              <div className="font-medium">{change.productId}</div>
                              <div>Quantity: {change.quantity} (by {change.user})</div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h5 className="text-sm font-medium mb-2 text-blue-800">Server Changes</h5>
                        <div className="space-y-1">
                          {serverChanges.map((change, i) => (
                            <div key={i} className="text-xs p-2 bg-blue-100 rounded">
                              <div className="font-medium">{change.productId}</div>
                              <div>Quantity: {change.quantity} (by {change.user})</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {syncState === 'error' && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Failed to synchronize inventory data. Check your connection and try again.
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

export const ConflictResolutionFlow: Story = {
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
      
      interface ConflictData {
        id: string;
        productId: string;
        localValue: number;
        serverValue: number;
        localUser: string;
        serverUser: string;
        timestamp: Date;
        resolved: boolean;
        resolution?: 'local' | 'server' | 'custom' | null;
        finalValue?: number;
      }
      
      const [conflicts, setConflicts] = useState<ConflictData[]>([]);
      const [resolutionStrategy, setResolutionStrategy] = useState<'manual' | 'server-wins' | 'local-wins' | 'merge'>('manual');
      
      const generateConflict = () => {
        const productId = `prod${Math.floor(Math.random() * 3) + 1}`;
        const conflict: ConflictData = {
          id: Date.now().toString(),
          productId,
          localValue: Math.floor(Math.random() * 50) + 10,
          serverValue: Math.floor(Math.random() * 50) + 10,
          localUser: 'You',
          serverUser: ['Alice', 'Bob', 'Carol'][Math.floor(Math.random() * 3)],
          timestamp: new Date(),
          resolved: false,
          resolution: null,
        };
        
        setConflicts(prev => [...prev, conflict]);
        toast.error(`Conflict detected on ${productId}`);
      };
      
      const resolveConflict = (conflictId: string, resolution: 'local' | 'server' | 'custom', customValue?: number) => {
        setConflicts(prev => prev.map(conflict => {
          if (conflict.id === conflictId) {
            const resolvedValue = resolution === 'local' 
              ? conflict.localValue 
              : resolution === 'server' 
              ? conflict.serverValue 
              : customValue || conflict.localValue;
              
            toast.success(`Conflict resolved: using ${resolution === 'custom' ? 'custom' : resolution} value (${resolvedValue})`);
            
            return {
              ...conflict,
              resolved: true,
              resolution,
              finalValue: resolvedValue,
            };
          }
          return conflict;
        }));
      };
      
      const autoResolveAll = () => {
        const unresolvedConflicts = conflicts.filter(c => !c.resolved);
        
        unresolvedConflicts.forEach(conflict => {
          let resolution: 'local' | 'server' | 'custom' = 'server';
          let value = conflict.serverValue;
          
          switch (resolutionStrategy) {
            case 'server-wins':
              resolution = 'server';
              value = conflict.serverValue;
              break;
            case 'local-wins':
              resolution = 'local';
              value = conflict.localValue;
              break;
            case 'merge':
              resolution = 'custom';
              value = Math.max(conflict.localValue, conflict.serverValue);
              break;
          }
          
          setTimeout(() => {
            resolveConflict(conflict.id, resolution, value);
          }, Math.random() * 1000);
        });
        
        if (unresolvedConflicts.length > 0) {
          toast.info(`Auto-resolving ${unresolvedConflicts.length} conflicts using ${resolutionStrategy} strategy`);
        }
      };
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={mockQueryClient}>
          <QueryClientProvider client={mockQueryClient}>
            <BrowserRouter>
              <div className="space-y-4">
                <Card className="p-4">
                  <h4 className="font-medium mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Conflict Resolution Demo
                  </h4>
                  
                  <div className="flex items-center gap-4 mb-4">
                    <Button size="sm" onClick={generateConflict}>
                      Generate Conflict
                    </Button>
                    
                    <select 
                      value={resolutionStrategy} 
                      onChange={(e) => setResolutionStrategy(e.target.value as 'manual' | 'server-wins' | 'local-wins' | 'merge')}
                      className="text-sm border rounded px-2 py-1"
                    >
                      <option value="manual">Manual Resolution</option>
                      <option value="server-wins">Server Wins</option>
                      <option value="local-wins">Local Wins</option>
                      <option value="merge">Merge (Use Highest)</option>
                    </select>
                    
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={autoResolveAll}
                      disabled={conflicts.filter(c => !c.resolved).length === 0}
                    >
                      Auto-Resolve All
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {conflicts.length === 0 && (
                      <div className="text-center text-muted-foreground py-4">
                        No conflicts yet. Click &quot;Generate Conflict&quot; to simulate one.
                      </div>
                    )}
                    
                    {conflicts.slice(-5).map(conflict => (
                      <div key={conflict.id} className={`p-3 border rounded ${
                        conflict.resolved ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium">{conflict.productId}</h5>
                          <Badge variant={conflict.resolved ? 'default' : 'destructive'}>
                            {conflict.resolved ? 'Resolved' : 'Conflict'}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                          <div className="p-2 bg-blue-100 rounded">
                            <div className="font-medium">Local Value</div>
                            <div>{conflict.localValue} (by {conflict.localUser})</div>
                          </div>
                          <div className="p-2 bg-yellow-100 rounded">
                            <div className="font-medium">Server Value</div>
                            <div>{conflict.serverValue} (by {conflict.serverUser})</div>
                          </div>
                        </div>
                        
                        {conflict.resolved ? (
                          <div className="text-sm text-green-700">
                            ✓ Resolved using {conflict.resolution} value: {conflict.finalValue}
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => resolveConflict(conflict.id, 'local')}>
                              Use Local
                            </Button>
                            <Button size="sm" onClick={() => resolveConflict(conflict.id, 'server')}>
                              Use Server
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => {
                              const customValue = prompt('Enter custom value:', Math.max(conflict.localValue, conflict.serverValue).toString());
                              if (customValue && !isNaN(Number(customValue))) {
                                resolveConflict(conflict.id, 'custom', Number(customValue));
                              }
                            }}>
                              Custom Value
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
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
                You&apos;re working offline. Changes will be synced when connection is restored.
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