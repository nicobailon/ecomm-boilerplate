import type { Meta, StoryObj } from '@storybook/react-vite';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ProductInfoRealtime } from './ProductInfoRealtime';
import { trpc } from '@/lib/trpc';
import { createTRPCClient } from '@/lib/trpc-client';
import type { Product } from '@/types';
import { useEffect, useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/Progress';
import { Toaster, toast } from 'sonner';
import { Wifi, WifiOff, RefreshCw, AlertCircle, TrendingDown, Users, TrendingUp, Clock, CheckCircle, CloudOff, Cloud, AlertTriangle } from 'lucide-react';
import { withScenario, withEndpointOverrides, withNetworkCondition } from '@/mocks/story-helpers';
import { trpcQuery } from '@/mocks/utils/trpc-mock';

const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const mockProduct: Product = {
  _id: 'prod1',
  name: 'Premium Wireless Headphones',
  description: 'Experience superior sound quality with our premium noise-cancelling wireless headphones. Featuring 30-hour battery life, comfortable over-ear design, and crystal-clear audio.',
  price: 299.99,
  image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
  isFeatured: true,
  slug: 'premium-wireless-headphones',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Unused variable - commented out to fix TypeScript error
/*const mockProductWithVariants: Product = {
  _id: 'prod2',
  name: 'Smart Watch Pro',
  description: 'Advanced fitness tracking, heart rate monitoring, and smartphone integration in a sleek design.',
  price: 399.99,
  image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
  isFeatured: false,
  slug: 'smart-watch-pro',
  variants: [
    {
      variantId: 'v1',
      label: 'Black / 42mm',
      color: '#000000',
      price: 399.99,
      inventory: 15,
      images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500'],
      sku: 'SWP-BLK-42',
    },
    {
      variantId: 'v2',
      label: 'Silver / 42mm',
      color: '#C0C0C0',
      price: 399.99,
      inventory: 3,
      images: ['https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500'],
      sku: 'SWP-SLV-42',
    },
    {
      variantId: 'v3',
      label: 'Gold / 45mm',
      color: '#FFD700',
      price: 449.99,
      inventory: 0,
      images: ['https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=500'],
      sku: 'SWP-GLD-45',
    },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};*/

// Enhanced Real-time Inventory Simulator with Network Handling
const AdvancedInventorySimulator = ({ 
  productId, 
  onUpdate, 
  onConnectionChange,
  scenario = 'normal',
}: { 
  productId: string; 
  onUpdate: (data: any) => void;
  onConnectionChange?: (connected: boolean) => void;
  scenario?: 'normal' | 'rapid' | 'conflict' | 'recovery';
}) => {
  const [connected, setConnected] = useState(true);
  const [currentStock, setCurrentStock] = useState(15);
  const [lowThreshold] = useState(5);
  const [networkLatency, setNetworkLatency] = useState(100);
  const [conflictCount, setConflictCount] = useState(0);
  const [lastSync, setLastSync] = useState(new Date());
  const [users, setUsers] = useState(1);
  const intervalRef = useRef<NodeJS.Timeout>();

  const updateStock = useCallback((newStock: number, source = 'manual') => {
    if (scenario === 'conflict' && Math.random() > 0.7) {
      setConflictCount(prev => prev + 1);
      toast.error('Inventory conflict detected! Another user modified stock.');
      return;
    }

    setCurrentStock(newStock);
    setLastSync(new Date());
    
    const update = {
      productId,
      availableStock: newStock,
      lowStockThreshold: lowThreshold,
      allowBackorder: false,
      restockDate: newStock === 0 ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() : null,
      source,
      timestamp: new Date().toISOString(),
      users: scenario === 'rapid' ? users : 1,
    };

    // Simulate network latency
    setTimeout(() => {
      onUpdate(update);
      if (newStock < lowThreshold && newStock > 0) {
        toast.warning(`Low stock alert! Only ${newStock} units remaining.`);
      } else if (newStock === 0) {
        toast.error('Product is now out of stock!');
      }
    }, networkLatency);
  }, [scenario, productId, lowThreshold, users, networkLatency, onUpdate]);

  const handleConnectionChange = useCallback((newState: boolean) => {
    setConnected(newState);
    onConnectionChange?.(newState);
    
    if (!newState) {
      toast.error('Lost connection to inventory service');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    } else {
      toast.success('Reconnected to inventory service');
      setLastSync(new Date());
    }
  }, [onConnectionChange]);

  // Scenario-specific behaviors
  useEffect(() => {
    if (!connected) return;

    switch (scenario) {
      case 'rapid':
        // Rapid multi-user updates
        intervalRef.current = setInterval(() => {
          const change = Math.floor(Math.random() * 3) - 1; // -1 to +1
          const newStock = Math.max(0, currentStock + change);
          updateStock(newStock, `user${Math.floor(Math.random() * users) + 1}`);
        }, 1000);
        break;
        
      case 'conflict':
        // Occasional conflicts
        intervalRef.current = setInterval(() => {
          if (Math.random() > 0.5) {
            const change = Math.floor(Math.random() * 5) - 2;
            const newStock = Math.max(0, currentStock + change);
            updateStock(newStock, 'system');
          }
        }, 2000);
        break;
        
      case 'recovery':
        // Network recovery simulation
        intervalRef.current = setInterval(() => {
          const isHealthy = Math.random() > 0.3;
          setNetworkLatency(isHealthy ? 100 : 2000);
          if (!isHealthy && connected) {
            handleConnectionChange(false);
            setTimeout(() => handleConnectionChange(true), 3000);
          }
        }, 5000);
        break;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [connected, scenario, currentStock, users, handleConnectionChange, updateStock]);

  return (
    <Card className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Advanced Inventory Simulator</h3>
        <div className="flex items-center gap-2">
          {connected ? <Wifi className="w-4 h-4 text-green-600" /> : <WifiOff className="w-4 h-4 text-red-600" />}
          <span className="text-sm">{connected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>
      
      <Tabs defaultValue="actions" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="actions">Actions</TabsTrigger>
          <TabsTrigger value="status">Status</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="actions" className="space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <Button size="sm" variant="outline" onClick={() => updateStock(20)}>
              Stock: 20
            </Button>
            <Button size="sm" variant="outline" onClick={() => updateStock(5)}>
              Low: 5
            </Button>
            <Button size="sm" variant="outline" onClick={() => updateStock(0)}>
              Out: 0
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => updateStock(Math.max(0, currentStock - 1))}>
              <TrendingDown className="w-4 h-4 mr-1" />
              Sell 1
            </Button>
            <Button size="sm" variant="outline" onClick={() => updateStock(currentStock + 5)}>
              <TrendingUp className="w-4 h-4 mr-1" />
              Restock +5
            </Button>
            <Button 
              size="sm" 
              variant={connected ? 'destructive' : 'default'}
              onClick={() => handleConnectionChange(!connected)}
            >
              {connected ? 'Disconnect' : 'Connect'}
            </Button>
          </div>
        </TabsContent>
        
        <TabsContent value="status" className="space-y-3">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Current Stock</span>
              <Badge variant={currentStock === 0 ? 'destructive' : currentStock < lowThreshold ? 'secondary' : 'default'}>
                {currentStock} units
              </Badge>
            </div>
            <Progress value={(currentStock / 50) * 100} className="h-2" />
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Latency</span>
              <span>{networkLatency}ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Conflicts</span>
              <span className={conflictCount > 0 ? 'text-red-600' : ''}>{conflictCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Sync</span>
              <span>{lastSync.toLocaleTimeString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Active Users</span>
              <span>{users}</span>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="settings" className="space-y-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">Network Latency</label>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setNetworkLatency(0)}>
                Instant
              </Button>
              <Button size="sm" variant="outline" onClick={() => setNetworkLatency(500)}>
                Normal
              </Button>
              <Button size="sm" variant="outline" onClick={() => setNetworkLatency(2000)}>
                Slow
              </Button>
            </div>
          </div>
          
          {scenario === 'rapid' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Simulated Users</label>
              <div className="flex gap-2">
                {[1, 3, 5, 10].map(num => (
                  <Button
                    key={num}
                    size="sm"
                    variant={users === num ? 'default' : 'outline'}
                    onClick={() => setUsers(num)}
                  >
                    <Users className="w-3 h-3 mr-1" />
                    {num}
                  </Button>
                ))}
              </div>
            </div>
          )}
          
          <div className="pt-2">
            <p className="text-xs text-muted-foreground">
              Scenario: <Badge variant="outline">{scenario}</Badge>
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
};

// Network Health Monitor Component
const NetworkHealthMonitor = ({ isConnected }: { isConnected: boolean }) => {
  const [history, setHistory] = useState<boolean[]>(Array(10).fill(true));
  const [uptime, setUptime] = useState(100);
  
  useEffect(() => {
    setHistory(prev => [...prev.slice(1), isConnected]);
    const connectedCount = history.filter(Boolean).length;
    setUptime((connectedCount / history.length) * 100);
  }, [isConnected, history]);
  
  return (
    <Card className="p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">Network Health</span>
        <Badge variant={uptime > 90 ? 'default' : uptime > 70 ? 'secondary' : 'destructive'}>
          {uptime.toFixed(0)}% uptime
        </Badge>
      </div>
      <div className="flex gap-1">
        {history.map((connected, i) => (
          <div
            key={i}
            className={`flex-1 h-8 rounded ${
              connected ? 'bg-green-500' : 'bg-red-500'
            }`}
            style={{ opacity: 0.3 + (i / history.length) * 0.7 }}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground mt-2">
        Last 10 connection states
      </p>
    </Card>
  );
};

const meta = {
  title: 'Product/ProductInfoRealtime',
  component: ProductInfoRealtime,
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
              <div className="max-w-2xl mx-auto">
                <Story />
              </div>
              <Toaster position="top-right" />
            </BrowserRouter>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
} satisfies Meta<typeof ProductInfoRealtime>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    product: mockProduct,
    selectedVariant: null,
  },
  ...(withScenario('default') as Partial<Story>),
};

export const ComplexInventoryScenarios: Story = {
  args: {
    product: mockProduct,
    selectedVariant: null,
  },
  decorators: [
    (Story) => {
      const queryClient = createQueryClient();
      const [inventoryData, setInventoryData] = useState({
        productId: mockProduct._id,
        availableStock: 15,
        lowStockThreshold: 5,
        allowBackorder: false,
      });
      const [isConnected, setIsConnected] = useState(true);
      const [scenario, setScenario] = useState<'normal' | 'rapid' | 'conflict' | 'recovery'>('normal');
      
      useEffect(() => {
        queryClient.setQueryData(['inventory.product', mockProduct._id], inventoryData);
      }, [inventoryData, queryClient]);
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <AdvancedInventorySimulator 
                    productId={mockProduct._id} 
                    onUpdate={setInventoryData}
                    onConnectionChange={setIsConnected}
                    scenario={scenario}
                  />
                  <div className="space-y-4">
                    <Card className="p-4">
                      <h4 className="font-medium mb-3">Scenario Selection</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          size="sm"
                          variant={scenario === 'normal' ? 'default' : 'outline'}
                          onClick={() => setScenario('normal')}
                        >
                          Normal
                        </Button>
                        <Button
                          size="sm"
                          variant={scenario === 'rapid' ? 'default' : 'outline'}
                          onClick={() => setScenario('rapid')}
                        >
                          Rapid Updates
                        </Button>
                        <Button
                          size="sm"
                          variant={scenario === 'conflict' ? 'default' : 'outline'}
                          onClick={() => setScenario('conflict')}
                        >
                          Conflicts
                        </Button>
                        <Button
                          size="sm"
                          variant={scenario === 'recovery' ? 'default' : 'outline'}
                          onClick={() => setScenario('recovery')}
                        >
                          Recovery
                        </Button>
                      </div>
                    </Card>
                    <NetworkHealthMonitor isConnected={isConnected} />
                  </div>
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
  ...(withEndpointOverrides([
    trpcQuery('inventory.product', async ({ productId }: any) => {
      // Simulate variable response times
      const delay = Math.random() * 1000 + 200;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return {
        productId,
        availableStock: Math.floor(Math.random() * 20) + 5,
        lowStockThreshold: 5,
        allowBackorder: false,
      };
    }),
  ]) as Partial<Story>),
};

export const NetworkDisconnection: Story = {
  args: {
    product: mockProduct,
    selectedVariant: null,
  },
  decorators: [
    (Story) => {
      const queryClient = createQueryClient();
      const [isOnline, setIsOnline] = useState(true);
      const [reconnectAttempt, setReconnectAttempt] = useState(0);
      
      const simulateDisconnection = () => {
        setIsOnline(false);
        toast.error('Network connection lost');
        
        // Simulate reconnection attempts
        let attempt = 0;
        const tryReconnect = setInterval(() => {
          attempt++;
          setReconnectAttempt(attempt);
          
          if (attempt >= 3) {
            clearInterval(tryReconnect);
            setIsOnline(true);
            setReconnectAttempt(0);
            toast.success('Connection restored');
          } else {
            toast.loading(`Reconnecting... (Attempt ${attempt}/3)`);
          }
        }, 2000);
      };
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              <div className="space-y-6">
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Network Simulation</h3>
                    <Badge variant={isOnline ? 'default' : 'destructive'}>
                      {isOnline ? 'Online' : 'Offline'}
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    <Button
                      onClick={simulateDisconnection}
                      disabled={!isOnline}
                      className="w-full"
                    >
                      <WifiOff className="w-4 h-4 mr-2" />
                      Simulate Disconnection
                    </Button>
                    
                    {reconnectAttempt > 0 && (
                      <Alert>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <AlertDescription>
                          Reconnection attempt {reconnectAttempt} of 3...
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {!isOnline && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Network connection lost. Some features may be unavailable.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </Card>
                
                <div style={{ opacity: isOnline ? 1 : 0.5 }}>
                  <Story />
                </div>
              </div>
              <Toaster position="top-right" />
            </BrowserRouter>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
  ...(withNetworkCondition('offline') as Partial<Story>),
};

export const PriceFluctuations: Story = {
  args: {
    product: mockProduct,
    selectedVariant: null,
  },
  decorators: [
    () => {
      const queryClient = createQueryClient();
      const [currentPrice, setCurrentPrice] = useState(mockProduct.price);
      const [priceHistory, setPriceHistory] = useState<number[]>([mockProduct.price]);
      const [isPriceVolatile, setIsPriceVolatile] = useState(false);
      
      useEffect(() => {
        if (!isPriceVolatile) return;
        
        const interval = setInterval(() => {
          const change = (Math.random() - 0.5) * 20; // ±$10 range
          const newPrice = Math.max(250, Math.min(350, currentPrice + change));
          setCurrentPrice(newPrice);
          setPriceHistory(prev => [...prev.slice(-19), newPrice]);
          
          if (Math.abs(newPrice - mockProduct.price) > 30) {
            toast.info(`Price ${newPrice > mockProduct.price ? 'increased' : 'decreased'} significantly!`);
          }
        }, 2000);
        
        return () => clearInterval(interval);
      }, [isPriceVolatile, currentPrice]);
      
      const dynamicProduct = {
        ...mockProduct,
        price: currentPrice,
      };
      
      queryClient.setQueryData(['inventory.product', mockProduct._id], {
        productId: mockProduct._id,
        availableStock: 20,
        lowStockThreshold: 5,
        allowBackorder: false,
      });
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              <div className="space-y-6">
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Dynamic Pricing Simulator</h3>
                    <Button
                      size="sm"
                      variant={isPriceVolatile ? 'destructive' : 'default'}
                      onClick={() => setIsPriceVolatile(!isPriceVolatile)}
                    >
                      {isPriceVolatile ? 'Stop' : 'Start'} Fluctuations
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Current Price</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-lg font-bold">
                          ${currentPrice.toFixed(2)}
                        </Badge>
                        {currentPrice !== mockProduct.price && (
                          <span className={`text-xs ${currentPrice > mockProduct.price ? 'text-green-600' : 'text-red-600'}`}>
                            {currentPrice > mockProduct.price ? '+' : ''}{(currentPrice - mockProduct.price).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="h-20 flex items-end gap-1">
                      {priceHistory.map((price, i) => {
                        const height = ((price - 250) / 100) * 100; // Normalize to 0-100%
                        return (
                          <div
                            key={i}
                            className="flex-1 bg-primary transition-all duration-300"
                            style={{ 
                              height: `${height}%`,
                              opacity: 0.2 + (i / priceHistory.length) * 0.8,
                            }}
                          />
                        );
                      })}
                    </div>
                    
                    <p className="text-xs text-muted-foreground">
                      Price range: $250 - $350 | Base price: ${mockProduct.price}
                    </p>
                  </div>
                </Card>
                
                <ProductInfoRealtime product={dynamicProduct} selectedVariant={null} />
              </div>
              <Toaster position="top-right" />
            </BrowserRouter>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
};

export const InventoryConflictResolution: Story = {
  args: {
    product: mockProduct,
    selectedVariant: null,
  },
  decorators: [
    (Story) => {
      const queryClient = createQueryClient();
      const [conflicts, setConflicts] = useState<{
        id: string;
        timestamp: Date;
        user: string;
        attempted: number;
        actual: number;
      }[]>([]);
      
      const handleAddToCart = async (quantity: number) => {
        // Simulate conflict scenario
        const serverStock = Math.floor(Math.random() * 10) + 1;
        
        if (quantity > serverStock) {
          const conflict = {
            id: Math.random().toString(36).substring(7),
            timestamp: new Date(),
            user: `User${Math.floor(Math.random() * 5) + 1}`,
            attempted: quantity,
            actual: serverStock,
          };
          
          setConflicts(prev => [...prev, conflict]);
          
          toast.error(
            `Inventory conflict! Requested ${quantity} but only ${serverStock} available.`,
            {
              action: {
                label: 'Add Available',
                onClick: () => toast.success(`Added ${serverStock} to cart`),
              },
            },
          );
          
          // Update local state with server truth
          queryClient.setQueryData(['inventory.product', mockProduct._id], {
            productId: mockProduct._id,
            availableStock: serverStock,
            lowStockThreshold: 5,
            allowBackorder: false,
          });
        }
      };
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              <div className="space-y-6">
                <Card className="p-4">
                  <h3 className="font-semibold mb-4">Conflict Resolution Demo</h3>
                  
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Simulate inventory conflicts when multiple users try to purchase limited stock
                    </p>
                    
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleAddToCart(5)}>
                        Try to Buy 5
                      </Button>
                      <Button size="sm" onClick={() => handleAddToCart(10)}>
                        Try to Buy 10
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setConflicts([])}>
                        Clear History
                      </Button>
                    </div>
                    
                    {conflicts.length > 0 && (
                      <div className="space-y-2 mt-4">
                        <h4 className="text-sm font-medium">Conflict History</h4>
                        {conflicts.slice(-3).reverse().map(conflict => (
                          <div key={conflict.id} className="text-xs p-2 bg-muted rounded">
                            <div className="flex justify-between">
                              <span>{conflict.user}</span>
                              <span>{conflict.timestamp.toLocaleTimeString()}</span>
                            </div>
                            <p className="text-muted-foreground">
                              Requested {conflict.attempted}, got {conflict.actual}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
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
  ...(withScenario('conflicts') as Partial<Story>),
};

export const OutOfSyncRecovery: Story = {
  args: {
    product: mockProduct,
    selectedVariant: null,
  },
  decorators: [
    (Story) => {
      const queryClient = createQueryClient();
      const [localStock, setLocalStock] = useState(15);
      const [serverStock, setServerStock] = useState(15);
      const [isSynced, setIsSynced] = useState(true);
      const [syncHistory, setSyncHistory] = useState<{
        timestamp: Date;
        local: number;
        server: number;
        action: string;
      }[]>([]);
      
      const createDesync = () => {
        const newServerStock = Math.floor(Math.random() * 20) + 1;
        setServerStock(newServerStock);
        setIsSynced(false);
        
        setSyncHistory(prev => [...prev, {
          timestamp: new Date(),
          local: localStock,
          server: newServerStock,
          action: 'Desync created',
        }]);
        
        toast.warning('Local inventory out of sync with server!');
      };
      
      const autoRecover = async () => {
        toast.loading('Syncing with server...');
        
        // Simulate recovery process
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setLocalStock(serverStock);
        setIsSynced(true);
        
        setSyncHistory(prev => [...prev, {
          timestamp: new Date(),
          local: serverStock,
          server: serverStock,
          action: 'Auto-recovered',
        }]);
        
        queryClient.setQueryData(['inventory.product', mockProduct._id], {
          productId: mockProduct._id,
          availableStock: serverStock,
          lowStockThreshold: 5,
          allowBackorder: false,
        });
        
        toast.success('Inventory synced successfully!');
      };
      
      useEffect(() => {
        queryClient.setQueryData(['inventory.product', mockProduct._id], {
          productId: mockProduct._id,
          availableStock: localStock,
          lowStockThreshold: 5,
          allowBackorder: false,
        });
      }, [localStock, queryClient]);
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              <div className="space-y-6">
                <Card className="p-4">
                  <h3 className="font-semibold mb-4">Out-of-Sync Recovery</h3>
                  
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Local Stock</span>
                        <Badge variant="outline">{localStock}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Server Stock</span>
                        <Badge variant={isSynced ? 'outline' : 'destructive'}>{serverStock}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Sync Status</span>
                        <Badge variant={isSynced ? 'default' : 'destructive'}>
                          {isSynced ? 'Synced' : 'Out of Sync'}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Button 
                        size="sm" 
                        onClick={createDesync}
                        disabled={!isSynced}
                        className="w-full"
                      >
                        Create Desync
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={autoRecover}
                        disabled={isSynced}
                        variant="default"
                        className="w-full"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Auto Recover
                      </Button>
                    </div>
                  </div>
                  
                  {syncHistory.length > 0 && (
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium">Sync History</h4>
                      {syncHistory.slice(-3).reverse().map((event, i) => (
                        <div key={i} className="text-xs p-2 bg-muted rounded">
                          <div className="flex justify-between">
                            <span>{event.action}</span>
                            <span>{event.timestamp.toLocaleTimeString()}</span>
                          </div>
                          <p className="text-muted-foreground">
                            Local: {event.local} → Server: {event.server}
                          </p>
                        </div>
                      ))}
                    </div>
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

export const InventoryStressTest: Story = {
  args: {
    product: mockProduct,
    selectedVariant: null,
  },
  decorators: [
    (Story) => {
      const queryClient = createQueryClient();
      const [isStressTesting, setIsStressTesting] = useState(false);
      const [metrics, setMetrics] = useState({
        updates: 0,
        conflicts: 0,
        latency: 0,
        startTime: null as Date | null,
      });
      
      const runStressTest = () => {
        setIsStressTesting(true);
        setMetrics({
          updates: 0,
          conflicts: 0,
          latency: 0,
          startTime: new Date(),
        });
        
        // Simulate rapid concurrent updates
        const interval = setInterval(() => {
          const stock = Math.floor(Math.random() * 50);
          const startTime = Date.now();
          
          queryClient.setQueryData(['inventory.product', mockProduct._id], {
            productId: mockProduct._id,
            availableStock: stock,
            lowStockThreshold: 5,
            allowBackorder: false,
          });
          
          const latency = Date.now() - startTime;
          
          setMetrics(prev => ({
            ...prev,
            updates: prev.updates + 1,
            conflicts: prev.conflicts + (Math.random() > 0.8 ? 1 : 0),
            latency: (prev.latency + latency) / 2,
          }));
        }, 100);
        
        // Stop after 10 seconds
        setTimeout(() => {
          clearInterval(interval);
          setIsStressTesting(false);
          toast.success('Stress test completed!');
        }, 10000);
      };
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              <div className="space-y-6">
                <Card className="p-4">
                  <h3 className="font-semibold mb-4">Inventory Stress Test</h3>
                  
                  <div className="space-y-4">
                    <Button
                      onClick={runStressTest}
                      disabled={isStressTesting}
                      className="w-full"
                    >
                      {isStressTesting ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Running Stress Test...
                        </>
                      ) : (
                        'Start 10-Second Stress Test'
                      )}
                    </Button>
                    
                    {metrics.startTime && (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Updates/sec</p>
                          <p className="text-2xl font-bold">
                            {isStressTesting ? '~10' : (metrics.updates / 10).toFixed(1)}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Conflicts</p>
                          <p className="text-2xl font-bold">{metrics.conflicts}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Avg Latency</p>
                          <p className="text-2xl font-bold">{metrics.latency.toFixed(0)}ms</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Duration</p>
                          <p className="text-2xl font-bold">
                            {isStressTesting ? (
                              <Clock className="w-6 h-6 animate-pulse" />
                            ) : (
                              '10s'
                            )}
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {isStressTesting && (
                      <Progress value={metrics.updates % 100} className="h-2" />
                    )}
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

// Network Error Scenarios for ProductInfo
export const NetworkTimeoutRecovery: Story = {
  args: {
    product: mockProduct,
    selectedVariant: null,
  },
  decorators: [
    () => {
      const queryClient = createQueryClient();
      const [networkState, setNetworkState] = useState<'connected' | 'timeout' | 'recovering'>('connected');
      const [timeoutCount, setTimeoutCount] = useState(0);
      
      const simulateTimeout = () => {
        setNetworkState('timeout');
        setTimeoutCount(prev => prev + 1);
        toast.error('Network timeout - retrying...');
        
        setTimeout(() => {
          setNetworkState('recovering');
          toast.info('Attempting to reconnect...');
          
          setTimeout(() => {
            setNetworkState('connected');
            queryClient.setQueryData(['inventory.product', mockProduct._id], {
              productId: mockProduct._id,
              availableStock: 8,
              lowStockThreshold: 5,
              allowBackorder: false,
            });
            toast.success('Connection restored!');
          }, 2000);
        }, 1500);
      };
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              <div className="space-y-4">
                <Card className={`p-4 border-2 ${
                  networkState === 'connected' ? 'border-green-200 bg-green-50' :
                  networkState === 'timeout' ? 'border-red-200 bg-red-50' :
                  'border-yellow-200 bg-yellow-50'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {networkState === 'connected' && <CheckCircle className="w-4 h-4 text-green-600" />}
                      {networkState === 'timeout' && <AlertCircle className="w-4 h-4 text-red-600" />}
                      {networkState === 'recovering' && <RefreshCw className="w-4 h-4 text-yellow-600 animate-spin" />}
                      <span className="font-medium capitalize">{networkState}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-sm text-muted-foreground">Timeouts: {timeoutCount}</span>
                      <Button size="sm" onClick={simulateTimeout} disabled={networkState !== 'connected'}>
                        Simulate Timeout
                      </Button>
                    </div>
                  </div>
                  
                  {networkState === 'timeout' && (
                    <Alert variant="destructive" className="mt-3">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Unable to load inventory data. Some features may be limited.
                      </AlertDescription>
                    </Alert>
                  )}
                </Card>
                
                <ProductInfoRealtime product={mockProduct} selectedVariant={null} />
              </div>
              <Toaster position="top-right" />
            </BrowserRouter>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
};

export const OfflineQueueManagement: Story = {
  args: {
    product: mockProduct,
    selectedVariant: null,
  },
  decorators: [
    () => {
      const queryClient = createQueryClient();
      const [isOffline, setIsOffline] = useState(false);
      const [queuedActions, setQueuedActions] = useState<{id: string, action: string, data: any, timestamp: Date}[]>([]);
      
      const queueAction = (action: string, data: any) => {
        const queueItem = {
          id: Date.now().toString(),
          action,
          data,
          timestamp: new Date(),
        };
        setQueuedActions(prev => [...prev, queueItem]);
        toast.info(`Queued: ${action}`);
      };
      
      const goOffline = () => {
        setIsOffline(true);
        toast.warning('Connection lost - actions will be queued');
      };
      
      const goOnline = () => {
        setIsOffline(false);
        toast.success(`Reconnected - processing ${queuedActions.length} queued actions`);
        
        // Process queued actions
        queuedActions.forEach((item, index) => {
          setTimeout(() => {
            toast.success(`Processed: ${item.action}`);
            if (index === queuedActions.length - 1) {
              setQueuedActions([]);
            }
          }, (index + 1) * 500);
        });
      };
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              <div className="space-y-4">
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {isOffline ? (
                        <><CloudOff className="w-4 h-4 text-orange-600" />
                        <span className="font-medium">Offline Mode</span></>
                      ) : (
                        <><Cloud className="w-4 h-4 text-green-600" />
                        <span className="font-medium">Online</span></>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={goOffline} disabled={isOffline}>
                        Go Offline
                      </Button>
                      <Button size="sm" onClick={goOnline} disabled={!isOffline}>
                        Reconnect
                      </Button>
                    </div>
                  </div>
                  
                  {isOffline && (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => queueAction('Add to Cart', { quantity: 1 })}>
                          Queue: Add to Cart
                        </Button>
                        <Button size="sm" onClick={() => queueAction('Update Quantity', { quantity: 2 })}>
                          Queue: Update Qty
                        </Button>
                        <Button size="sm" onClick={() => queueAction('Remove Item', {})}>
                          Queue: Remove
                        </Button>
                      </div>
                      
                      {queuedActions.length > 0 && (
                        <div className="mt-3">
                          <h4 className="text-sm font-medium mb-2">Queued Actions ({queuedActions.length})</h4>
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {queuedActions.map(item => (
                              <div key={item.id} className="text-xs p-2 bg-muted rounded flex justify-between">
                                <span>{item.action}</span>
                                <span className="text-muted-foreground">
                                  {item.timestamp.toLocaleTimeString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
                
                <ProductInfoRealtime product={mockProduct} selectedVariant={null} />
              </div>
              <Toaster position="top-right" />
            </BrowserRouter>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
};

export const GradualDataDegradation: Story = {
  args: {
    product: mockProduct,
    selectedVariant: null,
  },
  decorators: [
    () => {
      const queryClient = createQueryClient();
      const [dataQuality, setDataQuality] = useState<'full' | 'partial' | 'cached' | 'unavailable'>('full');
      
      const dataStates = {
        full: {
          productId: mockProduct._id,
          availableStock: 15,
          lowStockThreshold: 5,
          allowBackorder: false,
          lastUpdated: new Date(),
          source: 'live',
        },
        partial: {
          productId: mockProduct._id,
          availableStock: 15,
          source: 'partial',
        },
        cached: {
          productId: mockProduct._id,
          availableStock: null,
          source: 'cache',
          lastUpdated: new Date(Date.now() - 300000), // 5 minutes ago
        },
        unavailable: null,
      };
      
      const degradeData = () => {
        const sequence: (keyof typeof dataStates)[] = ['partial', 'cached', 'unavailable'];
        const currentIndex = sequence.indexOf(dataQuality);
        const nextQuality = sequence[currentIndex + 1] || 'full';
        
        setDataQuality(nextQuality);
        
        if (nextQuality === 'full') {
          queryClient.setQueryData(['inventory.product', mockProduct._id], dataStates.full);
          toast.success('Data quality restored');
        } else {
          queryClient.setQueryData(['inventory.product', mockProduct._id], dataStates[nextQuality]);
          toast.warning(`Data quality degraded to: ${nextQuality}`);
        }
      };
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              <div className="space-y-4">
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">Data Quality Simulation</h4>
                    <Button size="sm" onClick={degradeData}>
                      Next Quality Level
                    </Button>
                  </div>
                  
                  <div className="flex gap-2 mb-3">
                    {Object.keys(dataStates).map(quality => (
                      <Badge 
                        key={quality} 
                        variant={quality === dataQuality ? 'default' : 'secondary'}
                      >
                        {quality}
                      </Badge>
                    ))}
                  </div>
                  
                  {dataQuality === 'partial' && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Limited inventory data available. Some features may not work correctly.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {dataQuality === 'cached' && (
                    <Alert variant="destructive">
                      <Clock className="h-4 w-4" />
                      <AlertDescription>
                        Showing cached data from 5 minutes ago. Real-time updates unavailable.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {dataQuality === 'unavailable' && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Inventory data unavailable. Operating in fallback mode.
                      </AlertDescription>
                    </Alert>
                  )}
                </Card>
                
                <ProductInfoRealtime product={mockProduct} selectedVariant={null} />
              </div>
              <Toaster position="top-right" />
            </BrowserRouter>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
};

export const LiveInventoryUpdates: Story = {
  args: {
    product: mockProduct,
    selectedVariant: null,
  },
  decorators: [
    (Story) => {
      const queryClient = createQueryClient();
      const [inventoryData, setInventoryData] = useState({
        productId: mockProduct._id,
        availableStock: 15,
        lowStockThreshold: 5,
        allowBackorder: false,
      });
      
      useEffect(() => {
        queryClient.setQueryData(['inventory.product', mockProduct._id], inventoryData);
      }, [inventoryData, queryClient]);
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              <div className="space-y-6">
                <AdvancedInventorySimulator 
                  productId={mockProduct._id} 
                  onUpdate={setInventoryData}
                  scenario="normal"
                />
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