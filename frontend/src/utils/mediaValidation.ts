import { MEDIA_LIMITS } from '@/types/media';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  warnings?: string[];
}

export const validateMediaFile = (file: File): ValidationResult => {
  const warnings: string[] = [];
  
  if (file.type.startsWith('image/')) {
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    
    if (!validImageTypes.includes(file.type)) {
      return {
        isValid: false,
        error: 'Invalid image format. Supported formats: JPEG, PNG, WebP, GIF',
      };
    }
    
    if (file.size > MEDIA_LIMITS.MAX_IMAGE_SIZE) {
      return {
        isValid: false,
        error: `Image too large. Maximum size: ${formatFileSize(MEDIA_LIMITS.MAX_IMAGE_SIZE)}`,
      };
    }
    
    if (file.size > 2 * 1024 * 1024) {
      warnings.push('Large image files may take longer to upload and load');
    }
  } else if (file.type.startsWith('video/')) {
    const validVideoTypes = ['video/mp4', 'video/webm', 'video/mov', 'video/avi'];
    
    if (!validVideoTypes.includes(file.type)) {
      return {
        isValid: false,
        error: 'Invalid video format. Supported formats: MP4, WebM, MOV, AVI',
      };
    }
    
    if (file.size > MEDIA_LIMITS.MAX_VIDEO_SIZE) {
      return {
        isValid: false,
        error: `Video too large. Maximum size: ${formatFileSize(MEDIA_LIMITS.MAX_VIDEO_SIZE)}`,
      };
    }
    
    if (file.size > 50 * 1024 * 1024) {
      warnings.push('Large video files may take several minutes to upload');
    }
  } else {
    return {
      isValid: false,
      error: 'Invalid file type. Only images and videos are allowed',
    };
  }
  
  return {
    isValid: true,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
};

export const validateMediaFiles = (files: File[], currentCount: number, maxItems: number): ValidationResult => {
  if (files.length === 0) {
    return {
      isValid: false,
      error: 'No files selected',
    };
  }
  
  if (currentCount + files.length > maxItems) {
    return {
      isValid: false,
      error: `Cannot add ${files.length} files. Maximum ${maxItems} items allowed (${currentCount} currently)`,
    };
  }
  
  const oversizedFiles: string[] = [];
  const invalidFiles: string[] = [];
  const allWarnings: string[] = [];
  
  for (const file of files) {
    const result = validateMediaFile(file);
    
    if (!result.isValid) {
      if (result.error?.includes('too large')) {
        oversizedFiles.push(`${file.name}: ${result.error}`);
      } else {
        invalidFiles.push(`${file.name}: ${result.error}`);
      }
    }
    
    if (result.warnings) {
      allWarnings.push(...result.warnings);
    }
  }
  
  if (invalidFiles.length > 0) {
    return {
      isValid: false,
      error: `Invalid files:\n${invalidFiles.join('\n')}`,
    };
  }
  
  if (oversizedFiles.length > 0) {
    return {
      isValid: false,
      error: `Files too large:\n${oversizedFiles.join('\n')}`,
    };
  }
  
  return {
    isValid: true,
    warnings: allWarnings.length > 0 ? [...new Set(allWarnings)] : undefined,
  };
};

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}