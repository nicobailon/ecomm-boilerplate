import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { VirtualizedInventoryTable } from './VirtualizedInventoryTable';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { trpc } from '@/lib/trpc';
import { createTRPCClient } from '@/lib/trpc-client';
import { fn } from '@storybook/test';
import type { RouterOutputs } from '@/lib/trpc';
import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { within, userEvent, expect, waitFor } from '@storybook/test';

type TRPCProduct = NonNullable<RouterOutputs['product']['list']>['products'][0];

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: Infinity },
  },
});

// Generate mock products
const generateMockProducts = (count: number): TRPCProduct[] => {
  return Array.from({ length: count }, (_, i) => ({
    _id: `product-${i + 1}`,
    name: `Product ${i + 1}`,
    description: `Description for product ${i + 1}`,
    price: Math.floor(Math.random() * 100) + 10,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200',
    collectionId: undefined,
    isFeatured: i % 10 === 0,
    slug: `product-${i + 1}`,
    variants: [
      {
        variantId: `variant-${i + 1}-1`,
        label: 'Default',
        price: Math.floor(Math.random() * 100) + 10,
        inventory: Math.floor(Math.random() * 50) + 10,
        images: [],
        sku: `SKU-${i + 1}-1`,
      },
    ],
    relatedProducts: [],
    lowStockThreshold: 10,
    allowBackorder: false,
    restockDate: undefined,
    mediaGallery: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
};

const meta = {
  title: 'Admin/VirtualizedInventoryTable',
  component: VirtualizedInventoryTable,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <div className="p-6 bg-background min-h-screen">
            <Story />
          </div>
        </QueryClientProvider>
      </trpc.Provider>
    ),
  ],
  args: {
    onProductSelect: fn(),
  },
} satisfies Meta<typeof VirtualizedInventoryTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SmallDataset: Story = {
  args: {
    products: generateMockProducts(10),
    height: 400,
  },
};

export const LargeDataset: Story = {
  args: {
    products: generateMockProducts(1000),
    height: 600,
  },
};

export const ExtraLargeDataset: Story = {
  args: {
    products: generateMockProducts(5000),
    height: 600,
  },
};

export const CustomHeight: Story = {
  args: {
    products: generateMockProducts(100),
    height: 300,
  },
};

export const FullScreenHeight: Story = {
  render: (args) => {
    const height = window.innerHeight - 200; // Account for header and padding
    return <VirtualizedInventoryTable {...args} height={height} />;
  },
  args: {
    products: generateMockProducts(500),
    height: 600, // Default height as fallback
  },
};

export const MixedInventoryLevels: Story = {
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
      
      // Mock inventory data for different products
      for (let i = 0; i < 50; i++) {
        mockQueryClient.setQueryData(
          ['inventory.product', `product-${i + 1}`, undefined, undefined],
          {
            availableStock: i % 4 === 0 ? 0 : i % 3 === 0 ? 5 : Math.floor(Math.random() * 100),
            lowStockThreshold: 10,
          },
        );
      }
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={mockQueryClient}>
          <QueryClientProvider client={mockQueryClient}>
            <div className="p-6 bg-background min-h-screen">
              <Story />
            </div>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
  args: {
    products: generateMockProducts(50),
    height: 500,
  },
};

export const WithSelection: Story = {
  render: (args) => {
    const handleProductSelect = (product: TRPCProduct) => {
      console.log('Selected product:', product);
      args.onProductSelect?.(product);
    };
    
    return (
      <div className="space-y-4">
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
          <p className="text-sm font-medium">Click checkboxes to select products</p>
        </div>
        <VirtualizedInventoryTable {...args} onProductSelect={handleProductSelect} />
      </div>
    );
  },
  args: {
    products: generateMockProducts(100),
    height: 500,
  },
};

export const LoadingStates: Story = {
  decorators: [
    (Story) => {
      const loadingQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: Infinity,
            retry: false,
          },
        },
      });
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={loadingQueryClient}>
          <QueryClientProvider client={loadingQueryClient}>
            <div className="p-6 bg-background min-h-screen">
              <Story />
            </div>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
  args: {
    products: generateMockProducts(20),
    height: 400,
  },
};

