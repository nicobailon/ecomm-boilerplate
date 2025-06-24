import type { Meta, StoryObj } from '@storybook/react-vite';
import { InventoryBadge } from './InventoryBadge';

const meta = {
  title: 'UI/Feedback/InventoryBadge',
  component: InventoryBadge,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
## InventoryBadge Component

The InventoryBadge component is a more flexible version of StockBadge, offering different variants and customizable thresholds. It integrates with inventory utility functions for consistent behavior across the application.

### When to use
- Product collection/listing pages (collection variant)
- Product detail pages (detail variant)
- Admin/inventory management interfaces (admin variant)
- Anywhere custom stock thresholds are needed
- When you need consistent inventory formatting

### Best practices
- Choose the appropriate variant for your context
- Set meaningful thresholds based on product type
- Use showCount for transparency in critical situations
- Maintain consistent threshold values across similar products
- Consider the visual hierarchy when choosing variants

### Accessibility notes
- Includes semantic \`role="status"\` for assistive technologies
- Provides descriptive aria-labels
- Color coding is supplemented with text
- Animation respects reduced motion preferences
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
    variant: {
      control: 'select',
      options: ['collection', 'detail', 'admin'],
      description: 'Visual variant of the badge',
    },
    threshold: {
      control: { type: 'number', min: 1, max: 20 },
      description: 'Low stock threshold',
    },
    showCount: {
      control: 'boolean',
      description: 'Whether to show exact inventory numbers',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
  args: {
    inventory: 10,
    variant: 'collection',
    threshold: 5,
    showCount: false,
  },
} satisfies Meta<typeof InventoryBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    inventory: 15,
  },
};

export const Variants: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium mb-3">Collection Variant (smallest)</h3>
        <div className="flex items-center gap-3">
          <InventoryBadge inventory={0} variant="collection" />
          <InventoryBadge inventory={3} variant="collection" />
          <InventoryBadge inventory={10} variant="collection" />
          <InventoryBadge inventory={50} variant="collection" />
        </div>
      </div>
      
      <div>
        <h3 className="text-sm font-medium mb-3">Detail Variant (medium)</h3>
        <div className="flex items-center gap-3">
          <InventoryBadge inventory={0} variant="detail" />
          <InventoryBadge inventory={3} variant="detail" />
          <InventoryBadge inventory={10} variant="detail" />
          <InventoryBadge inventory={50} variant="detail" />
        </div>
      </div>
      
      <div>
        <h3 className="text-sm font-medium mb-3">Admin Variant</h3>
        <div className="flex items-center gap-3">
          <InventoryBadge inventory={0} variant="admin" />
          <InventoryBadge inventory={3} variant="admin" />
          <InventoryBadge inventory={10} variant="admin" />
          <InventoryBadge inventory={50} variant="admin" />
        </div>
      </div>
    </div>
  ),
};

export const CustomThresholds: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <InventoryBadge inventory={3} threshold={3} />
        <span className="text-sm text-muted-foreground">
          Threshold: 3 (shows &quot;In stock&quot; at 4+)
        </span>
      </div>
      <div className="flex items-center gap-4">
        <InventoryBadge inventory={5} threshold={5} />
        <span className="text-sm text-muted-foreground">
          Threshold: 5 (default - shows &quot;In stock&quot; at 6+)
        </span>
      </div>
      <div className="flex items-center gap-4">
        <InventoryBadge inventory={10} threshold={10} />
        <span className="text-sm text-muted-foreground">
          Threshold: 10 (shows &quot;In stock&quot; at 11+)
        </span>
      </div>
      <div className="flex items-center gap-4">
        <InventoryBadge inventory={15} threshold={20} />
        <span className="text-sm text-muted-foreground">
          Threshold: 20 (shows &quot;Low stock&quot; up to 20)
        </span>
      </div>
    </div>
  ),
};

export const WithCounts: Story = {
  render: () => (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Collection variant with counts</h3>
      <div className="flex flex-wrap gap-2">
        {[0, 1, 3, 5, 10, 25, 50, 99, 150].map((count) => (
          <InventoryBadge key={count} inventory={count} showCount variant="collection" />
        ))}
      </div>
      
      <h3 className="text-sm font-medium mt-6">Detail variant with counts</h3>
      <div className="flex flex-wrap gap-2">
        {[0, 2, 4, 8, 15, 30].map((count) => (
          <InventoryBadge key={count} inventory={count} showCount variant="detail" />
        ))}
      </div>
    </div>
  ),
};

export const ProductCollectionExample: Story = {
  render: () => {
    const products = [
      { name: 'Wireless Earbuds', price: '$79.99', inventory: 0 },
      { name: 'Phone Case', price: '$29.99', inventory: 2 },
      { name: 'Screen Protector', price: '$19.99', inventory: 8 },
      { name: 'Charging Cable', price: '$14.99', inventory: 45 },
    ];
    
    return (
      <div className="grid grid-cols-2 gap-4 max-w-2xl">
        {products.map((product) => (
          <div key={product.name} className="border rounded-lg p-4">
            <div className="aspect-square bg-muted rounded mb-3" />
            <h3 className="font-medium text-sm">{product.name}</h3>
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-muted-foreground">{product.price}</span>
              <InventoryBadge inventory={product.inventory} variant="collection" />
            </div>
          </div>
        ))}
      </div>
    );
  },
};

export const ProductDetailExample: Story = {
  render: () => (
    <div className="max-w-lg space-y-6">
      <div className="border rounded-lg p-6">
        <div className="aspect-video bg-muted rounded mb-4" />
        <h2 className="text-xl font-semibold mb-2">Premium Bluetooth Speaker</h2>
        <p className="text-2xl font-bold mb-4">$149.99</p>
        <div className="space-y-3">
          <InventoryBadge inventory={3} variant="detail" showCount />
          <p className="text-sm text-muted-foreground">
            Order within 2 hours for same-day delivery
          </p>
        </div>
      </div>
    </div>
  ),
};

export const AdminDashboardExample: Story = {
  render: () => {
    const inventory = [
      { sku: 'PROD-001', name: 'T-Shirt', stock: 0, threshold: 10 },
      { sku: 'PROD-002', name: 'Jeans', stock: 5, threshold: 15 },
      { sku: 'PROD-003', name: 'Sneakers', stock: 12, threshold: 10 },
      { sku: 'PROD-004', name: 'Hat', stock: 48, threshold: 20 },
    ];
    
    return (
      <div className="space-y-2">
        <h3 className="font-medium mb-3">Inventory Status</h3>
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3">SKU</th>
                <th className="text-left p-3">Product</th>
                <th className="text-right p-3">Stock</th>
                <th className="text-center p-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((item) => (
                <tr key={item.sku} className="border-t">
                  <td className="p-3 font-mono text-xs">{item.sku}</td>
                  <td className="p-3">{item.name}</td>
                  <td className="p-3 text-right font-mono">{item.stock}</td>
                  <td className="p-3 text-center">
                    <InventoryBadge 
                      inventory={item.stock} 
                      variant="admin" 
                      threshold={item.threshold}
                      showCount
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  },
};

export const AnimatedLowStock: Story = {
  render: () => {
    const [inventory, setInventory] = React.useState(5);
    
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setInventory(Math.max(0, inventory - 1))}
            className="px-4 py-2 border rounded hover:bg-accent"
            disabled={inventory === 0}
          >
            Sell One
          </button>
          <span className="font-mono text-xl">{inventory} units</span>
          <button
            onClick={() => setInventory(inventory + 1)}
            className="px-4 py-2 border rounded hover:bg-accent"
          >
            Restock One
          </button>
        </div>
        
        <div className="border rounded-lg p-6 text-center">
          <h3 className="font-medium mb-4">Live Inventory Status</h3>
          <InventoryBadge inventory={inventory} variant="detail" showCount />
          <p className="text-sm text-muted-foreground mt-4">
            Animation triggers when stock drops to 1-3 units
          </p>
        </div>
      </div>
    );
  },
};

export const ResponsiveLayout: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[12, 3, 0, 25].map((stock, i) => (
          <div key={i} className="border rounded p-4 text-center">
            <div className="h-20 bg-muted rounded mb-3" />
            <InventoryBadge inventory={stock} variant="collection" />
          </div>
        ))}
      </div>
      
      <p className="text-sm text-muted-foreground text-center">
        Resize your browser to see responsive grid layout
      </p>
    </div>
  ),
};

import React from 'react';