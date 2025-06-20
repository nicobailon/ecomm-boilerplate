import { IProductVariant } from '../../types/product.types.js';
import { USE_VARIANT_LABEL, USE_VARIANT_ATTRIBUTES } from '../../utils/featureFlags.js';
import { VariantAttributes } from '../../../shared/types/variant-attributes.js';

export interface VariantHelperResult {
  variant: IProductVariant | null;
  isVirtualDefault: boolean;
}

export function getVariantOrDefault(
  variants: IProductVariant[],
  variantLabel?: string,
  size?: string,
  attributes?: VariantAttributes,
): VariantHelperResult {
  if (!variants || variants.length === 0) {
    return { variant: null, isVirtualDefault: true };
  }

  if (USE_VARIANT_LABEL && variantLabel) {
    const variant = variants.find(v => v.label === variantLabel);
    if (variant) {
      return { variant, isVirtualDefault: false };
    }
  }

  if (USE_VARIANT_ATTRIBUTES && attributes) {
    // Try to find exact match based on attributes
    const variant = variants.find(v => {
      if (!v.attributes) return false;
      
      // Count non-undefined values in both attribute sets
      const providedAttrs = Object.entries(attributes).filter(([_, value]) => value !== undefined);
      const variantAttrs = Object.entries(v.attributes).filter(([_, value]) => value !== undefined);
      
      // Check if counts match (exact match requirement)
      if (providedAttrs.length !== variantAttrs.length) {
        return false;
      }
      
      // Check if all provided attributes match exactly
      for (const [key, value] of providedAttrs) {
        if (v.attributes[key] !== value) {
          return false;
        }
      }
      return true;
    });
    
    if (variant) {
      return { variant, isVirtualDefault: false };
    }
  }

  if (size) {
    const variant = variants.find(v => v.size === size);
    if (variant) {
      return { variant, isVirtualDefault: false };
    }
  }

  return { variant: variants[0], isVirtualDefault: false };
}

