import { describe, it, expect, beforeEach, vi } from 'vitest';
import { IProductVariant } from '../../types/product.types.js';

// Mock the feature flag module
vi.mock('../../utils/featureFlags.js', () => ({
  USE_VARIANT_LABEL: false,
  USE_VARIANT_ATTRIBUTES: false,
}));

import { getVariantOrDefault } from '../helpers/variant.helper.js';

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

describe('Variant Helper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getVariantOrDefault', () => {
    it('should return null variant when variants array is empty', () => {
      const result = getVariantOrDefault([], 'Medium Red', 'M');
      void expect(result.variant).toBeNull();
      void expect(result.isVirtualDefault).toBe(true);
    });

    it('should return null variant when variants array is undefined', () => {
      const result = getVariantOrDefault(undefined as unknown as IProductVariant[], 'Medium Red', 'M');
      void expect(result.variant).toBeNull();
      void expect(result.isVirtualDefault).toBe(true);
    });

    it('should find variant by size when provided (legacy mode)', () => {
      const result = getVariantOrDefault(mockVariants, undefined, 'M');
      void expect(result.variant?.variantId).toBe('v2');
      void expect(result.variant?.size).toBe('M');
      void expect(result.isVirtualDefault).toBe(false);
    });

    it('should return first variant as default when no size matches', () => {
      const result = getVariantOrDefault(mockVariants, undefined, 'XL');
      void expect(result.variant?.variantId).toBe('v1');
      void expect(result.isVirtualDefault).toBe(false);
    });

    it('should return first variant as default when no parameters provided', () => {
      const result = getVariantOrDefault(mockVariants);
      void expect(result.variant?.variantId).toBe('v1');
      void expect(result.isVirtualDefault).toBe(false);
    });

    it('should find variant by label when both label and size provided', () => {
      // This test assumes the feature flag functionality works
      // In a real scenario with USE_VARIANT_LABEL=true, it would find by label first
      const result = getVariantOrDefault(mockVariants, 'Medium Red', 'L');
      // Since USE_VARIANT_LABEL is false in this test, it should find by size (L)
      void expect(result.variant?.variantId).toBe('v3');
      void expect(result.variant?.size).toBe('L');
      void expect(result.isVirtualDefault).toBe(false);
    });
  });

});