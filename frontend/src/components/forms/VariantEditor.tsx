import { useFieldArray, useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Trash2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProductFormInput } from '@/lib/validations';
import { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/Skeleton';

interface VariantEditorProps {
  className?: string;
  isLoading?: boolean;
}

export function VariantEditor({ className, isLoading = false }: VariantEditorProps) {
  const { control, register, formState: { errors }, watch } = useFormContext<ProductFormInput>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'variants',
  });

  const variants = watch('variants') || [];
  const basePrice = watch('price') || 0;
  
  // Debounced validation state
  const [debouncedVariants, setDebouncedVariants] = useState(variants);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Update debounced variants with delay
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedVariants(variants);
    }, 300); // 300ms debounce
    
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [variants]);

  const addVariant = () => {
    append({
      label: '',
      color: '',
      priceAdjustment: 0,
      inventory: 0,
      sku: '',
    });
  };
  
  const validateUniqueLabels = useCallback((index: number, value: string) => {
    if (!value.trim()) return true; // Let required validation handle empty values
    
    // Use debounced variants for validation to prevent race conditions
    const normalizedValue = value.toLowerCase().trim();
    const isDuplicate = debouncedVariants.some((variant, i) => 
      i !== index && variant.label?.toLowerCase().trim() === normalizedValue
    );
    
    return isDuplicate ? 'Label must be unique' : true;
  }, [debouncedVariants]);


  // Duplicate check using debounced variants
  const { duplicateLabels, hasDuplicates } = useMemo(() => {
    const labelCounts = new Map<string, number>();
    debouncedVariants.forEach(variant => {
      if (variant.label?.trim()) {
        const label = variant.label.toLowerCase().trim();
        labelCounts.set(label, (labelCounts.get(label) || 0) + 1);
      }
    });
    const duplicates = Array.from(labelCounts.entries()).filter(([, count]) => count > 1).map(([label]) => label);
    return {
      duplicateLabels: duplicates,
      hasDuplicates: duplicates.length > 0,
    };
  }, [debouncedVariants]);

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <Label className="text-base font-medium">Product Variants</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addVariant}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Variant
        </Button>
      </div>

      {isLoading ? (
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-muted p-3">
            <div className="flex gap-4">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-16" />
            </div>
          </div>
          {fields.map((_, index) => (
            <div key={index} className="border-t p-3">
              <div className="flex gap-4">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-10" />
              </div>
            </div>
          ))}
        </div>
      ) : fields.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg border-dashed border-2">
          <p>No variants created yet</p>
          <p className="text-sm mt-1">Click "Add Variant" to create your first variant</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="p-3 text-left font-medium">Label</th>
                <th className="p-3 text-left font-medium">Color</th>
                <th className="p-3 text-left font-medium">Price Adjustment</th>
                <th className="p-3 text-left font-medium">Final Price</th>
                <th className="p-3 text-left font-medium">Inventory</th>
                <th className="p-3 text-left font-medium">SKU</th>
                <th className="p-3 text-center font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {fields.map((field, index) => (
                <tr key={field.id} className="border-t">
                  <td className="p-3">
                    <Input
                      {...register(`variants.${index}.label`, {
                        required: 'Label is required',
                        validate: (value) => validateUniqueLabels(index, value),
                      })}
                      placeholder="e.g., Small, Medium, Large"
                      error={errors.variants?.[index]?.label?.message}
                      className="w-full"
                      aria-label={`Variant ${index + 1} label`}
                    />
                  </td>
                  <td className="p-3">
                    <Input
                      {...register(`variants.${index}.color`)}
                      placeholder="e.g., Red, Blue, Green"
                      className="w-full"
                      aria-label={`Variant ${index + 1} color`}
                    />
                  </td>
                  <td className="p-3">
                    <Input
                      {...register(`variants.${index}.priceAdjustment`, {
                        valueAsNumber: true,
                      })}
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className="w-full"
                      aria-label={`Variant ${index + 1} price adjustment`}
                    />
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        ${(basePrice + (variants[index]?.priceAdjustment || 0)).toFixed(2)}
                      </span>
                      {variants[index]?.priceAdjustment !== 0 && (
                        <span className="text-xs text-muted-foreground">
                          ({(variants[index]?.priceAdjustment ?? 0) > 0 ? '+' : ''}{variants[index]?.priceAdjustment?.toFixed(2)})
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    <Input
                      {...register(`variants.${index}.inventory`, {
                        valueAsNumber: true,
                        min: { value: 0, message: 'Inventory cannot be negative' },
                      })}
                      type="number"
                      min="0"
                      placeholder="0"
                      error={errors.variants?.[index]?.inventory?.message}
                      className="w-full"
                      aria-label={`Variant ${index + 1} inventory`}
                    />
                  </td>
                  <td className="p-3">
                    <Input
                      {...register(`variants.${index}.sku`)}
                      placeholder="Optional SKU"
                      className="w-full"
                      aria-label={`Variant ${index + 1} SKU`}
                    />
                  </td>
                  <td className="p-3 text-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      aria-label={`Remove variant ${index + 1}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {fields.length > 0 && (
        <>
          {hasDuplicates && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-start gap-2">
              <span className="text-red-600 dark:text-red-400 text-sm font-medium">⚠</span>
              <div className="text-sm text-red-800 dark:text-red-300">
                <p className="font-medium">Duplicate variant labels detected:</p>
                <p className="mt-1">
                  {duplicateLabels.map(label => `"${label}"`).join(', ')}
                </p>
                <p className="mt-1 text-xs">Each variant must have a unique label.</p>
              </div>
            </div>
          )}
          
          <div className="text-sm text-muted-foreground">
            <p>
              <strong>Tips:</strong> 
              • Label must be unique across all variants
              • Price adjustment is added to the base product price
              • Final price shows what customers will pay (base + adjustment)
              • Negative adjustments create discounted variants
              • Leave color blank if not applicable
            </p>
          </div>
        </>
      )}
    </div>
  );
}

export function getVariantDisplayText(variant: { label?: string; color?: string; size?: string }) {
  if (variant.label) {
    return variant.color ? `${variant.label} - ${variant.color}` : variant.label;
  }
  
  return [variant.size, variant.color].filter(Boolean).join(' - ') || 'Default';
}

export function validateVariants(variants: Array<{ label?: string; inventory?: number }>) {
  const errors: string[] = [];
  
  // Check for required labels
  const missingLabels = variants.filter((variant) => 
    !variant.label || variant.label.trim() === ''
  );
  if (missingLabels.length > 0) {
    errors.push('All variants must have a label');
  }
  
  // Check for duplicate labels
  const labelCounts = new Map<string, number>();
  variants.forEach(variant => {
    if (variant.label?.trim()) {
      const label = variant.label.toLowerCase().trim();
      labelCounts.set(label, (labelCounts.get(label) || 0) + 1);
    }
  });
  const duplicates = Array.from(labelCounts.entries()).filter(([, count]) => count > 1);
  if (duplicates.length > 0) {
    errors.push(`Duplicate labels found: ${duplicates.map(([label]) => `"${label}"`).join(', ')}`);
  }
  
  // Check for negative inventory
  const negativeInventory = variants.filter(variant => 
    variant.inventory !== undefined && variant.inventory < 0
  );
  if (negativeInventory.length > 0) {
    errors.push('Inventory cannot be negative');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}