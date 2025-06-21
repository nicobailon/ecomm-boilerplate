import type { FormVariant, VariantSubmission } from '@/types';
import { generateVariantId } from './variant-id-generator';
import { roundToCents } from './price-utils';

export function transformFormVariantToSubmission(
  variant: FormVariant & { variantId?: string; color?: string },
  basePrice: number,
): VariantSubmission {
  return {
    variantId: variant.variantId ?? generateVariantId(variant.label),
    label: variant.label,
    color: variant.color, // Include color if present
    price: roundToCents(basePrice + (variant.priceAdjustment ?? 0)),
    inventory: variant.inventory ?? 0,
    reservedInventory: variant.reservedInventory ?? 0,
    images: variant.images ?? [],
    sku: variant.sku ?? '',
  };
}

export function transformSubmissionToFormVariant(
  variant: VariantSubmission,
  basePrice: number,
): FormVariant & { variantId: string } {
  return {
    variantId: variant.variantId,
    label: variant.label,
    priceAdjustment: roundToCents(variant.price - basePrice),
    inventory: variant.inventory,
    reservedInventory: variant.reservedInventory ?? 0,
    images: variant.images ?? [],
    sku: variant.sku,
  };
}

export function recalculatePriceAdjustments(
  variants: (FormVariant & { variantId?: string })[],
  oldBasePrice: number,
  newBasePrice: number,
): (FormVariant & { variantId?: string })[] {
  return variants.map(variant => {
    const absolutePrice = oldBasePrice + (variant.priceAdjustment ?? 0);
    const newAdjustment = absolutePrice - newBasePrice;
    
    return {
      ...variant,
      priceAdjustment: roundToCents(newAdjustment),
    };
  });
}