export const PerformanceTest: Story = {
  render: (args) => {
    return (
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">Performance Test</h3>
          <p className="text-sm text-blue-800">
            This table contains 10,000 products. Try scrolling to test virtualization performance.
          </p>
        </div>
        <VirtualizedInventoryTable {...args} />
      </div>
    );
  },
  args: {
    products: generateMockProducts(10000),
    height: 600,
  },
};

export const MobileView: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  args: {
    products: generateMockProducts(50),
    height: 400,
  },
};

export const TabletView: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
  args: {
    products: generateMockProducts(50),
    height: 500,
  },
};

export const WithCategories: Story = {
  args: {
    products: [
      ...generateMockProducts(20).map(p => ({ ...p, category: 'Electronics' })),
      ...generateMockProducts(20).map(p => ({ ...p, category: 'Clothing' })),
      ...generateMockProducts(20).map(p => ({ ...p, category: 'Home' })),
      ...generateMockProducts(20).map(p => ({ ...p, category: 'Sports' })),
      ...generateMockProducts(20).map(p => ({ ...p, category: 'Books' })),
    ],
    height: 500,
  },
};

export const ScrollToPosition: Story = {
  render: (args) => {
    const listRef = React.useRef<{ scrollTo: (offset: number) => void; scrollToItem: (index: number) => void } | null>(null);
    
    const scrollToTop = () => listRef.current?.scrollTo(0);
    const scrollToMiddle = () => listRef.current?.scrollToItem(args.products.length / 2);
    const scrollToBottom = () => listRef.current?.scrollToItem(args.products.length - 1);
    
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <button
            onClick={scrollToTop}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
          >
            Scroll to Top
          </button>
          <button
            onClick={scrollToMiddle}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
          >
            Scroll to Middle
          </button>
          <button
            onClick={scrollToBottom}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
          >
            Scroll to Bottom
          </button>
        </div>
        <VirtualizedInventoryTable {...args} />
      </div>
    );
  },
  args: {
    products: generateMockProducts(1000),
    height: 500,
  },
};

// Enhanced table with sorting functionality
const SortableVirtualizedInventoryTable = ({ products: initialProducts, ...props }: typeof VirtualizedInventoryTable.arguments) => {
  type SortColumn = 'name' | 'stock' | 'threshold' | 'id';
  type SortDirection = 'asc' | 'desc';
  
  const [sortColumn, setSortColumn] = useState<SortColumn>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  // Mock inventory data for sorting
  const mockInventoryData = useMemo(() => {
    const data: Record<string, number> = {};
    initialProducts.forEach((product: TRPCProduct, index: number) => {
      if (product._id) {
        data[product._id] = index % 4 === 0 ? 0 : index % 3 === 0 ? 5 : Math.floor(Math.random() * 100);
      }
    });
    return data;
  }, [initialProducts]);
  
  const sortedProducts = useMemo(() => {
    const sorted = [...initialProducts].sort((a, b) => {
      let aValue: any;
      let bValue: any;
      
      switch (sortColumn) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'stock':
          aValue = (a._id && mockInventoryData[a._id]) || 0;
          bValue = (b._id && mockInventoryData[b._id]) || 0;
          break;
        case 'threshold':
          aValue = a.lowStockThreshold || 10;
          bValue = b.lowStockThreshold || 10;
          break;
        case 'id':
          aValue = a._id;
          bValue = b._id;
          break;
      }
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    return sorted;
  }, [initialProducts, sortColumn, sortDirection, mockInventoryData]);
  
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };
  
  const getSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="h-4 w-4 text-muted-foreground" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-4 w-4 text-primary" />
      : <ArrowDown className="h-4 w-4 text-primary" />;
  };
  
  return (
    <div className="space-y-2">
      {/* Sort Controls */}
      <div className="bg-muted px-6 py-3 flex items-center text-sm font-medium rounded-t-lg">
        <button
          className="flex-1 flex items-center gap-2 text-left hover:text-primary transition-colors"
          onClick={() => handleSort('name')}
          data-testid="sort-name"
        >
          Product
          {getSortIcon('name')}
        </button>
        <button
          className="w-32 flex items-center justify-center gap-2 hover:text-primary transition-colors"
          onClick={() => handleSort('stock')}
          data-testid="sort-stock"
        >
          Stock Status
          {getSortIcon('stock')}
        </button>
        <button
          className="w-24 flex items-center justify-center gap-2 hover:text-primary transition-colors"
          onClick={() => handleSort('threshold')}
          data-testid="sort-threshold"
        >
          Alert At
          {getSortIcon('threshold')}
        </button>
        <div className="w-40 text-center text-muted-foreground">Quick Adjust</div>
      </div>
      
      {/* Sorting Info */}
      <div className="text-sm text-muted-foreground px-2">
        Sorted by: <span className="font-medium">{sortColumn}</span> ({sortDirection === 'asc' ? 'ascending' : 'descending'})
      </div>
      
      <VirtualizedInventoryTable {...props} products={sortedProducts} />
    </div>
  );
};

