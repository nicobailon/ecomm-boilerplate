import { VariantAttributes } from '../types/variant-attributes.js';

export function cleanVariantAttributes(
  attributes: VariantAttributes | undefined
): Record<string, string> | undefined {
  if (!attributes) return undefined;
  
  const cleaned: Record<string, string> = {};
  
  for (const [key, value] of Object.entries(attributes)) {
    if (value !== undefined) {
      cleaned[key] = value;
    }
  }
  
  return Object.keys(cleaned).length > 0 ? cleaned : undefined;
}