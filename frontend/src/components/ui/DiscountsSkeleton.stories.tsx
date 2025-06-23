import type { Meta, StoryObj } from '@storybook/react-vite';
import { DiscountsTableSkeleton, CreateDiscountSkeleton } from './DiscountsSkeleton';
import { Skeleton } from './Skeleton';

const meta: Meta = {
  title: 'UI/Skeletons/DiscountsSkeleton',
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;

export const DiscountsList: StoryObj = {
  render: () => <DiscountsTableSkeleton />,
};

export const CreateDiscountForm: StoryObj = {
  render: () => <CreateDiscountSkeleton />,
};

export const DiscountCardGrid: StoryObj = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-card border rounded-lg p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <Skeleton className="h-6 w-24 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="flex justify-between text-sm">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
          
          <div className="pt-4 border-t flex gap-2">
            <Skeleton className="h-9 flex-1 rounded" />
            <Skeleton className="h-9 w-9 rounded" />
          </div>
        </div>
      ))}
    </div>
  ),
};

export const AdminDashboard: StoryObj = {
  render: () => (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card rounded-lg p-4 border">
            <div className="flex items-center justify-between mb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-8 rounded" />
            </div>
            <Skeleton className="h-8 w-16 mb-1" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <DiscountsTableSkeleton />
        </div>
        <div className="lg:col-span-1">
          <div className="bg-card border rounded-lg p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <CreateDiscountSkeleton />
          </div>
        </div>
      </div>
    </div>
  ),
};

export const MobileView: StoryObj = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  render: () => (
    <div className="p-4 space-y-4">
      <Skeleton className="h-8 w-32" />
      
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card border rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <Skeleton className="h-5 w-24 mb-1" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
            
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-20" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
            
            <div className="flex gap-2 mt-3 pt-3 border-t">
              <Skeleton className="h-8 flex-1 rounded" />
              <Skeleton className="h-8 w-8 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  ),
};

export const DetailedFormSkeleton: StoryObj = {
  render: () => (
    <div className="max-w-2xl mx-auto bg-card border rounded-lg p-8">
      <Skeleton className="h-8 w-48 mb-6" />
      
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-10 w-full rounded" />
          </div>
          <div>
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-10 w-full rounded" />
          </div>
        </div>
        
        <div>
          <Skeleton className="h-4 w-40 mb-2" />
          <Skeleton className="h-24 w-full rounded" />
        </div>
        
        <div className="space-y-4">
          <Skeleton className="h-5 w-32 mb-2" />
          <div className="space-y-2">
            <label className="flex items-center gap-3">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-48" />
            </label>
            <label className="flex items-center gap-3">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-56" />
            </label>
            <label className="flex items-center gap-3">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-40" />
            </label>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-10 w-full rounded" />
          </div>
          <div>
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-10 w-full rounded" />
          </div>
        </div>
        
        <div className="pt-4 flex gap-3 justify-end">
          <Skeleton className="h-10 w-24 rounded" />
          <Skeleton className="h-10 w-32 rounded" />
        </div>
      </div>
    </div>
  ),
};

export const CompactList: StoryObj = {
  render: () => (
    <div className="space-y-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between p-3 border rounded hover:bg-muted/50">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-20 rounded" />
            <div>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16 mt-1" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-8 w-8 rounded" />
          </div>
        </div>
      ))}
    </div>
  ),
};

export const DiscountEditModal: StoryObj = {
  render: () => (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border rounded-lg p-6 w-full max-w-md space-y-4">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
        
        <CreateDiscountSkeleton />
      </div>
    </div>
  ),
};

export const EmptyStateSkeleton: StoryObj = {
  render: () => (
    <div className="text-center py-12 space-y-4">
      <Skeleton className="h-24 w-24 rounded-full mx-auto" />
      <Skeleton className="h-6 w-48 mx-auto" />
      <Skeleton className="h-4 w-64 mx-auto" />
      <Skeleton className="h-10 w-40 mx-auto rounded mt-6" />
    </div>
  ),
};

export const TabletView: StoryObj = {
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
  render: () => (
    <div className="p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32 rounded" />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card border rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <Skeleton className="h-5 w-24 mb-1" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
              
              <div className="space-y-1 text-sm">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
              
              <div className="flex gap-2 mt-3 pt-3 border-t">
                <Skeleton className="h-8 flex-1 rounded" />
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
};

export const DarkMode: StoryObj = {
  parameters: {
    backgrounds: { default: 'dark' },
  },
  render: () => (
    <div className="dark">
      <div className="bg-background p-6">
        <DiscountsTableSkeleton />
      </div>
    </div>
  ),
};

export const AnimatedLoading: StoryObj = {
  render: () => (
    <div className="animate-pulse space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-card rounded-lg p-4 border">
            <div className="h-4 w-32 mb-2 bg-muted rounded" />
            <div className="h-7 w-16 bg-muted rounded" />
          </div>
        ))}
      </div>
      
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-muted px-6 py-3 grid grid-cols-5 gap-4">
          <div className="h-4 w-16 bg-muted-foreground/20 rounded" />
          <div className="h-4 w-20 bg-muted-foreground/20 rounded" />
          <div className="h-4 w-24 bg-muted-foreground/20 rounded" />
          <div className="h-4 w-16 bg-muted-foreground/20 rounded" />
          <div className="h-4 w-20 bg-muted-foreground/20 rounded" />
        </div>
        
        <div className="divide-y">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-6 py-4 grid grid-cols-5 gap-4 items-center">
              <div>
                <div className="h-5 w-24 mb-1 bg-muted rounded" />
                <div className="h-3 w-32 bg-muted rounded" />
              </div>
              <div className="h-6 w-16 rounded-full bg-muted" />
              <div className="h-4 w-20 bg-muted rounded" />
              <div className="h-6 w-16 rounded-full bg-muted" />
              <div className="flex gap-2 justify-end">
                <div className="h-8 w-8 rounded bg-muted" />
                <div className="h-8 w-8 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
};