import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import mongoose from 'mongoose';
import { generateVariantLabel } from '../../utils/variantLabel.js';

interface LegacyVariant {
  variantId: string;
  label?: string;
  size?: string;
  color?: string;
  material?: string;
  style?: string;
  finish?: string;
  price: number;
  inventory: number;
  reservedInventory: number;
  images: string[];
  attributes?: Record<string, string>;
}

interface MigrationProduct {
  _id: mongoose.Types.ObjectId;
  name: string;
  variants: LegacyVariant[];
}

vi.mock('../../models/product.model.js');

beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => undefined);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

describe('Variant Attributes Migration', () => {
  describe('generateVariantLabel', () => {
    it('should generate label from size and color', () => {
      const label = generateVariantLabel({ size: 'M', color: '#000000' });
      expect(label).toBe('M / #000000');
    });

    it('should generate label with all priority attributes', () => {
      const label = generateVariantLabel({ 
        size: 'L', 
        color: '#FF0000', 
        material: 'Cotton', 
      });
      expect(label).toBe('L / #FF0000 / Cotton');
    });

    it('should include non-priority attributes after priority ones', () => {
      const label = generateVariantLabel({ 
        size: 'S',
        style: 'Classic',
        color: '#0000FF',
        finish: 'Matte',
      });
      expect(label).toBe('S / #0000FF / Classic / Matte');
    });

    it('should return Default for empty attributes', () => {
      const label = generateVariantLabel({});
      expect(label).toBe('Default');
    });

    it('should handle undefined values', () => {
      const label = generateVariantLabel({ 
        size: 'M',
        color: undefined,
        material: 'Wool', 
      });
      expect(label).toBe('M / Wool');
    });
  });

  describe('Migration Process Simulation', () => {
    function simulateMigration(product: MigrationProduct) {
      const variantTypes = new Set<string>();
      const updatedVariants = product.variants.map((variant: LegacyVariant) => {
        const variantUpdate: LegacyVariant = { ...variant };
        
        variantUpdate.attributes ??= {};

        if (variant.size) {
          variantUpdate.attributes.size = variant.size;
          variantTypes.add('size');
        }
        
        if (variant.color) {
          variantUpdate.attributes.color = variant.color;
          variantTypes.add('color');
        }
        
        // Also check existing attributes for variantTypes
        if (variantUpdate.attributes) {
          Object.keys(variantUpdate.attributes).forEach(key => {
            if (variantUpdate.attributes![key]) {
              variantTypes.add(key);
            }
          });
        }

        if (Object.keys(variantUpdate.attributes).length === 0 && variant.label) {
          const parts = variant.label.split(' / ');
          if (parts.length > 0 && parts[0]) {
            variantUpdate.attributes.size = parts[0];
            variantTypes.add('size');
          }
          if (parts.length > 1 && parts[1]) {
            variantUpdate.attributes.color = parts[1];
            variantTypes.add('color');
          }
          if (parts.length > 2 && parts[2]) {
            variantUpdate.attributes.material = parts[2];
            variantTypes.add('material');
          }
        }

        variantUpdate.label = generateVariantLabel(variantUpdate.attributes);
        return variantUpdate;
      });

      return {
        variants: updatedVariants,
        variantTypes: Array.from(variantTypes),
      };
    }

    it('should migrate legacy size and color to attributes', () => {
      const product = {
        _id: new mongoose.Types.ObjectId(),
        name: 'Test Product',
        variants: [
          {
            variantId: 'v1',
            label: 'M / Black',
            size: 'M',
            color: '#000000',
            price: 99.99,
            inventory: 10,
            reservedInventory: 0,
            images: [],
          },
        ],
      };

      const migrated = simulateMigration(product);
      
      expect(migrated.variants[0].attributes).toEqual({
        size: 'M',
        color: '#000000',
      });
      expect(migrated.variantTypes).toEqual(['size', 'color']);
      expect(migrated.variants[0].label).toBe('M / #000000');
    });

    it('should parse label when attributes are empty', () => {
      const product = {
        _id: new mongoose.Types.ObjectId(),
        name: 'Test Product',
        variants: [
          {
            variantId: 'v1',
            label: 'L / Blue / Cotton',
            price: 99.99,
            inventory: 10,
            reservedInventory: 0,
            images: [],
          },
        ],
      };

      const migrated = simulateMigration(product);
      
      expect(migrated.variants[0].attributes).toEqual({
        size: 'L',
        color: 'Blue',
        material: 'Cotton',
      });
      expect(migrated.variantTypes).toEqual(['size', 'color', 'material']);
    });

    it('should preserve existing attributes', () => {
      const product = {
        _id: new mongoose.Types.ObjectId(),
        name: 'Test Product',
        variants: [
          {
            variantId: 'v1',
            label: 'Custom Label',
            attributes: { size: 'XL', style: 'Premium' },
            price: 149.99,
            inventory: 5,
            reservedInventory: 0,
            images: [],
          },
        ],
      };

      const migrated = simulateMigration(product);
      
      expect(migrated.variants[0].attributes).toEqual({
        size: 'XL',
        style: 'Premium',
      });
      expect(migrated.variantTypes).toEqual(['size', 'style']);
      expect(migrated.variants[0].label).toBe('XL / Premium');
    });

    it('should handle products without variants', () => {
      const product = {
        _id: new mongoose.Types.ObjectId(),
        name: 'Test Product',
        variants: [],
      };

      const migrated = simulateMigration(product);
      
      expect(migrated.variants).toEqual([]);
      expect(migrated.variantTypes).toEqual([]);
    });

    it('should combine legacy fields with parsed label data', () => {
      const product = {
        _id: new mongoose.Types.ObjectId(),
        name: 'Test Product',
        variants: [
          {
            variantId: 'v1',
            label: 'S / Red / Silk',
            size: 'S',
            price: 199.99,
            inventory: 3,
            reservedInventory: 0,
            images: [],
          },
        ],
      };

      const migrated = simulateMigration(product);
      
      expect(migrated.variants[0].attributes).toEqual({
        size: 'S',
      });
      expect(migrated.variantTypes).toEqual(['size']);
      expect(migrated.variants[0].label).toBe('S');
    });
  });
});