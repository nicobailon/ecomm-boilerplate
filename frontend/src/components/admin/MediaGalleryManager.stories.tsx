import type { Meta, StoryObj } from '@storybook/react-vite';
import { MediaGalleryManager } from './MediaGalleryManager';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { trpc } from '@/lib/trpc';
import { createTRPCClient } from '@/lib/trpc-client';
import { fn } from '@storybook/test';
import { type MediaItem } from '@/types/media';
import { useState } from 'react';
import { within, userEvent, waitFor, expect } from '@storybook/test';
import { Toaster, toast } from 'sonner';
import { withEndpointOverrides, withNetworkCondition } from '@/mocks/story-helpers';
import { trpcMutation } from '@/mocks/utils/trpc-mock';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { AlertCircle, RefreshCw, Wifi, WifiOff, AlertTriangle, Upload, Server, HardDrive } from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: Infinity },
  },
});

const mockMediaItems: MediaItem[] = [
  {
    id: '1',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500',
    title: 'Product Front View',
    order: 0,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    type: 'image',
    url: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=500',
    title: 'Product Side View',
    order: 1,
    createdAt: new Date('2024-01-02'),
  },
  {
    id: '3',
    type: 'video',
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    title: 'Product Demo Video',
    thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    order: 2,
    createdAt: new Date('2024-01-03'),
  },
];

const meta = {
  title: 'Admin/MediaGalleryManager',
  component: MediaGalleryManager,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <div className="w-full max-w-4xl">
            <Story />
            <Toaster position="top-right" />
          </div>
        </QueryClientProvider>
      </trpc.Provider>
    ),
  ],
  args: {
    onChange: fn(),
  },
} satisfies Meta<typeof MediaGalleryManager>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: {
    initialMedia: [],
  },
};

export const WithImages: Story = {
  args: {
    initialMedia: mockMediaItems.filter(item => item.type === 'image'),
  },
};

export const WithMixedMedia: Story = {
  args: {
    initialMedia: mockMediaItems,
  },
};

export const AtMaxCapacity: Story = {
  args: {
    initialMedia: Array.from({ length: 10 }, (_, i) => ({
      id: `${i + 1}`,
      type: 'image' as const,
      url: `https://images.unsplash.com/photo-${1542291026 + i}-7eec264c27ff?w=500`,
      title: `Product Image ${i + 1}`,
      order: i,
      createdAt: new Date(),
    })),
    maxItems: 10,
  },
};

export const VideoOnly: Story = {
  args: {
    initialMedia: [mockMediaItems[2]],
  },
};

export const DragAndDrop: Story = {
  args: {
    initialMedia: mockMediaItems,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Wait for content to load
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Find drag handles
    const dragHandles = canvas.getAllByRole('button', { name: /drag handle/i });
    expect(dragHandles).toHaveLength(3);
    
    // Simulate keyboard-based reordering (more reliable than drag simulation)
    const firstItem = dragHandles[0];
    await userEvent.click(firstItem);
    
    // Use keyboard to move item
    await userEvent.keyboard('{ArrowDown}'); // Move down
    await userEvent.keyboard('{Enter}'); // Confirm position
    
    // Verify visual feedback during drag
    const mediaItems = canvas.getAllByRole('img');
    expect(mediaItems[0]).toHaveAttribute('alt', 'Product Side View'); // Was second, now first
  },
};

export const InteractiveUpload: Story = {
  render: (args) => {
    const [media, setMedia] = useState<MediaItem[]>([]);
    
    return (
      <MediaGalleryManager
        {...args}
        initialMedia={media}
        onChange={setMedia}
      />
    );
  },
};

export const WithProductId: Story = {
  args: {
    productId: 'product-123',
    initialMedia: mockMediaItems,
  },
};

export const CustomMaxItems: Story = {
  args: {
    initialMedia: mockMediaItems.slice(0, 2),
    maxItems: 5,
  },
};

