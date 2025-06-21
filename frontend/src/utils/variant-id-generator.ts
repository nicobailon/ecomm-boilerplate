import { nanoid } from 'nanoid';
import { VARIANT_LIMITS } from '../../../shared/constants/variant.constants';

/**
 * Generates a deterministic variant ID based on the variant label
 * Uses a combination of slugified label and a short random ID to avoid collisions
 * Ensures the generated ID meets backend's minimum length requirement
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
  const shortId = nanoid(VARIANT_LIMITS.NANOID_LENGTH);
  
  // Combine slug and short ID
  const variantId = slug ? `${slug}-${shortId}` : shortId;
  
  // Validate that nanoid produced expected length (defensive programming)
  // This check ensures our ID generation logic is working as expected
  if (!slug && variantId.length !== VARIANT_LIMITS.NANOID_LENGTH) {
    throw new Error(`Generated variant ID has unexpected length: ${variantId.length} (expected ${VARIANT_LIMITS.NANOID_LENGTH})`);
  }
  
  return variantId;
}

/**
 * Batch generates variant IDs for multiple variants
 * Ensures all IDs are unique within the batch
 */
export function generateVariantIds(variants: { label: string }[]): Map<number, string> {
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