import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CollectionService } from '../services/collection.service.js';
import { Collection, type ICollection } from '../models/collection.model.js';
import { Product } from '../models/product.model.js';
import { AppError } from '../utils/AppError.js';
import { generateSlug, generateUniqueSlug } from '../utils/slugify.js';
import { 
  createMockSession, 
  createSessionableQuery, 
  createChainableQuery,
  mockObjectId,
} from './helpers/mongoose-mocks.js';
import { 
  TypedMockUtils,
} from './helpers/typed-mock-utils.js';

vi.mock('../models/collection.model');
vi.mock('../models/product.model');
vi.mock('../utils/slugify');
vi.mock('../utils/escapeRegex', () => ({
  escapeRegExp: vi.fn((str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
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
      const mockProductFind = TypedMockUtils.createProductFindMock(mockProducts);
      TypedMockUtils.bindMockToModel(Product, 'find', mockProductFind);

      vi.mocked(generateUniqueSlug).mockResolvedValue('my-collection');
      vi.mocked(generateSlug).mockReturnValue('my-collection');

      const mockCollection = {
        _id: mockObjectId('collection123'),
        ...input,
        slug: 'my-collection',
        owner: mockObjectId(userId),
        save: vi.fn().mockResolvedValue(true),
      } as const;
      
      // Mock the collection constructor to return our mock
      const CollectionConstructor = vi.fn().mockImplementation(() => mockCollection);
      const mockedCollection = vi.mocked(Collection);
      Object.defineProperty(mockedCollection, 'prototype', {
        value: CollectionConstructor,
        writable: true,
        configurable: true,
      });
      
      // Mock Collection.create to return an array (as it does with sessions)
      const mockCollectionCreate = TypedMockUtils.createCollectionCreateMock([mockCollection as unknown as ICollection]);
      TypedMockUtils.bindMockToModel(Collection, 'create', mockCollectionCreate);
      
      // Mock findById for the populated result
      const mockCollectionFindById = TypedMockUtils.createCollectionFindByIdMock(mockCollection as unknown as ICollection);
      TypedMockUtils.bindMockToModel(Collection, 'findById', mockCollectionFindById);

      const result = await collectionService.create(userId, input);

      const generateUniqueSlugMock = vi.mocked(generateUniqueSlug);
      void expect(generateUniqueSlugMock).toHaveBeenCalledWith('My Collection', expect.any(Function));
      const collectionCreateMock = vi.mocked(Collection.create);
      void expect(collectionCreateMock).toHaveBeenCalledWith({
        name: input.name,
        description: input.description,
        slug: 'my-collection',
        owner: userId,
        products: input.products,
        isPublic: input.isPublic,
        productCount: input.products.length,
      });
      void expect(result).toEqual(mockCollection);
    });

    it('should throw error if invalid product IDs are provided', async () => {
      const userId = 'user123';
      const input = {
        name: 'My Collection',
        products: ['product1', 'invalid'],
        isPublic: false,
      };

      const mockProducts = [{ _id: 'product1' }];
      const mockProductFind = TypedMockUtils.createProductFindMock(mockProducts);
      TypedMockUtils.bindMockToModel(Product, 'find', mockProductFind);

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
        _id: mockObjectId('collection123'),
        name: input.name,
        slug: 'empty-collection',
        owner: mockObjectId(userId),
        products: [],
        productCount: 0,
        description: '',
        isPublic: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const mockCollectionCreate = TypedMockUtils.createCollectionCreateMock([mockCollection]);
      TypedMockUtils.bindMockToModel(Collection, 'create', mockCollectionCreate);

      const result = await collectionService.create(userId, input);

      const productFindMock = vi.mocked(Product.find);
      void expect(productFindMock).not.toHaveBeenCalled();
      void expect(result).toEqual(mockCollection);
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

      const mockCollectionFindOne = TypedMockUtils.createCollectionFindOneMock(mockCollection as unknown as ICollection);
      TypedMockUtils.bindMockToModel(Collection, 'findOne', mockCollectionFindOne);
      vi.mocked(generateUniqueSlug).mockResolvedValue('updated-name');

      await collectionService.update(collectionId, userId, input);

      void expect(mockCollection.name).toBe('Updated Name');
      void expect(mockCollection.save).toHaveBeenCalled();
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

      const mockCollectionFindOne = TypedMockUtils.createCollectionFindOneMock(mockCollection as unknown as ICollection);
      TypedMockUtils.bindMockToModel(Collection, 'findOne', mockCollectionFindOne);

      await collectionService.update(collectionId, userId, input);

      void expect(generateUniqueSlug).not.toHaveBeenCalled();
      void expect(mockCollection.slug).toBe('my-collection');
    });

    it('should throw error if collection not found or unauthorized', async () => {
      const mockCollectionFindOne = TypedMockUtils.createCollectionFindOneMock(null);
      TypedMockUtils.bindMockToModel(Collection, 'findOne', mockCollectionFindOne);

      await expect(
        collectionService.update('collection123', 'user123', { name: 'New Name' }),
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

      const mockCollectionFindOne = TypedMockUtils.createCollectionFindOneMock(mockCollection as unknown as ICollection);
      TypedMockUtils.bindMockToModel(Collection, 'findOne', mockCollectionFindOne);
      const mockProductUpdateMany = vi.fn().mockResolvedValue({ modifiedCount: 2 });
      TypedMockUtils.bindMockToModel(Product, 'updateMany', mockProductUpdateMany);

      await collectionService.delete(collectionId, userId);

      void expect(Collection.findOne).toHaveBeenCalledWith({
        _id: collectionId,
        owner: userId,
      });
      void expect(Product.updateMany).toHaveBeenCalledWith(
        { _id: { $in: mockCollection.products } },
        { $unset: { collectionId: 1 } },
        { session: mockSession },
      );
      void expect(mockCollection.deleteOne).toHaveBeenCalledWith({ session: mockSession });
    });

    it('should throw error if collection not found', async () => {
      vi.mocked(Collection.findOne).mockReturnValue(createSessionableQuery(null) as any);

      await expect(
        collectionService.delete('collection123', 'user123'),
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

      const mockCollectionFindOne = TypedMockUtils.createCollectionFindOneMock(mockCollection as unknown as ICollection);
      TypedMockUtils.bindMockToModel(Collection, 'findOne', mockCollectionFindOne);

      const mockProducts = [{ _id: 'product3' }, { _id: 'product4' }];
      const mockProductFind = TypedMockUtils.createProductFindMock(mockProducts);
      TypedMockUtils.bindMockToModel(Product, 'find', mockProductFind);

      await collectionService.addProducts(collectionId, userId, productIds);

      void expect(mockCollection.products).toEqual(['product1', 'product2', 'product3', 'product4']);
      void expect(mockCollection.productCount).toBe(4);
      void expect(mockCollection.save).toHaveBeenCalled();
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

      const mockCollectionFindOne = TypedMockUtils.createCollectionFindOneMock(mockCollection as unknown as ICollection);
      TypedMockUtils.bindMockToModel(Collection, 'findOne', mockCollectionFindOne);

      const mockProducts = [{ _id: 'product1' }, { _id: 'product3' }];
      const mockProductFind = TypedMockUtils.createProductFindMock(mockProducts);
      TypedMockUtils.bindMockToModel(Product, 'find', mockProductFind);

      await collectionService.addProducts(collectionId, userId, productIds);

      void expect(mockCollection.products).toEqual(['product1', 'product2', 'product3']);
      void expect(mockCollection.productCount).toBe(3);
    });

    it('should throw error if collection not found', async () => {
      vi.mocked(Collection.findOne).mockReturnValue(createSessionableQuery(null) as any);

      await expect(
        collectionService.addProducts('collection123', 'user123', ['product1']),
      ).rejects.toThrow('Collection not found or unauthorized');
    });

    it('should throw error if invalid products provided', async () => {
      const mockCollection = {
        _id: 'collection123',
        owner: 'user123',
        products: [],
      };

      const mockCollectionFindOne = TypedMockUtils.createCollectionFindOneMock(mockCollection as unknown as ICollection);
      TypedMockUtils.bindMockToModel(Collection, 'findOne', mockCollectionFindOne);
      vi.mocked(Product.find).mockReturnValue(createChainableQuery([]) as any);

      await expect(
        collectionService.addProducts('collection123', 'user123', ['invalid']),
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

      const mockCollectionFindOne = TypedMockUtils.createCollectionFindOneMock(mockCollection as unknown as ICollection);
      TypedMockUtils.bindMockToModel(Collection, 'findOne', mockCollectionFindOne);

      await collectionService.removeProducts(collectionId, userId, productIds);

      void expect(mockCollection.products).toEqual(['product1', 'product3']);
      void expect(mockCollection.productCount).toBe(2);
      void expect(mockCollection.save).toHaveBeenCalled();
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

      const mockCollectionFindOne = TypedMockUtils.createCollectionFindOneMock(mockCollection as unknown as ICollection);
      TypedMockUtils.bindMockToModel(Collection, 'findOne', mockCollectionFindOne);

      const result = await collectionService.getById(collectionId);

      void expect(result).toEqual(mockCollection);
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

      const mockCollectionFindOne = TypedMockUtils.createCollectionFindOneMock(mockCollection as unknown as ICollection);
      TypedMockUtils.bindMockToModel(Collection, 'findOne', mockCollectionFindOne);

      const result = await collectionService.getById(collectionId, userId);

      void expect(result).toEqual(mockCollection);
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

      const mockCollectionFindOne = TypedMockUtils.createCollectionFindOneMock(mockCollection as unknown as ICollection);
      TypedMockUtils.bindMockToModel(Collection, 'findOne', mockCollectionFindOne);

      await expect(
        collectionService.getById(collectionId, userId),
      ).rejects.toThrow('Collection is private');
    });

    it('should return null if collection not found', async () => {
      vi.mocked(Collection.findOne).mockReturnValue({
        populate: vi.fn().mockReturnValue({
          populate: vi.fn().mockResolvedValue(null),
        }),
      } as any);

      const result = await collectionService.getById('nonexistent');

      void expect(result).toBeNull();
    });
  });

  describe('list', () => {
    it('should list collections with pagination', async () => {
      const mockCollections = [
        { _id: '1', name: 'Collection 1' },
        { _id: '2', name: 'Collection 2' },
      ];

      const mockCollectionFind = TypedMockUtils.createCollectionFindMock(mockCollections as unknown as ICollection[]);
      TypedMockUtils.bindMockToModel(Collection, 'find', mockCollectionFind);

      const result = await collectionService.list({ limit: 10 });

      void expect(result.collections).toEqual(mockCollections);
      void expect(result.nextCursor).toBe(null);
    });

    it('should filter by userId and isPublic', async () => {
      const userId = 'user123';
      const mockCollections = [{ _id: '1', name: 'My Collection' }];

      const mockCollectionFind = TypedMockUtils.createCollectionFindMock(mockCollections as unknown as ICollection[]);
      TypedMockUtils.bindMockToModel(Collection, 'find', mockCollectionFind);

      await collectionService.list({ userId, isPublic: false, limit: 10 });

      void expect(Collection.find).toHaveBeenCalledWith({
        owner: userId,
        isPublic: false,
      });
    });

    it('should handle cursor-based pagination', async () => {
      const cursor = 'cursor123';
      const mockCollections = [{ _id: '2', name: 'Collection 2' }];

      const mockCollectionFind = TypedMockUtils.createCollectionFindMock(mockCollections as unknown as ICollection[]);
      TypedMockUtils.bindMockToModel(Collection, 'find', mockCollectionFind);

      await collectionService.list({ cursor, limit: 10 });

      void expect(Collection.find).toHaveBeenCalledWith({
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
      const mockCollectionCreate = TypedMockUtils.createCollectionCreateMock([mockCollection as unknown as ICollection]);
      TypedMockUtils.bindMockToModel(Collection, 'create', mockCollectionCreate);

      const result = await collectionService.quickCreate(userId, input);

      void expect(result).toEqual(mockCollection);
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
      const mockCollectionCreate = TypedMockUtils.createCollectionCreateMock([mockCollection as unknown as ICollection]);
      TypedMockUtils.bindMockToModel(Collection, 'create', mockCollectionCreate);

      const result = await collectionService.quickCreate(userId, input);

      void expect(result.slug).toBe('duplicate-name-2');
    });

    it('should rollback on error', async () => {
      const userId = 'user123';
      const input = { name: 'Failed Collection' };

      vi.mocked(generateUniqueSlug).mockRejectedValue(new Error('Slug generation failed'));

      await expect(
        collectionService.quickCreate(userId, input),
      ).rejects.toThrow('Slug generation failed');

      void expect(mockSession.abortTransaction).toHaveBeenCalled();
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
      const mockCollectionCreate = TypedMockUtils.createCollectionCreateMock([mockCollection as unknown as ICollection]);
      TypedMockUtils.bindMockToModel(Collection, 'create', mockCollectionCreate);

      const result = await collectionService.quickCreate(userId, input);

      void expect(Collection.create).toHaveBeenCalledWith(expect.objectContaining({
        isPublic: true,
      }));
      void expect(result.isPublic).toBe(true);
    });
  });

  describe('checkNameAvailability', () => {
    it('should return available when no collection exists', async () => {
      const name = 'New Collection';
      const userId = 'user123';

      const mockCollectionFindOne = TypedMockUtils.createCollectionFindOneMock(null);
      TypedMockUtils.bindMockToModel(Collection, 'findOne', mockCollectionFindOne);

      const result = await collectionService.checkNameAvailability(userId, name);

      void expect(result.available).toBe(true);
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

      const mockCollectionFindOne = TypedMockUtils.createCollectionFindOneMock(mockCollection as unknown as ICollection);
      TypedMockUtils.bindMockToModel(Collection, 'findOne', mockCollectionFindOne);

      const result = await collectionService.checkNameAvailability(userId, name);

      void expect(result).toEqual({
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

      void expect(result).toEqual({
        available: false,
        suggestedName: 'My Collection 3',
      });
    });

    it('should check ownership when checking availability', async () => {
      const name = 'Collection';
      const userId = 'user123';

      const mockCollectionFindOne = TypedMockUtils.createCollectionFindOneMock(null);
      TypedMockUtils.bindMockToModel(Collection, 'findOne', mockCollectionFindOne);

      await collectionService.checkNameAvailability(name, userId);

      void expect(Collection.findOne).toHaveBeenCalledWith({
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

      const mockCollectionFindOne = TypedMockUtils.createCollectionFindOneMock(mockCollection as unknown as ICollection);
      TypedMockUtils.bindMockToModel(Collection, 'findOne', mockCollectionFindOne);

      const mockProducts = [{ _id: 'product1' }, { _id: 'product2' }];
      const mockProductFind = TypedMockUtils.createProductFindMock(mockProducts);
      TypedMockUtils.bindMockToModel(Product, 'find', mockProductFind);

      await collectionService.setProductsForCollection(collectionId, userId, productIds);

      void expect(mockCollection.products).toEqual(productIds);
      void expect(mockCollection.productCount).toBe(2);
      void expect(mockCollection.save).toHaveBeenCalled();
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

      const mockCollectionFindOne = TypedMockUtils.createCollectionFindOneMock(mockCollection as unknown as ICollection);
      TypedMockUtils.bindMockToModel(Collection, 'findOne', mockCollectionFindOne);

      await collectionService.setProductsForCollection(collectionId, userId, []);

      void expect(mockCollection.products).toEqual([]);
      void expect(mockCollection.productCount).toBe(0);
    });

    it('should throw error if collection not found', async () => {
      vi.mocked(Collection.findOne).mockReturnValue(createSessionableQuery(null) as any);

      await expect(
        collectionService.setProductsForCollection('collection123', 'user123', []),
      ).rejects.toThrow('Collection not found or unauthorized');
    });

    it('should validate new product IDs', async () => {
      const mockCollection = {
        _id: 'collection123',
        owner: 'user123',
        products: [],
      };

      const mockCollectionFindOne = TypedMockUtils.createCollectionFindOneMock(mockCollection as unknown as ICollection);
      TypedMockUtils.bindMockToModel(Collection, 'findOne', mockCollectionFindOne);
      vi.mocked(Product.find).mockReturnValue(createChainableQuery([]) as any);

      await expect(
        collectionService.setProductsForCollection('collection123', 'user123', ['invalid']),
      ).rejects.toThrow('One or more product IDs are invalid');
    });
  });
});