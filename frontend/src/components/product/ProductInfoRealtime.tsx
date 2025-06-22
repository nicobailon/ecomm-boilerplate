import { useState, useEffect, useCallback } from 'react';
import { ShoppingCart, Minus, Plus, Bell, AlertCircle, Clock } from 'lucide-react';
import { useUnifiedAddToCart } from '@/hooks/cart/useUnifiedCart';
import { StockBadge } from '@/components/ui/StockBadge';
import { getMaxQuantity } from '@/utils/inventory';
import type { Product } from '@/types';
import { cleanVariantAttributes } from '@/utils/cleanAttributes';
import { useProductInventory } from '@/hooks/queries/useInventory';
import { useProductInventorySubscription } from '@/hooks/useRealtimeInventory';
import { cn } from '@/lib/utils';

interface IProductVariant {
  variantId: string;
  label?: string;
  size?: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';
  color?: string;
  price: number;
  inventory: number;
  images: string[];
  sku?: string;
  attributes?: Record<string, string | undefined>;
}

interface ProductInfoProps {
  product: Product;
  selectedVariant: IProductVariant | null;
  onAddToCartSuccess?: () => void;
}

export function ProductInfoRealtime({ product, selectedVariant, onAddToCartSuccess }: ProductInfoProps) {
  const [quantity, setQuantity] = useState(1);
  const [showNotifyButton, setShowNotifyButton] = useState(false);
  const [inventoryUpdateAnimation, setInventoryUpdateAnimation] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const addToCart = useUnifiedAddToCart({ showToast: false });

  // Subscribe to real-time inventory updates
  useProductInventorySubscription(product._id);

  const displayPrice = selectedVariant?.price ?? product.price;
  const hasVariants = 'variants' in product && Array.isArray(product.variants) && product.variants.length > 0;
  const needsVariantSelection = hasVariants && selectedVariant === null;
  
  // Fetch real inventory data from backend with real-time updates
  const { data: inventoryData, isLoading: inventoryLoading } = useProductInventory(
    product._id,
    selectedVariant?.variantId,
    selectedVariant?.label,
  );
  
  // Use real inventory data from backend
  const displayInventory = inventoryData?.availableStock ?? 0;
  const isOutOfStock = displayInventory === 0;
  const isLowStock = displayInventory > 0 && displayInventory <= 5;
  const maxQuantity = getMaxQuantity(displayInventory);
  
  // Estimated restock date from inventory data
  const estimatedRestockDate = inventoryData?.restockDate 
    ? new Date(inventoryData.restockDate).toLocaleDateString()
    : isOutOfStock 
    ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()
    : null;

  // Adjust quantity if it exceeds available stock
  useEffect(() => {
    if (quantity > maxQuantity && maxQuantity > 0) {
      setQuantity(maxQuantity);
    }
  }, [quantity, maxQuantity]);

  // Trigger animation when inventory updates
  useEffect(() => {
    if (inventoryData) {
      setInventoryUpdateAnimation(true);
      setLastUpdate(new Date());
      const timer = setTimeout(() => setInventoryUpdateAnimation(false), 500);
      return () => clearTimeout(timer);
    }
  }, [inventoryData?.availableStock]);

  const handleQuantityChange = useCallback((newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= maxQuantity) {
      setQuantity(newQuantity);
    }
  }, [maxQuantity]);

  const handleNotifyMe = () => {
    // This would call an API to register for notifications
    alert(`We'll notify you when ${product.name} is back in stock!`);
    setShowNotifyButton(false);
  };

  const handleAddToCart = async () => {
    if (needsVariantSelection || isOutOfStock) return;
    
    // Validate against latest inventory before adding
    if (quantity > displayInventory) {
      setQuantity(displayInventory);
      return;
    }
    
    try {
      for (let i = 0; i < quantity; i++) {
        await addToCart.mutateAsync({
          product,
          variantId: selectedVariant?.variantId,
          variantLabel: selectedVariant?.label,
          variantAttributes: cleanVariantAttributes(selectedVariant?.attributes),
        });
      }
      onAddToCartSuccess?.();
      setQuantity(1);
    } catch (error: unknown) {
      // Check if error is due to inventory
      if (error instanceof Error && error.message.includes('available')) {
        // Inventory has changed, update will come through WebSocket
        // Silent fail - inventory update will come through WebSocket
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">{product.name}</h1>
        
        <div className="flex items-center gap-4">
          <p className="text-2xl font-semibold text-primary">
            ${displayPrice.toFixed(2)}
          </p>
          {(selectedVariant ?? !hasVariants) && !inventoryLoading && (
            <div className={cn(
              'flex items-center gap-2',
              inventoryUpdateAnimation && 'animate-pulse',
            )}>
              <StockBadge 
                inventory={displayInventory} 
                showCount 
                size="sm" 
              />
              {lastUpdate && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>Updated {lastUpdate.toLocaleTimeString()}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="prose prose-sm text-muted-foreground">
        <p>{product.description}</p>
      </div>

      {/* Low stock warning */}
      {isLowStock && !isOutOfStock && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-amber-600" />
          <p className="text-sm text-amber-800 font-medium">
            Only {displayInventory} left in stock - order soon!
          </p>
        </div>
      )}

      <div className="pt-4 space-y-4">
        {!isOutOfStock && !needsVariantSelection && (
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-foreground">Quantity:</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleQuantityChange(quantity - 1)}
                disabled={quantity <= 1}
                className="w-8 h-8 flex items-center justify-center rounded-md border border-input 
                  hover:border-input/80 disabled:opacity-50 disabled:cursor-not-allowed
                  transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
                aria-label="Decrease quantity"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                min={1}
                max={maxQuantity}
                className="w-16 h-8 text-center border border-input rounded-md bg-background text-foreground
                  focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
                aria-label="Quantity"
              />
              <button
                onClick={() => handleQuantityChange(quantity + 1)}
                disabled={quantity >= maxQuantity}
                className="w-8 h-8 flex items-center justify-center rounded-md border border-input 
                  hover:border-input/80 disabled:opacity-50 disabled:cursor-not-allowed
                  transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
                aria-label="Increase quantity"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {displayInventory < 10 && displayInventory > 0 && (
              <span className="text-sm text-orange-600 font-medium animate-pulse">
                Max: {maxQuantity}
              </span>
            )}
          </div>
        )}

        <button
          onClick={() => void handleAddToCart()}
          disabled={addToCart.isPending || isOutOfStock || needsVariantSelection || inventoryLoading}
          className="w-full sm:w-auto flex items-center justify-center gap-3 px-6 sm:px-8 py-3 
            bg-primary text-primary-foreground font-medium rounded-lg
            hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          aria-label={
            inventoryLoading
              ? 'Loading inventory...'
              : needsVariantSelection
              ? 'Please select a variant'
              : isOutOfStock
              ? 'Out of stock'
              : `Add ${quantity} ${product.name} to cart for $${(displayPrice * quantity).toFixed(2)}`
          }
        >
          <ShoppingCart className="w-5 h-5" aria-hidden="true" />
          <span>
            {inventoryLoading
              ? 'Checking Stock...'
              : addToCart.isPending
              ? 'Adding...'
              : needsVariantSelection
              ? 'Select Options'
              : isOutOfStock
              ? 'Out of Stock'
              : quantity > 1
              ? `Add ${quantity} to Cart`
              : 'Add to Cart'}
          </span>
        </button>

        {needsVariantSelection && (
          <p className="mt-2 text-sm text-red-600">
            Please select your preferred options above
          </p>
        )}

        {isOutOfStock && !needsVariantSelection && (
          <div className="space-y-3">
            {!showNotifyButton ? (
              <button
                onClick={() => setShowNotifyButton(true)}
                className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
              >
                <Bell className="w-4 h-4" />
                <span className="text-sm font-medium">Notify me when available</span>
              </button>
            ) : (
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="px-3 py-2 border border-input rounded-md text-sm
                    focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
                />
                <button
                  onClick={handleNotifyMe}
                  className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md
                    hover:bg-primary/90 transition-colors"
                >
                  Notify Me
                </button>
              </div>
            )}
            {estimatedRestockDate && (
              <p className="text-sm text-muted-foreground">
                Estimated restock: {estimatedRestockDate}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}