export const LoadingState: Story = {
  render: (args) => {
    const [uploadProgress] = useState({
      'image1.jpg': { fileName: 'image1.jpg', progress: 65 },
      'video1.mp4': { fileName: 'video1.mp4', progress: 30 },
    });
    
    return (
      <div className="space-y-4">
        <MediaGalleryManager {...args} initialMedia={[]} />
        <div className="space-y-2">
          {Object.entries(uploadProgress).map(([fileName, progress]) => (
            <div key={fileName} className="bg-gray-50 rounded-lg p-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium truncate">{progress.fileName}</span>
                <span className="text-muted-foreground">{progress.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-primary h-full transition-all duration-500"
                  style={{ width: `${progress.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  },
};

export const ErrorStates: Story = {
  render: (args) => {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-2">File Too Large Error</h3>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800">File size exceeds 8MB limit for images</p>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-semibold mb-2">Invalid File Type</h3>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800">File type not supported. Please upload JPEG, PNG, or WebP images</p>
          </div>
        </div>
        
        <MediaGalleryManager {...args} initialMedia={[]} />
      </div>
    );
  },
};

export const MobileView: Story = {
  args: {
    initialMedia: mockMediaItems,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const TabletView: Story = {
  args: {
    initialMedia: mockMediaItems,
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};

export const ReorderingAnimation: Story = {
  args: {
    initialMedia: Array.from({ length: 6 }, (_, i) => ({
      id: `${i + 1}`,
      type: 'image' as const,
      url: `https://images.unsplash.com/photo-${1542291026 + i}-7eec264c27ff?w=500`,
      title: `Image ${i + 1}`,
      order: i,
      createdAt: new Date(),
    })),
  },
};

export const DeleteConfirmation: Story = {
  args: {
    initialMedia: mockMediaItems,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Wait for content to load
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Find first delete button
    const deleteButtons = canvas.getAllByRole('button', { name: /delete.*item/i });
    expect(deleteButtons).toHaveLength(3);
    
    // Click first delete button
    await userEvent.click(deleteButtons[0]);
    
    // Confirm deletion in dialog/toast
    const confirmButton = await canvas.findByRole('button', { name: /confirm|yes|delete/i });
    await userEvent.click(confirmButton);
    
    // Verify item was removed
    await waitFor(() => {
      const remainingItems = canvas.getAllByRole('img');
      expect(remainingItems).toHaveLength(2);
    });
  },
};

export const AddYouTubeVideo: Story = {
  args: {
    initialMedia: mockMediaItems.slice(0, 2),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Wait for content to load
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Find and click Add YouTube button
    const addYouTubeButton = canvas.getByRole('button', { name: /add youtube/i });
    await userEvent.click(addYouTubeButton);
    
    // Modal should appear
    const modal = await canvas.findByRole('dialog');
    expect(modal).toBeInTheDocument();
    
    // Enter YouTube URL
    const urlInput = within(modal).getByPlaceholderText(/youtube.*url/i);
    await userEvent.type(urlInput, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    
    // Enter title
    const titleInput = within(modal).getByLabelText(/title/i);
    await userEvent.type(titleInput, 'Product Demo');
    
    // Click Add button
    const addButton = within(modal).getByRole('button', { name: /^add$/i });
    await userEvent.click(addButton);
    
    // Verify video was added
    await waitFor(() => {
      expect(canvas.getByText('Product Demo')).toBeInTheDocument();
    });
  },
};

export const EmptyWithInstructions: Story = {
  render: (args) => {
    return (
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Media Guidelines</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Upload up to 10 media items per product</li>
            <li>• Images: JPEG, PNG, WebP (max 8MB)</li>
            <li>• Videos: YouTube links only</li>
            <li>• First image becomes the main product image</li>
            <li>• Drag to reorder media items</li>
          </ul>
        </div>
        <MediaGalleryManager {...args} initialMedia={[]} />
      </div>
    );
  },
};

export const SingleImageRequired: Story = {
  render: (args) => {
    return (
      <div className="space-y-4">
        <MediaGalleryManager
          {...args}
          initialMedia={[
            {
              id: '1',
              type: 'video',
              url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
              title: 'Product Video 1',
              thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
              order: 0,
              createdAt: new Date(),
            },
            {
              id: '2',
              type: 'video',
              url: 'https://www.youtube.com/watch?v=oHg5SJYRHA0',
              title: 'Product Video 2',
              thumbnail: 'https://img.youtube.com/vi/oHg5SJYRHA0/hqdefault.jpg',
              order: 1,
              createdAt: new Date(),
            },
          ]}
        />
      </div>
    );
  },
};

export const FileUploadProcess: Story = {
  args: {
    initialMedia: [],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Find upload area
    const uploadArea = canvas.getByText(/drag.*drop.*upload/i).closest('div');
    expect(uploadArea).toBeInTheDocument();
    
    // Simulate file selection
    const fileInput = canvas.getByLabelText(/upload.*image/i);
    const file = new File(['test'], 'test-image.jpg', { type: 'image/jpeg' });
    
    await userEvent.upload(fileInput, file);
    
    // Should show upload progress
    await waitFor(() => {
      expect(canvas.getByText(/uploading/i)).toBeInTheDocument();
    });
  },
};

export const KeyboardNavigation: Story = {
  args: {
    initialMedia: mockMediaItems,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Wait for content
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Tab through media items
    await userEvent.tab(); // Focus first item
    
    // First item should have focus
    const firstItem = canvas.getAllByRole('img')[0];
    expect(document.activeElement?.closest('[role="img"]')).toBe(firstItem);
    
    // Tab to drag handle
    await userEvent.tab();
    const dragHandle = canvas.getAllByRole('button', { name: /drag handle/i })[0];
    expect(document.activeElement).toBe(dragHandle);
    
    // Tab to delete button
    await userEvent.tab();
    const deleteButton = canvas.getAllByRole('button', { name: /delete.*item/i })[0];
    expect(document.activeElement).toBe(deleteButton);
    
    // Continue tabbing through items
    await userEvent.tab(); // Next item
    await userEvent.tab(); // Next drag handle
    await userEvent.tab(); // Next delete button
  },
};

export const AccessibilityAnnouncements: Story = {
  args: {
    initialMedia: mockMediaItems,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Delete an item
    const deleteButtons = canvas.getAllByRole('button', { name: /delete.*item/i });
    await userEvent.click(deleteButtons[0]);
    
    // Should announce deletion
    await waitFor(() => {
      const alert = canvas.getByRole('alert');
      expect(alert).toHaveTextContent(/removed|deleted/i);
    });
    
    // Reorder items
    const dragHandles = canvas.getAllByRole('button', { name: /drag handle/i });
    await userEvent.click(dragHandles[0]);
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{Enter}');
    
    // Should announce reorder
    await waitFor(() => {
      const alert = canvas.getByRole('alert');
      expect(alert).toHaveTextContent(/moved|reordered/i);
    });
  },
};

// Enhanced Error State Stories
export const UploadError: Story = {
  args: {
    initialMedia: mockMediaItems.slice(0, 1),
  },
  render: (args) => {
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    
    const simulateUploadError = () => {
      setIsUploading(true);
      setTimeout(() => {
        setUploadError('Failed to upload image. Please try again.');
        setIsUploading(false);
        toast.error('Upload failed');
      }, 1500);
    };
    
    return (
      <div className="space-y-4">
        <Card className="p-4">
          <h4 className="font-medium mb-2">Upload Error Simulation</h4>
          <Button onClick={simulateUploadError} disabled={isUploading}>
            {isUploading ? (
              <>
                <Upload className="w-4 h-4 mr-2 animate-pulse" />
                Uploading...
              </>
            ) : (
              'Trigger Upload Error'
            )}
          </Button>
        </Card>
        
        {uploadError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{uploadError}</AlertDescription>
          </Alert>
        )}
        
        <MediaGalleryManager {...args} />
      </div>
    );
  },
};

export const NetworkError: Story = {
  args: {
    initialMedia: [],
  },
  decorators: [
    (Story) => {
      const [isOffline, setIsOffline] = useState(true);
      
      return (
        <div className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isOffline ? (
                  <WifiOff className="w-4 h-4 text-red-500" />
                ) : (
                  <Wifi className="w-4 h-4 text-green-500" />
                )}
                <span className="text-sm font-medium">
                  {isOffline ? 'Offline' : 'Online'}
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsOffline(!isOffline)}
              >
                Toggle Connection
              </Button>
            </div>
          </Card>
          
          {isOffline && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No internet connection. Media upload is disabled.
              </AlertDescription>
            </Alert>
          )}
          
          <Story />
        </div>
      );
    },
  ],
  ...withNetworkCondition('offline'),
};

export const ServerError: Story = {
  args: {
    initialMedia: mockMediaItems.slice(0, 2),
  },
  render: (args) => {
    const [serverError, setServerError] = useState(false);
    
    return (
      <div className="space-y-4">
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="flex items-center gap-2 mb-2">
            <Server className="w-4 h-4 text-red-600" />
            <h4 className="font-medium">Server Error Simulation</h4>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Simulates server errors when uploading or deleting media
          </p>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => {
              setServerError(true);
              toast.error('Server error: Unable to process request');
            }}
          >
            Trigger Server Error
          </Button>
        </Card>
        
        {serverError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p>Server error occurred while processing your request.</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setServerError(false)}
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Try Again
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        <MediaGalleryManager {...args} />
      </div>
    );
  },
};

