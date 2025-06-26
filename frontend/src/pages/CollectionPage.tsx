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
import { VirtualizedProductGrid } from '@/components/product/VirtualizedProductGrid';
import { useOptimalColumnCount } from '@/hooks/useOptimalColumnCount';
import { useWindowSize } from '@/hooks/useWindowSize';
import { HeroBanner } from '@/components/ui/HeroBanner';

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
  const sortBy = searchParams.get('sortBy') ?? 'default';
  
  // State for virtualized list - MUST be declared before any conditional returns
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
  
  // Prepare products data - must be before conditional returns
  const allProducts: ProductWithInventory[] = useMemo(() => {
    if (!collection?.products) return [];
    
    const products: ProductWithInventory[] = [];
    for (const p of collection.products) {
      if (p && typeof p === 'object' && '_id' in p) {
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
          const typedProduct = p as Product;
          const product: ProductWithInventory = {
            ...typedProduct,
            description: typedProduct.description ?? '',
            collectionId: typedProduct.collectionId,
            isFeatured: typedProduct.isFeatured ?? false,
            slug: typedProduct.slug,
            createdAt: typedProduct.createdAt ?? new Date().toISOString(),
            updatedAt: typedProduct.updatedAt ?? new Date().toISOString(),
          };
          products.push(product);
        }
      }
    }
    return products;
  }, [collection?.products]);
  
  // Filter and sort products
  const { products, hiddenCount } = useMemo(() => {
    const filteredProducts = [...allProducts];
    
    // Sort products by price
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
      hiddenCount: 0,
    };
  }, [allProducts, sortBy]);
  
  // Update URL params
  const updateFilters = (key: string, value: string | boolean) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === false || value === 'default' || !value) {
      newParams.delete(key);
    } else {
      newParams.set(key, String(value));
    }
    setSearchParams(newParams);
  };

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

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Hero Banner */}
        {collection.heroImage && (
          <div className="mb-12">
            <HeroBanner
              title={collection.heroTitle ?? collection.name}
              subtitle={collection.heroSubtitle ?? collection.description}
              imageUrl={collection.heroImage}
              height="medium"
            />
          </div>
        )}

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
          
          {collection.description && !collection.heroImage && (
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
                  height={windowSize.height ? windowSize.height - 400 : 600}
                  width={containerWidth}
                />
              </motion.div>
            )}
          </div>
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

export default CollectionPage;