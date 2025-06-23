import type { Meta, StoryObj } from '@storybook/react-vite';
import { CollectionsList } from './CollectionsList';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { trpc } from '@/lib/trpc';
import { createTRPCClient } from '@/lib/trpc-client';
import { fn } from '@storybook/test';
import { within, userEvent, expect, waitFor } from '@storybook/test';
import type { RouterOutputs } from '@/lib/trpc';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Search, Filter, SortAsc, SortDesc } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

type Collection = RouterOutputs['collection']['myCollections']['collections'][0];

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: Infinity },
  },
});

const mockCollections: Collection[] = [
  {
    _id: '1',
    name: 'Summer Collection',
    slug: 'summer-collection',
    description: 'Bright and breezy styles perfect for warm weather.',
    isPublic: true,
    products: ['prod1', 'prod2', 'prod3'] as any[],
    owner: 'user1',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  } as any,
  {
    _id: '2',
    name: 'Featured Products',
    slug: 'featured-products',
    description: 'Our hand-picked selection of bestsellers.',
    isPublic: true,
    products: ['prod4', 'prod5'] as any[],
    owner: 'user1',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
  {
    _id: '3',
    name: 'Private Collection',
    slug: 'private-collection',
    description: undefined,
    isPublic: false,
    products: [] as any[],
    owner: 'user1',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
];

const meta = {
  title: 'Collections/CollectionsList',
  component: CollectionsList,
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
    onEdit: fn(),
  },
} satisfies Meta<typeof CollectionsList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
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
      
      mockQueryClient.setQueryData(['collection.myCollections', undefined], {
        collections: mockCollections,
        nextCursor: null,
      });
      
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
      
      emptyQueryClient.setQueryData(['collection.myCollections', undefined], {
        collections: [],
        nextCursor: null,
      });
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={emptyQueryClient}>
          <QueryClientProvider client={emptyQueryClient}>
            <div className="p-6 bg-background min-h-screen">
              <Story />
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
          <div className="p-6 bg-background min-h-screen">
            <Story />
          </div>
        </trpc.Provider>
      </QueryClientProvider>
    ),
  ],
};

export const WithPagination: Story = {
  decorators: [
    (Story) => {
      const paginatedQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: Infinity,
            retry: false,
          },
        },
      });
      
      paginatedQueryClient.setQueryData(['collection.myCollections', undefined], {
        collections: mockCollections,
        nextCursor: 'next-page-cursor',
      });
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={paginatedQueryClient}>
          <QueryClientProvider client={paginatedQueryClient}>
            <div className="p-6 bg-background min-h-screen">
              <Story />
            </div>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
};

export const ManyProducts: Story = {
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
      
      const collectionsWithManyProducts = [
        {
          ...mockCollections[0],
          products: Array.from({ length: 50 }, (_, i) => `prod${i}`) as any[],
        },
        {
          ...mockCollections[1],
          products: Array.from({ length: 123 }, (_, i) => `prod${i}`) as any[],
        },
      ];
      
      mockQueryClient.setQueryData(['collection.myCollections', undefined], {
        collections: collectionsWithManyProducts,
        nextCursor: null,
      });
      
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

export const LongNames: Story = {
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
      
      const collectionsWithLongNames = [
        {
          ...mockCollections[0],
          name: 'This Is A Very Long Collection Name That Might Need Special Handling In The UI',
          description: 'This is an extremely long description that goes on and on and on. It contains many details about the collection and its purpose, which might need to be truncated or handled specially in the user interface to maintain a clean layout.',
        },
        mockCollections[1],
        mockCollections[2],
      ];
      
      mockQueryClient.setQueryData(['collection.myCollections', undefined], {
        collections: collectionsWithLongNames,
        nextCursor: null,
      });
      
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

export const EditAction: Story = {
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
      
      mockQueryClient.setQueryData(['collection.myCollections', undefined], {
        collections: mockCollections,
        nextCursor: null,
      });
      
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
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    
    await waitFor(() => {
      expect(canvas.getByText('Summer Collection')).toBeInTheDocument();
    });
    
    // Click on the collection name
    const collectionName = canvas.getByText('Summer Collection');
    await userEvent.click(collectionName);
    
    // Check that onEdit was called
    await waitFor(() => {
      expect(args.onEdit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Summer Collection',
        })
      );
    });
  },
};

