import type { Meta, StoryObj } from '@storybook/react-vite';
import { CartSkeleton, EmptyCartSkeleton } from './CartSkeleton';
import { Skeleton } from './Skeleton';

const meta: Meta = {
  title: 'UI/Skeletons/CartSkeleton',
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;

export const FullCart: StoryObj = {
  render: () => <CartSkeleton />,
};

export const EmptyCart: StoryObj = {
  render: () => <EmptyCartSkeleton />,
};

export const CartItemOnly: StoryObj = {
  render: () => (
    <div className="flex gap-4 p-4 border rounded-lg">
      <Skeleton className="w-24 h-24 rounded-lg flex-shrink-0" />
      
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex items-center gap-2 mt-3">
          <Skeleton className="h-8 w-24 rounded" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
      
      <div className="flex flex-col items-end justify-between">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-8 w-8 rounded" />
      </div>
    </div>
  ),
};

export const SummaryOnly: StoryObj = {
  render: () => (
    <div className="border rounded-lg p-6 space-y-3">
      <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
      <div className="flex justify-between">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="flex justify-between">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="flex justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="flex justify-between pt-3 border-t">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-28" />
      </div>
      
      <Skeleton className="h-12 w-full rounded-lg mt-6" />
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
    <div className="p-4">
      <CartSkeleton />
    </div>
  ),
};

export const MobileCartItem: StoryObj = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  render: () => (
    <div className="p-4">
      <div className="space-y-4">
        <div className="border rounded-lg p-3">
          <div className="flex gap-3">
            <Skeleton className="w-20 h-20 rounded-lg flex-shrink-0" />
            
            <div className="flex-1 min-w-0">
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-3 w-2/3 mb-3" />
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-20 rounded" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          </div>
          
          <div className="flex justify-between items-center mt-3 pt-3 border-t">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 w-6 rounded" />
          </div>
        </div>
      </div>
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
      <CartSkeleton />
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
        <CartSkeleton />
      </div>
    </div>
  ),
};

export const CartPageLayout: StoryObj = {
  render: () => (
    <div className="container mx-auto px-4 py-8">
      <Skeleton className="h-8 w-48 mb-8" />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-4 p-4 border rounded-lg">
                <Skeleton className="w-24 h-24 rounded-lg flex-shrink-0" />
                
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <div className="flex items-center gap-2 mt-3">
                    <Skeleton className="h-8 w-24 rounded" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
                
                <div className="flex flex-col items-end justify-between">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-8 w-8 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <div className="border rounded-lg p-6 sticky top-4">
            <h3 className="text-lg font-semibold mb-4">Order Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-px w-full my-4 bg-border" />
              <div className="flex justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="flex justify-between pt-3 border-t">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-28" />
              </div>
              
              <Skeleton className="h-12 w-full rounded-lg mt-6" />
              <Skeleton className="h-10 w-full rounded-lg mt-2" />
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
};

export const MinimalLoading: StoryObj = {
  render: () => (
    <div className="space-y-4">
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4">
          <Skeleton className="w-16 h-16 rounded" />
          <div className="flex-1">
            <Skeleton className="h-4 w-1/2 mb-2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  ),
};

export const DetailedSkeleton: StoryObj = {
  render: () => (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
      
      <div className="space-y-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-card border rounded-lg p-6">
            <div className="flex gap-4">
              <Skeleton className="w-32 h-32 rounded-lg flex-shrink-0" />
              
              <div className="flex-1 space-y-3">
                <div>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-1" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-10 w-10 rounded" />
                    <Skeleton className="h-10 w-16 rounded" />
                    <Skeleton className="h-10 w-10 rounded" />
                  </div>
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
              
              <div className="flex flex-col items-end justify-between">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-4 w-16 line-through opacity-60" />
                <Skeleton className="h-10 w-24 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-muted/50 rounded-lg p-4">
          <Skeleton className="h-5 w-32 mb-3" />
          <div className="flex gap-2">
            <Skeleton className="h-10 flex-1 rounded" />
            <Skeleton className="h-10 w-24 rounded" />
          </div>
        </div>
        
        <div className="bg-muted/50 rounded-lg p-4">
          <Skeleton className="h-5 w-40 mb-3" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
    </div>
  ),
};

export const AnimatedLoading: StoryObj = {
  render: () => (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-8 w-48 mb-2 bg-muted rounded" />
        <div className="h-4 w-32 bg-muted rounded" />
      </div>
      
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-4 p-4 border rounded-lg">
            <div className="w-24 h-24 rounded-lg flex-shrink-0 bg-muted" />
            
            <div className="flex-1 space-y-2">
              <div className="h-5 w-3/4 bg-muted rounded" />
              <div className="h-4 w-1/2 bg-muted rounded" />
              <div className="flex items-center gap-2 mt-3">
                <div className="h-8 w-24 rounded bg-muted" />
                <div className="h-4 w-16 bg-muted rounded" />
              </div>
            </div>
            
            <div className="flex flex-col items-end justify-between">
              <div className="h-5 w-20 bg-muted rounded" />
              <div className="h-8 w-8 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
      
      <div className="border-t pt-4 space-y-3">
        <div className="flex justify-between">
          <div className="h-4 w-20 bg-muted rounded" />
          <div className="h-4 w-24 bg-muted rounded" />
        </div>
        <div className="flex justify-between">
          <div className="h-4 w-16 bg-muted rounded" />
          <div className="h-4 w-20 bg-muted rounded" />
        </div>
        <div className="flex justify-between pt-3 border-t">
          <div className="h-5 w-16 bg-muted rounded" />
          <div className="h-5 w-28 bg-muted rounded" />
        </div>
        
        <div className="h-12 w-full rounded-lg mt-6 bg-muted" />
      </div>
    </div>
  ),
};