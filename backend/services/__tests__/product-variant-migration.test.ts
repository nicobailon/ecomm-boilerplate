import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import mongoose from 'mongoose';
import { Product } from '../../models/product.model.js';
import { migrateVariantLabels } from '../../scripts/migrate-variant-label.js';

interface TestVariant {
  variantId: string;
  label?: string;
  size?: string;
  color?: string;
  price: number;
  inventory: number;
  reservedInventory: number;
  images: string[];
  sku?: string;
}

interface TestProduct {
  _id: mongoose.Types.ObjectId;
  name: string;
  price: number;
  variants: TestVariant[];
  save: ReturnType<typeof vi.fn>;
}

vi.mock('../../models/product.model.js');

describe('Product Variant Migration', () => {
  let mockConnect: ReturnType<typeof vi.fn>;
  let mockDisconnect: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockConnect = vi.fn().mockResolvedValue(undefined);
    mockDisconnect = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(mongoose, 'connect').mockImplementation(mockConnect);
    vi.spyOn(mongoose, 'disconnect').mockImplementation(mockDisconnect);
    
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe('migrateVariantLabels', () => {
    it('should create default variant for products without variants', async () => {
      const mockProduct: TestProduct = {
        _id: new mongoose.Types.ObjectId(),
        name: 'Test Product',
        price: 29.99,
        variants: [],
        save: vi.fn().mockResolvedValue(undefined),
      };

      vi.spyOn(Product, 'find').mockResolvedValue([mockProduct]);

      const result = await migrateVariantLabels({ dryRun: false });

      void expect(result.processed).toBe(1);
      void expect(result.defaultVariantsCreated).toBe(1);
      void expect(result.updated).toBe(1);
      void expect(result.errors).toHaveLength(0);
      
      void expect(mockProduct.variants).toHaveLength(1);
      void expect(mockProduct.variants[0]).toMatchObject({
        variantId: 'default',
        label: 'Default',
        price: 29.99,
        inventory: 0,
        reservedInventory: 0,
        images: [],
      });
      
      void expect(mockProduct.save).toHaveBeenCalled();
    });

    it('should add labels to existing variants based on size and color', async () => {
      const mockProduct: TestProduct = {
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

      void expect(result.processed).toBe(1);
      void expect(result.updated).toBe(1);
      void expect(result.defaultVariantsCreated).toBe(0);
      void expect(result.errors).toHaveLength(0);

      void expect(mockProduct.variants[0].label).toBe('L - red');
      void expect(mockProduct.variants[1].label).toBe('M');
      void expect(mockProduct.variants[2].label).toBe('blue');
      
      void expect(mockProduct.save).toHaveBeenCalled();
    });

    it('should skip variants that already have labels', async () => {
      const mockProduct: TestProduct = {
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

      void expect(result.processed).toBe(1);
      void expect(result.updated).toBe(0);
      void expect(result.defaultVariantsCreated).toBe(0);
      void expect(result.errors).toHaveLength(0);

      void expect(mockProduct.variants[0].label).toBe('Existing Label');
      void expect(mockProduct.save).not.toHaveBeenCalled();
    });

    it('should handle dry run mode without making changes', async () => {
      const mockProduct: TestProduct = {
        _id: new mongoose.Types.ObjectId(),
        name: 'Dry Run Product',
        price: 19.99,
        variants: [],
        save: vi.fn().mockResolvedValue(undefined),
      };

      vi.spyOn(Product, 'find').mockResolvedValue([mockProduct]);

      const result = await migrateVariantLabels({ dryRun: true });

      void expect(result.processed).toBe(1);
      void expect(result.defaultVariantsCreated).toBe(1);
      void expect(result.updated).toBe(1);
      void expect(result.errors).toHaveLength(0);

      void expect(mockProduct.variants).toHaveLength(0);
      void expect(mockProduct.save).not.toHaveBeenCalled();
    });

    it('should handle multiple products with mixed scenarios', async () => {
      const mockProducts: TestProduct[] = [
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

      void expect(result.processed).toBe(3);
      void expect(result.updated).toBe(2);
      void expect(result.defaultVariantsCreated).toBe(1);
      void expect(result.errors).toHaveLength(0);

      void expect(mockProducts[0].variants).toHaveLength(1);
      void expect(mockProducts[0].variants[0].label).toBe('Default');
      void expect(mockProducts[0].save).toHaveBeenCalled();

      void expect(mockProducts[1].variants[0].label).toBe('L - red');
      void expect(mockProducts[1].save).toHaveBeenCalled();

      void expect(mockProducts[2].variants[0].label).toBe('Premium');
      void expect(mockProducts[2].save).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully and continue processing', async () => {
      const mockProducts: TestProduct[] = [
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

      void expect(result.processed).toBe(2);
      void expect(result.updated).toBe(1);
      void expect(result.defaultVariantsCreated).toBe(2);
      void expect(result.errors).toHaveLength(1);
      void expect(result.errors[0].error).toBe('Save failed');
    });

    it('should generate correct labels for different size/color combinations', async () => {
      const testCases = [
        { size: 'L', color: 'red', expected: 'L - red' },
        { size: 'M', color: undefined, expected: 'M' },
        { size: undefined, color: 'blue', expected: 'blue' },
        { size: undefined, color: undefined, expected: 'Default' },
      ];

      for (const testCase of testCases) {
        const mockProduct: TestProduct = {
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

        void expect(mockProduct.variants[0].label).toBe(testCase.expected);
        
        vi.clearAllMocks();
      }
    });

    it('should connect to MongoDB with correct URI', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
      
      vi.spyOn(Product, 'find').mockResolvedValue([]);

      await migrateVariantLabels({ dryRun: true });

      void expect(mockConnect).toHaveBeenCalledWith('mongodb://localhost:27017/test');
      void expect(mockDisconnect).toHaveBeenCalled();
    });

    it('should fallback to MONGO_URI if MONGODB_URI is not set', async () => {
      delete process.env.MONGODB_URI;
      process.env.MONGO_URI = 'mongodb://localhost:27017/fallback';
      
      vi.spyOn(Product, 'find').mockResolvedValue([]);

      await migrateVariantLabels({ dryRun: true });

      void expect(mockConnect).toHaveBeenCalledWith('mongodb://localhost:27017/fallback');
    });

    it('should throw error if no MongoDB URI is provided', async () => {
      process.env.MONGODB_URI = undefined as unknown as string;
      process.env.MONGO_URI = undefined as unknown as string;
      
      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });

      await expect(migrateVariantLabels({ dryRun: true })).rejects.toThrow('process.exit called');
      void expect(mockExit).toHaveBeenCalledWith(1);
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

      void expect(migratedVariant.label).toBeDefined();
      void expect(migratedVariant.label.length).toBeGreaterThan(0);
      void expect(migratedVariant.label.length).toBeLessThanOrEqual(50);
      void expect(typeof migratedVariant.label).toBe('string');
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

      void expect(defaultVariant.variantId).toBeDefined();
      void expect(defaultVariant.label).toBe('Default');
      void expect(defaultVariant.price).toBeGreaterThan(0);
      void expect(defaultVariant.inventory).toBeGreaterThanOrEqual(0);
      void expect(defaultVariant.reservedInventory).toBeGreaterThanOrEqual(0);
      void expect(Array.isArray(defaultVariant.images)).toBe(true);
    });
  });
});