import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { trpc } from '@/lib/trpc';

interface CollectionPreviewProps {
  collectionId?: string;
  className?: string;
}

export const CollectionPreview: React.FC<CollectionPreviewProps> = ({
  collectionId,
  className,
}) => {
  const { data: collection } = trpc.collection.getById.useQuery(
    { id: collectionId! },
    { enabled: !!collectionId }
  );
  
  if (!collectionId || !collection) return null;
  
  return (
    <div className={cn('rounded-md border p-3', className)}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{collection.name}</p>
          <p className="text-xs text-muted-foreground">
            {collection.products.length} products
          </p>
        </div>
        {collection.isPublic && (
          <Badge variant="secondary">Public</Badge>
        )}
      </div>
    </div>
  );
};