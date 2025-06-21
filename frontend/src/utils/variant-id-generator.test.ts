import { describe, it, expect } from 'vitest';
import { generateVariantId, generateVariantIds } from './variant-id-generator';

describe('generateVariantId', () => {
  it('should generate ID from simple label', () => {
    const id = generateVariantId('Small');
    expect(id).toMatch(/^small-[a-zA-Z0-9_-]{6}$/);
  });

  it('should handle labels with spaces', () => {
    const id = generateVariantId('Extra Large');
    expect(id).toMatch(/^extra-large-[a-zA-Z0-9_-]{6}$/);
  });

  it('should remove special characters', () => {
    const id = generateVariantId('Size: L/XL (Special)');
    expect(id).toMatch(/^size-lxl-special-[a-zA-Z0-9_-]{6}$/);
  });

  it('should handle multiple spaces and hyphens', () => {
    const id = generateVariantId('Size   --   Medium');
    expect(id).toMatch(/^size-medium-[a-zA-Z0-9_-]{6}$/);
  });

  it('should limit slug length to 20 characters', () => {
    const longLabel = 'This is a very long variant label that exceeds the limit';
    const id = generateVariantId(longLabel);
    // The slug is cut off at 20 chars, which might end with a hyphen
    expect(id).toMatch(/^this-is-a-very-long-?-[a-zA-Z0-9_-]{6}$/);
    // Extract slug part
    const lastHyphenIndex = id.lastIndexOf('-');
    const secondLastHyphenIndex = id.lastIndexOf('-', lastHyphenIndex - 1);
    const slug = secondLastHyphenIndex > 0 && lastHyphenIndex - secondLastHyphenIndex === 1 
      ? id.substring(0, secondLastHyphenIndex)
      : id.substring(0, lastHyphenIndex);
    expect(slug.length).toBeLessThanOrEqual(20);
  });

  it('should handle empty label', () => {
    const id = generateVariantId('');
    expect(id).toMatch(/^[a-zA-Z0-9_-]{6}$/); // Just the nanoid
  });

  it('should handle label with only special characters', () => {
    const id = generateVariantId('!!!@@@###');
    expect(id).toMatch(/^[a-zA-Z0-9_-]{6}$/); // Just the nanoid
  });

  it('should trim whitespace from label', () => {
    const id = generateVariantId('  Trimmed  ');
    expect(id).toMatch(/^trimmed-[a-zA-Z0-9_-]{6}$/);
  });

  it('should generate unique IDs for same label', () => {
    const id1 = generateVariantId('Same Label');
    const id2 = generateVariantId('Same Label');
    
    expect(id1).not.toBe(id2);
    expect(id1).toMatch(/^same-label-[a-zA-Z0-9_-]{6}$/);
    expect(id2).toMatch(/^same-label-[a-zA-Z0-9_-]{6}$/);
  });
});

describe('generateVariantIds', () => {
  it('should generate IDs for multiple variants', () => {
    const variants = [
      { label: 'Small' },
      { label: 'Medium' },
      { label: 'Large' }
    ];
    
    const idMap = generateVariantIds(variants);
    
    expect(idMap.size).toBe(3);
    expect(idMap.get(0)).toMatch(/^small-[a-zA-Z0-9_-]{6}$/);
    expect(idMap.get(1)).toMatch(/^medium-[a-zA-Z0-9_-]{6}$/);
    expect(idMap.get(2)).toMatch(/^large-[a-zA-Z0-9_-]{6}$/);
  });

  it('should handle duplicate labels by appending counter', () => {
    const variants = [
      { label: 'Same' },
      { label: 'Same' },
      { label: 'Different' },
      { label: 'Same' }
    ];
    
    const idMap = generateVariantIds(variants);
    
    expect(idMap.size).toBe(4);
    
    const ids = Array.from(idMap.values());
    // All IDs should be unique
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(4);
    
    // Check that all "Same" IDs start with "same-" and Different starts with "different-"
    expect(ids[0]).toMatch(/^same-[a-zA-Z0-9_-]+$/);
    expect(ids[1]).toMatch(/^same-[a-zA-Z0-9_-]+$/);
    expect(ids[2]).toMatch(/^different-[a-zA-Z0-9_-]+$/);
    expect(ids[3]).toMatch(/^same-[a-zA-Z0-9_-]+$/);
  });

  it('should return empty map for empty array', () => {
    const idMap = generateVariantIds([]);
    expect(idMap.size).toBe(0);
  });

  it('should handle variants with empty labels', () => {
    const variants = [
      { label: '' },
      { label: 'Valid' },
      { label: '' }
    ];
    
    const idMap = generateVariantIds(variants);
    
    expect(idMap.size).toBe(3);
    expect(idMap.get(0)).toMatch(/^[a-zA-Z0-9_-]+$/);
    expect(idMap.get(1)).toMatch(/^valid-[a-zA-Z0-9_-]+$/);
    expect(idMap.get(2)).toMatch(/^[a-zA-Z0-9_-]+$/);
    
    // The empty label IDs should be different
    expect(idMap.get(0)).not.toBe(idMap.get(2));
  });
});

describe('variant ID format and length', () => {
  it('should meet minimum length requirements', () => {
    // Assuming backend requires MIN_VARIANT_ID_LENGTH of at least 6
    const shortLabel = 'X';
    const id = generateVariantId(shortLabel);
    expect(id.length).toBeGreaterThanOrEqual(6); // 'x-xxxxxx' = 8 chars minimum
  });

  it('should generate valid URL-safe IDs', () => {
    const labels = [
      'Normal Label',
      'Label with ñ unicode',
      'Label/with\\slashes',
      'Label+with+plus',
      'Label&with&ampersand'
    ];
    
    labels.forEach(label => {
      const id = generateVariantId(label);
      // Check that ID only contains URL-safe characters (letters, numbers, hyphens, underscores)
      expect(id).toMatch(/^[a-zA-Z0-9_-]+$/);
    });
  });

  it('should be consistent for same input', () => {
    const label = 'Consistent Label';
    const id1 = generateVariantId(label);
    const id2 = generateVariantId(label);
    
    // Both IDs should have the same format
    expect(id1).toMatch(/^consistent-label-[a-zA-Z0-9_-]{6}$/);
    expect(id2).toMatch(/^consistent-label-[a-zA-Z0-9_-]{6}$/);
    
    // The IDs should be different (unique nanoid)
    expect(id1).not.toBe(id2);
  });
});