// Import shared types now that Gate G-1 is met
import type { VariantAttributes } from '@shared/types/variant-attributes';

// Re-export for backward compatibility
export type VariantAttribute = VariantAttributes;

export interface VariantType {
  name: string;
  values: string[];
}

export interface ProductVariantWithAttributes {
  variantId: string;
  label?: string;
  color?: string;
  price: number;
  inventory: number;
  images: string[];
  sku?: string;
  attributes?: VariantAttribute;
}

export interface ProductWithVariantTypes {
  _id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  collectionId?: string | { _id: string; name: string; slug: string };
  isFeatured: boolean;
  slug?: string;
  sku?: string;
  variantTypes?: VariantType[];
  variants?: ProductVariantWithAttributes[];
  inventory?: number;
  lowStockThreshold?: number;
  createdAt: string;
  updatedAt: string;
}

// Utility function to generate variant label from attributes
export function generateVariantLabel(attributes: VariantAttribute, variantTypes?: VariantType[]): string {
  if (!attributes || Object.keys(attributes).length === 0) {
    return 'Default';
  }
  
  // If variantTypes provided, use their order
  if (variantTypes && variantTypes.length > 0) {
    const parts = variantTypes
      .map(type => attributes[type.name])
      .filter(Boolean);
    return parts.length > 0 ? parts.join(' / ') : 'Default';
  }
  
  // Otherwise use alphabetical order, filtering out undefined values
  const parts = Object.entries(attributes)
    .filter(([, value]) => value !== undefined)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, value]) => value);
  return parts.join(' / ');
}

// Utility to compute unique variant key from attributes
export function getVariantKey(attributes: VariantAttribute): string {
  return Object.entries(attributes)
    .filter(([, value]) => value !== undefined)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => {
      // Escape delimiters to avoid collisions
      const escapedKey = k.replace(/[:|]/g, '_');
      const escapedValue = (v || '').replace(/[:|]/g, '_');
      return `${escapedKey}:${escapedValue}`;
    })
    .join('|');
}

// Feature flag type
export interface FeatureFlags {
  useVariantAttributes?: boolean;
}