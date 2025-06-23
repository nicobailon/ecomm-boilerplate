import type { Meta, StoryObj } from '@storybook/react-vite';
import { StockBadge } from './StockBadge';

const meta = {
  title: 'UI/Feedback/StockBadge',
  component: StockBadge,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
## StockBadge Component

The StockBadge component displays inventory status with contextual styling. It provides visual feedback about product availability using colors and optional animations.

### When to use
- Product listing pages
- Product detail pages
- Shopping cart items
- Inventory management interfaces
- Any place where stock status needs to be communicated

### Best practices
- Use consistent thresholds across your application
- Consider showing exact counts for low inventory to create urgency
- Use animations sparingly (only for very low stock)
- Ensure color choices are accessible and meaningful
- Provide alternative text for screen readers

### Accessibility notes
- Component includes \`role="status"\` for screen readers
- Uses semantic colors that work with color blindness
- Includes descriptive aria-label
- Animation can be disabled for users who prefer reduced motion
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    inventory: {
      control: { type: 'number', min: 0, max: 100 },
      description: 'Current inventory count',
    },
    showCount: {
      control: 'boolean',
      description: 'Whether to show exact inventory numbers',
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
    showCount: false,
    size: 'xs',
  },
} satisfies Meta<typeof StockBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    inventory: 15,
  },
};

export const AllStockLevels: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <StockBadge inventory={0} />
        <span className="text-sm text-muted-foreground">Out of stock (0)</span>
      </div>
      <div className="flex items-center gap-4">
        <StockBadge inventory={1} />
        <span className="text-sm text-muted-foreground">Critical stock (1-3) - Animated</span>
      </div>
      <div className="flex items-center gap-4">
        <StockBadge inventory={5} />
        <span className="text-sm text-muted-foreground">Very low stock (4-5)</span>
      </div>
      <div className="flex items-center gap-4">
        <StockBadge inventory={8} />
        <span className="text-sm text-muted-foreground">Low stock (6-10)</span>
      </div>
      <div className="flex items-center gap-4">
        <StockBadge inventory={50} />
        <span className="text-sm text-muted-foreground">In stock (11+)</span>
      </div>
    </div>
  ),
};

export const WithCounts: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <StockBadge inventory={0} showCount />
        <span className="text-sm text-muted-foreground">Shows "Out of stock"</span>
      </div>
      <div className="flex items-center gap-4">
        <StockBadge inventory={2} showCount />
        <span className="text-sm text-muted-foreground">Shows exact count when critical</span>
      </div>
      <div className="flex items-center gap-4">
        <StockBadge inventory={7} showCount />
        <span className="text-sm text-muted-foreground">Shows count for low stock</span>
      </div>
      <div className="flex items-center gap-4">
        <StockBadge inventory={25} showCount />
        <span className="text-sm text-muted-foreground">Shows count up to 99</span>
      </div>
      <div className="flex items-center gap-4">
        <StockBadge inventory={150} showCount />
        <span className="text-sm text-muted-foreground">Shows "In stock" for 100+</span>
      </div>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <StockBadge inventory={5} size="xs" />
        <span className="text-sm text-muted-foreground">Extra small (xs)</span>
      </div>
      <div className="flex items-center gap-4">
        <StockBadge inventory={5} size="sm" />
        <span className="text-sm text-muted-foreground">Small (sm)</span>
      </div>
      <div className="flex items-center gap-4">
        <StockBadge inventory={5} size="md" />
        <span className="text-sm text-muted-foreground">Medium (md)</span>
      </div>
    </div>
  ),
};

export const ProductCardExample: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl">
      <div className="border rounded-lg p-4 space-y-2">
        <div className="aspect-square bg-muted rounded mb-3" />
        <h3 className="font-medium">Premium Headphones</h3>
        <p className="text-sm text-muted-foreground">$299.99</p>
        <StockBadge inventory={0} />
      </div>
      <div className="border rounded-lg p-4 space-y-2">
        <div className="aspect-square bg-muted rounded mb-3" />
        <h3 className="font-medium">Wireless Mouse</h3>
        <p className="text-sm text-muted-foreground">$49.99</p>
        <StockBadge inventory={3} />
      </div>
      <div className="border rounded-lg p-4 space-y-2">
        <div className="aspect-square bg-muted rounded mb-3" />
        <h3 className="font-medium">USB-C Cable</h3>
        <p className="text-sm text-muted-foreground">$19.99</p>
        <StockBadge inventory={50} />
      </div>
    </div>
  ),
};

export const AnimationDemo: Story = {
  render: () => {
    const [inventory, setInventory] = React.useState(5);
    
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setInventory(Math.max(0, inventory - 1))}
            className="px-3 py-1 border rounded hover:bg-accent"
          >
            Decrease
          </button>
          <span className="font-mono text-lg w-12 text-center">{inventory}</span>
          <button
            onClick={() => setInventory(inventory + 1)}
            className="px-3 py-1 border rounded hover:bg-accent"
          >
            Increase
          </button>
        </div>
        <div className="p-4 border rounded-lg">
          <StockBadge inventory={inventory} showCount />
        </div>
        <p className="text-sm text-muted-foreground">
          Animation activates when inventory is 1-3 items
        </p>
      </div>
    );
  },
};

export const InlineUsage: Story = {
  render: () => (
    <div className="space-y-4 max-w-2xl">
      <p className="text-sm">
        This product <StockBadge inventory={25} size="xs" className="mx-1" /> and ships within 24 hours.
      </p>
      <p className="text-sm">
        Limited edition item <StockBadge inventory={2} size="xs" showCount className="mx-1" /> - order soon!
      </p>
      <div className="flex items-center gap-2">
        <span className="font-medium">Status:</span>
        <StockBadge inventory={0} size="sm" />
        <button className="text-sm text-primary underline">Notify me</button>
      </div>
    </div>
  ),
};

export const CustomStyling: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <StockBadge inventory={10} className="shadow-sm" />
        <span className="text-sm text-muted-foreground">With shadow</span>
      </div>
      <div className="flex items-center gap-4">
        <StockBadge inventory={10} className="rounded-md" />
        <span className="text-sm text-muted-foreground">Square corners</span>
      </div>
      <div className="flex items-center gap-4">
        <StockBadge inventory={10} className="font-bold" />
        <span className="text-sm text-muted-foreground">Bold text</span>
      </div>
    </div>
  ),
};

export const RealTimeUpdate: Story = {
  render: () => {
    const [inventory, setInventory] = React.useState(10);
    
    React.useEffect(() => {
      const interval = setInterval(() => {
        setInventory(prev => {
          const change = Math.random() > 0.5 ? -1 : 0;
          return Math.max(0, prev + change);
        });
      }, 3000);
      
      return () => clearInterval(interval);
    }, []);
    
    return (
      <div className="space-y-4">
        <div className="p-6 border rounded-lg text-center">
          <h3 className="font-medium mb-4">Hot Sale Item</h3>
          <StockBadge inventory={inventory} showCount size="md" />
          <p className="text-sm text-muted-foreground mt-4">
            Simulating real-time inventory updates
          </p>
        </div>
      </div>
    );
  },
};

import React from 'react';