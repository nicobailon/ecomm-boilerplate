import type { Meta, StoryObj } from '@storybook/react-vite';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import GiftCouponCard from './GiftCouponCard';
import { useUnifiedCart, useApplyCoupon, useRemoveCoupon } from '@/hooks/cart/useUnifiedCart';
import { vi } from 'vitest';
import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { createTRPCClient } from '@/lib/trpc-client';
import { withEndpointOverrides, withNetworkCondition } from '@/mocks/story-helpers';
import { trpcMutation } from '@/mocks/utils/trpc-mock';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Toaster, toast } from 'sonner';
import { AlertCircle, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { within, userEvent, expect } from '@storybook/test';

// Mock the hooks
vi.mock('@/hooks/cart/useUnifiedCart');

const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const meta = {
  title: 'Cart/GiftCouponCard',
  component: GiftCouponCard,
  decorators: [
    (Story) => {
      const queryClient = createQueryClient();
      return (
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <div className="max-w-md mx-auto p-4">
              <Story />
            </div>
          </BrowserRouter>
        </QueryClientProvider>
      );
    },
  ],
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof GiftCouponCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockApplyCoupon = {
  mutate: vi.fn(),
  isPending: false,
  isSuccess: false,
};

const mockRemoveCoupon = {
  mutate: vi.fn(),
  isPending: false,
};

export const Default: Story = {
  decorators: [
    (Story) => {
      (useUnifiedCart as any).mockReturnValue({
        data: { appliedCoupon: null },
        source: 'user',
      });
      (useApplyCoupon as any).mockReturnValue(mockApplyCoupon);
      (useRemoveCoupon as any).mockReturnValue(mockRemoveCoupon);
      return <Story />;
    },
  ],
};

export const GuestUser: Story = {
  decorators: [
    (Story) => {
      (useUnifiedCart as any).mockReturnValue({
        data: { appliedCoupon: null },
        source: 'guest',
      });
      (useApplyCoupon as any).mockReturnValue(mockApplyCoupon);
      (useRemoveCoupon as any).mockReturnValue(mockRemoveCoupon);
      return <Story />;
    },
  ],
};

export const ActiveCoupon: Story = {
  decorators: [
    (Story) => {
      (useUnifiedCart as any).mockReturnValue({
        data: {
          appliedCoupon: {
            code: 'SUMMER20',
            discountPercentage: 20,
          },
        },
        source: 'user',
      });
      (useApplyCoupon as any).mockReturnValue(mockApplyCoupon);
      (useRemoveCoupon as any).mockReturnValue(mockRemoveCoupon);
      return <Story />;
    },
  ],
};

export const ApplyingCoupon: Story = {
  decorators: [
    (Story) => {
      (useUnifiedCart as any).mockReturnValue({
        data: { appliedCoupon: null },
        source: 'user',
      });
      (useApplyCoupon as any).mockReturnValue({
        ...mockApplyCoupon,
        isPending: true,
      });
      (useRemoveCoupon as any).mockReturnValue(mockRemoveCoupon);
      return <Story />;
    },
  ],
};

export const RemovingCoupon: Story = {
  decorators: [
    (Story) => {
      (useUnifiedCart as any).mockReturnValue({
        data: {
          appliedCoupon: {
            code: 'WINTER10',
            discountPercentage: 10,
          },
        },
        source: 'user',
      });
      (useApplyCoupon as any).mockReturnValue(mockApplyCoupon);
      (useRemoveCoupon as any).mockReturnValue({
        ...mockRemoveCoupon,
        isPending: true,
      });
      return <Story />;
    },
  ],
};

export const LargeCoupon: Story = {
  decorators: [
    (Story) => {
      (useUnifiedCart as any).mockReturnValue({
        data: {
          appliedCoupon: {
            code: 'BLACKFRIDAY50',
            discountPercentage: 50,
          },
        },
        source: 'user',
      });
      (useApplyCoupon as any).mockReturnValue(mockApplyCoupon);
      (useRemoveCoupon as any).mockReturnValue(mockRemoveCoupon);
      return <Story />;
    },
  ],
};

export const ExpiredCoupon: Story = {
  decorators: [
    (Story) => {
      (useUnifiedCart as any).mockReturnValue({
        data: {
          appliedCoupon: {
            code: 'EXPIRED2023',
            discountPercentage: 15,
            expired: true,
          },
        },
        source: 'user',
      });
      (useApplyCoupon as any).mockReturnValue(mockApplyCoupon);
      (useRemoveCoupon as any).mockReturnValue(mockRemoveCoupon);
      return <Story />;
    },
  ],
};

export const InteractiveApplyRemove: Story = {
  render: () => {
    const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
    const [isPending, setIsPending] = useState(false);

    (useUnifiedCart as any).mockReturnValue({
      data: { appliedCoupon },
      source: 'user',
    });

    (useApplyCoupon as any).mockReturnValue({
      mutate: (code: string) => {
        setIsPending(true);
        setTimeout(() => {
          setAppliedCoupon({
            code: code.toUpperCase(),
            discountPercentage: Math.floor(Math.random() * 30) + 10,
          });
          setIsPending(false);
        }, 1000);
      },
      isPending,
      isSuccess: !!appliedCoupon,
    });

    (useRemoveCoupon as any).mockReturnValue({
      mutate: () => {
        setIsPending(true);
        setTimeout(() => {
          setAppliedCoupon(null);
          setIsPending(false);
        }, 1000);
      },
      isPending,
    });

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold mb-4">Interactive Coupon Application</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Try entering codes like "SAVE20", "DISCOUNT", or any text
        </p>
        <GiftCouponCard />
      </div>
    );
  },
};

export const MobileView: Story = {
  decorators: [
    (Story) => {
      (useUnifiedCart as any).mockReturnValue({
        data: { appliedCoupon: null },
        source: 'user',
      });
      (useApplyCoupon as any).mockReturnValue(mockApplyCoupon);
      (useRemoveCoupon as any).mockReturnValue(mockRemoveCoupon);
      return <Story />;
    },
  ],
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const TabletView: Story = {
  decorators: [
    (Story) => {
      (useUnifiedCart as any).mockReturnValue({
        data: {
          appliedCoupon: {
            code: 'TABLET15',
            discountPercentage: 15,
          },
        },
        source: 'user',
      });
      (useApplyCoupon as any).mockReturnValue(mockApplyCoupon);
      (useRemoveCoupon as any).mockReturnValue(mockRemoveCoupon);
      return <Story />;
    },
  ],
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};

export const AllStates: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">Coupon Card States</h3>
        <div className="grid gap-6">
          <div>
            <h4 className="text-sm font-medium mb-2">Available to Apply</h4>
            <div className="border rounded-lg p-4">
              <GiftCouponCard />
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-2">Applied Coupon</h4>
            <div className="border rounded-lg p-4">
              <div className="opacity-75">
                <GiftCouponCard />
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium mb-2">Guest User</h4>
            <div className="border rounded-lg p-4">
              <div className="opacity-50">
                <GiftCouponCard />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
  decorators: [
    (Story) => {
      (useUnifiedCart as any).mockReturnValue({
        data: { appliedCoupon: null },
        source: 'user',
      });
      (useApplyCoupon as any).mockReturnValue(mockApplyCoupon);
      (useRemoveCoupon as any).mockReturnValue(mockRemoveCoupon);
      return <Story />;
    },
  ],
};

export const AccessibilityFeatures: Story = {
  decorators: [
    (Story) => {
      (useUnifiedCart as any).mockReturnValue({
        data: { appliedCoupon: null },
        source: 'user',
      });
      (useApplyCoupon as any).mockReturnValue(mockApplyCoupon);
      (useRemoveCoupon as any).mockReturnValue(mockRemoveCoupon);
      return <Story />;
    },
  ],
  render: () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Accessibility Features</h3>
      <div className="text-sm text-muted-foreground space-y-2 mb-4">
        <p>• Proper label association with input field</p>
        <p>• Disabled states for buttons during operations</p>
        <p>• Clear focus indicators</p>
        <p>• Descriptive button text</p>
      </div>
      <GiftCouponCard />
    </div>
  ),
  parameters: {
    a11y: {
      config: {
        rules: [
          { id: 'color-contrast', enabled: true },
          { id: 'label', enabled: true },
          { id: 'button-name', enabled: true },
        ],
      },
    },
  },
};

