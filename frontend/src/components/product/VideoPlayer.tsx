import { forwardRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import type { MediaItem } from '@/types/media';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

interface VideoPlayerProps {
  item: MediaItem;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  className?: string;
}

export const VideoPlayer = forwardRef<HTMLVideoElement, VideoPlayerProps>(
  ({ item, isPlaying, onPlay, onPause, className }, ref) => {
    const [isMuted, setIsMuted] = useState(true);
    const [showControls, setShowControls] = useState(true);
    const isYouTube = item.url.includes('youtube.com') || item.url.includes('youtu.be');
    
    const getYouTubeId = (url: string): string | null => {
      const match = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s]+)/.exec(url);
      return match ? match[1] : null;
    };
    
    useEffect(() => {
      if (!isPlaying) return;
      
      const timer = setTimeout(() => {
        setShowControls(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }, [isPlaying, showControls]);
    
    if (isYouTube) {
      const videoId = getYouTubeId(item.url);
      
      if (!isPlaying) {
        return (
          <div
            className={cn('relative w-full h-full cursor-pointer group', className)}
            onClick={onPlay}
          >
            <img
              src={item.thumbnail ?? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
              alt={item.title ?? 'Video thumbnail'}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/40 transition-colors">
              <div className="bg-red-600 rounded-full p-4 shadow-lg transform group-hover:scale-110 transition-transform">
                <Play className="w-10 h-10 text-white ml-1" />
              </div>
            </div>
            <div className="absolute bottom-4 left-4 bg-black/60 px-2 py-1 rounded">
              <span className="text-white text-sm font-medium">YouTube</span>
            </div>
          </div>
        );
      }
      
      return (
        <div className={cn('relative w-full h-full', className)}>
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=${isMuted ? 1 : 0}`}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }
    
    return (
      <div
        className={cn('relative w-full h-full group', className)}
        onMouseMove={() => setShowControls(true)}
        onMouseLeave={() => !isPlaying && setShowControls(false)}
      >
        <video
          ref={ref}
          src={item.url}
          poster={item.thumbnail}
          className="w-full h-full object-contain"
          autoPlay={isPlaying}
          muted={isMuted}
          loop
          playsInline
          onPlay={onPlay}
          onPause={onPause}
          onClick={() => isPlaying ? onPause() : onPlay()}
        />
        
        <div
          className={cn(
            'absolute inset-0 bg-gradient-to-t from-black/50 to-transparent transition-opacity',
            showControls ? 'opacity-100' : 'opacity-0',
          )}
        >
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Button
                variant="ghost"
                size="icon"
                className="bg-white/20 hover:bg-white/30 backdrop-blur-sm w-16 h-16"
                onClick={onPlay}
              >
                <Play className="w-8 h-8 text-white ml-1" />
              </Button>
            </div>
          )}
          
          <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={() => isPlaying ? onPause() : onPlay()}
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4 ml-0.5" />
                )}
              </Button>
              
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={() => setIsMuted(!isMuted)}
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </Button>
            </div>
            
            {item.metadata?.duration && (
              <span className="text-white text-sm">
                {Math.floor(item.metadata.duration / 60)}:
                {(item.metadata.duration % 60).toString().padStart(2, '0')}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  },
);

VideoPlayer.displayName = 'VideoPlayer';