import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CollectionService } from '../services/collection.service.js';
import { Collection } from '../models/collection.model.js';
import { Product } from '../models/product.model.js';
import { AppError } from '../utils/AppError.js';
import { generateSlug, generateUniqueSlug } from '../utils/slugify.js';
import { 
  createMockSession, 
  createSessionableQuery, 
  createChainableQuery,
  mockObjectId
} from './helpers/mongoose-mocks.js';

vi.mock('../models/collection.model');
vi.mock('../models/product.model');
vi.mock('../utils/slugify');
vi.mock('../utils/escapeRegex', () => ({
  escapeRegExp: vi.fn((str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
}));

let mockSession: ReturnType<typeof createMockSession>;

vi.mock('mongoose', async (importOriginal) => {
  const actual = await importOriginal<typeof import('mongoose')>();
  return {
    ...actual,
    default: {
      ...actual.default,
      startSession: vi.fn(() => mockSession),
      Types: {
        ...actual.Types,
        ObjectId: vi.fn().mockImplementation((id: string) => mockObjectId(id)),
      },
    },
  };
});

describe('CollectionService', () => {
  let collectionService: CollectionService;

  beforeEach(() => {
    collectionService = new CollectionService();
    mockSession = createMockSession();
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should create a collection with valid input', async () => {
      const userId = 'user123';
      const input = {
        name: 'My Collection',
        description: 'Test description',
        isPublic: true,
        products: ['product1', 'product2'],
      };

      const mockProducts = [{ _id: 'product1' }, { _id: 'product2' }];
      vi.mocked(Product.find).mockReturnValue(createChainableQuery(mockProducts) as any);

      vi.mocked(generateUniqueSlug).mockResolvedValue('my-collection');
      vi.mocked(generateSlug).mockReturnValue('my-collection');

      const mockCollection = {
        _id: 'collection123',
        ...input,
        slug: 'my-collection',
        owner: userId,
        save: vi.fn().mockResolvedValue(true),
      };
      
      // Mock the collection constructor to return our mock
      const CollectionConstructor = vi.fn().mockImplementation(() => mockCollection);
      vi.mocked(Collection).mockImplementation(CollectionConstructor as any);
      
      // Mock Collection.create to return an array (as it does with sessions)
      vi.mocked(Collection.create).mockResolvedValue([mockCollection] as any);
      
      // Mock findById for the populated result
      vi.mocked(Collection.findById).mockReturnValue({
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockResolvedValue(mockCollection),
        }),
      } as any);

      const result = await collectionService.create(userId, input);

      expect(generateUniqueSlug).toHaveBeenCalledWith('My Collection', expect.any(Function));
      expect(Collection.create).toHaveBeenCalledWith({
        name: input.name,
        description: input.description,
        slug: 'my-collection',
        owner: userId,
        products: input.products,
        isPublic: input.isPublic,
        productCount: input.products.length,
      });
      expect(result).toEqual(mockCollection);
    });

    it('should throw error if invalid product IDs are provided', async () => {
      const userId = 'user123';
      const input = {
        name: 'My Collection',
        products: ['product1', 'invalid'],
        isPublic: false,
      };

      const mockProducts = [{ _id: 'product1' }];
      vi.mocked(Product.find).mockReturnValue(createChainableQuery(mockProducts) as any);

      await expect(collectionService.create(userId, input)).rejects.toBeInstanceOf(AppError);
      await expect(collectionService.create(userId, input)).rejects.toThrow('One or more product IDs are invalid');
    });

    it('should create collection with empty products array', async () => {
      const userId = 'user123';
      const input = {
        name: 'Empty Collection',
        products: [],
        isPublic: false,
      };

      vi.mocked(generateUniqueSlug).mockResolvedValue('empty-collection');
      
      const mockCollection = {
        _id: 'collection123',
        name: input.name,
        slug: 'empty-collection',
        owner: userId,
        products: [],
        productCount: 0,
      };
      vi.mocked(Collection.create).mockResolvedValue([mockCollection] as any);

      const result = await collectionService.create(userId, input);

      expect(Product.find).not.toHaveBeenCalled();
      expect(result).toEqual(mockCollection);
    });
  });

  describe('update', () => {
    it('should update collection properties', async () => {
      const collectionId = 'collection123';
      const userId = 'user123';
      const input = {
        name: 'Updated Name',
        description: 'Updated description',
      };

      const mockCollection = {
        _id: collectionId,
        name: 'Old Name',
        owner: userId,
        save: vi.fn().mockResolvedValue(true),
      };

      vi.mocked(Collection.findOne).mockReturnValue(createSessionableQuery(mockCollection) as any);
      vi.mocked(generateUniqueSlug).mockResolvedValue('updated-name');

      await collectionService.update(collectionId, userId, input);

      expect(mockCollection.name).toBe('Updated Name');
      expect(mockCollection.save).toHaveBeenCalled();
    });

    it('should not regenerate slug if name is not changed', async () => {
      const collectionId = 'collection123';
      const userId = 'user123';
      const input = {
        description: 'Updated description only',
      };

      const mockCollection = {
        _id: collectionId,
        name: 'My Collection',
        slug: 'my-collection',
        owner: userId,
        save: vi.fn().mockResolvedValue(true),
      };

      vi.mocked(Collection.findOne).mockReturnValue(createSessionableQuery(mockCollection) as any);

      await collectionService.update(collectionId, userId, input);

      expect(generateUniqueSlug).not.toHaveBeenCalled();
      expect(mockCollection.slug).toBe('my-collection');
    });

    it('should throw error if collection not found or unauthorized', async () => {
      vi.mocked(Collection.findOne).mockResolvedValue(null);

      await expect(
        collectionService.update('collection123', 'user123', { name: 'New Name' })
      ).rejects.toThrow('Collection not found or unauthorized');
    });
  });

  describe('delete', () => {
    it('should delete collection successfully', async () => {
      const collectionId = 'collection123';
      const userId = 'user123';

      const mockCollection = {
        _id: collectionId,
        owner: userId,
        products: ['product1', 'product2'],
        deleteOne: vi.fn().mockResolvedValue({ deletedCount: 1 }),
      };

      vi.mocked(Collection.findOne).mockReturnValue(createSessionableQuery(mockCollection) as any);
      vi.mocked(Product.updateMany).mockResolvedValue({ modifiedCount: 2 } as any);

      await collectionService.delete(collectionId, userId);

      expect(Collection.findOne).toHaveBeenCalledWith({
        _id: collectionId,
        owner: userId,
      });
      expect(Product.updateMany).toHaveBeenCalledWith(
        { _id: { $in: mockCollection.products } },
        { $unset: { collectionId: 1 } },
        { session: mockSession }
      );
      expect(mockCollection.deleteOne).toHaveBeenCalledWith({ session: mockSession });
    });

    it('should throw error if collection not found', async () => {
      vi.mocked(Collection.findOne).mockReturnValue(createSessionableQuery(null) as any);

      await expect(
        collectionService.delete('collection123', 'user123')
      ).rejects.toThrow('Collection not found or unauthorized');
    });
  });

  describe('addProducts', () => {
    it('should add new products to collection', async () => {
      const collectionId = 'collection123';
      const userId = 'user123';
      const productIds = ['product3', 'product4'];

      const mockCollection = {
        _id: collectionId,
        owner: userId,
        products: ['product1', 'product2'],
        productCount: 2,
        save: vi.fn().mockResolvedValue(true),
      };

      vi.mocked(Collection.findOne).mockReturnValue(createSessionableQuery(mockCollection) as any);

      const mockProducts = [{ _id: 'product3' }, { _id: 'product4' }];
      vi.mocked(Product.find).mockReturnValue(createChainableQuery(mockProducts) as any);

      await collectionService.addProducts(collectionId, userId, productIds);

      expect(mockCollection.products).toEqual(['product1', 'product2', 'product3', 'product4']);
      expect(mockCollection.productCount).toBe(4);
      expect(mockCollection.save).toHaveBeenCalled();
    });

    it('should not add duplicate products', async () => {
      const collectionId = 'collection123';
      const userId = 'user123';
      const productIds = ['product1', 'product3'];

      const mockCollection = {
        _id: collectionId,
        owner: userId,
        products: ['product1', 'product2'],
        productCount: 2,
        save: vi.fn().mockResolvedValue(true),
      };

      vi.mocked(Collection.findOne).mockReturnValue(createSessionableQuery(mockCollection) as any);

      const mockProducts = [{ _id: 'product1' }, { _id: 'product3' }];
      vi.mocked(Product.find).mockReturnValue(createChainableQuery(mockProducts) as any);

      await collectionService.addProducts(collectionId, userId, productIds);

      expect(mockCollection.products).toEqual(['product1', 'product2', 'product3']);
      expect(mockCollection.productCount).toBe(3);
    });

    it('should throw error if collection not found', async () => {
      vi.mocked(Collection.findOne).mockReturnValue(createSessionableQuery(null) as any);

      await expect(
        collectionService.addProducts('collection123', 'user123', ['product1'])
      ).rejects.toThrow('Collection not found or unauthorized');
    });

    it('should throw error if invalid products provided', async () => {
      const mockCollection = {
        _id: 'collection123',
        owner: 'user123',
        products: [],
      };

      vi.mocked(Collection.findOne).mockReturnValue(createSessionableQuery(mockCollection) as any);
      vi.mocked(Product.find).mockReturnValue(createChainableQuery([]) as any);

      await expect(
        collectionService.addProducts('collection123', 'user123', ['invalid'])
      ).rejects.toThrow('One or more product IDs are invalid');
    });
  });

  describe('removeProducts', () => {
    it('should remove products from collection', async () => {
      const collectionId = 'collection123';
      const userId = 'user123';
      const productIds = ['product2'];

      const mockCollection = {
        _id: collectionId,
        owner: userId,
        products: ['product1', 'product2', 'product3'],
        productCount: 3,
        save: vi.fn().mockResolvedValue(true),
      };

      vi.mocked(Collection.findOne).mockReturnValue(createSessionableQuery(mockCollection) as any);

      await collectionService.removeProducts(collectionId, userId, productIds);

      expect(mockCollection.products).toEqual(['product1', 'product3']);
      expect(mockCollection.productCount).toBe(2);
      expect(mockCollection.save).toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    it('should return public collection', async () => {
      const collectionId = 'collection123';
      
      const mockCollection = {
        _id: collectionId,
        name: 'Public Collection',
        isPublic: true,
      };

      vi.mocked(Collection.findOne).mockReturnValue({
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockResolvedValue(mockCollection),
        }),
      } as any);

      const result = await collectionService.getById(collectionId);

      expect(result).toEqual(mockCollection);
    });

    it('should return private collection for owner', async () => {
      const collectionId = 'collection123';
      const userId = 'user123';
      
      const mockCollection = {
        _id: collectionId,
        name: 'Private Collection',
        owner: { _id: userId },
        isPublic: false,
      };

      vi.mocked(Collection.findOne).mockReturnValue({
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockResolvedValue(mockCollection),
        }),
      } as any);

      const result = await collectionService.getById(collectionId, userId);

      expect(result).toEqual(mockCollection);
    });

    it('should throw error for private collection accessed by non-owner', async () => {
      const collectionId = 'collection123';
      const userId = 'otheruser';
      
      const mockCollection = {
        _id: collectionId,
        name: 'Private Collection',
        owner: { _id: 'user123' },
        isPublic: false,
      };

      vi.mocked(Collection.findOne).mockReturnValue({
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockResolvedValue(mockCollection),
        }),
      } as any);

      await expect(
        collectionService.getById(collectionId, userId)
      ).rejects.toThrow('Collection is private');
    });

    it('should return null if collection not found', async () => {
      vi.mocked(Collection.findOne).mockReturnValue({
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockResolvedValue(null),
        }),
      } as any);

      const result = await collectionService.getById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('list', () => {
    it('should list collections with pagination', async () => {
      const mockCollections = [
        { _id: '1', name: 'Collection 1' },
        { _id: '2', name: 'Collection 2' },
      ];

      vi.mocked(Collection.find).mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            populate: vi.fn().mockReturnValue({
              populate: vi.fn().mockResolvedValue(mockCollections),
            }),
          }),
        }),
      } as any);

      const result = await collectionService.list({ limit: 10 });

      expect(result.collections).toEqual(mockCollections);
      expect(result.nextCursor).toBe(null);
    });

    it('should filter by userId and isPublic', async () => {
      const userId = 'user123';
      const mockCollections = [{ _id: '1', name: 'My Collection' }];

      vi.mocked(Collection.find).mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            populate: vi.fn().mockReturnValue({
              populate: vi.fn().mockResolvedValue(mockCollections),
            }),
          }),
        }),
      } as any);

      await collectionService.list({ userId, isPublic: false, limit: 10 });

      expect(Collection.find).toHaveBeenCalledWith({
        owner: userId,
        isPublic: false,
      });
    });

    it('should handle cursor-based pagination', async () => {
      const cursor = 'cursor123';
      const mockCollections = [{ _id: '2', name: 'Collection 2' }];

      vi.mocked(Collection.find).mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            populate: vi.fn().mockReturnValue({
              populate: vi.fn().mockResolvedValue(mockCollections),
            }),
          }),
        }),
      } as any);

      await collectionService.list({ cursor, limit: 10 });

      expect(Collection.find).toHaveBeenCalledWith({
        _id: { $lt: cursor },
      });
    });
  });

  describe('quickCreate', () => {
    it('should create collection with minimal data', async () => {
      const userId = 'user123';
      const input = { name: 'Quick Collection' };

      vi.mocked(generateUniqueSlug).mockResolvedValue('quick-collection');
      
      const mockCollection = {
        _id: 'collection123',
        name: input.name,
        slug: 'quick-collection',
        owner: userId,
      };
      vi.mocked(Collection.create).mockResolvedValue([mockCollection] as any);

      const result = await collectionService.quickCreate(userId, input);

      expect(result).toEqual(mockCollection);
    });

    it('should handle duplicate names with unique slugs', async () => {
      const userId = 'user123';
      const input = { name: 'Duplicate Name' };

      vi.mocked(generateUniqueSlug).mockResolvedValue('duplicate-name-2');
      
      const mockCollection = {
        _id: 'collection123',
        name: input.name,
        slug: 'duplicate-name-2',
        owner: userId,
      };
      vi.mocked(Collection.create).mockResolvedValue([mockCollection] as any);

      const result = await collectionService.quickCreate(userId, input);

      expect(result.slug).toBe('duplicate-name-2');
    });

    it('should rollback on error', async () => {
      const userId = 'user123';
      const input = { name: 'Failed Collection' };

      vi.mocked(generateUniqueSlug).mockRejectedValue(new Error('Slug generation failed'));

      await expect(
        collectionService.quickCreate(userId, input)
      ).rejects.toThrow('Slug generation failed');

      expect(mockSession.abortTransaction).toHaveBeenCalled();
    });

    it('should create public collection when specified', async () => {
      const userId = 'user123';
      const input = { name: 'Public Collection', isPublic: true };

      vi.mocked(generateUniqueSlug).mockResolvedValue('public-collection');
      
      const mockCollection = {
        _id: 'collection123',
        name: input.name,
        slug: 'public-collection',
        owner: userId,
        isPublic: true,
      };
      vi.mocked(Collection.create).mockResolvedValue([mockCollection] as any);

      const result = await collectionService.quickCreate(userId, input);

      expect(Collection.create).toHaveBeenCalledWith(expect.objectContaining({
        isPublic: true,
      }));
      expect(result.isPublic).toBe(true);
    });
  });

  describe('checkNameAvailability', () => {
    it('should return available when no collection exists', async () => {
      const name = 'New Collection';
      const userId = 'user123';

      vi.mocked(Collection.findOne).mockResolvedValue(null);

      const result = await collectionService.checkNameAvailability(userId, name);

      expect(result.available).toBe(true);
    });

    it('should return existingId for exact match', async () => {
      const name = 'Existing Collection';
      const userId = 'user123';
      
      vi.mocked(generateSlug).mockReturnValue('existing-collection');
      
      const mockCollection = {
        _id: mockObjectId('collection123'),
        name,
        slug: 'existing-collection',
        owner: userId,
      };

      vi.mocked(Collection.findOne).mockReturnValue(createSessionableQuery(mockCollection) as any);

      const result = await collectionService.checkNameAvailability(userId, name);

      expect(result).toEqual({
        available: false,
        existingId: 'collection123',
      });
    });

    it('should suggest name when similar exists', async () => {
      const name = 'My Collection';
      const userId = 'user123';
      
      const mockCollections = [
        { name: 'My Collection' },
        { name: 'My Collection 2' },
      ];

      vi.mocked(Collection.findOne).mockResolvedValueOnce(mockCollections[0] as any)
        .mockResolvedValueOnce(mockCollections[1] as any)
        .mockResolvedValueOnce(null);

      const result = await collectionService.checkNameAvailability(userId, name);

      expect(result).toEqual({
        available: false,
        suggestedName: 'My Collection 3',
      });
    });

    it('should check ownership when checking availability', async () => {
      const name = 'Collection';
      const userId = 'user123';

      vi.mocked(Collection.findOne).mockResolvedValue(null);

      await collectionService.checkNameAvailability(name, userId);

      expect(Collection.findOne).toHaveBeenCalledWith({
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        owner: userId,
      });
    });
  });

  describe('setProductsForCollection', () => {
    it('should set products for collection atomically', async () => {
      const collectionId = 'collection123';
      const userId = 'user123';
      const productIds = ['product1', 'product2'];

      const mockCollection = {
        _id: collectionId,
        owner: userId,
        products: ['oldProduct'],
        productCount: 1,
        save: vi.fn().mockResolvedValue(true),
      };

      vi.mocked(Collection.findOne).mockReturnValue(createSessionableQuery(mockCollection) as any);

      const mockProducts = [{ _id: 'product1' }, { _id: 'product2' }];
      vi.mocked(Product.find).mockReturnValue(createChainableQuery(mockProducts) as any);

      await collectionService.setProductsForCollection(collectionId, userId, productIds);

      expect(mockCollection.products).toEqual(productIds);
      expect(mockCollection.productCount).toBe(2);
      expect(mockCollection.save).toHaveBeenCalled();
    });

    it('should handle empty product list', async () => {
      const collectionId = 'collection123';
      const userId = 'user123';

      const mockCollection = {
        _id: collectionId,
        owner: userId,
        products: ['product1', 'product2'],
        productCount: 2,
        save: vi.fn().mockResolvedValue(true),
      };

      vi.mocked(Collection.findOne).mockReturnValue(createSessionableQuery(mockCollection) as any);

      await collectionService.setProductsForCollection(collectionId, userId, []);

      expect(mockCollection.products).toEqual([]);
      expect(mockCollection.productCount).toBe(0);
    });

    it('should throw error if collection not found', async () => {
      vi.mocked(Collection.findOne).mockReturnValue(createSessionableQuery(null) as any);

      await expect(
        collectionService.setProductsForCollection('collection123', 'user123', [])
      ).rejects.toThrow('Collection not found or unauthorized');
    });

    it('should validate new product IDs', async () => {
      const mockCollection = {
        _id: 'collection123',
        owner: 'user123',
        products: [],
      };

      vi.mocked(Collection.findOne).mockReturnValue(createSessionableQuery(mockCollection) as any);
      vi.mocked(Product.find).mockReturnValue(createChainableQuery([]) as any);

      await expect(
        collectionService.setProductsForCollection('collection123', 'user123', ['invalid'])
      ).rejects.toThrow('One or more product IDs are invalid');
    });
  });
});