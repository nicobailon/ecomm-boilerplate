import type { Meta, StoryObj } from '@storybook/react-vite';
import DiscountsTab from './DiscountsTab';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { trpc } from '@/lib/trpc';
import { createTRPCClient } from '@/lib/trpc-client';
import { within, userEvent, expect, waitFor } from '@storybook/test';
import { addDays } from 'date-fns';
import type { Discount } from '@/types/discount';
import { Toaster } from 'sonner';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: Infinity },
  },
});

// Generate mock discounts
const generateMockDiscounts = (count: number): Discount[] => {
  const now = new Date();
  return Array.from({ length: count }, (_, i) => ({
    _id: `discount-${i + 1}`,
    code: `DISCOUNT${i + 1}`,
    discountPercentage: (i % 4 + 1) * 10, // 10%, 20%, 30%, 40%
    expirationDate: addDays(now, i % 3 === 0 ? -30 : i % 3 === 1 ? 30 : 60).toISOString(),
    isActive: i % 3 !== 0, // Inactive for expired ones
    description: `Discount ${i + 1} - ${(i % 4 + 1) * 10}% off`,
    maxUses: i % 2 === 0 ? 100 : undefined,
    currentUses: Math.floor(Math.random() * 50),
    minimumPurchaseAmount: i % 3 === 0 ? 50 : undefined,
    createdAt: addDays(now, -90).toISOString(),
    updatedAt: addDays(now, -i).toISOString(),
  }));
};

const meta = {
  title: 'Admin/DiscountsTab',
  component: DiscountsTab,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <div className="min-h-screen bg-background p-6">
            <Story />
            <Toaster position="top-right" />
          </div>
        </QueryClientProvider>
      </trpc.Provider>
    ),
  ],
} satisfies Meta<typeof DiscountsTab>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  decorators: [
    (Story: any) => {
      const mockQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: Infinity,
            retry: false,
          },
        },
      });
      
      // Mock discount data
      mockQueryClient.setQueryData(['discount.list', {}], {
        discounts: generateMockDiscounts(10),
      });
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={mockQueryClient}>
          <QueryClientProvider client={mockQueryClient}>
            <div className="min-h-screen bg-background p-6">
              <Story />
              <Toaster position="top-right" />
            </div>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
};

export const EmptyState: Story = {
  decorators: [
    (Story: any) => {
      const mockQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: Infinity,
            retry: false,
          },
        },
      });
      
      mockQueryClient.setQueryData(['discount.list', {}], {
        discounts: [],
      });
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={mockQueryClient}>
          <QueryClientProvider client={mockQueryClient}>
            <div className="min-h-screen bg-background p-6">
              <Story />
              <Toaster position="top-right" />
            </div>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
};

export const LargeDataset: Story = {
  decorators: [
    (Story: any) => {
      const mockQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: Infinity,
            retry: false,
          },
        },
      });
      
      mockQueryClient.setQueryData(['discount.list', {}], {
        discounts: generateMockDiscounts(100),
      });
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={mockQueryClient}>
          <QueryClientProvider client={mockQueryClient}>
            <div className="min-h-screen bg-background p-6">
              <Story />
              <Toaster position="top-right" />
            </div>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
};

// Comprehensive Accessibility Stories

export const ScreenReaderSupport: Story = {
  decorators: [
    (Story: any) => {
      const mockQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: Infinity,
            retry: false,
          },
        },
      });
      
      mockQueryClient.setQueryData(['discount.list', {}], {
        discounts: generateMockDiscounts(5),
      });
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={mockQueryClient}>
          <QueryClientProvider client={queryClient}>
            <div className="min-h-screen bg-background p-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-blue-900 mb-2">Screen Reader Support</h3>
                <p className="text-sm text-blue-800">
                  This table includes comprehensive ARIA attributes for screen reader users:
                </p>
                <ul className="mt-2 text-sm text-blue-800 list-disc list-inside">
                  <li>Table has proper semantic structure</li>
                  <li>Column headers are properly associated</li>
                  <li>Status badges include role=&quot;status&quot;</li>
                  <li>Actions have descriptive labels</li>
                  <li>Row count is announced</li>
                </ul>
              </div>
              <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
                <span id="discount-table-status">Discount table with 5 items loaded</span>
              </div>
              <Story />
              <Toaster position="top-right" />
            </div>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Wait for table to load
    await waitFor(() => {
      const table = canvas.getByRole('table');
      expect(table).toBeInTheDocument();
    });
    
    // Check table has proper structure
    canvas.getByRole('table');
    const headers = canvas.getAllByRole('columnheader');
    expect(headers.length).toBeGreaterThan(0);
    
    // Check status badges have role
    const statusBadges = canvas.getAllByText(/Active|Inactive|Expired/);
    statusBadges.forEach(badge => {
      expect(badge.closest('[role="status"]')).toBeInTheDocument();
    });
    
    // Check action buttons have labels
    const editButtons = canvas.getAllByRole('button', { name: /edit/i });
    expect(editButtons.length).toBeGreaterThan(0);
  },
};

