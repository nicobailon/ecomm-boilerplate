import type { Meta, StoryObj } from '@storybook/react-vite';
import { CollectionPreview } from './CollectionPreview';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { trpc } from '@/lib/trpc';
import { httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';

// Mock type that matches the tRPC output structure without Mongoose document properties
interface Collection {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  isPublic: boolean;
  products: {
    _id: string;
    name: string;
    description: string;
    price: number;
    image: string;
    isFeatured: boolean;
    createdAt: string;
    updatedAt: string;
    slug?: string;
    collectionId?: string;
  }[];
  owner: {
    _id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

const mockCollection: Collection = {
  _id: '1',
  name: 'Summer Collection 2024',
  slug: 'summer-collection-2024',
  description: 'Fresh summer styles for the season',
  isPublic: true,
  products: [
    { _id: 'p1', name: 'Product 1', price: 29.99, image: '', description: '', isFeatured: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { _id: 'p2', name: 'Product 2', price: 39.99, image: '', description: '', isFeatured: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    { _id: 'p3', name: 'Product 3', price: 49.99, image: '', description: '', isFeatured: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  ],
  owner: {
    _id: 'owner1',
    name: 'John Doe',
    email: 'john@example.com',
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const createMockTrpcClient = (data: Collection | null) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  
  const trpcClient = trpc.createClient({
    links: [
      httpBatchLink({
        url: '/api/trpc',
        transformer: superjson,
        fetch: async () => {
          return new Response(JSON.stringify({ result: { data } }), {
            headers: { 'content-type': 'application/json' },
          });
        },
      }),
    ],
  });
  
  return { queryClient, trpcClient };
};

const CollectionPreviewWrapper = ({ collection, collectionId }: { collection: Collection | null; collectionId?: string }) => {
  const { queryClient, trpcClient } = createMockTrpcClient(collection);
  
  if (collectionId && collection) {
    queryClient.setQueryData(['collection.getById', { id: collectionId }], collection);
  }
  
  return (
    <QueryClientProvider client={queryClient}>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <CollectionPreview collectionId={collectionId} />
      </trpc.Provider>
    </QueryClientProvider>
  );
};

const meta: Meta<typeof CollectionPreview> = {
  title: 'UI/CollectionPreview',
  component: CollectionPreview,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <CollectionPreviewWrapper 
      collection={mockCollection}
      collectionId="1"
    />
  ),
};

export const PrivateCollection: Story = {
  render: () => (
    <CollectionPreviewWrapper 
      collection={{ ...mockCollection, isPublic: false }}
      collectionId="1"
    />
  ),
};

export const EmptyCollection: Story = {
  render: () => (
    <CollectionPreviewWrapper 
      collection={{ ...mockCollection, products: [] }}
      collectionId="1"
    />
  ),
};

export const LargeCollection: Story = {
  render: () => (
    <CollectionPreviewWrapper 
      collection={{
        ...mockCollection,
        products: Array.from({ length: 150 }, (_, i) => ({
          _id: `p${i}`,
          name: `Product ${i + 1}`,
          price: 29.99 + i,
          image: '',
          description: '',
          isFeatured: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })),
      }}
      collectionId="1"
    />
  ),
};

export const LongName: Story = {
  render: () => (
    <CollectionPreviewWrapper 
      collection={{
        ...mockCollection,
        name: 'This is a very long collection name that might overflow the preview component boundaries',
      }}
      collectionId="1"
    />
  ),
};

export const Loading: Story = {
  render: () => (
    <div className="rounded-md border p-3">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-4 w-32 mb-1" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-5 w-12 rounded-full" />
      </div>
    </div>
  ),
};

export const NoCollectionId: Story = {
  render: () => <CollectionPreview />,
};

export const GridLayout: Story = {
  render: () => {
    const collections = [
      { ...mockCollection, _id: '1', name: 'Summer Collection' },
      { ...mockCollection, _id: '2', name: 'Winter Collection', isPublic: false },
      { ...mockCollection, _id: '3', name: 'Spring Collection', products: [] },
      { ...mockCollection, _id: '4', name: 'Fall Collection', products: Array(25).fill({}) },
    ];
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {collections.map(collection => (
          <CollectionPreviewWrapper
            key={collection._id}
            collection={collection}
            collectionId={collection._id}
          />
        ))}
      </div>
    );
  },
};

export const ListLayout: Story = {
  render: () => {
    const collections = [
      { ...mockCollection, _id: '1', name: 'Best Sellers' },
      { ...mockCollection, _id: '2', name: 'New Arrivals', isPublic: false },
      { ...mockCollection, _id: '3', name: 'Sale Items', products: Array(99).fill({}) },
    ];
    
    return (
      <div className="space-y-2">
        {collections.map(collection => (
          <CollectionPreviewWrapper
            key={collection._id}
            collection={collection}
            collectionId={collection._id}
          />
        ))}
      </div>
    );
  },
};

export const CustomStyling: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-2">Default</h3>
        <CollectionPreviewWrapper 
          collection={mockCollection}
          collectionId="1"
        />
      </div>
      
      <div>
        <h3 className="text-sm font-medium mb-2">With Background</h3>
        <div className="bg-muted p-4 rounded-lg">
          <CollectionPreviewWrapper 
            collection={mockCollection}
            collectionId="1"
          />
        </div>
      </div>
      
      <div>
        <h3 className="text-sm font-medium mb-2">Dark Mode</h3>
        <div className="dark bg-gray-900 p-4 rounded-lg">
          <CollectionPreviewWrapper 
            collection={mockCollection}
            collectionId="1"
          />
        </div>
      </div>
    </div>
  ),
};

export const MobileView: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  render: () => (
    <div className="p-4 space-y-2">
      <CollectionPreviewWrapper 
        collection={mockCollection}
        collectionId="1"
      />
      <CollectionPreviewWrapper 
        collection={{ ...mockCollection, _id: '2', name: 'Winter Collection', isPublic: false }}
        collectionId="2"
      />
    </div>
  ),
};

export const ExpandedPreview: Story = {
  render: () => (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="rounded-lg border p-4">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">{mockCollection.name}</h3>
            <p className="text-sm text-muted-foreground">
              {mockCollection.description}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {mockCollection.products.length} products in collection
            </p>
          </div>
          {mockCollection.isPublic && (
            <Badge variant="secondary">Public</Badge>
          )}
        </div>
        
        <div className="grid grid-cols-4 gap-2">
          {mockCollection.products.slice(0, 8).map((_, index) => (
            <div key={`product-${index}`} className="aspect-square bg-muted rounded-md relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
                {index + 1}
              </div>
            </div>
          ))}
          {mockCollection.products.length > 8 && (
            <div className="aspect-square bg-muted rounded-md relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
                +{mockCollection.products.length - 8}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  ),
};

export const CollectionStates: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium mb-3">Different States</h3>
        <div className="space-y-2">
          <div className="rounded-md border p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Active Collection</p>
                <p className="text-xs text-muted-foreground">15 products</p>
              </div>
              <div className="flex gap-2">
                <Badge variant="secondary">Public</Badge>
                <Badge variant="default">Active</Badge>
              </div>
            </div>
          </div>
          
          <div className="rounded-md border p-3 opacity-60">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Archived Collection</p>
                <p className="text-xs text-muted-foreground">23 products</p>
              </div>
              <Badge variant="outline">Archived</Badge>
            </div>
          </div>
          
          <div className="rounded-md border-dashed border-2 p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Draft Collection</p>
                <p className="text-xs text-muted-foreground">0 products</p>
              </div>
              <Badge variant="outline">Draft</Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
};