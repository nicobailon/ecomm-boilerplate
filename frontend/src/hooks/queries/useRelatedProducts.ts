import { trpc } from '@/lib/trpc';

export function useRelatedProducts(productId: string | undefined, limit = 6) {
  return trpc.product.related.useQuery(
    { productId: productId ?? '', limit },
    {
      enabled: !!productId,
      staleTime: 10 * 60 * 1000, // 10 minutes
    },
  );
}