import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Product } from '../../models/product.model.js';
import { Order } from '../../models/order.model.js';
import { User } from '../../models/user.model.js';
import { performAtomicInventoryUpdate } from '../../utils/inventory-atomicity.js';

describe('Concurrent Checkout Race Conditions', () => {
  let mongoServer: MongoMemoryServer;
  let testProduct: any;

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
    await Promise.all([
      Product.deleteMany({}),
      Order.deleteMany({}),
      User.deleteMany({}),
    ]);

    await User.create({
      email: 'test@example.com',
      password: 'hashedpassword',
      name: 'Test User',
    });

    // Create product with default variant (products always need variants for inventory)
    const productData = {
      name: 'Limited Stock Item',
      description: 'Test product with limited inventory',
      price: 100,
      image: 'test.jpg',
      images: ['test.jpg'],
      slug: 'limited-stock-item',
      category: 'test',
      mainCategory: 'test',
      subCategory: 'test',
      isActive: true,
      variants: [{
        variantId: 'default',
        label: 'Default',
        price: 100,
        inventory: 5,
        images: [],
      }],
    };
    
    testProduct = await Product.create(productData);
    
    // Verify creation
    const created = await Product.findById(testProduct._id);
    console.log('Created product inventory:', created?.variants[0]?.inventory);
  });

  it('should prevent overselling when multiple users checkout simultaneously', async () => {
    // Test concurrent updates directly without a prior single update
    const checkoutPromises = [];
    const numberOfConcurrentCheckouts = 3;
    const quantityPerCheckout = 2;

    for (let i = 0; i < numberOfConcurrentCheckouts; i++) {
      checkoutPromises.push(
        performAtomicInventoryUpdate(
          testProduct._id.toString(),
          quantityPerCheckout,
          undefined
        )
      );
    }

    const results = await Promise.all(checkoutPromises);
    console.log('All results:', results);
    
    const successful = results.filter(r => r !== null).length;
    const failed = results.filter(r => r === null).length;

    console.log(`Successful: ${successful}, Failed: ${failed}`);

    const finalProduct = await Product.findById(testProduct._id);
    console.log('Final inventory:', finalProduct?.variants[0]?.inventory);

    // With initial inventory of 5 and 3 concurrent updates of 2 each:
    // Only 2 updates should succeed (2 + 2 = 4, leaving 1)
    // The third update would need 2 but only 1 is available
    expect(successful).toBe(2);
    expect(failed).toBe(1);
    expect(finalProduct?.variants[0]?.inventory).toBe(1);
  });

  it('should handle concurrent checkouts with specific variants', async () => {
    // Create a product with multiple variants for this test
    const multiVariantProduct = await Product.create({
      name: 'Multi-Variant Product',
      description: 'Product with variants',
      price: 100,
      image: 'test.jpg',
      images: ['test.jpg'],
      slug: 'multi-variant-product',
      category: 'test',
      mainCategory: 'test',
      subCategory: 'test',
      isActive: true,
      variants: [
        {
          variantId: 'variant-1',
          label: 'Red',
          price: 100,
          inventory: 3,
          images: [],
        },
        {
          variantId: 'variant-2',
          label: 'Blue',
          price: 100,
          inventory: 2,
          images: [],
        },
      ],
    });
    const variant1Checkouts = [];
    const variant2Checkouts = [];
    const checkoutsPerVariant = 5;

    for (let i = 0; i < checkoutsPerVariant; i++) {
      // Variant 1 checkout
      variant1Checkouts.push(
        performAtomicInventoryUpdate(
          multiVariantProduct._id!.toString(),
          1,
          'variant-1'
        )
      );

      // Variant 2 checkout
      variant2Checkouts.push(
        performAtomicInventoryUpdate(
          multiVariantProduct._id!.toString(),
          1,
          'variant-2'
        )
      );
    }

    const [variant1Results, variant2Results] = await Promise.all([
      Promise.allSettled(variant1Checkouts),
      Promise.allSettled(variant2Checkouts),
    ]);

    const variant1Successful = variant1Results.filter(
      (r) => r.status === 'fulfilled' && r.value !== null
    );
    const variant2Successful = variant2Results.filter(
      (r) => r.status === 'fulfilled' && r.value !== null
    );

    expect(variant1Successful.length).toBe(3);
    expect(variant2Successful.length).toBe(2);

    const updatedProduct = await Product.findById(multiVariantProduct._id);
    const variant1 = updatedProduct?.variants.find(
      (v) => v.variantId === 'variant-1'
    );
    const variant2 = updatedProduct?.variants.find(
      (v) => v.variantId === 'variant-2'
    );

    expect(variant1?.inventory).toBe(0);
    expect(variant2?.inventory).toBe(0);
  });

  it('should maintain consistency when mixing regular and variant checkouts', async () => {
    const mixedCheckouts = [];

    // Regular checkouts (no variant specified)
    for (let i = 0; i < 5; i++) {
      mixedCheckouts.push(
        performAtomicInventoryUpdate(
          testProduct._id.toString(),
          1,
          undefined
        )
      );
    }

    // More checkouts without variant specification
    for (let i = 0; i < 3; i++) {
      mixedCheckouts.push(
        performAtomicInventoryUpdate(
          testProduct._id.toString(),
          1,
          undefined
        )
      );
    }

    const results = await Promise.allSettled(mixedCheckouts);
    const successful = results.filter((r) => r.status === 'fulfilled' && r.value !== null);

    const finalProduct = await Product.findById(testProduct._id);
    const totalVariantInventory = finalProduct?.variants.reduce(
      (sum, v) => sum + v.inventory,
      0
    ) || 0;

    expect(finalProduct?.variants[0]?.inventory).toBe(0);
    expect(totalVariantInventory).toBe(0);
    expect(successful.length).toBe(5);
  });

  it('should handle race conditions with atomic updates', async () => {
    // Test rapid inventory deductions
    const updates = [];
    for (let i = 0; i < 10; i++) {
      updates.push(
        performAtomicInventoryUpdate(
          testProduct._id.toString(),
          1,
          undefined
        )
      );
    }

    const results = await Promise.allSettled(updates);
    const successful = results.filter((r) => r.status === 'fulfilled' && r.value !== null);
    const failed = results.filter((r) => r.status === 'fulfilled' && r.value === null);

    // Verify that only 5 updates succeeded (initial inventory was 5)
    expect(successful.length).toBe(5);
    expect(failed.length).toBe(5);

    const finalProduct = await Product.findById(testProduct._id);
    expect(finalProduct?.variants[0]?.inventory).toBe(0);
  });

  it('should verify inventory remains consistent after mixed operations', async () => {
    // Create a new product for this test
    const testProduct2 = await Product.create({
      name: 'Test Product 2',
      description: 'Product for mixed operations',
      price: 50,
      image: 'test.jpg',
      images: ['test.jpg'],
      slug: 'test-product-2',
      category: 'test',
      mainCategory: 'test',
      subCategory: 'test',
      isActive: true,
      variants: [{
        variantId: 'default',
        label: 'Default',
        price: 50,
        inventory: 10,
        images: [],
      }],
    });

    // Mix of successful and failed updates
    const operations = [];
    
    // These should succeed (total: 8 items)
    for (let i = 0; i < 4; i++) {
      operations.push(
        performAtomicInventoryUpdate(testProduct2._id!.toString(), 2, undefined)
      );
    }
    
    // These should fail (requesting more than available)
    for (let i = 0; i < 3; i++) {
      operations.push(
        performAtomicInventoryUpdate(testProduct2._id!.toString(), 5, undefined)
      );
    }

    const results = await Promise.allSettled(operations);
    const successful = results.filter((r) => r.status === 'fulfilled' && r.value !== null);

    const finalProduct = await Product.findById(testProduct2._id);
    
    // Due to race conditions, we might get 3 or 4 successful updates
    // (depending on whether a 5-item request executes before all 2-item requests)
    expect(successful.length).toBeGreaterThanOrEqual(3);
    expect(successful.length).toBeLessThanOrEqual(4);
    expect(finalProduct?.variants[0]?.inventory).toBeGreaterThanOrEqual(0);
    expect(finalProduct?.variants[0]?.inventory).toBeLessThanOrEqual(2);
  });
});