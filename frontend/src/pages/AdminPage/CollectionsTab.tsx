import { useState } from 'react';
import { CollectionsList } from '@/components/collections/CollectionsList';
import { CollectionEditDrawer } from '@/components/drawers/CollectionEditDrawer';
import { Button } from '@/components/ui/Button';
import { Plus } from 'lucide-react';
import { type RouterOutputs } from '@/lib/trpc';
import { motion } from 'framer-motion';

type Collection = RouterOutputs['collection']['getById'];

export const CollectionsTab = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);

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

      <CollectionsList onEdit={handleEdit} />

      <CollectionEditDrawer
        isOpen={isDrawerOpen}
        collection={selectedCollection}
        onClose={handleCloseDrawer}
      />
    </motion.div>
  );
};