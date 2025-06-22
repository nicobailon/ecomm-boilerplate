import { useState, useCallback, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { nanoid } from 'nanoid';
import { Upload, Plus, AlertCircle } from 'lucide-react';
import { type MediaItem, MEDIA_LIMITS } from '@/types/media';
import { MediaItemCard } from './MediaItemCard';
import { YouTubeAddModal } from './YouTubeAddModal';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/Progress';
import { cn } from '@/lib/utils';
import { trpc } from '@/lib/trpc';
import { useMediaUpload } from '@/hooks/useMediaUpload';
import { parseYouTubeUrl, getYouTubeThumbnailUrl } from '@/utils/youtube';
import { getErrorMessage } from '@/utils/getErrorMessage';

interface MediaGalleryManagerProps {
  productId?: string;
  initialMedia?: MediaItem[];
  onChange: (mediaItems: MediaItem[]) => void;
  maxItems?: number;
}

export function MediaGalleryManager({
  productId,
  initialMedia = [],
  onChange,
  maxItems = MEDIA_LIMITS.MAX_ITEMS,
}: MediaGalleryManagerProps) {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>(initialMedia);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const utils = trpc.useUtils();

  // Centralised error handler to respect strict ESLint rules
  const handleMutationError = (error: unknown): void => {
    toast.error(getErrorMessage(error));
  };

  const updateGalleryMutation = trpc.media.updateGallery.useMutation({
    onSuccess: () => {
      toast.success('Media gallery updated');
      if (productId) {
        void utils.product.list.invalidate();
      }
    },
    onError: handleMutationError,
  });

  const reorderMutation = trpc.media.reorderItems.useMutation({
    onError: handleMutationError,
  });

  const deleteMutation = trpc.media.deleteItem.useMutation({
    onSuccess: () => {
      toast.success('Media item deleted');
      if (productId) {
        void utils.product.list.invalidate();
      }
    },
    onError: handleMutationError,
  });

  const addYouTubeMutation = trpc.media.addYouTubeVideo.useMutation({
    onSuccess: (result) => {
      // Type assertion: result is IProduct from backend
      const product = result as { mediaGallery?: MediaItem[] };
      if (product.mediaGallery) {
        setMediaItems(product.mediaGallery);
        toast.success('YouTube video added');
        if (productId) {
          void utils.product.list.invalidate();
        }
      }
    },
    onError: handleMutationError,
  });

  const { uploadFiles, uploadProgress, isUploading } = useMediaUpload({
    onSuccess: (items) => {
      const newItems = [...mediaItems, ...items];
      setMediaItems(newItems);

      if (productId) {
        updateGalleryMutation.mutate({
          productId,
          mediaItems: newItems,
        });
      }
    },
    onError: handleMutationError,
  });

  useEffect(() => {
    onChange(mediaItems);
  }, [mediaItems, onChange]);

  useEffect(() => {
    return () => {
      mediaItems.forEach(item => {
        if (item.url.startsWith('blob:')) {
          URL.revokeObjectURL(item.url);
        }
        if (item.thumbnail?.startsWith('blob:')) {
          URL.revokeObjectURL(item.thumbnail);
        }
      });
    };
  }, [mediaItems]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': MEDIA_LIMITS.SUPPORTED_IMAGE_TYPES,
      'video/*': MEDIA_LIMITS.SUPPORTED_VIDEO_TYPES,
    },
    maxFiles: maxItems - mediaItems.length,
    onDrop: (files) => { void handleFileDrop(files); },
    disabled: mediaItems.length >= maxItems || isUploading,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
    onDropAccepted: () => setIsDragging(false),
    onDropRejected: () => setIsDragging(false),
  });
  
  async function handleFileDrop(acceptedFiles: File[]) {
    try {
      await uploadFiles(acceptedFiles, mediaItems.length, maxItems);
    } catch {
      // Error handling is done in the useMediaUpload hook
    }
  }

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      
      if (!over || active.id === over.id) return;
      
      const oldIndex = mediaItems.findIndex(item => item.id === active.id);
      const newIndex = mediaItems.findIndex(item => item.id === over.id);

      const reorderedItems = arrayMove(mediaItems, oldIndex, newIndex);

      const updatedItems = reorderedItems.map((item, index) => ({
        ...item,
        order: index,
      }));

      setMediaItems(updatedItems);

      if (productId) {
        reorderMutation.mutate({
          productId,
          mediaOrder: updatedItems.map(item => ({ id: item.id, order: item.order })),
        });
      }
    },
    [mediaItems, productId, reorderMutation],
  );

  const handleDelete = useCallback(
    (mediaId: string) => {
      const itemToDelete = mediaItems.find(item => item.id === mediaId);
      if (!itemToDelete) return;

      const imageCount = mediaItems.filter(item => item.type === 'image').length;
      if (itemToDelete.type === 'image' && imageCount === 1) {
        toast.error('Cannot delete the last image');
        return;
      }

      const newItems = mediaItems.filter(item => item.id !== mediaId);
      const updatedItems = newItems.map((item, index) => ({
        ...item,
        order: index,
      }));

      setMediaItems(updatedItems);

      if (productId) {
        deleteMutation.mutate({
          productId,
          mediaId,
        });
      }
    },
    [mediaItems, productId, deleteMutation],
  );

  const handleYouTubeAdd = useCallback(
    async (url: string, title: string): Promise<void> => {
      if (mediaItems.length >= maxItems) {
        toast.error(`Maximum ${maxItems} media items allowed`);
        return;
      }

      const parseResult = parseYouTubeUrl(url);
      if (!parseResult.isValid || !parseResult.videoId) {
        toast.error(parseResult.error ?? 'Invalid YouTube URL');
        return;
      }

      if (productId) {
        await addYouTubeMutation.mutateAsync({
          productId,
          url,
          title,
        });
      } else {
        const mediaItem: MediaItem = {
          id: nanoid(6),
          type: 'video',
          url,
          title,
          order: mediaItems.length,
          createdAt: new Date(),
          thumbnail: getYouTubeThumbnailUrl(parseResult.videoId),
        };

        setMediaItems([...mediaItems, mediaItem]);
        toast.success('YouTube video added');
      }

      setShowVideoModal(false);
    },
    [mediaItems, maxItems, productId, addYouTubeMutation],
  );
  
  const handleEdit = useCallback((_mediaId: string) => {
    toast.info('Edit functionality coming soon');
  }, []);
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Media Gallery</h3>
          <p className="text-sm text-muted-foreground">
            Upload images and videos for your product
          </p>
        </div>
        
        <div className="flex gap-2">
          <div {...getRootProps()}>
            <input {...getInputProps()} />
            <Button
              variant="outline"
              disabled={mediaItems.length >= maxItems || isUploading}
              className={cn(isDragActive && 'border-primary bg-primary/5')}
            >
              <Upload className="w-4 h-4 mr-2" />
              {isUploading ? 'Uploading...' : 'Upload Files'}
            </Button>
          </div>
          
          <Button
            variant="outline"
            onClick={() => setShowVideoModal(true)}
            disabled={mediaItems.length >= maxItems || isUploading}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add YouTube
          </Button>
        </div>
      </div>
      
      {Object.entries(uploadProgress).length > 0 && (
        <div className="space-y-2">
          {Object.entries(uploadProgress).map(([fileName, progress]) => (
            <div key={fileName} className="bg-gray-50 rounded-lg p-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium truncate">{progress.fileName}</span>
                <span className="text-muted-foreground">{progress.progress}%</span>
              </div>
              <Progress value={progress.progress} className="h-2" />
            </div>
          ))}
        </div>
      )}
      
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={mediaItems.map(item => item.id)}
          strategy={rectSortingStrategy}
        >
          <div
            className={cn(
              'grid grid-cols-3 gap-4 p-4 rounded-lg border-2 border-dashed transition-colors',
              isDragging ? 'border-primary bg-primary/5' : 'border-gray-200',
              mediaItems.length === 0 && 'bg-gray-50',
            )}
          >
            {mediaItems.map((item, index) => (
              <MediaItemCard
                key={item.id}
                item={item}
                index={index}
                onDelete={() => handleDelete(item.id)}
                onEdit={() => handleEdit(item.id)}
              />
            ))}
            
            {mediaItems.length === 0 && (
              <div className="col-span-3 text-center py-12">
                <Upload className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                <p className="text-sm text-muted-foreground">
                  Drag and drop files here, or click to browse
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Maximum {maxItems} items • Images up to 8MB • Videos up to 100MB
                </p>
              </div>
            )}
            
            {mediaItems.length > 0 &&
              Array.from({ length: Math.max(0, 3 - (mediaItems.length % 3)) }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="aspect-square rounded-lg border-2 border-dashed border-gray-200"
                />
              ))}
          </div>
        </SortableContext>
      </DndContext>
      
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          {mediaItems.length} of {maxItems} slots used
        </p>
        
        {mediaItems.length > 0 && mediaItems.every(item => item.type === 'video') && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <span className="text-sm text-yellow-700">
              At least one image is required
            </span>
          </div>
        )}
      </div>
      
      <YouTubeAddModal
        isOpen={showVideoModal}
        onClose={() => setShowVideoModal(false)}
        onAdd={handleYouTubeAdd}
      />
    </div>
  );
}