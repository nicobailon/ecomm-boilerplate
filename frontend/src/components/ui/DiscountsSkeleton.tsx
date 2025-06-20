import { Skeleton } from './Skeleton';

export function DiscountsTableSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-card rounded-lg p-4 border">
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-7 w-16" />
          </div>
        ))}
      </div>
      
      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        {/* Table Header */}
        <div className="bg-muted px-6 py-3 grid grid-cols-5 gap-4">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
        
        {/* Table Rows */}
        <div className="divide-y">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-6 py-4 grid grid-cols-5 gap-4 items-center">
              <div>
                <Skeleton className="h-5 w-24 mb-1" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-6 w-16 rounded-full" />
              <div className="flex gap-2 justify-end">
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CreateDiscountSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      
      <div className="space-y-4">
        {/* Code Input */}
        <div>
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-10 w-full rounded" />
        </div>
        
        {/* Type Select */}
        <div>
          <Skeleton className="h-4 w-32 mb-2" />
          <Skeleton className="h-10 w-full rounded" />
        </div>
        
        {/* Value Input */}
        <div>
          <Skeleton className="h-4 w-20 mb-2" />
          <Skeleton className="h-10 w-full rounded" />
        </div>
        
        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-10 w-full rounded" />
          </div>
          <div>
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-10 w-full rounded" />
          </div>
        </div>
        
        {/* Submit Button */}
        <Skeleton className="h-10 w-32 rounded" />
      </div>
    </div>
  );
}