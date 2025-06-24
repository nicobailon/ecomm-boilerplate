import type { Meta, StoryObj } from '@storybook/react-vite';
import { CollectionCard } from './CollectionCard';
import { BrowserRouter } from 'react-router-dom';
import type { RouterOutputs } from '@/lib/trpc';
import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/Skeleton';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader2, RefreshCw, Package2 } from 'lucide-react';

type Collection = RouterOutputs['collection']['list']['collections'][0];

const mockCollectionWithImage: Collection = {
  _id: '1',
  name: 'Summer Collection',
  slug: 'summer-collection',
  description: 'Bright and breezy styles perfect for warm weather adventures.',
  owner: {
    _id: 'user1',
    name: 'John Doe',
    email: 'john@example.com',
  } as any,
  products: [
    {
      _id: 'prod1',
      name: 'Summer Dress',
      image: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=500',
    } as any,
  ],
  isPublic: true,
  createdAt: new Date(),
  updatedAt: new Date(),
} as any;

const mockCollectionEmpty: Collection = {
  _id: '2',
  name: 'New Arrivals',
  slug: 'new-arrivals',
  description: undefined,
  owner: {
    _id: 'user1',
    name: 'John Doe',
    email: 'john@example.com',
  } as any,
  products: [],
  isPublic: true,
  createdAt: new Date(),
  updatedAt: new Date(),
} as any;

const mockFeaturedCollection: Collection = {
  _id: '3',
  name: 'Featured Products',
  slug: 'featured-products',
  description: 'Our hand-picked selection of bestsellers and customer favorites.',
  owner: {
    _id: 'user1',
    name: 'John Doe',
    email: 'john@example.com',
  } as any,
  products: [
    {
      _id: 'prod2',
      name: 'Bestseller',
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
    } as any,
  ],
  isPublic: true,
  createdAt: new Date(),
  updatedAt: new Date(),
} as any;

const meta = {
  title: 'Collections/CollectionCard',
  component: CollectionCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <BrowserRouter>
        <div className="w-80">
          <Story />
        </div>
      </BrowserRouter>
    ),
  ],
} satisfies Meta<typeof CollectionCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    collection: mockCollectionWithImage,
  },
};

export const EmptyCollection: Story = {
  args: {
    collection: mockCollectionEmpty,
  },
};

export const Featured: Story = {
  args: {
    collection: mockFeaturedCollection,
  },
};

export const LongDescription: Story = {
  args: {
    collection: {
      ...mockCollectionWithImage,
      description: 'This is a very long description that demonstrates how the component handles lengthy text content. It should be truncated after two lines to maintain consistent card heights across the grid layout.',
    } as Collection,
  },
};

export const NoDescription: Story = {
  args: {
    collection: {
      ...mockCollectionWithImage,
      description: undefined,
    } as Collection,
  },
};

export const LoadingState: Story = {
  args: {
    collection: mockCollectionWithImage,
  },
  decorators: [
    () => (
      <BrowserRouter>
        <div className="w-80">
          <div className="animate-pulse">
            <div className="relative aspect-[4/3] w-full rounded-lg bg-gray-200" />
            <div className="mt-4 h-6 w-3/4 rounded bg-gray-200" />
            <div className="mt-2 space-y-2">
              <div className="h-4 w-full rounded bg-gray-200" />
              <div className="h-4 w-2/3 rounded bg-gray-200" />
            </div>
          </div>
        </div>
      </BrowserRouter>
    ),
  ],
};

export const GridLayout: Story = {
  args: {
    collection: mockCollectionWithImage,
  },
  decorators: [
    () => (
      <BrowserRouter>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl">
          <CollectionCard collection={mockCollectionWithImage} />
          <CollectionCard collection={mockFeaturedCollection} />
          <CollectionCard collection={mockCollectionEmpty} />
          <CollectionCard
            collection={{
              ...mockCollectionWithImage,
              _id: '4',
              name: 'Winter Collection',
              slug: 'winter-collection',
              description: 'Cozy and warm essentials for the cold season.',
              products: [
                {
                  _id: 'prod3',
                  name: 'Winter Coat',
                  image: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=500',
                } as any,
              ],
            } as Collection}
          />
          <CollectionCard
            collection={{
              ...mockCollectionEmpty,
              _id: '5',
              name: 'Sale Items',
              slug: 'sale-items',
              description: 'Great deals on selected products.',
            } as Collection}
          />
          <CollectionCard
            collection={{
              ...mockCollectionWithImage,
              _id: '6',
              name: 'Accessories',
              slug: 'accessories',
              description: 'Complete your look with our range of accessories.',
              products: [
                {
                  _id: 'prod4',
                  name: 'Leather Bag',
                  image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500',
                } as any,
              ],
            } as Collection}
          />
        </div>
      </BrowserRouter>
    ),
  ],
};

export const HoverEffect: Story = {
  args: {
    collection: mockCollectionWithImage,
  },
  parameters: {
    pseudo: { hover: true },
  },
};