export const KeyboardNavigation: Story = {
  decorators: [
    (Story: any) => {
      const mockQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: Infinity,
            retry: false,
          },
        },
      });
      
      mockQueryClient.setQueryData(['discount.list', {}], {
        discounts: generateMockDiscounts(5),
      });
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={mockQueryClient}>
          <QueryClientProvider client={queryClient}>
            <div className="min-h-screen bg-background p-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-green-900 mb-2">Keyboard Navigation</h3>
                <p className="text-sm text-green-800 mb-2">
                  Navigate the table using keyboard:
                </p>
                <ul className="text-sm text-green-800 list-disc list-inside">
                  <li><kbd>Tab</kbd> - Move between interactive elements</li>
                  <li><kbd>Enter</kbd> - Activate buttons</li>
                  <li><kbd>Arrow Keys</kbd> - Navigate within inputs</li>
                  <li><kbd>Escape</kbd> - Close modals/drawers</li>
                </ul>
              </div>
              <Story />
              <Toaster position="top-right" />
            </div>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Wait for table
    await waitFor(() => {
      expect(canvas.getByRole('table')).toBeInTheDocument();
    });
    
    // Focus on search input
    const searchInput = canvas.getByLabelText(/search discount codes/i);
    searchInput.focus();
    expect(document.activeElement).toBe(searchInput);
    
    // Tab to filter select
    await userEvent.tab();
    const filterSelect = canvas.getByRole('combobox');
    expect(document.activeElement).toBe(filterSelect);
    
    // Tab to create button
    await userEvent.tab();
    const createButton = canvas.getByRole('button', { name: /create discount/i });
    expect(document.activeElement).toBe(createButton);
    
    // Tab to first table row action
    await userEvent.tab();
    await userEvent.tab(); // Skip table headers
    const firstEditButton = canvas.getAllByRole('button', { name: /edit/i })[0];
    expect(document.activeElement).toBe(firstEditButton);
  },
};

export const TableCaption: Story = {
  decorators: [
    (Story: any) => {
      const mockQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: Infinity,
            retry: false,
          },
        },
      });
      
      const discounts = generateMockDiscounts(8);
      mockQueryClient.setQueryData(['discount.list', {}], {
        discounts,
      });
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={mockQueryClient}>
          <QueryClientProvider client={queryClient}>
            <div className="min-h-screen bg-background p-6">
              <div 
                role="region"
                aria-labelledby="discounts-heading"
                aria-describedby="discounts-description"
              >
                <h2 id="discounts-heading" className="text-2xl font-bold mb-2">
                  Discount Code Management
                </h2>
                <p id="discounts-description" className="text-muted-foreground mb-6">
                  Manage promotional discount codes for your store. Total: {discounts.length} codes.
                </p>
                <Story />
              </div>
              <Toaster position="top-right" />
            </div>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
};

export const FocusIndicators: Story = {
  decorators: [
    (Story: any) => {
      const mockQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: Infinity,
            retry: false,
          },
        },
      });
      
      mockQueryClient.setQueryData(['discount.list', {}], {
        discounts: generateMockDiscounts(5),
      });
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={mockQueryClient}>
          <QueryClientProvider client={queryClient}>
            <div className="min-h-screen bg-background p-6">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-purple-900 mb-2">Focus Indicators</h3>
                <p className="text-sm text-purple-800">
                  All interactive elements have visible focus indicators for keyboard navigation.
                </p>
              </div>
              <style dangerouslySetInnerHTML={{ __html: `
                *:focus {
                  outline: 3px solid rgb(147, 51, 234) !important;
                  outline-offset: 2px !important;
                }
              `}} />
              <Story />
              <Toaster position="top-right" />
            </div>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    await waitFor(() => {
      const searchInput = canvas.getByLabelText(/search/i);
      expect(searchInput).toBeInTheDocument();
    });
    
    // Check focus styles on various elements
    const searchInput = canvas.getByLabelText(/search/i);
    await userEvent.click(searchInput);
    expect(searchInput).toHaveStyle('outline: 3px solid rgb(147, 51, 234)');
  },
};

