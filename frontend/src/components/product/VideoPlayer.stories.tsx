import type { Meta, StoryObj } from '@storybook/react-vite';
import { VideoPlayer } from './VideoPlayer';
import type { MediaItem } from '@/types/media';
import { within, userEvent, expect, waitFor, fn } from '@storybook/test';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Play, Pause, RotateCcw, AlertCircle } from 'lucide-react';

const mockYouTubeVideo: MediaItem = {
  id: 'yt1',
  url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  type: 'video',
  title: 'Product Demo Video',
  thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
  order: 0,
  createdAt: new Date(),
  metadata: {
    duration: 213,
  },
};

const mockYouTubeShortUrl: MediaItem = {
  id: 'yt2',
  url: 'https://youtu.be/dQw4w9WgXcQ',
  type: 'video',
  title: 'Short URL Video',
  order: 0,
  createdAt: new Date(),
  metadata: {},
};

const mockYouTubeEmbedUrl: MediaItem = {
  id: 'yt3',
  url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
  type: 'video',
  title: 'Embed URL Video',
  thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
  order: 0,
  createdAt: new Date(),
  metadata: {},
};

const mockDirectVideo: MediaItem = {
  id: 'vid1',
  url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  type: 'video',
  title: 'Product Showcase',
  thumbnail: 'https://storage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg',
  order: 0,
  createdAt: new Date(),
  metadata: {
    duration: 596,
    dimensions: {
      width: 1920,
      height: 1080,
    },
  },
};

const mockDirectVideoNoPoster: MediaItem = {
  id: 'vid2',
  url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  type: 'video',
  title: 'How It Works',
  order: 0,
  createdAt: new Date(),
  metadata: {
    duration: 654,
  },
};

const mockInvalidVideo: MediaItem = {
  id: 'vid3',
  url: 'https://example.com/nonexistent-video.mp4',
  type: 'video',
  title: 'Broken Video',
  thumbnail: 'https://via.placeholder.com/640x360?text=Video+Not+Found',
  order: 0,
  createdAt: new Date(),
};

// Interactive wrapper component
const InteractivePlayer = ({ item }: { item: MediaItem }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  return (
    <div className="space-y-4">
      <div className="aspect-video bg-black rounded-lg overflow-hidden">
        <VideoPlayer
          ref={videoRef}
          item={item}
          isPlaying={isPlaying}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
      </div>
      <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
        <div className="flex items-center gap-4">
          <Button
            size="sm"
            variant={isPlaying ? 'secondary' : 'default'}
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Play
              </>
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setIsPlaying(false);
              if (videoRef.current) {
                videoRef.current.currentTime = 0;
              }
            }}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>
        <span className="text-sm text-muted-foreground">
          Status: {isPlaying ? 'Playing' : 'Paused'}
        </span>
      </div>
    </div>
  );
};

const meta = {
  title: 'Product/VideoPlayer',
  component: VideoPlayer,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  args: {
    onPlay: fn(),
    onPause: fn(),
  },
} satisfies Meta<typeof VideoPlayer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const YouTubeVideo: Story = {
  args: {
    item: mockYouTubeVideo,
    isPlaying: false,
  },
  decorators: [
    () => <InteractivePlayer item={mockYouTubeVideo} />,
  ],
};

export const YouTubeShortUrl: Story = {
  args: {
    item: mockYouTubeShortUrl,
    isPlaying: false,
  },
  decorators: [
    () => <InteractivePlayer item={mockYouTubeShortUrl} />,
  ],
};

export const YouTubeEmbedUrl: Story = {
  args: {
    item: mockYouTubeEmbedUrl,
    isPlaying: false,
  },
  decorators: [
    () => <InteractivePlayer item={mockYouTubeEmbedUrl} />,
  ],
};

export const DirectVideo: Story = {
  args: {
    item: mockDirectVideo,
    isPlaying: false,
  },
  decorators: [
    () => <InteractivePlayer item={mockDirectVideo} />,
  ],
};

export const DirectVideoNoPoster: Story = {
  args: {
    item: mockDirectVideoNoPoster,
    isPlaying: false,
  },
  decorators: [
    () => <InteractivePlayer item={mockDirectVideoNoPoster} />,
  ],
};

