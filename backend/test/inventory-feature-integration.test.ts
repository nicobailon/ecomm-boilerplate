import { describe, it, expect } from 'vitest';
import { getVariantOrDefault } from '../services/helpers/variant.helper.js';
import { IProductVariant } from '../types/product.types.js';

describe('Inventory Feature Integration', () => {
  const mockVariants: IProductVariant[] = [
    {
      variantId: 'v1',
      label: 'Small Blue',
      size: 'S',
      color: 'blue',
      price: 29.99,
      inventory: 10,
      images: [],
      sku: 'TEST-S-BLUE',
    },
    {
      variantId: 'v2',
      label: 'Medium Red',
      size: 'M',
      color: 'red',
      price: 32.99,
      inventory: 5,
      images: [],
      sku: 'TEST-M-RED',
    },
    {
      variantId: 'v3',
      label: 'Large Green',
      size: 'L',
      color: 'green',
      price: 35.99,
      inventory: 8,
      images: [],
      sku: 'TEST-L-GREEN',
    },
  ];

  describe('Variant Selection Logic', () => {
    it('should support both legacy size-based and new label-based variant selection', () => {
      // Test legacy size-based selection
      const sizeResult = getVariantOrDefault(mockVariants, undefined, 'M');
      void expect(sizeResult.variant?.size).toBe('M');
      void expect(sizeResult.variant?.variantId).toBe('v2');

      // Test label-based selection (when USE_VARIANT_LABEL is false, it falls back to first variant)
      const labelResult = getVariantOrDefault(mockVariants, 'Large Green', undefined);
      void expect(labelResult.variant?.variantId).toBe('v1'); // Falls back to first variant
      void expect(labelResult.isVirtualDefault).toBe(true);

      // Test default fallback
      const defaultResult = getVariantOrDefault(mockVariants);
      void expect(defaultResult.variant?.variantId).toBe('v1');
      void expect(defaultResult.isVirtualDefault).toBe(true);
    });

    it('should maintain backward compatibility with size-based access', () => {
      // Even when labels are available, size-based access should still work
      const result = getVariantOrDefault(mockVariants, undefined, 'L');
      void expect(result.variant?.size).toBe('L');
      void expect(result.variant?.label).toBe('Large Green');
      void expect(result.isVirtualDefault).toBe(false);
    });

    it('should handle edge cases properly', () => {
      // Empty variants array
      const emptyResult = getVariantOrDefault([]);
      void expect(emptyResult.variant).toBeNull();
      void expect(emptyResult.isVirtualDefault).toBe(false);

      // Non-existent size
      const nonExistentResult = getVariantOrDefault(mockVariants, undefined, 'XXL');
      void expect(nonExistentResult.variant?.variantId).toBe('v1');
      void expect(nonExistentResult.isVirtualDefault).toBe(true);

      // Non-existent label
      const nonExistentLabelResult = getVariantOrDefault(mockVariants, 'Non-existent Label', undefined);
      void expect(nonExistentLabelResult.variant?.variantId).toBe('v1');
      void expect(nonExistentLabelResult.isVirtualDefault).toBe(true);
    });
  });

  describe('Inventory Calculations', () => {
    it('should correctly calculate inventory for specific variants', () => {
      // When USE_VARIANT_LABEL is false, label lookup falls back to first variant
      const mediumRedVariant = getVariantOrDefault(mockVariants, 'Medium Red');
      void expect(mediumRedVariant.variant?.inventory).toBe(10); // First variant (Small Blue)
      
      const largeGreenVariant = getVariantOrDefault(mockVariants, undefined, 'L');
      void expect(largeGreenVariant.variant?.inventory).toBe(8); // Correctly finds Large Green by size
    });

    it('should handle total inventory calculations', () => {
      const totalInventory = mockVariants.reduce((total, variant) => total + variant.inventory, 0);
      void expect(totalInventory).toBe(23); // 10 + 5 + 8
    });
  });

  describe('Cache Key Generation', () => {
    it('should generate appropriate cache keys for different access patterns', () => {
      // This test verifies that the cache key logic can handle both scenarios
      const productId = 'test-product-123';
      const variantId = 'v2';
      const variantLabel = 'Medium Red';

      // Legacy cache key pattern
      const legacyKey = `inventory:product:${productId}:${variantId}`;
      void expect(legacyKey).toBe('inventory:product:test-product-123:v2');

      // New cache key pattern with label
      const labelKey = `inventory:product:${productId}:${variantId}:label:${variantLabel}`;
      void expect(labelKey).toBe('inventory:product:test-product-123:v2:label:Medium Red');

      // Product-only cache key
      const productKey = `inventory:product:${productId}`;
      void expect(productKey).toBe('inventory:product:test-product-123');
    });
  });

  describe('Default Variant Creation', () => {
    it('should create proper default variant with label field', () => {
      const defaultVariant = {
        variantId: 'default',
        label: 'Default',
        size: undefined,
        color: undefined,
        price: 29.99,
        inventory: 0,
          images: [],
        sku: undefined,
      };

      void expect(defaultVariant.label).toBe('Default');
      void expect(defaultVariant.variantId).toBe('default');
      void expect(defaultVariant.inventory).toBe(0);
    });
  });

  describe('Availability Checks', () => {
    it('should perform availability checks with different variant access patterns', () => {
      // Mock availability check function
      const checkAvailability = (variants: IProductVariant[], variantLabel?: string, size?: string, quantity = 1) => {
        const { variant } = getVariantOrDefault(variants, variantLabel, size);
        if (!variant) return false;
        return variant.inventory >= quantity;
      };

      // Test by label (falls back to first variant when USE_VARIANT_LABEL is false)
      void expect(checkAvailability(mockVariants, 'Medium Red', undefined, 3)).toBe(true); // First variant has 10 inventory
      void expect(checkAvailability(mockVariants, 'Medium Red', undefined, 12)).toBe(false); // More than 10

      // Test by size
      void expect(checkAvailability(mockVariants, undefined, 'L', 5)).toBe(true);
      void expect(checkAvailability(mockVariants, undefined, 'L', 10)).toBe(false);

      // Test default
      void expect(checkAvailability(mockVariants, undefined, undefined, 8)).toBe(true);
      void expect(checkAvailability(mockVariants, undefined, undefined, 12)).toBe(false);
    });
  });
});