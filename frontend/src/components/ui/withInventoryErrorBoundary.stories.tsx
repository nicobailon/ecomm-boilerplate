import type { Meta, StoryObj } from '@storybook/react-vite';
import { withInventoryErrorBoundary } from './withInventoryErrorBoundary';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { trpc } from '@/lib/trpc';
import { createTRPCClient } from '@/lib/trpc-client';
import { useState, useEffect, forwardRef, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert';
import { AlertCircle, RefreshCw, Wifi, WifiOff, Database, Calculator, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from 'sonner';

// Component that can throw inventory errors
const InventoryComponent = forwardRef<
  HTMLDivElement,
  { 
    errorType?: 'sync' | 'database' | 'calculation' | 'websocket' | 'none';
    shouldError?: boolean;
    showStock?: boolean;
  }
>(({ errorType = 'none', shouldError = false, showStock = true }, ref) => {
  const [stock, setStock] = useState(10);
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    if (shouldError && errorType !== 'none') {
      switch (errorType) {
        case 'sync':
          throw new Error('Inventory sync failed: Unable to retrieve latest stock levels');
        case 'database':
          throw new Error('Database connection failed: Inventory service unavailable');
        case 'calculation':
          throw new Error('Inventory calculation error: Invalid stock computation');
        case 'websocket':
          setIsConnected(false);
          throw new Error('WebSocket disconnected: Real-time inventory updates unavailable');
        default:
          break;
      }
    }
  }, [shouldError, errorType]);

  return (
    <Card ref={ref} className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Product Inventory</h3>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <>
                <Wifi className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600">Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-600">Disconnected</span>
              </>
            )}
          </div>
        </div>
        
        {showStock && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Current Stock</p>
              <p className="text-2xl font-bold">{stock}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="text-lg font-medium text-green-600">
                {stock > 5 ? 'In Stock' : stock > 0 ? 'Low Stock' : 'Out of Stock'}
              </p>
            </div>
          </div>
        )}
        
        <Button
          onClick={() => setStock(prev => Math.max(0, prev - 1))}
          disabled={stock === 0}
          className="w-full"
        >
          Reduce Stock (-1)
        </Button>
      </div>
    </Card>
  );
});

InventoryComponent.displayName = 'InventoryComponent';

// Wrapped component with error boundary
const WrappedInventoryComponent = withInventoryErrorBoundary(InventoryComponent);

// Custom error fallback
const CustomInventoryFallback = ({ 
  error, 
  reset, 
}: { 
  error: Error; 
  reset: () => void;
}) => {
  const getErrorIcon = () => {
    const message = error.message.toLowerCase();
    if (message.includes('websocket')) return <WifiOff className="w-6 h-6" />;
    if (message.includes('database')) return <Database className="w-6 h-6" />;
    if (message.includes('calculation')) return <Calculator className="w-6 h-6" />;
    return <AlertCircle className="w-6 h-6" />;
  };

  return (
    <Alert variant="destructive" className="relative">
      <div className="absolute top-4 right-4">
        {getErrorIcon()}
      </div>
      <AlertTitle className="mb-2">Inventory Error</AlertTitle>
      <AlertDescription className="space-y-3">
        <p>{error.message}</p>
        <Button
          size="sm"
          variant="outline"
          onClick={reset}
          className="mt-2"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </AlertDescription>
    </Alert>
  );
};

// Component with custom fallback
const WrappedWithCustomFallback = withInventoryErrorBoundary(
  InventoryComponent,
  (error, reset) => <CustomInventoryFallback error={error} reset={reset} />,
);

