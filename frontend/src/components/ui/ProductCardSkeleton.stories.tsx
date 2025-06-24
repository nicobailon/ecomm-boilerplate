import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProductCardSkeleton, ProductGridSkeleton } from './ProductCardSkeleton';
import { Skeleton } from './Skeleton';

const meta: Meta<typeof ProductCardSkeleton> = {
  title: 'UI/Skeletons/ProductCardSkeleton',
  component: ProductCardSkeleton,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const SingleCard: Story = {
  render: () => (
    <div className="max-w-sm">
      <ProductCardSkeleton />
    </div>
  ),
};

export const GridOfFour: Story = {
  render: () => <ProductGridSkeleton count={4} />,
};

export const GridOfEight: Story = {
  render: () => <ProductGridSkeleton count={8} />,
};

export const GridOfTwelve: Story = {
  render: () => <ProductGridSkeleton count={12} />,
};

export const CompactCard: Story = {
  render: () => (
    <div className="max-w-xs">
      <article className="flex w-full relative flex-col overflow-hidden rounded-lg border border-border shadow-sm">
        <div className="relative mx-2 mt-2 flex h-40 overflow-hidden rounded-lg">
          <Skeleton className="w-full h-full" />
        </div>
        
        <div className="mt-3 px-3 pb-3">
          <Skeleton className="h-4 w-3/4 mb-2" />
          <div className="mt-2 mb-3 flex items-center justify-between">
            <Skeleton className="h-6 w-16" />
          </div>
          <Skeleton className="h-8 w-full rounded" />
        </div>
      </article>
    </div>
  ),
};

export const LargeCard: Story = {
  render: () => (
    <div className="max-w-md">
      <article className="flex w-full relative flex-col overflow-hidden rounded-xl border border-border shadow-xl">
        <div className="relative mx-4 mt-4 flex h-80 overflow-hidden rounded-xl">
          <Skeleton className="w-full h-full" />
          <div className="absolute top-3 right-3">
            <Skeleton className="h-8 w-24 rounded-full" />
          </div>
        </div>
        
        <div className="mt-6 px-6 pb-6">
          <Skeleton className="h-8 w-3/4 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-2/3 mb-4" />
          <div className="mt-4 mb-6 flex items-center justify-between">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-6 w-20" />
          </div>
          <Skeleton className="h-12 w-full rounded-lg" />
        </div>
      </article>
    </div>
  ),
};

export const ListViewCard: Story = {
  render: () => (
    <div className="max-w-3xl">
      <article className="flex overflow-hidden rounded-lg border border-border shadow-md">
        <div className="relative w-48 h-48 flex-shrink-0">
          <Skeleton className="w-full h-full" />
          <div className="absolute top-2 left-2">
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>
        
        <div className="flex-1 p-6">
          <Skeleton className="h-6 w-3/4 mb-3" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-2/3 mb-4" />
          <div className="flex items-center justify-between mt-6">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-10 w-32 rounded-lg" />
          </div>
        </div>
      </article>
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
    <div className="p-4">
      <div className="grid grid-cols-2 gap-4">
        <ProductCardSkeleton />
        <ProductCardSkeleton />
        <ProductCardSkeleton />
        <ProductCardSkeleton />
      </div>
    </div>
  ),
};

export const TabletView: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
  render: () => <ProductGridSkeleton count={6} />,
};

export const DarkMode: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
  },
  render: () => (
    <div className="dark">
      <div className="bg-background p-6">
        <ProductGridSkeleton count={4} />
      </div>
    </div>
  ),
};

export const DetailedProductCard: Story = {
  render: () => (
    <div className="max-w-sm">
      <article className="flex w-full relative flex-col overflow-hidden rounded-lg border border-border shadow-lg">
        <div className="relative mx-3 mt-3 flex h-60 overflow-hidden rounded-xl">
          <Skeleton className="w-full h-full" />
          <div className="absolute top-2 right-2 space-y-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <div className="absolute bottom-2 left-2">
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>
        
        <div className="mt-4 px-5 pb-5">
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2 mb-3" />
          
          <div className="flex items-center gap-2 mb-3">
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-3 w-12 ml-2" />
          </div>
          
          <div className="mt-2 mb-5 flex items-center justify-between">
            <div>
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-4 w-16 mt-1 opacity-60" />
            </div>
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          
          <div className="flex gap-2">
            <Skeleton className="h-10 flex-1 rounded-lg" />
            <Skeleton className="h-10 w-10 rounded-lg" />
          </div>
        </div>
      </article>
    </div>
  ),
};

export const MinimalCard: Story = {
  render: () => (
    <div className="max-w-xs">
      <article className="overflow-hidden rounded-lg">
        <Skeleton className="w-full h-48" />
        <div className="pt-3">
          <Skeleton className="h-4 w-3/4 mb-2" />
          <Skeleton className="h-6 w-16" />
        </div>
      </article>
    </div>
  ),
};

export const FeaturedProductGrid: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-1">
          <article className="flex w-full relative flex-col overflow-hidden rounded-xl border border-border shadow-xl h-full">
            <div className="relative mx-4 mt-4 flex h-96 overflow-hidden rounded-xl">
              <Skeleton className="w-full h-full" />
              <div className="absolute top-3 left-3">
                <Skeleton className="h-8 w-24 rounded-full" />
              </div>
            </div>
            
            <div className="mt-6 px-6 pb-6 flex-1 flex flex-col">
              <Skeleton className="h-8 w-3/4 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3 mb-4" />
              <div className="mt-auto">
                <div className="mb-6 flex items-center justify-between">
                  <Skeleton className="h-10 w-24" />
                  <Skeleton className="h-6 w-20" />
                </div>
                <Skeleton className="h-12 w-full rounded-lg" />
              </div>
            </div>
          </article>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  ),
};

export const AnimatedLoading: Story = {
  render: () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
      {Array.from({ length: 8 }).map((_, i) => (
        <article key={i} className="flex w-full relative flex-col overflow-hidden rounded-lg border border-border shadow-lg">
          <div className="relative mx-3 mt-3 flex h-60 overflow-hidden rounded-xl">
            <div className="w-full h-full bg-muted" />
            <div className="absolute top-2 right-2">
              <div className="h-6 w-20 rounded-full bg-muted-foreground/20" />
            </div>
          </div>
          
          <div className="mt-4 px-5 pb-5">
            <div className="h-6 w-3/4 mb-3 bg-muted rounded" />
            <div className="mt-2 mb-5 flex items-center justify-between">
              <div className="h-8 w-20 bg-muted rounded" />
            </div>
            <div className="h-10 w-full rounded-lg bg-muted" />
          </div>
        </article>
      ))}
    </div>
  ),
};

export const ResponsiveGrid: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">Mobile (1 column)</h3>
        <div className="max-w-sm mx-auto">
          <ProductCardSkeleton />
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">Tablet (2 columns)</h3>
        <div className="max-w-2xl mx-auto grid grid-cols-2 gap-4">
          <ProductCardSkeleton />
          <ProductCardSkeleton />
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">Desktop (4 columns)</h3>
        <ProductGridSkeleton count={4} />
      </div>
    </div>
  ),
};