export const DeleteAction: Story = {
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
      
      mockQueryClient.setQueryData(['collection.myCollections', undefined], {
        collections: mockCollections,
        nextCursor: null,
      });
      
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    await waitFor(() => {
      expect(canvas.getByText('Summer Collection')).toBeInTheDocument();
    });
    
    // Mock window.confirm
    const originalConfirm = window.confirm;
    window.confirm = () => true;
    
    // Find and click the first delete button
    const deleteButtons = canvas.getAllByRole('button');
    const deleteButton = deleteButtons.find(btn => {
      const svg = btn.querySelector('svg');
      return svg && svg.classList.contains('w-4') && btn.className.includes('destructive');
    });
    
    if (deleteButton) {
      await userEvent.click(deleteButton);
    }
    
    // Restore original confirm
    window.confirm = originalConfirm;
  },
};

export const MobileView: Story = {
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
      
      mockQueryClient.setQueryData(['collection.myCollections', undefined], {
        collections: mockCollections,
        nextCursor: null,
      });
      
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
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const TabletView: Story = {
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
      
      mockQueryClient.setQueryData(['collection.myCollections', undefined], {
        collections: mockCollections,
        nextCursor: null,
      });
      
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
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};

export const AllPrivate: Story = {
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
      
      const privateCollections = mockCollections.map(col => ({
        ...col,
        isPublic: false,
      }));
      
      mockQueryClient.setQueryData(['collection.myCollections', undefined], {
        collections: privateCollections,
        nextCursor: null,
      });
      
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

export const MixedContent: Story = {
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
      
      const mixedCollections = [
        ...mockCollections,
        {
          _id: '4',
          name: 'Winter Sale',
          slug: 'winter-sale',
          description: '50% off selected winter items!',
          isPublic: true,
          products: Array.from({ length: 15 }, (_, i) => `prod${i}`) as any[],
          owner: 'user1',
          createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
          updatedAt: new Date(Date.now() - 30 * 60 * 1000),
        },
        {
          _id: '5',
          name: 'New Arrivals',
          slug: 'new-arrivals',
          description: undefined,
          isPublic: true,
          products: [] as any[],
          owner: 'user1',
          createdAt: new Date(), // Just now
          updatedAt: new Date(),
        },
      ];
      
      mockQueryClient.setQueryData(['collection.myCollections', undefined], {
        collections: mixedCollections,
        nextCursor: null,
      });
      
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

// Enhanced CollectionsList with filtering, sorting, and search
const EnhancedCollectionsList = (props: typeof CollectionsList.arguments) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState<'all' | 'public' | 'private'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'products'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="bg-card p-4 rounded-lg shadow space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search collections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="search-input"
          />
        </div>
        
        {/* Filter and Sort Controls */}
        <div className="flex flex-wrap gap-4 items-center">
          {/* Filter Controls */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Filter:</span>
            <div className="flex gap-2">
              <Badge
                variant={filterBy === 'all' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setFilterBy('all')}
                data-testid="filter-all"
              >
                All
              </Badge>
              <Badge
                variant={filterBy === 'public' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setFilterBy('public')}
                data-testid="filter-public"
              >
                Public
              </Badge>
              <Badge
                variant={filterBy === 'private' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setFilterBy('private')}
                data-testid="filter-private"
              >
                Private
              </Badge>
            </div>
          </div>
          
          {/* Sort Controls */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Sort by:</span>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              options={[
                { value: 'name', label: 'Name' },
                { value: 'date', label: 'Date Created' },
                { value: 'products', label: 'Product Count' },
              ]}
              className="w-[140px]"
              data-testid="sort-select"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              data-testid="sort-order"
            >
              {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        
        {/* Active Filters Summary */}
        {(searchQuery || filterBy !== 'all') && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Active filters:</span>
            {searchQuery && (
              <Badge variant="secondary">
                Search: "{searchQuery}"
                <button
                  onClick={() => setSearchQuery('')}
                  className="ml-1 text-xs hover:text-destructive"
                >
                  ×
                </button>
              </Badge>
            )}
            {filterBy !== 'all' && (
              <Badge variant="secondary">
                {filterBy} only
                <button
                  onClick={() => setFilterBy('all')}
                  className="ml-1 text-xs hover:text-destructive"
                >
                  ×
                </button>
              </Badge>
            )}
          </div>
        )}
      </div>
      
      {/* Collections List */}
      <CollectionsList {...props} />
    </div>
  );
};

export const WithSearch: Story = {
  args: {
    onEdit: fn(),
  },
  decorators: [
    (_, { args }) => {
      const mockQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: Infinity,
            retry: false,
          },
        },
      });
      
      const searchableCollections = [
        ...mockCollections,
        {
          _id: '4',
          name: 'Seasonal Specials',
          slug: 'seasonal-specials',
          description: 'Limited time offers for each season',
          isPublic: true,
          products: ['prod1', 'prod2'] as any[],
          owner: 'user1',
          createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        },
        {
          _id: '5',
          name: 'Clearance Items',
          slug: 'clearance-items',
          description: 'Last chance to buy!',
          isPublic: false,
          products: Array.from({ length: 8 }, (_, i) => `prod${i}`) as any[],
          owner: 'user1',
          createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
        },
      ];
      
      mockQueryClient.setQueryData(['collection.myCollections', undefined], {
        collections: searchableCollections,
        nextCursor: null,
      });
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={mockQueryClient}>
          <QueryClientProvider client={mockQueryClient}>
            <div className="p-6 bg-background min-h-screen">
              <EnhancedCollectionsList {...args} />
            </div>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Wait for collections to load
    await waitFor(() => {
      expect(canvas.getByText('Summer Collection')).toBeInTheDocument();
    });
    
    // Test search functionality
    const searchInput = canvas.getByTestId('search-input');
    await userEvent.type(searchInput, 'Summer');
    
    // Should show active filter
    await waitFor(() => {
      expect(canvas.getByText('Search: "Summer"')).toBeInTheDocument();
    });
    
    // Clear search
    const clearButton = canvas.getByText('×');
    await userEvent.click(clearButton);
    
    // Search should be cleared
    await waitFor(() => {
      expect(searchInput).toHaveValue('');
    });
  },
};