// Error State Stories
export const InvalidCouponError: Story = {
  decorators: [
    (Story) => {
      const [error, setError] = useState<string | null>(null);
      const [isPending, setIsPending] = useState(false);
      
      (useUnifiedCart as any).mockReturnValue({
        data: { appliedCoupon: null },
        source: 'user',
      });
      
      (useApplyCoupon as any).mockReturnValue({
        mutate: () => {
          setIsPending(true);
          setError(null);
          setTimeout(() => {
            setError('Invalid coupon code');
            setIsPending(false);
            toast.error('Invalid coupon code');
          }, 1000);
        },
        isPending,
        isSuccess: false,
        error,
      });
      
      (useRemoveCoupon as any).mockReturnValue(mockRemoveCoupon);
      
      return (
        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              This story simulates an invalid coupon code error
            </AlertDescription>
          </Alert>
          <Story />
          <Toaster position="top-right" />
        </div>
      );
    },
  ],
};

export const ExpiredCouponError: Story = {
  decorators: [
    (Story) => {
      const [error, setError] = useState<string | null>(null);
      const [isPending, setIsPending] = useState(false);
      
      (useUnifiedCart as any).mockReturnValue({
        data: { appliedCoupon: null },
        source: 'user',
      });
      
      (useApplyCoupon as any).mockReturnValue({
        mutate: () => {
          setIsPending(true);
          setError(null);
          setTimeout(() => {
            setError('This coupon has expired');
            setIsPending(false);
            toast.error('This coupon has expired');
          }, 1000);
        },
        isPending,
        isSuccess: false,
        error,
      });
      
      (useRemoveCoupon as any).mockReturnValue(mockRemoveCoupon);
      
      return (
        <div className="space-y-4">
          <Card className="p-4 border-orange-200 bg-orange-50">
            <p className="text-sm">Try applying any coupon code to see expiration error</p>
          </Card>
          <Story />
          <Toaster position="top-right" />
        </div>
      );
    },
  ],
};