export const YouTubePlaying: Story = {
  args: {
    item: mockYouTubeVideo,
    isPlaying: true,
  },
  decorators: [
    () => {
      const [isPlaying, setIsPlaying] = useState(true);
      
      return (
        <div className="space-y-4">
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            <VideoPlayer
              item={mockYouTubeVideo}
              isPlaying={isPlaying}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              YouTube video is auto-playing (muted by default)
            </p>
          </div>
        </div>
      );
    },
  ],
};

export const DirectVideoPlaying: Story = {
  args: {
    item: mockDirectVideo,
    isPlaying: true,
  },
  decorators: [
    () => {
      const [isPlaying, setIsPlaying] = useState(true);
      const videoRef = useRef<HTMLVideoElement>(null);
      
      return (
        <div className="space-y-4">
          <div className="aspect-video bg-black rounded-lg overflow-hidden">
            <VideoPlayer
              ref={videoRef}
              item={mockDirectVideo}
              isPlaying={isPlaying}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              Direct video is playing with overlay controls
            </p>
          </div>
        </div>
      );
    },
  ],
};

export const ControlsInteraction: Story = {
  args: {
    item: mockDirectVideo,
    isPlaying: false,
  },
  decorators: [
    () => <InteractivePlayer item={mockDirectVideo} />,
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Click play button
    const playButton = canvas.getByRole('button', { name: /play/i });
    await userEvent.click(playButton);
    
    // Status should update
    await waitFor(() => {
      void expect(canvas.getByText('Status: Playing')).toBeInTheDocument();
    });
    
    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Click pause
    const pauseButton = canvas.getByRole('button', { name: /pause/i });
    await userEvent.click(pauseButton);
    
    // Status should update
    await waitFor(() => {
      void expect(canvas.getByText('Status: Paused')).toBeInTheDocument();
    });
  },
};

export const VideoWithDuration: Story = {
  args: {
    item: mockDirectVideo,
    isPlaying: false,
  },
  decorators: [
    () => {
      const item = {
        ...mockDirectVideo,
        metadata: {
          ...mockDirectVideo.metadata,
          duration: 125, // 2:05
        },
      };
      
      return (
        <div className="space-y-4">
          <InteractivePlayer item={item} />
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              Video duration displayed in controls: 2:05
            </p>
          </div>
        </div>
      );
    },
  ],
};

export const ErrorState: Story = {
  args: {
    item: mockInvalidVideo,
    isPlaying: false,
  },
  decorators: [
    () => {
      const [error, setError] = useState(false);
      
      return (
        <div className="space-y-4">
          <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
            {error ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted">
                <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Failed to load video</p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-4"
                  onClick={() => setError(false)}
                >
                  Retry
                </Button>
              </div>
            ) : (
              <VideoPlayer
                item={mockInvalidVideo}
                isPlaying={false}
                onPlay={() => {
                  // Simulate error
                  setTimeout(() => setError(true), 500);
                }}
                onPause={() => {
                  // No-op for error state demo
                }}
              />
            )}
          </div>
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">
              Click play to simulate video loading error
            </p>
          </div>
        </div>
      );
    },
  ],
};

