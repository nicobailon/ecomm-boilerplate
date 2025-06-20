import { VariantAttributes } from '../../shared/types/variant-attributes.js';

export function generateVariantLabel(attributes: VariantAttributes): string {
  const parts: string[] = [];
  
  // Order of priority for label generation
  const priorityKeys = ['size', 'color', 'material'];
  
  // Helper function to escape special characters
  const escapeValue = (value: string): string => {
    // First escape backslashes, then forward slashes
    return value.replace(/\\/g, '\\\\').replace(/\//g, '\\/');
  };
  
  // Add priority attributes first
  for (const key of priorityKeys) {
    if (attributes[key]) {
      parts.push(escapeValue(attributes[key]!));
    }
  }
  
  // Add any other attributes
  for (const [key, value] of Object.entries(attributes)) {
    if (value && !priorityKeys.includes(key)) {
      parts.push(escapeValue(value));
    }
  }
  
  return parts.join(' / ') || 'Default';
}