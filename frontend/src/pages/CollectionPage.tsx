import { useParams, useSearchParams } from 'react-router-dom';
import { useCollectionBySlug } from '@/hooks/collections/useCollections';
import ProductCard from '@/components/product/ProductCard';
import type { Product, ProductWithInventory } from '@/types';
import { Globe, Lock, Filter, ArrowUpDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/Skeleton';
import { Switch } from '@/components/ui/Switch';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { useState, useMemo, useRef, useEffect } from 'react';
import { VirtualizedProductGrid, useOptimalColumnCount } from '@/components/product/VirtualizedProductGrid';
import { useWindowSize } from '@/hooks/useWindowSize';


// Type guard for product validation
function isValidProduct(item: unknown): item is Product {
  if (typeof item !== 'object' || item === null) {
    return false;
  }
  
  const obj = item as Record<string, unknown>;
  
  return (
    typeof obj._id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.price === 'number' &&
    typeof obj.image === 'string'
  );
}

const CollectionPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: collection, isLoading, isError } = useCollectionBySlug(slug ?? '');
  
  // Filter states from URL params
  const hideOutOfStock = searchParams.get('hideOutOfStock') === 'true';
  const sortBy = searchParams.get('sortBy') || 'default';

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Skeleton className="h-5 w-32 mb-2" />
          <Skeleton className="h-10 w-64 mb-4" />
          <Skeleton className="h-6 w-96 mb-2" />
          <Skeleton className="h-6 w-80" />
          <Skeleton className="h-4 w-48 mt-4" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError || !collection) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto text-center">
          <h1 className="text-2xl font-bold mb-4">Collection Not Found</h1>
          <p className="text-muted-foreground mb-8">
            The collection you&apos;re looking for doesn&apos;t exist or is not accessible.
          </p>
          <a href="/" className="text-primary hover:underline">
            Go back to home
          </a>
        </div>
      </div>
    );
  }

  // Extract populated products with proper type checking
  const allProducts: ProductWithInventory[] = [];
  
  // Handle both populated products and product IDs
  for (const p of collection.products ?? []) {
    if (p && typeof p === 'object' && '_id' in p) {
      // Create a proper type guard
      const isProduct = (
        '_id' in p && 
        'name' in p && 
        'price' in p &&
        'image' in p &&
        typeof p._id === 'string' &&
        typeof p.name === 'string' &&
        typeof p.price === 'number' &&
        typeof p.image === 'string'
      );
      
      if (isProduct && isValidProduct(p)) {
        const product: ProductWithInventory = {
          ...p,
          description: p.description || '',
          collectionId: p.collectionId,
          isFeatured: p.isFeatured || false,
          slug: p.slug,
          createdAt: p.createdAt || new Date().toISOString(),
          updatedAt: p.updatedAt || new Date().toISOString()
        };
        allProducts.push(product);
      }
    }
  }

  // For now, we'll rely on individual ProductCard components to fetch their own inventory
  // This is more efficient than fetching all at once for large collections
  const productsWithInventory = allProducts;

  // Since inventory is fetched in ProductCard, we'll use a simplified approach
  // for filtering based on the hideOutOfStock flag

  // Filter and sort products
  const { products, hiddenCount } = useMemo(() => {
    let filteredProducts = [...productsWithInventory];
    
    // Sort products by price (stock sorting requires inventory data at this level)
    switch (sortBy) {
      case 'priceLowToHigh':
        filteredProducts.sort((a, b) => a.price - b.price);
        break;
      case 'priceHighToLow':
        filteredProducts.sort((a, b) => b.price - a.price);
        break;
      default:
        // Keep original order
    }
    
    return {
      products: filteredProducts,
      hiddenCount: 0 // Will be calculated if we implement collection-level inventory
    };
  }, [productsWithInventory, sortBy]);

  // Update URL params
  const updateFilters = (key: string, value: string | boolean) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === false || value === 'default' || !value) {
      newParams.delete(key);
    } else {
      newParams.set(key, value.toString());
    }
    setSearchParams(newParams);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Collection Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            {collection.isPublic ? (
              <div className="flex items-center gap-1 text-green-600">
                <Globe className="w-4 h-4" />
                <span className="text-sm">Public Collection</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Lock className="w-4 h-4" />
                <span className="text-sm">Private Collection</span>
              </div>
            )}
          </div>
          
          <h1 className="text-3xl font-bold mb-4">{collection.name}</h1>
          
          {collection.description && (
            <p className="text-lg text-muted-foreground max-w-3xl">
              {collection.description}
            </p>
          )}
          
          <div className="mt-4 text-sm text-muted-foreground">
            {products.length} {products.length === 1 ? 'product' : 'products'} in this collection
            {hiddenCount > 0 && (
              <span className="ml-2 text-orange-600">
                ({hiddenCount} hidden out of stock)
              </span>
            )}
          </div>
        </div>

        {/* Filters and Sort */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="hide-out-of-stock"
                checked={hideOutOfStock}
                onCheckedChange={(checked) => updateFilters('hideOutOfStock', checked)}
              />
              <Label htmlFor="hide-out-of-stock" className="text-sm cursor-pointer">
                Hide out of stock
              </Label>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
            <Select
              value={sortBy}
              onChange={(e) => updateFilters('sortBy', e.target.value)}
              options={[
                { value: 'default', label: 'Default' },
                { value: 'priceLowToHigh', label: 'Price: Low to High' },
                { value: 'priceHighToLow', label: 'Price: High to Low' },
              ]}
            />
          </div>
        </div>

        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              This collection doesn&apos;t have any products yet.
            </p>
          </div>
        ) : products.length > 20 ? (
          // Use virtual scrolling for large product lists
          <VirtualizedProductList products={products} />
        ) : (
          // Use regular grid for smaller lists
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {products.map((product, index) => (
              <motion.div
                key={product._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Collection Owner */}
        {typeof collection.owner !== 'string' && collection.owner && 'name' in collection.owner && (
          <div className="mt-12 pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Curated by <span className="font-medium">{(collection.owner as { name: string }).name}</span>
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

// Virtualized product list component
function VirtualizedProductList({ products }: { products: ProductWithInventory[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const windowSize = useWindowSize();
  const columnCount = useOptimalColumnCount(containerWidth);
  
  // Update container width on mount and window resize
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, [windowSize]);
  
  // Calculate virtual grid height (use viewport height minus header/footer)
  const gridHeight = windowSize.height ? windowSize.height - 400 : 600;
  
  return (
    <div ref={containerRef} className="w-full">
      {containerWidth > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <VirtualizedProductGrid
            products={products}
            columnCount={columnCount}
            height={gridHeight}
            width={containerWidth}
          />
        </motion.div>
      )}
    </div>
  );
}

export default CollectionPage;