import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProductImageGallery } from './ProductImageGallery';
import { userEvent, within } from '@storybook/test';
import { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Play, Pause, Volume2, VolumeX, Maximize2, Loader2, ZoomIn, Download, Share2 } from 'lucide-react';
import { withNetworkCondition } from '@/mocks/story-helpers';
import { motion, AnimatePresence } from 'framer-motion';

const meta = {
  title: 'Product/ProductImageGallery',
  component: ProductImageGallery,
  decorators: [
    (Story) => (
      <div className="max-w-2xl mx-auto p-4">
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ProductImageGallery>;

export default meta;
type Story = StoryObj<typeof meta>;

const multipleImages = [
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop',
  'https://images.unsplash.com/photo-1505751171710-1f6d0ace5a85?w=800&h=800&fit=crop',
  'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&h=800&fit=crop',
  'https://images.unsplash.com/photo-1487215078519-e21cc028cb29?w=800&h=800&fit=crop',
];

const productImages = [
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=800&fit=crop',
  'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&h=800&fit=crop',
  'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800&h=800&fit=crop',
];

// Enhanced Video Player Component
const VideoPlayerComponent = ({ src, poster }: { src: string; poster: string }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        // eslint-disable-next-line storybook/context-in-play-function
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };
  
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };
  
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(progress);
    }
  };
  
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = x / rect.width;
      videoRef.current.currentTime = percentage * videoRef.current.duration;
    }
  };
  
  return (
    <div className="relative aspect-square overflow-hidden rounded-lg bg-black group">
      <video
        ref={videoRef}
        className="object-contain w-full h-full"
        poster={poster}
        onTimeUpdate={handleTimeUpdate}
        onLoadedData={() => setIsLoading(false)}
        onEnded={() => setIsPlaying(false)}
      >
        <source src={src} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-white" />
        </div>
      )}
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20"
              onClick={togglePlayPause}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20"
              onClick={toggleMute}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </Button>
            <div className="flex-1">
              <div
                className="h-1 bg-white/30 rounded-full cursor-pointer relative"
                onClick={handleSeek}
              >
                <div
                  className="absolute left-0 top-0 h-full bg-white rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="text-white hover:bg-white/20"
              onClick={() => videoRef.current?.requestFullscreen()}
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Zoom Component
const EnhancedZoomImage = ({ src, alt }: { src: string; alt: string }) => {
  const [isZoomed, setIsZoomed] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLDivElement>(null);
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!imageRef.current) return;
    
    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setMousePosition({ x, y });
  };
  
  return (
    <>
      <div
        ref={imageRef}
        className="relative aspect-square overflow-hidden rounded-lg cursor-zoom-in group"
        onMouseEnter={() => setIsZoomed(true)}
        onMouseLeave={() => setIsZoomed(false)}
        onMouseMove={handleMouseMove}
      >
        <img
          src={src}
          alt={alt}
          className="object-cover w-full h-full"
        />
        
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Badge variant="secondary" className="backdrop-blur-sm">
            <ZoomIn className="w-3 h-3 mr-1" />
            Hover to zoom
          </Badge>
        </div>
        
        {isZoomed && (
          <div
            className="absolute inset-0 opacity-0"
            style={{
              backgroundImage: `url(${src})`,
              backgroundPosition: `${mousePosition.x}% ${mousePosition.y}%`,
              backgroundSize: '250%',
              backgroundRepeat: 'no-repeat',
            }}
          />
        )}
      </div>
      
      <AnimatePresence>
        {isZoomed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed right-4 top-1/2 -translate-y-1/2 w-96 h-96 rounded-lg overflow-hidden shadow-2xl z-50 border-2 border-white"
          >
            <div
              className="w-full h-full"
              style={{
                backgroundImage: `url(${src})`,
                backgroundPosition: `${mousePosition.x}% ${mousePosition.y}%`,
                backgroundSize: '300%',
                backgroundRepeat: 'no-repeat',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// Progressive Loading Component
const ProgressiveImage = ({ src, alt, placeholder }: { src: string; alt: string; placeholder?: string }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageSrc, setImageSrc] = useState(placeholder || '');
  
  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      setImageSrc(src);
      setImageLoaded(true);
    };
  }, [src]);
  
  return (
    <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
      {!imageLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      )}
      <img
        src={imageSrc}
        alt={alt}
        className={`object-cover w-full h-full transition-opacity duration-500 ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
      {placeholder && !imageLoaded && (
        <img
          src={placeholder}
          alt={`${alt} placeholder`}
          className="absolute inset-0 object-cover w-full h-full blur-sm"
        />
      )}
    </div>
  );
};

export const Default: Story = {
  args: {
    images: multipleImages,
    productName: 'Premium Wireless Headphones',
  },
};

export const SingleImage: Story = {
  args: {
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop'],
    productName: 'Premium Wireless Headphones',
  },
};

export const NoImages: Story = {
  args: {
    images: [],
    productName: 'Product Without Images',
  },
};

export const EnhancedVideoPlayerStory: Story = {
  args: {
    images: multipleImages,
    productName: 'Product with Video',
  },
  render: () => (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Enhanced Video Player</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Full-featured video player with controls, progress bar, and fullscreen support
        </p>
        <VideoPlayerComponent
          src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
          poster="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop"
        />
      </Card>
      
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Mixed Media Gallery</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium mb-2">Video Content</p>
            <VideoPlayerComponent
              src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
              poster="https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&h=800&fit=crop"
            />
          </div>
          <div>
            <p className="text-sm font-medium mb-2">Image Content</p>
            <ProductImageGallery
              images={[productImages[0]]}
              productName="Product Image"
            />
          </div>
        </div>
      </Card>
    </div>
  ),
};

export const EnhancedZoomFunctionality: Story = {
  args: {
    images: productImages,
    productName: 'Hover to Zoom',
  },
  render: () => (
    <div className="space-y-6">
      <Alert>
        <AlertDescription>
          Hover over the images to see the enhanced zoom feature with magnifier preview
        </AlertDescription>
      </Alert>
      
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="p-4">
          <h4 className="font-medium mb-2">Standard Zoom</h4>
          <EnhancedZoomImage
            src={productImages[0]}
            alt="Product with zoom"
          />
        </Card>
        
        <Card className="p-4">
          <h4 className="font-medium mb-2">Detail View</h4>
          <EnhancedZoomImage
            src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1600&h=1600&fit=crop"
            alt="High resolution product"
          />
        </Card>
      </div>
      
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Zoom Features</h3>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <Badge variant="outline" className="mt-0.5">1</Badge>
            <span>Hover activation with smooth transitions</span>
          </li>
          <li className="flex items-start gap-2">
            <Badge variant="outline" className="mt-0.5">2</Badge>
            <span>Magnifier preview window on the right</span>
          </li>
          <li className="flex items-start gap-2">
            <Badge variant="outline" className="mt-0.5">3</Badge>
            <span>Mouse position tracking for precise zoom</span>
          </li>
          <li className="flex items-start gap-2">
            <Badge variant="outline" className="mt-0.5">4</Badge>
            <span>High-resolution image support</span>
          </li>
        </ul>
      </Card>
    </div>
  ),
};

export const ProgressiveImageLoading: Story = {
  args: {
    images: multipleImages,
    productName: 'Progressive Loading',
  },
  render: () => {
    const [loadImages, setLoadImages] = useState(false);
    
    const highResImages = [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=2400&h=2400&fit=crop',
      'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=2400&h=2400&fit=crop',
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=2400&h=2400&fit=crop',
    ];
    
    const placeholderImages = [
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=50&h=50&fit=crop&blur=10',
      'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=50&h=50&fit=crop&blur=10',
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=50&h=50&fit=crop&blur=10',
    ];
    
    return (
      <div className="space-y-6">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Progressive Image Loading</h3>
            <Button
              onClick={() => setLoadImages(!loadImages)}
              variant={loadImages ? 'default' : 'outline'}
            >
              {loadImages ? 'Reset' : 'Load Images'}
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4">
            Images load progressively from low to high resolution with smooth transitions
          </p>
          
          <div className="grid grid-cols-3 gap-4">
            {highResImages.map((src, i) => (
              <div key={i}>
                <p className="text-xs text-muted-foreground mb-2">Image {i + 1}</p>
                {loadImages ? (
                  <ProgressiveImage
                    src={src}
                    alt={`Progressive image ${i + 1}`}
                    placeholder={placeholderImages[i]}
                  />
                ) : (
                  <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-sm text-gray-400">Click &quot;Load Images&quot;</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
        
        <Card className="p-6">
          <h4 className="font-medium mb-4">Loading States</h4>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="aspect-square bg-gray-100 rounded-lg mb-2 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
              <p className="text-xs">Loading</p>
            </div>
            <div>
              <div className="aspect-square bg-gray-100 rounded-lg mb-2 overflow-hidden">
                <img
                  src={placeholderImages[0]}
                  alt="Placeholder"
                  className="w-full h-full object-cover blur-sm"
                />
              </div>
              <p className="text-xs">Placeholder</p>
            </div>
            <div>
              <div className="aspect-square bg-gray-100 rounded-lg mb-2 overflow-hidden">
                <img
                  src={highResImages[0]}
                  alt="Loaded"
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-xs">Loaded</p>
            </div>
          </div>
        </Card>
      </div>
    );
  },
  ...(withNetworkCondition('slow') as Partial<Story>),
};

export const MixedMediaGallery: Story = {
  args: {
    images: multipleImages,
    productName: 'Mixed Media Product',
  },
  render: () => {
    const [selectedMedia, setSelectedMedia] = useState(0);
    
    const mediaItems = [
      { type: 'image', src: productImages[0], thumbnail: productImages[0] },
      { type: 'video', src: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', thumbnail: productImages[1] },
      { type: 'image', src: productImages[2], thumbnail: productImages[2] },
      { type: '360', src: productImages[0], thumbnail: productImages[0] },
    ];
    
    return (
      <div className="space-y-4">
        <Card className="p-6">
          <div className="aspect-square mb-4 relative">
            {mediaItems[selectedMedia].type === 'video' ? (
              <VideoPlayerComponent
                src={mediaItems[selectedMedia].src}
                poster={mediaItems[selectedMedia].thumbnail}
              />
            ) : mediaItems[selectedMedia].type === '360' ? (
              <div className="w-full h-full rounded-lg bg-gray-100 flex items-center justify-center">
                <div className="text-center">
                  <Badge variant="secondary" className="mb-2">360° View</Badge>
                  <p className="text-sm text-muted-foreground">Click and drag to rotate</p>
                </div>
              </div>
            ) : (
              <EnhancedZoomImage
                src={mediaItems[selectedMedia].src}
                alt="Product image"
              />
            )}
          </div>
          
          <div className="grid grid-cols-4 gap-2">
            {mediaItems.map((item, i) => (
              <button
                key={i}
                onClick={() => setSelectedMedia(i)}
                className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                  selectedMedia === i ? 'border-primary ring-2 ring-primary/20' : 'border-transparent'
                }`}
              >
                <img
                  src={item.thumbnail}
                  alt={`Media ${i + 1}`}
                  className="w-full h-full object-cover"
                />
                {item.type === 'video' && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Play className="w-6 h-6 text-white" />
                  </div>
                )}
                {item.type === '360' && (
                  <div className="absolute bottom-1 right-1">
                    <Badge variant="secondary" className="text-xs">360°</Badge>
                  </div>
                )}
              </button>
            ))}
          </div>
        </Card>
        
        <Card className="p-4">
          <h4 className="font-medium mb-2">Media Actions</h4>
          <div className="flex gap-2">
            <Button size="sm" variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button size="sm" variant="outline">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </Card>
      </div>
    );
  },
};

