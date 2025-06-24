import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProductSelector } from './ProductSelector';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { trpc } from '@/lib/trpc';
import { createTRPCClient } from '@/lib/trpc-client';
import { useState } from 'react';
import { fn } from '@storybook/test';
import { within, userEvent, expect, waitFor } from '@storybook/test';
import type { Product } from '@/types';
import { withScenario, withEndpointOverrides, withNetworkCondition } from '@/mocks/story-helpers';
import { trpcQuery } from '@/mocks/utils/trpc-mock';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Toaster, toast } from 'sonner';
import { AlertCircle, RefreshCw, AlertTriangle } from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: Infinity },
  },
});

const createMockProducts = (count: number, startId = 1): Product[] => {
  return Array.from({ length: count }, (_, i) => ({
    _id: `prod${startId + i}`,
    name: `Product ${startId + i}`,
    description: `Description for product ${startId + i}`,
    price: Math.floor(Math.random() * 100) + 10,
    image: `https://images.unsplash.com/photo-${1542291026 + i}-7eec264c27ff?w=500`,
    collectionId: 'col1',
    isFeatured: i % 3 === 0,
    slug: `product-${startId + i}`,
    variants: [],
    createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
  }));
};

const mockProductsPage1 = createMockProducts(20, 1);
const mockProductsPage2 = createMockProducts(20, 21);
const mockSearchResults = createMockProducts(5, 100).map((p, i) => ({
  ...p,
  name: `Search Result ${i + 1}`,
}));

const meta = {
  title: 'Product/ProductSelector',
  component: ProductSelector,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => {
      const [selectedIds, setSelectedIds] = useState<string[]>([]);
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <div className="max-w-4xl mx-auto p-6 bg-background">
              <Story selectedProductIds={selectedIds} onSelectionChange={setSelectedIds} />
            </div>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
  args: {
    selectedProductIds: [],
    onSelectionChange: fn(),
  },
} satisfies Meta<typeof ProductSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  decorators: [
    () => {
      const mockQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: Infinity,
            retry: false,
          },
        },
      });
      
      mockQueryClient.setQueryData(['product.list', { page: 1, limit: 20, search: undefined }], {
        products: mockProductsPage1,
        pagination: {
          page: 1,
          pages: 3,
          total: 50,
          limit: 20,
        },
      });
      
      const [selectedIds, setSelectedIds] = useState<string[]>([]);
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={mockQueryClient}>
          <QueryClientProvider client={mockQueryClient}>
            <div className="max-w-4xl mx-auto p-6 bg-background">
              <ProductSelector 
                selectedProductIds={selectedIds} 
                onSelectionChange={setSelectedIds}
              />
            </div>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
};

export const WithPreselectedItems: Story = {
  decorators: [
    () => {
      const mockQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: Infinity,
            retry: false,
          },
        },
      });
      
      mockQueryClient.setQueryData(['product.list', { page: 1, limit: 20, search: undefined }], {
        products: mockProductsPage1,
        pagination: {
          page: 1,
          pages: 3,
          total: 50,
          limit: 20,
        },
      });
      
      const [selectedIds, setSelectedIds] = useState<string[]>(['prod1', 'prod3', 'prod5']);
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={mockQueryClient}>
          <QueryClientProvider client={mockQueryClient}>
            <div className="max-w-4xl mx-auto p-6 bg-background">
              <ProductSelector 
                selectedProductIds={selectedIds} 
                onSelectionChange={setSelectedIds}
              />
            </div>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
};

export const WithApplyButton: Story = {
  decorators: [
    () => {
      const mockQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: Infinity,
            retry: false,
          },
        },
      });
      
      mockQueryClient.setQueryData(['product.list', { page: 1, limit: 20, search: undefined }], {
        products: mockProductsPage1,
        pagination: {
          page: 1,
          pages: 3,
          total: 50,
          limit: 20,
        },
      });
      
      const [selectedIds, setSelectedIds] = useState<string[]>(['prod2', 'prod4']);
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={mockQueryClient}>
          <QueryClientProvider client={mockQueryClient}>
            <div className="max-w-4xl mx-auto p-6 bg-background">
              <ProductSelector 
                selectedProductIds={selectedIds} 
                onSelectionChange={setSelectedIds}
                showApplyButton
              />
            </div>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
};

