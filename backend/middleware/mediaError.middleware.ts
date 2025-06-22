import { Request, Response, NextFunction } from 'express';

export const mediaErrorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  // Handle media-specific errors
  if (error.message.includes('media') || error.message.includes('Media')) {
    console.error('Media operation error:', {
      path: req.path,
      method: req.method,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
    
    // Check for specific media errors
    if (error.message.includes('Maximum 6 media items')) {
      res.status(400).json({
        status: 'error',
        message: 'Media gallery limit reached. Maximum 6 items allowed.',
        code: 'MEDIA_LIMIT_EXCEEDED',
      });
      return;
    }
    
    if (error.message.includes('Invalid YouTube URL')) {
      res.status(400).json({
        status: 'error',
        message: 'Invalid YouTube URL format. Please check the URL and try again.',
        code: 'INVALID_YOUTUBE_URL',
      });
      return;
    }
    
    if (error.message.includes('Cannot delete the last image')) {
      res.status(400).json({
        status: 'error',
        message: 'At least one image must remain in the gallery.',
        code: 'LAST_IMAGE_PROTECTION',
      });
      return;
    }
    
    if (error.message.includes('Media gallery is full')) {
      res.status(400).json({
        status: 'error',
        message: 'Media gallery is full. Remove existing items before adding new ones.',
        code: 'MEDIA_GALLERY_FULL',
      });
      return;
    }
    
    if (error.message.includes('Media item not found')) {
      res.status(404).json({
        status: 'error',
        message: 'Media item not found.',
        code: 'MEDIA_ITEM_NOT_FOUND',
      });
      return;
    }
    
    if (error.message.includes('Failed to process uploaded files')) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to process uploaded files. Please try again.',
        code: 'MEDIA_PROCESSING_ERROR',
      });
      return;
    }
    
    if (error.message.includes('Failed to reorder media')) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to reorder media items due to concurrent modifications. Please try again.',
        code: 'MEDIA_REORDER_CONFLICT',
      });
      return;
    }
  }
  
  // Pass to next error handler
  next(error);
};