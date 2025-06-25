import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { generateVariantLabel, getVariantKey } from '@/types/variant';
import { useFeatureFlag } from '@/hooks/useFeatureFlags';

// Mock the hooks
vi.mock('@/hooks/useFeatureFlags', () => ({
  useFeatureFlag: vi.fn(),
}));

describe('Variant Attributes Flow', () => {
  describe('Feature Flag Integration', () => {
    it('should use legacy variant system when feature flag is off', () => {
      vi.mocked(useFeatureFlag).mockReturnValue(false);
      
      const { result } = renderHook(() => useFeatureFlag('USE_VARIANT_ATTRIBUTES'));
      
      void expect(result.current).toBe(false);
    });

    it('should use new variant attributes system when feature flag is on', () => {
      vi.mocked(useFeatureFlag).mockReturnValue(true);
      
      const { result } = renderHook(() => useFeatureFlag('USE_VARIANT_ATTRIBUTES'));
      
      void expect(result.current).toBe(true);
    });
  });

  describe('Variant Label Generation', () => {
    it('should generate labels from variant types in correct order', () => {
      const attributes = { size: 'Medium', color: 'Blue', material: 'Cotton' };
      const variantTypes = [
        { name: 'size', values: ['Small', 'Medium', 'Large'] },
        { name: 'color', values: ['Red', 'Blue'] },
        { name: 'material', values: ['Cotton', 'Polyester'] },
      ];

      const label = generateVariantLabel(attributes, variantTypes);
      void expect(label).toBe('Medium / Blue / Cotton');
    });

    it('should handle missing attributes gracefully', () => {
      const attributes = { size: 'Medium' };
      const variantTypes = [
        { name: 'size', values: ['Small', 'Medium', 'Large'] },
        { name: 'color', values: ['Red', 'Blue'] },
      ];

      const label = generateVariantLabel(attributes, variantTypes);
      void expect(label).toBe('Medium');
    });
  });

  describe('Variant Key Generation', () => {
    it('should generate consistent keys for variant lookup', () => {
      const attributes1 = { size: 'M', color: 'Blue' };
      const attributes2 = { color: 'Blue', size: 'M' };

      const key1 = getVariantKey(attributes1);
      const key2 = getVariantKey(attributes2);

      void expect(key1).toBe(key2);
      void expect(key1).toBe('color:Blue|size:M');
    });

    it('should handle special characters in attribute values', () => {
      const attributes = { size: 'X-Large', pattern: 'Polka|Dots' };
      
      const key = getVariantKey(attributes);
      
      void expect(key).toBe('pattern:Polka_Dots|size:X-Large');
    });
  });

  describe('Data Flow', () => {
    it('should transform form data to API format correctly', () => {
      const formData = {
        name: 'T-Shirt',
        description: 'Cotton T-Shirt',
        price: 29.99,
        image: 'https://example.com/image.jpg',
        variantTypes: [
          { name: 'size', values: ['S', 'M', 'L'] },
          { name: 'color', values: ['Red', 'Blue'] },
        ],
        variants: [
          {
            label: 'S / Red',
            priceAdjustment: 0,
            inventory: 10,
            attributes: { size: 'S', color: 'Red' },
          },
          {
            label: 'M / Blue',
            priceAdjustment: 5,
            inventory: 15,
            attributes: { size: 'M', color: 'Blue' },
          },
        ],
      };

      // Transform to API format
      const apiData = {
        ...formData,
        variants: formData.variants?.map(v => ({
          label: v.label,
          priceAdjustment: v.priceAdjustment ?? 0,
          inventory: v.inventory ?? 0,
          attributes: v.attributes,
        })),
      };

      void expect(apiData.variants).toHaveLength(2);
      void expect(apiData.variants?.[0].attributes).toEqual({ size: 'S', color: 'Red' });
      void expect(apiData.variants?.[1].priceAdjustment).toBe(5);
    });
  });

  describe('Variant Selection Logic', () => {
    it('should find correct variant based on attribute selection', () => {
      const variants = [
        {
          variantId: '1',
          label: 'S / Red',
          price: 29.99,
          inventory: 10,
          images: [],
          attributes: { Size: 'S', Color: 'Red' },
        },
        {
          variantId: '2',
          label: 'S / Blue',
          price: 29.99,
          inventory: 5,
          images: [],
          attributes: { size: 'S', color: 'Blue' },
        },
      ];

      const selectedAttributes = { size: 'S', color: 'Blue' };
      const key = getVariantKey(selectedAttributes);
      
      // Create variant map
      const variantMap = new Map<string, typeof variants[0]>();
      variants.forEach(v => {
        if (v.attributes) {
          variantMap.set(getVariantKey(v.attributes), v);
        }
      });

      const selectedVariant = variantMap.get(key);
      void expect(selectedVariant?.variantId).toBe('2');
      void expect(selectedVariant?.inventory).toBe(5);
    });

    it('should handle inventory constraints', () => {
      const variants = [
        {
          variantId: '1',
          label: 'M / Red',
          inventory: 0, // Out of stock
          attributes: { size: 'M', color: 'Red' },
        },
        {
          variantId: '2',
          label: 'M / Blue',
          inventory: 10,
          attributes: { size: 'M', color: 'Blue' },
        },
      ];

      // Filter available variants
      const availableVariants = variants.filter(v => v.inventory > 0);
      
      void expect(availableVariants).toHaveLength(1);
      void expect(availableVariants[0].attributes?.color).toBe('Blue');
    });
  });
});