export const SearchResults: Story = {
  decorators: [
    () => {
      const mockQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: Infinity,
            retry: false,
          },
        },
      });
      
      mockQueryClient.setQueryData(['product.list', { page: 1, limit: 20, search: undefined }], {
        products: mockProductsPage1,
        pagination: {
          page: 1,
          pages: 3,
          total: 50,
          limit: 20,
        },
      });
      
      mockQueryClient.setQueryData(['product.list', { page: 1, limit: 20, search: 'search' }], {
        products: mockSearchResults,
        pagination: {
          page: 1,
          pages: 1,
          total: 5,
          limit: 20,
        },
      });
      
      const [selectedIds, setSelectedIds] = useState<string[]>([]);
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={mockQueryClient}>
          <QueryClientProvider client={mockQueryClient}>
            <div className="max-w-4xl mx-auto p-6 bg-background">
              <ProductSelector 
                selectedProductIds={selectedIds} 
                onSelectionChange={setSelectedIds}
              />
            </div>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    await waitFor(() => {
      expect(canvas.getByPlaceholderText(/Search products/)).toBeInTheDocument();
    });
    
    const searchInput = canvas.getByPlaceholderText(/Search products/);
    await userEvent.type(searchInput, 'search');
    
    await waitFor(() => {
      expect(canvas.getByText('Search Result 1')).toBeInTheDocument();
    }, { timeout: 2000 });
  },
};

export const EmptyState: Story = {
  decorators: [
    () => {
      const mockQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: Infinity,
            retry: false,
          },
        },
      });
      
      mockQueryClient.setQueryData(['product.list', { page: 1, limit: 20, search: undefined }], {
        products: [],
        pagination: {
          page: 1,
          pages: 1,
          total: 0,
          limit: 20,
        },
      });
      
      const [selectedIds, setSelectedIds] = useState<string[]>([]);
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={mockQueryClient}>
          <QueryClientProvider client={mockQueryClient}>
            <div className="max-w-4xl mx-auto p-6 bg-background">
              <ProductSelector 
                selectedProductIds={selectedIds} 
                onSelectionChange={setSelectedIds}
              />
            </div>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
};

export const LoadingState: Story = {
  decorators: [
    (Story) => (
      <QueryClientProvider client={new QueryClient()}>
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <div className="max-w-4xl mx-auto p-6 bg-background">
            <Story />
          </div>
        </trpc.Provider>
      </QueryClientProvider>
    ),
  ],
};

export const SelectAllInteraction: Story = {
  decorators: [
    () => {
      const mockQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: Infinity,
            retry: false,
          },
        },
      });
      
      mockQueryClient.setQueryData(['product.list', { page: 1, limit: 20, search: undefined }], {
        products: mockProductsPage1.slice(0, 5),
        pagination: {
          page: 1,
          pages: 1,
          total: 5,
          limit: 20,
        },
      });
      
      const [selectedIds, setSelectedIds] = useState<string[]>([]);
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={mockQueryClient}>
          <QueryClientProvider client={mockQueryClient}>
            <div className="max-w-4xl mx-auto p-6 bg-background">
              <ProductSelector 
                selectedProductIds={selectedIds} 
                onSelectionChange={setSelectedIds}
              />
            </div>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    await waitFor(() => {
      expect(canvas.getByText('Select Page')).toBeInTheDocument();
    });
    
    const selectAllButton = canvas.getByText('Select Page');
    await userEvent.click(selectAllButton);
    
    await waitFor(() => {
      expect(canvas.getByText('5 products selected')).toBeInTheDocument();
      expect(canvas.getByText('Deselect Page')).toBeInTheDocument();
    });
  },
};