export const WithSorting: Story = {
  render: (args) => <SortableVirtualizedInventoryTable {...args} />,
  args: {
    products: generateMockProducts(100),
    height: 500,
    onProductSelect: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Wait for table to render
    await waitFor(() => {
      expect(canvas.getByTestId('sort-name')).toBeInTheDocument();
    });
    
    // Click stock sort
    const stockSort = canvas.getByTestId('sort-stock');
    await userEvent.click(stockSort);
    
    // Verify sort info updated
    await waitFor(() => {
      expect(canvas.getByText('stock')).toBeInTheDocument();
    });
    
    // Click again to reverse sort
    await userEvent.click(stockSort);
    
    // Verify descending
    await waitFor(() => {
      expect(canvas.getByText('descending')).toBeInTheDocument();
    });
    
    // Sort by name
    const nameSort = canvas.getByTestId('sort-name');
    await userEvent.click(nameSort);
    
    // Verify changed to name
    await waitFor(() => {
      const sortedByText = canvas.getByText(/Sorted by:/i).parentElement;
      expect(sortedByText).toHaveTextContent('name');
    });
  },
};

export const AllColumnsSorting: Story = {
  render: (args) => <SortableVirtualizedInventoryTable {...args} />,
  args: {
    products: [
      { ...generateMockProducts(1)[0], name: 'Alpha Product', _id: 'id-001', lowStockThreshold: 5 },
      { ...generateMockProducts(1)[0], name: 'Beta Product', _id: 'id-002', lowStockThreshold: 10 },
      { ...generateMockProducts(1)[0], name: 'Gamma Product', _id: 'id-003', lowStockThreshold: 15 },
      { ...generateMockProducts(1)[0], name: 'Delta Product', _id: 'id-004', lowStockThreshold: 20 },
      { ...generateMockProducts(1)[0], name: 'Epsilon Product', _id: 'id-005', lowStockThreshold: 25 },
    ],
    height: 400,
    onProductSelect: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Test all sort columns
    const columns: { testId: string; name: string }[] = [
      { testId: 'sort-name', name: 'name' },
      { testId: 'sort-stock', name: 'stock' },
      { testId: 'sort-threshold', name: 'threshold' },
    ];
    
    for (const column of columns) {
      const sortButton = canvas.getByTestId(column.testId);
      await userEvent.click(sortButton);
      
      // Verify column is selected
      await waitFor(() => {
        const sortedByText = canvas.getByText(/Sorted by:/i).parentElement;
        expect(sortedByText).toHaveTextContent(column.name);
      });
      
      // Test reverse sort
      await userEvent.click(sortButton);
      
      await waitFor(() => {
        expect(canvas.getByText('descending')).toBeInTheDocument();
      });
    }
  },
};

export const LargeDatasetWithSorting: Story = {
  render: (args) => {
    return (
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">Performance Test with Sorting</h3>
          <p className="text-sm text-blue-800">
            This table contains 1,000 products with sorting enabled. Test sorting performance with large datasets.
          </p>
        </div>
        <SortableVirtualizedInventoryTable {...args} />
      </div>
    );
  },
  args: {
    products: generateMockProducts(1000),
    height: 600,
    onProductSelect: fn(),
  },
};

export const SortIndicators: Story = {
  render: (args) => {
    return (
      <div className="space-y-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-medium text-yellow-900 mb-2">Sort Indicators</h3>
          <p className="text-sm text-yellow-800">
            Click on column headers to sort. Icons indicate current sort column and direction.
          </p>
          <ul className="mt-2 text-sm text-yellow-800 list-disc list-inside">
            <li>⇅ = Column is sortable (click to sort)</li>
            <li>↑ = Sorted ascending</li>
            <li>↓ = Sorted descending</li>
          </ul>
        </div>
        <SortableVirtualizedInventoryTable {...args} />
      </div>
    );
  },
  args: {
    products: generateMockProducts(50),
    height: 400,
    onProductSelect: fn(),
  },
};