export const WithFiltering: Story = {
  args: {
    onEdit: fn(),
  },
  decorators: [
    (_, { args }) => {
      const mockQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: Infinity,
            retry: false,
          },
        },
      });
      
      mockQueryClient.setQueryData(['collection.myCollections', undefined], {
        collections: mockCollections,
        nextCursor: null,
      });
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={mockQueryClient}>
          <QueryClientProvider client={mockQueryClient}>
            <div className="p-6 bg-background min-h-screen">
              <EnhancedCollectionsList {...args} />
            </div>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Wait for collections to load
    await waitFor(() => {
      expect(canvas.getByText('Summer Collection')).toBeInTheDocument();
    });
    
    // Click public filter
    const publicFilter = canvas.getByTestId('filter-public');
    await userEvent.click(publicFilter);
    
    // Should show active filter
    await waitFor(() => {
      expect(canvas.getByText('public only')).toBeInTheDocument();
    });
    
    // Click private filter
    const privateFilter = canvas.getByTestId('filter-private');
    await userEvent.click(privateFilter);
    
    // Should update active filter
    await waitFor(() => {
      expect(canvas.getByText('private only')).toBeInTheDocument();
    });
    
    // Click all filter to reset
    const allFilter = canvas.getByTestId('filter-all');
    await userEvent.click(allFilter);
  },
};

