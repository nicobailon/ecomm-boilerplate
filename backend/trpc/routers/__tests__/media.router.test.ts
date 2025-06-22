import { describe, it, expect, beforeEach, vi } from 'vitest';
import { appRouter } from '../app.router.js';
import { createContext } from '../../context.js';
import { productService } from '../../../services/product.service.js';
import { AppError } from '../../../utils/AppError.js';
import { IProduct } from '../../../types/index.js';
import { IMediaItem } from '../../../types/media.types.js';
import { Product } from '../../../models/product.model.js';

// Mock the services
vi.mock('../../../services/product.service.js', () => ({
  productService: {
    updateMediaGallery: vi.fn(),
    reorderMediaItems: vi.fn(),
    deleteMediaItem: vi.fn(),
    addMediaItem: vi.fn(),
    getProductById: vi.fn(),
  },
}));

// Mock Product model for database queries
vi.mock('../../../models/product.model.js', () => ({
  Product: {
    find: vi.fn(),
    countDocuments: vi.fn(),
  },
}));

vi.mock('../../../services/media.service.js', () => ({
  mediaService: {
    validateYouTubeUrl: vi.fn(),
    getYouTubeThumbnail: vi.fn(),
    processMediaUpload: vi.fn(),
  },
}));

const mockContext = {
  user: { id: 'admin123', _id: 'admin123', role: 'admin' },
  userId: 'admin123',
  req: {} as any,
  res: {} as any,
};

