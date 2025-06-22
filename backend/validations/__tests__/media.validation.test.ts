import { describe, it, expect } from 'vitest';
import { 
  mediaItemSchema,
  mediaGallerySchema,
  youtubeUrlSchema,
  mediaUploadSchema,
  mediaReorderSchema
} from '../media.validation.js';
import { MEDIA_LIMITS } from '../../types/media.types.js';

describe('Media Validation Schemas', () => {
  describe('mediaItemSchema', () => {
    it('should validate a proper media item', () => {
      const validMediaItem = {
        id: 'media123',
        type: 'image',
        url: 'https://utfs.io/f/test-image.jpg',
        title: 'Test Image',
        order: 0,
        createdAt: new Date(),
        metadata: {
          size: 1024,
          dimensions: {
            width: 800,
            height: 600
          }
        }
      };

      const result = mediaItemSchema.safeParse(validMediaItem);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data).toMatchObject(validMediaItem);
      }
    });

    it('should validate minimal media item', () => {
      const minimalMediaItem = {
        id: 'media123',
        type: 'image',
        url: 'https://utfs.io/f/test-image.jpg',
        order: 0,
        createdAt: new Date()
      };

      const result = mediaItemSchema.safeParse(minimalMediaItem);
      expect(result.success).toBe(true);
    });

    it('should validate video media item with duration', () => {
      const videoMediaItem = {
        id: 'video123',
        type: 'video',
        url: 'https://utfs.io/f/test-video.mp4',
        thumbnail: 'https://utfs.io/f/test-thumbnail.jpg',
        order: 1,
        createdAt: new Date(),
        metadata: {
          size: 5 * 1024 * 1024,
          duration: 120,
          dimensions: {
            width: 1920,
            height: 1080
          }
        }
      };

      const result = mediaItemSchema.safeParse(videoMediaItem);
      expect(result.success).toBe(true);
    });

    it('should reject invalid media type', () => {
      const invalidMediaItem = {
        id: 'media123',
        type: 'audio', // Invalid type
        url: 'https://utfs.io/f/test-audio.mp3',
        order: 0,
        createdAt: new Date()
      };

      const result = mediaItemSchema.safeParse(invalidMediaItem);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Invalid enum value");
      }
    });

    it('should reject missing required fields', () => {
      const incompleteMediaItem = {
        id: 'media123',
        type: 'image',
        // Missing url, order, createdAt
      };

      const result = mediaItemSchema.safeParse(incompleteMediaItem);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        const missingFields = result.error.issues.map(issue => issue.path[0]);
        expect(missingFields).toContain('url');
        expect(missingFields).toContain('order');
        // createdAt has a default, so it's not required
      }
    });

    it('should reject negative order', () => {
      const invalidOrderItem = {
        id: 'media123',
        type: 'image',
        url: 'https://utfs.io/f/test-image.jpg',
        order: -1, // Invalid negative order
        createdAt: new Date()
      };

      const result = mediaItemSchema.safeParse(invalidOrderItem);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Number must be greater than or equal to 0");
      }
    });

    it('should validate variant-specific media item', () => {
      const variantMediaItem = {
        id: 'media123',
        type: 'image',
        url: 'https://utfs.io/f/variant-image.jpg',
        title: 'Red Variant Image',
        order: 0,
        variantId: 'variant-red-m',
        createdAt: new Date()
      };

      const result = mediaItemSchema.safeParse(variantMediaItem);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data.variantId).toBe('variant-red-m');
      }
    });
  });

  describe('mediaGallerySchema', () => {
    it('should validate empty gallery', () => {
      const result = mediaGallerySchema.safeParse([]);
      expect(result.success).toBe(true);
    });

    it('should validate gallery with multiple items', () => {
      const gallery = [
        {
          id: 'media1',
          type: 'image',
          url: 'https://utfs.io/f/image1.jpg',
          order: 0,
          createdAt: new Date()
        },
        {
          id: 'media2',
          type: 'video',
          url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
          order: 1,
          createdAt: new Date()
        }
      ];

      const result = mediaGallerySchema.safeParse(gallery);
      expect(result.success).toBe(true);
    });

    it('should reject gallery exceeding maximum items', () => {
      const oversizedGallery = Array.from({ length: MEDIA_LIMITS.MAX_ITEMS + 1 }, (_, i) => ({
        id: `media${i}`,
        type: 'image' as const,
        url: `https://utfs.io/f/image${i}.jpg`,
        order: i,
        createdAt: new Date()
      }));

      const result = mediaGallerySchema.safeParse(oversizedGallery);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(`Array must contain at most ${MEDIA_LIMITS.MAX_ITEMS} element(s)`);
      }
    });

    it('should reject gallery with duplicate IDs', () => {
      const duplicateGallery = [
        {
          id: 'media1',
          type: 'image',
          url: 'https://utfs.io/f/image1.jpg',
          order: 0,
          createdAt: new Date()
        },
        {
          id: 'media1', // Duplicate ID
          type: 'image',
          url: 'https://utfs.io/f/image2.jpg',
          order: 1,
          createdAt: new Date()
        }
      ];

      const result = mediaGallerySchema.safeParse(duplicateGallery);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Duplicate media item IDs found");
      }
    });

    it('should reject gallery with non-sequential orders', () => {
      const nonSequentialGallery = [
        {
          id: 'media1',
          type: 'image',
          url: 'https://utfs.io/f/image1.jpg',
          order: 0,
          createdAt: new Date()
        },
        {
          id: 'media2',
          type: 'image',
          url: 'https://utfs.io/f/image2.jpg',
          order: 2, // Skips order 1
          createdAt: new Date()
        }
      ];

      const result = mediaGallerySchema.safeParse(nonSequentialGallery);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Media items must have sequential order starting from 0");
      }
    });

    it('should reject gallery not starting from order 0', () => {
      const invalidStartGallery = [
        {
          id: 'media1',
          type: 'image',
          url: 'https://utfs.io/f/image1.jpg',
          order: 1, // Should start from 0
          createdAt: new Date()
        }
      ];

      const result = mediaGallerySchema.safeParse(invalidStartGallery);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Media items must have sequential order starting from 0");
      }
    });
  });

  describe('youtubeUrlSchema', () => {
    it('should validate standard YouTube watch URL', () => {
      const validUrls = [
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'https://youtube.com/watch?v=dQw4w9WgXcQ',
        'http://www.youtube.com/watch?v=dQw4w9WgXcQ'
      ];

      validUrls.forEach(url => {
        const result = youtubeUrlSchema.safeParse(url);
        expect(result.success).toBe(true);
      });
    });

    it('should validate shortened YouTube URL', () => {
      const validUrls = [
        'https://youtu.be/dQw4w9WgXcQ',
        'http://youtu.be/dQw4w9WgXcQ'
      ];

      validUrls.forEach(url => {
        const result = youtubeUrlSchema.safeParse(url);
        expect(result.success).toBe(true);
      });
    });

    it('should validate YouTube embed URL', () => {
      const validUrls = [
        'https://www.youtube.com/embed/dQw4w9WgXcQ',
        'http://youtube.com/embed/dQw4w9WgXcQ'
      ];

      validUrls.forEach(url => {
        const result = youtubeUrlSchema.safeParse(url);
        expect(result.success).toBe(true);
      });
    });

    it('should reject non-YouTube URLs', () => {
      const invalidUrls = [
        'https://vimeo.com/123456789',
        'https://example.com/video',
        'https://dailymotion.com/video/abc123',
        'not-a-url'
      ];

      invalidUrls.forEach(url => {
        const result = youtubeUrlSchema.safeParse(url);
        expect(result.success).toBe(false);
        
        if (!result.success) {
          expect(result.error.issues[0].message).toContain("Invalid YouTube URL format");
        }
      });
    });

    it('should reject malformed YouTube URLs', () => {
      const malformedUrls = [
        'https://youtube.com/watch', // Missing video ID
        'https://youtu.be/', // Missing video ID
        'https://youtube.com/embed/', // Missing video ID
        'https://youtube.com/watch?video=dQw4w9WgXcQ' // Wrong parameter name
      ];

      malformedUrls.forEach(url => {
        const result = youtubeUrlSchema.safeParse(url);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('mediaUploadSchema', () => {
    it('should validate single file upload', () => {
      const uploadData = {
        files: [
          {
            url: 'https://utfs.io/f/test-image.jpg',
            type: 'image/jpeg',
            size: 1024 * 1024,
            name: 'test-image.jpg'
          }
        ],
        existingMediaCount: 0
      };

      const result = mediaUploadSchema.safeParse(uploadData);
      expect(result.success).toBe(true);
    });

    it('should validate multiple file upload', () => {
      const uploadData = {
        files: [
          {
            url: 'https://utfs.io/f/image1.jpg',
            type: 'image/jpeg',
            size: 1024 * 1024,
            name: 'image1.jpg'
          },
          {
            url: 'https://utfs.io/f/video1.mp4',
            type: 'video/mp4',
            size: 5 * 1024 * 1024,
            name: 'video1.mp4'
          }
        ],
        existingMediaCount: 2
      };

      const result = mediaUploadSchema.safeParse(uploadData);
      expect(result.success).toBe(true);
    });

    it('should validate upload with default existingMediaCount', () => {
      const uploadData = {
        files: [
          {
            url: 'https://utfs.io/f/test-image.jpg',
            type: 'image/jpeg',
            size: 1024 * 1024,
            name: 'test-image.jpg'
          }
        ]
        // existingMediaCount should default to 0
      };

      const result = mediaUploadSchema.safeParse(uploadData);
      expect(result.success).toBe(true);
      
      if (result.success) {
        expect(result.data.existingMediaCount).toBe(0);
      }
    });

    it('should reject upload exceeding total media limit', () => {
      const uploadData = {
        files: Array.from({ length: 3 }, (_, i) => ({
          url: `https://utfs.io/f/image${i}.jpg`,
          type: 'image/jpeg',
          size: 1024 * 1024,
          name: `image${i}.jpg`
        })),
        existingMediaCount: MEDIA_LIMITS.MAX_ITEMS - 1 // Would exceed limit
      };

      const result = mediaUploadSchema.safeParse(uploadData);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues[0].message).toContain(`Total media items cannot exceed ${MEDIA_LIMITS.MAX_ITEMS}`);
      }
    });

    it('should reject empty files array', () => {
      const uploadData = {
        files: [],
        existingMediaCount: 0
      };

      const result = mediaUploadSchema.safeParse(uploadData);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Array must contain at least 1 element(s)");
      }
    });

    it('should reject files with missing required fields', () => {
      const uploadData = {
        files: [
          {
            url: 'https://utfs.io/f/test-image.jpg',
            // Missing type, size, name
          }
        ],
        existingMediaCount: 0
      };

      const result = mediaUploadSchema.safeParse(uploadData);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        const missingFields = result.error.issues.map(issue => 
          issue.path[issue.path.length - 1]
        );
        expect(missingFields).toContain('type');
        expect(missingFields).toContain('size');
        expect(missingFields).toContain('name');
      }
    });
  });

  describe('mediaReorderSchema', () => {
    it('should validate proper reorder data', () => {
      const reorderData = {
        mediaItems: [
          { id: 'media1', order: 0 },
          { id: 'media2', order: 1 },
          { id: 'media3', order: 2 }
        ]
      };

      const result = mediaReorderSchema.safeParse(reorderData);
      expect(result.success).toBe(true);
    });

    it('should validate single item reorder', () => {
      const reorderData = {
        mediaItems: [
          { id: 'media1', order: 0 }
        ]
      };

      const result = mediaReorderSchema.safeParse(reorderData);
      expect(result.success).toBe(true);
    });

    it('should reject empty reorder array', () => {
      const reorderData = {
        mediaItems: []
      };

      const result = mediaReorderSchema.safeParse(reorderData);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Array must contain at least 1 element(s)");
      }
    });

    it('should reject reorder with duplicate IDs', () => {
      const reorderData = {
        mediaItems: [
          { id: 'media1', order: 0 },
          { id: 'media1', order: 1 } // Duplicate ID
        ]
      };

      const result = mediaReorderSchema.safeParse(reorderData);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Duplicate media item IDs found in reorder");
      }
    });

    it('should reject reorder with non-sequential orders', () => {
      const reorderData = {
        mediaItems: [
          { id: 'media1', order: 0 },
          { id: 'media2', order: 2 } // Skips order 1
        ]
      };

      const result = mediaReorderSchema.safeParse(reorderData);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Media items must have sequential order starting from 0");
      }
    });

    it('should reject reorder not starting from 0', () => {
      const reorderData = {
        mediaItems: [
          { id: 'media1', order: 1 } // Should start from 0
        ]
      };

      const result = mediaReorderSchema.safeParse(reorderData);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Media items must have sequential order starting from 0");
      }
    });

    it('should reject reorder with negative orders', () => {
      const reorderData = {
        mediaItems: [
          { id: 'media1', order: -1 }
        ]
      };

      const result = mediaReorderSchema.safeParse(reorderData);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Number must be greater than or equal to 0");
      }
    });

    it('should reject items missing required fields', () => {
      const reorderData = {
        mediaItems: [
          { id: 'media1' }, // Missing order
          { order: 1 } // Missing id
        ]
      };

      const result = mediaReorderSchema.safeParse(reorderData);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        const missingFields = result.error.issues.map(issue => 
          issue.path[issue.path.length - 1]
        );
        expect(missingFields).toContain('order');
        expect(missingFields).toContain('id');
      }
    });
  });
});