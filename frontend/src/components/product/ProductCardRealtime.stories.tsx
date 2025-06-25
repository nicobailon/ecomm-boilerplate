import type { Meta, StoryObj } from '@storybook/react-vite';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ProductCardRealtime } from './ProductCardRealtime';
import { trpc } from '@/lib/trpc';
import { createTRPCClient } from '@/lib/trpc-client';
import type { Product } from '@/types';
import { within, userEvent, expect, waitFor } from '@storybook/test';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Progress } from '@/components/ui/Progress';
import { Toaster, toast } from 'sonner';
import { Wifi, WifiOff, AlertCircle, Users, Activity, Zap, AlertTriangle, Shield, CheckCircle2, RefreshCw, Clock, Cloud, CloudOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const mockProduct: Product = {
  _id: 'prod1',
  name: 'Wireless Headphones',
  description: 'Premium noise-cancelling headphones with 30-hour battery life',
  price: 199.99,
  image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
  isFeatured: true,
  slug: 'wireless-headphones',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockProductWithVariants: Product = {
  _id: 'prod2',
  name: 'Smart Watch',
  description: 'Track your fitness and stay connected',
  price: 299.99,
  image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
  isFeatured: false,
  slug: 'smart-watch',
  variants: [
    { variantId: 'v1', label: 'Black', price: 299.99, inventory: 5 },
    { variantId: 'v2', label: 'Silver', price: 299.99, inventory: 3 },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockProductOutOfStock: Product = {
  _id: 'prod3',
  name: 'Limited Edition Sneakers',
  description: 'Exclusive designer collaboration',
  price: 450.00,
  image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500',
  isFeatured: false,
  slug: 'limited-sneakers',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockProductLowStock: Product = {
  _id: 'prod4',
  name: 'Vintage Camera',
  description: 'Classic film camera in mint condition',
  price: 599.99,
  image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500',
  isFeatured: true,
  slug: 'vintage-camera',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Enhanced WebSocket simulation component with bulk updates and connection quality
const EnhancedWebSocketSimulator = ({ 
  onUpdate, 
  onConnectionChange,
  onBulkUpdate,
  onConflict,
}: { 
  onUpdate: (productId: string, stock: number) => void;
  onConnectionChange?: (quality: 'excellent' | 'good' | 'poor' | 'offline') => void;
  onBulkUpdate?: (updates: { productId: string; stock: number }[]) => void;
  onConflict?: (productId: string, localValue: number, serverValue: number) => void;
}) => {
  const [isConnected, setIsConnected] = useState(true);
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor' | 'offline'>('excellent');
  const [latency, setLatency] = useState(50);
  const [packetLoss, setPacketLoss] = useState(0);
  const [activeUsers, setActiveUsers] = useState(1);
  const [bulkMode, setBulkMode] = useState(false);
  const [conflictMode, setConflictMode] = useState(false);

  const simulateStockChange = () => {
    if (!isConnected) return;
    
    const productIds = ['prod1', 'prod2', 'prod3', 'prod4'];
    
    if (bulkMode && onBulkUpdate) {
      // Simulate bulk update
      const updates = productIds.map(id => ({
        productId: id,
        stock: Math.max(0, Math.floor(Math.random() * 50)),
      }));
      
      setTimeout(() => {
        onBulkUpdate(updates);
        toast.success(`Bulk update: ${updates.length} products updated`);
      }, latency);
    } else {
      // Single update
      const productId = productIds[Math.floor(Math.random() * productIds.length)];
      const newStock = Math.max(0, Math.floor(Math.random() * 20));
      
      // Simulate packet loss
      if (Math.random() > packetLoss / 100) {
        setTimeout(() => {
          onUpdate(productId, newStock);
          
          // Simulate conflict
          if (conflictMode && Math.random() > 0.7 && onConflict) {
            const serverStock = Math.max(0, Math.floor(Math.random() * 20));
            onConflict(productId, newStock, serverStock);
          }
        }, latency);
      } else {
        toast.error('Update lost due to poor connection');
      }
    }
  };

  const toggleConnection = () => {
    const newConnected = !isConnected;
    setIsConnected(newConnected);
    
    if (!newConnected) {
      setConnectionQuality('offline');
    } else {
      setConnectionQuality('good');
    }
    
    onConnectionChange?.(newConnected ? 'good' : 'offline');
  };

  const updateConnectionQuality = (quality: 'excellent' | 'good' | 'poor') => {
    if (!isConnected) return;
    
    setConnectionQuality(quality);
    onConnectionChange?.(quality);
    
    // Set network parameters based on quality
    switch (quality) {
      case 'excellent':
        setLatency(50);
        setPacketLoss(0);
        break;
      case 'good':
        setLatency(200);
        setPacketLoss(5);
        break;
      case 'poor':
        setLatency(1000);
        setPacketLoss(20);
        break;
    }
  };

  useEffect(() => {
    // Simulate other users
    if (isConnected && activeUsers > 1) {
      const interval = setInterval(() => {
        const productId = `prod${Math.floor(Math.random() * 4) + 1}`;
        const stock = Math.max(0, Math.floor(Math.random() * 30));
        onUpdate(productId, stock);
      }, 3000 / activeUsers);
      
      return () => clearInterval(interval);
    }
  }, [isConnected, activeUsers, onUpdate]);

  const connectionIcon = {
    excellent: <Wifi className="w-4 h-4 text-green-500" />,
    good: <Activity className="w-4 h-4 text-yellow-500" />,
    poor: <AlertTriangle className="w-4 h-4 text-orange-500" />,
    offline: <WifiOff className="w-4 h-4 text-red-500" />,
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          {connectionIcon[connectionQuality]}
          Advanced WebSocket Simulator
        </h3>
        <Badge variant={isConnected ? 'default' : 'destructive'}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </Badge>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm font-medium mb-2">Connection Controls</p>
          <div className="space-y-2">
            <Button 
              size="sm" 
              variant={isConnected ? 'destructive' : 'default'} 
              onClick={toggleConnection}
              className="w-full"
            >
              {isConnected ? 'Disconnect' : 'Connect'}
            </Button>
            
            {isConnected && (
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant={connectionQuality === 'excellent' ? 'default' : 'outline'}
                  onClick={() => updateConnectionQuality('excellent')}
                  className="flex-1"
                >
                  <Zap className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant={connectionQuality === 'good' ? 'default' : 'outline'}
                  onClick={() => updateConnectionQuality('good')}
                  className="flex-1"
                >
                  <Activity className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant={connectionQuality === 'poor' ? 'default' : 'outline'}
                  onClick={() => updateConnectionQuality('poor')}
                  className="flex-1"
                >
                  <AlertTriangle className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>
        </div>
        
        <div>
          <p className="text-sm font-medium mb-2">Update Controls</p>
          <div className="space-y-2">
            <Button 
              size="sm" 
              onClick={simulateStockChange}
              disabled={!isConnected}
              className="w-full"
            >
              {bulkMode ? 'Bulk Update' : 'Single Update'}
            </Button>
            
            <div className="flex gap-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={bulkMode}
                  onChange={(e) => setBulkMode(e.target.checked)}
                  className="rounded"
                />
                Bulk
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={conflictMode}
                  onChange={(e) => setConflictMode(e.target.checked)}
                  className="rounded"
                />
                Conflicts
              </label>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Latency</p>
          <p className="font-mono">{latency}ms</p>
        </div>
        <div>
          <p className="text-muted-foreground">Packet Loss</p>
          <p className="font-mono">{packetLoss}%</p>
        </div>
        <div>
          <p className="text-muted-foreground">Active Users</p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setActiveUsers(Math.max(1, activeUsers - 1))}
              className="h-6 w-6 p-0"
            >
              -
            </Button>
            <span className="font-mono">{activeUsers}</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setActiveUsers(Math.min(10, activeUsers + 1))}
              className="h-6 w-6 p-0"
            >
              +
            </Button>
          </div>
        </div>
      </div>
      
      {isConnected && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Connection Quality</p>
          <Progress 
            value={connectionQuality === 'excellent' ? 100 : connectionQuality === 'good' ? 66 : 33} 
            className="h-2"
          />
        </div>
      )}
    </Card>
  );
};

// Conflict Resolution Component
const ConflictResolver = ({ 
  conflicts, 
  onResolve, 
}: { 
  conflicts: { productId: string; localValue: number; serverValue: number; timestamp: Date }[];
  onResolve: (productId: string, resolvedValue: number) => void;
}) => {
  if (conflicts.length === 0) return null;
  
  return (
    <AnimatePresence>
      {conflicts.map((conflict) => (
        <motion.div
          key={conflict.productId}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="mb-4"
        >
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">Inventory Conflict Detected</p>
                <p className="text-sm">Product ID: {conflict.productId}</p>
                <div className="flex gap-4 text-sm">
                  <span>Your value: <Badge variant="outline">{conflict.localValue}</Badge></span>
                  <span>Server value: <Badge variant="outline">{conflict.serverValue}</Badge></span>
                </div>
                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => onResolve(conflict.productId, conflict.serverValue)}
                  >
                    <Shield className="w-3 h-3 mr-1" />
                    Use Server Value
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onResolve(conflict.productId, conflict.localValue)}
                  >
                    Keep Local Value
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onResolve(conflict.productId, Math.round((conflict.localValue + conflict.serverValue) / 2))}
                  >
                    Average ({Math.round((conflict.localValue + conflict.serverValue) / 2)})
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        </motion.div>
      ))}
    </AnimatePresence>
  );
};

// Connection Quality Monitor
const ConnectionQualityMonitor = ({ quality }: { quality: 'excellent' | 'good' | 'poor' | 'offline' }) => {
  const qualityConfig = {
    excellent: { color: 'text-green-500', bg: 'bg-green-50', label: 'Excellent', icon: Zap },
    good: { color: 'text-yellow-500', bg: 'bg-yellow-50', label: 'Good', icon: Activity },
    poor: { color: 'text-orange-500', bg: 'bg-orange-50', label: 'Poor', icon: AlertTriangle },
    offline: { color: 'text-red-500', bg: 'bg-red-50', label: 'Offline', icon: WifiOff },
  };
  
  const config = qualityConfig[quality];
  const Icon = config.icon;
  
  return (
    <div className={`rounded-lg p-3 ${config.bg}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${config.color}`} />
          <span className={`font-medium ${config.color}`}>{config.label} Connection</span>
        </div>
        <div className="flex gap-1">
          {[1, 2, 3, 4].map((bar) => (
            <div
              key={bar}
              className={`w-1 h-3 rounded-full transition-all ${
                (quality === 'excellent' && bar <= 4) ||
                (quality === 'good' && bar <= 3) ||
                (quality === 'poor' && bar <= 2)
                  ? config.color.replace('text-', 'bg-')
                  : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const meta = {
  title: 'Product/ProductCardRealtime',
  component: ProductCardRealtime,
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
              <Toaster position="top-right" />
            </BrowserRouter>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
} satisfies Meta<typeof ProductCardRealtime>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    product: mockProduct,
    enableRealtime: true,
  },
  decorators: [
    (Story) => {
      const queryClient = createQueryClient();
      
      // Mock inventory data
      queryClient.setQueryData(['inventory.product', mockProduct._id], {
        productId: mockProduct._id,
        availableStock: 15,
        lowStockThreshold: 5,
        allowBackorder: false,
      });
      
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
};

export const LowStock: Story = {
  args: {
    product: mockProductLowStock,
    enableRealtime: true,
  },
  decorators: [
    (Story) => {
      const queryClient = createQueryClient();
      
      // Mock low inventory
      queryClient.setQueryData(['inventory.product', mockProductLowStock._id], {
        productId: mockProductLowStock._id,
        availableStock: 3,
        lowStockThreshold: 5,
        allowBackorder: false,
      });
      
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
};

export const OutOfStock: Story = {
  args: {
    product: mockProductOutOfStock,
    enableRealtime: true,
  },
  decorators: [
    (Story) => {
      const queryClient = createQueryClient();
      
      // Mock zero inventory
      queryClient.setQueryData(['inventory.product', mockProductOutOfStock._id], {
        productId: mockProductOutOfStock._id,
        availableStock: 0,
        lowStockThreshold: 5,
        allowBackorder: false,
      });
      
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
};

export const RealtimeStockUpdate: Story = {
  args: {
    product: mockProduct,
    enableRealtime: true,
  },
  decorators: [
    (Story) => {
      const queryClient = createQueryClient();
      const [stock, setStock] = useState(10);
      
      useEffect(() => {
        queryClient.setQueryData(['inventory.product', mockProduct._id], {
          productId: mockProduct._id,
          availableStock: stock,
          lowStockThreshold: 5,
          allowBackorder: false,
        });
      }, [stock, queryClient]);
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              <EnhancedWebSocketSimulator onUpdate={(_, stock) => setStock(stock)} />
              <div className="mt-4">
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

export const WithVariants: Story = {
  args: {
    product: mockProductWithVariants,
    enableRealtime: true,
  },
  decorators: [
    (Story) => {
      const queryClient = createQueryClient();
      
      queryClient.setQueryData(['inventory.product', mockProductWithVariants._id], {
        productId: mockProductWithVariants._id,
        availableStock: 8,
        lowStockThreshold: 5,
        allowBackorder: false,
      });
      
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Click add to cart button
    const addButton = canvas.getByRole('button', { name: /select options/i });
    await userEvent.click(addButton);
    
    // Should show info toast
    await waitFor(() => {
      void expect(canvas.getByText(/select options on the product page/i)).toBeInTheDocument();
    });
  },
};

export const ConnectionStates: Story = {
  args: {
    product: mockProduct,
    enableRealtime: true,
  },
  decorators: [
    (Story) => {
      const queryClient = createQueryClient();
      const [isConnected, setIsConnected] = useState(true);
      
      queryClient.setQueryData(['inventory.product', mockProduct._id], {
        productId: mockProduct._id,
        availableStock: 15,
        lowStockThreshold: 5,
        allowBackorder: false,
      });
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold mb-2">Connection Status Demo</h3>
                  <Button 
                    size="sm" 
                    variant={isConnected ? 'destructive' : 'default'}
                    onClick={() => setIsConnected(!isConnected)}
                  >
                    {isConnected ? 'Simulate Disconnect' : 'Simulate Reconnect'}
                  </Button>
                </div>
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

export const HoverInteractions: Story = {
  args: {
    product: mockProduct,
    enableRealtime: true,
  },
  decorators: [
    (Story) => {
      const queryClient = createQueryClient();
      
      queryClient.setQueryData(['inventory.product', mockProduct._id], {
        productId: mockProduct._id,
        availableStock: 15,
        lowStockThreshold: 5,
        allowBackorder: false,
      });
      
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Hover over card to show quick actions
    const card = canvas.getByRole('article');
    await userEvent.hover(card);
    
    // Wishlist button should appear
    await waitFor(() => {
      const wishlistButton = canvas.getByRole('button', { name: /add to wishlist/i });
      void expect(wishlistButton).toBeVisible();
    });
    
    // Click wishlist
    const wishlistButton = canvas.getByRole('button', { name: /add to wishlist/i });
    await userEvent.click(wishlistButton);
    
    // Should show coming soon toast
    await waitFor(() => {
      void expect(canvas.getByText(/wishlist feature coming soon/i)).toBeInTheDocument();
    });
  },
};

export const QuickAddToCart: Story = {
  args: {
    product: mockProduct,
    enableRealtime: true,
  },
  decorators: [
    (Story) => {
      const queryClient = createQueryClient();
      
      queryClient.setQueryData(['inventory.product', mockProduct._id], {
        productId: mockProduct._id,
        availableStock: 15,
        lowStockThreshold: 5,
        allowBackorder: false,
      });
      
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Click add to cart
    const addButton = canvas.getByRole('button', { name: /add to cart/i });
    await userEvent.click(addButton);
    
    // Button should show loading state
    await waitFor(() => {
      void expect(canvas.getByText(/adding/i)).toBeInTheDocument();
    });
  },
};

export const DisabledRealtime: Story = {
  args: {
    product: mockProduct,
    enableRealtime: false,
  },
  decorators: [
    (Story) => {
      const queryClient = createQueryClient();
      
      queryClient.setQueryData(['inventory.product', mockProduct._id], {
        productId: mockProduct._id,
        availableStock: 15,
        lowStockThreshold: 5,
        allowBackorder: false,
      });
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Real-time updates are disabled. Stock status won&apos;t update automatically.
                  </p>
                </div>
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

export const PriceUpdate: Story = {
  args: {
    product: mockProduct,
    enableRealtime: true,
  },
  decorators: [
    () => {
      const queryClient = createQueryClient();
      const [price, setPrice] = useState(mockProduct.price);
      
      const productWithDynamicPrice = {
        ...mockProduct,
        price,
      };
      
      queryClient.setQueryData(['inventory.product', mockProduct._id], {
        productId: mockProduct._id,
        availableStock: 15,
        lowStockThreshold: 5,
        allowBackorder: false,
      });
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold mb-2">Dynamic Pricing Demo</h3>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => setPrice(p => p * 0.8)}>
                      20% Off
                    </Button>
                    <Button size="sm" onClick={() => setPrice(p => p * 1.1)}>
                      10% Increase
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setPrice(mockProduct.price)}>
                      Reset
                    </Button>
                  </div>
                </div>
                <ProductCardRealtime product={productWithDynamicPrice} enableRealtime />
              </div>
              <Toaster position="top-right" />
            </BrowserRouter>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
};

// Network Error Scenarios
export const OfflineMode: Story = {
  args: {
    product: mockProduct,
    enableRealtime: true,
  },
  decorators: [
    () => {
      const queryClient = createQueryClient();
      const [isOnline, setIsOnline] = useState(navigator.onLine);
      const [queuedUpdates, setQueuedUpdates] = useState<{id: string, data: any}[]>([]);
      
      queryClient.setQueryData(['inventory.product', mockProduct._id], {
        productId: mockProduct._id,
        availableStock: 8,
        lowStockThreshold: 5,
        allowBackorder: false,
      });
      
      const simulateOffline = () => {
        setIsOnline(false);
        toast.info('Connection lost - entering offline mode');
        
        // Simulate queued updates
        const update = { id: Date.now().toString(), data: { stock: 3, timestamp: new Date() } };
        setQueuedUpdates(prev => [...prev, update]);
      };
      
      const simulateOnline = () => {
        setIsOnline(true);
        toast.success('Connection restored - syncing queued updates');
        
        // Process queued updates
        setTimeout(() => {
          setQueuedUpdates([]);
          toast.success(`${queuedUpdates.length} updates synced`);
        }, 1500);
      };
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              <div className="space-y-4">
                <Card className={`p-4 ${
                  isOnline 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-orange-200 bg-orange-50'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {isOnline ? (
                        <><Cloud className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium">Online</span></>
                      ) : (
                        <><CloudOff className="w-4 h-4 text-orange-600" />
                        <span className="text-sm font-medium">Offline Mode</span></>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={simulateOffline} disabled={!isOnline}>
                        Go Offline
                      </Button>
                      <Button size="sm" onClick={simulateOnline} disabled={isOnline}>
                        Reconnect
                      </Button>
                    </div>
                  </div>
                  
                  {!isOnline && queuedUpdates.length > 0 && (
                    <div className="text-sm text-orange-700">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {queuedUpdates.length} updates queued for sync
                      </div>
                    </div>
                  )}
                </Card>
                
                <ProductCardRealtime product={mockProduct} enableRealtime />
              </div>
              <Toaster position="top-right" />
            </BrowserRouter>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
};

export const TimeoutHandling: Story = {
  args: {
    product: mockProduct,
    enableRealtime: true,
  },
  decorators: [
    () => {
      const queryClient = createQueryClient();
      const [isLoading, setIsLoading] = useState(false);
      const [hasTimedOut, setHasTimedOut] = useState(false);
      const [retryCount, setRetryCount] = useState(0);
      
      const simulateTimeout = () => {
        setIsLoading(true);
        setHasTimedOut(false);
        
        // Simulate long loading that times out
        setTimeout(() => {
          setIsLoading(false);
          setHasTimedOut(true);
          setRetryCount(prev => prev + 1);
          toast.error('Request timed out after 10 seconds');
        }, 3000);
      };
      
      const retryRequest = () => {
        setHasTimedOut(false);
        if (retryCount < 3) {
          simulateTimeout();
        } else {
          toast.success('Request succeeded on retry');
          setRetryCount(0);
        }
      };
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              <div className="space-y-4">
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">Timeout Simulation</h4>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={simulateTimeout} disabled={isLoading}>
                        {isLoading ? (
                          <><RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                          Loading...</>
                        ) : (
                          'Test Timeout'
                        )}
                      </Button>
                      {hasTimedOut && (
                        <Button size="sm" variant="outline" onClick={retryRequest}>
                          Retry ({retryCount}/3)
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {isLoading && (
                    <div className="text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        Waiting for server response...
                      </div>
                    </div>
                  )}
                  
                  {hasTimedOut && (
                    <Alert variant="destructive" className="mt-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Request timed out. The server may be overloaded or unreachable.
                      </AlertDescription>
                    </Alert>
                  )}
                </Card>
                
                <ProductCardRealtime product={mockProduct} enableRealtime />
              </div>
              <Toaster position="top-right" />
            </BrowserRouter>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
};

export const PartialDataLoading: Story = {
  args: {
    product: mockProduct,
    enableRealtime: true,
  },
  decorators: [
    () => {
      const queryClient = createQueryClient();
      const [dataStage, setDataStage] = useState(0);
      
      const stages = [
        { name: 'Basic Info', data: { productId: mockProduct._id } },
        { name: 'Stock Info', data: { productId: mockProduct._id, availableStock: 12 } },
        { name: 'Full Data', data: { 
          productId: mockProduct._id, 
          availableStock: 12, 
          lowStockThreshold: 5,
          allowBackorder: false, 
        }},
      ];
      
      const loadNextStage = () => {
        if (dataStage < stages.length - 1) {
          const nextStage = dataStage + 1;
          setDataStage(nextStage);
          
          queryClient.setQueryData(['inventory.product', mockProduct._id], stages[nextStage].data);
          toast.info(`Loaded: ${stages[nextStage].name}`);
        }
      };
      
      const resetData = () => {
        setDataStage(0);
        queryClient.removeQueries({ queryKey: ['inventory.product', mockProduct._id] });
      };
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              <div className="space-y-4">
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">Partial Data Loading</h4>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={loadNextStage} disabled={dataStage >= stages.length - 1}>
                        Load Next
                      </Button>
                      <Button size="sm" variant="outline" onClick={resetData}>
                        Reset
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm">Loading Progress:</div>
                    <Progress value={(dataStage + 1) / stages.length * 100} className="h-2" />
                    <div className="flex gap-2">
                      {stages.map((stage, i) => (
                        <Badge key={i} variant={i <= dataStage ? 'default' : 'secondary'}>
                          {stage.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </Card>
                
                <ProductCardRealtime product={mockProduct} enableRealtime />
              </div>
              <Toaster position="top-right" />
            </BrowserRouter>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
};

export const RetryMechanism: Story = {
  args: {
    product: mockProduct,
    enableRealtime: true,
  },
  decorators: [
    () => {
      const queryClient = createQueryClient();
      const [failureCount, setFailureCount] = useState(0);
      const [isRetrying, setIsRetrying] = useState(false);
      const [retryStrategy, setRetryStrategy] = useState<'exponential' | 'linear' | 'immediate'>('exponential');
      
      const attemptRequest = () => {
        setIsRetrying(true);
        
        const shouldFail = failureCount < 2;
        const delay = retryStrategy === 'exponential' 
          ? Math.pow(2, failureCount) * 1000
          : retryStrategy === 'linear'
          ? (failureCount + 1) * 1000
          : 500;
          
        setTimeout(() => {
          if (shouldFail) {
            setFailureCount(prev => prev + 1);
            toast.error(`Attempt ${failureCount + 1} failed - retrying in ${delay/1000}s`);
            attemptRequest();
          } else {
            setIsRetrying(false);
            setFailureCount(0);
            queryClient.setQueryData(['inventory.product', mockProduct._id], {
              productId: mockProduct._id,
              availableStock: 7,
              lowStockThreshold: 5,
              allowBackorder: false,
            });
            toast.success('Request succeeded!');
          }
        }, delay);
      };
      
      const startRetryDemo = () => {
        setFailureCount(0);
        queryClient.removeQueries({ queryKey: ['inventory.product', mockProduct._id] });
        attemptRequest();
      };
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              <div className="space-y-4">
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">Retry Strategy Demo</h4>
                    <div className="flex gap-2">
                      <select 
                        value={retryStrategy} 
                        onChange={(e) => setRetryStrategy(e.target.value as 'exponential' | 'linear' | 'immediate')}
                        className="text-sm border rounded px-2 py-1"
                      >
                        <option value="exponential">Exponential Backoff</option>
                        <option value="linear">Linear Backoff</option>
                        <option value="immediate">Immediate Retry</option>
                      </select>
                      <Button size="sm" onClick={startRetryDemo} disabled={isRetrying}>
                        {isRetrying ? (
                          <><RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                          Retrying...</>
                        ) : (
                          'Start Demo'
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  {isRetrying && (
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">
                        Retry attempt: {failureCount + 1}/3
                      </div>
                      <Progress value={(failureCount + 1) / 3 * 100} className="h-2" />
                    </div>
                  )}
                </Card>
                
                <ProductCardRealtime product={mockProduct} enableRealtime />
              </div>
              <Toaster position="top-right" />
            </BrowserRouter>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
};

export const LoadingError: Story = {
  args: {
    product: mockProduct,
    enableRealtime: true,
  },
  decorators: [
    (Story) => {
      const queryClient = createQueryClient();
      
      // Don't set inventory data to simulate loading/error
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              <div className="space-y-4">
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <h3 className="font-semibold mb-2 text-destructive">Network Error Simulation</h3>
                  <p className="text-sm text-destructive/80">
                    Inventory data failed to load. Card shows fallback state.
                  </p>
                </div>
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

export const StockDepletionAnimation: Story = {
  args: {
    product: mockProduct,
    enableRealtime: true,
  },
  decorators: [
    (Story) => {
      const queryClient = createQueryClient();
      const [stock, setStock] = useState(5);
      
      useEffect(() => {
        queryClient.setQueryData(['inventory.product', mockProduct._id], {
          productId: mockProduct._id,
          availableStock: stock,
          lowStockThreshold: 5,
          allowBackorder: false,
        });
      }, [stock, queryClient]);
      
      useEffect(() => {
        // Simulate gradual stock depletion
        if (stock > 0) {
          const timer = setTimeout(() => {
            setStock(s => Math.max(0, s - 1));
          }, 2000);
          return () => clearTimeout(timer);
        }
      }, [stock]);
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <h3 className="font-semibold mb-2">Stock Depletion Animation</h3>
                  <p className="text-sm text-muted-foreground">
                    Watch as stock decreases from 5 to 0 automatically
                  </p>
                  <Button size="sm" onClick={() => setStock(5)}>
                    Reset Stock
                  </Button>
                </div>
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

export const Grid: Story = {
  args: {
    product: mockProduct,
    enableRealtime: true,
  },
  decorators: [
    () => {
      const queryClient = createQueryClient();
      
      const products = [
        mockProduct,
        mockProductWithVariants,
        mockProductLowStock,
        mockProductOutOfStock,
      ];
      
      // Set different inventory levels for each product
      queryClient.setQueryData(['inventory.product', mockProduct._id], {
        productId: mockProduct._id,
        availableStock: 15,
        lowStockThreshold: 5,
        allowBackorder: false,
      });
      
      queryClient.setQueryData(['inventory.product', mockProductWithVariants._id], {
        productId: mockProductWithVariants._id,
        availableStock: 8,
        lowStockThreshold: 5,
        allowBackorder: false,
      });
      
      queryClient.setQueryData(['inventory.product', mockProductLowStock._id], {
        productId: mockProductLowStock._id,
        availableStock: 2,
        lowStockThreshold: 5,
        allowBackorder: false,
      });
      
      queryClient.setQueryData(['inventory.product', mockProductOutOfStock._id], {
        productId: mockProductOutOfStock._id,
        availableStock: 0,
        lowStockThreshold: 5,
        allowBackorder: false,
      });
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {products.map((product) => (
                  <ProductCardRealtime 
                    key={product._id} 
                    product={product} 
                    enableRealtime 
                  />
                ))}
              </div>
              <Toaster position="top-right" />
            </BrowserRouter>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
};

// Bulk Update Story
export const BulkInventoryUpdates: Story = {
  args: {
    product: mockProduct,
    enableRealtime: true,
  },
  decorators: [
    () => {
      const queryClient = createQueryClient();
      const [inventoryData, setInventoryData] = useState<Record<string, number>>({
        prod1: 15,
        prod2: 8,
        prod3: 2,
        prod4: 0,
      });
      const [updateCount, setUpdateCount] = useState(0);
      const [lastBulkUpdate, setLastBulkUpdate] = useState<Date | null>(null);
      
      const products = [
        mockProduct,
        mockProductWithVariants,
        mockProductLowStock,
        mockProductOutOfStock,
      ];
      
      // Update query cache when inventory changes
      useEffect(() => {
        Object.entries(inventoryData).forEach(([productId, stock]) => {
          queryClient.setQueryData(['inventory.product', productId], {
            productId,
            availableStock: stock,
            lowStockThreshold: 5,
            allowBackorder: false,
          });
        });
      }, [inventoryData, queryClient]);
      
      const handleBulkUpdate = (updates: { productId: string; stock: number }[]) => {
        const newData = { ...inventoryData };
        updates.forEach(({ productId, stock }) => {
          newData[productId] = stock;
        });
        setInventoryData(newData);
        setUpdateCount(prev => prev + updates.length);
        setLastBulkUpdate(new Date());
      };
      
      const handleSingleUpdate = (productId: string, stock: number) => {
        setInventoryData(prev => ({ ...prev, [productId]: stock }));
        setUpdateCount(prev => prev + 1);
      };
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              <div className="space-y-6">
                <EnhancedWebSocketSimulator
                  onUpdate={handleSingleUpdate}
                  onBulkUpdate={handleBulkUpdate}
                />
                
                <Card className="p-4">
                  <h3 className="font-semibold mb-3">Bulk Update Statistics</h3>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Total Updates</p>
                      <p className="text-2xl font-bold">{updateCount}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Last Bulk Update</p>
                      <p className="font-mono">
                        {lastBulkUpdate ? lastBulkUpdate.toLocaleTimeString() : 'Never'}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Products Updated</p>
                      <div className="flex gap-1 mt-1">
                        {Object.entries(inventoryData).map(([id, stock]) => (
                          <Badge 
                            key={id} 
                            variant={stock === 0 ? 'destructive' : stock < 5 ? 'secondary' : 'default'}
                          >
                            {id.slice(-1)}: {stock}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {products.map((product) => (
                    <ProductCardRealtime 
                      key={product._id} 
                      product={product} 
                      enableRealtime 
                    />
                  ))}
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

// Connection Quality Story
export const ConnectionQualityDemo: Story = {
  args: {
    product: mockProduct,
    enableRealtime: true,
  },
  decorators: [
    () => {
      const queryClient = createQueryClient();
      const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor' | 'offline'>('excellent');
      const [inventoryData, setInventoryData] = useState({ prod1: 15 });
      const [updateHistory, setUpdateHistory] = useState<{ time: Date; quality: string; success: boolean }[]>([]);
      
      useEffect(() => {
        queryClient.setQueryData(['inventory.product', mockProduct._id], {
          productId: mockProduct._id,
          availableStock: inventoryData.prod1,
          lowStockThreshold: 5,
          allowBackorder: false,
        });
      }, [inventoryData, queryClient]);
      
      const handleUpdate = (productId: string, stock: number) => {
        const success = connectionQuality !== 'offline' && Math.random() > (connectionQuality === 'poor' ? 0.3 : 0);
        
        if (success) {
          setInventoryData(prev => ({ ...prev, [productId]: stock }));
        }
        
        setUpdateHistory(prev => [
          { time: new Date(), quality: connectionQuality, success },
          ...prev.slice(0, 9),
        ]);
      };
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              <div className="space-y-6">
                <ConnectionQualityMonitor quality={connectionQuality} />
                
                <EnhancedWebSocketSimulator
                  onUpdate={handleUpdate}
                  onConnectionChange={setConnectionQuality}
                />
                
                <Card className="p-4">
                  <h3 className="font-semibold mb-3">Connection History</h3>
                  <div className="space-y-2">
                    {updateHistory.map((entry, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm">
                        <span className="text-xs text-muted-foreground w-20">
                          {entry.time.toLocaleTimeString()}
                        </span>
                        <Badge variant={entry.quality === 'excellent' ? 'default' : entry.quality === 'poor' ? 'secondary' : 'outline'}>
                          {entry.quality}
                        </Badge>
                        {entry.success ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                    ))}
                    {updateHistory.length === 0 && (
                      <p className="text-sm text-muted-foreground">No update attempts yet</p>
                    )}
                  </div>
                </Card>
                
                <ProductCardRealtime product={mockProduct} enableRealtime />
              </div>
              <Toaster position="top-right" />
            </BrowserRouter>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
};

// Conflict Resolution Story
export const ConflictResolution: Story = {
  args: {
    product: mockProduct,
    enableRealtime: true,
  },
  decorators: [
    () => {
      const queryClient = createQueryClient();
      const [inventoryData, setInventoryData] = useState<Record<string, number>>({
        prod1: 15,
        prod2: 8,
        prod3: 2,
        prod4: 0,
      });
      const [conflicts, setConflicts] = useState<{
        productId: string;
        localValue: number;
        serverValue: number;
        timestamp: Date;
      }[]>([]);
      const [resolutionHistory, setResolutionHistory] = useState<{
        productId: string;
        resolution: string;
        timestamp: Date;
      }[]>([]);
      
      const products = [
        mockProduct,
        mockProductWithVariants,
        mockProductLowStock,
        mockProductOutOfStock,
      ];
      
      useEffect(() => {
        Object.entries(inventoryData).forEach(([productId, stock]) => {
          queryClient.setQueryData(['inventory.product', productId], {
            productId,
            availableStock: stock,
            lowStockThreshold: 5,
            allowBackorder: false,
          });
        });
      }, [inventoryData, queryClient]);
      
      const handleUpdate = (productId: string, stock: number) => {
        setInventoryData(prev => ({ ...prev, [productId]: stock }));
      };
      
      const handleConflict = (productId: string, localValue: number, serverValue: number) => {
        setConflicts(prev => [
          ...prev,
          { productId, localValue, serverValue, timestamp: new Date() },
        ]);
        toast.error(`Conflict detected for Product ${productId.slice(-1)}!`);
      };
      
      const handleResolve = (productId: string, resolvedValue: number) => {
        setInventoryData(prev => ({ ...prev, [productId]: resolvedValue }));
        setConflicts(prev => prev.filter(c => c.productId !== productId));
        setResolutionHistory(prev => [
          {
            productId,
            resolution: `Resolved to ${resolvedValue}`,
            timestamp: new Date(),
          },
          ...prev.slice(0, 4),
        ]);
        toast.success(`Conflict resolved for Product ${productId.slice(-1)}`);
      };
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              <div className="space-y-6">
                <EnhancedWebSocketSimulator
                  onUpdate={handleUpdate}
                  onConflict={handleConflict}
                />
                
                <ConflictResolver conflicts={conflicts} onResolve={handleResolve} />
                
                {resolutionHistory.length > 0 && (
                  <Card className="p-4">
                    <h3 className="font-semibold mb-3">Resolution History</h3>
                    <div className="space-y-2">
                      {resolutionHistory.map((entry, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span>Product {entry.productId.slice(-1)}</span>
                          <span className="text-muted-foreground">{entry.resolution}</span>
                          <span className="text-xs text-muted-foreground">
                            {entry.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {products.map((product) => (
                    <ProductCardRealtime 
                      key={product._id} 
                      product={product} 
                      enableRealtime 
                    />
                  ))}
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

// Multi-User Simulation Story
export const MultiUserSimulation: Story = {
  args: {
    product: mockProduct,
    enableRealtime: true,
  },
  decorators: [
    () => {
      const queryClient = createQueryClient();
      const [inventoryData, setInventoryData] = useState({ prod1: 50 });
      const [userActions, setUserActions] = useState<{
        userId: number;
        action: string;
        timestamp: Date;
        color: string;
      }[]>([]);
      const userColors = ['text-blue-500', 'text-green-500', 'text-purple-500', 'text-orange-500', 'text-pink-500'];
      
      useEffect(() => {
        queryClient.setQueryData(['inventory.product', mockProduct._id], {
          productId: mockProduct._id,
          availableStock: inventoryData.prod1,
          lowStockThreshold: 5,
          allowBackorder: false,
        });
      }, [inventoryData, queryClient]);
      
      const simulateUserAction = (userId: number) => {
        const actions = ['viewed', 'added to cart', 'removed from cart', 'purchased'];
        const action = actions[Math.floor(Math.random() * actions.length)];
        
        if (action === 'purchased') {
          const quantity = Math.floor(Math.random() * 3) + 1;
          setInventoryData(prev => ({ 
            ...prev, 
            prod1: Math.max(0, prev.prod1 - quantity), 
          }));
        }
        
        setUserActions(prev => [
          {
            userId,
            action,
            timestamp: new Date(),
            color: userColors[userId - 1],
          },
          ...prev.slice(0, 9),
        ]);
      };
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              <div className="space-y-6">
                <Card className="p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Multi-User Activity Simulator
                  </h3>
                  <div className="grid grid-cols-5 gap-2 mb-4">
                    {[1, 2, 3, 4, 5].map(userId => (
                      <Button
                        key={userId}
                        size="sm"
                        onClick={() => simulateUserAction(userId)}
                        className={`${userColors[userId - 1].replace('text-', 'bg-').replace('500', '100')} hover:${userColors[userId - 1].replace('text-', 'bg-').replace('500', '200')} text-gray-800`}
                      >
                        User {userId}
                      </Button>
                    ))}
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Recent Activity</p>
                    {userActions.map((action, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm">
                        <span className={`font-medium ${action.color}`}>
                          User {action.userId}
                        </span>
                        <span>{action.action}</span>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {action.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                    {userActions.length === 0 && (
                      <p className="text-sm text-muted-foreground">No activity yet</p>
                    )}
                  </div>
                </Card>
                
                <ProductCardRealtime product={mockProduct} enableRealtime />
                
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Current Stock Level</span>
                    <div className="flex items-center gap-2">
                      <Progress value={(inventoryData.prod1 / 50) * 100} className="w-32" />
                      <Badge variant={inventoryData.prod1 === 0 ? 'destructive' : inventoryData.prod1 < 10 ? 'secondary' : 'default'}>
                        {inventoryData.prod1} / 50
                      </Badge>
                    </div>
                  </div>
                </Card>
              </div>
              <Toaster position="top-right" />
            </BrowserRouter>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
};

// Performance Stress Test
export const PerformanceStressTest: Story = {
  args: {
    product: mockProduct,
    enableRealtime: true,
  },
  decorators: [
    () => {
      const queryClient = createQueryClient();
      const [isStressTesting, setIsStressTesting] = useState(false);
      const [updateRate, setUpdateRate] = useState(1);
      const [metrics, setMetrics] = useState({
        totalUpdates: 0,
        droppedUpdates: 0,
        avgLatency: 0,
        peakLatency: 0,
      });
      const [products] = useState(() => 
        Array.from({ length: 20 }, (_, i) => ({
          ...mockProduct,
          _id: `stress-${i}`,
          name: `Stress Test Product ${i + 1}`,
        })),
      );
      
      useEffect(() => {
        if (!isStressTesting) return;
        
        const interval = setInterval(() => {
          const startTime = Date.now();
          const productId = `stress-${Math.floor(Math.random() * 20)}`;
          const stock = Math.floor(Math.random() * 100);
          
          queryClient.setQueryData(['inventory.product', productId], {
            productId,
            availableStock: stock,
            lowStockThreshold: 5,
            allowBackorder: false,
          });
          
          const latency = Date.now() - startTime;
          setMetrics(prev => ({
            totalUpdates: prev.totalUpdates + 1,
            droppedUpdates: prev.droppedUpdates + (latency > 100 ? 1 : 0),
            avgLatency: (prev.avgLatency * prev.totalUpdates + latency) / (prev.totalUpdates + 1),
            peakLatency: Math.max(prev.peakLatency, latency),
          }));
        }, 1000 / updateRate);
        
        return () => clearInterval(interval);
      }, [isStressTesting, updateRate, queryClient]);
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              <div className="space-y-6">
                <Card className="p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Performance Stress Test
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm font-medium mb-2">Test Controls</p>
                      <div className="space-y-2">
                        <Button
                          size="sm"
                          variant={isStressTesting ? 'destructive' : 'default'}
                          onClick={() => setIsStressTesting(!isStressTesting)}
                          className="w-full"
                        >
                          {isStressTesting ? 'Stop Test' : 'Start Test'}
                        </Button>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-sm">Updates/sec:</span>
                          <input
                            type="range"
                            min="1"
                            max="50"
                            value={updateRate}
                            onChange={(e) => setUpdateRate(Number(e.target.value))}
                            className="flex-1"
                          />
                          <span className="text-sm font-mono w-12">{updateRate}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium mb-2">Performance Metrics</p>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Updates</span>
                          <span className="font-mono">{metrics.totalUpdates}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Dropped</span>
                          <span className="font-mono text-red-500">{metrics.droppedUpdates}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Avg Latency</span>
                          <span className="font-mono">{metrics.avgLatency.toFixed(1)}ms</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Peak Latency</span>
                          <span className="font-mono">{metrics.peakLatency}ms</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {isStressTesting && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Stress testing {products.length} products at {updateRate} updates/second
                      </AlertDescription>
                    </Alert>
                  )}
                </Card>
                
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2">
                  {products.map((product) => (
                    <div key={product._id} className="scale-75">
                      <ProductCardRealtime 
                        product={product} 
                        enableRealtime 
                      />
                    </div>
                  ))}
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