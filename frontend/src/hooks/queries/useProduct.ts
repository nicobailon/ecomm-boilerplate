import { trpc } from '@/lib/trpc';

export function useProduct(slug: string) {
  return trpc.product.bySlug.useQuery(
    { slug },
    {
      enabled: !!slug,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error) => {
        // Don't retry on 404s
        if (error?.data?.code === 'NOT_FOUND') {
          return false;
        }
        return failureCount < 3;
      },
    }
  );
}