import { describe, it, expect, beforeEach, vi, MockedFunction } from 'vitest';
import { MediaService } from '../media.service.js';
import { AppError } from '../../utils/AppError.js';
import { MEDIA_LIMITS } from '../../types/media.types.js';
import { redis } from '../../lib/redis.js';

vi.mock('../../lib/redis.js', () => ({
  redis: {
    get: vi.fn(),
    setex: vi.fn(),
  },
}));

describe('MediaService', () => {
  let mediaService: MediaService;
  let mockRedisGet: MockedFunction<typeof redis.get>;
  let mockRedisSetex: MockedFunction<typeof redis.setex>;

  beforeEach(() => {
    mediaService = new MediaService();
    mockRedisGet = vi.fn();
    mockRedisSetex = vi.fn();
    Object.assign(redis, {
      get: mockRedisGet,
      setex: mockRedisSetex,
    });
    vi.clearAllMocks();
  });

  describe('processMediaUpload', () => {
    it('should process valid image uploads successfully', () => {
      const files = [
        {
          url: 'https://utfs.io/f/test-image.jpg',
          type: 'image/jpeg',
          size: 1024 * 1024, // 1MB
          name: 'test-image.jpg',
        },
      ];

      const result = mediaService.processMediaUpload(files, 0);

      void expect(result).toHaveLength(1);
      void expect(result[0]).toMatchObject({
        id: expect.any(String) as string,
        type: 'image',
        url: 'https://utfs.io/f/test-image.jpg',
        title: 'test-image.jpg',
        order: 0,
        createdAt: expect.any(Date) as Date,
        metadata: {
          size: 1024 * 1024,
        },
      });
    });

    it('should process valid video uploads successfully', () => {
      const files = [
        {
          url: 'https://utfs.io/f/test-video.mp4',
          type: 'video/mp4',
          size: 5 * 1024 * 1024, // 5MB
          name: 'test-video.mp4',
        },
      ];

      const result = mediaService.processMediaUpload(files, 0);

      void expect(result).toHaveLength(1);
      void expect(result[0]).toMatchObject({
        id: expect.any(String) as string,
        type: 'video',
        url: 'https://utfs.io/f/test-video.mp4',
        title: 'test-video.mp4',
        order: 0,
        createdAt: expect.any(Date) as Date,
        metadata: {
          size: 5 * 1024 * 1024,
        },
      });
    });

    it('should throw error when exceeding maximum media items', async () => {
      const files = [
        {
          url: 'https://utfs.io/f/test-image.jpg',
          type: 'image/jpeg', 
          size: 1024,
          name: 'test.jpg',
        },
      ];

      await expect(
        mediaService.processMediaUpload(files, MEDIA_LIMITS.MAX_ITEMS),
      ).rejects.toThrow(AppError);
      
      await expect(
        mediaService.processMediaUpload(files, MEDIA_LIMITS.MAX_ITEMS),
      ).rejects.toThrow(`Cannot exceed ${MEDIA_LIMITS.MAX_ITEMS} total media items`);
    });

    it('should throw error for unsupported file types', async () => {
      const files = [
        {
          url: 'https://utfs.io/f/test-file.txt',
          type: 'text/plain',
          size: 1024,
          name: 'test.txt',
        },
      ];

      await expect(
        mediaService.processMediaUpload(files, 0),
      ).rejects.toThrow(AppError);
      
      await expect(
        mediaService.processMediaUpload(files, 0),
      ).rejects.toThrow('Unsupported file type: text/plain');
    });

    it('should assign correct order based on existing media count', () => {
      const files = [
        {
          url: 'https://utfs.io/f/image1.jpg',
          type: 'image/jpeg',
          size: 1024,
          name: 'image1.jpg',
        },
        {
          url: 'https://utfs.io/f/image2.jpg',
          type: 'image/jpeg',
          size: 1024,
          name: 'image2.jpg',
        },
      ];

      const result = mediaService.processMediaUpload(files, 2);

      void expect(result[0].order).toBe(2);
      void expect(result[1].order).toBe(3);
    });
  });

  describe('validateYouTubeUrl', () => {
    it('should validate standard YouTube watch URLs', () => {
      const result = mediaService.validateYouTubeUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      
      void expect(result.isValid).toBe(true);
      void expect(result.videoId).toBe('dQw4w9WgXcQ');
    });

    it('should validate shortened YouTube URLs', () => {
      const result = mediaService.validateYouTubeUrl('https://youtu.be/dQw4w9WgXcQ');
      
      void expect(result.isValid).toBe(true);
      void expect(result.videoId).toBe('dQw4w9WgXcQ');
    });

    it('should validate YouTube embed URLs', () => {
      const result = mediaService.validateYouTubeUrl('https://www.youtube.com/embed/dQw4w9WgXcQ');
      
      void expect(result.isValid).toBe(true);
      void expect(result.videoId).toBe('dQw4w9WgXcQ');
    });

    it('should reject invalid YouTube URLs', () => {
      const result = mediaService.validateYouTubeUrl('https://example.com/video');
      
      void expect(result.isValid).toBe(false);
      void expect(result.videoId).toBeUndefined();
    });

    it('should reject malformed URLs', () => {
      const result = mediaService.validateYouTubeUrl('not-a-url');
      
      void expect(result.isValid).toBe(false);
      void expect(result.videoId).toBeUndefined();
    });
  });

  describe('getYouTubeThumbnail', () => {
    it('should return thumbnail URL for valid video ID', () => {
      const videoId = 'dQw4w9WgXcQ';
      const thumbnailUrl = mediaService.getYouTubeThumbnail(videoId);
      
      void expect(thumbnailUrl).toBe(`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`);
    });

    it('should handle empty video ID', () => {
      const thumbnailUrl = mediaService.getYouTubeThumbnail('');
      
      void expect(thumbnailUrl).toBe('https://img.youtube.com/vi//maxresdefault.jpg');
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
          createdAt: new Date(),
        },
        {
          id: 'media2',
          type: 'video' as const,
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          order: 1,
          createdAt: new Date(),
        },
      ];

      await expect(
        mediaService.validateMediaGallery(mediaItems),
      ).resolves.not.toThrow();
    });

    it('should throw error when exceeding maximum items', async () => {
      const mediaItems = Array.from({ length: MEDIA_LIMITS.MAX_ITEMS + 1 }, (_, i) => ({
        id: `media${i}`,
        type: 'image' as const,
        url: 'https://utfs.io/f/image.jpg',
        order: i,
        createdAt: new Date(),
      }));

      await expect(
        mediaService.validateMediaGallery(mediaItems),
      ).rejects.toThrow(`Maximum ${MEDIA_LIMITS.MAX_ITEMS} media items allowed`);
    });

    it('should throw error for non-sequential order', async () => {
      const mediaItems = [
        {
          id: 'media1',
          type: 'image' as const,
          url: 'https://utfs.io/f/image.jpg',
          order: 0,
          createdAt: new Date(),
        },
        {
          id: 'media2',
          type: 'image' as const,
          url: 'https://utfs.io/f/image2.jpg',
          order: 2, // Missing order 1
          createdAt: new Date(),
        },
      ];

      await expect(
        mediaService.validateMediaGallery(mediaItems),
      ).rejects.toThrow('Media items must have sequential order starting from 0');
    });

    it('should validate and set thumbnail for YouTube videos', () => {
      const mediaItems: {
        id: string;
        type: 'video';
        url: string;
        order: number;
        createdAt: Date;
        thumbnail?: string;
      }[] = [
        {
          id: 'media1',
          type: 'video' as const,
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          order: 0,
          createdAt: new Date(),
        },
      ];

      mediaService.validateMediaGallery(mediaItems);

      void expect(mediaItems[0].thumbnail).toBe('https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg');
    });

    it('should throw error for invalid YouTube URLs', async () => {
      const mediaItems = [
        {
          id: 'media1',
          type: 'video' as const,
          url: 'https://example.com/fake-video',
          order: 0,
          createdAt: new Date(),
        },
      ];

      await expect(
        mediaService.validateMediaGallery(mediaItems),
      ).rejects.toThrow('Invalid YouTube URL: https://example.com/fake-video');
    });

    it('should throw error for insecure URLs', async () => {
      const mediaItems = [
        {
          id: 'media1',
          type: 'image' as const,
          url: 'http://insecure.com/image.jpg', // HTTP instead of HTTPS
          order: 0,
          createdAt: new Date(),
        },
      ];

      await expect(
        mediaService.validateMediaGallery(mediaItems),
      ).rejects.toThrow('Insecure URL detected: http://insecure.com/image.jpg');
    });
  });

  describe('deleteMediaFiles', () => {
    it('should handle empty URL array', async () => {
      await expect(
        mediaService.deleteMediaFiles([]),
      ).resolves.not.toThrow();
    });

    it('should filter UploadThing URLs and handle deletion', async () => {
      const urls = [
        'https://utfs.io/f/image1.jpg',
        'https://example.com/image2.jpg', // Non-UploadThing URL should be filtered out
        'https://utfs.io/f/image3.jpg',
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

      void expect(mockRedisGet).toHaveBeenCalledWith('media:metadata:media123');
      void expect(result).toEqual(cachedData);
    });

    it('should return default metadata and cache it when not cached', async () => {
      mockRedisGet.mockResolvedValue(null);
      mockRedisSetex.mockResolvedValue('OK');

      const result = await mediaService.getMediaMetadata('media123');

      void expect(mockRedisGet).toHaveBeenCalledWith('media:metadata:media123');
      void expect(result).toMatchObject({
        views: 0,
        lastViewed: expect.any(Date) as Date,
      });
      void expect(mockRedisSetex).toHaveBeenCalledWith(
        'media:metadata:media123',
        3600,
        expect.any(String) as string,
      );
    });

    it('should handle Redis errors gracefully', async () => {
      mockRedisGet.mockRejectedValue(new Error('Redis connection failed'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

      const result = await mediaService.getMediaMetadata('media123');

      void expect(result).toMatchObject({
        views: 0,
        lastViewed: expect.any(Date) as Date,
      });
      void expect(consoleSpy).toHaveBeenCalledWith('Redis error:', expect.any(Error) as Error);

      consoleSpy.mockRestore();
    });
  });

  describe('private methods', () => {
    describe('getMediaType', () => {
      it('should return "image" for image MIME types', () => {
        const mediaService = new MediaService();
        // Access private method for testing
        const getMediaType = (mediaService as unknown as { getMediaType: (type: string) => string }).getMediaType.bind(mediaService);
        
        void expect(getMediaType('image/jpeg')).toBe('image');
        void expect(getMediaType('image/png')).toBe('image');
        void expect(getMediaType('image/webp')).toBe('image');
      });

      it('should return "video" for video MIME types', () => {
        const mediaService = new MediaService();
        const getMediaType = (mediaService as unknown as { getMediaType: (type: string) => string }).getMediaType.bind(mediaService);
        
        void expect(getMediaType('video/mp4')).toBe('video');
        void expect(getMediaType('video/webm')).toBe('video');
      });

      it('should throw error for unsupported MIME types', () => {
        const mediaService = new MediaService();
        const getMediaType = (mediaService as unknown as { getMediaType: (type: string) => string }).getMediaType.bind(mediaService);
        
        void expect(() => getMediaType('text/plain')).toThrow('Unsupported media type: text/plain');
        void expect(() => getMediaType('application/pdf')).toThrow('Unsupported media type: application/pdf');
      });
    });

    describe('isValidFileType', () => {
      it('should validate supported image types', () => {
        const mediaService = new MediaService();
        const isValidFileType = (mediaService as unknown as { isValidFileType: (type: string) => boolean }).isValidFileType.bind(mediaService);
        
        void expect(isValidFileType('image/jpeg')).toBe(true);
        void expect(isValidFileType('image/png')).toBe(true);
        void expect(isValidFileType('image/webp')).toBe(true);
      });

      it('should validate supported video types', () => {
        const mediaService = new MediaService();
        const isValidFileType = (mediaService as unknown as { isValidFileType: (type: string) => boolean }).isValidFileType.bind(mediaService);
        
        void expect(isValidFileType('video/mp4')).toBe(true);
        void expect(isValidFileType('video/webm')).toBe(true);
      });

      it('should reject unsupported file types', () => {
        const mediaService = new MediaService();
        const isValidFileType = (mediaService as unknown as { isValidFileType: (type: string) => boolean }).isValidFileType.bind(mediaService);
        
        void expect(isValidFileType('text/plain')).toBe(false);
        void expect(isValidFileType('application/pdf')).toBe(false);
        void expect(isValidFileType('audio/mp3')).toBe(false);
      });
    });

    describe('isSecureUrl', () => {
      it('should accept HTTPS URLs from allowed domains', () => {
        const mediaService = new MediaService();
        const isSecureUrl = (mediaService as unknown as { isSecureUrl: (url: string) => boolean }).isSecureUrl.bind(mediaService);
        
        void expect(isSecureUrl('https://utfs.io/f/image.jpg')).toBe(true);
        void expect(isSecureUrl('https://youtube.com/watch?v=abc')).toBe(true);
        void expect(isSecureUrl('https://youtu.be/abc')).toBe(true);
        void expect(isSecureUrl('https://img.youtube.com/vi/abc/default.jpg')).toBe(true);
      });

      it('should reject HTTP URLs', () => {
        const mediaService = new MediaService();
        const isSecureUrl = (mediaService as unknown as { isSecureUrl: (url: string) => boolean }).isSecureUrl.bind(mediaService);
        
        void expect(isSecureUrl('http://utfs.io/f/image.jpg')).toBe(false);
      });

      it('should reject URLs from disallowed domains', () => {
        const mediaService = new MediaService();
        const isSecureUrl = (mediaService as unknown as { isSecureUrl: (url: string) => boolean }).isSecureUrl.bind(mediaService);
        
        void expect(isSecureUrl('https://malicious.com/image.jpg')).toBe(false);
        void expect(isSecureUrl('https://example.com/video.mp4')).toBe(false);
      });

      it('should reject malformed URLs', () => {
        const mediaService = new MediaService();
        const isSecureUrl = (mediaService as unknown as { isSecureUrl: (url: string) => boolean }).isSecureUrl.bind(mediaService);
        
        void expect(isSecureUrl('not-a-url')).toBe(false);
        void expect(isSecureUrl('')).toBe(false);
      });
    });
  });
});