describe('Media Router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('updateGallery', () => {
    it('should update media gallery successfully', async () => {
      const mockProduct: IProduct = {
        _id: 'product123',
        name: 'Test Product',
        description: 'Test Description',
        price: 100,
        image: 'test.jpg',
        slug: 'test-product',
        isFeatured: false,
        variants: [],
        relatedProducts: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        mediaGallery: [],
      };

      const mediaItems: IMediaItem[] = [
        {
          id: 'media1',
          type: 'image',
          url: 'https://example.com/image1.jpg',
          order: 0,
          createdAt: new Date(),
        },
      ];

      (productService.updateMediaGallery as any).mockResolvedValue(mockProduct);

      const caller = appRouter.createCaller(mockContext);

      const result = await caller.media.updateGallery({
        productId: 'product123',
        mediaItems,
      });

      expect(productService.updateMediaGallery).toHaveBeenCalledWith(
        'product123',
        mediaItems,
        'admin123'
      );
      expect(result).toEqual(mockProduct);
    });

    it('should handle media gallery update errors', async () => {
      (productService.updateMediaGallery as any).mockRejectedValue(
        new AppError('Product not found', 404)
      );

      const caller = appRouter.createCaller(mockContext);

      await expect(
        caller.media.updateGallery({
          productId: 'nonexistent',
          mediaItems: [],
        })
      ).rejects.toThrow('Product not found');
    });

    it('should validate maximum media items limit', async () => {
      const mediaItems: IMediaItem[] = Array.from({ length: 7 }, (_, i) => ({
        id: `media${i}`,
        type: 'image',
        url: `https://example.com/image${i}.jpg`,
        order: i,
        createdAt: new Date(),
      }));

      const caller = appRouter.createCaller(mockContext);

      await expect(
        caller.media.updateGallery({
          productId: 'product123',
          mediaItems,
        })
      ).rejects.toThrow();
    });
  });

  describe('reorderItems', () => {
    it('should reorder media items successfully', async () => {
      const mockProduct: IProduct = {
        _id: 'product123',
        name: 'Test Product',
        description: 'Test Description',
        price: 100,
        image: 'test.jpg',
        slug: 'test-product',
        isFeatured: false,
        variants: [],
        relatedProducts: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        mediaGallery: [],
      };

      (productService.reorderMediaItems as any).mockResolvedValue(mockProduct);

      const caller = appRouter.createCaller(mockContext);

      const result = await caller.media.reorderItems({
        productId: 'product123',
        mediaOrder: [
          { id: 'media1', order: 1 },
          { id: 'media2', order: 0 },
        ],
      });

      expect(productService.reorderMediaItems).toHaveBeenCalledWith(
        'product123',
        [
          { id: 'media1', order: 1 },
          { id: 'media2', order: 0 },
        ],
        'admin123'
      );
      expect(result).toEqual(mockProduct);
    });

    it('should handle reorder errors gracefully', async () => {
      (productService.reorderMediaItems as any).mockRejectedValue(
        new AppError('Concurrent modification detected', 409)
      );

      const caller = appRouter.createCaller(mockContext);

      await expect(
        caller.media.reorderItems({
          productId: 'product123',
          mediaOrder: [{ id: 'media1', order: 0 }],
        })
      ).rejects.toThrow('Concurrent modification detected');
    });

    it('should validate order range (0-5)', async () => {
      const caller = appRouter.createCaller(mockContext);

      await expect(
        caller.media.reorderItems({
          productId: 'product123',
          mediaOrder: [{ id: 'media1', order: 6 }], // Invalid order > 5
        })
      ).rejects.toThrow();
    });
  });

  describe('deleteItem', () => {
    it('should delete media item successfully', async () => {
      const mockProduct: IProduct = {
        _id: 'product123',
        name: 'Test Product',
        description: 'Test Description',
        price: 100,
        image: 'test.jpg',
        slug: 'test-product',
        isFeatured: false,
        variants: [],
        relatedProducts: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        mediaGallery: [],
      };

      (productService.deleteMediaItem as any).mockResolvedValue(mockProduct);

      const caller = appRouter.createCaller(mockContext);

      const result = await caller.media.deleteItem({
        productId: 'product123',
        mediaId: 'media1',
      });

      expect(productService.deleteMediaItem).toHaveBeenCalledWith(
        'product123',
        'media1',
        'admin123'
      );
      expect(result).toEqual(mockProduct);
    });

    it('should handle delete errors', async () => {
      (productService.deleteMediaItem as any).mockRejectedValue(
        new AppError('Cannot delete the last image', 400)
      );

      const caller = appRouter.createCaller(mockContext);

      await expect(
        caller.media.deleteItem({
          productId: 'product123',
          mediaId: 'media1',
        })
      ).rejects.toThrow('Cannot delete the last image');
    });
  });

  describe('addYouTubeVideo', () => {
    it('should add YouTube video successfully', async () => {
      const mockProduct: IProduct = {
        _id: 'product123',
        name: 'Test Product',
        description: 'Test Description',
        price: 100,
        image: 'test.jpg',
        slug: 'test-product',
        isFeatured: false,
        variants: [],
        relatedProducts: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        mediaGallery: [],
      };

      // Mock the service import and methods
      const mockMediaService = {
        validateYouTubeUrl: vi.fn().mockResolvedValue({
          isValid: true,
          videoId: 'dQw4w9WgXcQ',
        }),
        getYouTubeThumbnail: vi.fn().mockResolvedValue(
          'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg'
        ),
      };

      // Mock dynamic import
      vi.doMock('../../../services/media.service.js', () => ({
        mediaService: mockMediaService,
      }));

      (productService.addMediaItem as any).mockResolvedValue(mockProduct);

      const caller = appRouter.createCaller(mockContext);

      const result = await caller.media.addYouTubeVideo({
        productId: 'product123',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        title: 'Test Video',
      });

      expect(mockMediaService.validateYouTubeUrl).toHaveBeenCalledWith(
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
      );
      expect(mockMediaService.getYouTubeThumbnail).toHaveBeenCalledWith(
        'dQw4w9WgXcQ'
      );
      expect(productService.addMediaItem).toHaveBeenCalledWith(
        'product123',
        expect.objectContaining({
          type: 'video',
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          title: 'Test Video',
          thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
          order: 0,
        }),
        'admin123'
      );
      expect(result).toEqual(mockProduct);
    });

    it('should handle invalid YouTube URLs', async () => {
      // Mock the service with invalid URL response
      const mockMediaService = {
        validateYouTubeUrl: vi.fn().mockResolvedValue({
          isValid: false,
          videoId: null,
        }),
        getYouTubeThumbnail: vi.fn(),
      };

      vi.doMock('../../../services/media.service.js', () => ({
        mediaService: mockMediaService,
      }));

      const caller = appRouter.createCaller(mockContext);

      await expect(
        caller.media.addYouTubeVideo({
          productId: 'product123',
          url: 'https://example.com/not-youtube',
          title: 'Invalid Video',
        })
      ).rejects.toThrow('Invalid YouTube URL');
    });

    it('should fallback when media service unavailable', async () => {
      const mockProduct: IProduct = {
        _id: 'product123',
        name: 'Test Product',
        description: 'Test Description',
        price: 100,
        image: 'test.jpg',
        slug: 'test-product',
        isFeatured: false,
        variants: [],
        relatedProducts: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        mediaGallery: [],
      };

      // Mock import failure by throwing error
      vi.doMock('../../../services/media.service.js', () => {
        throw new Error('Service not available');
      });

      (productService.addMediaItem as any).mockResolvedValue(mockProduct);

      const caller = appRouter.createCaller(mockContext);

      const result = await caller.media.addYouTubeVideo({
        productId: 'product123',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        title: 'Test Video',
      });

      expect(productService.addMediaItem).toHaveBeenCalledWith(
        'product123',
        expect.objectContaining({
          type: 'video',
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          title: 'Test Video',
          order: 0,
        }),
        'admin123'
      );
      expect(result).toEqual(mockProduct);
    });
  });

  describe('processUploadedFiles', () => {
    it('should process uploaded files successfully', async () => {
      const mockProduct: IProduct = {
        _id: 'product123',
        name: 'Test Product',
        description: 'Test Description',
        price: 100,
        image: 'test.jpg',
        slug: 'test-product',
        isFeatured: false,
        variants: [],
        relatedProducts: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        mediaGallery: [
          {
            id: 'existing1',
            type: 'image',
            url: 'https://example.com/existing.jpg',
            order: 0,
            createdAt: new Date(),
          },
        ],
      };

      const mockProcessedFiles = [
        {
          id: 'new1',
          type: 'image' as const,
          url: 'https://example.com/new1.jpg',
          title: 'new1.jpg',
          order: 1,
          createdAt: new Date(),
          metadata: { size: 1024 },
        },
      ];

      (productService.getProductById as any).mockResolvedValue(mockProduct);
      (productService.updateMediaGallery as any).mockResolvedValue({
        ...mockProduct,
        mediaGallery: [...mockProduct.mediaGallery, ...mockProcessedFiles],
      });

      // Mock media service
      const mockMediaService = {
        processMediaUpload: vi.fn().mockResolvedValue(mockProcessedFiles),
      };

      vi.doMock('../../../services/media.service.js', () => ({
        mediaService: mockMediaService,
      }));

      const caller = appRouter.createCaller(mockContext);

      const result = await caller.media.processUploadedFiles({
        productId: 'product123',
        files: [
          {
            url: 'https://example.com/new1.jpg',
            type: 'image/jpeg',
            size: 1024,
            name: 'new1.jpg',
          },
        ],
      });

      expect(productService.getProductById).toHaveBeenCalledWith('product123');
      expect(mockMediaService.processMediaUpload).toHaveBeenCalledWith(
        [
          {
            url: 'https://example.com/new1.jpg',
            type: 'image/jpeg',
            size: 1024,
            name: 'new1.jpg',
          },
        ],
        1 // existing count
      );
      expect(productService.updateMediaGallery).toHaveBeenCalledWith(
        'product123',
        expect.arrayContaining([
          expect.objectContaining({ id: 'existing1' }),
          expect.objectContaining({ id: 'new1' }),
        ]),
        'admin123'
      );
    });

    it('should handle product not found error', async () => {
      (productService.getProductById as any).mockResolvedValue(null);

      const caller = appRouter.createCaller(mockContext);

      await expect(
        caller.media.processUploadedFiles({
          productId: 'nonexistent',
          files: [],
        })
      ).rejects.toThrow('Product not found');
    });

    it('should fallback when media service unavailable', async () => {
      const mockProduct: IProduct = {
        _id: 'product123',
        name: 'Test Product',
        description: 'Test Description',
        price: 100,
        image: 'test.jpg',
        slug: 'test-product',
        isFeatured: false,
        variants: [],
        relatedProducts: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        mediaGallery: [],
      };

      (productService.getProductById as any).mockResolvedValue(mockProduct);
      (productService.updateMediaGallery as any).mockResolvedValue(mockProduct);

      // Mock import failure
      vi.doMock('../../../services/media.service.js', () => {
        throw new Error('Service not available');
      });

      const caller = appRouter.createCaller(mockContext);

      const result = await caller.media.processUploadedFiles({
        productId: 'product123',
        files: [
          {
            url: 'https://example.com/test.jpg',
            type: 'image/jpeg',
            size: 1024,
            name: 'test.jpg',
          },
        ],
      });

      expect(productService.updateMediaGallery).toHaveBeenCalledWith(
        'product123',
        expect.arrayContaining([
          expect.objectContaining({
            type: 'image',
            url: 'https://example.com/test.jpg',
            title: 'test.jpg',
            order: 0,
          }),
        ]),
        'admin123'
      );
    });
  });

  describe('getMediaStats', () => {
    it('should return media statistics successfully', async () => {
      const mockProducts = [
        {
          mediaGallery: [
            { type: 'image' },
            { type: 'video' },
          ],
        },
        {
          mediaGallery: [
            { type: 'image' },
          ],
        },
      ];

      (Product.find as any).mockResolvedValue(mockProducts);

      const caller = appRouter.createCaller(mockContext);

      const result = await caller.media.getMediaStats({});

      expect(result).toHaveProperty('totalProducts');
      expect(result).toHaveProperty('productsWithMedia');
      expect(result).toHaveProperty('totalMediaItems');
      expect(result).toHaveProperty('totalImages');
      expect(result).toHaveProperty('totalVideos');
      expect(result).toHaveProperty('averageMediaPerProduct');
      expect(result).toHaveProperty('productsAtCapacity');
    });

    it('should filter by productId when provided', async () => {
      (Product.find as any).mockResolvedValue([]);

      const caller = appRouter.createCaller(mockContext);

      const result = await caller.media.getMediaStats({
        productId: 'product123',
      });

      expect(result).toBeDefined();
      expect(Product.find).toHaveBeenCalledWith({ 
        isDeleted: { $ne: true }, 
        _id: 'product123' 
      });
    });

    it('should handle date range filtering', async () => {
      (Product.find as any).mockResolvedValue([]);

      const caller = appRouter.createCaller(mockContext);

      const result = await caller.media.getMediaStats({
        dateRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-12-31'),
        },
      });

      expect(result).toBeDefined();
    });
  });

  describe('findOrphanedMedia', () => {
    it('should find orphaned media URLs', async () => {
      const mockProducts = [
        {
          image: 'https://example.com/main.jpg',
          mediaGallery: [
            { url: 'https://example.com/media1.jpg', thumbnail: 'https://example.com/thumb1.jpg' },
          ],
          variants: [
            { images: ['https://example.com/variant1.jpg'] },
          ],
        },
      ];

      (Product.find as any).mockResolvedValue(mockProducts);

      const caller = appRouter.createCaller(mockContext);

      const result = await caller.media.findOrphanedMedia();

      expect(result).toHaveProperty('usedUrlCount');
      expect(result).toHaveProperty('usedUrls');
      expect(result).toHaveProperty('message');
      expect(result.message).toContain('UploadThing API integration');
      expect(result.usedUrls).toEqual(expect.arrayContaining([
        'https://example.com/main.jpg',
        'https://example.com/media1.jpg',
        'https://example.com/thumb1.jpg',
        'https://example.com/variant1.jpg',
      ]));
    });
  });

  describe('Authentication', () => {
    it('should require admin authentication for all endpoints', async () => {
      const publicContext = {
        user: null,
        userId: null,
        req: {} as any,
        res: {} as any,
      };

      const caller = appRouter.createCaller(publicContext);

      await expect(
        caller.media.updateGallery({
          productId: 'product123',
          mediaItems: [],
        })
      ).rejects.toThrow();

      await expect(
        caller.media.reorderItems({
          productId: 'product123',
          mediaOrder: [],
        })
      ).rejects.toThrow();

      await expect(
        caller.media.deleteItem({
          productId: 'product123',
          mediaId: 'media1',
        })
      ).rejects.toThrow();
    });
  });
});