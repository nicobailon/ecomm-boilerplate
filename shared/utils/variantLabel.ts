import { VariantAttributes } from '../types/variant-attributes.js';

export function generateVariantLabel(attributes: VariantAttributes): string {
  const parts: string[] = [];
  
  // Order of priority for label generation
  const priorityKeys = ['size', 'color', 'material'];
  
  // Add priority attributes first
  for (const key of priorityKeys) {
    if (attributes[key]) {
      parts.push(attributes[key]!);
    }
  }
  
  // Add any other attributes
  for (const [key, value] of Object.entries(attributes)) {
    if (value && !priorityKeys.includes(key)) {
      parts.push(value);
    }
  }
  
  return parts.join(' / ') || 'Default';
}