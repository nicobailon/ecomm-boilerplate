import type { Meta, StoryObj } from '@storybook/react-vite';
import { TRPCErrorBoundary } from './TRPCErrorBoundary';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { trpc } from '@/lib/trpc';
import { createTRPCClient } from '@/lib/trpc-client';
import { within, userEvent, expect, waitFor } from '@storybook/test';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { AlertCircle, RefreshCw, WifiOff, Clock, ServerCrash, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from 'sonner';

// Component that throws errors on demand
const ErrorThrowingComponent = ({ 
  errorType, 
  shouldError 
}: { 
  errorType: 'network' | 'server' | 'timeout' | 'auth' | 'none';
  shouldError: boolean;
}) => {
  useEffect(() => {
    if (shouldError) {
      switch (errorType) {
        case 'network':
          throw new Error('Failed to fetch - Network error');
        case 'server':
          throw new Error('Internal Server Error (500)');
        case 'timeout':
          throw new Error('Request timeout after 30000ms');
        case 'auth':
          throw new Error('Unauthorized - Invalid token');
        default:
          break;
      }
    }
  }, [shouldError, errorType]);

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-2">Component Working Normally</h3>
      <p className="text-muted-foreground">
        This component is functioning without errors.
      </p>
    </Card>
  );
};

// Custom fallback component
const CustomErrorFallback = ({ 
  error, 
  retry 
}: { 
  error: Error | null; 
  retry?: () => void;
}) => {
  const getErrorIcon = () => {
    if (!error) return <AlertCircle className="w-12 h-12" />;
    
    const message = error.message.toLowerCase();
    if (message.includes('network')) return <WifiOff className="w-12 h-12" />;
    if (message.includes('timeout')) return <Clock className="w-12 h-12" />;
    if (message.includes('server')) return <ServerCrash className="w-12 h-12" />;
    if (message.includes('auth') || message.includes('unauthorized')) return <ShieldAlert className="w-12 h-12" />;
    
    return <AlertCircle className="w-12 h-12" />;
  };

  const getErrorTitle = () => {
    if (!error) return 'Something went wrong';
    
    const message = error.message.toLowerCase();
    if (message.includes('network')) return 'Network Connection Error';
    if (message.includes('timeout')) return 'Request Timeout';
    if (message.includes('server')) return 'Server Error';
    if (message.includes('auth') || message.includes('unauthorized')) return 'Authentication Error';
    
    return 'Application Error';
  };

  const getErrorDescription = () => {
    if (!error) return 'An unexpected error occurred. Please try again.';
    
    const message = error.message.toLowerCase();
    if (message.includes('network')) {
      return 'Unable to connect to the server. Please check your internet connection and try again.';
    }
    if (message.includes('timeout')) {
      return 'The request took too long to complete. The server might be busy or your connection might be slow.';
    }
    if (message.includes('server')) {
      return 'The server encountered an error. Our team has been notified and is working on a fix.';
    }
    if (message.includes('auth') || message.includes('unauthorized')) {
      return 'Your session has expired or you don\'t have permission to access this resource. Please log in again.';
    }
    
    return error.message;
  };

  return (
    <Card className="p-8 text-center max-w-md mx-auto">
      <div className="flex justify-center mb-4 text-destructive">
        {getErrorIcon()}
      </div>
      
      <h3 className="text-xl font-semibold mb-2">{getErrorTitle()}</h3>
      <p className="text-muted-foreground mb-6">{getErrorDescription()}</p>
      
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {retry && (
          <Button onClick={retry} variant="default">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        )}
        <Button variant="outline" onClick={() => window.location.href = '/'}>
          Go Home
        </Button>
      </div>
      
      {process.env.NODE_ENV === 'development' && error && (
        <details className="mt-6 text-left">
          <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
            Error Details (Development Only)
          </summary>
          <pre className="mt-2 p-4 bg-muted rounded text-xs overflow-auto">
            {error.stack || error.message}
          </pre>
        </details>
      )}
    </Card>
  );
};

// Demo component with controlled errors
const ErrorBoundaryDemo = ({ 
  errorType = 'none',
  customFallback 
}: { 
  errorType?: 'network' | 'server' | 'timeout' | 'auth' | 'none';
  customFallback?: boolean;
}) => {
  const [shouldError, setShouldError] = useState(false);
  const [key, setKey] = useState(0);

  const retry = () => {
    setShouldError(false);
    setKey(k => k + 1);
    toast.success('Component reset successfully');
  };

  const fallback = customFallback ? (
    <CustomErrorFallback 
      error={new Error(errorType === 'none' ? 'Unknown error' : `${errorType} error`)} 
      retry={retry} 
    />
  ) : undefined;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          onClick={() => setShouldError(true)}
          variant="destructive"
          disabled={shouldError}
        >
          Trigger {errorType} Error
        </Button>
        <Button
          onClick={retry}
          variant="outline"
          disabled={!shouldError}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Reset
        </Button>
      </div>
      
      <TRPCErrorBoundary key={key} fallback={fallback}>
        <ErrorThrowingComponent errorType={errorType} shouldError={shouldError} />
      </TRPCErrorBoundary>
      
      <Toaster position="top-right" />
    </div>
  );
};

