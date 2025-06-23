import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { RealtimeStockBadge } from './RealtimeStockBadge';
// import { RealtimeInventoryProvider } from '@/contexts/RealtimeInventoryContext';

// Mock the hook to avoid WebSocket connections in stories
const MockRealtimeProvider = ({ children }: { children: React.ReactNode }) => {
  // Mock provider returns children directly since we can't import the real provider
  return <>{children}</>;
};

const meta = {
  title: 'UI/Feedback/RealtimeStockBadge',
  component: RealtimeStockBadge,
  decorators: [
    (Story) => (
      <MockRealtimeProvider>
        <Story />
      </MockRealtimeProvider>
    ),
  ],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
## RealtimeStockBadge Component

The RealtimeStockBadge extends StockBadge with real-time inventory updates via WebSocket connections. It provides live stock status without page refreshes.

### When to use
- Product detail pages where real-time accuracy is critical
- High-traffic product listings
- Flash sales or limited quantity items
- Shopping cart to show current availability
- Any scenario where inventory changes rapidly

### Best practices
- Use sparingly to avoid too many WebSocket connections
- Show connection status for transparency
- Provide visual feedback when updates occur
- Fall back gracefully when connection is lost
- Consider grouping multiple badges under one connection

### Accessibility notes
- Uses \`aria-live="polite"\` for real-time updates
- Connection status is announced to screen readers
- Update animations respect reduced motion preferences
- Maintains all accessibility features of StockBadge
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    inventory: {
      control: { type: 'number', min: 0, max: 100 },
      description: 'Initial inventory count',
    },
    productId: {
      control: 'text',
      description: 'Product ID for real-time subscription',
    },
    variantId: {
      control: 'text',
      description: 'Variant ID (optional)',
    },
    showCount: {
      control: 'boolean',
      description: 'Whether to show exact inventory numbers',
    },
    showConnectionStatus: {
      control: 'boolean',
      description: 'Whether to show WebSocket connection status',
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md'],
      description: 'Size variant of the badge',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
  args: {
    inventory: 10,
    productId: 'prod_123',
    showCount: false,
    showConnectionStatus: false,
    size: 'xs',
  },
} satisfies Meta<typeof RealtimeStockBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    inventory: 15,
    productId: 'prod_001',
  },
};

export const WithConnectionStatus: Story = {
  args: {
    inventory: 8,
    productId: 'prod_002',
    showConnectionStatus: true,
  },
};

export const AllStates: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <RealtimeStockBadge inventory={0} productId="prod_out" />
        <span className="text-sm text-muted-foreground">Out of stock</span>
      </div>
      <div className="flex items-center gap-4">
        <RealtimeStockBadge inventory={2} productId="prod_critical" />
        <span className="text-sm text-muted-foreground">Critical (animated)</span>
      </div>
      <div className="flex items-center gap-4">
        <RealtimeStockBadge inventory={5} productId="prod_low" />
        <span className="text-sm text-muted-foreground">Low stock</span>
      </div>
      <div className="flex items-center gap-4">
        <RealtimeStockBadge inventory={25} productId="prod_available" />
        <span className="text-sm text-muted-foreground">In stock</span>
      </div>
    </div>
  ),
};

export const SimulatedUpdates: Story = {
  render: () => {
    const [inventory, setInventory] = React.useState(10);
    const [lastUpdate, setLastUpdate] = React.useState<Date | null>(null);
    
    const simulateUpdate = (change: number) => {
      setInventory(prev => Math.max(0, prev + change));
      setLastUpdate(new Date());
    };
    
    return (
      <div className="space-y-6">
        <div className="border rounded-lg p-6">
          <h3 className="font-medium mb-4">Flash Sale Item</h3>
          <div className="mb-4">
            <RealtimeStockBadge 
              inventory={inventory} 
              productId="prod_flash" 
              showCount 
              showConnectionStatus
              size="md"
            />
          </div>
          
          <div className="space-x-2 mb-4">
            <button
              onClick={() => simulateUpdate(-1)}
              className="px-3 py-1 border rounded hover:bg-accent"
            >
              Simulate Purchase (-1)
            </button>
            <button
              onClick={() => simulateUpdate(-3)}
              className="px-3 py-1 border rounded hover:bg-accent"
            >
              Bulk Purchase (-3)
            </button>
            <button
              onClick={() => simulateUpdate(5)}
              className="px-3 py-1 border rounded hover:bg-accent"
            >
              Restock (+5)
            </button>
          </div>
          
          {lastUpdate && (
            <p className="text-sm text-muted-foreground">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </p>
          )}
        </div>
      </div>
    );
  },
};

export const ProductDetailIntegration: Story = {
  render: () => (
    <div className="max-w-lg border rounded-lg p-6">
      <div className="aspect-video bg-muted rounded mb-4" />
      <h2 className="text-xl font-semibold mb-2">Limited Edition Smartwatch</h2>
      <p className="text-2xl font-bold mb-4">$299.99</p>
      
      <div className="space-y-3 mb-6">
        <RealtimeStockBadge 
          inventory={3} 
          productId="prod_watch" 
          showCount 
          showConnectionStatus
          size="sm"
        />
        <p className="text-sm text-destructive font-medium">
          ⚡ High demand - stock updating in real-time
        </p>
      </div>
      
      <button className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
        Add to Cart
      </button>
    </div>
  ),
};

export const MultipleProducts: Story = {
  render: () => {
    const products = [
      { id: 'prod_101', name: 'Gaming Mouse', inventory: 2, price: '$79.99' },
      { id: 'prod_102', name: 'Mechanical Keyboard', inventory: 0, price: '$149.99' },
      { id: 'prod_103', name: 'Webcam HD', inventory: 7, price: '$99.99' },
      { id: 'prod_104', name: 'USB Hub', inventory: 15, price: '$39.99' },
    ];
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium">Hot Deals - Live Stock</h3>
          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
            ● Real-time updates
          </span>
        </div>
        
        {products.map(product => (
          <div key={product.id} className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium">{product.name}</h4>
              <p className="text-sm text-muted-foreground">{product.price}</p>
            </div>
            <RealtimeStockBadge 
              inventory={product.inventory} 
              productId={product.id}
              showCount
            />
          </div>
        ))}
      </div>
    );
  },
};

export const ConnectionStates: Story = {
  render: () => {
    const [isConnected, setIsConnected] = React.useState(true);
    
    // Override the mock provider for this story
    const CustomProvider = ({ children }: { children: React.ReactNode }) => {
      return (
        <MockRealtimeProvider>
          {children}
        </MockRealtimeProvider>
      );
    };
    
    return (
      <CustomProvider>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsConnected(!isConnected)}
              className="px-4 py-2 border rounded hover:bg-accent"
            >
              {isConnected ? 'Disconnect' : 'Connect'}
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-3">With Status Indicator</h4>
              <RealtimeStockBadge 
                inventory={5} 
                productId="prod_status" 
                showConnectionStatus
              />
            </div>
            
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-3">Without Status</h4>
              <RealtimeStockBadge 
                inventory={5} 
                productId="prod_nostatus"
              />
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground text-center">
            Connection is {isConnected ? 'active' : 'disconnected'}
          </p>
        </div>
      </CustomProvider>
    );
  },
};

export const ShoppingCartExample: Story = {
  render: () => {
    const cartItems = [
      { id: 'prod_201', name: 'Laptop Stand', inventory: 1, quantity: 1, price: 49.99 },
      { id: 'prod_202', name: 'Wireless Charger', inventory: 3, quantity: 2, price: 29.99 },
      { id: 'prod_203', name: 'Cable Organizer', inventory: 0, quantity: 1, price: 19.99 },
    ];
    
    return (
      <div className="max-w-lg space-y-4">
        <h3 className="font-medium text-lg">Shopping Cart</h3>
        
        {cartItems.map(item => (
          <div key={item.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-medium">{item.name}</h4>
                <p className="text-sm text-muted-foreground">
                  ${item.price} × {item.quantity}
                </p>
              </div>
              <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
            </div>
            
            <RealtimeStockBadge 
              inventory={item.inventory} 
              productId={item.id}
              size="xs"
              showCount
            />
            
            {item.inventory === 0 && (
              <p className="text-xs text-destructive mt-2">
                This item is no longer available
              </p>
            )}
            {item.inventory > 0 && item.inventory < item.quantity && (
              <p className="text-xs text-warning mt-2">
                Only {item.inventory} available
              </p>
            )}
          </div>
        ))}
        
        <div className="border-t pt-4">
          <p className="text-sm text-muted-foreground mb-4">
            Stock levels update in real-time during checkout
          </p>
          <button className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
            Proceed to Checkout
          </button>
        </div>
      </div>
    );
  },
};