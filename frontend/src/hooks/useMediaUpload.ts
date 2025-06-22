import { useState, useCallback } from 'react';
import { nanoid } from 'nanoid';
import { toast } from 'sonner';
import { useUploadThing } from '@/lib/uploadthing';
import { validateMediaFiles } from '@/utils/mediaValidation';
import { type MediaItem, type MediaUploadProgress } from '@/types/media';

interface UseMediaUploadOptions {
  onSuccess?: (items: MediaItem[]) => void;
  onError?: (error: Error) => void;
  onProgress?: (progress: Record<string, MediaUploadProgress>) => void;
}

interface UseMediaUploadReturn {
  uploadFiles: (files: File[], currentCount: number, maxItems: number) => Promise<MediaItem[]>;
  uploadProgress: Record<string, MediaUploadProgress>;
  isUploading: boolean;
  cancelUpload: () => void;
}

export const useMediaUpload = (options: UseMediaUploadOptions = {}): UseMediaUploadReturn => {
  const [uploadProgress, setUploadProgress] = useState<Record<string, MediaUploadProgress>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const { startUpload: startImageUpload, isUploading: isUploadingImages } = useUploadThing(
    'productImagesUploader',
    {
      onUploadProgress: (progress) => {
        setUploadProgress(prev => {
          const updated = { ...prev };
          Object.keys(updated).forEach(key => {
            if (updated[key].status === 'uploading') {
              updated[key] = { ...updated[key], progress };
            }
          });
          return updated;
        });
        options.onProgress?.(uploadProgress);
      },
    },
  );

  const { startUpload: startVideoUpload, isUploading: isUploadingVideos } = useUploadThing(
    'productVideoUploader',
    {
      onUploadProgress: (progress) => {
        setUploadProgress(prev => {
          const updated = { ...prev };
          Object.keys(updated).forEach(key => {
            if (updated[key].status === 'uploading') {
              updated[key] = { ...updated[key], progress };
            }
          });
          return updated;
        });
        options.onProgress?.(uploadProgress);
      },
    },
  );

  const uploadFiles = useCallback(
    async (files: File[], currentCount: number, maxItems: number): Promise<MediaItem[]> => {
      const validation = validateMediaFiles(files, currentCount, maxItems);
      
      if (!validation.isValid) {
        const error = new Error(validation.error);
        options.onError?.(error);
        throw error;
      }

      if (validation.warnings) {
        validation.warnings.forEach(warning => {
          toast.warning(warning);
        });
      }

      setIsUploading(true);
      const controller = new AbortController();
      setAbortController(controller);

      const progressMap: Record<string, MediaUploadProgress> = {};
      files.forEach((file, index) => {
        const key = `${file.name}-${index}`;
        progressMap[key] = {
          fileName: file.name,
          progress: 0,
          status: 'uploading',
        };
      });
      setUploadProgress(progressMap);

      try {
        const imageFiles = files.filter(file => file.type.startsWith('image/'));
        const videoFiles = files.filter(file => file.type.startsWith('video/'));

        const uploadResults = await Promise.allSettled([
          imageFiles.length > 0 ? startImageUpload(imageFiles) : Promise.resolve([]),
          videoFiles.length > 0 ? startVideoUpload(videoFiles) : Promise.resolve([]),
        ]);

        const uploadedItems: MediaItem[] = [];
        let fileIndex = 0;

        for (const result of uploadResults) {
          if (result.status === 'fulfilled' && result.value) {
            const uploadedFiles = Array.isArray(result.value) ? result.value : [result.value];
            
            for (const uploadedFile of uploadedFiles) {
              const originalFile = files[fileIndex];
              const mediaItem: MediaItem = {
                id: nanoid(6),
                type: originalFile.type.startsWith('image/') ? 'image' : 'video',
                url: uploadedFile.url,
                title: originalFile.name,
                order: currentCount + fileIndex,
                createdAt: new Date(),
                metadata: {
                  size: originalFile.size,
                  dimensions: originalFile.type.startsWith('image/') 
                    ? await getImageDimensions(originalFile)
                    : undefined,
                },
              };
              
              uploadedItems.push(mediaItem);
              fileIndex++;
            }
          }
        }

        const failedUploads = uploadResults.filter(result => result.status === 'rejected');
        if (failedUploads.length > 0) {
          const errors = failedUploads.map(result => 
            result.status === 'rejected' 
              ? (result.reason instanceof Error ? result.reason.message : String(result.reason))
              : 'Unknown error',
          );
          throw new Error(`Upload failed: ${errors.join(', ')}`);
        }

        setUploadProgress({});
        setIsUploading(false);
        setAbortController(null);
        
        options.onSuccess?.(uploadedItems);
        toast.success(`${uploadedItems.length} file(s) uploaded successfully`);
        
        return uploadedItems;
      } catch (error) {
        setUploadProgress(prev => {
          const updated = { ...prev };
          Object.keys(updated).forEach(key => {
            updated[key] = { ...updated[key], status: 'error', progress: 0 };
          });
          return updated;
        });
        
        setIsUploading(false);
        setAbortController(null);
        
        const uploadError = error instanceof Error ? error : new Error('Upload failed');
        options.onError?.(uploadError);
        throw uploadError;
      }
    },
    [startImageUpload, startVideoUpload, options],
  );

  const cancelUpload = useCallback(() => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
    setIsUploading(false);
    setUploadProgress({});
    toast.info('Upload cancelled');
  }, [abortController]);

  return {
    uploadFiles,
    uploadProgress,
    isUploading: isUploading || isUploadingImages || isUploadingVideos,
    cancelUpload,
  };
};

async function getImageDimensions(file: File): Promise<{ width: number; height: number } | undefined> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(undefined);
    };
    img.src = url;
  });
}