export const MobileView: Story = {
  args: {
    collection: mockCollectionWithImage,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const TabletView: Story = {
  args: {
    collection: mockCollectionWithImage,
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};

export const MultipleProducts: Story = {
  args: {
    collection: {
      ...mockCollectionWithImage,
      products: [
        {
          _id: 'prod1',
          name: 'Product 1',
          image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500',
        } as any,
        {
          _id: 'prod2',
          name: 'Product 2',
          image: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=500',
        } as any,
        {
          _id: 'prod3',
          name: 'Product 3',
          image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=500',
        } as any,
      ],
    } as Collection,
  },
};

export const ProductWithoutImage: Story = {
  args: {
    collection: {
      ...mockCollectionWithImage,
      products: [
        {
          _id: 'prod1',
          name: 'Product Without Image',
        } as any,
      ],
    } as Collection,
  },
};

export const SpecialCharacters: Story = {
  args: {
    collection: {
      ...mockCollectionWithImage,
      name: 'Collection & More™',
      slug: 'collection-and-more',
      description: 'Special offers & deals — save up to 50% on selected items!',
    } as Collection,
  },
};

export const VeryLongName: Story = {
  args: {
    collection: {
      ...mockCollectionWithImage,
      name: 'This Is A Very Long Collection Name That Might Need Special Handling',
      slug: 'very-long-collection-name',
    } as Collection,
  },
};

export const ErrorState: Story = {
  args: {
    collection: mockCollectionWithImage,
  },
  decorators: [
    () => (
      <BrowserRouter>
        <div className="w-80">
          <div className="border-2 border-dashed border-red-300 rounded-lg p-6 text-center">
            <p className="text-red-600 font-medium">Failed to load collection</p>
            <p className="text-sm text-gray-600 mt-2">Please try again later</p>
          </div>
        </div>
      </BrowserRouter>
    ),
  ],
};

// Enhanced Loading State Stories
export const SkeletonLoading: Story = {
  args: {
    collection: mockCollectionWithImage,
  },
  decorators: [
    () => (
      <BrowserRouter>
        <div className="w-80">
          <Card className="overflow-hidden">
            <Skeleton className="aspect-[4/3] w-full" />
            <div className="p-4 space-y-3">
              <Skeleton className="h-6 w-3/4" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
              <Skeleton className="h-5 w-20" />
            </div>
          </Card>
        </div>
      </BrowserRouter>
    ),
  ],
  render: () => <div></div>,
};

export const LazyLoadingCollection: Story = {
  args: {
    collection: mockCollectionWithImage,
  },
  render: () => {
    const [loading, setLoading] = useState(true);
    const [collection, setCollection] = useState<Collection | null>(null);

    useEffect(() => {
      const timer = setTimeout(() => {
        setCollection(mockCollectionWithImage);
        setLoading(false);
      }, 2000);

      return () => clearTimeout(timer);
    }, []);

    if (loading) {
      return (
        <Card className="w-80 overflow-hidden">
          <div className="aspect-[4/3] bg-muted flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
          <div className="p-4 space-y-3">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
          </div>
        </Card>
      );
    }

    return collection ? <CollectionCard collection={collection} /> : <div></div>;
  },
};

export const GridWithMixedStates: Story = {
  args: {
    collection: mockCollectionWithImage,
  },
  render: () => {
    const [loadingStates, setLoadingStates] = useState([true, true, true, false, false, false]);
    const collections = [
      mockCollectionWithImage,
      mockFeaturedCollection,
      mockCollectionEmpty,
      { ...mockCollectionWithImage, _id: '4', name: 'Winter Collection', slug: 'winter-collection' },
      { ...mockFeaturedCollection, _id: '5', name: 'Sale Items', slug: 'sale-items' },
      { ...mockCollectionEmpty, _id: '6', name: 'Accessories', slug: 'accessories' },
    ] as Collection[];

    useEffect(() => {
      const timers = loadingStates.map((isLoading, index) => {
        if (isLoading) {
          return setTimeout(() => {
            setLoadingStates(prev => {
              const newStates = [...prev];
              newStates[index] = false;
              return newStates;
            });
          }, 500 + index * 300);
        }
        return null;
      });

      return () => {
        timers.forEach(timer => timer && clearTimeout(timer));
      };
    }, [loadingStates]);

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl">
        {collections.map((collection, index) => (
          loadingStates[index] ? (
            <Card key={index} className="overflow-hidden">
              <Skeleton className="aspect-[4/3] w-full" />
              <div className="p-4 space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </div>
            </Card>
          ) : (
            <CollectionCard key={String(collection._id)} collection={collection} />
          )
        ))}
      </div>
    );
  },
};

export const ProgressiveImageLoading: Story = {
  args: {
    collection: mockCollectionWithImage,
  },
  render: () => {
    const [imageLoaded, setImageLoaded] = useState(false);
    const product = mockCollectionWithImage.products[0] as any;

    return (
      <div className="w-80">
        <Card className="overflow-hidden">
          <div className="relative aspect-[4/3] w-full">
            {!imageLoaded && (
              <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center">
                <Package2 className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
            <img
              src={product?.image}
              alt={mockCollectionWithImage.name}
              className={`w-full h-full object-cover transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setImageLoaded(true)}
            />
          </div>
          <div className="p-4">
            <h3 className="font-semibold text-lg">{mockCollectionWithImage.name}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {mockCollectionWithImage.description}
            </p>
            <p className="text-sm font-medium mt-3">
              {mockCollectionWithImage.products.length} products
            </p>
          </div>
        </Card>
      </div>
    );
  },
};

export const RefreshableCollection: Story = {
  args: {
    collection: mockCollectionWithImage,
  },
  render: () => {
    const [loading, setLoading] = useState(false);
    const [collection, setCollection] = useState(mockCollectionWithImage);
    const [lastUpdated, setLastUpdated] = useState(new Date());

    const refresh = async () => {
      setLoading(true);

      await new Promise(resolve => setTimeout(resolve, 1500));

      // Simulate updated collection data - create a new collection object
      const newProduct = {
        _id: `prod${Date.now()}`,
        name: `New Product ${collection.products.length + 1}`,
        image: `https://images.unsplash.com/photo-${1542291026 + collection.products.length * 1000}-7eec264c27ff?w=500`,
      } as any;

      setCollection({
        ...collection,
        products: [...collection.products, newProduct],
      } as Collection);

      setLastUpdated(new Date());
      setLoading(false);
    };
    
    return (
      <div className="space-y-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium">Collection Data</h4>
              <p className="text-xs text-muted-foreground">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={refresh}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Refresh
                </>
              )}
            </Button>
          </div>
        </Card>
        
        <div className={loading ? 'opacity-50 pointer-events-none' : ''}>
          <CollectionCard collection={collection} />
        </div>
      </div>
    );
  },
};

export const ShimmerEffect: Story = {
  args: {
    collection: mockCollectionWithImage,
  },
  decorators: [
    () => (
      <BrowserRouter>
        <div className="w-80">
          <Card className="overflow-hidden">
            <div className="aspect-[4/3] bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer" />
            <div className="p-4 space-y-3">
              <div className="h-6 w-3/4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer rounded" />
              <div className="space-y-2">
                <div className="h-4 w-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer rounded" />
                <div className="h-4 w-2/3 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer rounded" />
              </div>
            </div>
          </Card>
        </div>
        <style>{`
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          .animate-shimmer {
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
          }
        `}</style>
      </BrowserRouter>
    ),
  ],
  render: ({ collection }) => <CollectionCard collection={collection} />,
};

export const InfiniteScrollLoading: Story = {
  args: {
    collection: mockCollectionWithImage,
  },
  render: () => {
    const [collections, setCollections] = useState([mockCollectionWithImage, mockFeaturedCollection]);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    
    const loadMore = async () => {
      setLoading(true);
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const newCollections = Array.from({ length: 2 }, (_, i) => ({
        ...mockCollectionEmpty,
        _id: `new${collections.length + i}`,
        name: `Collection ${collections.length + i + 1}`,
        slug: `collection-${collections.length + i + 1}`,
        products: i % 2 === 0 ? [{
          _id: `prod${collections.length + i}`,
          name: `Product ${collections.length + i}`,
          image: `https://images.unsplash.com/photo-${1542291026 + (collections.length + i) * 1000}-7eec264c27ff?w=500`,
        } as any] : [],
      })) as Collection[];
      
      setCollections(prev => [...prev, ...newCollections]);
      setLoading(false);
      
      if (collections.length >= 6) {
        setHasMore(false);
      }
    };
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {collections.map(collection => (
            <CollectionCard key={String(collection._id)} collection={collection} />
          ))}
        </div>
        
        {hasMore && (
          <div className="flex justify-center">
            <Button
              onClick={loadMore}
              disabled={loading}
              variant="outline"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading more...
                </>
              ) : (
                'Load More Collections'
              )}
            </Button>
          </div>
        )}
        
        {!hasMore && (
          <div className="text-center text-sm text-muted-foreground">
            No more collections to load
          </div>
        )}
      </div>
    );
  },
};

export const LoadingWithPlaceholder: Story = {
  args: {
    collection: mockCollectionWithImage,
  },
  render: () => {
    const [loading, setLoading] = useState(true);
    const [collection, setCollection] = useState<Collection | null>(null);

    useEffect(() => {
      const timer = setTimeout(() => {
        setCollection(mockCollectionWithImage);
        setLoading(false);
      }, 3000);

      return () => clearTimeout(timer);
    }, []);

    if (loading) {
      return (
        <Card className="w-80 p-8">
          <div className="text-center">
            <Package2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Loading Collection</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Fetching collection details...
            </p>
            <Loader2 className="w-6 h-6 animate-spin mx-auto" />
          </div>
        </Card>
      );
    }

    return (
      <div>
        {collection ? <CollectionCard collection={collection} /> : (
          <Card className="w-80 p-8">
            <div className="text-center text-muted-foreground">
              No collection data available
            </div>
          </Card>
        )}
      </div>
    );
  },
};