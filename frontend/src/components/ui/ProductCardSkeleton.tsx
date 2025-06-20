import { Skeleton } from './Skeleton';

export function ProductCardSkeleton() {
  return (
    <article className='flex w-full relative flex-col overflow-hidden rounded-lg border border-border shadow-lg'>
      <div className='relative mx-3 mt-3 flex h-60 overflow-hidden rounded-xl'>
        <Skeleton className='w-full h-full' />
        <div className='absolute top-2 right-2'>
          <Skeleton className='h-6 w-20 rounded-full' />
        </div>
      </div>
      
      <div className='mt-4 px-5 pb-5'>
        <Skeleton className='h-6 w-3/4 mb-3' />
        <div className='mt-2 mb-5 flex items-center justify-between'>
          <Skeleton className='h-8 w-20' />
        </div>
        <Skeleton className='h-10 w-full rounded-lg' />
      </div>
    </article>
  );
}

export function ProductGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}