export const ClearSelectionInteraction: Story = {
  decorators: [
    () => {
      const mockQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: Infinity,
            retry: false,
          },
        },
      });
      
      mockQueryClient.setQueryData(['product.list', { page: 1, limit: 20, search: undefined }], {
        products: mockProductsPage1.slice(0, 5),
        pagination: {
          page: 1,
          pages: 1,
          total: 5,
          limit: 20,
        },
      });
      
      const [selectedIds, setSelectedIds] = useState<string[]>(['prod1', 'prod2', 'prod3']);
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={mockQueryClient}>
          <QueryClientProvider client={mockQueryClient}>
            <div className="max-w-4xl mx-auto p-6 bg-background">
              <ProductSelector 
                selectedProductIds={selectedIds} 
                onSelectionChange={setSelectedIds}
              />
            </div>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    await waitFor(() => {
      expect(canvas.getByText('Clear All (3)')).toBeInTheDocument();
    });
    
    const clearButton = canvas.getByText('Clear All (3)');
    await userEvent.click(clearButton);
    
    await waitFor(() => {
      expect(canvas.getByText('0 products selected')).toBeInTheDocument();
      expect(canvas.queryByText(/Clear All/)).not.toBeInTheDocument();
    });
  },
};

export const Pagination: Story = {
  decorators: [
    () => {
      const mockQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: Infinity,
            retry: false,
          },
        },
      });
      
      mockQueryClient.setQueryData(['product.list', { page: 1, limit: 20, search: undefined }], {
        products: mockProductsPage1,
        pagination: {
          page: 1,
          pages: 3,
          total: 50,
          limit: 20,
        },
      });
      
      mockQueryClient.setQueryData(['product.list', { page: 2, limit: 20, search: undefined }], {
        products: mockProductsPage2,
        pagination: {
          page: 2,
          pages: 3,
          total: 50,
          limit: 20,
        },
      });
      
      const [selectedIds, setSelectedIds] = useState<string[]>(['prod1', 'prod25']);
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={mockQueryClient}>
          <QueryClientProvider client={mockQueryClient}>
            <div className="max-w-4xl mx-auto p-6 bg-background">
              <ProductSelector 
                selectedProductIds={selectedIds} 
                onSelectionChange={setSelectedIds}
              />
            </div>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    await waitFor(() => {
      expect(canvas.getByText('Page 1 of 3')).toBeInTheDocument();
    });
    
    const nextButton = canvas.getByText('Next');
    await userEvent.click(nextButton);
    
    await waitFor(() => {
      expect(canvas.getByText('Page 2 of 3')).toBeInTheDocument();
      expect(canvas.getByText('Product 21')).toBeInTheDocument();
    });
  },
};

export const MobileView: Story = {
  decorators: [
    () => {
      const mockQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: Infinity,
            retry: false,
          },
        },
      });
      
      mockQueryClient.setQueryData(['product.list', { page: 1, limit: 20, search: undefined }], {
        products: mockProductsPage1.slice(0, 10),
        pagination: {
          page: 1,
          pages: 1,
          total: 10,
          limit: 20,
        },
      });
      
      const [selectedIds, setSelectedIds] = useState<string[]>([]);
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={mockQueryClient}>
          <QueryClientProvider client={mockQueryClient}>
            <div className="max-w-4xl mx-auto p-6 bg-background">
              <ProductSelector 
                selectedProductIds={selectedIds} 
                onSelectionChange={setSelectedIds}
              />
            </div>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const ApplyChangesFlow: Story = {
  decorators: [
    () => {
      const mockQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: Infinity,
            retry: false,
          },
        },
      });
      
      mockQueryClient.setQueryData(['product.list', { page: 1, limit: 20, search: undefined }], {
        products: mockProductsPage1.slice(0, 5),
        pagination: {
          page: 1,
          pages: 1,
          total: 5,
          limit: 20,
        },
      });
      
      const [selectedIds, setSelectedIds] = useState<string[]>(['prod1']);
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={mockQueryClient}>
          <QueryClientProvider client={mockQueryClient}>
            <div className="max-w-4xl mx-auto p-6 bg-background">
              <ProductSelector 
                selectedProductIds={selectedIds} 
                onSelectionChange={setSelectedIds}
                showApplyButton
              />
            </div>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    
    await waitFor(() => {
      expect(canvas.getByText('Product 2')).toBeInTheDocument();
    });
    
    // Click on product 2 checkbox
    const product2 = canvas.getByText('Product 2').closest('label');
    if (product2) {
      await userEvent.click(product2);
    }
    
    // Apply button should appear
    await waitFor(() => {
      expect(canvas.getByText('Apply Changes')).toBeInTheDocument();
    });
    
    const applyButton = canvas.getByText('Apply Changes');
    await userEvent.click(applyButton);
    
    // Check that onSelectionChange was called
    await waitFor(() => {
      expect(args.onSelectionChange).toHaveBeenCalledWith(['prod1', 'prod2']);
    });
  },
};

