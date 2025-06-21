import { getVariantKey } from '@/types/variant';
import { findDuplicateLabels } from '@/utils/variant-validation';

export function getVariantDisplayText(variant: { label?: string; color?: string; size?: string }) {
  if (variant.label) {
    return variant.label;
  }
  
  return [variant.size, variant.color].filter(Boolean).join(' - ') ?? 'Default';
}

export function validateVariants(variants: { label?: string; inventory?: number; attributes?: Record<string, string | undefined> }[]) {
  const errors: string[] = [];
  
  // Check for required labels
  const missingLabels = variants.filter((variant) => 
    !variant.label || variant.label.trim() === '',
  );
  if (missingLabels.length > 0) {
    errors.push('All variants must have a label');
  }
  
  // Check for duplicate labels
  const { hasDuplicates, duplicateLabels } = findDuplicateLabels(variants);
  if (hasDuplicates) {
    errors.push(`Duplicate labels found: ${duplicateLabels.map(label => `"${label}"`).join(', ')}`);
  }
  
  // Check for duplicate attribute combinations (if using variant attributes)
  const attributeCombinations = new Map<string, number>();
  const hasAttributes = variants.some(v => v.attributes && Object.keys(v.attributes).length > 0);
  
  if (hasAttributes) {
    variants.forEach(variant => {
      if (variant.attributes && Object.keys(variant.attributes).length > 0) {
        const key = getVariantKey(variant.attributes);
        attributeCombinations.set(key, (attributeCombinations.get(key) ?? 0) + 1);
      }
    });
    
    const duplicateAttrs = Array.from(attributeCombinations.entries()).filter(([, count]) => count > 1);
    if (duplicateAttrs.length > 0) {
      errors.push('Duplicate attribute combinations found. Each variant must have a unique combination of attributes.');
    }
  }
  
  // Check for negative inventory
  const negativeInventory = variants.filter(variant => 
    variant.inventory !== undefined && variant.inventory < 0,
  );
  if (negativeInventory.length > 0) {
    errors.push('Inventory cannot be negative');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}