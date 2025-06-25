import { describe, it, expect, vi, beforeEach } from 'vitest';
import { productService } from '../services/product.service.js';
import { Product } from '../models/product.model.js';
import { Collection } from '../models/collection.model.js';
import { generateSlug, generateUniqueSlug } from '../utils/slugify.js';
import mongoose from 'mongoose';
import { createMockSession, createSessionableQuery, mockObjectId } from './helpers/mongoose-mocks.js';

vi.mock('../models/product.model');
vi.mock('../models/collection.model');
vi.mock('../utils/slugify');
vi.mock('mongoose', async (importOriginal) => {
  const actual = await importOriginal<typeof import('mongoose')>();
  return {
    ...actual,
    default: {
      ...actual.default,
      startSession: vi.fn().mockReturnValue({
        startTransaction: vi.fn(),
        commitTransaction: vi.fn(),
        abortTransaction: vi.fn(),
        endSession: vi.fn(),
      }),
    },
  };
});

describe('ProductService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createProductWithCollection', () => {
    const userId = 'user123';
    const mockSession = createMockSession();

    beforeEach(() => {
      vi.mocked(mongoose.startSession).mockResolvedValue(mockSession);
    });

    it('should create product and collection atomically', async () => {
      const productData = {
        name: 'Test Product',
        description: 'Test description',
        price: 99.99,
        image: 'https://example.com/image.jpg',
        category: 'jeans' as const,
        collectionName: 'New Collection',
      };

      vi.mocked(generateSlug).mockReturnValue('new-collection');
      vi.mocked(generateUniqueSlug).mockResolvedValue('new-collection');
      vi.mocked(Collection.findOne).mockReturnValue(createSessionableQuery(null) as ReturnType<typeof Collection.findOne>);
      vi.mocked(Collection.create).mockResolvedValue([{
        _id: mockObjectId('collection123'),
        name: 'New Collection',
        slug: 'new-collection',
        description: '',
        owner: mockObjectId(userId),
        products: [],
        isPublic: false,
      }] as unknown as Awaited<ReturnType<typeof Collection.create>>);
      vi.mocked(Product.create).mockResolvedValue([{
        _id: mockObjectId('product123'),
        ...productData,
        collectionId: mockObjectId('collection123'),
        toJSON: () => ({ _id: 'product123', ...productData, collectionId: 'collection123' }),
      }] as unknown as Awaited<ReturnType<typeof Product.create>>);
      vi.mocked(Collection.findByIdAndUpdate).mockResolvedValue({} as unknown);

      const result = await productService.createProductWithCollection(userId, productData);

      void expect(result.created.product).toBe(true);
      void expect(result.created.collection).toBe(true);
      void expect(result.product._id).toBe('product123');
      void expect((result.collection?._id as any).toString()).toBe('collection123');
      void expect(mockSession.commitTransaction).toHaveBeenCalled();
      void expect(mockSession.endSession).toHaveBeenCalled();
    });

    it('should create product with existing collection', async () => {
      const productData = {
        name: 'Test Product',
        description: 'Test description',
        price: 99.99,
        image: 'https://example.com/image.jpg',
        category: 'jeans' as const,
        collectionId: 'existing-collection-id',
      };

      const mockCollection = {
        _id: mockObjectId('existing-collection-id'),
        owner: mockObjectId(userId),
      };
      vi.mocked(Collection.findOne).mockReturnValue(createSessionableQuery(mockCollection) as ReturnType<typeof Collection.findOne>);
      vi.mocked(Product.create).mockResolvedValue([{
        _id: mockObjectId('product123'),
        ...productData,
        toJSON: () => ({ _id: 'product123', ...productData }),
      }] as unknown as Awaited<ReturnType<typeof Product.create>>);
      vi.mocked(Collection.findByIdAndUpdate).mockResolvedValue({} as unknown);

      const result = await productService.createProductWithCollection(userId, productData);

      void expect(result.created.product).toBe(true);
      void expect(result.created.collection).toBe(false);
      void expect(result.collection).toBeUndefined();
      void expect(Collection.create).not.toHaveBeenCalled();
    });

    it('should throw error if both collectionId and collectionName provided', async () => {
      const productData = {
        name: 'Test Product',
        collectionId: 'collection123',
        collectionName: 'New Collection',
      };

      await expect(
        productService.createProductWithCollection(userId, productData),
      ).rejects.toThrow('Provide either collectionId or collectionName, not both');

      void expect(mockSession.startTransaction).not.toHaveBeenCalled();
    });

    it('should throw error if collection not found or access denied', async () => {
      const productData = {
        name: 'Test Product',
        collectionId: 'invalid-collection-id',
      };

      vi.mocked(Collection.findOne).mockReturnValue(createSessionableQuery(null) as ReturnType<typeof Collection.findOne>);

      await expect(
        productService.createProductWithCollection(userId, productData),
      ).rejects.toThrow('Collection not found or access denied');

      void expect(mockSession.abortTransaction).toHaveBeenCalled();
      void expect(mockSession.endSession).toHaveBeenCalled();
    });

    it('should rollback both on collection creation failure', async () => {
      const productData = {
        name: 'Test Product',
        collectionName: 'New Collection',
      };

      vi.mocked(Collection.create).mockRejectedValue(new Error('Collection creation failed'));

      await expect(
        productService.createProductWithCollection(userId, productData),
      ).rejects.toThrow('Collection creation failed');

      void expect(mockSession.abortTransaction).toHaveBeenCalled();
      void expect(mockSession.endSession).toHaveBeenCalled();
      void expect(Product.create).not.toHaveBeenCalled();
    });

    it('should rollback both on product creation failure', async () => {
      const productData = {
        name: 'Test Product',
        collectionName: 'New Collection',
      };

      vi.mocked(generateSlug).mockReturnValue('new-collection');
      vi.mocked(generateUniqueSlug).mockResolvedValue('new-collection');
      vi.mocked(Collection.create).mockResolvedValue([{
        _id: mockObjectId('collection123'),
      }] as unknown as Awaited<ReturnType<typeof Collection.create>>);
      vi.mocked(Product.create).mockRejectedValue(new Error('Product creation failed'));

      await expect(
        productService.createProductWithCollection(userId, productData),
      ).rejects.toThrow('Product creation failed');

      void expect(mockSession.abortTransaction).toHaveBeenCalled();
      void expect(mockSession.endSession).toHaveBeenCalled();
    });

    it('should update collection products array', async () => {
      const productData = {
        name: 'Test Product',
        collectionId: 'collection123',
      };

      const mockCollection = {
        _id: mockObjectId('collection123'),
        owner: mockObjectId(userId),
      };
      vi.mocked(Collection.findOne).mockReturnValue(createSessionableQuery(mockCollection) as ReturnType<typeof Collection.findOne>);
      vi.mocked(Product.create).mockResolvedValue([{
        _id: mockObjectId('product123'),
        toJSON: () => ({ _id: 'product123' }),
      }] as unknown as Awaited<ReturnType<typeof Product.create>>);
      vi.mocked(Collection.findByIdAndUpdate).mockResolvedValue({} as unknown);

      await productService.createProductWithCollection(userId, productData);

      void expect(Collection.findByIdAndUpdate).toHaveBeenCalledWith(
        'collection123',
        expect.objectContaining({
          $addToSet: expect.objectContaining({
            products: expect.objectContaining({
              _id: 'product123',
            }),
          }),
        }),
        expect.objectContaining({
          session: mockSession,
        }),
      );
    });

    it('should handle collection creation with trim', async () => {
      const productData = {
        name: 'Test Product',
        collectionName: '  New Collection  ',
      };

      vi.mocked(generateSlug).mockReturnValue('new-collection');
      vi.mocked(generateUniqueSlug).mockResolvedValue('new-collection');
      vi.mocked(Collection.create).mockResolvedValue([{
        _id: mockObjectId('collection123'),
        name: 'New Collection',
      }] as unknown as Awaited<ReturnType<typeof Collection.create>>);
      vi.mocked(Product.create).mockResolvedValue([{
        _id: mockObjectId('product123'),
        toJSON: () => ({ _id: 'product123' }),
      }] as unknown as Awaited<ReturnType<typeof Product.create>>);
      vi.mocked(Collection.findByIdAndUpdate).mockResolvedValue({} as unknown);

      await productService.createProductWithCollection(userId, productData);

      void expect(Collection.create).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'New Collection',
          }),
        ]),
        expect.any(Object),
      );
    });
  });
});