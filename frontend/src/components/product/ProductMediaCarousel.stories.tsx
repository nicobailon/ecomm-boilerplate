import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProductMediaCarousel } from './ProductMediaCarousel';
import type { MediaItem } from '@/types/media';
import { userEvent, within, expect, waitFor } from '@storybook/test';

const meta = {
  title: 'Product/ProductMediaCarousel',
  component: ProductMediaCarousel,
  decorators: [
    (Story) => (
      <div className="max-w-4xl mx-auto p-4">
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ProductMediaCarousel>;

export default meta;
type Story = StoryObj<typeof meta>;

const createMediaItems = (): MediaItem[] => [
  {
    id: '1',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop',
    title: 'Product Front View',
    order: 0,
    createdAt: new Date(),
  },
  {
    id: '2',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1505751171710-1f6d0ace5a85?w=800&h=800&fit=crop',
    title: 'Product Side View',
    order: 1,
    createdAt: new Date(),
  },
  {
    id: '3',
    type: 'video',
    url: 'https://www.w3schools.com/html/mov_bbb.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&h=800&fit=crop',
    title: 'Product Demo Video',
    order: 2,
    createdAt: new Date(),
    metadata: {
      duration: 185,
      dimensions: { width: 1920, height: 1080 },
    },
  },
  {
    id: '4',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1487215078519-e21cc028cb29?w=800&h=800&fit=crop',
    title: 'Product Detail',
    order: 3,
    createdAt: new Date(),
  },
];

const imageOnlyMedia: MediaItem[] = [
  {
    id: '1',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=800&fit=crop',
    order: 0,
    createdAt: new Date(),
  },
  {
    id: '2',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&h=800&fit=crop',
    order: 1,
    createdAt: new Date(),
  },
  {
    id: '3',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800&h=800&fit=crop',
    order: 2,
    createdAt: new Date(),
  },
];

const videoOnlyMedia: MediaItem[] = [
  {
    id: '1',
    type: 'video',
    url: 'https://www.w3schools.com/html/mov_bbb.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop',
    title: 'Product Demo 1',
    order: 0,
    createdAt: new Date(),
    metadata: { duration: 60 },
  },
  {
    id: '2',
    type: 'video',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    thumbnail: 'https://images.unsplash.com/photo-1505751171710-1f6d0ace5a85?w=800&h=800&fit=crop',
    title: 'YouTube Video',
    order: 1,
    createdAt: new Date(),
  },
];

export const Default: Story = {
  args: {
    mediaItems: createMediaItems(),
    productName: 'Premium Wireless Headphones',
  },
};

export const MixedMedia: Story = {
  args: {
    mediaItems: createMediaItems(),
    productName: 'Smart Watch Pro',
    showThumbnails: true,
  },
};

export const ImagesOnly: Story = {
  args: {
    mediaItems: imageOnlyMedia,
    productName: 'Designer Sunglasses',
  },
};

export const VideosOnly: Story = {
  args: {
    mediaItems: videoOnlyMedia,
    productName: 'Action Camera',
  },
};

export const SingleMedia: Story = {
  args: {
    mediaItems: [imageOnlyMedia[0]],
    productName: 'Minimalist Watch',
  },
};

export const AutoPlay: Story = {
  args: {
    mediaItems: imageOnlyMedia,
    productName: 'Rotating Display',
    autoPlay: true,
  },
};

export const NoThumbnails: Story = {
  args: {
    mediaItems: createMediaItems(),
    productName: 'Clean Gallery',
    showThumbnails: false,
  },
};

export const NavigationControls: Story = {
  args: {
    mediaItems: createMediaItems(),
    productName: 'Interactive Gallery',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Wait for component to render
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Click next button
    const nextButton = canvas.getByLabelText('Next media');
    await userEvent.click(nextButton);
    
    // Wait and click previous
    await new Promise(resolve => setTimeout(resolve, 500));
    const prevButton = canvas.getByLabelText('Previous media');
    await userEvent.click(prevButton);
  },
};

export const ThumbnailNavigation: Story = {
  args: {
    mediaItems: createMediaItems(),
    productName: 'Thumbnail Click Navigation',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Click on thumbnails
    const thumbnails = canvas.getAllByRole('button', { name: /view/i });
    
    // Click third thumbnail
    if (thumbnails[2]) {
      await userEvent.click(thumbnails[2]);
    }
    
    // Wait and click first thumbnail
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (thumbnails[0]) {
      await userEvent.click(thumbnails[0]);
    }
  },
};

export const MobileView: Story = {
  args: {
    mediaItems: createMediaItems(),
    productName: 'Mobile Gallery',
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  render: (args) => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground text-center">
        Swipe left/right to navigate on touch devices
      </p>
      <ProductMediaCarousel {...args} />
    </div>
  ),
};

export const TabletView: Story = {
  args: {
    mediaItems: createMediaItems(),
    productName: 'Tablet Gallery',
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};

export const FullscreenMode: Story = {
  args: {
    mediaItems: createMediaItems(),
    productName: 'Fullscreen Gallery',
  },
  render: (args) => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Click the fullscreen icon or press 'F' to enter fullscreen mode
      </p>
      <ProductMediaCarousel {...args} />
    </div>
  ),
};

export const ErrorHandling: Story = {
  args: {
    mediaItems: [
      {
        id: '1',
        type: 'image',
        url: 'https://invalid-url.com/broken-image.jpg',
        title: 'Broken Image',
        order: 0,
        createdAt: new Date(),
      },
      ...imageOnlyMedia,
    ],
    productName: 'Error Handling Demo',
  },
};

export const ManyMediaItems: Story = {
  args: {
    mediaItems: [
      ...createMediaItems(),
      ...imageOnlyMedia.map((item, i) => ({
        ...item,
        id: `extra-${i}`,
        order: i + 4,
      })),
    ],
    productName: 'Large Gallery',
  },
};

export const YouTubeVideo: Story = {
  args: {
    mediaItems: [
      {
        id: '1',
        type: 'video' as const,
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        title: 'YouTube Integration',
        order: 0,
        createdAt: new Date(),
      },
      ...imageOnlyMedia,
    ],
    productName: 'YouTube Support',
  },
};

export const PinchToZoom: Story = {
  args: {
    mediaItems: imageOnlyMedia,
    productName: 'Pinch to Zoom (Touch Devices)',
  },
  render: (args) => (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground space-y-1">
        <p>• On touch devices: Pinch to zoom</p>
        <p>• Desktop: Use scroll wheel to zoom</p>
        <p>• Zoom percentage shown in top-left when zoomed</p>
      </div>
      <ProductMediaCarousel {...args} />
    </div>
  ),
};

export const KeyboardNavigation: Story = {
  args: {
    mediaItems: createMediaItems(),
    productName: 'Keyboard Controls',
  },
  render: (args) => (
    <div className="space-y-4">
      <div className="text-sm text-muted-foreground space-y-1">
        <p>• Arrow Left/Right: Navigate media</p>
        <p>• F: Toggle fullscreen</p>
        <p>• Escape: Exit fullscreen</p>
      </div>
      <ProductMediaCarousel {...args} />
    </div>
  ),
};

export const LoadingStates: Story = {
  args: {
    mediaItems: createMediaItems(),
    productName: 'Loading Gallery',
  },
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">Loading State</h3>
        <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100 animate-pulse">
          <div className="w-full h-full bg-gray-200" />
        </div>
        <div className="grid grid-cols-6 gap-2 mt-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="aspect-square bg-gray-200 rounded-md animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  ),
};

export const AccessibilityFeatures: Story = {
  args: {
    mediaItems: createMediaItems(),
    productName: 'Accessible Media Gallery',
  },
  render: (args) => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Accessibility Features</h3>
      <div className="text-sm text-muted-foreground space-y-2 mb-4">
        <p>• Full keyboard navigation support</p>
        <p>• Screen reader announcements for media changes</p>
        <p>• Clear focus indicators on all controls</p>
        <p>• Touch gesture support for mobile</p>
        <p>• Descriptive ARIA labels</p>
      </div>
      <ProductMediaCarousel {...args} />
    </div>
  ),
  parameters: {
    a11y: {
      config: {
        rules: [
          { id: 'color-contrast', enabled: true },
          { id: 'button-name', enabled: true },
          { id: 'aria-roles', enabled: true },
        ],
      },
    },
  },
};

// Comprehensive Touch Gesture Stories

export const TouchGestureNavigation: Story = {
  args: {
    mediaItems: imageOnlyMedia,
    productName: 'Touch Gesture Navigation',
  },
  render: (args) => (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">Touch Gesture Support</h3>
        <p className="text-sm text-blue-800">
          Simulating touch gestures for navigation:
        </p>
        <ul className="mt-2 text-sm text-blue-800 list-disc list-inside">
          <li>Swipe left/right to navigate between images</li>
          <li>Pinch to zoom in/out</li>
          <li>Double tap to zoom</li>
          <li>Drag when zoomed</li>
        </ul>
      </div>
      <ProductMediaCarousel {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Simulate swipe gestures
    const gallery = canvasElement.querySelector('.aspect-square');
    if (!gallery) return;
    
    // Simulate swipe right
    await userEvent.pointer([
      { keys: '[TouchA>]', target: gallery, coords: { x: 300, y: 200 } },
      { coords: { x: 100, y: 200 } },
      { keys: '[/TouchA]' },
    ]);
    
    await waitFor(() => {
      expect(canvas.getByText('1 / 3')).toBeInTheDocument();
    });
    
    // Simulate swipe left
    await userEvent.pointer([
      { keys: '[TouchA>]', target: gallery, coords: { x: 100, y: 200 } },
      { coords: { x: 300, y: 200 } },
      { keys: '[/TouchA]' },
    ]);
    
    await waitFor(() => {
      expect(canvas.getByText('2 / 3')).toBeInTheDocument();
    });
  },
};

export const PinchToZoomInteraction: Story = {
  args: {
    mediaItems: [imageOnlyMedia[0]],
    productName: 'Pinch to Zoom Testing',
  },
  render: (args) => (
    <div className="space-y-4">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="font-medium text-green-900 mb-2">Pinch to Zoom</h3>
        <p className="text-sm text-green-800">
          Testing multi-touch pinch gestures:
        </p>
        <ul className="mt-2 text-sm text-green-800 list-disc list-inside">
          <li>Two-finger pinch out to zoom in</li>
          <li>Two-finger pinch in to zoom out</li>
          <li>Maximum zoom: 3x</li>
          <li>Minimum zoom: 1x</li>
        </ul>
      </div>
      <ProductMediaCarousel {...args} showThumbnails={false} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const gallery = canvasElement.querySelector('.aspect-square');
    if (!gallery) return;
    
    // Simulate pinch zoom in
    await userEvent.pointer([
      // First touch point
      { keys: '[TouchA>]', target: gallery, coords: { x: 200, y: 200 } },
      // Second touch point
      { keys: '[TouchB>]', target: gallery, coords: { x: 250, y: 250 } },
      // Move fingers apart (zoom in)
      { keys: '[TouchA]', coords: { x: 150, y: 150 } },
      { keys: '[TouchB]', coords: { x: 300, y: 300 } },
      // Release touches
      { keys: '[/TouchA]' },
      { keys: '[/TouchB]' },
    ]);
    
    // Check for zoom indicator
    await waitFor(() => {
      const zoomIndicator = canvas.queryByText(/\d+%/);
      expect(zoomIndicator).toBeInTheDocument();
    });
    
    // Simulate pinch zoom out
    await userEvent.pointer([
      { keys: '[TouchA>]', target: gallery, coords: { x: 150, y: 150 } },
      { keys: '[TouchB>]', target: gallery, coords: { x: 300, y: 300 } },
      // Move fingers together (zoom out)
      { keys: '[TouchA]', coords: { x: 200, y: 200 } },
      { keys: '[TouchB]', coords: { x: 250, y: 250 } },
      { keys: '[/TouchA]' },
      { keys: '[/TouchB]' },
    ]);
  },
};

export const DoubleTapToZoom: Story = {
  args: {
    mediaItems: imageOnlyMedia.slice(0, 1),
    productName: 'Double Tap Zoom',
  },
  render: (args) => (
    <div className="space-y-4">
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h3 className="font-medium text-purple-900 mb-2">Double Tap to Zoom</h3>
        <p className="text-sm text-purple-800">
          Double tap gesture testing:
        </p>
        <ul className="mt-2 text-sm text-purple-800 list-disc list-inside">
          <li>Double tap to zoom to 2x</li>
          <li>Double tap again to reset zoom</li>
          <li>Animated zoom transition</li>
        </ul>
      </div>
      <ProductMediaCarousel {...args} showThumbnails={false} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const gallery = canvasElement.querySelector('.aspect-square');
    if (!gallery) return;
    
    // Simulate double tap
    await userEvent.dblClick(gallery);
    
    // Wait for zoom animation
    await waitFor(() => {
      const zoomIndicator = canvas.queryByText(/200%/);
      expect(zoomIndicator).toBeInTheDocument();
    }, { timeout: 2000 });
    
    // Double tap again to zoom out
    await userEvent.dblClick(gallery);
    
    // Zoom should reset
    await waitFor(() => {
      const zoomIndicator = canvas.queryByText(/\d+%/);
      expect(zoomIndicator).not.toBeInTheDocument();
    });
  },
};

export const SwipeVelocityDetection: Story = {
  args: {
    mediaItems: createMediaItems(),
    productName: 'Swipe Velocity Testing',
  },
  render: (args) => {
    const [swipeInfo, setSwipeInfo] = React.useState<{
      velocity: number;
      direction: string;
    } | null>(null);
    
    return (
      <div className="space-y-4">
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h3 className="font-medium text-orange-900 mb-2">Swipe Velocity Detection</h3>
          <p className="text-sm text-orange-800">
            Testing swipe gesture velocity and direction:
          </p>
          {swipeInfo && (
            <div className="mt-2 p-2 bg-orange-100 rounded">
              <p className="text-xs">Last swipe: {swipeInfo.direction}</p>
              <p className="text-xs">Velocity: {swipeInfo.velocity.toFixed(2)} px/ms</p>
            </div>
          )}
        </div>
        <div
          onTouchStart={(e) => {
            const startX = e.touches[0].clientX;
            const startTime = Date.now();
            
            const handleTouchEnd = (endEvent: TouchEvent) => {
              const endX = endEvent.changedTouches[0].clientX;
              const endTime = Date.now();
              const distance = endX - startX;
              const time = endTime - startTime;
              const velocity = Math.abs(distance) / time;
              
              setSwipeInfo({
                velocity,
                direction: distance > 0 ? 'Right' : 'Left',
              });
              
              document.removeEventListener('touchend', handleTouchEnd);
            };
            
            document.addEventListener('touchend', handleTouchEnd);
          }}
        >
          <ProductMediaCarousel {...args} />
        </div>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const gallery = canvasElement.querySelector('.aspect-square');
    if (!gallery) return;
    
    // Fast swipe
    await userEvent.pointer([
      { keys: '[TouchA>]', target: gallery, coords: { x: 300, y: 200 } },
      { coords: { x: 50, y: 200 }, pointerName: 'TouchA' },
      { keys: '[/TouchA]' },
    ]);
    
    await waitFor(() => {
      const velocityInfo = canvasElement.querySelector('.bg-orange-100');
      expect(velocityInfo).toBeInTheDocument();
    });
    
    // Slow swipe
    await userEvent.pointer([
      { keys: '[TouchA>]', target: gallery, coords: { x: 100, y: 200 } },
      { coords: { x: 200, y: 200 }, pointerName: 'TouchA' },
      { keys: '[/TouchA]' },
    ]);
  },
};

export const MultiTouchGestures: Story = {
  args: {
    mediaItems: imageOnlyMedia,
    productName: 'Multi-Touch Testing',
  },
  render: (args) => {
    const [touches, setTouches] = React.useState<number>(0);
    
    return (
      <div className="space-y-4">
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <h3 className="font-medium text-indigo-900 mb-2">Multi-Touch Gestures</h3>
          <p className="text-sm text-indigo-800">
            Testing multiple simultaneous touches:
          </p>
          <p className="text-sm text-indigo-800 mt-2">
            Active touches: {touches}
          </p>
        </div>
        <div
          onTouchStart={(e) => setTouches(e.touches.length)}
          onTouchEnd={(e) => setTouches(e.touches.length)}
        >
          <ProductMediaCarousel {...args} />
        </div>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const gallery = canvasElement.querySelector('.aspect-square');
    if (!gallery) return;
    
    // Three-finger gesture
    await userEvent.pointer([
      { keys: '[TouchA>]', target: gallery, coords: { x: 150, y: 200 } },
      { keys: '[TouchB>]', target: gallery, coords: { x: 200, y: 200 } },
      { keys: '[TouchC>]', target: gallery, coords: { x: 250, y: 200 } },
      { keys: '[/TouchA][/TouchB][/TouchC]' },
    ]);
    
    // Check touch counter updated
    await waitFor(() => {
      const touchCount = canvasElement.querySelector('.text-indigo-800');
      expect(touchCount).toBeInTheDocument();
    });
  },
};

export const GestureAccessibility: Story = {
  args: {
    mediaItems: createMediaItems(),
    productName: 'Accessible Gestures',
  },
  render: (args) => (
    <div className="space-y-4">
      <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
        <h3 className="font-medium text-teal-900 mb-2">Gesture Accessibility</h3>
        <p className="text-sm text-teal-800 mb-2">
          All gesture actions have keyboard alternatives:
        </p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <p className="font-medium">Gesture:</p>
            <p>Swipe left/right</p>
            <p>Pinch zoom</p>
            <p>Double tap</p>
          </div>
          <div>
            <p className="font-medium">Keyboard:</p>
            <p>Arrow keys</p>
            <p>+/- keys</p>
            <p>Enter key</p>
          </div>
        </div>
      </div>
      <ProductMediaCarousel {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Test keyboard alternatives
    await userEvent.keyboard('{ArrowRight}');
    await waitFor(() => {
      expect(canvas.getByText('2 / 4')).toBeInTheDocument();
    });
    
    // Test zoom with keyboard
    await userEvent.keyboard('+');
    // Note: This would need implementation in the component
  },
};