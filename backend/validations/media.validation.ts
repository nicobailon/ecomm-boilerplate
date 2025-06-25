import { z } from 'zod';
import { nanoid } from 'nanoid';
import { MEDIA_LIMITS } from '../types/media.types.js';

const validateYouTubeUrl = (url: string): boolean => {
  const patterns = [
    /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+(&[\w=]*)?$/,
    /^https?:\/\/youtu\.be\/[\w-]+(\?[\w=]*)?$/,
    /^https?:\/\/(www\.)?youtube\.com\/embed\/[\w-]+(\?[\w=]*)?$/,
  ];
  return patterns.some(pattern => pattern.test(url));
};

export const mediaItemSchema = z.object({
  id: z.string().min(1).default(() => nanoid(6)),
  type: z.enum(['image', 'video']),
  url: z.string().url().max(2048).refine(
    (url) => {
      if (url.includes('youtube.com') ?? url.includes('youtu.be')) {
        return validateYouTubeUrl(url);
      }
      if (!url.includes('youtube')) {
        return url.startsWith('https://utfs.io/') ?? url.startsWith('https://');
      }
      return true;
    },
    { message: 'Invalid media URL format' },
  ),
  thumbnail: z.string().url().max(2048).optional(),
  title: z.string().max(200).optional(),
  order: z.number().int().min(0).max(5),
  variantId: z.string().optional(),
  createdAt: z.date().default(() => new Date()),
  metadata: z.object({
    size: z.number().positive().optional(),
    duration: z.number().positive().max(300).optional(),
    dimensions: z.object({
      width: z.number().min(100).max(4096),
      height: z.number().min(100).max(4096),
    }).optional(),
  }).optional(),
});

export const mediaGallerySchema = z.array(mediaItemSchema)
  .max(MEDIA_LIMITS.MAX_ITEMS, `Array must contain at most ${MEDIA_LIMITS.MAX_ITEMS} element(s)`)
  .default([])
  .refine((gallery) => {
    const ids = gallery.map(item => item.id);
    return new Set(ids).size === ids.length;
  }, { message: 'Duplicate media item IDs found' })
  .refine((gallery) => {
    const orders = gallery.map(item => item.order);
    return new Set(orders).size === orders.length;
  }, 'Media items must have unique order values')
  .refine((gallery) => {
    const orders = gallery.map(item => item.order).sort((a, b) => a - b);
    return orders.every((order, index) => order === index);
  }, { message: 'Media items must have sequential order starting from 0' });

export const youtubeUrlSchema = z.string().refine(
  (url) => {
    // First check if it's a valid URL format
    try {
      new URL(url);
    } catch {
      return false;
    }
    // Then check if it's a valid YouTube URL
    return validateYouTubeUrl(url);
  },
  { message: 'Invalid YouTube URL format' },
);

export const mediaUploadSchema = z.object({
  files: z.array(z.object({
    url: z.string().url(),
    type: z.string(),
    size: z.number().positive(),
    name: z.string().min(1),
  })).min(1),
  existingMediaCount: z.number().int().min(0).default(0),
}).refine(
  (data) => data.files.length + data.existingMediaCount <= MEDIA_LIMITS.MAX_ITEMS,
  { message: `Total media items cannot exceed ${MEDIA_LIMITS.MAX_ITEMS}` },
);

export const mediaReorderSchema = z.object({
  mediaItems: z.array(z.object({
    id: z.string().min(1),
    order: z.number().int().min(0),
  })).min(1),
}).refine(
  (data) => {
    const ids = data.mediaItems.map(item => item.id);
    return new Set(ids).size === ids.length;
  },
  { message: 'Duplicate media item IDs found in reorder' },
).refine(
  (data) => {
    const orders = data.mediaItems.map(item => item.order).sort((a, b) => a - b);
    return orders.every((order, index) => order === index);
  },
  { message: 'Media items must have sequential order starting from 0' },
);