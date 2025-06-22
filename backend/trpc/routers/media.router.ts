import { z } from 'zod';
import { router, adminProcedure } from '../index.js';
import { isAppError } from '../../utils/error-types.js';
import { nanoid } from 'nanoid';
import { AppError } from '../../utils/AppError.js';
import { IMediaItem } from '../../types/media.types.js';
import { mediaItemSchema } from '../../validations/media.validation.js';

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
          ctx.user.id || ctx.userId
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
        order: z.number().int().min(0),
      })),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const { productService } = await import('../../services/product.service.js');
        
        const result = await productService.reorderMediaItems(
          input.productId,
          input.mediaOrder as Array<{ id: string; order: number }>,
          ctx.user.id || ctx.userId
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
          ctx.user.id || ctx.userId
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
      url: z.string().url(),
      title: z.string().max(200),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        let service: any;
        try {
          const { mediaService } = await import('../../services/media.service.js');
          service = mediaService;
        } catch {
          service = {
            validateYouTubeUrl: async (url: string) => {
              const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
              const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
              return { 
                isValid: youtubeRegex.test(url) && match, 
                videoId: match ? match[1] : null 
              };
            },
            getYouTubeThumbnail: async (id: string) => `https://img.youtube.com/vi/${id}/maxresdefault.jpg`
          };
        }
        
        const validation = await service.validateYouTubeUrl(input.url);
        if (!validation.isValid) {
          throw new AppError('Invalid YouTube URL', 400);
        }
        
        const mediaItem: IMediaItem = {
          id: nanoid(6),
          type: 'video',
          url: input.url,
          title: input.title,
          thumbnail: await service.getYouTubeThumbnail(validation.videoId!),
          order: 0,
          createdAt: new Date(),
        };
        
        const { productService } = await import('../../services/product.service.js');
        const result = await productService.addMediaItem(
          input.productId,
          mediaItem,
          ctx.user.id || ctx.userId
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
        size: z.number(),
        name: z.string(),
      })),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const { productService } = await import('../../services/product.service.js');
        
        const product = await productService.getProductById(input.productId);
        if (!product) {
          throw new AppError('Product not found', 404);
        }
        
        const existingCount = product.mediaGallery?.length || 0;
        
        let service: any;
        try {
          const { mediaService } = await import('../../services/media.service.js');
          service = mediaService;
        } catch {
          service = {
            processMediaUpload: async (files: any[], count: number) => {
              return files.map((file, index) => ({
                id: nanoid(6),
                type: file.type.startsWith('image/') ? 'image' as const : 'video' as const,
                url: file.url,
                title: file.name,
                order: count + index,
                createdAt: new Date(),
                metadata: { size: file.size }
              }));
            }
          };
        }
        
        const newMediaItems = await service.processMediaUpload(
          input.files,
          existingCount
        );
        
        const allMediaItems = [...(product.mediaGallery || []), ...newMediaItems];
        
        const result = await productService.updateMediaGallery(
          input.productId,
          allMediaItems,
          ctx.user.id || ctx.userId
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
        
        const query: any = { isDeleted: { $ne: true } };
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
            
            const images = product.mediaGallery.filter((m: any) => m.type === 'image').length;
            const videos = product.mediaGallery.filter((m: any) => m.type === 'video').length;
            
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
      } catch (error) {
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
            product.mediaGallery.forEach((m: any) => {
              usedUrls.add(m.url);
              if (m.thumbnail) usedUrls.add(m.thumbnail);
            });
          }
          product.variants?.forEach((v: any) => {
            v.images?.forEach((img: string) => usedUrls.add(img));
          });
        }
        
        return {
          usedUrlCount: usedUrls.size,
          usedUrls: Array.from(usedUrls),
          message: 'Full orphaned media detection requires UploadThing API integration'
        };
      } catch (error) {
        throw new AppError('Failed to find orphaned media', 500);
      }
    }),
});