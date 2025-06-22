export interface MediaItem {
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

export interface MediaUploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'complete' | 'error';
  error?: string;
}

export const MEDIA_LIMITS = {
  MAX_ITEMS: 6,
  MAX_IMAGE_SIZE: 8 * 1024 * 1024,  // 8MB
  MAX_VIDEO_SIZE: 100 * 1024 * 1024, // 100MB
  SUPPORTED_IMAGE_TYPES: ['.jpg', '.jpeg', '.png', '.webp'],
  SUPPORTED_VIDEO_TYPES: ['.mp4', '.webm', '.mov'],
} as const;