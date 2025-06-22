import { z } from 'zod';
import { router, adminProcedure } from '../index.js';
import { isAppError } from '../../utils/error-types.js';
import { nanoid } from 'nanoid';
import { AppError } from '../../utils/AppError.js';
import { IMediaItem } from '../../types/media.types.js';
import { 
  mediaItemSchema,
  youtubeUrlSchema,
} from '../../validations/media.validation.js';

export const mediaRouter = router({
  updateGallery: adminProcedure
    .input(z.object({
      productId: z.string(),
      mediaItems: z.array(mediaItemSchema).max(6),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const { productService } = await import('../../services/product.service.js');
        
        const result = await productService.updateMediaGallery(
          input.productId,
          input.mediaItems,
          String(ctx.user.id ?? ctx.userId),
        );
        return result;
      } catch (error) {
        if (isAppError(error)) throw error;
        throw new AppError('Failed to update media gallery', 500);
      }
    }),
    
  reorderItems: adminProcedure
    .input(z.object({
      productId: z.string(),
      mediaOrder: z.array(z.object({
        id: z.string().min(1),
        order: z.number().int().min(0).max(5),
      })).min(1),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const { productService } = await import('../../services/product.service.js');
        
        const result = await productService.reorderMediaItems(
          input.productId,
          input.mediaOrder as { id: string; order: number }[],
          String(ctx.user.id ?? ctx.userId),
        );
        return result;
      } catch (error) {
        if (isAppError(error)) throw error;
        throw new AppError('Failed to reorder media items', 500);
      }
    }),
    
  deleteItem: adminProcedure
    .input(z.object({
      productId: z.string(),
      mediaId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const { productService } = await import('../../services/product.service.js');
        
        const result = await productService.deleteMediaItem(
          input.productId,
          input.mediaId,
          String(ctx.user.id ?? ctx.userId),
        );
        return result;
      } catch (error) {
        if (isAppError(error)) throw error;
        throw new AppError('Failed to delete media item', 500);
      }
    }),
    
  addYouTubeVideo: adminProcedure
    .input(z.object({
      productId: z.string(),
      url: youtubeUrlSchema,
      title: z.string().max(200),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        let service: {
          validateYouTubeUrl: (url: string) => Promise<{ isValid: boolean; videoId?: string }>;
          getYouTubeThumbnail: (id: string) => Promise<string>;
        };
        try {
          const { mediaService } = await import('../../services/media.service.js');
          service = {
            validateYouTubeUrl: (url: string) => {
              return Promise.resolve(mediaService.validateYouTubeUrl(url));
            },
            getYouTubeThumbnail: (id: string) => {
              return Promise.resolve(mediaService.getYouTubeThumbnail(id));
            },
          };
        } catch {
          service = {
            validateYouTubeUrl: (url: string) => {
              const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
              const match = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/.exec(url);
              return Promise.resolve({ 
                isValid: youtubeRegex.test(url) && !!match, 
                videoId: match ? match[1] : undefined, 
              });
            },
            getYouTubeThumbnail: (id: string) => Promise.resolve(`https://img.youtube.com/vi/${id}/maxresdefault.jpg`),
          };
        }
        
        const validation = await service.validateYouTubeUrl(input.url);
        if (!validation.isValid || !validation.videoId) {
          throw new AppError('Invalid YouTube URL', 400);
        }
        
        const mediaItem: IMediaItem = {
          id: nanoid(6),
          type: 'video',
          url: input.url,
          title: input.title,
          thumbnail: await service.getYouTubeThumbnail(validation.videoId),
          order: 0,
          createdAt: new Date(),
        };
        
        const { productService } = await import('../../services/product.service.js');
        const result = await productService.addMediaItem(
          input.productId,
          mediaItem,
          String(ctx.user.id ?? ctx.userId),
        );
        return result;
      } catch (error) {
        if (isAppError(error)) throw error;
        throw new AppError('Failed to add YouTube video', 500);
      }
    }),
    
  processUploadedFiles: adminProcedure
    .input(z.object({
      productId: z.string(),
      files: z.array(z.object({
        url: z.string().url(),
        type: z.string(),
        size: z.number().positive(),
        name: z.string().min(1),
      })).min(1),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const { productService } = await import('../../services/product.service.js');
        
        const product = await productService.getProductById(input.productId);
        if (!product) {
          throw new AppError('Product not found', 404);
        }
        
        const existingCount = product.mediaGallery?.length || 0;
        
        let service: {
          processMediaUpload: (files: { url: string; type: string; size: number; name: string }[], count: number) => Promise<IMediaItem[]>;
        };
        try {
          const { mediaService } = await import('../../services/media.service.js');
          service = {
            processMediaUpload: (files: { url: string; type: string; size: number; name: string }[], count: number) => {
              return Promise.resolve(mediaService.processMediaUpload(files, count));
            },
          };
        } catch {
          service = {
            processMediaUpload: (files: { url: string; type: string; size: number; name: string }[], count: number) => {
              return Promise.resolve(files.map((file, index) => ({
                id: nanoid(6),
                type: file.type.startsWith('image/') ? 'image' as const : 'video' as const,
                url: file.url,
                title: file.name,
                order: count + index,
                createdAt: new Date(),
                metadata: { size: file.size },
              })));
            },
          };
        }
        
        const newMediaItems = await service.processMediaUpload(
          input.files,
          existingCount,
        );
        
        const allMediaItems = [...(product.mediaGallery || []), ...newMediaItems];
        
        const result = await productService.updateMediaGallery(
          input.productId,
          allMediaItems,
          String(ctx.user.id ?? ctx.userId),
        );
        
        return result;
      } catch (error) {
        if (isAppError(error)) throw error;
        throw new AppError('Failed to process uploaded files', 500);
      }
    }),

  getMediaStats: adminProcedure
    .input(z.object({
      productId: z.string().optional(),
      dateRange: z.object({
        start: z.date(),
        end: z.date(),
      }).optional(),
    }))
    .query(async ({ input }) => {
      try {
        const { Product } = await import('../../models/product.model.js');
        
        const query: Record<string, unknown> = { isDeleted: { $ne: true } };
        if (input.productId) {
          query._id = input.productId;
        }
        
        const products = await Product.find(query);
        
        const stats = {
          totalProducts: products.length,
          productsWithMedia: 0,
          totalMediaItems: 0,
          totalImages: 0,
          totalVideos: 0,
          averageMediaPerProduct: 0,
          productsAtCapacity: 0,
        };
        
        for (const product of products) {
          if (product.mediaGallery && product.mediaGallery.length > 0) {
            stats.productsWithMedia++;
            stats.totalMediaItems += product.mediaGallery.length;
            
            const images = product.mediaGallery.filter((m: IMediaItem) => m.type === 'image').length;
            const videos = product.mediaGallery.filter((m: IMediaItem) => m.type === 'video').length;
            
            stats.totalImages += images;
            stats.totalVideos += videos;
            
            if (product.mediaGallery.length === 6) {
              stats.productsAtCapacity++;
            }
          }
        }
        
        stats.averageMediaPerProduct = stats.productsWithMedia > 0
          ? stats.totalMediaItems / stats.productsWithMedia
          : 0;
        
        return stats;
      } catch {
        throw new AppError('Failed to get media statistics', 500);
      }
    }),

  findOrphanedMedia: adminProcedure
    .query(async () => {
      try {
        const { Product } = await import('../../models/product.model.js');
        
        const products = await Product.find({ isDeleted: { $ne: true } });
        const usedUrls = new Set<string>();
        
        for (const product of products) {
          if (product.image) usedUrls.add(product.image);
          if (product.mediaGallery) {
            product.mediaGallery.forEach((m: IMediaItem) => {
              usedUrls.add(m.url);
              if (m.thumbnail) usedUrls.add(m.thumbnail);
            });
          }
          product.variants?.forEach((v: { images?: string[] }) => {
            v.images?.forEach((img: string) => usedUrls.add(img));
          });
        }
        
        return {
          usedUrlCount: usedUrls.size,
          usedUrls: Array.from(usedUrls),
          message: 'Full orphaned media detection requires UploadThing API integration',
        };
      } catch {
        throw new AppError('Failed to find orphaned media', 500);
      }
    }),
});