export const PreSortedByStock: Story = {
  render: function Component(args) {
    const [products] = useState(() => {
      // Generate products with specific stock levels
      return [
        ...generateMockProducts(10).map(p => ({ ...p, name: `Out of Stock ${p.name}` })),
        ...generateMockProducts(10).map(p => ({ ...p, name: `Low Stock ${p.name}` })),
        ...generateMockProducts(10).map(p => ({ ...p, name: `In Stock ${p.name}` })),
      ];
    });
    
    return <SortableVirtualizedInventoryTable {...args} products={products} />;
  },
  args: {
    products: [], // Will be overridden by render function
    height: 500,
    onProductSelect: fn(),
  },
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
      
      // Set specific inventory levels
      for (let i = 1; i <= 10; i++) {
        mockQueryClient.setQueryData(
          ['inventory.product', `product-${i}`, undefined, undefined],
          { availableStock: 0, lowStockThreshold: 10 },
        );
      }
      for (let i = 11; i <= 20; i++) {
        mockQueryClient.setQueryData(
          ['inventory.product', `product-${i}`, undefined, undefined],
          { availableStock: 5, lowStockThreshold: 10 },
        );
      }
      for (let i = 21; i <= 30; i++) {
        mockQueryClient.setQueryData(
          ['inventory.product', `product-${i}`, undefined, undefined],
          { availableStock: 100, lowStockThreshold: 10 },
        );
      }
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={mockQueryClient}>
          <QueryClientProvider client={mockQueryClient}>
            <div className="p-6 bg-background min-h-screen">
              <Story />
            </div>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
};

// Comprehensive Accessibility Stories

export const ScreenReaderAnnouncements: Story = {
  render: (args) => {
    return (
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">Screen Reader Support</h3>
          <p className="text-sm text-blue-800">
            This table includes proper ARIA labels and live regions for screen reader announcements.
          </p>
          <ul className="mt-2 text-sm text-blue-800 list-disc list-inside">
            <li>Table has role=&quot;table&quot; with caption</li>
            <li>Stock updates are announced via aria-live regions</li>
            <li>Row count and position are announced</li>
            <li>Interactive elements have descriptive labels</li>
          </ul>
        </div>
        <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
          <span id="table-status">Table with 20 products loaded</span>
        </div>
        <VirtualizedInventoryTable {...args} />
      </div>
    );
  },
  args: {
    products: generateMockProducts(20),
    height: 400,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Check for screen reader elements
    await waitFor(() => {
      const statusRegion = canvas.getByRole('status');
      expect(statusRegion).toHaveAttribute('aria-live', 'polite');
    });
    
    // Check table structure
    const table = canvasElement.querySelector('[role="table"]');
    expect(table).toBeInTheDocument();
    
    // Check for row announcements
    const firstRow = canvasElement.querySelector('[role="row"]');
    expect(firstRow).toHaveAttribute('aria-rowindex');
  },
};

export const KeyboardNavigation: Story = {
  render: (args) => {
    return (
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-medium text-green-900 mb-2">Keyboard Navigation</h3>
          <p className="text-sm text-green-800 mb-2">
            Navigate the table using keyboard shortcuts:
          </p>
          <ul className="text-sm text-green-800 list-disc list-inside">
            <li><kbd>Tab</kbd> - Move between interactive elements</li>
            <li><kbd>Arrow Keys</kbd> - Navigate between rows</li>
            <li><kbd>Space</kbd> - Select/deselect row</li>
            <li><kbd>Enter</kbd> - Activate row action</li>
            <li><kbd>Home/End</kbd> - Jump to first/last row</li>
            <li><kbd>Page Up/Down</kbd> - Scroll by page</li>
          </ul>
        </div>
        <VirtualizedInventoryTable {...args} />
      </div>
    );
  },
  args: {
    products: generateMockProducts(50),
    height: 400,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Focus on first interactive element
    await waitFor(() => {
      const firstButton = canvas.getAllByRole('button')[0];
      expect(firstButton).toBeInTheDocument();
    });
    
    const firstButton = canvas.getAllByRole('button')[0];
    firstButton.focus();
    expect(document.activeElement).toBe(firstButton);
    
    // Tab through elements
    await userEvent.tab();
    expect(document.activeElement).not.toBe(firstButton);
    
    // Test arrow key navigation
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{ArrowUp}');
    
    // Test space for selection
    await userEvent.keyboard(' ');
    
    // Test Home/End keys
    await userEvent.keyboard('{Home}');
    await userEvent.keyboard('{End}');
  },
};

