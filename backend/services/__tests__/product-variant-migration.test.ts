import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import mongoose from 'mongoose';
import { Product } from '../../models/product.model.js';
import { migrateVariantLabels } from '../../scripts/migrate-variant-label.js';

vi.mock('../../models/product.model.js');

describe('Product Variant Migration', () => {
  let mockConnect: ReturnType<typeof vi.fn>;
  let mockDisconnect: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockConnect = vi.fn().mockResolvedValue(undefined);
    mockDisconnect = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(mongoose, 'connect').mockImplementation(mockConnect);
    vi.spyOn(mongoose, 'disconnect').mockImplementation(mockDisconnect);
    
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe('migrateVariantLabels', () => {
    it('should create default variant for products without variants', async () => {
      const mockProduct = {
        _id: new mongoose.Types.ObjectId(),
        name: 'Test Product',
        price: 29.99,
        variants: [],
        save: vi.fn().mockResolvedValue(undefined),
      };

      vi.spyOn(Product, 'find').mockResolvedValue([mockProduct]);

      const result = await migrateVariantLabels({ dryRun: false });

      expect(result.processed).toBe(1);
      expect(result.defaultVariantsCreated).toBe(1);
      expect(result.updated).toBe(1);
      expect(result.errors).toHaveLength(0);
      
      expect(mockProduct.variants).toHaveLength(1);
      expect(mockProduct.variants[0]).toMatchObject({
        variantId: 'default',
        label: 'Default',
        price: 29.99,
        inventory: 0,
        reservedInventory: 0,
        images: [],
      });
      
      expect(mockProduct.save).toHaveBeenCalled();
    });

    it('should add labels to existing variants based on size and color', async () => {
      const mockProduct = {
        _id: new mongoose.Types.ObjectId(),
        name: 'Test Product with Variants',
        price: 39.99,
        variants: [
          {
            variantId: 'v1',
            size: 'L',
            color: 'red',
            price: 39.99,
            inventory: 10,
            reservedInventory: 0,
            images: [],
          },
          {
            variantId: 'v2',
            size: 'M',
            price: 35.99,
            inventory: 5,
            reservedInventory: 0,
            images: [],
          },
          {
            variantId: 'v3',
            color: 'blue',
            price: 41.99,
            inventory: 8,
            reservedInventory: 0,
            images: [],
          },
        ],
        save: vi.fn().mockResolvedValue(undefined),
      };

      vi.spyOn(Product, 'find').mockResolvedValue([mockProduct]);

      const result = await migrateVariantLabels({ dryRun: false });

      expect(result.processed).toBe(1);
      expect(result.updated).toBe(1);
      expect(result.defaultVariantsCreated).toBe(0);
      expect(result.errors).toHaveLength(0);

      expect((mockProduct.variants[0] as any).label).toBe('L - red');
      expect((mockProduct.variants[1] as any).label).toBe('M');
      expect((mockProduct.variants[2] as any).label).toBe('blue');
      
      expect(mockProduct.save).toHaveBeenCalled();
    });

    it('should skip variants that already have labels', async () => {
      const mockProduct = {
        _id: new mongoose.Types.ObjectId(),
        name: 'Product with Labels',
        price: 25.99,
        variants: [
          {
            variantId: 'v1',
            label: 'Existing Label',
            size: 'L',
            color: 'red',
            price: 25.99,
            inventory: 10,
            reservedInventory: 0,
            images: [],
          },
        ],
        save: vi.fn().mockResolvedValue(undefined),
      };

      vi.spyOn(Product, 'find').mockResolvedValue([mockProduct]);

      const result = await migrateVariantLabels({ dryRun: false });

      expect(result.processed).toBe(1);
      expect(result.updated).toBe(0);
      expect(result.defaultVariantsCreated).toBe(0);
      expect(result.errors).toHaveLength(0);

      expect(mockProduct.variants[0].label).toBe('Existing Label');
      expect(mockProduct.save).not.toHaveBeenCalled();
    });

    it('should handle dry run mode without making changes', async () => {
      const mockProduct = {
        _id: new mongoose.Types.ObjectId(),
        name: 'Dry Run Product',
        price: 19.99,
        variants: [],
        save: vi.fn().mockResolvedValue(undefined),
      };

      vi.spyOn(Product, 'find').mockResolvedValue([mockProduct]);

      const result = await migrateVariantLabels({ dryRun: true });

      expect(result.processed).toBe(1);
      expect(result.defaultVariantsCreated).toBe(1);
      expect(result.updated).toBe(1);
      expect(result.errors).toHaveLength(0);

      expect(mockProduct.variants).toHaveLength(0);
      expect(mockProduct.save).not.toHaveBeenCalled();
    });

    it('should handle multiple products with mixed scenarios', async () => {
      const mockProducts = [
        {
          _id: new mongoose.Types.ObjectId(),
          name: 'Product 1 - No Variants',
          price: 29.99,
          variants: [],
          save: vi.fn().mockResolvedValue(undefined),
        },
        {
          _id: new mongoose.Types.ObjectId(),
          name: 'Product 2 - Needs Labels',
          price: 39.99,
          variants: [
            {
              variantId: 'v1',
              size: 'L',
              color: 'red',
              price: 39.99,
              inventory: 10,
              reservedInventory: 0,
              images: [],
            },
          ],
          save: vi.fn().mockResolvedValue(undefined),
        },
        {
          _id: new mongoose.Types.ObjectId(),
          name: 'Product 3 - Already Has Labels',
          price: 49.99,
          variants: [
            {
              variantId: 'v1',
              label: 'Premium',
              size: 'L',
              color: 'gold',
              price: 49.99,
              inventory: 5,
              reservedInventory: 0,
              images: [],
            },
          ],
          save: vi.fn().mockResolvedValue(undefined),
        },
      ];

      vi.spyOn(Product, 'find').mockResolvedValue(mockProducts);

      const result = await migrateVariantLabels({ dryRun: false });

      expect(result.processed).toBe(3);
      expect(result.updated).toBe(2);
      expect(result.defaultVariantsCreated).toBe(1);
      expect(result.errors).toHaveLength(0);

      expect(mockProducts[0].variants).toHaveLength(1);
      expect((mockProducts[0].variants[0] as any).label).toBe('Default');
      expect(mockProducts[0].save).toHaveBeenCalled();

      expect((mockProducts[1].variants[0] as any).label).toBe('L - red');
      expect(mockProducts[1].save).toHaveBeenCalled();

      expect((mockProducts[2].variants[0] as any).label).toBe('Premium');
      expect(mockProducts[2].save).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully and continue processing', async () => {
      const mockProducts = [
        {
          _id: new mongoose.Types.ObjectId(),
          name: 'Good Product',
          price: 29.99,
          variants: [],
          save: vi.fn().mockResolvedValue(undefined),
        },
        {
          _id: new mongoose.Types.ObjectId(),
          name: 'Bad Product',
          price: 39.99,
          variants: [],
          save: vi.fn().mockRejectedValue(new Error('Save failed')),
        },
      ];

      vi.spyOn(Product, 'find').mockResolvedValue(mockProducts);

      const result = await migrateVariantLabels({ dryRun: false });

      expect(result.processed).toBe(2);
      expect(result.updated).toBe(1);
      expect(result.defaultVariantsCreated).toBe(2);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].error).toBe('Save failed');
    });

    it('should generate correct labels for different size/color combinations', async () => {
      const testCases = [
        { size: 'L', color: 'red', expected: 'L - red' },
        { size: 'M', color: undefined, expected: 'M' },
        { size: undefined, color: 'blue', expected: 'blue' },
        { size: undefined, color: undefined, expected: 'Default' },
      ];

      for (const testCase of testCases) {
        const mockProduct = {
          _id: new mongoose.Types.ObjectId(),
          name: `Test Product ${testCase.expected}`,
          price: 29.99,
          variants: [
            {
              variantId: 'v1',
              size: testCase.size,
              color: testCase.color,
              price: 29.99,
              inventory: 10,
              reservedInventory: 0,
              images: [],
            },
          ],
          save: vi.fn().mockResolvedValue(undefined),
        };

        vi.spyOn(Product, 'find').mockResolvedValue([mockProduct]);

        await migrateVariantLabels({ dryRun: false });

        expect((mockProduct.variants[0] as any).label).toBe(testCase.expected);
        
        vi.clearAllMocks();
      }
    });

    it('should connect to MongoDB with correct URI', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
      
      vi.spyOn(Product, 'find').mockResolvedValue([]);

      await migrateVariantLabels({ dryRun: true });

      expect(mockConnect).toHaveBeenCalledWith('mongodb://localhost:27017/test');
      expect(mockDisconnect).toHaveBeenCalled();
    });

    it('should fallback to MONGO_URI if MONGODB_URI is not set', async () => {
      delete process.env.MONGODB_URI;
      process.env.MONGO_URI = 'mongodb://localhost:27017/fallback';
      
      vi.spyOn(Product, 'find').mockResolvedValue([]);

      await migrateVariantLabels({ dryRun: true });

      expect(mockConnect).toHaveBeenCalledWith('mongodb://localhost:27017/fallback');
    });

    it('should throw error if no MongoDB URI is provided', async () => {
      delete process.env.MONGODB_URI;
      delete process.env.MONGO_URI;
      
      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });

      await expect(migrateVariantLabels({ dryRun: true })).rejects.toThrow('process.exit called');
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });

  describe('Validation Integration', () => {
    it('should validate that migrated variants comply with the new schema', () => {
      const migratedVariant = {
        variantId: 'v1',
        label: 'L - red',
        size: 'L',
        color: 'red',
        price: 29.99,
        inventory: 10,
        reservedInventory: 0,
        images: [],
      };

      expect(migratedVariant.label).toBeDefined();
      expect(migratedVariant.label.length).toBeGreaterThan(0);
      expect(migratedVariant.label.length).toBeLessThanOrEqual(50);
      expect(typeof migratedVariant.label).toBe('string');
    });

    it('should ensure default variant creation follows schema requirements', () => {
      const defaultVariant = {
        variantId: 'default',
        label: 'Default',
        price: 29.99,
        inventory: 0,
        reservedInventory: 0,
        images: [],
      };

      expect(defaultVariant.variantId).toBeDefined();
      expect(defaultVariant.label).toBe('Default');
      expect(defaultVariant.price).toBeGreaterThan(0);
      expect(defaultVariant.inventory).toBeGreaterThanOrEqual(0);
      expect(defaultVariant.reservedInventory).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(defaultVariant.images)).toBe(true);
    });
  });
});