// Multiple wrapped components demo
const MultipleComponentsDemo = () => {
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  
  const components = [
    { id: 'comp1', name: 'Inventory Monitor', errorType: 'sync' as const },
    { id: 'comp2', name: 'Stock Calculator', errorType: 'calculation' as const },
    { id: 'comp3', name: 'Database Sync', errorType: 'database' as const },
  ];
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Multiple Components with Error Boundaries</h3>
      <p className="text-sm text-muted-foreground">
        Each component has its own error boundary to prevent cascading failures
      </p>
      
      <div className="grid grid-cols-3 gap-4">
        {components.map((comp) => {
          const Component = withInventoryErrorBoundary(() => (
            <InventoryComponent
              errorType={comp.errorType}
              shouldError={errors[comp.id]}
              showStock={false}
            />
          ));
          
          return (
            <div key={comp.id} className="space-y-2">
              <h4 className="font-medium">{comp.name}</h4>
              <Component />
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setErrors(prev => ({ ...prev, [comp.id]: true }))}
                disabled={errors[comp.id]}
              >
                Trigger Error
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Nested error boundaries demo
const NestedBoundariesDemo = () => {
  const [innerError, setInnerError] = useState(false);
  const [outerError, setOuterError] = useState(false);
  
  // Inner component that might throw
  const InnerComponent = () => {
    if (innerError) {
      throw new Error('Inner component inventory error');
    }
    return (
      <Card className="p-4 bg-green-50 border-green-200">
        <p className="text-sm">Inner Component Working</p>
      </Card>
    );
  };
  
  // Wrap inner component
  const WrappedInner = withInventoryErrorBoundary(InnerComponent);
  
  // Outer component that contains wrapped inner
  const OuterComponent = () => {
    if (outerError) {
      throw new Error('Outer component inventory error');
    }
    return (
      <Card className="p-6 space-y-4">
        <h4 className="font-semibold">Outer Component</h4>
        <WrappedInner />
        <Button
          size="sm"
          variant="outline"
          onClick={() => setInnerError(true)}
        >
          Break Inner Component
        </Button>
      </Card>
    );
  };
  
  // Wrap outer component
  const WrappedOuter = withInventoryErrorBoundary(OuterComponent);
  
  return (
    <div className="space-y-4">
      <Alert>
        <AlertDescription>
          Nested error boundaries isolate failures at different component levels
        </AlertDescription>
      </Alert>
      
      <WrappedOuter />
      
      <div className="flex gap-2">
        <Button
          variant="destructive"
          onClick={() => setOuterError(true)}
        >
          Break Outer Component
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setInnerError(false);
            setOuterError(false);
          }}
        >
          Reset All
        </Button>
      </div>
    </div>
  );
};

// Error recovery demo
const ErrorRecoveryDemo = () => {
  const [errorCount, setErrorCount] = useState(0);
  const [shouldError, setShouldError] = useState(false);
  
  const RecoveryComponent = forwardRef<HTMLDivElement>((_, ref) => {
    useEffect(() => {
      if (shouldError && errorCount < 3) {
        throw new Error(`Inventory sync attempt ${errorCount + 1} failed`);
      }
    }, []);
    
    if (errorCount >= 3) {
      return (
        <Card ref={ref} className="p-6 bg-green-50 border-green-200">
          <div className="text-center">
            <Zap className="w-12 h-12 text-green-500 mx-auto mb-2" />
            <h4 className="font-semibold text-green-700">Recovery Successful!</h4>
            <p className="text-sm text-green-600 mt-1">
              Inventory sync recovered after {errorCount} attempts
            </p>
          </div>
        </Card>
      );
    }
    
    return (
      <Card ref={ref} className="p-6">
        <h4 className="font-semibold mb-2">Inventory Sync Status</h4>
        <p className="text-muted-foreground">Operating normally</p>
      </Card>
    );
  });
  
  RecoveryComponent.displayName = 'RecoveryComponent';
  
  const WrappedRecovery = withInventoryErrorBoundary(
    RecoveryComponent,
    (error, reset) => (
      <Alert variant="destructive">
        <AlertTitle>Sync Failed</AlertTitle>
        <AlertDescription className="space-y-3">
          <p>{error.message}</p>
          <p className="text-sm">Attempt {errorCount + 1} of 3</p>
          <Button
            size="sm"
            onClick={() => {
              setErrorCount(prev => prev + 1);
              reset();
            }}
          >
            Retry Sync
          </Button>
        </AlertDescription>
      </Alert>
    ),
  );
  
  return (
    <div className="space-y-4">
      <Alert>
        <AlertDescription>
          This demo shows error recovery with retry logic. The component will fail 3 times before succeeding.
        </AlertDescription>
      </Alert>
      
      <WrappedRecovery key={errorCount} />
      
      <Button
        onClick={() => {
          setShouldError(true);
          setErrorCount(0);
        }}
        disabled={shouldError && errorCount < 3}
      >
        Start Recovery Demo
      </Button>
      
      {shouldError && errorCount >= 3 && (
        <Button
          variant="outline"
          onClick={() => {
            setShouldError(false);
            setErrorCount(0);
          }}
        >
          Reset Demo
        </Button>
      )}
    </div>
  );
};

const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

// Dummy component for Storybook meta
const DummyComponent = () => <div>HOC Example</div>;

const meta = {
  title: 'UI/withInventoryErrorBoundary',
  component: DummyComponent,
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
            <Toaster position="top-right" />
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
} satisfies Meta<typeof withInventoryErrorBoundary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  decorators: [
    () => <WrappedInventoryComponent />,
  ],
};

export const WithError: Story = {
  decorators: [
    () => <WrappedInventoryComponent errorType="sync" shouldError={true} />,
  ],
};

export const CustomFallback: Story = {
  decorators: [
    () => <WrappedWithCustomFallback errorType="database" shouldError={true} />,
  ],
};

export const SyncError: Story = {
  decorators: [
    () => {
      const [shouldError, setShouldError] = useState(false);
      const [key, setKey] = useState(0);
      
      return (
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant="destructive"
              onClick={() => setShouldError(true)}
              disabled={shouldError}
            >
              Trigger Sync Error
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShouldError(false);
                setKey(prev => prev + 1);
              }}
              disabled={!shouldError}
            >
              Reset
            </Button>
          </div>
          
          <WrappedInventoryComponent 
            key={key}
            errorType="sync" 
            shouldError={shouldError} 
          />
        </div>
      );
    },
  ],
};