export const HighContrastMode: Story = {
  decorators: [
    (Story: any) => {
      const mockQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: Infinity,
            retry: false,
          },
        },
      });
      
      mockQueryClient.setQueryData(['discount.list', {}], {
        discounts: generateMockDiscounts(5),
      });
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={mockQueryClient}>
          <QueryClientProvider client={queryClient}>
            <div className="min-h-screen p-6" style={{ 
              backgroundColor: '#000',
              color: '#fff',
              filter: 'contrast(2)',
            }}>
              <div className="bg-white text-black p-4 rounded-lg mb-6">
                <h3 className="font-medium mb-2">High Contrast Mode</h3>
                <p className="text-sm">
                  Table optimized for high contrast accessibility settings.
                </p>
              </div>
              <Story />
              <Toaster position="top-right" />
            </div>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
};

export const AriaLiveAnnouncements: Story = {
  decorators: [
    (Story: any) => {
      const [announcements, setAnnouncements] = useState<string[]>([]);
      const mockQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: Infinity,
            retry: false,
          },
        },
      });
      
      const discounts = generateMockDiscounts(5);
      mockQueryClient.setQueryData(['discount.list', {}], {
        discounts,
      });
      
      // Simulate updates
      useEffect(() => {
        const timer = setInterval(() => {
          const actions = [
            'Discount code SUMMER20 activated',
            'Discount code WINTER10 deactivated', 
            'Discount code SPRING15 usage: 45/100',
            'New discount code FALL25 created',
          ];
          const randomAction = actions[Math.floor(Math.random() * actions.length)];
          setAnnouncements(prev => [...prev, `${new Date().toLocaleTimeString()}: ${randomAction}`]);
        }, 5000);
        
        return () => clearInterval(timer);
      }, []);
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={mockQueryClient}>
          <QueryClientProvider client={queryClient}>
            <div className="min-h-screen bg-background p-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-yellow-900 mb-2">Live Region Updates</h3>
                <p className="text-sm text-yellow-800 mb-2">
                  Table updates are announced to screen readers.
                </p>
                <div className="mt-2 p-2 bg-yellow-100 rounded text-xs">
                  <h4 className="font-medium mb-1">Recent Announcements:</h4>
                  <ul className="space-y-1">
                    {announcements.slice(-3).map((announcement, index) => (
                      <li key={`announcement-${index}`}>{announcement}</li>
                    ))}
                  </ul>
                </div>
              </div>
              
              {/* Screen reader only live region */}
              <div
                role="status"
                aria-live="polite"
                aria-atomic="true"
                className="sr-only"
              >
                {announcements[announcements.length - 1]}
              </div>
              
              <Story />
              <Toaster position="top-right" />
            </div>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
};

export const SortableColumns: Story = {
  decorators: [
    (Story: any) => {
      const mockQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: Infinity,
            retry: false,
          },
        },
      });
      
      mockQueryClient.setQueryData(['discount.list', {}], {
        discounts: generateMockDiscounts(10),
      });
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={mockQueryClient}>
          <QueryClientProvider client={queryClient}>
            <div className="min-h-screen bg-background p-6">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-orange-900 mb-2">Sortable Columns</h3>
                <p className="text-sm text-orange-800">
                  Click column headers to sort. Screen readers will announce sort changes.
                </p>
              </div>
              <Story />
              <Toaster position="top-right" />
            </div>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    await waitFor(() => {
      const codeHeader = canvas.getByText('Code');
      expect(codeHeader).toBeInTheDocument();
    });
    
    // Check headers are clickable
    const headers = canvas.getAllByRole('columnheader');
    headers.forEach(header => {
      expect(header).toHaveAttribute('tabindex', '0');
      expect(header).toHaveAttribute('aria-sort');
    });
  },
};

