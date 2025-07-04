import { describe, it, expect, beforeEach, vi } from 'vitest';
import { appRouter } from '../app.router.js';
import { productService } from '../../../services/product.service.js';
import { AppError } from '../../../utils/AppError.js';
import { IProductWithVariants } from '../../../types/product.types.js';
import { IMediaItem } from '../../../types/media.types.js';
import { Product } from '../../../models/product.model.js';
import type { IUserDocument } from '../../../models/user.model.js';
import type { CreateExpressContextOptions } from '@trpc/server/adapters/express';

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

// Create a mock user that satisfies IUserDocument interface
const createMockUser = () => {
  return {
    _id: 'admin123',
    id: 'admin123',
    name: 'Admin User',
    email: 'admin@test.com',
    password: 'hashed',
    role: 'admin' as const,
    cartItems: [],
    appliedCoupon: null,
    comparePassword: vi.fn(),
  } as unknown as IUserDocument;
};

interface MockContext {
  user: IUserDocument | null;
  req: CreateExpressContextOptions['req'];
  res: CreateExpressContextOptions['res'];
}

const createMockContext = (): MockContext => ({
  user: createMockUser(),
  req: {} as CreateExpressContextOptions['req'],
  res: {} as CreateExpressContextOptions['res'],
});

const mockContext = createMockContext();

