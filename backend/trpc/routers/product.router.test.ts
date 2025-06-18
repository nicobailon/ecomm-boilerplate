import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TRPCError } from '@trpc/server';
import { appRouter } from './app.router';
import { productService } from '../../services/product.service';

vi.mock('../../services/product.service');

describe('productRouter - enhanced create', () => {
  let adminCaller: ReturnType<typeof appRouter.createCaller>;
  let userCaller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(() => {
    vi.clearAllMocks();
    
    adminCaller = appRouter.createCaller({
      user: { _id: 'admin123', role: 'admin' },
      req: { cookies: {} },
      res: {
        cookie: vi.fn(),
        clearCookie: vi.fn(),
      },
    } as any);

    userCaller = appRouter.createCaller({
      user: { _id: 'user123', role: 'customer' },
      req: { cookies: {} },
      res: {
        cookie: vi.fn(),
        clearCookie: vi.fn(),
      },
    } as any);
  });

  describe('create with collection support', () => {
    it('should create product with new collection', async () => {
      const input = {
        name: 'Test Product',
        description: 'Test description for the product',
        price: 99.99,
        category: 'jeans' as const,
        image: 'https://example.com/image.jpg',
        collectionName: 'New Collection',
      };

      const mockResult = {
        product: {
          _id: 'product123',
          ...input,
          collectionId: 'collection123',
        },
        collection: {
          _id: 'collection123',
          name: 'New Collection',
          slug: 'new-collection',
          isPublic: false,
        },
        created: {
          product: true,
          collection: true,
        },
      };

      vi.mocked(productService.createProductWithCollection).mockResolvedValue(mockResult as any);

      const result = await adminCaller.product.create(input);

      expect(productService.createProductWithCollection).toHaveBeenCalledWith('admin123', input);
      expect(result).toEqual(mockResult);
      expect(result.created.collection).toBe(true);
    });

    it('should create product with existing collection', async () => {
      const input = {
        name: 'Test Product',
        description: 'Test description for the product',
        price: 99.99,
        category: 'jeans' as const,
        image: 'https://example.com/image.jpg',
        collectionId: 'existing-collection-id',
      };

      const mockResult = {
        product: {
          _id: 'product123',
          ...input,
        },
        created: {
          product: true,
          collection: false,
        },
      };

      vi.mocked(productService.createProductWithCollection).mockResolvedValue(mockResult as any);

      const result = await adminCaller.product.create(input);

      expect(result.created.collection).toBe(false);
      expect(result.collection).toBeUndefined();
    });

    it('should reject when both collectionId and collectionName provided', async () => {
      const input = {
        name: 'Test Product',
        description: 'Test description for the product',
        price: 99.99,
        category: 'jeans' as const,
        image: 'https://example.com/image.jpg',
        collectionId: 'collection123',
        collectionName: 'New Collection',
      };

      await expect(adminCaller.product.create(input)).rejects.toThrow('Provide either collectionId or collectionName, not both');
    });

    it('should trim collection name', async () => {
      const input = {
        name: 'Test Product',
        description: 'Test description for the product',
        price: 99.99,
        category: 'jeans' as const,
        image: 'https://example.com/image.jpg',
        collectionName: '  Trimmed Collection  ',
      };

      vi.mocked(productService.createProductWithCollection).mockResolvedValue({
        product: { _id: 'product123' },
        collection: { _id: 'collection123', name: 'Trimmed Collection' },
        created: { product: true, collection: true },
      } as any);

      await adminCaller.product.create(input);

      expect(productService.createProductWithCollection).toHaveBeenCalledWith(
        'admin123',
        expect.objectContaining({
          collectionName: '  Trimmed Collection  ',
        })
      );
    });

    it('should throw FORBIDDEN when non-admin tries to create', async () => {
      const input = {
        name: 'Test Product',
        description: 'Test description for the product',
        price: 99.99,
        category: 'jeans' as const,
        image: 'https://example.com/image.jpg',
      };

      await expect(userCaller.product.create(input)).rejects.toMatchObject({
        code: 'FORBIDDEN',
      });
    });

    it('should handle service errors properly', async () => {
      const input = {
        name: 'Test Product',
        description: 'Test description for the product',
        price: 99.99,
        category: 'jeans' as const,
        image: 'https://example.com/image.jpg',
        collectionId: 'invalid-collection',
      };

      const error = new Error('Collection not found or access denied');
      (error as any).statusCode = 400;

      vi.mocked(productService.createProductWithCollection).mockRejectedValue(error);

      await expect(adminCaller.product.create(input)).rejects.toMatchObject({
        code: 'BAD_REQUEST',
        message: 'Collection not found or access denied',
      });
    });

    it('should reject empty collection name', async () => {
      const input = {
        name: 'Test Product',
        description: 'Test description for the product',
        price: 99.99,
        category: 'jeans' as const,
        image: 'https://example.com/image.jpg',
        collectionName: '   ',
      };

      await expect(adminCaller.product.create(input)).rejects.toThrow('Collection name cannot be empty');
    });
  });
});