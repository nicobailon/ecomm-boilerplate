import { useState, useEffect } from 'react';
import { ShoppingCart, Minus, Plus, Bell } from 'lucide-react';
import { useUnifiedAddToCart } from '@/hooks/cart/useUnifiedCart';
import { StockBadge } from '@/components/ui/StockBadge';
import { getMaxQuantity } from '@/utils/inventory';
import type { Product } from '@/types';
import { cleanVariantAttributes } from '@/utils/cleanAttributes';
import { useProductInventory } from '@/hooks/queries/useInventory';

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

export function ProductInfo({ product, selectedVariant, onAddToCartSuccess }: ProductInfoProps) {
  const [quantity, setQuantity] = useState(1);
  const [showNotifyButton, setShowNotifyButton] = useState(false);
  const [inventoryUpdateAnimation, setInventoryUpdateAnimation] = useState(false);
  const addToCart = useUnifiedAddToCart({ showToast: false });

  const displayPrice = selectedVariant?.price ?? product.price;
  const hasVariants = 'variants' in product && Array.isArray(product.variants) && product.variants.length > 0;
  const needsVariantSelection = hasVariants && selectedVariant === null;
  
  // Fetch real inventory data from backend
  const { data: inventoryData, isLoading: inventoryLoading } = useProductInventory(
    product._id,
    selectedVariant?.variantId,
    selectedVariant?.label
  );
  
  // Use real inventory data from backend, default to 0 while loading
  const displayInventory = inventoryData?.availableStock ?? 0;
    
  const isOutOfStock = displayInventory === 0;
  const maxQuantity = getMaxQuantity(displayInventory);
  
  // Mock estimated restock date (would come from API)
  const estimatedRestockDate = isOutOfStock ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString() : null;

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1 && newQuantity <= maxQuantity) {
      setQuantity(newQuantity);
    }
  };

  // Trigger animation when inventory updates
  useEffect(() => {
    if (selectedVariant) {
      setInventoryUpdateAnimation(true);
      const timer = setTimeout(() => setInventoryUpdateAnimation(false), 500);
      return () => clearTimeout(timer);
    }
  }, [selectedVariant]);

  const handleNotifyMe = () => {
    // Mock implementation - would call API
    alert(`We'll notify you at ${product.name} when it's back in stock!`);
    setShowNotifyButton(false);
  };

  const handleAddToCart = async () => {
    if (needsVariantSelection || isOutOfStock) return;
    
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
    } catch {
      // Error is already handled by mutation hook
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
            <div className={inventoryUpdateAnimation ? 'animate-pulse' : ''}>
              <StockBadge inventory={displayInventory} showCount size="sm" />
            </div>
          )}
        </div>
      </div>

      <div className="prose prose-sm text-muted-foreground">
        <p>{product.description}</p>
      </div>

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
              <span className="text-sm text-orange-600 font-medium">
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

        {isOutOfStock && !needsVariantSelection && hasVariants && (
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