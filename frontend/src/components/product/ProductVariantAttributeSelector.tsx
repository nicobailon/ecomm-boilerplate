import { cn } from '@/lib/utils';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { getStockMessage } from '@/utils/inventory';
import { getVariantKey } from '@/types/variant';
import { Label } from '@/components/ui/Label';
import { Badge } from '@/components/ui/Badge';

interface IProductVariant {
  variantId: string;
  label: string;
  color?: string;
  price: number;
  inventory: number;
  images: string[];
  sku?: string;
  attributes?: Record<string, string | undefined>;
}

interface VariantType {
  name: string;
  values: string[];
}

interface ProductVariantAttributeSelectorProps {
  variants: IProductVariant[];
  variantTypes: VariantType[];
  selectedVariant: IProductVariant | null;
  onVariantSelect: (variant: IProductVariant) => void;
  basePrice: number;
}

export function ProductVariantAttributeSelector({
  variants,
  variantTypes,
  selectedVariant,
  onVariantSelect,
  basePrice,
}: ProductVariantAttributeSelectorProps) {
  // Track selected attributes
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  // Create a map of variant keys to variants for fast lookup
  const variantMap = useMemo(() => {
    const map = new Map<string, IProductVariant>();
    variants.forEach(variant => {
      if (variant.attributes) {
        const key = getVariantKey(variant.attributes as Record<string, string>);
        map.set(key, variant);
      }
    });
    return map;
  }, [variants]);

  // Get available values for each variant type based on current selection
  const availableValues = useMemo(() => {
    const result: Record<string, Set<string>> = {};
    
    variantTypes.forEach(type => {
      result[type.name] = new Set<string>();
    });
    
    // Check which values are available given the current selection
    variants.forEach(variant => {
      if (!variant.attributes) return;
      
      // Check if this variant is compatible with current selection
      let isCompatible = true;
      for (const [attrName, attrValue] of Object.entries(selectedAttributes)) {
        if (variant.attributes[attrName] && variant.attributes[attrName] !== attrValue) {
          isCompatible = false;
          break;
        }
      }
      
      if (isCompatible) {
        // Add this variant's attributes to available values
        for (const [attrName, attrValue] of Object.entries(variant.attributes)) {
          if (result[attrName] && attrValue !== undefined) {
            result[attrName].add(attrValue);
          }
        }
      }
    });
    
    return result;
  }, [variants, variantTypes, selectedAttributes]);

  // Get inventory status for a specific attribute value
  const getAttributeInventory = (typeName: string, value: string) => {
    const testAttributes = { ...selectedAttributes, [typeName]: value };
    const key = getVariantKey(testAttributes);
    const variant = variantMap.get(key);
    return variant?.inventory ?? 0;
  };

  // Refs for keyboard navigation
  const buttonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  
  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent, typeName: string, currentValue: string, values: string[]) => {
    const currentIndex = values.indexOf(currentValue);
    let newIndex = currentIndex;
    
    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        newIndex = currentIndex > 0 ? currentIndex - 1 : values.length - 1;
        break;
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        newIndex = currentIndex < values.length - 1 ? currentIndex + 1 : 0;
        break;
      case 'Home':
        e.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        newIndex = values.length - 1;
        break;
      default:
        return;
    }
    
    // Focus the new button
    const newValue = values[newIndex];
    const buttonKey = `${typeName}-${newValue}`;
    const button = buttonRefs.current.get(buttonKey);
    button?.focus();
  }, []);
  
  // Handle attribute selection
  const handleAttributeSelect = (typeName: string, value: string) => {
    const newAttributes = { ...selectedAttributes, [typeName]: value };
    setSelectedAttributes(newAttributes);
    
    // Check if we have a complete selection
    const isComplete = variantTypes.every(type => newAttributes[type.name]);
    if (isComplete) {
      const key = getVariantKey(newAttributes);
      const variant = variantMap.get(key);
      if (variant && variant.inventory > 0) {
        onVariantSelect(variant);
      }
    }
  };

  // Initialize selection from selected variant
  useEffect(() => {
    if (selectedVariant?.attributes) {
      // Filter out undefined values
      const cleanAttributes: Record<string, string> = {};
      Object.entries(selectedVariant.attributes).forEach(([key, value]) => {
        if (value !== undefined) {
          cleanAttributes[key] = value;
        }
      });
      setSelectedAttributes(cleanAttributes);
    } else if (variants.length > 0) {
      // Auto-select first available variant
      const firstAvailable = variants.find(v => v.inventory > 0);
      if (firstAvailable?.attributes) {
        const cleanAttributes: Record<string, string> = {};
        Object.entries(firstAvailable.attributes).forEach(([key, value]) => {
          if (value !== undefined) {
            cleanAttributes[key] = value;
          }
        });
        setSelectedAttributes(cleanAttributes);
        onVariantSelect(firstAvailable);
      }
    }
  }, [selectedVariant, variants, onVariantSelect]);

  // Check if current selection forms a valid variant
  const currentVariant = useMemo(() => {
    const isComplete = variantTypes.every(type => selectedAttributes[type.name]);
    if (!isComplete) return null;
    
    const key = getVariantKey(selectedAttributes);
    return variantMap.get(key) ?? null;
  }, [selectedAttributes, variantTypes, variantMap]);

  return (
    <div className="space-y-6" role="group" aria-labelledby="variant-selector-heading">
      <h3 id="variant-selector-heading" className="sr-only">
        Select product options
      </h3>
      
      {/* Attribute Selectors */}
      {variantTypes.map((type) => (
        <div key={type.name} className="space-y-3">
          <Label className="text-sm font-medium">
            {type.name}
            {selectedAttributes[type.name] && (
              <span className="ml-2 text-muted-foreground font-normal">
                ({selectedAttributes[type.name]})
              </span>
            )}
          </Label>
          
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={`Select ${type.name}`}>
            {type.values.map((value, valueIndex) => {
              const isSelected = selectedAttributes[type.name] === value;
              const isAvailable = availableValues[type.name]?.has(value) ?? false;
              const inventory = getAttributeInventory(type.name, value);
              const hasStock = inventory > 0;
              const isSelectable = isAvailable && hasStock;
              const buttonKey = `${type.name}-${value}`;
              
              return (
                <button
                  key={value}
                  ref={(el) => {
                    if (el) buttonRefs.current.set(buttonKey, el);
                  }}
                  onClick={() => isSelectable && handleAttributeSelect(type.name, value)}
                  onKeyDown={(e) => handleKeyDown(e, type.name, value, type.values)}
                  disabled={!isSelectable}
                  tabIndex={!isSelectable ? -1 : isSelected || (!selectedAttributes[type.name] && valueIndex === 0 && isSelectable) ? 0 : -1}
                  className={cn(
                    'px-4 py-2 text-sm font-medium rounded-md border transition-all min-w-[60px] min-h-[40px]',
                    'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                    isSelected
                      ? 'border-emerald-500 bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 ring-2 ring-emerald-500/20 scale-105 font-semibold'
                      : isSelectable
                      ? 'border-gray-300 bg-white text-gray-900 hover:border-emerald-500 hover:bg-emerald-50 hover:shadow-md hover:scale-102'
                      : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed opacity-60',
                    !isAvailable && 'line-through',
                  )}
                  role="radio"
                  aria-checked={isSelected}
                  aria-label={`${type.name}: ${value}${!hasStock ? ' (Out of stock)' : ''}`}
                  title={!isAvailable ? 'Not available with current selection' : !hasStock ? 'Out of stock' : ''}
                >
                  {value}
                  {isAvailable && inventory <= 5 && inventory > 0 && (
                    <Badge variant="secondary" className="ml-2 text-xs px-1 py-0">
                      {inventory}
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Selected Variant Info */}
      {currentVariant && (
        <div className="border-t pt-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                Selected: <span className="font-medium text-foreground">{currentVariant.label}</span>
              </p>
              {currentVariant.sku && (
                <p className="text-xs text-muted-foreground">
                  SKU: {currentVariant.sku}
                </p>
              )}
            </div>
            
            {currentVariant.price !== basePrice && (
              <p className="text-lg font-semibold">
                ${currentVariant.price.toFixed(2)}
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            {currentVariant.inventory === 0 ? (
              <Badge variant="destructive">Out of Stock</Badge>
            ) : currentVariant.inventory <= 5 ? (
              <Badge variant="secondary" className="text-orange-600">
                Only {currentVariant.inventory} left!
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-green-600">
                {getStockMessage(currentVariant.inventory)}
              </Badge>
            )}
          </div>
        </div>
      )}
      
      {/* No valid selection message */}
      {variantTypes.every(type => selectedAttributes[type.name]) && !currentVariant && (
        <div className="border-t pt-4">
          <p className="text-sm text-muted-foreground">
            This combination is not available. Please select different options.
          </p>
        </div>
      )}
    </div>
  );
}