import { useFieldArray, useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Trash2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProductFormInput } from '@/lib/validations';
import { useMemo, useCallback, useRef, useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/Skeleton';
import { generateVariantId } from '@/utils/variant-id-generator';
import { findDuplicateLabels, validateUniqueLabel } from '@/utils/variant-validation';
import { roundToCents } from '@/utils/price-utils';

interface VariantEditorProps {
  className?: string;
  isLoading?: boolean;
}

export function VariantEditor({ className, isLoading = false }: VariantEditorProps) {
  const { control, register, formState: { errors }, watch, setValue } = useFormContext<ProductFormInput>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'variants',
  });

  const watchedVariants = watch('variants');
  const variants = useMemo(() => watchedVariants ?? [], [watchedVariants]);
  const basePrice = watch('price') ?? 0;
  
  // Debounced validation state
  const [debouncedVariants, setDebouncedVariants] = useState(variants);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
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
    // Don't generate ID yet - will be generated onBlur when label is provided
    append({
      variantId: '', // Empty ID will be generated when label is entered
      label: '',
      priceAdjustment: 0,
      inventory: 0,
      sku: '',
    });
  };
  
  const validateUniqueLabels = useCallback((index: number, value: string) => {
    return validateUniqueLabel(debouncedVariants, index, value);
  }, [debouncedVariants]);

  // Duplicate check using debounced variants
  const { duplicateLabels, hasDuplicates } = useMemo(() => {
    return findDuplicateLabels(debouncedVariants);
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
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-10 w-10" />
              </div>
            </div>
          ))}
        </div>
      ) : fields.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg border-dashed border-2">
          <p>No variants created yet</p>
          <p className="text-sm mt-1">Click &quot;Add Variant&quot; to create your first variant</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="p-3 text-left font-medium w-1/4">Label</th>
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
                    <input type="hidden" {...register(`variants.${index}.variantId`)} readOnly />
                    <Input
                      {...register(`variants.${index}.label`, {
                        required: 'Label is required',
                        validate: (value) => validateUniqueLabels(index, value),
                      })}
                      placeholder="e.g., Small, Medium, Large"
                      error={errors.variants?.[index]?.label?.message}
                      className="w-full"
                      aria-label={`Variant ${index + 1} label`}
                      onBlur={(e) => {
                        const label = e.target.value.trim();
                        const currentVariantId = variants[index]?.variantId;
                        // Only generate ID if label exists and variant doesn't have an ID yet
                        // NOTE: Once generated, IDs are stable and won't change if label is edited.
                        // This prevents breaking existing references but may cause ID/label mismatch.
                        // Alternative: Always regenerate on blur to keep ID in sync with label.
                        if (label && !currentVariantId) {
                          const newId = generateVariantId(label);
                          setValue(`variants.${index}.variantId`, newId);
                        }
                      }}
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
                        ${roundToCents(basePrice + (variants[index]?.priceAdjustment ?? 0))}
                      </span>
                      {variants[index]?.priceAdjustment !== 0 && (
                        <span className="text-xs text-muted-foreground">
                          ({(variants[index]?.priceAdjustment ?? 0) > 0 ? '+' : ''}${Math.abs(variants[index]?.priceAdjustment ?? 0).toFixed(2)})
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
            </p>
          </div>
        </>
      )}
    </div>
  );
}