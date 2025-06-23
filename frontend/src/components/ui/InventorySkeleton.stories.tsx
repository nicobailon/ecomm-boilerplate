import type { Meta, StoryObj } from '@storybook/react-vite';
import { 
  InventorySkeleton, 
  InventoryBadgeLoading, 
  InventoryTableLoading, 
  InventoryStatsLoading 
} from './InventorySkeleton';
import { Skeleton } from './Skeleton';

const meta: Meta<typeof InventorySkeleton> = {
  title: 'UI/Skeletons/InventorySkeleton',
  component: InventorySkeleton,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['badge', 'table', 'card', 'stats'],
    },
    count: {
      control: { type: 'number', min: 1, max: 10 },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Badge: Story = {
  args: {
    variant: 'badge',
    count: 1,
  },
};

export const MultipleBadges: Story = {
  args: {
    variant: 'badge',
    count: 3,
  },
};

export const Table: Story = {
  args: {
    variant: 'table',
    count: 5,
  },
};

export const CardView: Story = {
  args: {
    variant: 'card',
    count: 3,
  },
};

export const Stats: Story = {
  args: {
    variant: 'stats',
  },
};

export const InventoryBadge: Story = {
  render: () => <InventoryBadgeLoading />,
};

export const InventoryTable: Story = {
  render: () => <InventoryTableLoading />,
};

export const InventoryStats: Story = {
  render: () => <InventoryStatsLoading />,
};

export const DetailedInventoryView: Story = {
  render: () => (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-10 w-32 rounded" />
            </div>
            <InventoryTableLoading />
          </div>
        </div>
        
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card border rounded-lg p-6">
            <Skeleton className="h-6 w-24 mb-4" />
            <InventoryStatsLoading />
          </div>
          
          <div className="bg-card border rounded-lg p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
};

export const ProductDetailsInventory: Story = {
  render: () => (
    <div className="bg-card border rounded-lg p-6 max-w-md">
      <h3 className="text-lg font-semibold mb-4">Inventory Details</h3>
      
      <div className="space-y-4">
        <div>
          <Skeleton className="h-4 w-24 mb-2" />
          <Skeleton className="h-6 w-32 rounded-full" />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-8 w-24" />
          </div>
          <div>
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
        
        <div className="pt-4 border-t">
          <Skeleton className="h-4 w-32 mb-3" />
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        </div>
        
        <Skeleton className="h-10 w-full rounded mt-4" />
      </div>
    </div>
  ),
};

export const MobileView: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  render: () => (
    <div className="p-4 space-y-4">
      <div>
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-4 w-48" />
      </div>
      
      <InventorySkeleton variant="card" count={3} />
    </div>
  ),
};

export const TabletView: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
  render: () => (
    <div className="p-6">
      <div className="grid grid-cols-2 gap-4">
        <InventorySkeleton variant="card" count={4} />
      </div>
    </div>
  ),
};

export const WarehouseView: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="bg-card border rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-32 rounded" />
            <Skeleton className="h-10 w-10 rounded" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-muted/50 rounded-lg p-4">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-3 w-20 mt-1" />
            </div>
          ))}
        </div>
        
        <InventoryTableLoading />
      </div>
    </div>
  ),
};

export const QuickEditMode: Story = {
  render: () => (
    <div className="bg-card border rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <Skeleton className="h-5 w-32 mb-1" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-24 rounded" />
        <Skeleton className="h-10 w-10 rounded" />
        <Skeleton className="h-10 w-10 rounded" />
        <div className="ml-auto flex gap-2">
          <Skeleton className="h-10 w-20 rounded" />
          <Skeleton className="h-10 w-20 rounded" />
        </div>
      </div>
    </div>
  ),
};

export const BulkEditSkeleton: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="bg-muted/50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
        <Skeleton className="h-4 w-64" />
      </div>
      
      <div className="border rounded-lg divide-y">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-4">
            <div className="flex items-start gap-3">
              <Skeleton className="h-5 w-5 rounded mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <Skeleton className="h-4 w-32 mb-1" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-24 rounded" />
                  <Skeleton className="h-8 w-8 rounded" />
                  <Skeleton className="h-8 w-8 rounded" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="flex justify-end gap-2 pt-4">
        <Skeleton className="h-10 w-24 rounded" />
        <Skeleton className="h-10 w-32 rounded" />
      </div>
    </div>
  ),
};

export const DarkMode: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
  },
  render: () => (
    <div className="dark">
      <div className="bg-background p-6 space-y-6">
        <InventoryStatsLoading />
        <InventoryTableLoading />
      </div>
    </div>
  ),
};

export const AnimatedLoading: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-pulse">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-card rounded-lg p-4 border">
            <div className="h-4 w-32 mb-2 bg-muted rounded" />
            <div className="h-8 w-16 bg-muted rounded" />
          </div>
        ))}
      </div>
      
      <div className="space-y-4 animate-pulse">
        <div className="grid grid-cols-4 gap-4 p-4 border-b">
          <div className="h-4 w-24 bg-muted rounded" />
          <div className="h-4 w-20 mx-auto bg-muted rounded" />
          <div className="h-4 w-20 mx-auto bg-muted rounded" />
          <div className="h-4 w-16 mx-auto bg-muted rounded" />
        </div>
        
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="grid grid-cols-4 gap-4 p-4 border-b">
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 rounded bg-muted" />
              <div>
                <div className="h-4 w-32 mb-1 bg-muted rounded" />
                <div className="h-3 w-20 bg-muted rounded" />
              </div>
            </div>
            <div className="h-6 w-24 mx-auto rounded-full bg-muted" />
            <div className="h-8 w-16 mx-auto bg-muted rounded" />
            <div className="flex items-center justify-center gap-2">
              <div className="h-8 w-8 rounded bg-muted" />
              <div className="h-8 w-8 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  ),
};