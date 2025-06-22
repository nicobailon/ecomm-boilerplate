import { describe, it, expect } from 'vitest';
import { generateVariantLabel, getVariantKey } from '../variant';
import type { VariantAttributes } from '@shared/types/variant-attributes';

describe('generateVariantLabel', () => {
  it('should generate label from attributes in variant type order', () => {
    const attributes = { size: 'Medium', color: 'Blue' };
    const variantTypes = [
      { name: 'size', values: ['Small', 'Medium', 'Large'] },
      { name: 'color', values: ['Red', 'Blue'] },
    ];

    const label = generateVariantLabel(attributes, variantTypes);
    expect(label).toBe('Medium / Blue');
  });

  it('should generate label in alphabetical order when no variant types provided', () => {
    const attributes = { color: 'Blue', size: 'Medium', material: 'Cotton' };
    
    const label = generateVariantLabel(attributes);
    expect(label).toBe('Blue / Cotton / Medium');
  });

  it('should return Default for empty attributes', () => {
    const label = generateVariantLabel({});
    expect(label).toBe('Default');
  });

  it('should return Default for null/undefined attributes', () => {
    expect(generateVariantLabel(null as unknown as VariantAttributes)).toBe('Default');
    expect(generateVariantLabel(undefined as unknown as VariantAttributes)).toBe('Default');
  });

  it('should skip missing attributes when using variant types', () => {
    const attributes = { size: 'Medium' }; // Missing color
    const variantTypes = [
      { name: 'size', values: ['Small', 'Medium', 'Large'] },
      { name: 'color', values: ['Red', 'Blue'] },
    ];

    const label = generateVariantLabel(attributes, variantTypes);
    expect(label).toBe('Medium');
  });

  it('should handle variant types with no matching attributes', () => {
    const attributes = { material: 'Cotton' };
    const variantTypes = [
      { name: 'size', values: ['Small', 'Medium', 'Large'] },
      { name: 'color', values: ['Red', 'Blue'] },
    ];

    const label = generateVariantLabel(attributes, variantTypes);
    expect(label).toBe('Default');
  });
});

describe('getVariantKey', () => {
  it('should generate consistent key regardless of attribute order', () => {
    const attrs1 = { size: 'Medium', color: 'Blue' };
    const attrs2 = { color: 'Blue', size: 'Medium' };

    expect(getVariantKey(attrs1)).toBe(getVariantKey(attrs2));
  });

  it('should generate unique keys for different attribute combinations', () => {
    const attrs1 = { size: 'Medium', color: 'Blue' };
    const attrs2 = { size: 'Medium', color: 'Red' };
    const attrs3 = { size: 'Large', color: 'Blue' };

    const key1 = getVariantKey(attrs1);
    const key2 = getVariantKey(attrs2);
    const key3 = getVariantKey(attrs3);

    expect(key1).not.toBe(key2);
    expect(key1).not.toBe(key3);
    expect(key2).not.toBe(key3);
  });

  it('should handle single attribute', () => {
    const attrs = { size: 'Medium' };
    expect(getVariantKey(attrs)).toBe('size:Medium');
  });

  it('should handle empty attributes', () => {
    expect(getVariantKey({})).toBe('');
  });

  it('should escape delimiters in attributes to avoid collisions', () => {
    const attrs = { size: 'X-Large', pattern: 'Dots|Stripes' };
    const key = getVariantKey(attrs);
    
    // Both | and : should be escaped to _
    expect(key).toBe('pattern:Dots_Stripes|size:X-Large');
  });
  
  it('should escape colons in attribute values', () => {
    const attrs = { size: 'Size:Large', type: 'Type:Special' };
    const key = getVariantKey(attrs);
    
    // Colons in values should be escaped
    expect(key).toBe('size:Size_Large|type:Type_Special');
  });

  it('should be case sensitive', () => {
    const attrs1 = { size: 'medium' };
    const attrs2 = { size: 'Medium' };

    expect(getVariantKey(attrs1)).not.toBe(getVariantKey(attrs2));
  });
});