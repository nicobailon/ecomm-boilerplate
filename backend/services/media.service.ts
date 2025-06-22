import { nanoid } from 'nanoid';
import { MEDIA_LIMITS } from '../types/media.types.js';
import { IMediaItem } from '../types/media.types.js';
import { AppError } from '../utils/AppError.js';
import { redis } from '../lib/redis.js';

export class MediaService {
  
  processMediaUpload(
    files: { url: string; type: string; size: number; name: string }[],
    existingMediaCount = 0,
  ): IMediaItem[] {
    const mediaItems: IMediaItem[] = [];
    
    if (existingMediaCount + files.length > MEDIA_LIMITS.MAX_ITEMS) {
      throw new AppError(
        `Cannot exceed ${MEDIA_LIMITS.MAX_ITEMS} total media items`,
        400,
      );
    }
    
    for (let index = 0; index < files.length; index++) {
      const file = files[index];
      if (!this.isValidFileType(file.type)) {
        throw new AppError(`Unsupported file type: ${file.type}`, 400);
      }
      
      const mediaItem: IMediaItem = {
        id: nanoid(6),
        type: this.getMediaType(file.type),
        url: file.url,
        title: file.name,
        order: existingMediaCount + index,
        createdAt: new Date(),
        metadata: {
          size: file.size,
        },
      };
      
      mediaItems.push(mediaItem);
    }
    
    return mediaItems;
  }
  
  validateYouTubeUrl(url: string): { isValid: boolean; videoId?: string } {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/,
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match?.[1]) {
        return { isValid: true, videoId: match[1] };
      }
    }
    
    return { isValid: false };
  }
  
  getYouTubeThumbnail(videoId: string): string {
    const qualities = ['maxresdefault', 'hqdefault', 'mqdefault', 'default'];
    
    for (const quality of qualities) {
      const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
      if (quality === 'maxresdefault' || quality === 'default') {
        return thumbnailUrl;
      }
    }
    
    return `https://img.youtube.com/vi/${videoId}/default.jpg`;
  }
  
  validateMediaGallery(mediaItems: IMediaItem[]): void {
    if (mediaItems.length > MEDIA_LIMITS.MAX_ITEMS) {
      throw new AppError(`Maximum ${MEDIA_LIMITS.MAX_ITEMS} media items allowed`, 400);
    }
    
    const orders = mediaItems.map(item => item.order).sort((a, b) => a - b);
    for (let i = 0; i < orders.length; i++) {
      if (orders[i] !== i) {
        throw new AppError('Media items must have sequential order starting from 0', 400);
      }
    }
    
    for (const item of mediaItems) {
      // For video items, validate YouTube URLs specifically
      if (item.type === 'video') {
        if (item.url.includes('youtube.com') || item.url.includes('youtu.be')) {
          const validation = this.validateYouTubeUrl(item.url);
          if (!validation.isValid) {
            throw new AppError(`Invalid YouTube URL: ${item.url}`, 400);
          }
          
          if (!item.thumbnail && validation.videoId) {
            item.thumbnail = this.getYouTubeThumbnail(validation.videoId);
          }
        } else {
          // All video URLs must be from YouTube
          throw new AppError(`Invalid YouTube URL: ${item.url}`, 400);
        }
      }
      
      // Check secure URL for all items
      if (!this.isSecureUrl(item.url)) {
        throw new AppError(`Insecure URL detected: ${item.url}`, 400);
      }
    }
  }
  
  deleteMediaFiles(mediaUrls: string[]): void {
    const uploadThingUrls = mediaUrls.filter(url => url.includes('utfs.io'));
    
    if (uploadThingUrls.length === 0) return;
    
    try {
      // UploadThing file deletion implementation would go here
      // await this.utapi.deleteFiles(uploadThingUrls);
    } catch (error) {
      console.error('Error deleting media files:', error);
    }
  }
  
  async getMediaMetadata(mediaId: string): Promise<{ views: number; lastViewed: Date }> {
    const cacheKey = `media:metadata:${mediaId}`;
    
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached) as { views: number; lastViewed: string | Date };
        // Convert string dates back to Date objects if they exist
        if (parsed.lastViewed) {
          parsed.lastViewed = new Date(parsed.lastViewed);
        }
        return parsed as { views: number; lastViewed: Date };
      }
    } catch (error) {
      console.error('Redis error:', error);
    }
    
    const metadata = {
      views: 0,
      lastViewed: new Date(),
    };
    
    try {
      await redis.setex(cacheKey, 3600, JSON.stringify(metadata));
    } catch (error) {
      console.error('Redis error:', error);
    }
    
    return metadata;
  }
  
  private getMediaType(mimeType: string): 'image' | 'video' {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    throw new AppError(`Unsupported media type: ${mimeType}`, 400);
  }
  
  private isValidFileType(mimeType: string): boolean {
    const allTypes = [
      ...MEDIA_LIMITS.SUPPORTED_IMAGE_TYPES,
      ...MEDIA_LIMITS.SUPPORTED_VIDEO_TYPES,
    ];
    return allTypes.includes(mimeType as typeof allTypes[number]);
  }
  
  private isSecureUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      
      if (urlObj.protocol !== 'https:') return false;
      
      const allowedDomains = [
        'utfs.io',
        'youtube.com',
        'youtu.be',
        'img.youtube.com',
      ];
      
      return allowedDomains.some(domain => 
        urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`),
      );
    } catch {
      return false;
    }
  }
}

export const mediaService = new MediaService();