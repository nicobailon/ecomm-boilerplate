import { describe, it, expect } from 'vitest';
import {
  transformFormVariantToSubmission,
  transformSubmissionToFormVariant,
  recalculatePriceAdjustments,
} from '../variant-transform';
import type { FormVariant, VariantSubmission } from '@/types';

// Use real generateVariantId implementation to test actual behavior

describe('variant-transform', () => {
  describe('transformFormVariantToSubmission', () => {
    it('should transform form variant to submission format with existing variantId', () => {
      const formVariant: FormVariant & { variantId: string } = {
        variantId: 'existing-id-123',
        label: 'Large',
        priceAdjustment: 10,
        inventory: 50,
        sku: 'SKU-L',
      };
      const basePrice = 100;

      const result = transformFormVariantToSubmission(formVariant, basePrice);

      expect(result).toEqual({
        variantId: 'existing-id-123',
        label: 'Large',
        price: 110,
        inventory: 50,
        sku: 'SKU-L',
      });
    });

    it('should generate variantId when missing', () => {
      const formVariant: FormVariant = {
        label: 'Medium',
        priceAdjustment: 5,
        inventory: 30,
        sku: 'SKU-M',
      };
      const basePrice = 100;

      const result = transformFormVariantToSubmission(formVariant, basePrice);

      expect(result.variantId).toMatch(/^medium-[a-zA-Z0-9_-]{6}$/);
      expect(result.label).toBe('Medium');
      expect(result.price).toBe(105);
      expect(result.inventory).toBe(30);
      expect(result.sku).toBe('SKU-M');
    });

    it('should handle negative price adjustments', () => {
      const formVariant: FormVariant = {
        label: 'Small',
        priceAdjustment: -20,
        inventory: 100,
        sku: 'SKU-S',
      };
      const basePrice = 100;

      const result = transformFormVariantToSubmission(formVariant, basePrice);

      expect(result.variantId).toMatch(/^small-[a-zA-Z0-9_-]{6}$/);
      expect(result.label).toBe('Small');
      expect(result.price).toBe(80);
      expect(result.inventory).toBe(100);
      expect(result.sku).toBe('SKU-S');
    });

    it('should round prices to 2 decimal places', () => {
      const formVariant: FormVariant = {
        label: 'Custom',
        priceAdjustment: 10.999,
        inventory: 10,
      };
      const basePrice = 99.999;

      const result = transformFormVariantToSubmission(formVariant, basePrice);

      expect(result.price).toBe(111);
      expect(result.price.toString()).toMatch(/^\d+(\.\d{1,2})?$/);
    });

    it('should handle empty SKU by providing empty string', () => {
      const formVariant: FormVariant = {
        label: 'No SKU',
        priceAdjustment: 0,
        inventory: 20,
      };
      const basePrice = 50;

      const result = transformFormVariantToSubmission(formVariant, basePrice);

      expect(result.sku).toBe('');
    });

    it('should handle null inventory by defaulting to 0', () => {
      const formVariant: FormVariant = {
        label: 'No Inventory',
        priceAdjustment: 0,
        inventory: undefined as any,
      };
      const basePrice = 50;

      const result = transformFormVariantToSubmission(formVariant, basePrice);

      expect(result.inventory).toBe(0);
    });

    it('should handle empty label edge case', () => {
      const formVariant: FormVariant = {
        label: '',
        priceAdjustment: 0,
        inventory: 10,
      };
      const basePrice = 100;

      const result = transformFormVariantToSubmission(formVariant, basePrice);

      // Empty label results in just the nanoid (6 chars)
      expect(result.variantId).toMatch(/^[a-zA-Z0-9_-]{6}$/);
      expect(result.label).toBe('');
    });
  });

  describe('transformSubmissionToFormVariant', () => {
    it('should transform submission to form variant format', () => {
      const submission: VariantSubmission = {
        variantId: 'test-id-123',
        label: 'Extra Large',
        price: 120,
        inventory: 25,
        sku: 'SKU-XL',
      };
      const basePrice = 100;

      const result = transformSubmissionToFormVariant(submission, basePrice);

      expect(result).toEqual({
        variantId: 'test-id-123',
        label: 'Extra Large',
        priceAdjustment: 20,
        inventory: 25,
        sku: 'SKU-XL',
      });
    });

    it('should handle prices lower than base price', () => {
      const submission: VariantSubmission = {
        variantId: 'discount-id',
        label: 'Clearance',
        price: 75,
        inventory: 5,
        sku: 'SKU-CLR',
      };
      const basePrice = 100;

      const result = transformSubmissionToFormVariant(submission, basePrice);

      expect(result.priceAdjustment).toBe(-25);
    });

    it('should round price adjustments to 2 decimal places', () => {
      const submission: VariantSubmission = {
        variantId: 'precise-id',
        label: 'Precise',
        price: 100.999,
        inventory: 10,
        sku: 'SKU-P',
      };
      const basePrice = 99.449;

      const result = transformSubmissionToFormVariant(submission, basePrice);

      expect(result.priceAdjustment).toBe(1.55);
    });
  });

  describe('recalculatePriceAdjustments', () => {
    it('should recalculate adjustments when base price increases', () => {
      const variants: (FormVariant & { variantId?: string })[] = [
        { variantId: 'id1', label: 'Small', priceAdjustment: -10, inventory: 10, sku: 'S' },
        { variantId: 'id2', label: 'Medium', priceAdjustment: 0, inventory: 20, sku: 'M' },
        { variantId: 'id3', label: 'Large', priceAdjustment: 10, inventory: 30, sku: 'L' },
      ];
      const oldBasePrice = 100;
      const newBasePrice = 120;

      const result = recalculatePriceAdjustments(variants, oldBasePrice, newBasePrice);

      expect(result[0].priceAdjustment).toBe(-30); // 90 - 120
      expect(result[1].priceAdjustment).toBe(-20); // 100 - 120
      expect(result[2].priceAdjustment).toBe(-10); // 110 - 120
    });

    it('should recalculate adjustments when base price decreases', () => {
      const variants: (FormVariant & { variantId?: string })[] = [
        { variantId: 'id1', label: 'Small', priceAdjustment: -10, inventory: 10, sku: 'S' },
        { variantId: 'id2', label: 'Medium', priceAdjustment: 0, inventory: 20, sku: 'M' },
        { variantId: 'id3', label: 'Large', priceAdjustment: 10, inventory: 30, sku: 'L' },
      ];
      const oldBasePrice = 100;
      const newBasePrice = 80;

      const result = recalculatePriceAdjustments(variants, oldBasePrice, newBasePrice);

      expect(result[0].priceAdjustment).toBe(10);  // 90 - 80
      expect(result[1].priceAdjustment).toBe(20);  // 100 - 80
      expect(result[2].priceAdjustment).toBe(30);  // 110 - 80
    });

    it('should preserve all variant properties during recalculation', () => {
      const variants: (FormVariant & { variantId?: string })[] = [
        { variantId: 'preserve-id', label: 'Test', priceAdjustment: 15, inventory: 42, sku: 'TEST-123' },
      ];
      const oldBasePrice = 50;
      const newBasePrice = 60;

      const result = recalculatePriceAdjustments(variants, oldBasePrice, newBasePrice);

      expect(result[0]).toEqual({
        variantId: 'preserve-id',
        label: 'Test',
        priceAdjustment: 5, // 65 - 60
        inventory: 42,
        sku: 'TEST-123',
      });
    });

    it('should handle empty variants array', () => {
      const variants: (FormVariant & { variantId?: string })[] = [];
      const oldBasePrice = 100;
      const newBasePrice = 120;

      const result = recalculatePriceAdjustments(variants, oldBasePrice, newBasePrice);

      expect(result).toEqual([]);
    });

    it('should round recalculated adjustments to 2 decimal places', () => {
      const variants: (FormVariant & { variantId?: string })[] = [
        { label: 'Decimal', priceAdjustment: 10.456, inventory: 5 },
      ];
      const oldBasePrice = 99.999;
      const newBasePrice = 88.888;

      const result = recalculatePriceAdjustments(variants, oldBasePrice, newBasePrice);

      expect(result[0].priceAdjustment).toBe(21.57); // 110.455 - 88.888 = 21.567 -> 21.57
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle very large price values', () => {
      const formVariant: FormVariant = {
        label: 'Expensive',
        priceAdjustment: 999999,
        inventory: 1,
      };
      const basePrice = 999999;

      const result = transformFormVariantToSubmission(formVariant, basePrice);

      expect(result.price).toBe(1999998);
    });

    it('should handle floating point precision issues', () => {
      const formVariant: FormVariant = {
        label: 'Precision Test',
        priceAdjustment: 0.1 + 0.2, // Famous JS floating point issue
        inventory: 10,
      };
      const basePrice = 10;

      const result = transformFormVariantToSubmission(formVariant, basePrice);

      expect(result.price).toBe(10.3); // Should be exactly 10.3, not 10.299999999...
    });

    it('should maintain variant ID uniqueness check', () => {
      const variants: (FormVariant & { variantId?: string })[] = [
        { variantId: 'unique-1', label: 'Variant 1', priceAdjustment: 0, inventory: 10 },
        { variantId: 'unique-2', label: 'Variant 2', priceAdjustment: 0, inventory: 10 },
      ];

      const transformed = variants.map(v => transformFormVariantToSubmission(v, 100));
      const variantIds = transformed.map(v => v.variantId);

      expect(new Set(variantIds).size).toBe(variantIds.length);
    });
    
    it('should generate IDs for empty labels that meet backend MIN_VARIANT_ID_LENGTH', () => {
      // Test multiple empty label variants to ensure generated IDs are unique
      const emptyLabelVariants: FormVariant[] = [
        { label: '', priceAdjustment: 0, inventory: 5 },
        { label: '', priceAdjustment: 10, inventory: 10 },
        { label: '', priceAdjustment: -5, inventory: 15 },
      ];
      
      const results = emptyLabelVariants.map(v => 
        transformFormVariantToSubmission(v, 100)
      );
      
      // All IDs should meet minimum length requirement
      results.forEach(result => {
        expect(result.variantId.length).toBeGreaterThanOrEqual(1); // Backend MIN_VARIANT_ID_LENGTH
        // Should match allowed nanoid pattern (alphanumeric with - and _)
        expect(result.variantId).toMatch(/^[a-zA-Z0-9_-]+$/);
      });
      
      // All generated IDs should be unique
      const ids = results.map(r => r.variantId);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });
});