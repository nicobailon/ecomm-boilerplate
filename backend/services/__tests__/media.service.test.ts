import { describe, it, expect, beforeEach, vi, MockedFunction } from 'vitest';
import { MediaService } from '../media.service.js';
import { AppError } from '../../utils/AppError.js';
import { MEDIA_LIMITS } from '../../types/media.types.js';
import { redis } from '../../lib/redis.js';

vi.mock('../../lib/redis.js', () => ({
  redis: {
    get: vi.fn(),
    setex: vi.fn(),
  }
}));

describe('MediaService', () => {
  let mediaService: MediaService;
  let mockRedisGet: MockedFunction<typeof redis.get>;
  let mockRedisSetex: MockedFunction<typeof redis.setex>;

  beforeEach(() => {
    mediaService = new MediaService();
    mockRedisGet = redis.get as MockedFunction<typeof redis.get>;
    mockRedisSetex = redis.setex as MockedFunction<typeof redis.setex>;
    vi.clearAllMocks();
  });

  describe('processMediaUpload', () => {
    it('should process valid image uploads successfully', async () => {
      const files = [
        {
          url: 'https://utfs.io/f/test-image.jpg',
          type: 'image/jpeg',
          size: 1024 * 1024, // 1MB
          name: 'test-image.jpg'
        }
      ];

      const result = await mediaService.processMediaUpload(files, 0);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: expect.any(String),
        type: 'image',
        url: 'https://utfs.io/f/test-image.jpg',
        title: 'test-image.jpg',
        order: 0,
        createdAt: expect.any(Date),
        metadata: {
          size: 1024 * 1024
        }
      });
    });

    it('should process valid video uploads successfully', async () => {
      const files = [
        {
          url: 'https://utfs.io/f/test-video.mp4',
          type: 'video/mp4',
          size: 5 * 1024 * 1024, // 5MB
          name: 'test-video.mp4'
        }
      ];

      const result = await mediaService.processMediaUpload(files, 0);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: expect.any(String),
        type: 'video',
        url: 'https://utfs.io/f/test-video.mp4',
        title: 'test-video.mp4',
        order: 0,
        createdAt: expect.any(Date),
        metadata: {
          size: 5 * 1024 * 1024
        }
      });
    });

    it('should throw error when exceeding maximum media items', async () => {
      const files = [
        {
          url: 'https://utfs.io/f/test-image.jpg',
          type: 'image/jpeg', 
          size: 1024,
          name: 'test.jpg'
        }
      ];

      await expect(
        mediaService.processMediaUpload(files, MEDIA_LIMITS.MAX_ITEMS)
      ).rejects.toThrow(AppError);
      
      await expect(
        mediaService.processMediaUpload(files, MEDIA_LIMITS.MAX_ITEMS)
      ).rejects.toThrow(`Cannot exceed ${MEDIA_LIMITS.MAX_ITEMS} total media items`);
    });

    it('should throw error for unsupported file types', async () => {
      const files = [
        {
          url: 'https://utfs.io/f/test-file.txt',
          type: 'text/plain',
          size: 1024,
          name: 'test.txt'
        }
      ];

      await expect(
        mediaService.processMediaUpload(files, 0)
      ).rejects.toThrow(AppError);
      
      await expect(
        mediaService.processMediaUpload(files, 0)
      ).rejects.toThrow('Unsupported file type: text/plain');
    });

    it('should assign correct order based on existing media count', async () => {
      const files = [
        {
          url: 'https://utfs.io/f/image1.jpg',
          type: 'image/jpeg',
          size: 1024,
          name: 'image1.jpg'
        },
        {
          url: 'https://utfs.io/f/image2.jpg',
          type: 'image/jpeg',
          size: 1024,
          name: 'image2.jpg'
        }
      ];

      const result = await mediaService.processMediaUpload(files, 2);

      expect(result[0].order).toBe(2);
      expect(result[1].order).toBe(3);
    });
  });

  describe('validateYouTubeUrl', () => {
    it('should validate standard YouTube watch URLs', async () => {
      const result = await mediaService.validateYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      
      expect(result.isValid).toBe(true);
      expect(result.videoId).toBe('dQw4w9WgXcQ');
    });

    it('should validate shortened YouTube URLs', async () => {
      const result = await mediaService.validateYouTubeUrl('https://youtu.be/dQw4w9WgXcQ');
      
      expect(result.isValid).toBe(true);
      expect(result.videoId).toBe('dQw4w9WgXcQ');
    });

    it('should validate YouTube embed URLs', async () => {
      const result = await mediaService.validateYouTubeUrl('https://www.youtube.com/embed/dQw4w9WgXcQ');
      
      expect(result.isValid).toBe(true);
      expect(result.videoId).toBe('dQw4w9WgXcQ');
    });

    it('should reject invalid YouTube URLs', async () => {
      const result = await mediaService.validateYouTubeUrl('https://example.com/video');
      
      expect(result.isValid).toBe(false);
      expect(result.videoId).toBeUndefined();
    });

    it('should reject malformed URLs', async () => {
      const result = await mediaService.validateYouTubeUrl('not-a-url');
      
      expect(result.isValid).toBe(false);
      expect(result.videoId).toBeUndefined();
    });
  });

  describe('getYouTubeThumbnail', () => {
    it('should return thumbnail URL for valid video ID', async () => {
      const videoId = 'dQw4w9WgXcQ';
      const thumbnailUrl = await mediaService.getYouTubeThumbnail(videoId);
      
      expect(thumbnailUrl).toBe(`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`);
    });

    it('should handle empty video ID', async () => {
      const thumbnailUrl = await mediaService.getYouTubeThumbnail('');
      
      expect(thumbnailUrl).toBe('https://img.youtube.com/vi//maxresdefault.jpg');
    });
  });

  describe('validateMediaGallery', () => {
    it('should validate a proper media gallery', async () => {
      const mediaItems = [
        {
          id: 'media1',
          type: 'image' as const,
          url: 'https://utfs.io/f/image.jpg',
          order: 0,
          createdAt: new Date()
        },
        {
          id: 'media2',
          type: 'video' as const,
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          order: 1,
          createdAt: new Date()
        }
      ];

      await expect(
        mediaService.validateMediaGallery(mediaItems)
      ).resolves.not.toThrow();
    });

    it('should throw error when exceeding maximum items', async () => {
      const mediaItems = Array.from({ length: MEDIA_LIMITS.MAX_ITEMS + 1 }, (_, i) => ({
        id: `media${i}`,
        type: 'image' as const,
        url: 'https://utfs.io/f/image.jpg',
        order: i,
        createdAt: new Date()
      }));

      await expect(
        mediaService.validateMediaGallery(mediaItems)
      ).rejects.toThrow(`Maximum ${MEDIA_LIMITS.MAX_ITEMS} media items allowed`);
    });

    it('should throw error for non-sequential order', async () => {
      const mediaItems = [
        {
          id: 'media1',
          type: 'image' as const,
          url: 'https://utfs.io/f/image.jpg',
          order: 0,
          createdAt: new Date()
        },
        {
          id: 'media2',
          type: 'image' as const,
          url: 'https://utfs.io/f/image2.jpg',
          order: 2, // Missing order 1
          createdAt: new Date()
        }
      ];

      await expect(
        mediaService.validateMediaGallery(mediaItems)
      ).rejects.toThrow('Media items must have sequential order starting from 0');
    });

    it('should validate and set thumbnail for YouTube videos', async () => {
      const mediaItems: Array<{
        id: string;
        type: 'video';
        url: string;
        order: number;
        createdAt: Date;
        thumbnail?: string;
      }> = [
        {
          id: 'media1',
          type: 'video' as const,
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          order: 0,
          createdAt: new Date()
        }
      ];

      await mediaService.validateMediaGallery(mediaItems);

      expect(mediaItems[0].thumbnail).toBe('https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg');
    });

    it('should throw error for invalid YouTube URLs', async () => {
      const mediaItems = [
        {
          id: 'media1',
          type: 'video' as const,
          url: 'https://example.com/fake-video',
          order: 0,
          createdAt: new Date()
        }
      ];

      await expect(
        mediaService.validateMediaGallery(mediaItems)
      ).rejects.toThrow('Invalid YouTube URL: https://example.com/fake-video');
    });

    it('should throw error for insecure URLs', async () => {
      const mediaItems = [
        {
          id: 'media1',
          type: 'image' as const,
          url: 'http://insecure.com/image.jpg', // HTTP instead of HTTPS
          order: 0,
          createdAt: new Date()
        }
      ];

      await expect(
        mediaService.validateMediaGallery(mediaItems)
      ).rejects.toThrow('Insecure URL detected: http://insecure.com/image.jpg');
    });
  });

  describe('deleteMediaFiles', () => {
    it('should handle empty URL array', async () => {
      await expect(
        mediaService.deleteMediaFiles([])
      ).resolves.not.toThrow();
    });

    it('should filter UploadThing URLs and handle deletion', async () => {
      const urls = [
        'https://utfs.io/f/image1.jpg',
        'https://example.com/image2.jpg', // Non-UploadThing URL should be filtered out
        'https://utfs.io/f/image3.jpg'
      ];

      // Should complete without errors and filter correctly
      await expect(mediaService.deleteMediaFiles(urls)).resolves.toBeUndefined();
    });
  });

  describe('getMediaMetadata', () => {
    it('should return cached metadata when available', async () => {
      const cachedData = { views: 5, lastViewed: new Date() };
      mockRedisGet.mockResolvedValue(JSON.stringify(cachedData));

      const result = await mediaService.getMediaMetadata('media123');

      expect(mockRedisGet).toHaveBeenCalledWith('media:metadata:media123');
      expect(result).toEqual(cachedData);
    });

    it('should return default metadata and cache it when not cached', async () => {
      mockRedisGet.mockResolvedValue(null);
      mockRedisSetex.mockResolvedValue('OK');

      const result = await mediaService.getMediaMetadata('media123');

      expect(mockRedisGet).toHaveBeenCalledWith('media:metadata:media123');
      expect(result).toMatchObject({
        views: 0,
        lastViewed: expect.any(Date)
      });
      expect(mockRedisSetex).toHaveBeenCalledWith(
        'media:metadata:media123',
        3600,
        expect.any(String)
      );
    });

    it('should handle Redis errors gracefully', async () => {
      mockRedisGet.mockRejectedValue(new Error('Redis connection failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await mediaService.getMediaMetadata('media123');

      expect(result).toMatchObject({
        views: 0,
        lastViewed: expect.any(Date)
      });
      expect(consoleSpy).toHaveBeenCalledWith('Redis error:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('private methods', () => {
    describe('getMediaType', () => {
      it('should return "image" for image MIME types', () => {
        const mediaService = new MediaService();
        // Access private method for testing
        const getMediaType = (mediaService as any).getMediaType.bind(mediaService);
        
        expect(getMediaType('image/jpeg')).toBe('image');
        expect(getMediaType('image/png')).toBe('image');
        expect(getMediaType('image/webp')).toBe('image');
      });

      it('should return "video" for video MIME types', () => {
        const mediaService = new MediaService();
        const getMediaType = (mediaService as any).getMediaType.bind(mediaService);
        
        expect(getMediaType('video/mp4')).toBe('video');
        expect(getMediaType('video/webm')).toBe('video');
      });

      it('should throw error for unsupported MIME types', () => {
        const mediaService = new MediaService();
        const getMediaType = (mediaService as any).getMediaType.bind(mediaService);
        
        expect(() => getMediaType('text/plain')).toThrow('Unsupported media type: text/plain');
        expect(() => getMediaType('application/pdf')).toThrow('Unsupported media type: application/pdf');
      });
    });

    describe('isValidFileType', () => {
      it('should validate supported image types', () => {
        const mediaService = new MediaService();
        const isValidFileType = (mediaService as any).isValidFileType.bind(mediaService);
        
        expect(isValidFileType('image/jpeg')).toBe(true);
        expect(isValidFileType('image/png')).toBe(true);
        expect(isValidFileType('image/webp')).toBe(true);
      });

      it('should validate supported video types', () => {
        const mediaService = new MediaService();
        const isValidFileType = (mediaService as any).isValidFileType.bind(mediaService);
        
        expect(isValidFileType('video/mp4')).toBe(true);
        expect(isValidFileType('video/webm')).toBe(true);
      });

      it('should reject unsupported file types', () => {
        const mediaService = new MediaService();
        const isValidFileType = (mediaService as any).isValidFileType.bind(mediaService);
        
        expect(isValidFileType('text/plain')).toBe(false);
        expect(isValidFileType('application/pdf')).toBe(false);
        expect(isValidFileType('audio/mp3')).toBe(false);
      });
    });

    describe('isSecureUrl', () => {
      it('should accept HTTPS URLs from allowed domains', () => {
        const mediaService = new MediaService();
        const isSecureUrl = (mediaService as any).isSecureUrl.bind(mediaService);
        
        expect(isSecureUrl('https://utfs.io/f/image.jpg')).toBe(true);
        expect(isSecureUrl('https://youtube.com/watch?v=abc')).toBe(true);
        expect(isSecureUrl('https://youtu.be/abc')).toBe(true);
        expect(isSecureUrl('https://img.youtube.com/vi/abc/default.jpg')).toBe(true);
      });

      it('should reject HTTP URLs', () => {
        const mediaService = new MediaService();
        const isSecureUrl = (mediaService as any).isSecureUrl.bind(mediaService);
        
        expect(isSecureUrl('http://utfs.io/f/image.jpg')).toBe(false);
      });

      it('should reject URLs from disallowed domains', () => {
        const mediaService = new MediaService();
        const isSecureUrl = (mediaService as any).isSecureUrl.bind(mediaService);
        
        expect(isSecureUrl('https://malicious.com/image.jpg')).toBe(false);
        expect(isSecureUrl('https://example.com/video.mp4')).toBe(false);
      });

      it('should reject malformed URLs', () => {
        const mediaService = new MediaService();
        const isSecureUrl = (mediaService as any).isSecureUrl.bind(mediaService);
        
        expect(isSecureUrl('not-a-url')).toBe(false);
        expect(isSecureUrl('')).toBe(false);
      });
    });
  });
});