export const NetworkError: Story = {
  decorators: [
    (Story) => {
      const [error, setError] = useState<string | null>(null);
      const [isPending, setIsPending] = useState(false);
      const [isOffline, setIsOffline] = useState(true);
      
      (useUnifiedCart as any).mockReturnValue({
        data: { appliedCoupon: null },
        source: 'user',
      });
      
      (useApplyCoupon as any).mockReturnValue({
        mutate: () => {
          if (isOffline) {
            setError('Network error: Unable to apply coupon');
            toast.error('Network error: Unable to apply coupon');
            return;
          }
          setIsPending(true);
          setTimeout(() => {
            setIsPending(false);
            toast.success('Coupon applied successfully!');
          }, 1000);
        },
        isPending,
        isSuccess: false,
        error,
      });
      
      (useRemoveCoupon as any).mockReturnValue(mockRemoveCoupon);
      
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
                onClick={() => {
                  setIsOffline(!isOffline);
                  setError(null);
                }}
              >
                Toggle Connection
              </Button>
            </div>
          </Card>
          <Story />
          <Toaster position="top-right" />
        </div>
      );
    },
  ],
  ...withNetworkCondition('offline'),
};

export const MinimumOrderError: Story = {
  decorators: [
    (Story) => {
      const [error, setError] = useState<string | null>(null);
      const [isPending, setIsPending] = useState(false);
      
      (useUnifiedCart as any).mockReturnValue({
        data: { appliedCoupon: null },
        source: 'user',
      });
      
      (useApplyCoupon as any).mockReturnValue({
        mutate: () => {
          setIsPending(true);
          setError(null);
          setTimeout(() => {
            setError('Minimum order value of $50 required for this coupon');
            setIsPending(false);
            toast.error('Minimum order value of $50 required for this coupon');
          }, 1000);
        },
        isPending,
        isSuccess: false,
        error,
      });
      
      (useRemoveCoupon as any).mockReturnValue(mockRemoveCoupon);
      
      return (
        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Current cart total: $35.99 (Below minimum for coupon)
            </AlertDescription>
          </Alert>
          <Story />
          <Toaster position="top-right" />
        </div>
      );
    },
  ],
};