export const SingleProductView: Story = {
  decorators: [
    () => {
      const mockQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: Infinity,
            retry: false,
          },
        },
      });
      
      mockQueryClient.setQueryData(['product.list', { page: 1, limit: 20, search: undefined }], {
        products: [mockProductsPage1[0]],
        pagination: {
          page: 1,
          pages: 1,
          total: 1,
          limit: 20,
        },
      });
      
      const [selectedIds, setSelectedIds] = useState<string[]>([]);
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={mockQueryClient}>
          <QueryClientProvider client={mockQueryClient}>
            <div className="max-w-4xl mx-auto p-6 bg-background">
              <ProductSelector 
                selectedProductIds={selectedIds} 
                onSelectionChange={setSelectedIds}
              />
            </div>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
};

export const NoSearchResults: Story = {
  decorators: [
    () => {
      const mockQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: Infinity,
            retry: false,
          },
        },
      });
      
      mockQueryClient.setQueryData(['product.list', { page: 1, limit: 20, search: undefined }], {
        products: mockProductsPage1,
        pagination: {
          page: 1,
          pages: 3,
          total: 50,
          limit: 20,
        },
      });
      
      mockQueryClient.setQueryData(['product.list', { page: 1, limit: 20, search: 'nonexistent' }], {
        products: [],
        pagination: {
          page: 1,
          pages: 1,
          total: 0,
          limit: 20,
        },
      });
      
      const [selectedIds, setSelectedIds] = useState<string[]>([]);
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={mockQueryClient}>
          <QueryClientProvider client={mockQueryClient}>
            <div className="max-w-4xl mx-auto p-6 bg-background">
              <ProductSelector 
                selectedProductIds={selectedIds} 
                onSelectionChange={setSelectedIds}
              />
            </div>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    await waitFor(() => {
      expect(canvas.getByPlaceholderText(/Search products/)).toBeInTheDocument();
    });
    
    const searchInput = canvas.getByPlaceholderText(/Search products/);
    await userEvent.type(searchInput, 'nonexistent');
    
    await waitFor(() => {
      expect(canvas.getByText('No products found matching your search.')).toBeInTheDocument();
    }, { timeout: 2000 });
  },
};

export const KeyboardNavigation: Story = {
  decorators: [
    () => {
      const mockQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: Infinity,
            retry: false,
          },
        },
      });
      
      mockQueryClient.setQueryData(['product.list', { page: 1, limit: 20, search: undefined }], {
        products: mockProductsPage1.slice(0, 5),
        pagination: {
          page: 1,
          pages: 1,
          total: 5,
          limit: 20,
        },
      });
      
      const [selectedIds, setSelectedIds] = useState<string[]>([]);
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={mockQueryClient}>
          <QueryClientProvider client={mockQueryClient}>
            <div className="max-w-4xl mx-auto p-6 bg-background">
              <ProductSelector 
                selectedProductIds={selectedIds} 
                onSelectionChange={setSelectedIds}
              />
            </div>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    await waitFor(() => {
      expect(canvas.getByPlaceholderText(/Search products/)).toBeInTheDocument();
    });
    
    // Focus search input
    const searchInput = canvas.getByPlaceholderText(/Search products/);
    await userEvent.click(searchInput);
    expect(document.activeElement).toBe(searchInput);
    
    // Tab to first checkbox
    await userEvent.tab();
    await userEvent.tab(); // Skip select all button
    
    const firstCheckbox = canvas.getAllByRole('checkbox')[1]; // Skip "select all" checkbox
    expect(document.activeElement).toBe(firstCheckbox);
    
    // Space to select
    await userEvent.keyboard(' ');
    expect(firstCheckbox).toBeChecked();
    
    // Tab through more products
    await userEvent.tab();
    await userEvent.tab();
    
    // Arrow keys navigation
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{ArrowUp}');
    
    // Enter to select
    await userEvent.keyboard('{Enter}');
    
    // Should have 2 selected
    await waitFor(() => {
      expect(canvas.getByText('2 products selected')).toBeInTheDocument();
    });
  },
};

