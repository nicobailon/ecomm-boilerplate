import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

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
      // Build the query key based on what's provided
      const queryKey = {
        productId: variables.productId,
        ...(variables.variantId && { variantId: variables.variantId }),
        ...(variables.variantLabel && { variantLabel: variables.variantLabel }),
      };
      
      // Cancel any outgoing refetches
      await utils.inventory.getProductInventory.cancel(queryKey);
      
      // Also cancel queries without variant info for products
      await utils.inventory.getProductInventory.cancel({ 
        productId: variables.productId 
      });

      // Snapshot the previous value
      const previousData = utils.inventory.getProductInventory.getData(queryKey);
      
      // Also try to get data for product-only query if no variant data
      const previousProductData = !previousData && !variables.variantId 
        ? utils.inventory.getProductInventory.getData({ productId: variables.productId })
        : null;

      // Optimistically update to the new value
      const dataToUpdate = previousData || previousProductData;
      if (dataToUpdate) {
        const adjustment = variables.adjustment;
        const newInventory = dataToUpdate.currentStock + adjustment;
        const newAvailable = dataToUpdate.availableStock + adjustment;
        
        // Update the specific query
        utils.inventory.getProductInventory.setData(
          queryKey,
          {
            ...dataToUpdate,
            currentStock: newInventory,
            availableStock: newAvailable,
          },
        );
        
        // Also update product-only query if no variant
        if (!variables.variantId) {
          utils.inventory.getProductInventory.setData(
            { productId: variables.productId },
            {
              ...dataToUpdate,
              currentStock: newInventory,
              availableStock: newAvailable,
            },
          );
        }
      }

      // Return a context object with the snapshotted value
      return { previousData: dataToUpdate, queryKey };
    },
    onSuccess: (data) => {
      toast.success(`Inventory updated successfully. New stock: ${data.newQuantity}`);
    },
    onError: (error, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousData && context?.queryKey) {
        utils.inventory.getProductInventory.setData(
          context.queryKey,
          context.previousData,
        );
        
        // Also rollback product-only query if no variant
        if (!variables.variantId) {
          utils.inventory.getProductInventory.setData(
            { productId: variables.productId },
            context.previousData,
          );
        }
      }
      toast.error(error.message || 'Failed to update inventory');
    },
    onSettled: (_, __, variables) => {
      // Invalidate all possible query combinations
      // 1. Specific variant query
      if (variables.variantId) {
        void utils.inventory.getProductInventory.invalidate({
          productId: variables.productId,
          variantId: variables.variantId,
          variantLabel: variables.variantLabel,
        });
      }
      
      // 2. Product-only query (for non-variant products or aggregate data)
      void utils.inventory.getProductInventory.invalidate({
        productId: variables.productId,
      });
      
      // 3. Invalidate metrics
      void utils.inventory.getInventoryMetrics.invalidate();
      
      // 4. Also invalidate product list queries that might show inventory
      void utils.product.list.invalidate();
      
      // Force immediate refetch of the specific query
      const refetchQuery = {
        productId: variables.productId,
        ...(variables.variantId && { variantId: variables.variantId }),
        ...(variables.variantLabel && { variantLabel: variables.variantLabel }),
      };
      void utils.inventory.getProductInventory.refetch(refetchQuery);
      
      // Also refetch product-only if no variant
      if (!variables.variantId) {
        void utils.inventory.getProductInventory.refetch({
          productId: variables.productId,
        });
      }
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