export const WithSorting: Story = {
  args: {
    onEdit: fn(),
  },
  decorators: [
    (_, { args }) => {
      const mockQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: Infinity,
            retry: false,
          },
        },
      });
      
      // Create collections with different product counts for sorting
      const sortableCollections = [
        { ...mockCollections[0], name: 'Alpha Collection', products: Array(10).fill('prod') as any[] },
        { ...mockCollections[1], name: 'Beta Collection', products: Array(5).fill('prod') as any[] },
        { ...mockCollections[2], name: 'Gamma Collection', products: Array(20).fill('prod') as any[] },
      ];
      
      mockQueryClient.setQueryData(['collection.myCollections', undefined], {
        collections: sortableCollections,
        nextCursor: null,
      });
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={mockQueryClient}>
          <QueryClientProvider client={mockQueryClient}>
            <div className="p-6 bg-background min-h-screen">
              <EnhancedCollectionsList {...args} />
            </div>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Wait for collections to load
    await waitFor(() => {
      expect(canvas.getByText('Alpha Collection')).toBeInTheDocument();
    });
    
    // Change sort to product count
    const sortSelect = canvas.getByTestId('sort-select');
    await userEvent.selectOptions(sortSelect, 'products');
    
    // Toggle sort order
    const sortOrderButton = canvas.getByTestId('sort-order');
    await userEvent.click(sortOrderButton);
    
    // Change sort to date
    await userEvent.selectOptions(sortSelect, 'date');
  },
};

export const ErrorState: Story = {
  decorators: [
    () => {
      const errorQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: Infinity,
            retry: false,
          },
        },
      });
      
      // Set error state
      // Simulate error state by setting null data
      errorQueryClient.setQueryData(['collection.myCollections', undefined], null);
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={errorQueryClient}>
          <QueryClientProvider client={errorQueryClient}>
            <div className="p-6 bg-background min-h-screen">
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-center">
                <p className="text-destructive mb-2">Error: Failed to fetch collections</p>
                <Button variant="outline" size="sm">
                  Retry
                </Button>
              </div>
            </div>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
};

export const CombinedFilters: Story = {
  args: {
    onEdit: fn(),
  },
  decorators: [
    (_, { args }) => {
      const mockQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: Infinity,
            retry: false,
          },
        },
      });
      
      const manyCollections = [
        ...mockCollections,
        {
          _id: '4',
          name: 'Winter Essentials',
          slug: 'winter-essentials',
          description: 'Stay warm this winter',
          isPublic: true,
          products: Array(25).fill('prod') as any[],
          owner: 'user1',
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        },
        {
          _id: '5',
          name: 'Spring Collection',
          slug: 'spring-collection',
          description: 'Fresh styles for spring',
          isPublic: false,
          products: Array(15).fill('prod') as any[],
          owner: 'user1',
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        },
      ];
      
      mockQueryClient.setQueryData(['collection.myCollections', undefined], {
        collections: manyCollections,
        nextCursor: null,
      });
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={mockQueryClient}>
          <QueryClientProvider client={mockQueryClient}>
            <div className="p-6 bg-background min-h-screen">
              <EnhancedCollectionsList {...args} />
            </div>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Wait for collections to load
    await waitFor(() => {
      expect(canvas.getByText('Summer Collection')).toBeInTheDocument();
    });
    
    // Apply multiple filters
    const searchInput = canvas.getByTestId('search-input');
    await userEvent.type(searchInput, 'Collection');
    
    const publicFilter = canvas.getByTestId('filter-public');
    await userEvent.click(publicFilter);
    
    // Should show both active filters
    await waitFor(() => {
      expect(canvas.getByText('Search: "Collection"')).toBeInTheDocument();
      expect(canvas.getByText('public only')).toBeInTheDocument();
    });
  },
};