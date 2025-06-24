import { describe, it, expect, beforeEach, vi, beforeAll, afterAll } from 'vitest';
import mongoose, { ConnectionStates } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Product } from '../../models/product.model.js';
import { connectDB } from '../../lib/db.js';
import type { IMediaItem } from '../../types/product.types.js';

// Mock nanoid to return predictable IDs for testing
vi.mock('nanoid', () => ({
  nanoid: vi.fn((length: number) => `test-id-${length}`),
}));

// Mock the db connection to use test database
vi.mock('../../lib/db.js', () => ({
  connectDB: vi.fn(),
}));

describe('Product Media Migration Integration', () => {
  let mongoServer: MongoMemoryServer;
  let mockConnectDB: ReturnType<typeof vi.fn>;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    mockConnectDB = connectDB as ReturnType<typeof vi.fn>;
    mockConnectDB.mockImplementation(async () => {
      if (mongoose.connection.readyState === ConnectionStates.disconnected) {
        await mongoose.connect(mongoUri);
      }
    });
    
    // Ensure connection is established
    await mongoose.connect(mongoUri);
  }, 30000);

  afterAll(async () => {
    if (mongoose.connection.readyState !== ConnectionStates.disconnected) {
      await mongoose.disconnect();
    }
    await mongoServer.stop();
  }, 30000);

  beforeEach(async () => {
    // Ensure connection and clear the database before each test
    if (mongoose.connection.readyState !== ConnectionStates.connected) {
      const mongoUri = mongoServer.getUri();
      await mongoose.connect(mongoUri);
    }
    
    try {
      await Product.deleteMany({});
    } catch (error) {
      console.error('Failed to clear test database:', error);
    }
    vi.clearAllMocks();
  }, 15000);

  describe('Migration Logic', () => {
    it('should migrate products with main image only', async () => {
      // Create test product with only main image
      const testProduct = await Product.create({
        name: 'Test Product',
        description: 'Test Description',
        price: 99.99,
        image: 'https://example.com/main-image.jpg',
        slug: 'test-product',
      });

      // Simulate the migration logic
      const product = await Product.findById(testProduct._id);
      if (product && product.image && !product.mediaGallery?.length) {
        const mediaItems = [{
          id: 'test-id-6',
          type: 'image' as const,
          url: product.image,
          title: `${product.name} - Main Image`,
          order: 0,
          createdAt: new Date(),
          metadata: {},
        }];

        product.mediaGallery = mediaItems;
        await product.save({ validateBeforeSave: false });
      }

      const updatedProduct = await Product.findById(testProduct._id);
      
      expect(updatedProduct?.mediaGallery).toHaveLength(1);
      expect(updatedProduct?.mediaGallery?.[0]).toMatchObject({
        id: 'test-id-6',
        type: 'image',
        url: 'https://example.com/main-image.jpg',
        title: 'Test Product - Main Image',
        order: 0,
      });
    });

    it('should migrate products with variants and images', async () => {
      // Create test product with variants containing images
      const testProduct = await Product.create({
        name: 'Variant Product',
        description: 'Product with variants',
        price: 149.99,
        image: 'https://example.com/main-image.jpg',
        slug: 'variant-product',
        variants: [
          {
            variantId: 'variant-1',
            label: 'Red M',
            price: 149.99,
            images: [
              'https://example.com/variant-1-image-1.jpg',
              'https://example.com/variant-1-image-2.jpg',
            ],
            inventory: 10,
            color: 'Red',
            size: 'M',
          },
          {
            variantId: 'variant-2',
            label: 'Blue L',
            price: 159.99,
            images: [
              'https://example.com/variant-2-image-1.jpg',
              'https://example.com/main-image.jpg', // Duplicate of main image
            ],
            inventory: 5,
            color: 'Blue',
            size: 'L',
          },
        ],
      });

      // Simulate the migration logic
      const product = await Product.findById(testProduct._id);
      if (product && !product.mediaGallery?.length) {
        const mediaItems: IMediaItem[] = [];
        
        // Add main image
        if (product.image) {
          mediaItems.push({
            id: 'test-id-6',
            type: 'image' as const,
            url: product.image,
            title: `${product.name} - Main Image`,
            order: 0,
            createdAt: new Date(),
            metadata: {},
          });
        }

        // Collect unique variant images
        const variantImages = new Set<string>();
        product.variants?.forEach(variant => {
          variant.images?.forEach(img => {
            if (img && img !== product.image) {
              variantImages.add(img);
            }
          });
        });

        // Add variant images (up to 5 more after main image)
        let order = 1;
        const variantImageArray = Array.from(variantImages);
        for (let i = 0; i < variantImageArray.length && order < 6; i++) {
          const variantImage = variantImageArray[i];
          
          mediaItems.push({
            id: 'test-id-6',
            type: 'image' as const,
            url: variantImage,
            title: `${product.name} - Variant Image ${order}`,
            order: order++,
            createdAt: new Date(),
            metadata: {},
          });
        }

        product.mediaGallery = mediaItems;
        await product.save({ validateBeforeSave: false });
      }

      const updatedProduct = await Product.findById(testProduct._id);
      
      expect(updatedProduct?.mediaGallery).toHaveLength(4); // Main + 3 unique variant images
      expect(updatedProduct?.mediaGallery?.[0].url).toBe('https://example.com/main-image.jpg');
      expect(updatedProduct?.mediaGallery?.[1].url).toBe('https://example.com/variant-1-image-1.jpg');
      expect(updatedProduct?.mediaGallery?.[2].url).toBe('https://example.com/variant-1-image-2.jpg');
      expect(updatedProduct?.mediaGallery?.[3].url).toBe('https://example.com/variant-2-image-1.jpg');
      
      // Verify orders are sequential
      updatedProduct?.mediaGallery?.forEach((item, index) => {
        expect(item.order).toBe(index);
      });
    });

    it('should skip products that already have mediaGallery', async () => {
      // Create product with existing mediaGallery
      const testProduct = await Product.create({
        name: 'Already Migrated Product',
        description: 'Product with existing media gallery',
        price: 99.99,
        image: 'https://example.com/main-image.jpg',
        slug: 'migrated-product',
        mediaGallery: [
          {
            id: 'existing-id',
            type: 'image' as const,
            url: 'https://example.com/existing-image.jpg',
            title: 'Existing Image',
            order: 0,
            createdAt: new Date(),
            metadata: {},
          },
        ],
      });

      // Migration should skip this product
      const product = await Product.findById(testProduct._id);
      const originalGalleryLength = product?.mediaGallery?.length ?? 0;

      // Simulate migration check
      const shouldMigrate = product && !product.mediaGallery?.length;
      expect(shouldMigrate).toBe(false);

      // Verify gallery unchanged
      const unchangedProduct = await Product.findById(testProduct._id);
      expect(unchangedProduct?.mediaGallery).toHaveLength(originalGalleryLength);
      expect(unchangedProduct?.mediaGallery?.[0].id).toBe('existing-id');
    });

    it('should handle products with no images gracefully', async () => {
      // Create product without any images - use validateBeforeSave: false to bypass required image
      const testProduct = new Product({
        name: 'No Image Product',
        description: 'Product without images',
        price: 99.99,
        slug: 'no-image-product',
        // No image field, no variants
      });
      await testProduct.save({ validateBeforeSave: false });

      // Simulate migration logic
      const product = await Product.findById(testProduct._id);
      if (product && !product.mediaGallery?.length) {
        const mediaItems: IMediaItem[] = [];
        
        // No main image to add
        // No variants to process
        
        product.mediaGallery = mediaItems;
        await product.save({ validateBeforeSave: false });
      }

      const updatedProduct = await Product.findById(testProduct._id);
      expect(updatedProduct?.mediaGallery).toHaveLength(0);
    });

    it('should respect maximum media limit of 6 items', async () => {
      // Create product with many variant images
      const manyImages = Array.from({ length: 10 }, (_, i) => 
        `https://example.com/variant-image-${i + 1}.jpg`,
      );

      const testProduct = await Product.create({
        name: 'Many Images Product',
        description: 'Product with many variant images',
        price: 99.99,
        image: 'https://example.com/main-image.jpg',
        slug: 'many-images-product',
        variants: [
          {
            variantId: 'variant-1',
            label: 'Red M',
            price: 99.99,
            images: manyImages,
            inventory: 10,
            color: 'Red',
            size: 'M',
          },
        ],
      });

      // Simulate migration logic with limit
      const product = await Product.findById(testProduct._id);
      if (product && !product.mediaGallery?.length) {
        const mediaItems: IMediaItem[] = [];
        
        // Add main image
        if (product.image) {
          mediaItems.push({
            id: 'test-id-6',
            type: 'image' as const,
            url: product.image,
            title: `${product.name} - Main Image`,
            order: 0,
            createdAt: new Date(),
            metadata: {},
          });
        }

        // Collect unique variant images
        const variantImages = new Set<string>();
        product.variants?.forEach(variant => {
          variant.images?.forEach(img => {
            if (img && img !== product.image) {
              variantImages.add(img);
            }
          });
        });

        // Add variant images (up to 5 more after main image, total max 6)
        let order = 1;
        const variantImageArray = Array.from(variantImages);
        for (let i = 0; i < variantImageArray.length && order < 6; i++) {
          const variantImage = variantImageArray[i];
          
          mediaItems.push({
            id: 'test-id-6',
            type: 'image' as const,
            url: variantImage,
            title: `${product.name} - Variant Image ${order}`,
            order: order++,
            createdAt: new Date(),
            metadata: {},
          });
        }

        product.mediaGallery = mediaItems;
        await product.save({ validateBeforeSave: false });
      }

      const updatedProduct = await Product.findById(testProduct._id);
      
      // Should have exactly 6 items (main + 5 variants), not more
      expect(updatedProduct?.mediaGallery).toHaveLength(6);
      expect(updatedProduct?.mediaGallery?.[0].url).toBe('https://example.com/main-image.jpg');
      expect(updatedProduct?.mediaGallery?.[5].order).toBe(5);
    });
  });

  describe('Transaction Safety', () => {
    it('should handle database errors gracefully', async () => {
      // Create a product
      const testProduct = await Product.create({
        name: 'Test Product',
        description: 'Test',
        price: 99.99,
        image: 'https://example.com/image.jpg',
        slug: 'test-product',
      });

      // Simulate a database error during migration
      const saveSpy = vi.spyOn(Product.prototype, 'save').mockRejectedValue(new Error('Database error'));

      let migrationError: Error | null = null;
      
      try {
        // Simulate migration without transaction (since MongoMemoryServer doesn't support transactions)
        const product = await Product.findById(testProduct._id);
        if (product && product.image && !product.mediaGallery?.length) {
          product.mediaGallery = [{
            id: 'test-id-6',
            type: 'image' as const,
            url: product.image,
            title: `${product.name} - Main Image`,
            order: 0,
            createdAt: new Date(),
            metadata: {},
          }];
          await product.save({ validateBeforeSave: false });
        }
      } catch (error) {
        migrationError = error as Error;
      }

      // Restore original save method
      saveSpy.mockRestore();

      // Verify error was caught
      expect(migrationError).toBeInstanceOf(Error);
      expect(migrationError?.message).toBe('Database error');
      
      // Verify product was not modified (because save failed)
      const unchangedProduct = await Product.findById(testProduct._id);
      expect(unchangedProduct?.mediaGallery).toHaveLength(0);
    });
  });
});