export const QuotaExceeded: Story = {
  args: {
    initialMedia: Array.from({ length: 8 }, (_, i) => ({
      id: `${i + 1}`,
      type: 'image' as const,
      url: `https://images.unsplash.com/photo-${1542291026 + i}-7eec264c27ff?w=500`,
      title: `Product Image ${i + 1}`,
      order: i,
      createdAt: new Date(),
    })),
    maxItems: 10,
  },
  render: (args) => {
    const [quotaInfo] = useState({
      used: 450,
      total: 500,
      unit: 'MB',
    });
    
    return (
      <div className="space-y-4">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-orange-600" />
              <h4 className="font-medium">Storage Quota</h4>
            </div>
            <Badge variant="secondary">
              {quotaInfo.used}/{quotaInfo.total} {quotaInfo.unit}
            </Badge>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-orange-500 h-full transition-all"
              style={{ width: `${(quotaInfo.used / quotaInfo.total) * 100}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {quotaInfo.total - quotaInfo.used} {quotaInfo.unit} remaining
          </p>
        </Card>
        
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You&apos;re approaching your storage limit. Consider removing unused media.
          </AlertDescription>
        </Alert>
        
        <MediaGalleryManager {...args} />
      </div>
    );
  },
};

export const ValidationErrors: Story = {
  args: {
    initialMedia: [],
  },
  render: (args) => {
    const [errors, setErrors] = useState<string[]>([]);
    
    const simulateValidationError = (type: 'size' | 'type' | 'dimensions' | 'name') => {
      const errorMessages = {
        size: 'File size exceeds 8MB limit',
        type: 'Invalid file type. Only JPEG, PNG, and WebP are allowed',
        dimensions: 'Image dimensions must be at least 500x500 pixels',
        name: 'File name contains invalid characters',
      };
      
      setErrors(prev => [...prev, errorMessages[type]]);
      toast.error(errorMessages[type]);
    };
    
    return (
      <div className="space-y-4">
        <Card className="p-4">
          <h4 className="font-medium mb-3">Validation Error Triggers</h4>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={() => simulateValidationError('size')}>
              File Too Large
            </Button>
            <Button size="sm" variant="outline" onClick={() => simulateValidationError('type')}>
              Invalid Type
            </Button>
            <Button size="sm" variant="outline" onClick={() => simulateValidationError('dimensions')}>
              Wrong Dimensions
            </Button>
            <Button size="sm" variant="outline" onClick={() => simulateValidationError('name')}>
              Invalid Name
            </Button>
            <Button size="sm" variant="destructive" onClick={() => setErrors([])}>
              Clear Errors
            </Button>
          </div>
        </Card>
        
        {errors.length > 0 && (
          <div className="space-y-2">
            {errors.map((error, i) => (
              <Alert key={i} variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ))}
          </div>
        )}
        
        <MediaGalleryManager {...args} />
      </div>
    );
  },
};

export const ConcurrentUploadError: Story = {
  args: {
    initialMedia: mockMediaItems.slice(0, 1),
  },
  render: (args) => {
    const [uploadQueue, setUploadQueue] = useState<{
      id: string;
      name: string;
      progress: number;
      status: 'uploading' | 'failed' | 'success';
    }[]>([]);
    
    const simulateConcurrentUploads = () => {
      const newUploads = [
        { id: '1', name: 'image1.jpg', progress: 0, status: 'uploading' as const },
        { id: '2', name: 'image2.jpg', progress: 0, status: 'uploading' as const },
        { id: '3', name: 'image3.jpg', progress: 0, status: 'uploading' as const },
      ];
      
      setUploadQueue(newUploads);
      
      // Simulate progress
      newUploads.forEach((upload, index) => {
        const interval = setInterval(() => {
          setUploadQueue(prev => prev.map(u => {
            if (u.id === upload.id) {
              if (u.progress >= 100) {
                clearInterval(interval);
                // Fail the second upload
                return { ...u, status: index === 1 ? 'failed' : 'success' };
              }
              return { ...u, progress: Math.min(100, u.progress + 10) };
            }
            return u;
          }));
        }, 300);
      });
    };
    
    return (
      <div className="space-y-4">
        <Card className="p-4">
          <h4 className="font-medium mb-3">Concurrent Upload Test</h4>
          <p className="text-sm text-muted-foreground mb-3">
            Simulates multiple uploads with one failing
          </p>
          <Button onClick={simulateConcurrentUploads}>
            Start Concurrent Uploads
          </Button>
        </Card>
        
        {uploadQueue.length > 0 && (
          <Card className="p-4">
            <h5 className="text-sm font-medium mb-3">Upload Queue</h5>
            <div className="space-y-2">
              {uploadQueue.map(upload => (
                <div key={upload.id} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>{upload.name}</span>
                    <Badge
                      variant={
                        upload.status === 'failed' ? 'destructive' :
                        upload.status === 'success' ? 'default' :
                        'secondary'
                      }
                    >
                      {upload.status}
                    </Badge>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        upload.status === 'failed' ? 'bg-red-500' :
                        upload.status === 'success' ? 'bg-green-500' :
                        'bg-blue-500'
                      }`}
                      style={{ width: `${upload.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
        
        <MediaGalleryManager {...args} />
      </div>
    );
  },
};

export const MSWIntegration: Story = {
  args: {
    productId: 'test-product',
    initialMedia: [],
  },
  decorators: [
    (Story) => (
      <div className="space-y-4">
        <Card className="p-4">
          <h4 className="font-medium mb-2">MSW Integration</h4>
          <p className="text-sm text-muted-foreground">
            This story uses Mock Service Worker for realistic API behavior
          </p>
        </Card>
        <Story />
        <Toaster position="top-right" />
      </div>
    ),
  ],
  ...withEndpointOverrides([
    trpcMutation('media.upload', async ({ file }: any) => {
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Random failure
      if (Math.random() > 0.7) {
        throw new Error('Upload failed');
      }
      
      return {
        id: Math.random().toString(36).substring(7),
        type: 'image',
        url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500',
        title: file.name,
        order: 0,
        createdAt: new Date(),
      };
    }),
    trpcMutation('media.delete', async () => {
      // Simulate deletion
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true };
    }),
  ]),
};

export const ErrorRecovery: Story = {
  args: {
    initialMedia: mockMediaItems.slice(0, 2),
  },
  render: (args) => {
    const [error, setError] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);
    const [isRetrying, setIsRetrying] = useState(false);
    
    const simulateErrorAndRecover = async () => {
      setError('Failed to save media changes');
      toast.error('Failed to save media changes');
    };
    
    const retry = async () => {
      setIsRetrying(true);
      setRetryCount(prev => prev + 1);
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (retryCount >= 1) {
        setError(null);
        toast.success('Changes saved successfully!');
      } else {
        toast.error('Retry failed. Please try again.');
      }
      
      setIsRetrying(false);
    };
    
    return (
      <div className="space-y-4">
        <Card className="p-4">
          <h4 className="font-medium mb-3">Error Recovery Demo</h4>
          <p className="text-sm text-muted-foreground mb-3">
            First retry will fail, second will succeed
          </p>
          <Button onClick={simulateErrorAndRecover}>
            Trigger Save Error
          </Button>
        </Card>
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <span>{error}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={retry}
                  disabled={isRetrying}
                >
                  {isRetrying ? (
                    <>
                      <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                      Retrying...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Retry ({retryCount + 1}/2)
                    </>
                  )}
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        <MediaGalleryManager {...args} />
      </div>
    );
  },
};