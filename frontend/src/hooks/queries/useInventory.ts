import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import type { 
  InventoryHistoryOptions,
} from '@/types/inventory';

// Hook to get product inventory
export function useProductInventory(productId: string, variantId?: string, variantLabel?: string) {
  return trpc.inventory.getProductInventory.useQuery(
    { productId, variantId, variantLabel },
    {
      staleTime: 5 * 1000, // Consider data stale after 5 seconds
      gcTime: 5 * 60 * 1000, // Cache for 5 minutes
      refetchOnWindowFocus: true, // Refetch when window regains focus
      refetchOnMount: true, // Always refetch when component mounts
      refetchInterval: false, // Don't poll, but refetch quickly when needed
    },
  );
}

// Hook to update inventory
export function useUpdateInventory() {
  const utils = trpc.useUtils();

  return trpc.inventory.updateInventory.useMutation({
    onMutate: async (variables) => {
      // Cancel any outgoing refetches
      await utils.inventory.getProductInventory.cancel({ 
        productId: variables.productId, 
        variantId: variables.variantId,
        variantLabel: variables.variantLabel,
      });

      // Snapshot the previous value
      const previousData = utils.inventory.getProductInventory.getData({
        productId: variables.productId,
        variantId: variables.variantId,
        variantLabel: variables.variantLabel,
      });

      // Optimistically update to the new value
      if (previousData) {
        const adjustment = variables.adjustment;
        const newInventory = previousData.currentStock + adjustment;
        const newAvailable = previousData.availableStock + adjustment;
        
        utils.inventory.getProductInventory.setData(
          { productId: variables.productId, variantId: variables.variantId, variantLabel: variables.variantLabel },
          {
            ...previousData,
            currentStock: newInventory,
            availableStock: newAvailable,
          },
        );
      }

      // Return a context object with the snapshotted value
      return { previousData };
    },
    onSuccess: (data) => {
      toast.success(`Inventory updated successfully. New stock: ${data.newQuantity}`);
    },
    onError: (error, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousData) {
        utils.inventory.getProductInventory.setData(
          { productId: variables.productId, variantId: variables.variantId, variantLabel: variables.variantLabel },
          context.previousData,
        );
      }
      toast.error(error.message || 'Failed to update inventory');
    },
    onSettled: (_, __, variables) => {
      // Always refetch after error or success
      void utils.inventory.getProductInventory.invalidate({
        productId: variables.productId,
        variantId: variables.variantId,
        variantLabel: variables.variantLabel,
      });
      // Also invalidate without variantId to catch parent product queries
      void utils.inventory.getProductInventory.invalidate({
        productId: variables.productId,
      });
      void utils.inventory.getLowStockProducts.invalidate();
      void utils.inventory.getInventoryMetrics.invalidate();
      // Force immediate refetch
      void utils.inventory.getProductInventory.refetch({
        productId: variables.productId,
        variantId: variables.variantId,
        variantLabel: variables.variantLabel,
      });
    },
  });
}

// Hook for bulk inventory update
export function useBulkUpdateInventory() {
  const utils = trpc.useUtils();

  return trpc.inventory.bulkUpdateInventory.useMutation({
    onSuccess: () => {
      // Invalidate all inventory queries
      void utils.inventory.invalidate();
    },
  });
}

// Hook to get inventory history
export function useInventoryHistory(productId: string, options?: InventoryHistoryOptions) {
  const limit = options?.limit ?? 50;
  const offset = options?.offset ?? 0;
  
  return trpc.inventory.getInventoryHistory.useQuery({
    productId,
    variantId: options?.variantId,
    limit,
    offset,
  });
}

// Hook to get low stock products
export function useLowStockProducts(threshold = 5, page = 1, limit = 20) {
  return trpc.inventory.getLowStockProducts.useQuery(
    { threshold, page, limit },
    {
      refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    },
  );
}

// Hook for real-time inventory updates (WebSocket)
export function useInventorySubscription() {
  // This would be replaced with actual WebSocket implementation
  // For now, this is a placeholder
  // Real implementation would use WebSocket or SSE for real-time updates
}

// Hook to get inventory metrics
export function useInventoryMetrics() {
  return trpc.inventory.getInventoryMetrics.useQuery();
}

// Hook to get out of stock products
export function useOutOfStockProducts() {
  return trpc.inventory.getOutOfStockProducts.useQuery();
}