describe('Media Router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('updateGallery', () => {
    it('should update media gallery successfully', async () => {
      const mockProduct: IProductWithVariants = {
        _id: 'product123',
        name: 'Test Product',
        description: 'Test Description',
        price: 100,
        image: 'test.jpg',
        slug: 'test-product',
        isFeatured: false,
        variants: [],
        relatedProducts: [],
        lowStockThreshold: 5,
        allowBackorder: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
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

      void expect(productService.updateMediaGallery).toHaveBeenCalledWith(
        'product123',
        mediaItems,
        'admin123',
      );
      void expect(result).toEqual(mockProduct);
    });

    it('should handle media gallery update errors', async () => {
      (productService.updateMediaGallery as any).mockRejectedValue(
        new AppError('Product not found', 404),
      );

      const caller = appRouter.createCaller(mockContext);

      await expect(
        caller.media.updateGallery({
          productId: 'nonexistent',
          mediaItems: [],
        }),
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
        }),
      ).rejects.toThrow();
    });
  });

  describe('reorderItems', () => {
    it('should reorder media items successfully', async () => {
      const mockProduct: IProductWithVariants = {
        _id: 'product123',
        name: 'Test Product',
        description: 'Test Description',
        price: 100,
        image: 'test.jpg',
        slug: 'test-product',
        isFeatured: false,
        variants: [],
        relatedProducts: [],
        lowStockThreshold: 5,
        allowBackorder: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
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

      void expect(productService.reorderMediaItems).toHaveBeenCalledWith(
        'product123',
        [
          { id: 'media1', order: 1 },
          { id: 'media2', order: 0 },
        ],
        'admin123',
      );
      void expect(result).toEqual(mockProduct);
    });

    it('should handle reorder errors gracefully', async () => {
      (productService.reorderMediaItems as any).mockRejectedValue(
        new AppError('Concurrent modification detected', 409),
      );

      const caller = appRouter.createCaller(mockContext);

      await expect(
        caller.media.reorderItems({
          productId: 'product123',
          mediaOrder: [{ id: 'media1', order: 0 }],
        }),
      ).rejects.toThrow('Concurrent modification detected');
    });

    it('should validate order range (0-5)', async () => {
      const caller = appRouter.createCaller(mockContext);

      await expect(
        caller.media.reorderItems({
          productId: 'product123',
          mediaOrder: [{ id: 'media1', order: 6 }], // Invalid order > 5
        }),
      ).rejects.toThrow();
    });
  });

  describe('deleteItem', () => {
    it('should delete media item successfully', async () => {
      const mockProduct: IProductWithVariants = {
        _id: 'product123',
        name: 'Test Product',
        description: 'Test Description',
        price: 100,
        image: 'test.jpg',
        slug: 'test-product',
        isFeatured: false,
        variants: [],
        relatedProducts: [],
        lowStockThreshold: 5,
        allowBackorder: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        mediaGallery: [],
      };

      (productService.deleteMediaItem as any).mockResolvedValue(mockProduct);

      const caller = appRouter.createCaller(mockContext);

      const result = await caller.media.deleteItem({
        productId: 'product123',
        mediaId: 'media1',
      });

      void expect(productService.deleteMediaItem).toHaveBeenCalledWith(
        'product123',
        'media1',
        'admin123',
      );
      void expect(result).toEqual(mockProduct);
    });

    it('should handle delete errors', async () => {
      (productService.deleteMediaItem as any).mockRejectedValue(
        new AppError('Cannot delete the last image', 400),
      );

      const caller = appRouter.createCaller(mockContext);

      await expect(
        caller.media.deleteItem({
          productId: 'product123',
          mediaId: 'media1',
        }),
      ).rejects.toThrow('Cannot delete the last image');
    });
  });

  describe('addYouTubeVideo', () => {
    it('should add YouTube video successfully', async () => {
      const mockProduct: IProductWithVariants = {
        _id: 'product123',
        name: 'Test Product',
        description: 'Test Description',
        price: 100,
        image: 'test.jpg',
        slug: 'test-product',
        isFeatured: false,
        variants: [],
        relatedProducts: [],
        lowStockThreshold: 5,
        allowBackorder: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        mediaGallery: [],
      };

      // Mock the service import and methods
      const mockMediaService = {
        validateYouTubeUrl: vi.fn().mockResolvedValue({
          isValid: true,
          videoId: 'dQw4w9WgXcQ',
        }),
        getYouTubeThumbnail: vi.fn().mockResolvedValue(
          'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
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

      void expect(mockMediaService.validateYouTubeUrl).toHaveBeenCalledWith(
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      );
      void expect(mockMediaService.getYouTubeThumbnail).toHaveBeenCalledWith(
        'dQw4w9WgXcQ',
      );
      void expect(productService.addMediaItem).toHaveBeenCalledWith(
        'product123',
        expect.objectContaining({
          type: 'video',
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          title: 'Test Video',
          thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
          order: 0,
        }),
        'admin123',
      );
      void expect(result).toEqual(mockProduct);
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
        }),
      ).rejects.toThrow('Invalid YouTube URL');
    });

    it('should fallback when media service unavailable', async () => {
      const mockProduct: IProductWithVariants = {
        _id: 'product123',
        name: 'Test Product',
        description: 'Test Description',
        price: 100,
        image: 'test.jpg',
        slug: 'test-product',
        isFeatured: false,
        variants: [],
        relatedProducts: [],
        lowStockThreshold: 5,
        allowBackorder: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
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

      void expect(productService.addMediaItem).toHaveBeenCalledWith(
        'product123',
        expect.objectContaining({
          type: 'video',
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          title: 'Test Video',
          order: 0,
        }),
        'admin123',
      );
      void expect(result).toEqual(mockProduct);
    });
  });

  describe('processUploadedFiles', () => {
    it('should process uploaded files successfully', async () => {
      const mockProduct: IProductWithVariants = {
        _id: 'product123',
        name: 'Test Product',
        description: 'Test Description',
        price: 100,
        image: 'test.jpg',
        slug: 'test-product',
        isFeatured: false,
        variants: [],
        relatedProducts: [],
        lowStockThreshold: 5,
        allowBackorder: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
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
        mediaGallery: [...(mockProduct as any).mediaGallery, ...mockProcessedFiles],
      });

      // Mock media service
      const mockMediaService = {
        processMediaUpload: vi.fn().mockResolvedValue(mockProcessedFiles),
      };

      vi.doMock('../../../services/media.service.js', () => ({
        mediaService: mockMediaService,
      }));

      const caller = appRouter.createCaller(mockContext);

      await caller.media.processUploadedFiles({
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

      void expect(productService.getProductById).toHaveBeenCalledWith('product123');
      void expect(mockMediaService.processMediaUpload).toHaveBeenCalledWith(
        [
          {
            url: 'https://example.com/new1.jpg',
            type: 'image/jpeg',
            size: 1024,
            name: 'new1.jpg',
          },
        ],
        1, // existing count
      );
      void expect(productService.updateMediaGallery).toHaveBeenCalledWith(
        'product123',
        expect.arrayContaining([
          expect.objectContaining({ id: 'existing1' }),
          expect.objectContaining({ id: 'new1' }),
        ]),
        'admin123',
      );
    });

    it('should handle product not found error', async () => {
      (productService.getProductById as any).mockResolvedValue(null);

      const caller = appRouter.createCaller(mockContext);

      await expect(
        caller.media.processUploadedFiles({
          productId: 'nonexistent',
          files: [
            {
              url: 'https://example.com/test.jpg',
              type: 'image/jpeg',
              size: 1024,
              name: 'test.jpg',
            },
          ],
        }),
      ).rejects.toThrow('Product not found');
    });

    it('should fallback when media service unavailable', async () => {
      const mockProduct: IProductWithVariants = {
        _id: 'product123',
        name: 'Test Product',
        description: 'Test Description',
        price: 100,
        image: 'test.jpg',
        slug: 'test-product',
        isFeatured: false,
        variants: [],
        relatedProducts: [],
        lowStockThreshold: 5,
        allowBackorder: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        mediaGallery: [],
      };

      (productService.getProductById as any).mockResolvedValue(mockProduct);
      (productService.updateMediaGallery as any).mockResolvedValue(mockProduct);

      // Mock import failure
      vi.doMock('../../../services/media.service.js', () => {
        throw new Error('Service not available');
      });

      const caller = appRouter.createCaller(mockContext);

      await caller.media.processUploadedFiles({
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

      void expect(productService.updateMediaGallery).toHaveBeenCalledWith(
        'product123',
        expect.arrayContaining([
          expect.objectContaining({
            type: 'image',
            url: 'https://example.com/test.jpg',
            title: 'test.jpg',
            order: 0,
          }),
        ]),
        'admin123',
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

      void expect(result).toHaveProperty('totalProducts');
      void expect(result).toHaveProperty('productsWithMedia');
      void expect(result).toHaveProperty('totalMediaItems');
      void expect(result).toHaveProperty('totalImages');
      void expect(result).toHaveProperty('totalVideos');
      void expect(result).toHaveProperty('averageMediaPerProduct');
      void expect(result).toHaveProperty('productsAtCapacity');
    });

    it('should filter by productId when provided', async () => {
      (Product.find as any).mockResolvedValue([]);

      const caller = appRouter.createCaller(mockContext);

      const result = await caller.media.getMediaStats({
        productId: 'product123',
      });

      void expect(result).toBeDefined();
      void expect(Product.find).toHaveBeenCalledWith({ 
        isDeleted: { $ne: true }, 
        _id: 'product123', 
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

      void expect(result).toBeDefined();
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

      void expect(result).toHaveProperty('usedUrlCount');
      void expect(result).toHaveProperty('usedUrls');
      void expect(result).toHaveProperty('message');
      void expect(result.message).toContain('UploadThing API integration');
      void expect(result.usedUrls).toEqual(expect.arrayContaining([
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
        }),
      ).rejects.toThrow();

      await expect(
        caller.media.reorderItems({
          productId: 'product123',
          mediaOrder: [],
        }),
      ).rejects.toThrow();

      await expect(
        caller.media.deleteItem({
          productId: 'product123',
          mediaId: 'media1',
        }),
      ).rejects.toThrow();
    });
  });
});