export const AccessibilityFeatures: Story = {
  decorators: [
    () => {
      const mockQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: Infinity,
            retry: false,
          },
        },
      });
      
      mockQueryClient.setQueryData(['product.list', { page: 1, limit: 20, search: undefined }], {
        products: mockProductsPage1.slice(0, 3),
        pagination: {
          page: 1,
          pages: 1,
          total: 3,
          limit: 20,
        },
      });
      
      const [selectedIds, setSelectedIds] = useState<string[]>(['prod1']);
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={mockQueryClient}>
          <QueryClientProvider client={mockQueryClient}>
            <div className="max-w-4xl mx-auto p-6 bg-background">
              <ProductSelector 
                selectedProductIds={selectedIds} 
                onSelectionChange={setSelectedIds}
              />
            </div>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    await waitFor(() => {
      expect(canvas.getByText('Product 1')).toBeInTheDocument();
    });
    
    // Check all checkboxes have labels
    const checkboxes = canvas.getAllByRole('checkbox');
    checkboxes.forEach(checkbox => {
      expect(checkbox).toHaveAccessibleName();
    });
    
    // Check search input has label
    const searchInput = canvas.getByPlaceholderText(/Search products/);
    expect(searchInput).toHaveAccessibleName();
    
    // Check selection status is announced
    const statusText = canvas.getByText('1 product selected');
    expect(statusText).toBeInTheDocument();
    
    // Select another product
    const product2Checkbox = checkboxes[2]; // Product 2
    await userEvent.click(product2Checkbox);
    
    // Status should update
    await waitFor(() => {
      expect(canvas.getByText('2 products selected')).toBeInTheDocument();
    });
  },
};

export const HighContrastMode: Story = {
  decorators: [
    () => {
      const mockQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: Infinity,
            retry: false,
          },
        },
      });
      
      mockQueryClient.setQueryData(['product.list', { page: 1, limit: 20, search: undefined }], {
        products: mockProductsPage1.slice(0, 3),
        pagination: {
          page: 1,
          pages: 1,
          total: 3,
          limit: 20,
        },
      });
      
      const [selectedIds, setSelectedIds] = useState<string[]>(['prod1']);
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={mockQueryClient}>
          <QueryClientProvider client={mockQueryClient}>
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">Normal Mode</h3>
                <div className="max-w-4xl mx-auto p-6 bg-background border rounded">
                  <ProductSelector 
                    selectedProductIds={selectedIds} 
                    onSelectionChange={setSelectedIds}
                  />
                </div>
              </div>
              <div style={{ filter: 'contrast(2) saturate(0)' }}>
                <h3 className="text-lg font-semibold mb-4">High Contrast Mode</h3>
                <div className="max-w-4xl mx-auto p-6 bg-background border rounded">
                  <ProductSelector 
                    selectedProductIds={[...selectedIds]} 
                    onSelectionChange={() => {
                      // Empty handler for accessibility demo
                    }}
                  />
                </div>
              </div>
            </div>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
};

// Error State Stories
export const NetworkError: Story = {
  decorators: [
    (Story) => (
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <div className="max-w-4xl mx-auto p-6 bg-background">
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Network error simulation - Products will fail to load
              </AlertDescription>
            </Alert>
            <Story />
            <Toaster position="top-right" />
          </div>
        </trpc.Provider>
      </QueryClientProvider>
    ),
  ],
  ...withNetworkCondition('offline'),
};

