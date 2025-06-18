import { useState } from 'react';
import { motion } from 'framer-motion';
import { Edit, Trash, Globe, Lock, ExternalLink } from 'lucide-react';
import { useMyCollections, useDeleteCollection } from '@/hooks/collections/useCollections';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { type RouterOutputs } from '@/lib/trpc';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

type Collection = RouterOutputs['collection']['myCollections']['collections'][0];

interface CollectionsListProps {
  onEdit: (collection: Collection) => void;
  className?: string;
}

export const CollectionsList = ({ onEdit, className }: CollectionsListProps) => {
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const { data, isLoading } = useMyCollections({ cursor });
  const deleteCollection = useDeleteCollection();

  const handleDelete = (collection: Collection) => {
    if (window.confirm(`Are you sure you want to delete "${collection.name}"?`)) {
      deleteCollection.mutate({ id: collection._id as string });
    }
  };

  const handleViewCollection = (slug: string) => {
    window.open(`/collections/${slug}`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  const collections = data?.collections || [];

  if (collections.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">No collections yet.</p>
        <p className="text-sm text-muted-foreground">
          Create your first collection to organize your products.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      className={cn('bg-card shadow-lg rounded-lg overflow-hidden', className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Collection
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Products
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Visibility
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {collections.map((collection) => (
              <tr key={collection._id as string} className="hover:bg-muted/50 transition-colors">
                <td className="px-6 py-4">
                  <div>
                    <h4 
                      className="font-medium cursor-pointer hover:text-primary transition-colors"
                      onClick={() => onEdit(collection)}
                    >
                      {collection.name}
                    </h4>
                    {collection.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                        {collection.description}
                      </p>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <Badge variant="secondary">
                    {Array.isArray(collection.products) ? collection.products.length : 0} products
                  </Badge>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {collection.isPublic ? (
                      <>
                        <Globe className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-green-600">Public</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Private</span>
                      </>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(collection.createdAt), { addSuffix: true })}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(collection)}
                      disabled={deleteCollection.isPending}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(collection)}
                      disabled={deleteCollection.isPending}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash className="w-4 h-4" />
                    </Button>
                    {collection.isPublic && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewCollection(collection.slug)}
                        disabled={deleteCollection.isPending}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data?.nextCursor && (
        <div className="p-4 border-t border-border">
          <Button
            variant="outline"
            onClick={() => setCursor(data.nextCursor || undefined)}
            className="w-full"
          >
            Load More Collections
          </Button>
        </div>
      )}
    </motion.div>
  );
};