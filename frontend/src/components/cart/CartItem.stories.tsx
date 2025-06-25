import type { Meta, StoryObj } from '@storybook/react-vite';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import CartItem from './CartItem';
import { mockProduct, mockProductOnSale, mockProductOutOfStock } from '@/test/mocks';
import type { CartItem as CartItemType, Product } from '@/types';
import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { createTRPCClient } from '@/lib/trpc-client';
import { withScenario, withEndpointOverrides, withRealtimeUpdates } from '@/mocks/story-helpers';
import { trpcMutation } from '@/mocks/utils/trpc-mock';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react';
import { within, userEvent, expect } from '@storybook/test';

const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const meta = {
  title: 'Cart/CartItem',
  component: CartItem,
  decorators: [
    (Story) => {
      const queryClient = createQueryClient();
      const trpcClient = createTRPCClient();
      return (
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              <div className="max-w-2xl mx-auto p-4">
                <Story />
              </div>
            </BrowserRouter>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof CartItem>;

export default meta;
type Story = StoryObj<typeof meta>;

// MSW handlers for cart operations are now included via story helpers

const createCartItem = (product: Product, quantity: number, variantId?: string): CartItemType & { product: Product } => {
  const variant = variantId ? product.variants?.find(v => v.variantId === variantId) : undefined;
  return {
    product,
    quantity,
    variantId,
    variantDetails: variant
      ? {
          label: variant.label,
          color: variant.color,
          price: variant.price,
          sku: variant.sku || `${product.sku}-${variantId}`,
        }
      : undefined,
  };
};

export const Default: Story = {
  args: {
    item: createCartItem(mockProduct, 2),
  },
};

export const SingleQuantity: Story = {
  args: {
    item: createCartItem(mockProduct, 1),
  },
};

export const WithVariant: Story = {
  args: {
    item: createCartItem(mockProductOnSale, 3, 'sw-black'),
  },
};

export const OutOfStock: Story = {
  args: {
    item: createCartItem(mockProductOutOfStock, 2),
  },
};

export const LowStock: Story = {
  args: {
    item: createCartItem({
      ...mockProduct,
      inventory: 5,
    }, 3),
  },
};

export const InsufficientStock: Story = {
  args: {
    item: createCartItem({
      ...mockProduct,
      inventory: 5,
    }, 10),
  },
};

export const Loading: Story = {
  args: {
    item: createCartItem(mockProduct, 2),
  },
  ...(withScenario('loading') as Partial<Story>),
};

export const LongProductName: Story = {
  args: {
    item: createCartItem({
      ...mockProduct,
      name: 'Ultra Premium Professional Studio Monitor Headphones with Advanced Noise Cancellation and Extended Battery Life',
    }, 1),
  },
};

export const HighQuantity: Story = {
  args: {
    item: createCartItem(mockProduct, 99),
  },
};

export const PriceCalculations: Story = {
  args: {
    item: createCartItem(mockProduct, 1),
  },
  render: (args) => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Price Calculations Display</h3>
      <CartItem item={args.item} />
      <CartItem item={createCartItem({ ...mockProduct, price: 49.99 }, 3)} />
      <CartItem item={createCartItem({ ...mockProduct, price: 0.99 }, 50)} />
      <CartItem item={createCartItem({ ...mockProduct, price: 1234.56 }, 2)} />
    </div>
  ),
};

export const MobileResponsive: Story = {
  args: {
    item: createCartItem(mockProduct, 2),
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const TabletResponsive: Story = {
  args: {
    item: createCartItem(mockProduct, 2),
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};

export const QuantitySelector: Story = {
  args: {
    item: createCartItem(mockProduct, 1),
  },
  render: () => {
    const [quantities] = useState<Record<string, number>>({
      item1: 1,
      item2: 5,
      item3: 10,
    });

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold mb-4">Quantity Selector Interactions</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Click the + and - buttons to change quantities
        </p>
        {Object.entries(quantities).map(([id, quantity]) => (
          <div key={id} className="border rounded-lg p-4">
            <CartItem 
              item={createCartItem(
                { ...mockProduct, _id: id, name: `Product ${id}` },
                quantity,
              )}
            />
          </div>
        ))}
      </div>
    );
  },
};

export const RemoveItemInteraction: Story = {
  args: {
    item: createCartItem(mockProduct, 2),
  },
  render: () => {
    const [items] = useState([
      createCartItem(mockProduct, 2),
      createCartItem(mockProductOnSale, 1, 'sw-black'),
      createCartItem({ ...mockProduct, _id: '4', name: 'Wireless Mouse' }, 3),
    ]);

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold mb-4">Remove Item Functionality</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Click the trash icon to remove items (simulated)
        </p>
        {items.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Cart is empty
          </div>
        ) : (
          items.map((item) => (
            <CartItem key={item.product._id} item={item} />
          ))
        )}
      </div>
    );
  },
};

export const VariantDisplay: Story = {
  args: {
    item: createCartItem(mockProductOnSale, 1, 'sw-black'),
  },
  render: (args) => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Variant Display Examples</h3>
      <CartItem item={args.item} />
      <CartItem item={createCartItem(mockProductOnSale, 1, 'sw-silver')} />
      <CartItem item={createCartItem({
        ...mockProduct,
        _id: '5',
        name: 'T-Shirt',
        variants: [
          { variantId: 'tshirt-s-blue', label: 'Small / Blue', price: 19.99, inventory: 10 },
          { variantId: 'tshirt-m-red', label: 'Medium / Red', price: 19.99, inventory: 5 },
          { variantId: 'tshirt-l-green', label: 'Large / Green', price: 21.99, inventory: 0 },
        ],
      }, 2, 'tshirt-m-red')} />
    </div>
  ),
};

export const AccessibilityShowcase: Story = {
  args: {
    item: createCartItem(mockProduct, 2),
  },
  render: (args) => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Accessibility Features</h3>
      <div className="text-sm text-muted-foreground space-y-2 mb-4">
        <p>• Tab navigation through interactive elements</p>
        <p>• Screen reader labels for all buttons</p>
        <p>• ARIA live regions for quantity updates</p>
        <p>• Semantic HTML structure</p>
      </div>
      <CartItem {...args} />
    </div>
  ),
  parameters: {
    a11y: {
      config: {
        rules: [
          { id: 'color-contrast', enabled: true },
          { id: 'button-name', enabled: true },
          { id: 'aria-roles', enabled: true },
        ],
      },
    },
  },
};

// Real-time inventory update simulation
const RealtimeInventoryCartItem = ({ item: initialItem }: { item: CartItemType & { product: Product } }) => {
  const [item, setItem] = useState(initialItem);
  const [isConnected, setIsConnected] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [inventoryHistory, setInventoryHistory] = useState<number[]>([initialItem.product.inventory || 0]);
  
  useEffect(() => {
    if (!isConnected) return;
    
    const interval = setInterval(() => {
      // Simulate inventory changes
      const change = Math.floor(Math.random() * 5) - 2; // -2 to +2
      setItem(prev => {
        const newInventory = Math.max(0, (prev.product.inventory || 0) + change);
        setInventoryHistory(history => [...history.slice(-4), newInventory]);
        return {
          ...prev,
          product: {
            ...prev.product as Product,
            inventory: newInventory,
          },
        };
      });
      setLastUpdate(new Date());
    }, 3000);
    
    return () => clearInterval(interval);
  }, [isConnected]);
  
  const trend = inventoryHistory.length > 1 
    ? inventoryHistory[inventoryHistory.length - 1] - inventoryHistory[inventoryHistory.length - 2]
    : 0;
  
  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {isConnected ? (
              <>
                <Wifi className="w-4 h-4 text-green-500" />
                <span className="text-sm">Real-time Updates Active</span>
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
            {isConnected ? 'Disconnect' : 'Connect'}
          </Button>
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Current Stock</p>
            <p className="font-semibold text-lg">
              {item.product.inventory}
              {trend !== 0 && (
                <span className={`text-xs ml-1 ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {trend > 0 ? '+' : ''}{trend}
                </span>
              )}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Status</p>
            <Badge variant={
              !item.product.inventory ? 'destructive' : 
              item.product.inventory < 10 ? 'secondary' : 
              'default'
            }>
              {!item.product.inventory ? 'Out of Stock' : 
               item.product.inventory < 10 ? 'Low Stock' : 
               'In Stock'}
            </Badge>
          </div>
          <div>
            <p className="text-muted-foreground">Last Update</p>
            <p className="text-xs">{lastUpdate.toLocaleTimeString()}</p>
          </div>
        </div>
        
        <div className="mt-4">
          <p className="text-xs text-muted-foreground mb-2">Inventory History</p>
          <div className="flex gap-1 items-end h-8">
            {inventoryHistory.map((value, i) => (
              <div
                key={i}
                className="flex-1 bg-primary transition-all duration-300"
                style={{
                  height: `${Math.max(10, (value / 50) * 100)}%`,
                  opacity: 0.3 + (i / inventoryHistory.length) * 0.7,
                }}
              />
            ))}
          </div>
        </div>
      </Card>
      
      <CartItem item={item} />
      
      {item.quantity > (item.product.inventory || 0) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Only {item.product.inventory} items available. Quantity will be adjusted at checkout.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export const WithRealtimeInventory: Story = {
  args: {
    item: createCartItem({ ...mockProduct, inventory: 25 }, 5),
  },
  render: (args) => <RealtimeInventoryCartItem item={args.item} />,
  ...(withRealtimeUpdates() as Partial<Story>),
};

export const MutationErrorStates: Story = {
  args: {
    item: createCartItem(mockProduct, 2),
  },
  render: () => {
    const [errorType, setErrorType] = useState<string | null>(null);
    const [isRetrying, setIsRetrying] = useState(false);
    
    const simulateError = async (type: string) => {
      setErrorType(type);
      setIsRetrying(true);
      await new Promise(resolve => setTimeout(resolve, 2000));
      setIsRetrying(false);
    };
    
    return (
      <div className="space-y-4">
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Mutation Error Simulation</h3>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => simulateError('network')}
              disabled={isRetrying}
            >
              Network Error
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => simulateError('inventory')}
              disabled={isRetrying}
            >
              Inventory Error
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => simulateError('validation')}
              disabled={isRetrying}
            >
              Validation Error
            </Button>
            {errorType && (
              <Button
                size="sm"
                variant="default"
                onClick={() => setErrorType(null)}
              >
                Clear Error
              </Button>
            )}
          </div>
        </Card>
        
        {errorType === 'network' && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <span>Network error: Unable to update cart</span>
                {isRetrying && <RefreshCw className="w-4 h-4 animate-spin" />}
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        {errorType === 'inventory' && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Insufficient inventory. Please reduce quantity.
            </AlertDescription>
          </Alert>
        )}
        
        {errorType === 'validation' && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Invalid quantity. Must be between 1 and 99.
            </AlertDescription>
          </Alert>
        )}
        
        <CartItem item={createCartItem(mockProduct, 5)} />
      </div>
    );
  },
  ...(withEndpointOverrides([
    trpcMutation('cart.update', async ({ quantity }: any) => {
      if (quantity > 10) {
        throw new Error('Insufficient inventory');
      }
      return { items: [] };
    }),
  ]) as Partial<Story>),
};

export const LoadingStatesShowcase: Story = {
  args: {
    item: createCartItem(mockProduct, 2),
  },
  render: () => {
    const [loadingStates, setLoadingStates] = useState({
      update: false,
      remove: false,
      inventory: false,
    });
    
    const toggleLoading = (type: keyof typeof loadingStates) => {
      setLoadingStates(prev => ({ ...prev, [type]: !prev[type] }));
      if (!loadingStates[type]) {
        setTimeout(() => {
          setLoadingStates(prev => ({ ...prev, [type]: false }));
        }, 3000);
      }
    };
    
    return (
      <div className="space-y-4">
        <Card className="p-4">
          <h3 className="font-semibold mb-4">Loading States</h3>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={loadingStates.update ? 'default' : 'outline'}
              onClick={() => toggleLoading('update')}
            >
              {loadingStates.update ? 'Updating...' : 'Update Quantity'}
            </Button>
            <Button
              size="sm"
              variant={loadingStates.remove ? 'destructive' : 'outline'}
              onClick={() => toggleLoading('remove')}
            >
              {loadingStates.remove ? 'Removing...' : 'Remove Item'}
            </Button>
            <Button
              size="sm"
              variant={loadingStates.inventory ? 'secondary' : 'outline'}
              onClick={() => toggleLoading('inventory')}
            >
              {loadingStates.inventory ? 'Checking...' : 'Check Inventory'}
            </Button>
          </div>
        </Card>
        
        <div className={loadingStates.update ? 'opacity-50 pointer-events-none' : ''}>
          <CartItem item={createCartItem(mockProduct, 3)} />
        </div>
        
        {loadingStates.inventory && (
          <Card className="p-4 animate-pulse">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span className="text-sm">Checking inventory availability...</span>
            </div>
          </Card>
        )}
        
        {loadingStates.remove && (
          <div className="opacity-50">
            <CartItem item={createCartItem(mockProductOnSale, 1)} />
          </div>
        )}
      </div>
    );
  },
};

export const WithNetworkLatency: Story = {
  args: {
    item: createCartItem(mockProduct, 2),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Find and click the increment button
    const incrementButton = canvas.getAllByRole('button').find(btn =>
      btn.textContent?.includes('+') || btn.getAttribute('aria-label')?.includes('Increase'),
    );
    
    if (incrementButton) {
      await userEvent.click(incrementButton);
      // Verify loading state appears
      await void expect(incrementButton).toBeDisabled();
    }
  },
  ...(withEndpointOverrides([
    trpcMutation('cart.update', async ({ quantity }: any) => {
      // Simulate network latency
      await new Promise(resolve => setTimeout(resolve, 2000));
      return { items: [createCartItem(mockProduct, Number(quantity))] };
    }, { delay: 2000 }),
  ]) as Partial<Story>),
};