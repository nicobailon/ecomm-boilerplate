import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import { useCartStore } from '@/stores/cart-store';
import { 
  InventoryError, 
  InventoryAdjustment, 
  isInventoryError, 
  getInventoryErrorMessage,
  formatInventoryAdjustments 
} from '@/utils/inventory-errors';

interface UseInventoryValidationOptions {
  onValidationError?: (error: InventoryError) => void;
  onAdjustments?: (adjustments: InventoryAdjustment[]) => void;
  showToasts?: boolean;
}

export function useInventoryValidation(options: UseInventoryValidationOptions = {}) {
  const { showToasts = true } = options;
  const [isValidating, setIsValidating] = useState(false);
  const { items, updateQuantity, removeItem } = useCartStore();

  const validateInventory = trpc.inventory.validateCheckout.useMutation({
    onError: (error) => {
      if (isInventoryError(error)) {
        options.onValidationError?.(error);
        
        if (showToasts) {
          const { title, messages } = getInventoryErrorMessage(error);
          toast.error(title, {
            description: messages.join('\n'),
            duration: 8000,
          });
        }
      }
    },
  });

  const checkInventoryAvailability = useCallback(async (): Promise<{
    isValid: boolean;
    adjustments: InventoryAdjustment[];
    error?: string;
  }> => {
    if (items.length === 0) {
      return { isValid: true, adjustments: [] };
    }

    setIsValidating(true);
    
    try {
      const products = items.map(item => ({
        _id: item._id,
        quantity: item.quantity,
        variantId: item.variantId,
      }));

      const result = await validateInventory.mutateAsync({ products });
      
      if (result.adjustments && result.adjustments.length > 0) {
        // Auto-adjust cart based on available inventory
        for (const adjustment of result.adjustments) {
          if (adjustment.adjustedQuantity === 0) {
            removeItem(adjustment.productId);
          } else {
            updateQuantity(adjustment.productId, adjustment.adjustedQuantity);
          }
        }

        options.onAdjustments?.(result.adjustments);
        
        if (showToasts) {
          const { title, messages } = formatInventoryAdjustments(result.adjustments);
          toast.info(title, {
            description: messages.join('\n'),
            duration: 8000,
            action: {
              label: 'Review Cart',
              onClick: () => {
                // Optionally navigate to cart or open cart drawer
              },
            },
          });
        }
      }

      return {
        isValid: result.isValid,
        adjustments: result.adjustments ?? [],
      };
    } catch (error) {
      // Error handling is done in the mutation's onError
      // Preserve error details for debugging while still returning a consistent response
      console.error('Inventory validation error:', error);
      
      // Return failure with empty adjustments but preserve the error context
      return { 
        isValid: false, 
        adjustments: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    } finally {
      setIsValidating(false);
    }
  }, [items, validateInventory, removeItem, updateQuantity, showToasts]);

  const validateSingleProduct = useCallback(async (
    productId: string,
    variantId: string | undefined,
    quantity: number
  ): Promise<boolean> => {
    try {
      const result = await validateInventory.mutateAsync({
        products: [{
          _id: productId,
          quantity,
          variantId,
        }],
      });

      return result.isValid;
    } catch (error) {
      // Log the error for debugging
      console.error('Single product validation error:', {
        productId,
        variantId,
        quantity,
        error: error instanceof Error ? error.message : error
      });
      
      if (isInventoryError(error) && showToasts) {
        const { title, messages } = getInventoryErrorMessage(error);
        toast.error(title, {
          description: messages[0],
        });
      } else if (error instanceof Error && showToasts) {
        // Handle non-inventory errors
        toast.error('Validation Error', {
          description: error.message || 'Unable to validate product availability',
        });
      }
      
      return false;
    }
  }, [validateInventory, showToasts]);

  return {
    checkInventoryAvailability,
    validateSingleProduct,
    isValidating,
  };
}