// Real tRPC integration demo
const TRPCIntegrationDemo = () => {
  const [shouldFail, setShouldFail] = useState(false);
  
  // This would be a real tRPC query in production
  const MockComponent = () => {
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => {
      const fetchData = async () => {
        setIsLoading(true);
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (shouldFail) {
          throw new Error('tRPC: Failed to fetch products');
        }
        
        setData({
          products: [
            { id: 1, name: 'Product 1', price: 99.99 },
            { id: 2, name: 'Product 2', price: 149.99 },
          ]
        });
        setIsLoading(false);
      };
      
      fetchData().catch(() => {
        setIsLoading(false);
        throw new Error('tRPC: Network request failed');
      });
    }, []);
    
    if (isLoading) {
      return (
        <Card className="p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </Card>
      );
    }
    
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Products</h3>
        <div className="space-y-2">
          {data?.products.map((product: any) => (
            <div key={product.id} className="flex justify-between">
              <span>{product.name}</span>
              <span className="font-semibold">${product.price}</span>
            </div>
          ))}
        </div>
      </Card>
    );
  };
  
  return (
    <div className="space-y-4">
      <Card className="p-4 bg-info/10 border-info/20">
        <p className="text-sm">
          This demo simulates real tRPC API errors. Toggle the switch to make API calls fail.
        </p>
      </Card>
      
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={shouldFail}
            onChange={(e) => setShouldFail(e.target.checked)}
            className="w-4 h-4"
          />
          <span>Simulate API Failure</span>
        </label>
      </div>
      
      <TRPCErrorBoundary
        fallback={
          <CustomErrorFallback 
            error={new Error('Unable to load products')} 
            retry={() => window.location.reload()}
          />
        }
      >
        <MockComponent />
      </TRPCErrorBoundary>
    </div>
  );
};

const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const meta = {
  title: 'UI/TRPCErrorBoundary',
  component: TRPCErrorBoundary,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => {
      const queryClient = createQueryClient();
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <Story />
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
} satisfies Meta<typeof TRPCErrorBoundary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <Card className="p-6">
        <h3 className="text-lg font-semibold">Protected Component</h3>
        <p className="text-muted-foreground">
          This component is wrapped in an error boundary.
        </p>
      </Card>
    ),
  },
};

export const WithError: Story = {
  args: {
    children: <ErrorThrowingComponent errorType="network" shouldError={true} />,
  },
};

export const WithCustomFallback: Story = {
  args: {
    children: <ErrorThrowingComponent errorType="server" shouldError={true} />,
    fallback: <CustomErrorFallback error={new Error('Server error')} />,
  },
};

export const NetworkError: Story = {
  args: {
    children: <div>Component</div>,
  },
  decorators: [
    () => <ErrorBoundaryDemo errorType="network" customFallback={true} />,
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Trigger error
    const triggerButton = canvas.getByRole('button', { name: /trigger network error/i });
    await userEvent.click(triggerButton);
    
    // Should show network error UI
    await waitFor(() => {
      expect(canvas.getByText('Network Connection Error')).toBeInTheDocument();
      expect(canvas.getByText(/check your internet connection/i)).toBeInTheDocument();
    });
  },
};

export const ServerError: Story = {
  args: {
    children: <div>Component</div>,
  },
  decorators: [
    () => <ErrorBoundaryDemo errorType="server" customFallback={true} />,
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Trigger error
    const triggerButton = canvas.getByRole('button', { name: /trigger server error/i });
    await userEvent.click(triggerButton);
    
    // Should show server error UI
    await waitFor(() => {
      expect(canvas.getByText('Server Error')).toBeInTheDocument();
      expect(canvas.getByText(/server encountered an error/i)).toBeInTheDocument();
    });
  },
};

export const TimeoutError: Story = {
  args: {
    children: <div>Component</div>,
  },
  decorators: [
    () => <ErrorBoundaryDemo errorType="timeout" customFallback={true} />,
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Trigger error
    const triggerButton = canvas.getByRole('button', { name: /trigger timeout error/i });
    await userEvent.click(triggerButton);
    
    // Should show timeout error UI
    await waitFor(() => {
      expect(canvas.getByText('Request Timeout')).toBeInTheDocument();
      expect(canvas.getByText(/request took too long/i)).toBeInTheDocument();
    });
  },
};