export const ServerError: Story = {
  decorators: [
    (Story) => (
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <div className="max-w-4xl mx-auto p-6 bg-background">
            <Card className="p-4 mb-4 border-red-200 bg-red-50">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                Server Error Simulation
              </h4>
              <p className="text-sm text-muted-foreground">
                The server will return a 500 error when fetching products
              </p>
            </Card>
            <Story />
            <Toaster position="top-right" />
          </div>
        </trpc.Provider>
      </QueryClientProvider>
    ),
  ],
  ...withEndpointOverrides([
    trpcQuery('product.list', async () => {
      throw new Error('Internal server error');
    }),
  ]),
};

export const ValidationError: Story = {
  decorators: [
    (Story) => {
      const [error, setError] = useState<string | null>(null);
      
      return (
        <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
          <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
            <div className="max-w-4xl mx-auto p-6 bg-background">
              <Card className="p-4 mb-4">
                <h4 className="font-medium mb-2">Validation Error Demo</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Try searching with special characters to trigger validation errors
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setError('Search query contains invalid characters')}
                >
                  Trigger Error
                </Button>
              </Card>
              
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <Story />
              <Toaster position="top-right" />
            </div>
          </trpc.Provider>
        </QueryClientProvider>
      );
    },
  ],
  ...withEndpointOverrides([
    trpcQuery('product.list', async ({ search }: { search?: string }) => {
      if (search && /[<>"'&]/.test(search)) {
        throw new Error('Search query contains invalid characters');
      }
      return {
        products: mockProductsPage1.slice(0, 5),
        pagination: {
          page: 1,
          pages: 1,
          total: 5,
          limit: 20,
        },
      };
    }),
  ]),
};

export const TimeoutError: Story = {
  decorators: [
    (Story) => {
      const [isRetrying] = useState(false);
      
      return (
        <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
          <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
            <div className="max-w-4xl mx-auto p-6 bg-background">
              <Alert className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="flex items-center justify-between">
                    <span>Request timeout simulation (5s delay)</span>
                    {isRetrying && <RefreshCw className="w-4 h-4 animate-spin" />}
                  </div>
                </AlertDescription>
              </Alert>
              <Story />
              <Toaster position="top-right" />
            </div>
          </trpc.Provider>
        </QueryClientProvider>
      );
    },
  ],
  ...withEndpointOverrides([
    trpcQuery('product.list', async () => {
      await new Promise(resolve => setTimeout(resolve, 5000));
      throw new Error('Request timeout');
    }),
  ]),
};

export const PartialDataError: Story = {
  decorators: [
    () => {
      const mockQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: Infinity,
            retry: false,
          },
        },
      });
      
      // Some products have missing data
      const corruptedProducts = mockProductsPage1.slice(0, 5).map((product, i) => {
        if (i % 2 === 0) {
          return {
            ...product,
            image: null, // Missing image
            price: null, // Missing price
          };
        }
        return product;
      });
      
      mockQueryClient.setQueryData(['product.list', { page: 1, limit: 20, search: undefined }], {
        products: corruptedProducts,
        pagination: {
          page: 1,
          pages: 1,
          total: 5,
          limit: 20,
        },
      });
      
      const [selectedIds, setSelectedIds] = useState<string[]>([]);
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={mockQueryClient}>
          <QueryClientProvider client={mockQueryClient}>
            <div className="max-w-4xl mx-auto p-6 bg-background">
              <Alert className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Some products have missing data (images, prices)
                </AlertDescription>
              </Alert>
              <ProductSelector 
                selectedProductIds={selectedIds} 
                onSelectionChange={setSelectedIds}
              />
            </div>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
};

