import { nanoid } from 'nanoid';

/**
 * Generates a deterministic variant ID based on the variant label
 * Uses a combination of slugified label and a short random ID to avoid collisions
 */
export function generateVariantId(label: string): string {
  // Slugify the label: lowercase, replace spaces with hyphens, remove special chars
  const slug = label
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .substring(0, 20); // Limit length to prevent IDs from being too long
  
  // Generate a short random ID (6 characters)
  const shortId = nanoid(6);
  
  // Combine slug and short ID
  return slug ? `${slug}-${shortId}` : shortId;
}

/**
 * Batch generates variant IDs for multiple variants
 * Ensures all IDs are unique within the batch
 */
export function generateVariantIds(variants: Array<{ label: string }>): Map<number, string> {
  const idMap = new Map<number, string>();
  const usedIds = new Set<string>();
  
  variants.forEach((variant, index) => {
    let id = generateVariantId(variant.label);
    
    // Handle collisions by appending a counter
    let counter = 1;
    while (usedIds.has(id)) {
      id = `${generateVariantId(variant.label)}-${counter}`;
      counter++;
    }
    
    usedIds.add(id);
    idMap.set(index, id);
  });
  
  return idMap;
}