export const DatabaseError: Story = {
  decorators: [
    () => {
      const [shouldError, setShouldError] = useState(false);
      const [key, setKey] = useState(0);
      
      return (
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant="destructive"
              onClick={() => setShouldError(true)}
              disabled={shouldError}
            >
              Trigger Database Error
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShouldError(false);
                setKey(prev => prev + 1);
              }}
              disabled={!shouldError}
            >
              Reset
            </Button>
          </div>
          
          <WrappedWithCustomFallback 
            key={key}
            errorType="database" 
            shouldError={shouldError} 
          />
        </div>
      );
    },
  ],
};

export const CalculationError: Story = {
  decorators: [
    () => {
      const [shouldError, setShouldError] = useState(false);
      const [key, setKey] = useState(0);
      
      return (
        <div className="space-y-4">
          <Alert>
            <AlertDescription>
              Calculation errors occur when inventory math operations fail
            </AlertDescription>
          </Alert>
          
          <div className="flex gap-2">
            <Button
              variant="destructive"
              onClick={() => setShouldError(true)}
              disabled={shouldError}
            >
              Trigger Calculation Error
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShouldError(false);
                setKey(prev => prev + 1);
              }}
              disabled={!shouldError}
            >
              Reset
            </Button>
          </div>
          
          <WrappedWithCustomFallback 
            key={key}
            errorType="calculation" 
            shouldError={shouldError} 
          />
        </div>
      );
    },
  ],
};

