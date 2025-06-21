import { cn } from '@/lib/utils';
import { useState, useEffect, useMemo } from 'react';
import { getStockMessage } from '@/utils/inventory';
import { getVariantDisplayText } from '@/utils/variant-helpers';

// Helper to determine if a color is light (needs dark text)
function isLightColor(color: string): boolean {
  // Handle hex colors
  if (color.startsWith('#')) {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5;
  }
  
  // Handle named light colors
  const lightColors = ['white', 'ivory', 'beige', 'cream', 'yellow', 'lightyellow', 'lightgray', 'lightgrey', 'silver', 'lightblue', 'lightgreen', 'lightpink', 'lavender', 'peach', 'mint'];
  return lightColors.some(lightColor => color.toLowerCase().includes(lightColor));
}

interface IProductVariant {
  variantId: string;
  label: string;
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

export function ProductVariantSelector({
  variants,
  selectedVariant,
  onVariantSelect,
  basePrice,
}: ProductVariantSelectorProps) {
  const [hoveredVariant, setHoveredVariant] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingVariantId, setLoadingVariantId] = useState<string | null>(null);

  // Sort variants to maintain API order (label-based) while prioritizing availability
  const sortedVariants = useMemo(() => {
    return [...variants].sort((a, b) => {
      // First sort by availability
      if (a.inventory > 0 && b.inventory === 0) return -1;
      if (a.inventory === 0 && b.inventory > 0) return 1;
      // Maintain original order from API (don't sort by inventory amount)
      return 0;
    });
  }, [variants]);

  const isVariantAvailable = (variant: IProductVariant) => variant.inventory > 0;
  const selectedLabel = selectedVariant?.label;

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
    setLoadingVariantId(variant.variantId);
    // Simulate API call to check real-time inventory
    await new Promise(resolve => setTimeout(resolve, 300));
    setIsLoading(false);
    setLoadingVariantId(null);
    
    onVariantSelect(variant);
  };

  return (
    <div className="space-y-6" role="group" aria-labelledby="variant-selector-heading">
      {/* Label-based variant selection */}
      {sortedVariants.length > 0 && (
        <div>
          <h3 id="variant-selector-heading" className="text-sm font-medium text-foreground mb-3">
            Variants
            <span className="sr-only">
              {sortedVariants.length} options available. 
              {sortedVariants.filter(v => v.inventory > 0).length} in stock.
            </span>
          </h3>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-labelledby="variant-selector-heading">
            {sortedVariants.map((variant) => {
              const isAvailable = isVariantAvailable(variant);
              const isSelected = selectedLabel === variant.label;
              const displayText = getVariantDisplayText(variant);
              const hasColor = variant.color;
              const isColorOnly = hasColor && !variant.label;

              return (
                <div key={variant.variantId} className="relative group">
                  <button
                    onClick={() => {
                      if (isAvailable) {
                        void handleVariantSelect(variant);
                      }
                    }}
                    onMouseEnter={() => setHoveredVariant(variant.variantId)}
                    onMouseLeave={() => setHoveredVariant(null)}
                    onFocus={() => setHoveredVariant(variant.variantId)}
                    onBlur={() => setHoveredVariant(null)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setHoveredVariant(null);
                        e.currentTarget.blur();
                      }
                    }}
                    disabled={!isAvailable || loadingVariantId === variant.variantId}
                    className={cn(
                      'relative px-2 sm:px-3 md:px-4 py-2 text-sm font-medium rounded-md border transition-all min-w-[44px] min-h-[44px] flex items-center gap-1 sm:gap-2',
                      'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                      isSelected
                        ? 'border-primary bg-primary text-primary-foreground'
                        : isAvailable
                        ? 'border-input bg-background text-foreground hover:border-primary hover:bg-accent'
                        : 'border-input/50 bg-muted text-muted-foreground cursor-not-allowed',
                    )}
                    role="radio"
                    aria-checked={isSelected}
                    aria-label={`${displayText}${hasColor ? `, color ${variant.color}` : ''}${!isAvailable ? ' (Out of stock)' : ''}`}
                    aria-describedby={hoveredVariant === variant.variantId ? `tooltip-${variant.variantId}` : undefined}
                  >
                    {/* Color swatch overlay if color exists */}
                    {hasColor && (
                      <span
                        className={cn(
                          'w-3 h-3 rounded-full border flex-shrink-0',
                          isLightColor(variant.color ?? '') ? 'border-gray-400' : 'border-border',
                        )}
                        style={{ backgroundColor: variant.color }}
                        aria-hidden="true"
                        title={`Color: ${variant.color}`}
                      />
                    )}
                    <span className={cn(
                      'truncate text-xs sm:text-sm',
                      // If this is a color-only variant with light color and selected, ensure readable text
                      isSelected && isColorOnly && isLightColor(variant.color ?? '') && 'text-gray-900',
                    )}>
                      {isColorOnly ? `Color: ${variant.color}` : displayText}
                    </span>
                    {loadingVariantId === variant.variantId && (
                      <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin flex-shrink-0" />
                    )}
                    {!isAvailable && (
                      <span 
                        className="absolute inset-0 flex items-center justify-center bg-background/80"
                        aria-hidden="true"
                      >
                        <span className="w-6 h-[1px] bg-muted-foreground rotate-45 absolute" />
                      </span>
                    )}
                  </button>
                  
                  {/* Hover/Focus tooltip showing inventory */}
                  {hoveredVariant === variant.variantId && (
                    <div 
                      id={`tooltip-${variant.variantId}`}
                      className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 [[data-focus-visible-added]_~_&]:opacity-100 transition-opacity motion-reduce:transition-none pointer-events-none z-10"
                      role="tooltip"
                      aria-live="polite"
                    >
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
        <div className="border-t pt-4" role="status" aria-label="Selected variant details">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
            <div className="space-y-1">
              {selectedVariant.inventory <= 5 && selectedVariant.inventory > 0 && (
                <div className="flex items-center gap-2" role="alert">
                  <p className="text-sm text-orange-600 font-medium animate-pulse">
                    Only {selectedVariant.inventory} left!
                  </p>
                  <span className="text-xs text-muted-foreground">
                    Order soon
                  </span>
                </div>
              )}
              {selectedVariant.inventory === 0 && (
                <p className="text-sm text-red-600 font-medium" role="alert">
                  Out of stock
                </p>
              )}
              {selectedVariant.inventory > 5 && (
                <p className="text-sm text-green-600 font-medium">
                  {getStockMessage(selectedVariant.inventory)}
                </p>
              )}
            </div>
            {selectedVariant.price !== basePrice && (
              <p className="text-lg font-semibold text-primary" aria-label={`Variant price: $${selectedVariant.price.toFixed(2)}`}>
                ${selectedVariant.price.toFixed(2)}
              </p>
            )}
          </div>
          {selectedVariant.sku && (
            <p className="text-xs text-muted-foreground mt-1">
              <span className="sr-only">Product SKU: </span>
              SKU: {selectedVariant.sku}
            </p>
          )}
        </div>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>Checking inventory...</span>
        </div>
      )}
    </div>
  );
}