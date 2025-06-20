import { cn } from '@/lib/utils';
import { useState, useEffect, useMemo } from 'react';
import { getStockMessage } from '@/utils/inventory';

interface IProductVariant {
  variantId: string;
  size?: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';
  color?: string;
  price: number;
  inventory: number;
  images: string[];
  sku?: string;
}

interface ProductVariantSelectorProps {
  variants: IProductVariant[];
  selectedVariant: IProductVariant | null;
  onVariantSelect: (variant: IProductVariant) => void;
  basePrice: number;
}

const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const;

export function ProductVariantSelector({
  variants,
  selectedVariant,
  onVariantSelect,
  basePrice,
}: ProductVariantSelectorProps) {
  const [hoveredVariant, setHoveredVariant] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Sort variants to show in-stock options first
  const sortedVariants = useMemo(() => {
    return [...variants].sort((a, b) => {
      // First sort by availability
      if (a.inventory > 0 && b.inventory === 0) return -1;
      if (a.inventory === 0 && b.inventory > 0) return 1;
      // Then by inventory amount (high to low)
      return b.inventory - a.inventory;
    });
  }, [variants]);

  const uniqueSizes = [...new Set(sortedVariants.map(v => v.size).filter(Boolean))].sort(
    (a, b) => {
      const aIndex = a ? sizeOrder.indexOf(a) : -1;
      const bIndex = b ? sizeOrder.indexOf(b) : -1;
      return aIndex - bIndex;
    }
  );
  
  const uniqueColors = [...new Set(sortedVariants.map(v => v.color).filter(Boolean))];

  const isVariantAvailable = (variant: IProductVariant) => variant.inventory > 0;

  const getVariantByAttributes = (size?: string, color?: string) => {
    return variants.find(v => 
      (!size || v.size === size) && 
      (!color || v.color === color)
    );
  };

  const selectedSize = selectedVariant?.size;
  const selectedColor = selectedVariant?.color;

  // Auto-select first in-stock variant on mount
  useEffect(() => {
    if (!selectedVariant && sortedVariants.length > 0) {
      const firstInStock = sortedVariants.find(v => v.inventory > 0);
      if (firstInStock) {
        onVariantSelect(firstInStock);
      }
    }
  }, [sortedVariants, selectedVariant, onVariantSelect]);

  // Simulate loading state when checking inventory
  const handleVariantSelect = async (variant: IProductVariant) => {
    if (!isVariantAvailable(variant)) return;
    
    setIsLoading(true);
    // Simulate API call to check real-time inventory
    await new Promise(resolve => setTimeout(resolve, 300));
    setIsLoading(false);
    
    onVariantSelect(variant);
  };

  return (
    <div className="space-y-6">
      {uniqueSizes.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-foreground mb-3">Size</h3>
          <div className="flex flex-wrap gap-2">
            {uniqueSizes.map((size) => {
              const variant = getVariantByAttributes(size, selectedColor);
              const isAvailable = variant ? isVariantAvailable(variant) : false;
              const isSelected = selectedSize === size;

              return (
                <div key={size} className="relative group">
                  <button
                    onClick={() => {
                      if (variant && isAvailable) {
                        handleVariantSelect(variant);
                      }
                    }}
                    onMouseEnter={() => setHoveredVariant(variant?.variantId || null)}
                    onMouseLeave={() => setHoveredVariant(null)}
                    disabled={!isAvailable || isLoading}
                    className={cn(
                      'px-3 sm:px-4 py-2 text-sm font-medium rounded-md border transition-all min-w-[44px] min-h-[44px]',
                      isSelected
                        ? 'border-primary bg-primary text-primary-foreground'
                        : isAvailable
                        ? 'border-input bg-background text-foreground hover:border-primary'
                        : 'border-input/50 bg-muted text-muted-foreground cursor-not-allowed'
                    )}
                    aria-label={`Size ${size}${!isAvailable ? ' (Out of stock)' : ''}`}
                    aria-pressed={isSelected}
                  >
                    {size}
                  </button>
                  {/* Hover tooltip showing inventory */}
                  {variant && hoveredVariant === variant.variantId && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      {getStockMessage(variant.inventory)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {uniqueColors.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-foreground mb-3">Color</h3>
          <div className="flex flex-wrap gap-3">
            {uniqueColors.map((color) => {
              const variant = getVariantByAttributes(selectedSize, color);
              const isAvailable = variant ? isVariantAvailable(variant) : false;
              const isSelected = selectedColor === color;

              return (
                <div key={color} className="relative group">
                  <button
                    onClick={() => {
                      if (variant && isAvailable) {
                        handleVariantSelect(variant);
                      }
                    }}
                    onMouseEnter={() => setHoveredVariant(variant?.variantId || null)}
                    onMouseLeave={() => setHoveredVariant(null)}
                    disabled={!isAvailable || isLoading}
                    className={cn(
                      'relative w-11 h-11 sm:w-10 sm:h-10 rounded-full border-2 transition-all',
                      isSelected
                        ? 'border-primary ring-2 ring-primary ring-offset-2'
                        : isAvailable
                        ? 'border-input hover:border-primary'
                        : 'border-input/50 cursor-not-allowed opacity-50'
                    )}
                    aria-label={`Color ${color}${!isAvailable ? ' (Out of stock)' : ''}`}
                    aria-pressed={isSelected}
                  >
                    <span 
                      className="absolute inset-1 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    {!isAvailable && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <span className="w-8 h-[2px] bg-muted-foreground rotate-45 absolute" />
                      </span>
                    )}
                  </button>
                  {/* Hover tooltip showing inventory */}
                  {variant && hoveredVariant === variant.variantId && (
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      {getStockMessage(variant.inventory)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedVariant && (
        <div className="border-t pt-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              {selectedVariant.inventory <= 5 && selectedVariant.inventory > 0 && (
                <div className="flex items-center gap-2">
                  <p className="text-sm text-orange-600 font-medium animate-pulse">
                    Only {selectedVariant.inventory} left!
                  </p>
                  <span className="text-xs text-muted-foreground">
                    Order soon
                  </span>
                </div>
              )}
              {selectedVariant.inventory === 0 && (
                <p className="text-sm text-red-600 font-medium">Out of stock</p>
              )}
              {selectedVariant.inventory > 5 && (
                <p className="text-sm text-green-600 font-medium">In stock</p>
              )}
            </div>
            {selectedVariant.price !== basePrice && (
              <p className="text-lg font-semibold text-primary">
                ${selectedVariant.price.toFixed(2)}
              </p>
            )}
          </div>
          {selectedVariant.sku && (
            <p className="text-xs text-muted-foreground mt-1">SKU: {selectedVariant.sku}</p>
          )}
        </div>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 bg-background/50 flex items-center justify-center rounded-lg">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      )}
    </div>
  );
}