import { Skeleton } from './Skeleton';

interface InventorySkeletonProps {
  variant?: 'badge' | 'table' | 'card' | 'stats';
  count?: number;
}

export function InventorySkeleton({ variant = 'badge', count = 1 }: InventorySkeletonProps) {
  if (variant === 'badge') {
    return (
      <div className="flex gap-2">
        {Array.from({ length: count }).map((_, i) => (
          <Skeleton key={i} className="h-6 w-20 rounded-full" />
        ))}
      </div>
    );
  }

  if (variant === 'stats') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-card rounded-lg p-4 border">
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className="space-y-4">
        {/* Table header */}
        <div className="grid grid-cols-4 gap-4 p-4 border-b">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20 mx-auto" />
          <Skeleton className="h-4 w-20 mx-auto" />
          <Skeleton className="h-4 w-16 mx-auto" />
        </div>
        
        {/* Table rows */}
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="grid grid-cols-4 gap-4 p-4 border-b">
            <div className="flex items-center gap-3">
              <Skeleton className="h-4 w-4 rounded" />
              <div>
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <Skeleton className="h-6 w-24 mx-auto rounded-full" />
            <Skeleton className="h-8 w-16 mx-auto" />
            <div className="flex items-center justify-center gap-2">
              <Skeleton className="h-8 w-8 rounded" />
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <div className="space-y-4">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="bg-card border rounded-lg p-4 space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div>
                <Skeleton className="h-5 w-32 mb-1" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-8 w-8 rounded" />
            </div>
            
            {/* Stock status and inventory */}
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-24 rounded-full" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-6 w-16" />
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t">
              <Skeleton className="h-9 flex-1 rounded" />
              <Skeleton className="h-9 flex-1 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return null;
}

// Loading state for inventory badge in ProductCard
export function InventoryBadgeLoading() {
  return <Skeleton className="h-6 w-20 rounded-full animate-pulse" />;
}

// Loading state for inventory management table
export function InventoryTableLoading() {
  return <InventorySkeleton variant="table" count={5} />;
}

// Loading state for inventory stats
export function InventoryStatsLoading() {
  return <InventorySkeleton variant="stats" />;
}