export const MobileView: Story = {
  args: {
    item: mockYouTubeVideo,
    isPlaying: false,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  decorators: [
    () => <InteractivePlayer item={mockYouTubeVideo} />,
  ],
};

export const TabletView: Story = {
  args: {
    item: mockDirectVideo,
    isPlaying: false,
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
  decorators: [
    () => <InteractivePlayer item={mockDirectVideo} />,
  ],
};

export const MultiplePlayers: Story = {
  args: {
    item: mockYouTubeVideo,
    isPlaying: false,
  },
  decorators: [
    () => {
      const [playingId, setPlayingId] = useState<string | null>(null);
      
      const videos = [
        mockYouTubeVideo,
        mockDirectVideo,
        { ...mockYouTubeShortUrl, id: 'yt2-unique' },
      ];
      
      return (
        <div className="space-y-6">
          <div className="p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-2">Multiple Players Demo</h3>
            <p className="text-sm text-muted-foreground">
              Only one video plays at a time - clicking play on one pauses others
            </p>
          </div>
          <div className="grid gap-6">
            {videos.map((video) => (
              <div key={video.id} className="space-y-2">
                <h4 className="text-sm font-medium">{video.title}</h4>
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                  <VideoPlayer
                    item={video}
                    isPlaying={playingId === video.id}
                    onPlay={() => setPlayingId(video.id)}
                    onPause={() => setPlayingId(null)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    },
  ],
};

export const AspectRatios: Story = {
  args: {
    item: mockDirectVideo,
    isPlaying: false,
  },
  decorators: [
    () => {
      const aspects = [
        { ratio: 'aspect-video', label: '16:9 (Default)' },
        { ratio: 'aspect-[4/3]', label: '4:3' },
        { ratio: 'aspect-square', label: '1:1 (Square)' },
        { ratio: 'aspect-[9/16]', label: '9:16 (Vertical)' },
      ];
      
      return (
        <div className="space-y-6">
          {aspects.map(({ ratio, label }) => (
            <div key={ratio} className="space-y-2">
              <h4 className="text-sm font-medium">{label}</h4>
              <div className={`${ratio} max-w-md bg-black rounded-lg overflow-hidden`}>
                <VideoPlayer
                  item={mockDirectVideo}
                  isPlaying={false}
                  onPlay={() => {
                    // No-op for demo
                  }}
                  onPause={() => {
                    // No-op for demo
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      );
    },
  ],
};

export const CustomStyling: Story = {
  args: {
    item: mockYouTubeVideo,
    isPlaying: false,
    className: 'rounded-xl shadow-2xl',
  },
  decorators: [
    () => {
      const [isPlaying, setIsPlaying] = useState(false);
      
      return (
        <div className="space-y-6">
          <div className="aspect-video max-w-2xl mx-auto">
            <VideoPlayer
              item={mockYouTubeVideo}
              isPlaying={isPlaying}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              className="rounded-xl shadow-2xl border-4 border-primary/20"
            />
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Custom styled player with rounded corners and shadow
            </p>
          </div>
        </div>
      );
    },
  ],
};

export const LoadingState: Story = {
  args: {
    item: mockDirectVideo,
    isPlaying: false,
  },
  decorators: [
    () => {
      const [isLoading, setIsLoading] = useState(true);
      
      useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 2000);
        return () => clearTimeout(timer);
      }, []);
      
      return (
        <div className="aspect-video bg-black rounded-lg overflow-hidden">
          {isLoading ? (
            <div className="w-full h-full flex items-center justify-center bg-muted">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">Loading video...</p>
              </div>
            </div>
          ) : (
            <VideoPlayer
              item={mockDirectVideo}
              isPlaying={false}
              onPlay={() => {
                // No-op for loading state demo
              }}
              onPause={() => {
                // No-op for loading state demo
              }}
            />
          )}
        </div>
      );
    },
  ],
};

export const NoThumbnailFallback: Story = {
  args: {
    item: {
      ...mockYouTubeVideo,
      thumbnail: undefined,
    },
    isPlaying: false,
  },
  decorators: [
    () => {
      const itemWithoutThumbnail = {
        ...mockYouTubeVideo,
        thumbnail: undefined,
      };
      
      return (
        <div className="space-y-4">
          <InteractivePlayer item={itemWithoutThumbnail} />
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              YouTube videos automatically fallback to YouTube&apos;s thumbnail service
            </p>
          </div>
        </div>
      );
    },
  ],
};

export const OverlayControls: Story = {
  args: {
    item: mockDirectVideo,
    isPlaying: true,
  },
  decorators: [
    () => {
      const [isPlaying, setIsPlaying] = useState(true);
      const [showInfo, setShowInfo] = useState(false);
      const videoRef = useRef<HTMLVideoElement>(null);
      
      return (
        <div className="space-y-4">
          <div className="aspect-video bg-black rounded-lg overflow-hidden relative">
            <VideoPlayer
              ref={videoRef}
              item={mockDirectVideo}
              isPlaying={isPlaying}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowInfo(!showInfo)}
            >
              {showInfo ? 'Hide' : 'Show'} Control Info
            </Button>
          </div>
          {showInfo && (
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Overlay Controls</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Controls auto-hide after 3 seconds when playing</li>
                <li>• Move mouse to show controls again</li>
                <li>• Click video to play/pause</li>
                <li>• Volume toggle available (muted by default)</li>
              </ul>
            </div>
          )}
        </div>
      );
    },
  ],
};