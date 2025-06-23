import type { Meta, StoryObj } from '@storybook/react-vite';
import { 
  AnalyticsStatsSkeleton, 
  RevenueChartSkeleton, 
  TopProductsSkeleton,
  CustomerActivitySkeleton 
} from './AnalyticsSkeleton';

const meta: Meta = {
  title: 'UI/Skeletons/AnalyticsSkeleton',
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;

export const DashboardLoading: StoryObj = {
  render: () => (
    <div className="space-y-8 p-6 bg-background">
      <div>
        <h2 className="text-2xl font-bold mb-6">Analytics Dashboard</h2>
        <AnalyticsStatsSkeleton />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChartSkeleton />
        <TopProductsSkeleton />
      </div>
      
      <CustomerActivitySkeleton />
    </div>
  ),
};

export const StatsCards: StoryObj = {
  render: () => <AnalyticsStatsSkeleton />,
};

export const RevenueChart: StoryObj = {
  render: () => <RevenueChartSkeleton />,
};

export const TopProducts: StoryObj = {
  render: () => <TopProductsSkeleton />,
};

export const CustomerActivity: StoryObj = {
  render: () => <CustomerActivitySkeleton />,
};

export const MobileView: StoryObj = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  render: () => (
    <div className="space-y-6 p-4 bg-background">
      <AnalyticsStatsSkeleton />
      <RevenueChartSkeleton />
      <TopProductsSkeleton />
      <CustomerActivitySkeleton />
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
    <div className="space-y-6 p-6 bg-background">
      <AnalyticsStatsSkeleton />
      <div className="grid grid-cols-2 gap-6">
        <RevenueChartSkeleton />
        <TopProductsSkeleton />
      </div>
      <CustomerActivitySkeleton />
    </div>
  ),
};

export const DarkMode: StoryObj = {
  parameters: {
    backgrounds: { default: 'dark' },
  },
  render: () => (
    <div className="dark">
      <div className="space-y-8 p-6 bg-background">
        <AnalyticsStatsSkeleton />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RevenueChartSkeleton />
          <TopProductsSkeleton />
        </div>
        <CustomerActivitySkeleton />
      </div>
    </div>
  ),
};

export const AnimatedLoading: StoryObj = {
  render: () => (
    <div className="space-y-8 p-6 bg-background">
      <div className="animate-pulse">
        <AnalyticsStatsSkeleton />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="animate-pulse delay-100">
          <RevenueChartSkeleton />
        </div>
        <div className="animate-pulse delay-200">
          <TopProductsSkeleton />
        </div>
      </div>
      
      <div className="animate-pulse delay-300">
        <CustomerActivitySkeleton />
      </div>
    </div>
  ),
};

export const PartialLoading: StoryObj = {
  render: () => (
    <div className="space-y-8 p-6 bg-background">
      {/* Loaded stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-card rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-muted-foreground">Total Users</span>
            <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center">
              👥
            </div>
          </div>
          <div className="text-2xl font-bold">1,234</div>
          <div className="text-xs text-muted-foreground">+12% from last month</div>
        </div>
        {/* Loading remaining stats */}
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-card rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
              <div className="h-8 w-8 rounded bg-muted animate-pulse" />
            </div>
            <div className="h-8 w-32 mb-2 bg-muted animate-pulse rounded" />
            <div className="h-3 w-20 bg-muted animate-pulse rounded" />
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChartSkeleton />
        <TopProductsSkeleton />
      </div>
    </div>
  ),
};

export const SingleStatCard: StoryObj = {
  render: () => (
    <div className="p-6 bg-background">
      <div className="bg-card rounded-lg shadow p-6 w-64">
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 w-24 bg-muted animate-pulse rounded" />
          <div className="h-8 w-8 rounded bg-muted animate-pulse" />
        </div>
        <div className="h-8 w-32 mb-2 bg-muted animate-pulse rounded" />
        <div className="h-3 w-20 bg-muted animate-pulse rounded" />
      </div>
    </div>
  ),
};

export const CompactView: StoryObj = {
  render: () => (
    <div className="max-w-4xl mx-auto p-4 bg-background">
      <div className="space-y-4">
        {/* Compact stats in a row */}
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card rounded p-3">
              <div className="h-3 w-16 bg-muted animate-pulse rounded mb-2" />
              <div className="h-6 w-12 bg-muted animate-pulse rounded" />
            </div>
          ))}
        </div>
        
        {/* Compact charts side by side */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card rounded p-4">
            <div className="h-4 w-32 bg-muted animate-pulse rounded mb-3" />
            <div className="h-32 flex items-end justify-between gap-1">
              {Array.from({ length: 8 }).map((_, i) => (
                <div 
                  key={i} 
                  className="flex-1 bg-muted animate-pulse rounded-t"
                  style={{ height: `${Math.random() * 80 + 20}%` }}
                />
              ))}
            </div>
          </div>
          
          <div className="bg-card rounded p-4">
            <div className="h-4 w-24 bg-muted animate-pulse rounded mb-3" />
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-muted animate-pulse" />
                    <div className="h-3 w-20 bg-muted animate-pulse rounded" />
                  </div>
                  <div className="h-3 w-12 bg-muted animate-pulse rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
};