export const LoadingState: Story = {
  args: {
    images: multipleImages,
    productName: 'Loading Gallery',
  },
  render: (args) => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Loading State Simulation</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Images show loading state before appearing
      </p>
      <ProductImageGallery {...args} />
    </div>
  ),
  ...(withNetworkCondition('slow') as Partial<Story>),
};

export const ThumbnailNavigation: Story = {
  args: {
    images: productImages,
    productName: 'Click Thumbnails to Navigate',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Wait for component to render
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Click on second thumbnail
    const thumbnails = canvas.getAllByRole('button', { name: /view image/i });
    if (thumbnails[1]) {
      await userEvent.click(thumbnails[1]);
    }
    
    // Wait and click third thumbnail
    await new Promise(resolve => setTimeout(resolve, 500));
    if (thumbnails[2]) {
      await userEvent.click(thumbnails[2]);
    }
  },
};

export const MobileSwipeGestures: Story = {
  args: {
    images: multipleImages,
    productName: 'Swipe to Navigate (Mobile)',
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  render: (args) => (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground text-center mb-4">
        <p>On touch devices, swipe left/right to navigate</p>
        <p>On desktop, use thumbnail navigation</p>
      </div>
      <ProductImageGallery {...args} />
    </div>
  ),
};

export const ErrorHandling: Story = {
  args: {
    images: [
      'https://invalid-image-url.com/image1.jpg',
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop',
      'https://broken-link.com/image.jpg',
    ],
    productName: 'Product with Broken Images',
  },
};

export const ResponsiveLayouts: Story = {
  args: {
    images: multipleImages,
    productName: 'Responsive Gallery',
  },
  render: (args) => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">Desktop View</h3>
        <div className="border rounded-lg p-4">
          <ProductImageGallery {...args} />
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">Mobile View</h3>
        <div className="max-w-sm mx-auto border rounded-lg p-4">
          <ProductImageGallery {...args} />
        </div>
      </div>
    </div>
  ),
};

