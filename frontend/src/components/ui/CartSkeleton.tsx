import { Skeleton } from './Skeleton';

export function CartSkeleton() {
  return (
    <div className="space-y-6">
      {/* Cart Header */}
      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-32" />
      </div>
      
      {/* Cart Items */}
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-4 p-4 border rounded-lg">
            {/* Product Image */}
            <Skeleton className="w-24 h-24 rounded-lg flex-shrink-0" />
            
            {/* Product Details */}
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="flex items-center gap-2 mt-3">
                <Skeleton className="h-8 w-24 rounded" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
            
            {/* Price & Remove */}
            <div className="flex flex-col items-end justify-between">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          </div>
        ))}
      </div>
      
      {/* Cart Summary */}
      <div className="border-t pt-4 space-y-3">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="flex justify-between pt-3 border-t">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-28" />
        </div>
        
        {/* Checkout Button */}
        <Skeleton className="h-12 w-full rounded-lg mt-6" />
      </div>
    </div>
  );
}

export function EmptyCartSkeleton() {
  return (
    <div className="text-center py-12 space-y-4">
      <Skeleton className="h-16 w-16 rounded-full mx-auto" />
      <Skeleton className="h-6 w-48 mx-auto" />
      <Skeleton className="h-4 w-64 mx-auto" />
      <Skeleton className="h-10 w-32 mx-auto rounded-lg mt-6" />
    </div>
  );
}