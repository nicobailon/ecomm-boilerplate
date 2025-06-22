export interface IMediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
  title?: string;
  order: number;
  variantId?: string;
  createdAt: Date;
  metadata?: {
    size?: number;
    duration?: number;
    dimensions?: {
      width: number;
      height: number;
    };
  };
}

export interface IProductWithMediaGallery {
  // This will extend the existing IProduct interface
  mediaGallery: IMediaItem[];
}

export const MEDIA_LIMITS = {
  MAX_ITEMS: 6,
  MAX_IMAGE_SIZE: 8 * 1024 * 1024,  // 8MB
  MAX_VIDEO_SIZE: 100 * 1024 * 1024, // 100MB
  SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'] as const,
  SUPPORTED_VIDEO_TYPES: ['video/mp4', 'video/webm', 'video/quicktime'] as const,
  MAX_VIDEO_DURATION: 300, // 5 minutes
  NANOID_LENGTH: 6,
} as const;