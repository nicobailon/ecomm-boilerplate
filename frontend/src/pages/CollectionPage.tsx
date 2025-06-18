import { useParams } from 'react-router-dom';
import { useCollectionBySlug } from '@/hooks/collections/useCollections';
import ProductCard from '@/components/product/ProductCard';
import { Product } from '@/types';
import { Globe, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/Skeleton';

const CollectionPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: collection, isLoading, isError } = useCollectionBySlug(slug || '');

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
          {[...Array(8)].map((_, i) => (
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
            The collection you're looking for doesn't exist or is not accessible.
          </p>
          <a href="/" className="text-primary hover:underline">
            Go back to home
          </a>
        </div>
      </div>
    );
  }

  // Extract populated products
  const products: Product[] = [];
  
  // Handle both populated products and product IDs
  for (const p of collection.products || []) {
    if (p && typeof p === 'object') {
      // Type guard to ensure it's a Product
      const productLike = p as unknown as Record<string, unknown>;
      if (productLike._id && 
          productLike.name && 
          productLike.price !== undefined &&
          productLike.image) {
        products.push(productLike as unknown as Product);
      }
    }
  }

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
          </div>
        </div>

        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              This collection doesn't have any products yet.
            </p>
          </div>
        ) : (
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
        {typeof collection.owner !== 'string' && collection.owner && (
          <div className="mt-12 pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Curated by <span className="font-medium">{(collection.owner as unknown as {name: string}).name}</span>
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default CollectionPage;