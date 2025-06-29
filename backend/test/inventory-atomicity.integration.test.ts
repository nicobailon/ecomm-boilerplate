import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose, { Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Product } from '../models/product.model.js';
import {
  buildAtomicUpdateFilter,
  performAtomicInventoryUpdate,
  validateInventoryAvailability,
} from '../utils/inventory-atomicity.js';
import type { IProductDocument } from '../models/product.model.js';

describe('Inventory Atomicity Integration Tests', () => {
  let mongoServer: MongoMemoryServer;
  let testProduct: IProductDocument;
  let multiVariantProduct: IProductDocument;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await Product.deleteMany({});

    testProduct = await Product.create({
      name: 'Single Product',
      description: 'Test product',
      price: 100,
      image: 'test.jpg',
      images: ['test.jpg'],
      slug: 'single-product',
      category: 'test',
      mainCategory: 'test',
      subCategory: 'test',
      isActive: true,
      variants: [{
        variantId: 'default',
        label: 'Default',
        price: 100,
        inventory: 10,
        images: [],
      }],
    });

    multiVariantProduct = await Product.create({
      name: 'Multi-Variant Product',
      description: 'Product with variants',
      price: 150,
      image: 'test.jpg',
      images: ['test.jpg'],
      slug: 'multi-variant-product',
      category: 'test',
      mainCategory: 'test',
      subCategory: 'test',
      isActive: true,
      variants: [
        {
          variantId: 'var-1',
          name: 'Red',
          label: 'Color',
          price: 150,
          inventory: 8,
          attributes: { color: 'red' },
        },
        {
          variantId: 'var-2',
          name: 'Blue',
          label: 'Color',
          price: 160,
          inventory: 12,
          attributes: { color: 'blue' },
        },
      ],
    });
  });

  describe('buildAtomicUpdateFilter', () => {
    it('should build correct filter for simple product', () => {
      const filter = buildAtomicUpdateFilter(
        testProduct._id!.toString(),
        5,
        undefined,
      );

      expect((filter._id as any).toString()).toBe(testProduct._id!.toString());
      expect(filter.isDeleted).toEqual({ $ne: true });
      expect(filter['variants.0.inventory']).toEqual({ $gte: 5 });
    });

    it('should build correct filter for specific variant', () => {
      const filter = buildAtomicUpdateFilter(
        multiVariantProduct._id!.toString(),
        3,
        'var-1',
      );

      expect((filter._id as any).toString()).toBe(multiVariantProduct._id!.toString());
      expect(filter.isDeleted).toEqual({ $ne: true });
      expect(filter.variants).toEqual({
        $elemMatch: {
          variantId: 'var-1',
          inventory: { $gte: 3 },
        },
      });
    });

    it('should handle product without variantId but with variants', () => {
      const filter = buildAtomicUpdateFilter(
        multiVariantProduct._id!.toString(),
        5,
        undefined,
      );

      expect((filter._id as any).toString()).toBe(multiVariantProduct._id!.toString());
      expect(filter.isDeleted).toEqual({ $ne: true });
      expect(filter['variants.0.inventory']).toEqual({ $gte: 5 });
    });
  });

  describe('performAtomicInventoryUpdate', () => {
    it('should atomically update simple product inventory', async () => {
      const result = await performAtomicInventoryUpdate(
        testProduct._id!.toString(),
        5,
        undefined,
      );

      expect(result).toBeTruthy();
      const defaultVariant = result?.variants.find((v: { variantId: string }) => v.variantId === 'default');
      expect(defaultVariant?.inventory).toBe(5);

      const updated = await Product.findById(testProduct._id!);
      const updatedDefaultVariant = updated?.variants.find(v => v.variantId === 'default');
      expect(updatedDefaultVariant?.inventory).toBe(5);
    });

    it('should fail when insufficient inventory', async () => {
      const result = await performAtomicInventoryUpdate(
        testProduct._id!.toString(),
        15,
        undefined,
      );

      expect(result).toBeNull();

      const unchanged = await Product.findById(testProduct._id!);
      const unchangedDefaultVariant = unchanged?.variants.find(v => v.variantId === 'default');
      expect(unchangedDefaultVariant?.inventory).toBe(10);
    });

    it('should atomically update variant inventory', async () => {
      const result = await performAtomicInventoryUpdate(
        multiVariantProduct._id!.toString(),
        3,
        'var-1',
      );

      expect(result).toBeTruthy();
      const variant = result?.variants.find((v: { variantId: string }) => v.variantId === 'var-1');
      expect(variant?.inventory).toBe(5);

      const updated = await Product.findById(multiVariantProduct._id!);
      const updatedVariant = updated?.variants.find(
        (v: { variantId: string }) => v.variantId === 'var-1',
      );
      expect(updatedVariant?.inventory).toBe(5);
    });

    it('should handle concurrent updates correctly', async () => {
      const updates = [];
      for (let i = 0; i < 5; i++) {
        updates.push(
          performAtomicInventoryUpdate(testProduct._id!.toString(), 3, undefined),
        );
      }

      const results = await Promise.all(updates);
      const successfulUpdates = results.filter((r) => r !== null);

      expect(successfulUpdates.length).toBe(3);

      const final = await Product.findById(testProduct._id!);
      const finalDefaultVariant = final?.variants.find(v => v.variantId === 'default');
      expect(finalDefaultVariant?.inventory).toBe(1);
    });
  });

  describe('validateInventoryAvailability', () => {
    it('should validate multiple products in batch', async () => {
      const items = [
        {
          productId: testProduct._id!.toString(),
          quantity: 5,
        },
        {
          productId: multiVariantProduct._id!.toString(),
          quantity: 3,
          variantId: 'var-1',
        },
      ];

      const results = await validateInventoryAvailability(items);

      expect(results).toHaveLength(2);
      expect(results.every((r) => r.hasStock)).toBe(true);
      expect(results[0].availableStock).toBe(10);
      expect(results[1].availableStock).toBe(8);
    });

    it('should identify insufficient stock', async () => {
      const items = [
        {
          productId: testProduct._id!.toString(),
          quantity: 15,
        },
        {
          productId: multiVariantProduct._id!.toString(),
          quantity: 10,
          variantId: 'var-1',
        },
      ];

      const results = await validateInventoryAvailability(items);

      expect(results[0].hasStock).toBe(false);
      expect(results[0].availableStock).toBe(10);
      expect(results[1].hasStock).toBe(false);
      expect(results[1].availableStock).toBe(8);
    });

    it('should handle non-existent products', async () => {
      const items = [
        {
          productId: new Types.ObjectId().toString(),
          quantity: 1,
        },
      ];

      const results = await validateInventoryAvailability(items);

      expect(results[0].hasStock).toBe(false);
      expect(results[0].availableStock).toBe(0);
      expect(results[0].productName).toBeUndefined();
    });

    it('should validate total inventory for product without specific variant', async () => {
      const items = [
        {
          productId: multiVariantProduct._id!.toString(),
          quantity: 15,
        },
      ];

      const results = await validateInventoryAvailability(items);

      expect(results[0].hasStock).toBe(true);
      expect(results[0].availableStock).toBe(20);
    });
  });

  describe('Race condition prevention', () => {
    it('should prevent double-spending with rapid requests', async () => {
      const rapidUpdates = [];
      const updateCount = 20;
      const quantityPerUpdate = 1;

      for (let i = 0; i < updateCount; i++) {
        rapidUpdates.push(
          performAtomicInventoryUpdate(
            testProduct._id!.toString(),
            quantityPerUpdate,
            undefined,
          ),
        );
      }

      const results = await Promise.all(rapidUpdates);
      const successful = results.filter((r) => r !== null);

      expect(successful.length).toBe(10);

      const final = await Product.findById(testProduct._id!);
      const finalDefaultVariant = final?.variants.find(v => v.variantId === 'default');
      expect(finalDefaultVariant?.inventory).toBe(0);
    });

    it('should maintain variant isolation during concurrent updates', async () => {
      const var1Updates = [];
      const var2Updates = [];

      for (let i = 0; i < 10; i++) {
        var1Updates.push(
          performAtomicInventoryUpdate(
            multiVariantProduct._id!.toString(),
            1,
            'var-1',
          ),
        );
        var2Updates.push(
          performAtomicInventoryUpdate(
            multiVariantProduct._id!.toString(),
            1,
            'var-2',
          ),
        );
      }

      const [var1Results, var2Results] = await Promise.all([
        Promise.all(var1Updates),
        Promise.all(var2Updates),
      ]);

      const var1Successful = var1Results.filter((r) => r !== null);
      const var2Successful = var2Results.filter((r) => r !== null);

      expect(var1Successful.length).toBe(8);
      expect(var2Successful.length).toBe(10);

      const final = await Product.findById(multiVariantProduct._id!);
      const finalVar1 = final?.variants.find((v: { variantId: string }) => v.variantId === 'var-1');
      const finalVar2 = final?.variants.find((v: { variantId: string }) => v.variantId === 'var-2');

      expect(finalVar1?.inventory).toBe(0);
      expect(finalVar2?.inventory).toBe(2);
    });
  });
});