export const FocusManagement: Story = {
  render: (args) => {
    const [focusedRow, setFocusedRow] = useState<number | null>(null);
    
    return (
      <div className="space-y-4">
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h3 className="font-medium text-purple-900 mb-2">Focus Management</h3>
          <p className="text-sm text-purple-800">
            Focus indicators and management for keyboard users.
            {focusedRow !== null && ` Currently focused on row ${focusedRow + 1}`}
          </p>
        </div>
        <div 
          onFocus={(e) => {
            const rowIndex = e.target.closest('[aria-rowindex]')?.getAttribute('aria-rowindex');
            if (rowIndex) setFocusedRow(parseInt(rowIndex) - 1);
          }}
        >
          <VirtualizedInventoryTable {...args} />
        </div>
      </div>
    );
  },
  args: {
    products: generateMockProducts(30),
    height: 400,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Check focus indicators
    const buttons = canvas.getAllByRole('button');
    const firstButton = buttons[0];
    
    await userEvent.click(firstButton);
    expect(firstButton).toHaveClass('focus:ring-2');
    
    // Tab to next element
    await userEvent.tab();
    
    // Check focus visible styles
    const activeElement = document.activeElement;
    expect(activeElement).toHaveClass('focus-visible:ring-2');
  },
};

export const HighContrastMode: Story = {
  render: (args) => {
    return (
      <div className="space-y-4">
        <div className="bg-gray-900 text-white p-4 rounded-lg">
          <h3 className="font-medium mb-2">High Contrast Mode</h3>
          <p className="text-sm">
            Table styled for high contrast accessibility.
          </p>
        </div>
        <div className="high-contrast-mode" style={{ 
          filter: 'contrast(2)', 
          backgroundColor: '#000',
          padding: '1rem',
          borderRadius: '0.5rem',
        }}>
          <VirtualizedInventoryTable {...args} />
        </div>
      </div>
    );
  },
  args: {
    products: generateMockProducts(20),
    height: 400,
  },
  decorators: [
    (Story) => (
      <div style={{ backgroundColor: '#000', padding: '2rem' }}>
        <Story />
      </div>
    ),
  ],
};

