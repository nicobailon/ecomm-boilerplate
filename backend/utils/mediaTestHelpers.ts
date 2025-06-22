import { IMediaItem } from '../types/media.types.js';
import { nanoid } from 'nanoid';

export const createMockMediaItem = (
  type: 'image' | 'video' = 'image',
  order = 0,
): IMediaItem => ({
  id: nanoid(6),
  type,
  url: type === 'image' 
    ? `https://utfs.io/test-${nanoid(6)}.jpg`
    : 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  thumbnail: type === 'video' 
    ? 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg'
    : undefined,
  title: `Test ${type} ${order + 1}`,
  order,
  createdAt: new Date(),
  metadata: {
    size: 1024 * 1024, // 1MB
    dimensions: type === 'image' ? { width: 1920, height: 1080 } : undefined,
    duration: type === 'video' ? 180 : undefined,
  },
});

export const createMockMediaGallery = (
  imageCount = 3,
  videoCount = 1,
): IMediaItem[] => {
  const gallery: IMediaItem[] = [];
  
  for (let i = 0; i < imageCount; i++) {
    gallery.push(createMockMediaItem('image', i));
  }
  
  for (let i = 0; i < videoCount; i++) {
    gallery.push(createMockMediaItem('video', imageCount + i));
  }
  
  return gallery;
};

export const createMockYouTubeVideo = (order = 0): IMediaItem => ({
  id: nanoid(6),
  type: 'video',
  url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
  title: `YouTube Video ${order + 1}`,
  order,
  createdAt: new Date(),
  metadata: {
    duration: 212, // 3:32
  },
});

export const createMockUploadedFile = (
  type: 'image' | 'video' = 'image',
  size: number = 1024 * 1024,
): {
  url: string;
  type: string;
  size: number;
  name: string;
} => ({
  url: type === 'image' 
    ? `https://utfs.io/uploaded-${nanoid(6)}.jpg`
    : `https://utfs.io/uploaded-${nanoid(6)}.mp4`,
  type: type === 'image' ? 'image/jpeg' : 'video/mp4',
  size,
  name: `uploaded-file-${nanoid(6)}.${type === 'image' ? 'jpg' : 'mp4'}`,
});

export const createMaxMediaGallery = (): IMediaItem[] => {
  return Array.from({ length: 6 }, (_, i) => 
    createMockMediaItem(i < 4 ? 'image' : 'video', i),
  );
};

export const createInvalidMediaItem = (invalidField: string): Partial<IMediaItem> => {
  const base = createMockMediaItem();
  
  switch (invalidField) {
    case 'url':
      return { ...base, url: 'invalid-url' };
    case 'order':
      return { ...base, order: -1 };
    case 'type':
      return { ...base, type: 'invalid' as 'image' | 'video' };
    case 'title':
      return { ...base, title: 'x'.repeat(201) }; // Too long
    default:
      return base;
  }
};

export const mockMediaService = {
  validateMediaGallery: (items: IMediaItem[]): void => {
    if (items.length > 6) {
      throw new Error('Maximum 6 media items allowed');
    }
  },
  deleteMediaFiles: (_urls: string[]): void => {
    // Mock implementation for testing
  },
  validateYouTubeUrl: (url: string): { isValid: boolean; videoId: string | null } => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    const match = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/.exec(url);
    return { 
      isValid: youtubeRegex.test(url) && !!match, 
      videoId: match ? match[1] : null, 
    };
  },
  getYouTubeThumbnail: (id: string): string => 
    `https://img.youtube.com/vi/${id}/maxresdefault.jpg`,
  processMediaUpload: (files: { type: string; url: string; name: string; size?: number }[], existingCount: number): IMediaItem[] => {
    return files.map((file, index) => ({
      id: nanoid(6),
      type: file.type.startsWith('image/') ? 'image' : 'video',
      url: file.url,
      title: file.name,
      order: existingCount + index,
      createdAt: new Date(),
      metadata: file.size ? { size: file.size } : undefined,
    }));
  },
};

export const validateMediaGallery = (gallery: IMediaItem[]): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Check length
  if (gallery.length > 6) {
    errors.push('Gallery cannot exceed 6 items');
  }
  
  // Check order sequence
  const orders = gallery.map(item => item.order).sort((a, b) => a - b);
  orders.forEach((order, index) => {
    if (order !== index) {
      errors.push(`Invalid order sequence: expected ${index}, got ${order}`);
    }
  });
  
  // Check required fields
  gallery.forEach((item, index) => {
    if (!item.id) errors.push(`Item ${index}: missing id`);
    if (!item.type || !['image', 'video'].includes(item.type)) {
      errors.push(`Item ${index}: invalid type`);
    }
    if (!item.url || !/^https?:\/\/.+/.test(item.url)) {
      errors.push(`Item ${index}: invalid URL`);
    }
    if (item.order < 0) errors.push(`Item ${index}: invalid order`);
    if (!item.createdAt) errors.push(`Item ${index}: missing createdAt`);
  });
  
  // Check at least one image exists
  const hasImage = gallery.some(item => item.type === 'image');
  if (!hasImage && gallery.length > 0) {
    errors.push('Gallery must contain at least one image');
  }
  
  return { valid: errors.length === 0, errors };
};