export const AuthError: Story = {
  args: {
    children: <div>Component</div>,
  },
  decorators: [
    () => <ErrorBoundaryDemo errorType="auth" customFallback={true} />,
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Trigger error
    const triggerButton = canvas.getByRole('button', { name: /trigger auth error/i });
    await userEvent.click(triggerButton);
    
    // Should show auth error UI
    await waitFor(() => {
      expect(canvas.getByText('Authentication Error')).toBeInTheDocument();
      expect(canvas.getByText(/session has expired/i)).toBeInTheDocument();
    });
  },
};

export const WithRetry: Story = {
  args: {
    children: <div>Component</div>,
  },
  decorators: [
    () => <ErrorBoundaryDemo errorType="network" customFallback={true} />,
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Trigger error
    const triggerButton = canvas.getByRole('button', { name: /trigger network error/i });
    await userEvent.click(triggerButton);
    
    // Wait for error UI
    await waitFor(() => {
      expect(canvas.getByText('Network Connection Error')).toBeInTheDocument();
    });
    
    // Click retry
    const retryButton = canvas.getByRole('button', { name: /try again/i });
    await userEvent.click(retryButton);
    
    // Should reset
    await waitFor(() => {
      expect(canvas.getByText('Component Working Normally')).toBeInTheDocument();
    });
  },
};

export const RealTRPCIntegration: Story = {
  args: {
    children: <div>Component</div>,
  },
  decorators: [
    () => <TRPCIntegrationDemo />,
  ],
};

export const MultipleBoundaries: Story = {
  args: {
    children: <div>Component</div>,
  },
  decorators: [
    () => {
      const [error1, setError1] = useState(false);
      const [error2, setError2] = useState(false);
      
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold">Multiple Error Boundaries</h3>
          <p className="text-sm text-muted-foreground">
            Each component has its own error boundary, preventing cascading failures
          </p>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setError1(true)}
                className="mb-2"
              >
                Break Component 1
              </Button>
              <TRPCErrorBoundary
                fallback={
                  <Card className="p-4 bg-destructive/10 border-destructive/20">
                    <p className="text-sm">Component 1 Error</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setError1(false)}
                      className="mt-2"
                    >
                      Fix
                    </Button>
                  </Card>
                }
              >
                {error1 ? (
                  <ErrorThrowingComponent errorType="network" shouldError={true} />
                ) : (
                  <Card className="p-4 bg-green-50 border-green-200">
                    <p className="text-sm">Component 1 Working</p>
                  </Card>
                )}
              </TRPCErrorBoundary>
            </div>
            
            <div>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setError2(true)}
                className="mb-2"
              >
                Break Component 2
              </Button>
              <TRPCErrorBoundary
                fallback={
                  <Card className="p-4 bg-destructive/10 border-destructive/20">
                    <p className="text-sm">Component 2 Error</p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setError2(false)}
                      className="mt-2"
                    >
                      Fix
                    </Button>
                  </Card>
                }
              >
                {error2 ? (
                  <ErrorThrowingComponent errorType="server" shouldError={true} />
                ) : (
                  <Card className="p-4 bg-green-50 border-green-200">
                    <p className="text-sm">Component 2 Working</p>
                  </Card>
                )}
              </TRPCErrorBoundary>
            </div>
          </div>
        </div>
      );
    },
  ],
};

export const LoadingWithError: Story = {
  args: {
    children: <div>Component</div>,
  },
  decorators: [
    () => {
      const [isLoading, setIsLoading] = useState(true);
      const [hasError, setHasError] = useState(false);
      
      const simulateLoad = async () => {
        setIsLoading(true);
        setHasError(false);
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 50% chance of error
        if (Math.random() > 0.5) {
          setHasError(true);
        }
        setIsLoading(false);
      };
      
      useEffect(() => {
        simulateLoad();
      }, []);
      
      return (
        <div className="space-y-4">
          <Button onClick={simulateLoad}>
            Reload (50% chance of error)
          </Button>
          
          <TRPCErrorBoundary
            fallback={
              <CustomErrorFallback 
                error={new Error('Failed to load data')} 
                retry={simulateLoad}
              />
            }
          >
            {isLoading ? (
              <Card className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span>Loading data...</span>
                </div>
              </Card>
            ) : hasError ? (
              <ErrorThrowingComponent errorType="network" shouldError={true} />
            ) : (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-2">Data Loaded Successfully</h3>
                <p className="text-muted-foreground">
                  The component loaded without errors this time!
                </p>
              </Card>
            )}
          </TRPCErrorBoundary>
        </div>
      );
    },
  ],
};

export const MobileView: Story = {
  args: {
    children: <div />,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  decorators: [
    () => <ErrorBoundaryDemo errorType="network" customFallback={true} />,
  ],
};

export const DarkMode: Story = {
  args: {
    children: <div />,
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
  decorators: [
    () => (
      <div className="dark">
        <ErrorBoundaryDemo errorType="server" customFallback={true} />
      </div>
    ),
  ],
};