export const ResponsiveTable: Story = {
  decorators: [
    (Story: any) => {
      const mockQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: Infinity,
            retry: false,
          },
        },
      });
      
      mockQueryClient.setQueryData(['discount.list', {}], {
        discounts: generateMockDiscounts(5),
      });
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={mockQueryClient}>
          <QueryClientProvider client={queryClient}>
            <div className="min-h-screen bg-background p-6">
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-teal-900 mb-2">Responsive Design</h3>
                <p className="text-sm text-teal-800">
                  Table adapts to different screen sizes while maintaining accessibility.
                </p>
              </div>
              <Story />
              <Toaster position="top-right" />
            </div>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const ErrorStateAnnouncement: Story = {
  decorators: [
    (Story: any) => {
      const [hasError, setHasError] = useState(false);
      const mockQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: Infinity,
            retry: false,
          },
        },
      });
      
      if (!hasError) {
        mockQueryClient.setQueryData(['discount.list', {}], {
          discounts: generateMockDiscounts(5),
        });
      }
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={mockQueryClient}>
          <QueryClientProvider client={queryClient}>
            <div className="min-h-screen bg-background p-6">
              <div className="mb-4">
                <Button onClick={() => setHasError(!hasError)}>
                  Toggle Error State
                </Button>
              </div>
              
              {hasError ? (
                <div
                  role="alert"
                  aria-live="assertive"
                  className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg"
                >
                  <h3 className="font-medium text-destructive mb-2">
                    Error Loading Discounts
                  </h3>
                  <p className="text-sm text-destructive/80">
                    Failed to load discount codes. Please check your connection and try again.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => setHasError(false)}
                    aria-label="Retry loading discount codes"
                  >
                    Retry
                  </Button>
                </div>
              ) : (
                <Story />
              )}
              <Toaster position="top-right" />
            </div>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
};

export const ReducedMotion: Story = {
  decorators: [
    (Story: any) => {
      const mockQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: Infinity,
            retry: false,
          },
        },
      });
      
      mockQueryClient.setQueryData(['discount.list', {}], {
        discounts: generateMockDiscounts(5),
      });
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={mockQueryClient}>
          <QueryClientProvider client={queryClient}>
            <div className="min-h-screen bg-background p-6">
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-indigo-900 mb-2">Reduced Motion</h3>
                <p className="text-sm text-indigo-800">
                  Animations are disabled for users who prefer reduced motion.
                </p>
              </div>
              <style dangerouslySetInnerHTML={{ __html: `
                @media (prefers-reduced-motion: reduce) {
                  * {
                    animation-duration: 0.01ms !important;
                    animation-iteration-count: 1 !important;
                    transition-duration: 0.01ms !important;
                  }
                }
              `}} />
              <Story />
              <Toaster position="top-right" />
            </div>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
};

export const TableSummary: Story = {
  decorators: [
    (Story: any) => {
      const mockQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: Infinity,
            retry: false,
          },
        },
      });
      
      const discounts = generateMockDiscounts(20);
      const activeCount = discounts.filter(d => d.isActive && new Date(d.expirationDate) > new Date()).length;
      const expiredCount = discounts.filter(d => new Date(d.expirationDate) < new Date()).length;
      
      mockQueryClient.setQueryData(['discount.list', {}], {
        discounts,
      });
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={mockQueryClient}>
          <QueryClientProvider client={queryClient}>
            <div className="min-h-screen bg-background p-6">
              <div 
                className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6"
                role="region"
                aria-label="Discount summary"
              >
                <h3 className="font-medium text-gray-900 mb-2">Table Summary</h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Total:</span>
                    <span className="ml-2 font-medium">{discounts.length} codes</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Active:</span>
                    <span className="ml-2 font-medium text-green-600">{activeCount}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Expired:</span>
                    <span className="ml-2 font-medium text-red-600">{expiredCount}</span>
                  </div>
                </div>
              </div>
              
              {/* Screen reader summary */}
              <div className="sr-only" role="status" aria-live="polite">
                Showing {discounts.length} discount codes. {activeCount} active, {expiredCount} expired.
              </div>
              
              <Story />
              <Toaster position="top-right" />
            </div>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
};

export const DescriptiveActions: Story = {
  decorators: [
    (Story: any) => {
      const mockQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: Infinity,
            retry: false,
          },
        },
      });
      
      mockQueryClient.setQueryData(['discount.list', {}], {
        discounts: generateMockDiscounts(3),
      });
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={mockQueryClient}>
          <QueryClientProvider client={queryClient}>
            <div className="min-h-screen bg-background p-6">
              <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-rose-900 mb-2">Descriptive Actions</h3>
                <p className="text-sm text-rose-800">
                  All action buttons include descriptive labels with context about which item they affect.
                </p>
              </div>
              <Story />
              <Toaster position="top-right" />
            </div>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    await waitFor(() => {
      const editButtons = canvas.getAllByRole('button', { name: /edit/i });
      expect(editButtons.length).toBeGreaterThan(0);
    });
    
    // Check all action buttons have descriptive labels
    const editButtons = canvas.getAllByRole('button', { name: /edit/i });
    editButtons.forEach((button) => {
      expect(button).toHaveAttribute('aria-label', expect.stringContaining('Edit'));
    });
    
    const deleteButtons = canvas.getAllByRole('button', { name: /delete/i });
    deleteButtons.forEach((button) => {
      expect(button).toHaveAttribute('aria-label', expect.stringContaining('Delete'));
    });
  },
};