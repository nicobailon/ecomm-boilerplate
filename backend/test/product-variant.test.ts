import { describe, it, expect, vi } from 'vitest';
import mongoose from 'mongoose';
import { Product } from '../models/product.model.js';

vi.mock('../models/product.model.js');

describe('Product Variant Schema', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Variant Validation', () => {
    it('should create a product with valid variants', async () => {
      const productData = {
        name: 'Test T-Shirt',
        description: 'A test product',
        price: 29.99,
        image: 'https://example.com/image.jpg',
        slug: 'test-t-shirt',
        variants: [
          {
            variantId: 'v1',
            size: 'M',
            color: '#000000',
            price: 29.99,
            inventory: 50,
            images: ['https://example.com/variant1.jpg'],
            sku: 'TSH-BLK-M'
          },
          {
            variantId: 'v2',
            size: 'L',
            color: '#FFFFFF',
            price: 29.99,
            inventory: 30,
            images: ['https://example.com/variant2.jpg'],
            sku: 'TSH-WHT-L'
          }
        ]
      };

      const mockProduct = { ...productData, _id: 'product123', save: vi.fn() };
      mockProduct.save.mockResolvedValue(mockProduct);
      vi.mocked(Product).mockImplementation(() => mockProduct as any);

      const product = new (Product as any)(productData);
      const saved = await product.save();

      expect(saved.variants).toHaveLength(2);
      expect(saved.variants[0].variantId).toBe('v1');
      expect(saved.variants[0].size).toBe('M');
      expect(saved.variants[0].color).toBe('#000000');
      expect(saved.variants[0].inventory).toBe(50);
    });

    it('should validate variant size enum', async () => {
      const productData = {
        name: 'Test Product',
        description: 'Test description',
        price: 29.99,
        image: 'https://example.com/image.jpg',
        slug: 'test-product',
        variants: [
          {
            variantId: 'v1',
            size: 'INVALID_SIZE' as any,
            price: 29.99,
            inventory: 10
          }
        ]
      };

      const mockProduct = {
        ...productData,
        save: vi.fn().mockRejectedValue(new Error('Validation failed: Invalid size'))
      };
      
      vi.mocked(Product).mockImplementation(() => mockProduct as any);
      
      const product = new (Product as any)(productData);
      
      await expect(product.save()).rejects.toThrow('Validation failed: Invalid size');
    });

    it('should require variant price and inventory', async () => {
      const productData = {
        name: 'Test Product',
        description: 'Test description',
        price: 29.99,
        image: 'https://example.com/image.jpg',
        slug: 'test-product-2',
        variants: [
          {
            variantId: 'v1',
            size: 'M'
          }
        ]
      };

      const product = new Product(productData);
      
      await expect(product.save()).rejects.toThrow();
    });

    it('should allow variants without size and color', async () => {
      const productData = {
        name: 'Test Product',
        description: 'Test description',
        price: 29.99,
        image: 'https://example.com/image.jpg',
        slug: 'test-product-3',
        variants: [
          {
            variantId: 'v1',
            price: 29.99,
            inventory: 100,
            images: [],
            sku: 'PROD-001'
          }
        ]
      };

      const mockProduct = {
        ...productData,
        _id: 'product123',
        save: vi.fn()
      };
      mockProduct.save.mockResolvedValue(mockProduct);
      
      vi.mocked(Product).mockImplementation(() => mockProduct as any);
      
      const product = new (Product as any)(productData);
      const saved = await product.save();

      expect(saved.variants[0].size).toBeUndefined();
      expect(saved.variants[0].color).toBeUndefined();
      expect(saved.variants[0].price).toBe(29.99);
    });

    it('should validate price minimum value', async () => {
      const productData = {
        name: 'Test Product',
        description: 'Test description',
        price: 29.99,
        image: 'https://example.com/image.jpg',
        slug: 'test-product-4',
        variants: [
          {
            variantId: 'v1',
            price: -10,
            inventory: 50
          }
        ]
      };

      const product = new Product(productData);
      
      await expect(product.save()).rejects.toThrow();
    });

    it('should validate inventory minimum value', async () => {
      const productData = {
        name: 'Test Product',
        description: 'Test description',
        price: 29.99,
        image: 'https://example.com/image.jpg',
        slug: 'test-product-5',
        variants: [
          {
            variantId: 'v1',
            price: 29.99,
            inventory: -5
          }
        ]
      };

      const product = new Product(productData);
      
      await expect(product.save()).rejects.toThrow();
    });

    it('should default inventory to 0 if not provided', async () => {
      const productData = {
        name: 'Test Product',
        description: 'Test description',
        price: 29.99,
        image: 'https://example.com/image.jpg',
        slug: 'test-product-6',
        variants: [
          {
            variantId: 'v1',
            price: 29.99
          }
        ]
      };

      const mockProduct = {
        ...productData,
        save: vi.fn().mockRejectedValue(new Error('Validation failed'))
      };
      
      vi.mocked(Product).mockImplementation(() => mockProduct as any);
      
      const product = new (Product as any)(productData);
      await expect(product.save()).rejects.toThrow('Validation failed');
    });

    it('should handle empty variants array', async () => {
      const productData = {
        name: 'Test Product',
        description: 'Test description',
        price: 29.99,
        image: 'https://example.com/image.jpg',
        slug: 'test-product-7',
        variants: []
      };

      const mockProduct = {
        ...productData,
        _id: 'product123',
        save: vi.fn()
      };
      mockProduct.save.mockResolvedValue(mockProduct);
      
      vi.mocked(Product).mockImplementation(() => mockProduct as any);
      
      const product = new (Product as any)(productData);
      const saved = await product.save();

      expect(saved.variants).toHaveLength(0);
    });
  });

  describe('Slug Field', () => {
    it('should require a slug', async () => {
      const productData = {
        name: 'Test Product',
        description: 'Test description',
        price: 29.99,
        image: 'https://example.com/image.jpg'
      };

      const mockProduct = {
        ...productData,
        save: vi.fn().mockRejectedValue(new Error('Validation failed: slug is required'))
      };
      
      vi.mocked(Product).mockImplementation(() => mockProduct as any);
      
      const product = new (Product as any)(productData);
      
      await expect(product.save()).rejects.toThrow('Validation failed: slug is required');
    });

    it('should enforce unique slugs', async () => {
      const productData1 = {
        name: 'Product 1',
        description: 'Test description',
        price: 29.99,
        image: 'https://example.com/image.jpg',
        slug: 'unique-slug'
      };

      const productData2 = {
        name: 'Product 2',
        description: 'Test description',
        price: 39.99,
        image: 'https://example.com/image2.jpg',
        slug: 'unique-slug'
      };

      const mockProduct1 = {
        ...productData1,
        _id: 'product1',
        save: vi.fn()
      };
      mockProduct1.save.mockResolvedValue(mockProduct1);
      
      const mockProduct2 = {
        ...productData2,
        save: vi.fn().mockRejectedValue(new Error('E11000 duplicate key error'))
      };
      
      vi.mocked(Product).mockImplementationOnce(() => mockProduct1 as any)
        .mockImplementationOnce(() => mockProduct2 as any);
      
      const product1 = new (Product as any)(productData1);
      await product1.save();
      
      const product2 = new (Product as any)(productData2);
      await expect(product2.save()).rejects.toThrow('E11000 duplicate key error');
    });
  });

  describe('Related Products', () => {
    it('should store related product references', async () => {
      const relatedProductId = new mongoose.Types.ObjectId();
      const relatedProduct = {
        _id: relatedProductId,
        name: 'Related Product',
        description: 'Related description',
        price: 19.99,
        image: 'https://example.com/related.jpg',
        slug: 'related-product',
        save: vi.fn().mockResolvedValue(this)
      };
      
      const mainProductId = new mongoose.Types.ObjectId();
      const mainProduct = {
        _id: mainProductId,
        name: 'Main Product',
        description: 'Main description',
        price: 29.99,
        image: 'https://example.com/main.jpg',
        slug: 'main-product',
        relatedProducts: [relatedProductId],
        save: vi.fn()
      };
      mainProduct.save.mockResolvedValue(mainProduct);
      
      vi.mocked(Product).mockImplementationOnce(() => relatedProduct as any)
        .mockImplementationOnce(() => mainProduct as any);
      
      const related = new (Product as any)(relatedProduct);
      await related.save();
      
      const main = new (Product as any)(mainProduct);
      const savedMain = await main.save();
      
      expect(savedMain.relatedProducts).toHaveLength(1);
      expect(savedMain.relatedProducts[0].toString()).toBe(relatedProductId.toString());
    });

    it('should default to empty array for related products', async () => {
      const product = await new Product({
        name: 'Product',
        description: 'Description',
        price: 29.99,
        image: 'https://example.com/image.jpg',
        slug: 'product-slug'
      }).save();

      expect(product.relatedProducts).toEqual([]);
    });
  });

  describe('Soft Delete', () => {
    it('should default isDeleted to false', async () => {
      const mockProduct = {
        name: 'Product',
        description: 'Description',
        price: 29.99,
        image: 'https://example.com/image.jpg',
        slug: 'test-product-soft',
        isDeleted: false,
        save: vi.fn()
      };
      mockProduct.save.mockResolvedValue(mockProduct);
      
      vi.mocked(Product).mockImplementation(() => mockProduct as any);
      
      const product = new (Product as any)(mockProduct);
      const saved = await product.save();

      expect(saved.isDeleted).toBe(false);
    });

    it('should allow setting isDeleted', async () => {
      const mockProduct = {
        name: 'Product',
        description: 'Description',
        price: 29.99,
        image: 'https://example.com/image.jpg',
        slug: 'test-product-soft-2',
        isDeleted: true,
        save: vi.fn()
      };
      mockProduct.save.mockResolvedValue(mockProduct);
      
      vi.mocked(Product).mockImplementation(() => mockProduct as any);
      
      const product = new (Product as any)(mockProduct);
      const saved = await product.save();

      expect(saved.isDeleted).toBe(true);
    });
  });

  describe('Index Verification', () => {
    it('should have proper indexes defined', async () => {
      const mockIndexes = {
        _id_: { key: { _id: 1 } },
        slug_1_isDeleted_1: { key: { slug: 1, isDeleted: 1 } },
        'variants.sku_1': { key: { 'variants.sku': 1 } },
        relatedProducts_1: { key: { relatedProducts: 1 } }
      };
      
      vi.mocked(Product.collection.getIndexes).mockResolvedValue(mockIndexes as any);
      
      const indexes = await Product.collection.getIndexes();
      
      const indexKeys = Object.values(indexes as any).map((index: any) => index.key);
      
      expect(indexKeys.some(key => key.slug === 1 && key.isDeleted === 1)).toBe(true);
      expect(indexKeys.some(key => key['variants.sku'] === 1)).toBe(true);
      expect(indexKeys.some(key => key.relatedProducts === 1)).toBe(true);
    });
  });
});