export const PermissionError: Story = {
  decorators: [
    (Story) => (
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <div className="max-w-4xl mx-auto p-6 bg-background">
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Permission Denied</p>
                  <p className="text-sm">You don&apos;t have permission to view products. Please contact your administrator.</p>
                </div>
              </AlertDescription>
            </Alert>
            <Story />
            <Toaster position="top-right" />
          </div>
        </trpc.Provider>
      </QueryClientProvider>
    ),
  ],
  ...withEndpointOverrides([
    trpcQuery('product.list', async () => {
      const error = new Error('Forbidden: Insufficient permissions');
      (error as any).code = 'FORBIDDEN';
      throw error;
    }),
  ]),
};

export const ErrorRecovery: Story = {
  decorators: [
    () => {
      const [attemptCount, setAttemptCount] = useState(0);
      const [isError, setIsError] = useState(true);
      const mockQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: Infinity,
            retry: false,
          },
        },
      });
      
      const handleRetry = () => {
        setAttemptCount(prev => prev + 1);
        if (attemptCount >= 2) {
          setIsError(false);
          mockQueryClient.setQueryData(['product.list', { page: 1, limit: 20, search: undefined }], {
            products: mockProductsPage1.slice(0, 5),
            pagination: {
              page: 1,
              pages: 1,
              total: 5,
              limit: 20,
            },
          });
          toast.success('Products loaded successfully!');
        } else {
          toast.error('Still failing... Try again');
        }
      };
      
      if (isError && attemptCount < 3) {
        mockQueryClient.setQueryData(['product.list', { page: 1, limit: 20, search: undefined }], null);
      }
      
      const [selectedIds, setSelectedIds] = useState<string[]>([]);
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={mockQueryClient}>
          <QueryClientProvider client={mockQueryClient}>
            <div className="max-w-4xl mx-auto p-6 bg-background">
              <Card className="p-4 mb-4">
                <h4 className="font-medium mb-2">Error Recovery Demo</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  First 2 attempts will fail, 3rd will succeed
                </p>
                <div className="flex items-center gap-3">
                  <Button
                    size="sm"
                    onClick={handleRetry}
                    disabled={!isError}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry ({attemptCount}/3)
                  </Button>
                  <Badge variant={isError ? 'destructive' : 'default'}>
                    {isError ? 'Error' : 'Success'}
                  </Badge>
                </div>
              </Card>
              
              <ProductSelector 
                selectedProductIds={selectedIds} 
                onSelectionChange={setSelectedIds}
              />
              <Toaster position="top-right" />
            </div>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
};

export const RateLimitError: Story = {
  decorators: [
    (Story) => {
      const [remainingTime, setRemainingTime] = useState(10);
      
      useState(() => {
        const timer = setInterval(() => {
          setRemainingTime(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        
        return () => clearInterval(timer);
      });
      
      return (
        <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
          <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
            <div className="max-w-4xl mx-auto p-6 bg-background">
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="flex items-center justify-between">
                    <span>Rate limit exceeded. Too many requests.</span>
                    {remainingTime > 0 && (
                      <Badge variant="destructive">
                        Retry in {remainingTime}s
                      </Badge>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
              <Story />
              <Toaster position="top-right" />
            </div>
          </trpc.Provider>
        </QueryClientProvider>
      );
    },
  ],
  ...withEndpointOverrides([
    trpcQuery('product.list', async () => {
      const error = new Error('Too many requests');
      (error as any).code = 'TOO_MANY_REQUESTS';
      throw error;
    }),
  ]),
};

export const MSWIntegration: Story = {
  decorators: [
    (Story) => (
      <QueryClientProvider client={new QueryClient()}>
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <div className="max-w-4xl mx-auto p-6 bg-background">
            <Card className="p-4 mb-4">
              <h4 className="font-medium mb-2">MSW Integration</h4>
              <p className="text-sm text-muted-foreground">
                This story uses Mock Service Worker for realistic API behavior
              </p>
            </Card>
            <Story />
            <Toaster position="top-right" />
          </div>
        </trpc.Provider>
      </QueryClientProvider>
    ),
  ],
  ...withScenario('default'),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Wait for products to load
    await waitFor(() => {
      expect(canvas.getByText(/products? selected/)).toBeInTheDocument();
    }, { timeout: 5000 });
  },
};