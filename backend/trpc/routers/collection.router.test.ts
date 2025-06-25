import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TRPCError } from '@trpc/server';
import { appRouter } from './app.router.js';
import { collectionService } from '../../services/collection.service.js';
import type { Request, Response } from 'express';

vi.mock('../../services/collection.service');

describe('collectionRouter', () => {
  let caller: ReturnType<typeof appRouter.createCaller>;
  let authedCaller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(() => {
    vi.clearAllMocks();
    
    caller = appRouter.createCaller({
      req: { cookies: {} } as Request,
      res: {
        cookie: vi.fn(),
        clearCookie: vi.fn(),
      } as unknown as Response,
      user: null,
    });

    authedCaller = appRouter.createCaller({
      user: { _id: 'user123', role: 'customer' },
      req: { cookies: {} },
      res: {
        cookie: vi.fn(),
        clearCookie: vi.fn(),
      },
    } as any);
  });

  describe('create', () => {
    it('should create a collection when authenticated', async () => {
      const input = {
        name: 'My Collection',
        description: 'Test description',
        isPublic: true,
        products: ['507f1f77bcf86cd799439001', '507f1f77bcf86cd799439002'],
      };

      const mockCollection = {
        _id: 'collection123',
        ...input,
        slug: 'my-collection',
        owner: 'user123',
      };

      vi.mocked(collectionService.create).mockResolvedValue(mockCollection as any);

      const result = await authedCaller.collection.create(input);

      void expect(collectionService.create).toHaveBeenCalledWith('user123', input);
      void expect(result).toEqual(mockCollection);
    });

    it('should throw UNAUTHORIZED error when not authenticated', async () => {
      const input = {
        name: 'My Collection',
        products: [],
      };

      await expect(caller.collection.create(input)).rejects.toThrow(TRPCError);
      await expect(caller.collection.create(input)).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });
    });

    it('should handle service errors properly', async () => {
      const input = { name: 'My Collection', products: ['507f1f77bcf86cd799439999'] };
      
      vi.mocked(collectionService.create).mockRejectedValue(
        new Error('One or more product IDs are invalid'),
      );

      await expect(authedCaller.collection.create(input)).rejects.toThrow(TRPCError);
    });
  });

  describe('update', () => {
    it('should update a collection when authenticated', async () => {
      const input = {
        id: 'collection123',
        data: {
          name: 'Updated Collection',
          isPublic: false,
        },
      };

      const mockUpdatedCollection = {
        _id: 'collection123',
        name: 'Updated Collection',
        isPublic: false,
        owner: 'user123',
      };

      vi.mocked(collectionService.update).mockResolvedValue(mockUpdatedCollection as any);

      const result = await authedCaller.collection.update(input);

      void expect(collectionService.update).toHaveBeenCalledWith(
        'collection123',
        'user123',
        input.data,
      );
      void expect(result).toEqual(mockUpdatedCollection);
    });

    it('should throw NOT_FOUND error when collection not found', async () => {
      const input = {
        id: 'nonexistent',
        data: { name: 'Updated' },
      };

      const error = new Error('Collection not found or unauthorized');
      (error as any).statusCode = 404;

      vi.mocked(collectionService.update).mockRejectedValue(error);

      await expect(authedCaller.collection.update(input)).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    });
  });

  describe('delete', () => {
    it('should delete a collection when authenticated', async () => {
      vi.mocked(collectionService.delete).mockResolvedValue();

      const result = await authedCaller.collection.delete({ id: 'collection123' });

      void expect(collectionService.delete).toHaveBeenCalledWith('collection123', 'user123');
      void expect(result).toEqual({ success: true });
    });
  });

  describe('addProducts', () => {
    it('should add products to collection', async () => {
      const input = {
        collectionId: 'collection123',
        productIds: ['507f1f77bcf86cd799439001', '507f1f77bcf86cd799439002'],
      };

      const mockUpdatedCollection = {
        _id: 'collection123',
        products: ['507f1f77bcf86cd799439000', '507f1f77bcf86cd799439001', '507f1f77bcf86cd799439002'],
      };

      vi.mocked(collectionService.addProducts).mockResolvedValue(mockUpdatedCollection as any);

      const result = await authedCaller.collection.addProducts(input);

      void expect(collectionService.addProducts).toHaveBeenCalledWith(
        'collection123',
        'user123',
        ['507f1f77bcf86cd799439001', '507f1f77bcf86cd799439002'],
      );
      void expect(result).toEqual(mockUpdatedCollection);
    });

    it('should handle invalid product IDs', async () => {
      const input = {
        collectionId: 'collection123',
        productIds: ['507f1f77bcf86cd799439999'],
      };

      const error = new Error('One or more product IDs are invalid');
      (error as any).statusCode = 400;

      vi.mocked(collectionService.addProducts).mockRejectedValue(error);

      await expect(authedCaller.collection.addProducts(input)).rejects.toMatchObject({
        code: 'BAD_REQUEST',
      });
    });
  });

  describe('removeProducts', () => {
    it('should remove products from collection', async () => {
      const input = {
        collectionId: 'collection123',
        productIds: ['507f1f77bcf86cd799439001'],
      };

      const mockUpdatedCollection = {
        _id: 'collection123',
        products: ['507f1f77bcf86cd799439002'],
      };

      vi.mocked(collectionService.removeProducts).mockResolvedValue(mockUpdatedCollection as any);

      const result = await authedCaller.collection.removeProducts(input);

      void expect(collectionService.removeProducts).toHaveBeenCalledWith(
        'collection123',
        'user123',
        ['507f1f77bcf86cd799439001'],
      );
      void expect(result).toEqual(mockUpdatedCollection);
    });
  });

  describe('getById', () => {
    it('should get public collection without authentication', async () => {
      const mockCollection = {
        _id: 'collection123',
        name: 'Public Collection',
        isPublic: true,
      };

      vi.mocked(collectionService.getById).mockResolvedValue(mockCollection as any);

      const result = await caller.collection.getById({ id: 'collection123' });

      void expect(collectionService.getById).toHaveBeenCalledWith('collection123', undefined);
      void expect(result).toEqual(mockCollection);
    });

    it('should get private collection when owner', async () => {
      const mockCollection = {
        _id: 'collection123',
        name: 'Private Collection',
        isPublic: false,
        owner: 'user123',
      };

      vi.mocked(collectionService.getById).mockResolvedValue(mockCollection as any);

      const result = await authedCaller.collection.getById({ id: 'collection123' });

      void expect(collectionService.getById).toHaveBeenCalledWith('collection123', 'user123');
      void expect(result).toEqual(mockCollection);
    });

    it('should throw NOT_FOUND when collection not found', async () => {
      vi.mocked(collectionService.getById).mockResolvedValue(null);

      await expect(caller.collection.getById({ id: 'nonexistent' })).rejects.toMatchObject({
        code: 'NOT_FOUND',
      });
    });

    it('should throw FORBIDDEN for private collection accessed by non-owner', async () => {
      const error = new Error('Collection is private');
      (error as any).statusCode = 403;

      vi.mocked(collectionService.getById).mockRejectedValue(error);

      await expect(caller.collection.getById({ id: 'collection123' })).rejects.toMatchObject({
        code: 'FORBIDDEN',
      });
    });
  });

  describe('getBySlug', () => {
    it('should get collection by slug', async () => {
      const mockCollection = {
        _id: 'collection123',
        name: 'My Collection',
        slug: 'my-collection',
        isPublic: true,
      };

      vi.mocked(collectionService.getBySlug).mockResolvedValue(mockCollection as any);

      const result = await caller.collection.getBySlug({ slug: 'my-collection' });

      void expect(collectionService.getBySlug).toHaveBeenCalledWith('my-collection', undefined);
      void expect(result).toEqual(mockCollection);
    });
  });

  describe('list', () => {
    it('should list collections with default parameters', async () => {
      const mockResult = {
        collections: [
          { _id: 'collection1', name: 'Collection 1' },
          { _id: 'collection2', name: 'Collection 2' },
        ],
        nextCursor: null,
      };

      vi.mocked(collectionService.list).mockResolvedValue(mockResult as any);

      const result = await caller.collection.list({});

      void expect(collectionService.list).toHaveBeenCalledWith({
        limit: 20,
      });
      void expect(result).toEqual(mockResult);
    });

    it('should list collections with filters', async () => {
      const mockResult = {
        collections: [{ _id: 'collection1', name: 'Public Collection' }],
        nextCursor: 'nextId',
      };

      vi.mocked(collectionService.list).mockResolvedValue(mockResult as any);

      const result = await caller.collection.list({
        userId: 'user123',
        isPublic: true,
        limit: 10,
        cursor: 'prevId',
      });

      void expect(collectionService.list).toHaveBeenCalledWith({
        userId: 'user123',
        isPublic: true,
        limit: 10,
        cursor: 'prevId',
      });
      void expect(result).toEqual(mockResult);
    });
  });

  describe('myCollections', () => {
    it('should get user collections when authenticated', async () => {
      const mockResult = {
        collections: [
          { _id: 'collection1', name: 'My Collection 1' },
          { _id: 'collection2', name: 'My Collection 2' },
        ],
        nextCursor: null,
      };

      vi.mocked(collectionService.getUserCollections).mockResolvedValue(mockResult as any);

      const result = await authedCaller.collection.myCollections({ limit: 10 });

      void expect(collectionService.getUserCollections).toHaveBeenCalledWith('user123', {
        limit: 10,
      });
      void expect(result).toEqual(mockResult);
    });

    it('should throw UNAUTHORIZED when not authenticated', async () => {
      await expect(caller.collection.myCollections({ limit: 10 })).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });
    });
  });

  describe('quickCreate', () => {
    it('should create collection with minimal data', async () => {
      const input = {
        name: 'Flash Sale',
      };

      const mockCollection = {
        _id: 'collection123',
        name: 'Flash Sale',
        slug: 'flash-sale',
        isPublic: false,
      };

      vi.mocked(collectionService.quickCreate).mockResolvedValue(mockCollection as any);

      const result = await authedCaller.collection.quickCreate(input);

      void expect(collectionService.quickCreate).toHaveBeenCalledWith('user123', {
        name: 'Flash Sale',
        isPublic: false,
      });
      void expect(result).toMatchObject({
        _id: 'collection123',
        name: 'Flash Sale',
        slug: 'flash-sale',
        isPublic: false,
      });
    });

    it('should create public collection when specified', async () => {
      const input = {
        name: 'Public Sale',
        isPublic: true,
      };

      const mockCollection = {
        _id: 'collection123',
        name: 'Public Sale',
        slug: 'public-sale',
        isPublic: true,
      };

      vi.mocked(collectionService.quickCreate).mockResolvedValue(mockCollection as any);

      const result = await authedCaller.collection.quickCreate(input);

      void expect(result.isPublic).toBe(true);
    });

    it('should throw CONFLICT error on duplicate name', async () => {
      const input = { name: 'Existing Collection' };
      
      const error = new Error('Duplicate key error');
      (error as any).code = 11000;

      vi.mocked(collectionService.quickCreate).mockRejectedValue(error);

      await expect(authedCaller.collection.quickCreate(input)).rejects.toMatchObject({
        code: 'CONFLICT',
        message: 'A resource with this name already exists',
      });
    });

    it('should throw UNAUTHORIZED when not authenticated', async () => {
      await expect(caller.collection.quickCreate({ name: 'Test' })).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });
    });
  });

  describe('checkAvailability', () => {
    it('should return available when name is available', async () => {
      const mockResult = { available: true };

      vi.mocked(collectionService.checkNameAvailability).mockResolvedValue(mockResult);

      const result = await authedCaller.collection.checkAvailability({ name: 'New Name' });

      void expect(collectionService.checkNameAvailability).toHaveBeenCalledWith('user123', 'New Name');
      void expect(result).toEqual({ available: true });
    });

    it('should return existingId when exact match found', async () => {
      const mockResult = {
        available: false,
        existingId: 'collection123',
      };

      vi.mocked(collectionService.checkNameAvailability).mockResolvedValue(mockResult);

      const result = await authedCaller.collection.checkAvailability({ name: 'Existing' });

      void expect(result).toEqual({
        available: false,
        existingId: 'collection123',
      });
    });

    it('should return suggested name when similar exists', async () => {
      const mockResult = {
        available: false,
        suggestedName: 'Sale Collection 2',
      };

      vi.mocked(collectionService.checkNameAvailability).mockResolvedValue(mockResult);

      const result = await authedCaller.collection.checkAvailability({ name: 'Sale Collection' });

      void expect(result).toEqual({
        available: false,
        suggestedName: 'Sale Collection 2',
      });
    });

    it('should throw UNAUTHORIZED when not authenticated', async () => {
      await expect(caller.collection.checkAvailability({ name: 'Test' })).rejects.toMatchObject({
        code: 'UNAUTHORIZED',
      });
    });
  });
});