export const AriaLiveUpdates: Story = {
  render: function Component(args) {
    const [announcements, setAnnouncements] = useState<string[]>([]);
    
    const addAnnouncement = (message: string) => {
      setAnnouncements(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    };
    
    // Simulate inventory updates
    useEffect(() => {
      const timer = setInterval(() => {
        const productIndex = Math.floor(Math.random() * args.products.length);
        const product = args.products[productIndex];
        const newStock = Math.floor(Math.random() * 100);
        addAnnouncement(`${product.name} stock updated to ${newStock} units`);
      }, 5000);
      
      return () => clearInterval(timer);
    }, [args.products]);
    
    return (
      <div className="space-y-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-medium text-yellow-900 mb-2">Live Region Updates</h3>
          <p className="text-sm text-yellow-800 mb-2">
            Stock changes are announced to screen readers via ARIA live regions.
          </p>
          <div className="mt-2 p-2 bg-yellow-100 rounded text-xs">
            <h4 className="font-medium mb-1">Recent Announcements:</h4>
            <ul className="space-y-1">
              {announcements.slice(-3).map((announcement, index) => (
                <li key={index}>{announcement}</li>
              ))}
            </ul>
          </div>
        </div>
        
        {/* Screen reader only live region */}
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        >
          {announcements[announcements.length - 1]}
        </div>
        
        <VirtualizedInventoryTable {...args} />
      </div>
    );
  },
  args: {
    products: generateMockProducts(10),
    height: 300,
  },
};

export const TableWithCaption: Story = {
  render: (args) => {
    return (
      <div className="space-y-4">
        <div 
          role="table"
          aria-label="Product Inventory Management"
          aria-describedby="table-description"
        >
          <div id="table-description" className="sr-only">
            Table showing product inventory levels with quick adjustment controls. 
            Use arrow keys to navigate and space to select items.
          </div>
          <div role="caption" className="p-4 bg-muted rounded-t-lg">
            <h3 className="font-medium">Product Inventory</h3>
            <p className="text-sm text-muted-foreground">
              Manage stock levels across {args.products.length} products
            </p>
          </div>
          <VirtualizedInventoryTable {...args} />
        </div>
      </div>
    );
  },
  args: {
    products: generateMockProducts(25),
    height: 400,
  },
};

export const RowSelectionAnnouncements: Story = {
  render: function Component(args) {
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
    const [announcement, setAnnouncement] = useState('');
    
    const handleRowSelect = (productId: string, selected: boolean) => {
      setSelectedRows(prev => {
        const newSet = new Set(prev);
        if (selected) {
          newSet.add(productId);
        } else {
          newSet.delete(productId);
        }
        
        const product = args.products.find(p => p._id === productId);
        setAnnouncement(
          selected 
            ? `${product?.name} selected. ${newSet.size} items selected total.`
            : `${product?.name} deselected. ${newSet.size} items selected total.`,
        );
        
        return newSet;
      });
    };
    
    return (
      <div className="space-y-4">
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <h3 className="font-medium text-indigo-900 mb-2">Selection Announcements</h3>
          <p className="text-sm text-indigo-800">
            Row selections are announced to screen readers.
            Selected: {selectedRows.size} items
          </p>
        </div>
        
        <div
          role="status"
          aria-live="assertive"
          aria-atomic="true"
          className="sr-only"
        >
          {announcement}
        </div>
        
        <div onClick={(e) => {
          const checkbox = (e.target as HTMLElement).closest('input[type="checkbox"]');
          if (checkbox) {
            const productId = checkbox.getAttribute('data-product-id') || '';
            handleRowSelect(productId, (checkbox as HTMLInputElement).checked);
          }
        }}>
          <VirtualizedInventoryTable {...args} />
        </div>
      </div>
    );
  },
  args: {
    products: generateMockProducts(15),
    height: 400,
  },
};

export const ErrorStateAccessibility: Story = {
  render: (args) => {
    const [hasError, setHasError] = useState(false);
    
    return (
      <div className="space-y-4">
        <Button onClick={() => setHasError(!hasError)}>
          Toggle Error State
        </Button>
        
        {hasError ? (
          <div
            role="alert"
            aria-live="assertive"
            className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg"
          >
            <h3 className="font-medium text-destructive mb-2">
              Error Loading Inventory Data
            </h3>
            <p className="text-sm text-destructive/80">
              Failed to load inventory information. Please try again.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => setHasError(false)}
              aria-label="Retry loading inventory data"
            >
              Retry
            </Button>
          </div>
        ) : (
          <VirtualizedInventoryTable {...args} />
        )}
      </div>
    );
  },
  args: {
    products: generateMockProducts(10),
    height: 300,
  },
};

export const ReducedMotion: Story = {
  render: (args) => {
    return (
      <div className="space-y-4">
        <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
          <h3 className="font-medium text-teal-900 mb-2">Reduced Motion Support</h3>
          <p className="text-sm text-teal-800">
            Animations are disabled when users prefer reduced motion.
          </p>
        </div>
        <div className="reduced-motion">
          <style dangerouslySetInnerHTML={{ __html: `
            @media (prefers-reduced-motion: reduce) {
              .reduced-motion * {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
              }
            }
          `}} />
          <VirtualizedInventoryTable {...args} />
        </div>
      </div>
    );
  },
  args: {
    products: generateMockProducts(20),
    height: 400,
  },
};

export const DescriptiveButtons: Story = {
  render: (args) => {
    return (
      <div className="space-y-4">
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h3 className="font-medium text-orange-900 mb-2">Descriptive Button Labels</h3>
          <p className="text-sm text-orange-800">
            All interactive elements have descriptive aria-labels for context.
          </p>
        </div>
        <VirtualizedInventoryTable {...args} />
      </div>
    );
  },
  args: {
    products: generateMockProducts(10),
    height: 300,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Check button accessibility
    const buttons = canvas.getAllByRole('button');
    
    buttons.forEach((button) => {
      // Should have either text content or aria-label
      const hasText = button.textContent?.trim();
      const hasAriaLabel = button.getAttribute('aria-label');
      expect(hasText || hasAriaLabel).toBeTruthy();
    });
  },
};