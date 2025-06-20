import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CollectionService } from '../services/collection.service.js';
import { Collection } from '../models/collection.model.js';
import { Product } from '../models/product.model.js';
import { AppError } from '../utils/AppError.js';
import { generateSlug, generateUniqueSlug } from '../utils/slugify.js';
import mongoose from 'mongoose';
import { 
  createMockSession, 
  createSessionableQuery, 
  createPopulatableQuery,
  createSelectableQuery,
  mockObjectId
} from './helpers/mongoose-mocks.js';

vi.mock('../models/collection.model');
vi.mock('../models/product.model');
vi.mock('../utils/slugify');

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
      vi.mocked(Product.find).mockReturnValue({
        select: vi.fn().mockResolvedValue(mockProducts),
      } as any);

      vi.mocked(generateUniqueSlug).mockResolvedValue('my-collection');

      const mockCollection = {
        _id: 'collection123',
        ...input,
        slug: 'my-collection',
        owner: userId,
      };
      vi.mocked(Collection.create).mockResolvedValue(mockCollection as any);

      const result = await collectionService.create(userId, input);

      expect(generateUniqueSlug).toHaveBeenCalledWith('My Collection', expect.any(Function));
      expect(Collection.create).toHaveBeenCalledWith({
        name: input.name,
        description: input.description,
        slug: 'my-collection',
        owner: userId,
        products: input.products,
        isPublic: input.isPublic,
      });
      expect(result).toEqual(mockCollection);
    });

    it('should throw error if invalid product IDs are provided', async () => {
      const userId = 'user123';
      const input = {
        name: 'My Collection',
        products: ['product1', 'invalid-product'],
        isPublic: true,
      };

      const mockProducts = [{ _id: 'product1' }];
      vi.mocked(Product.find).mockReturnValue({
        select: vi.fn().mockResolvedValue(mockProducts),
      } as any);

      await expect(collectionService.create(userId, input)).rejects.toThrow(AppError);
      await expect(collectionService.create(userId, input)).rejects.toThrow('One or more product IDs are invalid');
    });

    it('should create collection with empty products array', async () => {
      const userId = 'user123';
      const input = {
        name: 'Empty Collection',
        products: [],
        isPublic: true,
      };

      vi.mocked(generateUniqueSlug).mockResolvedValue('empty-collection');
      vi.mocked(Collection.create).mockResolvedValue({ _id: 'collection123' } as any);

      await collectionService.create(userId, input);

      expect(Product.find).not.toHaveBeenCalled();
      expect(Collection.create).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should update collection properties', async () => {
      const collectionId = 'collection123';
      const userId = 'user123';
      const input = {
        name: 'Updated Name',
        description: 'Updated description',
        isPublic: false,
      };

      const mockSession = {
        startTransaction: vi.fn(),
        commitTransaction: vi.fn(),
        abortTransaction: vi.fn(),
        endSession: vi.fn(),
      };

      const mockCollection = {
        _id: collectionId,
        name: 'Old Name',
        slug: 'old-name',
        owner: userId,
        save: vi.fn().mockResolvedValue(true),
      };

      vi.mocked(mongoose.startSession).mockReturnValue(mockSession as any);
      vi.mocked(Collection.findOne).mockReturnValue({
        session: vi.fn().mockResolvedValue(mockCollection),
      } as any);
      vi.mocked(generateUniqueSlug).mockResolvedValue('updated-name');

      await collectionService.update(collectionId, userId, input);

      expect(Collection.findOne).toHaveBeenCalledWith({
        _id: collectionId,
        owner: userId,
      });
      expect(generateUniqueSlug).toHaveBeenCalledWith('Updated Name', expect.any(Function));
      expect(mockCollection.save).toHaveBeenCalledWith({ session: mockSession });
      expect(mockCollection.slug).toBe('updated-name');
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

      vi.mocked(Collection.findOne).mockReturnValue(
        createSessionableQuery(mockCollection) as any
      );

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

      vi.mocked(Collection.deleteOne).mockResolvedValue({ deletedCount: 1 } as any);

      await collectionService.delete(collectionId, userId);

      expect(Collection.deleteOne).toHaveBeenCalledWith({
        _id: collectionId,
        owner: userId,
      });
    });

    it('should throw error if collection not found', async () => {
      vi.mocked(Collection.deleteOne).mockResolvedValue({ deletedCount: 0 } as any);

      await expect(
        collectionService.delete('collection123', 'user123')
      ).rejects.toThrow('Collection not found or unauthorized');
    });
  });

  describe('addProducts', () => {
    it('should add new products to collection', async () => {
      const collectionId = 'collection123';
      const userId = 'user123';
      const productIds = ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'];

      const mockCollection = {
        _id: collectionId,
        products: ['507f1f77bcf86cd799439001', '507f1f77bcf86cd799439002'],
        save: vi.fn().mockResolvedValue(true),
      };

      vi.mocked(Collection.findOne).mockResolvedValue(mockCollection as any);
      vi.mocked(Product.find).mockReturnValue({
        select: vi.fn().mockResolvedValue([{ _id: '507f1f77bcf86cd799439011' }, { _id: '507f1f77bcf86cd799439012' }]),
      } as any);

      await collectionService.addProducts(collectionId, userId, productIds);

      expect(mockCollection.products).toHaveLength(4);
      expect(mockCollection.save).toHaveBeenCalled();
    });

    it('should not add duplicate products', async () => {
      const collectionId = 'collection123';
      const userId = 'user123';
      const productIds = ['507f1f77bcf86cd799439001', '507f1f77bcf86cd799439013'];

      const mockCollection = {
        _id: collectionId,
        products: [{ toString: () => '507f1f77bcf86cd799439001' }, { toString: () => '507f1f77bcf86cd799439002' }],
        save: vi.fn().mockResolvedValue(true),
      };

      vi.mocked(Collection.findOne).mockResolvedValue(mockCollection as any);
      vi.mocked(Product.find).mockReturnValue({
        select: vi.fn().mockResolvedValue([{ _id: '507f1f77bcf86cd799439001' }, { _id: '507f1f77bcf86cd799439013' }]),
      } as any);

      await collectionService.addProducts(collectionId, userId, productIds);

      expect(mockCollection.products).toHaveLength(3);
    });

    it('should throw error if collection not found', async () => {
      vi.mocked(Collection.findOne).mockResolvedValue(null);

      await expect(
        collectionService.addProducts('collection123', 'user123', ['product1'])
      ).rejects.toThrow('Collection not found or unauthorized');
    });

    it('should throw error if invalid products provided', async () => {
      const mockCollection = { _id: 'collection123', products: [] };
      vi.mocked(Collection.findOne).mockResolvedValue(mockCollection as any);
      vi.mocked(Product.find).mockReturnValue({
        select: vi.fn().mockResolvedValue([]),
      } as any);

      await expect(
        collectionService.addProducts('collection123', 'user123', ['invalid'])
      ).rejects.toThrow('One or more product IDs are invalid');
    });
  });

  describe('removeProducts', () => {
    it('should remove products from collection', async () => {
      const collectionId = 'collection123';
      const userId = 'user123';
      const productIds = ['product1', 'product3'];

      const mockCollection = {
        _id: collectionId,
        products: [
          { toString: () => 'product1' },
          { toString: () => 'product2' },
          { toString: () => 'product3' },
        ],
        save: vi.fn().mockResolvedValue(true),
      };

      vi.mocked(Collection.findOne).mockResolvedValue(mockCollection as any);

      await collectionService.removeProducts(collectionId, userId, productIds);

      expect(mockCollection.products).toHaveLength(1);
      expect(mockCollection.products[0].toString()).toBe('product2');
      expect(mockCollection.save).toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    it('should return public collection', async () => {
      const mockCollection = {
        _id: 'collection123',
        isPublic: true,
        owner: { _id: 'user123' },
      };

      vi.mocked(Collection.findById).mockReturnValue({
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockResolvedValue(mockCollection),
        }),
      } as any);

      const result = await collectionService.getById('collection123', 'otheruser');

      expect(result).toEqual(mockCollection);
    });

    it('should return private collection for owner', async () => {
      const mockCollection = {
        _id: 'collection123',
        isPublic: false,
        owner: { _id: 'user123' },
      };

      vi.mocked(Collection.findById).mockReturnValue({
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockResolvedValue(mockCollection),
        }),
      } as any);

      const result = await collectionService.getById('collection123', 'user123');

      expect(result).toEqual(mockCollection);
    });

    it('should throw error for private collection accessed by non-owner', async () => {
      const mockCollection = {
        _id: 'collection123',
        isPublic: false,
        owner: { _id: { toString: () => 'user123' } },
      };

      vi.mocked(Collection.findById).mockReturnValue({
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockResolvedValue(mockCollection),
        }),
      } as any);

      await expect(
        collectionService.getById('collection123', 'otheruser')
      ).rejects.toThrow('Collection is private');
    });

    it('should return null if collection not found', async () => {
      vi.mocked(Collection.findById).mockReturnValue({
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockResolvedValue(null),
        }),
      } as any);

      const result = await collectionService.getById('collection123');

      expect(result).toBeNull();
    });
  });

  describe('list', () => {
    it('should list collections with pagination', async () => {
      const mockCollections = [
        { _id: 'collection1', name: 'Collection 1' },
        { _id: 'collection2', name: 'Collection 2' },
        { _id: 'collection3', name: 'Collection 3' },
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

      const result = await collectionService.list({
        limit: 2,
      });

      expect(Collection.find).toHaveBeenCalledWith({});
      expect(result.collections).toHaveLength(2);
      expect(result.nextCursor).toBe('collection3');
    });

    it('should filter by userId and isPublic', async () => {
      vi.mocked(Collection.find).mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            populate: vi.fn().mockReturnValue({
              populate: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      } as any);

      await collectionService.list({
        userId: 'user123',
        isPublic: true,
        limit: 10,
      });

      expect(Collection.find).toHaveBeenCalledWith({
        owner: 'user123',
        isPublic: true,
      });
    });

    it('should handle cursor-based pagination', async () => {
      vi.mocked(Collection.find).mockReturnValue({
        sort: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            populate: vi.fn().mockReturnValue({
              populate: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      } as any);

      await collectionService.list({
        limit: 10,
        cursor: 'lastId',
      });

      expect(Collection.find).toHaveBeenCalledWith({
        _id: { $lt: 'lastId' },
      });
    });
  });

  describe('quickCreate', () => {
    it('should create collection with minimal data', async () => {
      const userId = 'user123';
      const mockSession = {
        startTransaction: vi.fn(),
        commitTransaction: vi.fn(),
        abortTransaction: vi.fn(),
        endSession: vi.fn(),
      };
      
      vi.mocked(mongoose.startSession).mockReturnValue(mockSession as any);
      vi.mocked(generateSlug).mockReturnValue('summer-sale');
      vi.mocked(generateUniqueSlug).mockResolvedValue('summer-sale');
      vi.mocked(Collection.findOne).mockResolvedValue(null);
      vi.mocked(Collection.create).mockResolvedValue([{
        _id: 'collection123',
        name: 'Summer Sale',
        slug: 'summer-sale',
        description: '',
        owner: userId,
        products: [],
        isPublic: false,
      }] as any);

      const result = await collectionService.quickCreate(userId, {
        name: 'Summer Sale',
      });
      
      expect(result.name).toBe('Summer Sale');
      expect(result.slug).toBe('summer-sale');
      expect(result.isPublic).toBe(false);
      expect(result.description).toBe('');
      expect(result.products).toHaveLength(0);
      expect(mockSession.commitTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
    });

    it('should handle duplicate names with unique slugs', async () => {
      const userId = 'user123';
      const mockSession = {
        startTransaction: vi.fn(),
        commitTransaction: vi.fn(),
        abortTransaction: vi.fn(),
        endSession: vi.fn(),
      };
      
      vi.mocked(mongoose.startSession).mockReturnValue(mockSession as any);
      vi.mocked(generateSlug).mockReturnValue('sale');
      vi.mocked(Collection.findOne)
        .mockResolvedValueOnce({ slug: 'sale' } as any)
        .mockResolvedValueOnce(null);
      vi.mocked(generateUniqueSlug).mockResolvedValue('sale-1');
      vi.mocked(Collection.create).mockResolvedValue([{
        _id: 'collection123',
        name: 'Sale',
        slug: 'sale-1',
      }] as any);

      const result = await collectionService.quickCreate(userId, { name: 'Sale' });
      
      expect(result.slug).toBe('sale-1');
    });

    it('should rollback on error', async () => {
      const userId = 'user123';
      const mockSession = {
        startTransaction: vi.fn(),
        commitTransaction: vi.fn(),
        abortTransaction: vi.fn(),
        endSession: vi.fn(),
      };
      
      vi.mocked(mongoose.startSession).mockReturnValue(mockSession as any);
      vi.mocked(Collection.create).mockRejectedValue(new Error('Database error'));

      await expect(
        collectionService.quickCreate(userId, { name: 'Test' })
      ).rejects.toThrow('Database error');
      
      expect(mockSession.abortTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
    });

    it('should create public collection when specified', async () => {
      const userId = 'user123';
      const mockSession = {
        startTransaction: vi.fn(),
        commitTransaction: vi.fn(),
        abortTransaction: vi.fn(),
        endSession: vi.fn(),
      };
      
      vi.mocked(mongoose.startSession).mockReturnValue(mockSession as any);
      vi.mocked(generateSlug).mockReturnValue('public-collection');
      vi.mocked(generateUniqueSlug).mockResolvedValue('public-collection');
      vi.mocked(Collection.create).mockResolvedValue([{
        _id: 'collection123',
        name: 'Public Collection',
        slug: 'public-collection',
        isPublic: true,
      }] as any);

      const result = await collectionService.quickCreate(userId, {
        name: 'Public Collection',
        isPublic: true,
      });
      
      expect(result.isPublic).toBe(true);
    });
  });

  describe('checkNameAvailability', () => {
    it('should return available when no collection exists', async () => {
      const userId = 'user123';
      vi.mocked(generateSlug).mockReturnValue('new-collection');
      vi.mocked(Collection.findOne).mockResolvedValue(null);

      const result = await collectionService.checkNameAvailability(userId, 'New Collection');
      
      expect(result).toEqual({ available: true });
    });

    it('should return existingId for exact match', async () => {
      const userId = 'user123';
      vi.mocked(generateSlug).mockReturnValue('my-collection');
      vi.mocked(Collection.findOne)
        .mockResolvedValueOnce({
          _id: { toString: () => 'collection123' },
          slug: 'my-collection',
        } as any)
        .mockResolvedValueOnce(null);

      const result = await collectionService.checkNameAvailability(userId, 'My Collection');
      
      expect(result).toEqual({
        available: false,
        existingId: 'collection123',
      });
    });

    it('should suggest name when similar exists', async () => {
      const userId = 'user123';
      vi.mocked(generateSlug).mockReturnValue('sale');
      vi.mocked(Collection.findOne)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ slug: 'sale', _id: mockObjectId('123') } as any);
      vi.mocked(Collection.countDocuments).mockResolvedValue(3);

      const result = await collectionService.checkNameAvailability(userId, 'Sale');
      
      expect(result).toEqual({
        available: false,
        suggestedName: 'Sale 4',
      });
    });

    it('should check ownership when checking availability', async () => {
      const userId = 'user123';
      vi.mocked(generateSlug).mockReturnValue('test');
      vi.mocked(Collection.findOne)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      await collectionService.checkNameAvailability(userId, 'Test');
      
      expect(Collection.findOne).toHaveBeenCalledWith({
        slug: 'test',
        owner: userId,
      });
    });
  });

  describe('setProductsForCollection', () => {
    it('should set products for collection atomically', async () => {
      const collectionId = 'collection123';
      const userId = 'user123';
      const newProductIds = ['product2', 'product3'];
      
      const mockCollection = {
        _id: mockObjectId(collectionId),
        owner: mockObjectId(userId),
        products: [mockObjectId('product1'), mockObjectId('product2')],
        save: vi.fn().mockResolvedValue(true),
      };
      
      vi.mocked(Collection.findOne).mockReturnValue(
        createSessionableQuery(mockCollection) as ReturnType<typeof Collection.findOne>
      );
      
      vi.mocked(Product.find).mockReturnValue(
        createSelectableQuery([
          { _id: mockObjectId('product3') }
        ]) as unknown as ReturnType<typeof Product.find>
      );
      
      vi.mocked(Product.updateMany).mockResolvedValue({ modifiedCount: 1 } as any);
      
      vi.mocked(Collection.findById).mockReturnValue(
        createPopulatableQuery({
          ...mockCollection,
          _id: collectionId,
        }) as ReturnType<typeof Collection.findById>
      );
      
      await collectionService.setProductsForCollection(
        collectionId,
        userId,
        newProductIds
      );
      
      expect(Product.updateMany).toHaveBeenCalledWith(
        { _id: { $in: ['product1'] } },
        { $unset: { collectionId: 1 } },
        { session: mockSession }
      );
      
      expect(Product.updateMany).toHaveBeenCalledWith(
        { _id: { $in: ['product3'] } },
        { $set: { collectionId: mockCollection._id } },
        { session: mockSession }
      );
      
      expect(mockCollection.save).toHaveBeenCalledWith({ session: mockSession });
      expect(mockSession.commitTransaction).toHaveBeenCalled();
    });

    it('should handle empty product list', async () => {
      const collectionId = 'collection123';
      const userId = 'user123';
      
      const mockCollection = {
        _id: mockObjectId(collectionId),
        owner: mockObjectId(userId),
        products: [mockObjectId('product1'), mockObjectId('product2')],
        save: vi.fn().mockResolvedValue(true),
      };
      
      vi.mocked(Collection.findOne).mockReturnValue(
        createSessionableQuery(mockCollection) as ReturnType<typeof Collection.findOne>
      );
      
      vi.mocked(Product.updateMany).mockResolvedValue({ modifiedCount: 2 } as any);
      
      vi.mocked(Collection.findById).mockReturnValue(
        createPopulatableQuery({
          ...mockCollection,
          products: [],
        }) as ReturnType<typeof Collection.findById>
      );
      
      await collectionService.setProductsForCollection(collectionId, userId, []);
      
      expect(Product.updateMany).toHaveBeenCalledWith(
        { _id: { $in: ['product1', 'product2'] } },
        { $unset: { collectionId: 1 } },
        { session: mockSession }
      );
      
      expect(mockCollection.save).toHaveBeenCalled();
    });

    it('should throw error if collection not found', async () => {
      vi.mocked(Collection.findOne).mockReturnValue(
        createSessionableQuery(null) as ReturnType<typeof Collection.findOne>
      );
      
      await expect(
        collectionService.setProductsForCollection('collection123', 'user123', [])
      ).rejects.toThrow('Collection not found or unauthorized');
      
      expect(mockSession.abortTransaction).toHaveBeenCalled();
    });

    it('should validate new product IDs', async () => {
      const collectionId = 'collection123';
      const userId = 'user123';
      
      const mockCollection = {
        _id: mockObjectId(collectionId),
        owner: mockObjectId(userId),
        products: [],
        save: vi.fn(),
      };
      
      vi.mocked(Collection.findOne).mockReturnValue(
        createSessionableQuery(mockCollection) as ReturnType<typeof Collection.findOne>
      );
      
      vi.mocked(Product.find).mockReturnValue(
        createSelectableQuery([]) as unknown as ReturnType<typeof Product.find>
      );
      
      await expect(
        collectionService.setProductsForCollection(collectionId, userId, ['invalid-product'])
      ).rejects.toThrow('One or more product IDs are invalid');
      
      expect(mockSession.abortTransaction).toHaveBeenCalled();
    });
  });
});