export const WebSocketError: Story = {
  decorators: [
    () => {
      const [shouldError, setShouldError] = useState(false);
      const [key, setKey] = useState(0);
      
      return (
        <div className="space-y-4">
          <Alert>
            <AlertDescription>
              WebSocket errors affect real-time inventory updates
            </AlertDescription>
          </Alert>
          
          <div className="flex gap-2">
            <Button
              variant="destructive"
              onClick={() => setShouldError(true)}
              disabled={shouldError}
            >
              Disconnect WebSocket
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShouldError(false);
                setKey(prev => prev + 1);
                toast.success('WebSocket reconnected');
              }}
              disabled={!shouldError}
            >
              Reconnect
            </Button>
          </div>
          
          <WrappedWithCustomFallback 
            key={key}
            errorType="websocket" 
            shouldError={shouldError} 
          />
        </div>
      );
    },
  ],
};

export const MultipleComponents: Story = {
  decorators: [
    () => <MultipleComponentsDemo />,
  ],
};

export const NestedBoundaries: Story = {
  decorators: [
    () => <NestedBoundariesDemo />,
  ],
};

export const ErrorRecovery: Story = {
  decorators: [
    () => <ErrorRecoveryDemo />,
  ],
};

export const WithRef: Story = {
  decorators: [
    () => {
      const ref = useRef<HTMLDivElement>(null);
      const [borderColor, setBorderColor] = useState('border-gray-200');
      
      return (
        <div className="space-y-4">
          <Alert>
            <AlertDescription>
              The HOC properly forwards refs to the wrapped component
            </AlertDescription>
          </Alert>
          
          <div className="flex gap-2">
            <Button
              onClick={() => {
                if (ref.current) {
                  ref.current.style.transform = 'scale(1.05)';
                  setTimeout(() => {
                    if (ref.current) {
                      ref.current.style.transform = 'scale(1)';
                    }
                  }, 200);
                }
              }}
            >
              Animate via Ref
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setBorderColor(prev => 
                  prev === 'border-gray-200' ? 'border-blue-500' : 'border-gray-200',
                );
              }}
            >
              Toggle Border
            </Button>
          </div>
          
          <div className={`transition-all duration-200 ${borderColor} border-2 rounded-lg`}>
            <WrappedInventoryComponent ref={ref} />
          </div>
        </div>
      );
    },
  ],
};

export const LoadingWithError: Story = {
  decorators: [
    () => {
      const [isLoading, setIsLoading] = useState(true);
      const [hasError, setHasError] = useState(false);
      
      useEffect(() => {
        if (isLoading) {
          const timer = setTimeout(() => {
            setIsLoading(false);
            setHasError(true);
          }, 2000);
          return () => clearTimeout(timer);
        }
      }, [isLoading]);
      
      const LoadingComponent = () => {
        if (isLoading) {
          return (
            <Card className="p-6">
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
              </div>
            </Card>
          );
        }
        
        if (hasError) {
          throw new Error('Failed to load inventory data after timeout');
        }
        
        return <InventoryComponent />;
      };
      
      const WrappedLoading = withInventoryErrorBoundary(LoadingComponent);
      
      return (
        <div className="space-y-4">
          <Alert>
            <AlertDescription>
              Component loads for 2 seconds then throws an error
            </AlertDescription>
          </Alert>
          
          <WrappedLoading key={isLoading ? 'loading' : 'error'} />
          
          <Button
            onClick={() => {
              setIsLoading(true);
              setHasError(false);
            }}
          >
            Retry Loading
          </Button>
        </div>
      );
    },
  ],
};

export const MobileView: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  decorators: [
    () => {
      const [shouldError, setShouldError] = useState(false);
      
      return (
        <div className="space-y-4 p-4">
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShouldError(true)}
            className="w-full"
          >
            Trigger Mobile Error
          </Button>
          
          <WrappedWithCustomFallback 
            errorType="sync" 
            shouldError={shouldError} 
          />
        </div>
      );
    },
  ],
};

export const DarkMode: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
  },
  decorators: [
    () => (
      <div className="dark">
        <div className="space-y-4">
          <WrappedInventoryComponent />
          <WrappedWithCustomFallback errorType="database" shouldError={true} />
        </div>
      </div>
    ),
  ],
};