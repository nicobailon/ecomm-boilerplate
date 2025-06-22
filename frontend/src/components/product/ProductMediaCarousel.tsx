import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Play, Maximize2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MediaItem } from '@/types/media';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { VideoPlayer } from './VideoPlayer';
import { Button } from '@/components/ui/Button';
import { useSwipeGesture } from '@/hooks/useSwipeGestureV2';
import { usePinchToZoom } from '@/hooks/usePinchToZoom';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import {
  Dialog,
  DialogContent,
  DialogClose,
} from '@/components/ui/Dialog';

interface ProductMediaCarouselProps {
  mediaItems: MediaItem[];
  productName: string;
  className?: string;
  autoPlay?: boolean;
  showThumbnails?: boolean;
}

export function ProductMediaCarousel({
  mediaItems,
  productName,
  className,
  autoPlay = false,
  showThumbnails = true,
}: ProductMediaCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imageLoadError, setImageLoadError] = useState<Record<string, boolean>>({});
  const galleryRef = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(max-width: 1024px)');
  
  const currentItem = mediaItems[currentIndex];
  
  useEffect(() => {
    const imagesToPreload = [
      mediaItems[currentIndex - 1],
      mediaItems[currentIndex + 1],
    ].filter(Boolean);
    
    imagesToPreload.forEach(item => {
      if (item && item.type === 'image') {
        const img = new Image();
        img.src = item.url;
      }
    });
  }, [currentIndex, mediaItems]);
  
  useEffect(() => {
    if (!autoPlay || isVideoPlaying || mediaItems.length <= 1) return;
    
    const interval = setInterval(() => {
      handleNext();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [autoPlay, isVideoPlaying, currentIndex, mediaItems.length]);
  
  const handlePrevious = useCallback(() => {
    setCurrentIndex(prev => (prev === 0 ? mediaItems.length - 1 : prev - 1));
    setIsVideoPlaying(false);
  }, [mediaItems.length]);
  
  const handleNext = useCallback(() => {
    setCurrentIndex(prev => (prev === mediaItems.length - 1 ? 0 : prev + 1));
    setIsVideoPlaying(false);
  }, [mediaItems.length]);
  
  const { onTouchStart, onTouchMove, onTouchEnd } = useSwipeGesture({
    onSwipeLeft: handleNext,
    onSwipeRight: handlePrevious,
    threshold: 50,
  });
  
  const { scale, onPinchStart, onPinchMove, onPinchEnd } = usePinchToZoom({
    minScale: 1,
    maxScale: 3,
  });
  
  const handleThumbnailClick = useCallback((index: number) => {
    setCurrentIndex(index);
    setIsVideoPlaying(false);
  }, []);
  
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') handlePrevious();
    if (e.key === 'ArrowRight') handleNext();
    if (e.key === 'Escape') {
      setIsFullscreen(false);
      setIsVideoPlaying(false);
    }
    if (e.key === 'f' || e.key === 'F') {
      setIsFullscreen(prev => !prev);
    }
  }, [handleNext, handlePrevious]);
  
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

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
  
  const renderMedia = (item: MediaItem, isFullscreen = false) => {
    if (item.type === 'image') {
      return (
        <OptimizedImage
          src={item.url}
          alt={item.title ?? `${productName} - Image ${currentIndex + 1}`}
          className={cn(
            'object-contain w-full h-full',
            isFullscreen && 'max-h-[90vh]',
          )}
          aspectRatio={1}
          onError={() => {
            setImageLoadError(prev => ({ ...prev, [item.id]: true }));
          }}
        />
      );
    }
    
    return (
      <VideoPlayer
        item={item}
        isPlaying={isVideoPlaying}
        onPlay={() => setIsVideoPlaying(true)}
        onPause={() => setIsVideoPlaying(false)}
        className={isFullscreen ? 'max-h-[90vh]' : ''}
      />
    );
  };
  
  return (
    <div className={cn('space-y-4', className)}>
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {currentItem.type} {currentIndex + 1} of {mediaItems.length}:
        {currentItem.title ?? `${productName} media`}
      </div>
      
      <div
        ref={galleryRef}
        className="relative aspect-square overflow-hidden rounded-lg bg-gray-100"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onPointerDown={onPinchStart}
        onPointerMove={onPinchMove}
        onPointerUp={onPinchEnd}
      >
        <div
          className="w-full h-full transition-transform duration-200"
          style={{ transform: `scale(${scale})` }}
        >
          {imageLoadError[currentItem.id] ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Failed to load media</p>
            </div>
          ) : (
            renderMedia(currentItem)
          )}
        </div>
        
        {!isMobile && mediaItems.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
              onClick={handlePrevious}
              aria-label="Previous media"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white"
              onClick={handleNext}
              aria-label="Next media"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </>
        )}
        
        <div className="absolute top-2 right-2 flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="bg-white/80 hover:bg-white"
            onClick={() => setIsFullscreen(true)}
            aria-label="View fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="absolute bottom-2 left-2 bg-black/60 text-white px-2 py-1 rounded text-sm">
          {currentIndex + 1} / {mediaItems.length}
        </div>
        
        {scale > 1 && (
          <div className="absolute top-2 left-2 bg-black/60 text-white px-2 py-1 rounded text-sm">
            {Math.round(scale * 100)}%
          </div>
        )}
      </div>
      
      {showThumbnails && (
        isMobile ? (
          <div className="flex justify-center gap-1.5">
            {mediaItems.map((_, index) => (
              <button
                key={index}
                onClick={() => handleThumbnailClick(index)}
                className={cn(
                  'transition-all',
                  index === currentIndex
                    ? 'w-8 h-2 bg-primary rounded-full'
                    : 'w-2 h-2 bg-gray-300 rounded-full hover:bg-gray-400',
                )}
                aria-label={`Go to media ${index + 1}`}
                aria-current={index === currentIndex}
              />
            ))}
          </div>
        ) : (
          mediaItems.length > 1 && (
            <div className={cn(
              'grid gap-2',
              isTablet ? 'grid-cols-4' : 'grid-cols-6',
            )}>
              {mediaItems.map((item, index) => (
                <button
                  key={item.id}
                  onClick={() => handleThumbnailClick(index)}
                  className={cn(
                    'relative aspect-square overflow-hidden rounded-md border-2 transition-all',
                    'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                    index === currentIndex
                      ? 'border-primary ring-2 ring-primary ring-offset-2'
                      : 'border-gray-200 hover:border-gray-300',
                  )}
                  aria-label={`View ${item.type} ${index + 1}`}
                  aria-current={index === currentIndex}
                >
                  <img
                    src={item.type === 'image' ? item.url : item.thumbnail}
                    alt=""
                    className="object-cover w-full h-full"
                    loading="lazy"
                  />
                  {item.type === 'video' && (
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                      <Play className="w-4 h-4 text-white" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )
        )
      )}
      
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0">
          <div className="relative flex items-center justify-center bg-black">
            <DialogClose className="absolute top-4 right-4 z-10">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                <X className="w-4 h-4" />
              </Button>
            </DialogClose>
            
            {renderMedia(currentItem, true)}
            
            {mediaItems.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                  onClick={handlePrevious}
                >
                  <ChevronLeft className="w-6 h-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                  onClick={handleNext}
                >
                  <ChevronRight className="w-6 h-6" />
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}