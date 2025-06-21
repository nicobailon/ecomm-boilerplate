import { useFieldArray, useFormContext } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { X, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProductFormInput } from '@/lib/validations';
import { useMemo, useCallback, useState, useEffect } from 'react';
import { generateVariantLabel, getVariantKey } from '@/types/variant';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';

interface VariantAttributesEditorProps {
  className?: string;
  isLoading?: boolean;
}

export function VariantAttributesEditor({ className, isLoading = false }: VariantAttributesEditorProps) {
  const { control, register, formState: { errors }, watch, setValue } = useFormContext<ProductFormInput>();
  const { fields: variantFields, append: appendVariant, remove: removeVariant } = useFieldArray({
    control,
    name: 'variants',
  });
  const { fields: typeFields, append: appendType, remove: removeType } = useFieldArray({
    control,
    name: 'variantTypes',
  });

  const watchedVariants = watch('variants');
  const watchedVariantTypes = watch('variantTypes');
  
  const variants = useMemo(() => watchedVariants ?? [], [watchedVariants]);
  const variantTypes = useMemo(() => watchedVariantTypes ?? [], [watchedVariantTypes]);
  const basePrice = watch('price') ?? 0;
  
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeValues, setNewTypeValues] = useState('');

  // Generate all possible variant combinations from variant types
  const generateVariantCombinations = useCallback(() => {
    if (variantTypes.length === 0) return [];
    
    const combinations: Record<string, string>[] = [];
    
    const generateCombos = (index: number, current: Record<string, string>) => {
      if (index === variantTypes.length) {
        combinations.push({ ...current });
        return;
      }
      
      const type = variantTypes[index];
      type.values.forEach(value => {
        current[type.name] = value;
        generateCombos(index + 1, current);
      });
    };
    
    generateCombos(0, {});
    return combinations;
  }, [variantTypes]);

  // Add a new variant type
  const addVariantType = useCallback(() => {
    if (!newTypeName.trim()) return;
    
    const values = newTypeValues
      .split(',')
      .map(v => v.trim())
      .filter(Boolean);
    
    if (values.length === 0) return;
    
    appendType({
      name: newTypeName.trim().toLowerCase(),
      values,
    });
    
    setNewTypeName('');
    setNewTypeValues('');
  }, [newTypeName, newTypeValues, appendType]);

  // Generate variants from types
  const generateVariantsFromTypes = useCallback(() => {
    const combinations = generateVariantCombinations();
    
    // Clear existing variants
    setValue('variants', []);
    
    // Create new variants for each combination
    combinations.forEach((attributes) => {
      const label = generateVariantLabel(attributes, variantTypes);
      appendVariant({
        label,
        priceAdjustment: 0,
        inventory: 0,
        sku: '',
        attributes,
      });
    });
  }, [generateVariantCombinations, variantTypes, setValue, appendVariant]);

  // Update variant labels when attributes change
  useEffect(() => {
    variants.forEach((variant, index) => {
      if (variant.attributes && Object.keys(variant.attributes).length > 0) {
        const newLabel = generateVariantLabel(variant.attributes, variantTypes);
        if (variant.label !== newLabel) {
          setValue(`variants.${index}.label`, newLabel);
        }
      }
    });
  }, [variants, variantTypes, setValue]);
  
  // Initialize attributes for existing variants when new variant types are added
  useEffect(() => {
    if (variantTypes.length > 0 && variants.length > 0) {
      variants.forEach((variant, index) => {
        // Initialize attributes object if it doesn't exist
        if (!variant.attributes) {
          setValue(`variants.${index}.attributes`, {});
        }
      });
    }
  }, [variantTypes.length, variants, setValue]);

  // Check for duplicate attribute combinations
  const duplicateCheck = useMemo(() => {
    const seen = new Map<string, number>(); // Map key to first occurrence index
    const duplicates = new Set<number>();
    
    variants.forEach((variant, index) => {
      if (variant.attributes && Object.keys(variant.attributes).length > 0) {
        const key = getVariantKey(variant.attributes);
        
        if (seen.has(key)) {
          duplicates.add(index);
          // Also mark the first occurrence as duplicate
          const firstIndex = seen.get(key);
          if (firstIndex !== undefined) {
            duplicates.add(firstIndex);
          }
        } else {
          seen.set(key, index);
        }
      }
    });
    
    return duplicates;
  }, [variants]);

  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Variant Types Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-medium">Variant Types</Label>
          <Badge variant="secondary" className="text-xs">
            Define attributes like Size, Color, Material
          </Badge>
        </div>

        {typeFields.length > 0 && (
          <div className="space-y-2 bg-muted/30 rounded-lg p-4">
            {typeFields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-2">
                <Badge variant="outline" className="min-w-[80px]">
                  {variantTypes[index]?.name}
                </Badge>
                <div className="flex-1 flex flex-wrap gap-1">
                  {variantTypes[index]?.values.map((value, vIndex) => (
                    <Badge key={vIndex} variant="secondary" className="text-xs">
                      {value}
                    </Badge>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeType(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Add new variant type */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Type name (e.g., Size)"
            value={newTypeName}
            onChange={(e) => setNewTypeName(e.target.value)}
          />
          <Input
            placeholder="Values (comma-separated, e.g., S, M, L, XL)"
            value={newTypeValues}
            onChange={(e) => setNewTypeValues(e.target.value)}
            className="md:col-span-2"
          />
        </div>
        
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addVariantType}
            disabled={!newTypeName.trim() || !newTypeValues.trim()}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Type
          </Button>
          
          {typeFields.length > 0 && (
            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={generateVariantsFromTypes}
            >
              Generate Variants
            </Button>
          )}
        </div>
      </div>

      {/* Variants Table */}
      <div className="space-y-4">
        <Label className="text-base font-medium">Product Variants</Label>
        
        {variantFields.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg border-dashed border-2">
            <p>No variants created yet</p>
            <p className="text-sm mt-1">
              {typeFields.length > 0 
                ? 'Click "Generate Variants" to create variants from your types'
                : 'Define variant types above or add variants manually'}
            </p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-muted">
                <tr>
                  <th className="p-3 text-left font-medium">Variant</th>
                  {variantTypes.map((type) => (
                    <th key={type.name} className="p-3 text-left font-medium">
                      {type.name}
                    </th>
                  ))}
                  <th className="p-3 text-left font-medium">Price Adj.</th>
                  <th className="p-3 text-left font-medium">Final Price</th>
                  <th className="p-3 text-left font-medium">Inventory</th>
                  <th className="p-3 text-left font-medium">SKU</th>
                  <th className="p-3 text-center font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {variantFields.map((field, index) => {
                  const variant = variants[index];
                  const isDuplicate = duplicateCheck.has(index);
                  
                  return (
                    <tr key={field.id} className={cn('border-t', isDuplicate && 'bg-red-50 dark:bg-red-900/10')}>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Input
                            {...register(`variants.${index}.label`)}
                            readOnly
                            tabIndex={-1}
                            className="w-32 bg-muted text-sm"
                            title="Auto-generated from attributes"
                          />
                          {isDuplicate && (
                            <Badge variant="destructive" className="text-xs">
                              Duplicate
                            </Badge>
                          )}
                        </div>
                      </td>
                      
                      {variantTypes.map((type) => (
                        <td key={type.name} className="p-3">
                          <select
                            {...register(`variants.${index}.attributes.${type.name}`)}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          >
                            <option value="">Select...</option>
                            {type.values.map((value) => (
                              <option key={value} value={value}>
                                {value}
                              </option>
                            ))}
                          </select>
                        </td>
                      ))}
                      
                      <td className="p-3">
                        <Input
                          {...register(`variants.${index}.priceAdjustment`, {
                            valueAsNumber: true,
                          })}
                          type="number"
                          step="0.01"
                          className="w-24"
                        />
                      </td>
                      
                      <td className="p-3">
                        <span className="text-sm font-medium">
                          ${(basePrice + (variant?.priceAdjustment ?? 0)).toFixed(2)}
                        </span>
                      </td>
                      
                      <td className="p-3">
                        <Input
                          {...register(`variants.${index}.inventory`, {
                            valueAsNumber: true,
                            min: { value: 0, message: 'Cannot be negative' },
                          })}
                          type="number"
                          min="0"
                          className="w-24"
                          error={errors.variants?.[index]?.inventory?.message}
                        />
                      </td>
                      
                      <td className="p-3">
                        <Input
                          {...register(`variants.${index}.sku`)}
                          placeholder="Optional"
                          className="w-32"
                        />
                      </td>
                      
                      <td className="p-3 text-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeVariant(index)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Duplicate Warning */}
        {duplicateCheck.size > 0 && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-start gap-2">
            <span className="text-red-600 dark:text-red-400 text-sm font-medium">⚠</span>
            <div className="text-sm text-red-800 dark:text-red-300">
              <p className="font-medium">Duplicate attribute combinations detected</p>
              <p className="mt-1 text-xs">Each variant must have a unique combination of attributes. Please modify the highlighted variants.</p>
            </div>
          </div>
        )}
        
        {!typeFields.length && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => appendVariant({
              label: '',
              priceAdjustment: 0,
              inventory: 0,
              sku: '',
            })}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Variant Manually
          </Button>
        )}
      </div>

      {variantFields.length > 0 && (
        <div className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">
          <p className="font-medium mb-1">Tips:</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>Define variant types (Size, Color, etc.) and their possible values</li>
            <li>Click &quot;Generate Variants&quot; to create all combinations automatically</li>
            <li>Variant labels are auto-generated from attribute values</li>
            <li>Each variant must have a unique combination of attributes</li>
            <li>Set inventory to 0 for out-of-stock variants</li>
          </ul>
        </div>
      )}
    </div>
  );
}