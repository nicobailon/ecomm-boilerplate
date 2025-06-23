import type { Meta, StoryObj } from '@storybook/react-vite';
import { MediaItemCard } from './MediaItemCard';
import { fn } from '@storybook/test';
import { DndContext } from '@dnd-kit/core';
import { type MediaItem } from '@/types/media';

const mockImageItem: MediaItem = {
  id: '1',
  type: 'image',
  url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500',
  title: 'Product Front View',
  order: 0,
  createdAt: new Date('2024-01-01'),
  metadata: {
    size: 2456789,
    dimensions: {
      width: 1920,
      height: 1080,
    },
  },
};

const mockVideoItem: MediaItem = {
  id: '2',
  type: 'video',
  url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  title: 'Product Demo Video',
  thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
  order: 1,
  createdAt: new Date('2024-01-02'),
};

const meta = {
  title: 'Admin/MediaItemCard',
  component: MediaItemCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <DndContext>
        <div className="w-64">
          <Story />
        </div>
      </DndContext>
    ),
  ],
  args: {
    onDelete: fn(),
    onEdit: fn(),
  },
} satisfies Meta<typeof MediaItemCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MainImage: Story = {
  args: {
    item: mockImageItem,
    index: 0,
  },
};

export const RegularImage: Story = {
  args: {
    item: mockImageItem,
    index: 1,
  },
};

export const VideoCard: Story = {
  args: {
    item: mockVideoItem,
    index: 1,
  },
};

export const MainVideo: Story = {
  args: {
    item: mockVideoItem,
    index: 0,
  },
};

export const WithoutThumbnail: Story = {
  args: {
    item: {
      ...mockVideoItem,
      thumbnail: undefined,
    },
    index: 1,
  },
};

export const LargeFileSize: Story = {
  args: {
    item: {
      ...mockImageItem,
      metadata: {
        size: 7890123,
        dimensions: {
          width: 3840,
          height: 2160,
        },
      },
    },
    index: 0,
  },
};

export const WithoutMetadata: Story = {
  args: {
    item: {
      ...mockImageItem,
      metadata: undefined,
    },
    index: 1,
  },
};

export const DraggingState: Story = {
  args: {
    item: mockImageItem,
    index: 1,
    isDragging: true,
  },
};

export const LongTitle: Story = {
  args: {
    item: {
      ...mockImageItem,
      title: 'This is a very long product image title that might need to be truncated in some views',
    },
    index: 1,
  },
};

export const ErrorState: Story = {
  args: {
    item: {
      ...mockImageItem,
      url: '/broken-image-url.jpg',
    },
    index: 1,
  },
};

export const GridLayout: Story = {
  decorators: [
    () => (
      <DndContext>
        <div className="grid grid-cols-3 gap-4 max-w-3xl">
          <MediaItemCard
            item={mockImageItem}
            index={0}
            onDelete={fn()}
            onEdit={fn()}
          />
          <MediaItemCard
            item={{ ...mockImageItem, id: '2' }}
            index={1}
            onDelete={fn()}
            onEdit={fn()}
          />
          <MediaItemCard
            item={mockVideoItem}
            index={2}
            onDelete={fn()}
            onEdit={fn()}
          />
          <MediaItemCard
            item={{ ...mockImageItem, id: '3' }}
            index={3}
            onDelete={fn()}
            onEdit={fn()}
          />
          <MediaItemCard
            item={{ ...mockVideoItem, id: '4' }}
            index={4}
            onDelete={fn()}
            onEdit={fn()}
          />
          <MediaItemCard
            item={{ ...mockImageItem, id: '5' }}
            index={5}
            onDelete={fn()}
            onEdit={fn()}
          />
        </div>
      </DndContext>
    ),
  ],
  args: {
    item: mockImageItem,
    index: 0,
  },
};

export const MobileSize: Story = {
  decorators: [
    (Story) => (
      <DndContext>
        <div className="w-32">
          <Story />
        </div>
      </DndContext>
    ),
  ],
  args: {
    item: mockImageItem,
    index: 0,
  },
};

export const SelectedState: Story = {
  decorators: [
    (Story) => (
      <DndContext>
        <div className="w-64">
          <div className="ring-2 ring-primary ring-offset-2 rounded-lg">
            <Story />
          </div>
        </div>
      </DndContext>
    ),
  ],
  args: {
    item: mockImageItem,
    index: 0,
  },
};

export const LoadingState: Story = {
  decorators: [
    () => (
      <DndContext>
        <div className="w-64">
          <div className="relative aspect-square rounded-lg border-2 border-dashed border-gray-300 overflow-hidden animate-pulse">
            <div className="w-full h-full bg-gray-200" />
            <div className="absolute top-2 left-2">
              <div className="bg-gray-300 rounded w-6 h-6" />
            </div>
            <div className="absolute top-2 right-2">
              <div className="bg-gray-300 rounded-full w-6 h-6" />
            </div>
          </div>
        </div>
      </DndContext>
    ),
  ],
  args: {
    item: mockImageItem,
    index: 0,
  },
};

export const AllStates: Story = {
  decorators: [
    () => (
      <DndContext>
        <div className="space-y-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">Image States</h3>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Main Image</p>
                <MediaItemCard
                  item={mockImageItem}
                  index={0}
                  onDelete={fn()}
                  onEdit={fn()}
                />
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Regular Image</p>
                <MediaItemCard
                  item={{ ...mockImageItem, id: '2' }}
                  index={1}
                  onDelete={fn()}
                  onEdit={fn()}
                />
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Dragging</p>
                <MediaItemCard
                  item={{ ...mockImageItem, id: '3' }}
                  index={2}
                  onDelete={fn()}
                  onEdit={fn()}
                  isDragging
                />
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">With Size</p>
                <MediaItemCard
                  item={{
                    ...mockImageItem,
                    id: '4',
                    metadata: { size: 5242880 },
                  }}
                  index={3}
                  onDelete={fn()}
                  onEdit={fn()}
                />
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Video States</h3>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">Main Video</p>
                <MediaItemCard
                  item={mockVideoItem}
                  index={0}
                  onDelete={fn()}
                  onEdit={fn()}
                />
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Regular Video</p>
                <MediaItemCard
                  item={{ ...mockVideoItem, id: '5' }}
                  index={1}
                  onDelete={fn()}
                  onEdit={fn()}
                />
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">No Thumbnail</p>
                <MediaItemCard
                  item={{
                    ...mockVideoItem,
                    id: '6',
                    thumbnail: undefined,
                  }}
                  index={2}
                  onDelete={fn()}
                  onEdit={fn()}
                />
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Dragging</p>
                <MediaItemCard
                  item={{ ...mockVideoItem, id: '7' }}
                  index={3}
                  onDelete={fn()}
                  onEdit={fn()}
                  isDragging
                />
              </div>
            </div>
          </div>
        </div>
      </DndContext>
    ),
  ],
  args: {
    item: mockImageItem,
    index: 0,
  },
};