import { describe, it, expect } from 'vitest';
import { findDuplicateLabels, validateUniqueLabel } from '../variant-validation';

describe('variant-validation', () => {
  describe('findDuplicateLabels', () => {
    it('should return no duplicates for unique labels', () => {
      const variants = [
        { label: 'Small' },
        { label: 'Medium' },
        { label: 'Large' },
      ];

      const result = findDuplicateLabels(variants);

      expect(result.hasDuplicates).toBe(false);
      expect(result.duplicateLabels).toEqual([]);
      expect(result.duplicateIndices.size).toBe(0);
    });

    it('should find duplicates with case-insensitive matching', () => {
      const variants = [
        { label: 'Small' },
        { label: 'SMALL' },
        { label: 'small' },
        { label: 'Medium' },
      ];

      const result = findDuplicateLabels(variants);

      expect(result.hasDuplicates).toBe(true);
      expect(result.duplicateLabels).toEqual(['small']);
      expect(result.duplicateIndices.get('small')).toEqual([0, 1, 2]);
    });

    it('should trim whitespace when comparing labels', () => {
      const variants = [
        { label: '  Small  ' },
        { label: 'Small' },
        { label: ' Small ' },
      ];

      const result = findDuplicateLabels(variants);

      expect(result.hasDuplicates).toBe(true);
      expect(result.duplicateLabels).toEqual(['small']);
      expect(result.duplicateIndices.get('small')).toEqual([0, 1, 2]);
    });

    it('should handle empty and undefined labels', () => {
      const variants = [
        { label: '' },
        { label: undefined },
        { label: '   ' }, // Only whitespace
        { label: 'Valid' },
      ];

      const result = findDuplicateLabels(variants);

      expect(result.hasDuplicates).toBe(false);
      expect(result.duplicateLabels).toEqual([]);
      // Empty/undefined labels are not counted
    });

    it('should find multiple sets of duplicates', () => {
      const variants = [
        { label: 'Small' },
        { label: 'Medium' },
        { label: 'small' },
        { label: 'Large' },
        { label: 'medium' },
      ];

      const result = findDuplicateLabels(variants);

      expect(result.hasDuplicates).toBe(true);
      expect(result.duplicateLabels).toContain('small');
      expect(result.duplicateLabels).toContain('medium');
      expect(result.duplicateLabels).toHaveLength(2);
      expect(result.duplicateIndices.get('small')).toEqual([0, 2]);
      expect(result.duplicateIndices.get('medium')).toEqual([1, 4]);
    });

    it('should handle empty array', () => {
      const result = findDuplicateLabels([]);

      expect(result.hasDuplicates).toBe(false);
      expect(result.duplicateLabels).toEqual([]);
      expect(result.duplicateIndices.size).toBe(0);
    });

    it('should handle array with no label property', () => {
      const variants = [
        { label: undefined },
        { label: undefined },
      ] as { label?: string }[];

      const result = findDuplicateLabels(variants);

      expect(result.hasDuplicates).toBe(false);
      expect(result.duplicateLabels).toEqual([]);
    });
  });

  describe('validateUniqueLabel', () => {
    it('should return true for unique label', () => {
      const variants = [
        { label: 'Small' },
        { label: 'Medium' },
        { label: 'Large' },
      ];

      const result = validateUniqueLabel(variants, 1, 'Extra Large');

      expect(result).toBe(true);
    });

    it('should return error message for duplicate label', () => {
      const variants = [
        { label: 'Small' },
        { label: 'Medium' },
        { label: 'Large' },
      ];

      const result = validateUniqueLabel(variants, 1, 'Small');

      expect(result).toBe('Label must be unique');
    });

    it('should ignore the variant at the given index', () => {
      const variants = [
        { label: 'Small' },
        { label: 'Medium' },
        { label: 'Large' },
      ];

      // Validating that index 0 can keep its own label
      const result = validateUniqueLabel(variants, 0, 'Small');

      expect(result).toBe(true);
    });

    it('should handle case-insensitive comparison', () => {
      const variants = [
        { label: 'small' },
        { label: 'Medium' },
      ];

      const result = validateUniqueLabel(variants, 1, 'SMALL');

      expect(result).toBe('Label must be unique');
    });

    it('should trim whitespace when comparing', () => {
      const variants = [
        { label: '  Small  ' },
        { label: 'Medium' },
      ];

      const result = validateUniqueLabel(variants, 1, 'Small');

      expect(result).toBe('Label must be unique');
    });

    it('should return true for empty label', () => {
      const variants = [
        { label: 'Small' },
        { label: 'Medium' },
      ];

      const result = validateUniqueLabel(variants, 1, '');

      expect(result).toBe(true); // Let required validation handle empty values
    });

    it('should return true for whitespace-only label', () => {
      const variants = [
        { label: 'Small' },
        { label: 'Medium' },
      ];

      const result = validateUniqueLabel(variants, 1, '   ');

      expect(result).toBe(true); // Let required validation handle empty values
    });

    it('should handle undefined labels in array', () => {
      const variants = [
        { label: 'Small' },
        { label: undefined },
        { label: 'Large' },
      ];

      const result = validateUniqueLabel(variants, 1, 'Small');

      expect(result).toBe('Label must be unique');
    });

    it('should handle empty variants array', () => {
      const result = validateUniqueLabel([], 0, 'Any Label');

      expect(result).toBe(true);
    });

    it('should handle out-of-bounds index', () => {
      const variants = [
        { label: 'Small' },
        { label: 'Medium' },
      ];

      // Index 5 doesn't exist, but function should still work
      const result = validateUniqueLabel(variants, 5, 'Small');

      expect(result).toBe('Label must be unique');
    });
  });

  describe('edge cases', () => {
    it('should handle very long labels', () => {
      const longLabel = 'A'.repeat(1000);
      const variants = [
        { label: longLabel },
        { label: 'Short' },
        { label: longLabel },
      ];

      const result = findDuplicateLabels(variants);

      expect(result.hasDuplicates).toBe(true);
      expect(result.duplicateLabels).toEqual([longLabel.toLowerCase()]);
    });

    it('should handle special characters in labels', () => {
      const variants = [
        { label: 'Size: S/M' },
        { label: 'Size: S/M' },
        { label: 'Size: L/XL' },
      ];

      const result = findDuplicateLabels(variants);

      expect(result.hasDuplicates).toBe(true);
      expect(result.duplicateLabels).toEqual(['size: s/m']);
    });

    it('should handle unicode characters', () => {
      const variants = [
        { label: 'Größe: Klein' },
        { label: 'Größe: Klein' },
        { label: 'Größe: Groß' },
      ];

      const result = findDuplicateLabels(variants);

      expect(result.hasDuplicates).toBe(true);
      expect(result.duplicateLabels).toEqual(['größe: klein']);
    });
  });
});