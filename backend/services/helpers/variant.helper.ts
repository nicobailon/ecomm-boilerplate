import { IProductVariant } from '../../types/product.types.js';
import { USE_VARIANT_LABEL } from '../../utils/featureFlags.js';

export interface VariantHelperResult {
  variant: IProductVariant | null;
  isVirtualDefault: boolean;
}

export function getVariantOrDefault(
  variants: IProductVariant[],
  variantLabel?: string,
  size?: string,
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

  if (size) {
    const variant = variants.find(v => v.size === size);
    if (variant) {
      return { variant, isVirtualDefault: false };
    }
  }

  return { variant: variants[0], isVirtualDefault: false };
}

