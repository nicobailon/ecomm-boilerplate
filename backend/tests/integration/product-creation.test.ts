import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { appRouter } from '../../trpc/routers/app.router.js';
import { createTestContext } from '../helpers/test-context.js';
import { Product } from '../../models/product.model.js';
import { User, IUserDocument } from '../../models/user.model.js';
import { Collection, ICollection } from '../../models/collection.model.js';
import type { IProductWithVariants } from '../../types/product.types.js';
import { z } from 'zod';
import { baseProductSchema } from '../../validations/product.validation.js';

// Define the input type based on the router's actual input schema
type ProductCreateInput = z.infer<typeof baseProductSchema> & {
  collectionId?: string;
  collectionName?: string;
};

describe('Product Creation Integration Tests', () => {
  let mongoServer: MongoMemoryServer;
  let adminUser: IUserDocument;
  let regularUser: IUserDocument;
  let testCollection: ICollection;

  beforeAll(async () => {
    // Setup in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear all collections
    await Product.deleteMany({});
    await User.deleteMany({});
    await Collection.deleteMany({});

    // Create test users
    adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@test.com',
      password: 'hashedpassword',
      role: 'admin',
    });

    regularUser = await User.create({
      name: 'Regular User',
      email: 'user@test.com',
      password: 'hashedpassword',
      role: 'customer',
    });

    // Create test collection
    testCollection = await Collection.create({
      name: 'Test Collection',
      slug: 'test-collection',
      description: 'Test collection for integration tests',
      owner: adminUser._id,
      products: [],
      isPublic: true,
    });
  });

  afterEach(async () => {
    // Clean up after each test
    await Product.deleteMany({});
    await User.deleteMany({});
    await Collection.deleteMany({});
  });

  describe('Successful Product Creation', () => {
    it('should create a product with all required fields', async () => {
      const productData: ProductCreateInput = {
        name: 'Test Product',
        description: 'A test product for integration testing',
        price: 29.99,
        image: 'https://example.com/test-image.jpg',
        isFeatured: false,
        mediaGallery: [],
        variants: [],
        relatedProducts: [],
      };

      const ctx = await createTestContext(adminUser);

      const caller = appRouter.createCaller(ctx);
      const result = await caller.product.create(productData);

      expect(result.product).toBeDefined();
      expect(result.product.name).toBe(productData.name);
      expect(result.product.description).toBe(productData.description);
      expect(result.product.price).toBe(productData.price);
      expect(result.product.slug).toBe('test-product');
      expect((result.product as IProductWithVariants).mediaGallery).toEqual([]);
      expect(result.created.product).toBe(true);
      expect(result.created.collection).toBe(false);

      // Verify product was saved to database
      const savedProduct = await Product.findById(result.product._id);
      expect(savedProduct).toBeDefined();
      expect(savedProduct!.name).toBe(productData.name);
    });

    it('should create a product with existing collection', async () => {
      const productData: ProductCreateInput = {
        name: 'Product with Collection',
        description: 'A test product with an existing collection',
        price: 49.99,
        image: 'https://example.com/test-image.jpg',
        collectionId: (testCollection._id as mongoose.Types.ObjectId).toString(),
        isFeatured: false,
        mediaGallery: [],
        variants: [],
        relatedProducts: [],
      };

      const ctx = await createTestContext(adminUser);

      const caller = appRouter.createCaller(ctx);
      const result = await caller.product.create(productData);

      expect(result.product.collectionId).toBe((testCollection._id as mongoose.Types.ObjectId).toString());
      expect(result.created.collection).toBe(false);

      // Verify collection was updated with product
      const updatedCollection = await Collection.findById(testCollection._id as mongoose.Types.ObjectId);
      expect(updatedCollection!.products).toContain(result.product._id);
    });

    it('should create a product with new collection', async () => {
      const productData: ProductCreateInput = {
        name: 'Product with New Collection',
        description: 'A test product with a new collection',
        price: 39.99,
        image: 'https://example.com/test-image.jpg',
        collectionName: 'Brand New Collection',
        isFeatured: false,
        mediaGallery: [],
        variants: [],
        relatedProducts: [],
      };

      const ctx = await createTestContext(adminUser);

      const caller = appRouter.createCaller(ctx);
      const result = await caller.product.create(productData);

      expect(result.collection).toBeDefined();
      expect(result.collection!.name).toBe('Brand New Collection');
      expect(result.collection!.slug).toBe('brand-new-collection');
      expect(result.created.collection).toBe(true);

      // Verify new collection was created
      const newCollection = await Collection.findById(result.collection!._id);
      expect(newCollection).toBeDefined();
      expect(newCollection!.products).toContain(result.product._id);
    });

    it('should generate unique slug for duplicate names', async () => {
      // Create first product
      const productData1: ProductCreateInput = {
        name: 'Duplicate Name Product',
        description: 'First product with this name',
        price: 29.99,
        image: 'https://example.com/test-image1.jpg',
        isFeatured: false,
        mediaGallery: [],
        variants: [],
        relatedProducts: [],
      };

      const ctx = await createTestContext(adminUser);

      const caller = appRouter.createCaller(ctx);
      const result1 = await caller.product.create(productData1);

      // Create second product with same name
      const productData2: ProductCreateInput = {
        name: 'Duplicate Name Product',
        description: 'Second product with this name',
        price: 39.99,
        image: 'https://example.com/test-image2.jpg',
        isFeatured: false,
        mediaGallery: [],
        variants: [],
        relatedProducts: [],
      };

      const result2 = await caller.product.create(productData2);

      expect(result1.product.slug).toBe('duplicate-name-product');
      expect(result2.product.slug).toBe('duplicate-name-product-1');
      expect(result1.product.slug).not.toBe(result2.product.slug);
    });
  });

  describe('Validation Errors', () => {
    it('should reject product creation with missing name', async () => {
      const productData = {
        description: 'A test product without a name',
        price: 29.99,
        image: 'https://example.com/test-image.jpg',
        isFeatured: false,
        mediaGallery: [],
        variants: [],
        relatedProducts: [],
      } as unknown as ProductCreateInput;

      const ctx = await createTestContext(adminUser);

      const caller = appRouter.createCaller(ctx);

      await expect(caller.product.create(productData)).rejects.toThrow();
    });

    it('should reject product creation with empty name', async () => {
      const productData: ProductCreateInput = {
        name: '',
        description: 'A test product with empty name',
        price: 29.99,
        image: 'https://example.com/test-image.jpg',
        isFeatured: false,
        mediaGallery: [],
        variants: [],
        relatedProducts: [],
      };

      const ctx = await createTestContext(adminUser);

      const caller = appRouter.createCaller(ctx);

      await expect(caller.product.create(productData)).rejects.toThrow();
    });

    it('should reject product creation with invalid price', async () => {
      const productData: ProductCreateInput = {
        name: 'Invalid Price Product',
        description: 'A test product with invalid price',
        price: -10,
        image: 'https://example.com/test-image.jpg',
        isFeatured: false,
        mediaGallery: [],
        variants: [],
        relatedProducts: [],
      };

      const ctx = await createTestContext(adminUser);

      const caller = appRouter.createCaller(ctx);

      await expect(caller.product.create(productData)).rejects.toThrow();
    });

    it('should reject product creation with invalid image URL', async () => {
      const productData: ProductCreateInput = {
        name: 'Invalid Image Product',
        description: 'A test product with invalid image URL',
        price: 29.99,
        image: 'not-a-valid-url',
        isFeatured: false,
        mediaGallery: [],
        variants: [],
        relatedProducts: [],
      };

      const ctx = await createTestContext(adminUser);

      const caller = appRouter.createCaller(ctx);

      await expect(caller.product.create(productData)).rejects.toThrow();
    });
  });

  describe('Authorization Tests', () => {
    it('should reject product creation for non-admin users', async () => {
      const productData: ProductCreateInput = {
        name: 'Unauthorized Product',
        description: 'A test product created by non-admin',
        price: 29.99,
        image: 'https://example.com/test-image.jpg',
        isFeatured: false,
        mediaGallery: [],
        variants: [],
        relatedProducts: [],
      };

      const ctx = await createTestContext(regularUser); // Non-admin user

      const caller = appRouter.createCaller(ctx);

      await expect(caller.product.create(productData)).rejects.toThrow();
    });

    it('should reject product creation for unauthenticated users', async () => {
      const productData: ProductCreateInput = {
        name: 'Unauthenticated Product',
        description: 'A test product created without authentication',
        price: 29.99,
        image: 'https://example.com/test-image.jpg',
        isFeatured: false,
        mediaGallery: [],
        variants: [],
        relatedProducts: [],
      };

      const ctx = await createTestContext(null);
      // No user set (unauthenticated)

      const caller = appRouter.createCaller(ctx);

      await expect(caller.product.create(productData)).rejects.toThrow();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle mediaGallery with maximum items', async () => {
      const mediaGallery = Array.from({ length: 6 }, (_, i) => ({
        id: `media-${i}`,
        type: 'image' as const,
        url: `https://example.com/image-${i}.jpg`,
        order: i,
        createdAt: new Date(),
      }));

      const productData: ProductCreateInput = {
        name: 'Product with Max Media',
        description: 'A test product with maximum media gallery items',
        price: 29.99,
        image: 'https://example.com/test-image.jpg',
        isFeatured: false,
        mediaGallery,
        variants: [],
        relatedProducts: [],
      };

      const ctx = await createTestContext(adminUser);

      const caller = appRouter.createCaller(ctx);
      const result = await caller.product.create(productData);

      expect((result.product as IProductWithVariants).mediaGallery).toHaveLength(6);
    });

    it('should reject mediaGallery exceeding maximum items', async () => {
      const mediaGallery = Array.from({ length: 7 }, (_, i) => ({
        id: `media-${i}`,
        type: 'image' as const,
        url: `https://example.com/image-${i}.jpg`,
        order: i,
        createdAt: new Date(),
      }));

      const productData: ProductCreateInput = {
        name: 'Product with Too Much Media',
        description: 'A test product with too many media gallery items',
        price: 29.99,
        image: 'https://example.com/test-image.jpg',
        isFeatured: false,
        mediaGallery,
        variants: [],
        relatedProducts: [],
      };

      const ctx = await createTestContext(adminUser);

      const caller = appRouter.createCaller(ctx);

      await expect(caller.product.create(productData)).rejects.toThrow();
    });

    it('should handle transaction rollback on database error', async () => {
      // Create a product that will cause a database constraint violation
      const productData: ProductCreateInput = {
        name: 'Transaction Test Product',
        description: 'A test product for transaction rollback',
        price: 29.99,
        image: 'https://example.com/test-image.jpg',
        isFeatured: false,
        mediaGallery: [],
        variants: [],
        relatedProducts: [],
      };

      const ctx = await createTestContext(adminUser);

      const caller = appRouter.createCaller(ctx);

      // First creation should succeed
      const result1 = await caller.product.create(productData);
      expect(result1.product).toBeDefined();

      // Manually create a product with the same slug to force a constraint violation
      await Product.create({
        name: 'Duplicate Slug Product',
        description: 'This will create a slug conflict',
        price: 39.99,
        image: 'https://example.com/test-image2.jpg',
        slug: 'transaction-test-product-1', // This will conflict with the next attempt
        mediaGallery: [],
        variants: [],
        relatedProducts: [],
      });

      // Verify that products are not left in inconsistent state after errors
      const productCountBefore = await Product.countDocuments();

      try {
        // This should handle the slug conflict gracefully
        await caller.product.create(productData);
      } catch (error) {
        // Even if it fails, verify no partial data was left
        const productCountAfter = await Product.countDocuments();
        expect(productCountAfter).toBe(productCountBefore);
      }
    });

    it('should handle invalid collection ID gracefully', async () => {
      const productData: ProductCreateInput = {
        name: 'Product with Invalid Collection',
        description: 'A test product with non-existent collection',
        price: 29.99,
        image: 'https://example.com/test-image.jpg',
        collectionId: new mongoose.Types.ObjectId().toString(), // Non-existent collection
        isFeatured: false,
        mediaGallery: [],
        variants: [],
        relatedProducts: [],
      };

      const ctx = await createTestContext(adminUser);

      const caller = appRouter.createCaller(ctx);

      await expect(caller.product.create(productData)).rejects.toThrow();
    });

    it('should handle both collectionId and collectionName provided', async () => {
      const productData: ProductCreateInput = {
        name: 'Product with Both Collection Fields',
        description: 'A test product with both collectionId and collectionName',
        price: 29.99,
        image: 'https://example.com/test-image.jpg',
        collectionId: (testCollection._id as mongoose.Types.ObjectId).toString(),
        collectionName: 'New Collection Name',
        isFeatured: false,
        mediaGallery: [],
        variants: [],
        relatedProducts: [],
      };

      const ctx = await createTestContext(adminUser);

      const caller = appRouter.createCaller(ctx);

      await expect(caller.product.create(productData)).rejects.toThrow(
        'Provide either collectionId or collectionName, not both'
      );
    });
  });
});