export const UsageLimitError: Story = {
  decorators: [
    (Story) => {
      const [error, setError] = useState<string | null>(null);
      const [isPending, setIsPending] = useState(false);
      
      (useUnifiedCart as any).mockReturnValue({
        data: { appliedCoupon: null },
        source: 'user',
      });
      
      (useApplyCoupon as any).mockReturnValue({
        mutate: () => {
          setIsPending(true);
          setError(null);
          setTimeout(() => {
            setError('You have already used this coupon');
            setIsPending(false);
            toast.error('You have already used this coupon');
          }, 1000);
        },
        isPending,
        isSuccess: false,
        error,
      });
      
      (useRemoveCoupon as any).mockReturnValue(mockRemoveCoupon);
      
      return (
        <div className="space-y-4">
          <Badge variant="secondary" className="mb-2">One-time use coupon</Badge>
          <Story />
          <Toaster position="top-right" />
        </div>
      );
    },
  ],
};

export const ErrorRecovery: Story = {
  render: () => {
    const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
    const [isPending, setIsPending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [attemptCount, setAttemptCount] = useState(0);
    
    (useUnifiedCart as any).mockReturnValue({
      data: { appliedCoupon },
      source: 'user',
    });
    
    (useApplyCoupon as any).mockReturnValue({
      mutate: (code: string) => {
        setIsPending(true);
        setError(null);
        setAttemptCount(prev => prev + 1);
        
        setTimeout(() => {
          // Fail first 2 attempts, succeed on 3rd
          if (attemptCount < 2) {
            setError('Service temporarily unavailable. Please try again.');
            toast.error('Service temporarily unavailable. Please try again.');
          } else {
            setAppliedCoupon({
              code: code.toUpperCase(),
              discountPercentage: 20,
            });
            toast.success('Coupon applied successfully after retry!');
            setAttemptCount(0);
          }
          setIsPending(false);
        }, 1500);
      },
      isPending,
      isSuccess: !!appliedCoupon && !error,
      error,
    });
    
    (useRemoveCoupon as any).mockReturnValue({
      mutate: () => {
        setAppliedCoupon(null);
        setError(null);
      },
      isPending: false,
    });
    
    return (
      <div className="space-y-4">
        <Card className="p-4">
          <h4 className="font-medium mb-2">Error Recovery Demo</h4>
          <p className="text-sm text-muted-foreground mb-2">
            The first 2 attempts will fail, the 3rd will succeed
          </p>
          <div className="flex items-center gap-2">
            <Badge variant="outline">Attempts: {attemptCount}</Badge>
            {error && <Badge variant="destructive">Error</Badge>}
            {appliedCoupon && <Badge variant="default">Success</Badge>}
          </div>
        </Card>
        <GiftCouponCard />
        <Toaster position="top-right" />
      </div>
    );
  },
};

export const ServerValidationErrors: Story = {
  render: () => {
    const [error, setError] = useState<string | null>(null);
    const [isPending, setIsPending] = useState(false);
    const errorMessages = [
      'Coupon code cannot contain special characters',
      'Coupon code must be at least 4 characters',
      'This coupon is only valid for new customers',
      'This coupon is restricted to specific categories',
      'Coupon not valid in your region',
    ];
    
    (useUnifiedCart as any).mockReturnValue({
      data: { appliedCoupon: null },
      source: 'user',
    });
    
    (useApplyCoupon as any).mockReturnValue({
      mutate: (_code: string) => {
        setIsPending(true);
        setError(null);
        
        setTimeout(() => {
          const randomError = errorMessages[Math.floor(Math.random() * errorMessages.length)];
          setError(randomError);
          toast.error(randomError);
          setIsPending(false);
        }, 800);
      },
      isPending,
      isSuccess: false,
      error,
    });
    
    (useRemoveCoupon as any).mockReturnValue(mockRemoveCoupon);
    
    return (
      <div className="space-y-4">
        <Card className="p-4">
          <h4 className="font-medium mb-2">Server Validation Errors</h4>
          <p className="text-sm text-muted-foreground">
            Each attempt shows a different validation error
          </p>
        </Card>
        <GiftCouponCard />
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Toaster position="top-right" />
      </div>
    );
  },
};

export const RateLimitError: Story = {
  decorators: [
    (Story) => {
      const [error, setError] = useState<string | null>(null);
      const [isPending, setIsPending] = useState(false);
      const [remainingTime, setRemainingTime] = useState(0);
      
      useEffect(() => {
        if (remainingTime > 0) {
          const timer = setTimeout(() => {
            setRemainingTime(prev => prev - 1);
          }, 1000);
          return () => clearTimeout(timer);
        }
      }, [remainingTime]);
      
      (useUnifiedCart as any).mockReturnValue({
        data: { appliedCoupon: null },
        source: 'user',
      });
      
      (useApplyCoupon as any).mockReturnValue({
        mutate: () => {
          if (remainingTime > 0) {
            toast.error(`Please wait ${remainingTime} seconds before trying again`);
            return;
          }
          
          setIsPending(true);
          setTimeout(() => {
            setError('Too many attempts. Please try again later.');
            setRemainingTime(10); // 10 second cooldown
            setIsPending(false);
            toast.error('Too many attempts. Please try again later.');
          }, 500);
        },
        isPending,
        isSuccess: false,
        error,
      });
      
      (useRemoveCoupon as any).mockReturnValue(mockRemoveCoupon);
      
      return (
        <div className="space-y-4">
          <Card className="p-4 border-red-200 bg-red-50">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Rate Limit Demo</span>
              {remainingTime > 0 && (
                <Badge variant="destructive">
                  <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                  Wait {remainingTime}s
                </Badge>
              )}
            </div>
          </Card>
          <Story />
          <Toaster position="top-right" />
        </div>
      );
    },
  ],
};

export const MSWIntegration: Story = {
  decorators: [
    (Story) => {
      const queryClient = createQueryClient();
      
      // Setup real hooks with MSW
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
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
            </BrowserRouter>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
  ...withEndpointOverrides([
    trpcMutation('cart.applyCoupon', async ({ code }: any) => {
      // Simulate various error conditions
      if (code === 'INVALID') {
        throw new Error('Invalid coupon code');
      }
      if (code === 'EXPIRED') {
        throw new Error('This coupon has expired');
      }
      if (code === 'MINIMUM') {
        throw new Error('Minimum order value not met');
      }
      
      // Success case
      return {
        appliedCoupon: {
          code: code.toUpperCase(),
          discountPercentage: 15,
        },
      };
    }),
  ]),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Try invalid coupon
    const input = canvas.getByPlaceholderText(/enter.*code/i);
    await userEvent.type(input, 'INVALID');
    
    const applyButton = canvas.getByRole('button', { name: /apply/i });
    await userEvent.click(applyButton);
    
    // Wait for error message
    await expect(canvas.getByText(/invalid coupon code/i)).toBeInTheDocument();
  },
};