export const AccessibilityFeatures: Story = {
  args: {
    images: productImages,
    productName: 'Accessible Product Gallery',
  },
  render: (args) => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Accessibility Features</h3>
      <div className="text-sm text-muted-foreground space-y-2 mb-4">
        <p>• Keyboard navigation support</p>
        <p>• ARIA labels for screen readers</p>
        <p>• Clear focus indicators</p>
        <p>• Touch gesture support on mobile</p>
        <p>• Descriptive alt text for all images</p>
      </div>
      <ProductImageGallery {...args} />
    </div>
  ),
  parameters: {
    a11y: {
      config: {
        rules: [
          { id: 'color-contrast', enabled: true },
          { id: 'button-name', enabled: true },
          { id: 'image-alt', enabled: true },
        ],
      },
    },
  },
};

export const PerformanceOptimized: Story = {
  args: {
    images: Array.from({ length: 20 }, (_, i) => 
      `https://picsum.photos/800/800?random=${i}`,
    ),
    productName: 'Performance Test Gallery',
  },
  render: (args) => {
    const [loadAll, setLoadAll] = useState(false);
    
    return (
      <div className="space-y-4">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Performance Optimization</h3>
            <Button
              onClick={() => setLoadAll(!loadAll)}
              variant={loadAll ? 'destructive' : 'default'}
            >
              {loadAll ? 'Disable Lazy Load' : 'Enable Lazy Load'}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Gallery with 20 images using lazy loading and virtualization
          </p>
        </Card>
        
        <ProductImageGallery {...args} />
        
        <Card className="p-4">
          <h4 className="font-medium mb-2">Performance Features</h4>
          <ul className="text-sm space-y-1">
            <li>• Lazy loading for off-screen images</li>
            <li>• Progressive enhancement</li>
            <li>• Optimized re-renders</li>
            <li>• Efficient event handlers</li>
          </ul>
        </Card>
      </div>
    );
  },
};

export const InteractiveNavigation: Story = {
  args: {
    images: multipleImages,
    productName: 'Interactive Gallery',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Cycle through all images
    const thumbnails = canvas.getAllByRole('button', { name: /view image/i });
    
    for (const thumbnail of thumbnails) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await userEvent.click(thumbnail);
    }
  },
};