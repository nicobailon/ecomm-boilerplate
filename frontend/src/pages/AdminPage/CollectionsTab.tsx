import { useState } from 'react';
import { CollectionsList } from '@/components/collections/CollectionsList';
import { CollectionEditDrawer } from '@/components/drawers/CollectionEditDrawer';
import { Button } from '@/components/ui/Button';
import { Plus, Star } from 'lucide-react';
import { type RouterOutputs } from '@/lib/trpc';
import { motion } from 'framer-motion';
import { useFeaturedCollections } from '@/hooks/queries/useHeroBanners';
import { Skeleton } from '@/components/ui/Skeleton';

type Collection = RouterOutputs['collection']['getById'];

export const CollectionsTab = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const { data: featuredCollections, isLoading: isLoadingFeatured } = useFeaturedCollections();

  const handleCreateNew = () => {
    setSelectedCollection(null);
    setIsDrawerOpen(true);
  };

  const handleEdit = (collection: Collection) => {
    setSelectedCollection(collection);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedCollection(null);
  };

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Collections</h2>
          <p className="text-muted-foreground mt-1">
            Organize your products into curated collections
          </p>
        </div>
        <Button onClick={handleCreateNew}>
          <Plus className="mr-2 h-4 w-4" />
          Create Collection
        </Button>
      </div>

      {/* Featured Collections Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" />
          <h3 className="text-lg font-semibold">Featured Collections</h3>
        </div>
        
        {isLoadingFeatured ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredCollections && featuredCollections.length > 0 ? (
              featuredCollections.map((collection) => (
                <div
                  key={String(collection._id)}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800"
                  onClick={() => handleEdit(collection)}
                >
                  {collection.heroImage && (
                    <img
                      src={collection.heroImage}
                      alt={collection.name}
                      className="w-full h-24 object-cover rounded mb-2"
                    />
                  )}
                  <div className="flex items-center gap-2 mb-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <h4 className="font-medium">{collection.name}</h4>
                  </div>
                  {collection.heroTitle && (
                    <p className="text-sm text-muted-foreground mb-1">
                      Hero: {collection.heroTitle}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {collection.products?.length || 0} products
                  </p>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                <Star className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No featured collections yet</p>
                <p className="text-sm">Mark collections as featured to show them here</p>
              </div>
            )}
          </div>
        )}
      </div>

      <CollectionsList onEdit={handleEdit} />

      <CollectionEditDrawer
        isOpen={isDrawerOpen}
        collection={selectedCollection}
        onClose={handleCloseDrawer}
      />
    </motion.div>
  );
};