import type { Meta, StoryObj } from '@storybook/react-vite';
import { InventoryErrorBoundary } from './InventoryErrorBoundary';
import { within, userEvent, expect, waitFor } from '@storybook/test';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { 
  AlertTriangle, 
  RefreshCw, 
  WifiOff, 
  ServerCrash, 
  Database,
  Activity,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from 'sonner';

// Component that simulates inventory-specific errors
const InventoryComponent = ({ 
  errorType,
  shouldError, 
}: { 
  errorType: 'sync' | 'websocket' | 'database' | 'calculation' | 'none';
  shouldError: boolean;
}) => {
  const [inventory, setInventory] = useState({ total: 150, available: 120, reserved: 30 });
  const [lastSync, setLastSync] = useState(new Date());

  useEffect(() => {
    if (shouldError) {
      switch (errorType) {
        case 'sync':
          throw new Error('Failed to sync inventory: Server returned inconsistent data');
        case 'websocket':
          throw new Error('WebSocket connection lost: Real-time inventory updates unavailable');
        case 'database':
          throw new Error('Database error: Unable to fetch inventory records');
        case 'calculation':
          throw new Error('Inventory calculation error: Reserved quantity exceeds total stock');
        default:
          break;
      }
    }
  }, [shouldError, errorType]);

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      if (!shouldError) {
        setInventory(prev => ({
          ...prev,
          available: Math.max(0, prev.available + Math.floor(Math.random() * 5 - 2)),
        }));
        setLastSync(new Date());
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [shouldError]);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Inventory Status</h3>
        <Badge variant="default" className="gap-1">
          <Activity className="w-3 h-3" />
          Live
        </Badge>
      </div>
      
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <p className="text-sm text-muted-foreground">Total Stock</p>
          <p className="text-2xl font-bold">{inventory.total}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Available</p>
          <p className="text-2xl font-bold text-green-600">{inventory.available}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Reserved</p>
          <p className="text-2xl font-bold text-orange-600">{inventory.reserved}</p>
        </div>
      </div>
      
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Last sync: {lastSync.toLocaleTimeString()}</span>
        <span className="flex items-center gap-1">
          <CheckCircle className="w-3 h-3 text-green-500" />
          Connected
        </span>
      </div>
    </Card>
  );
};

// Custom fallback for inventory errors
const InventoryErrorFallback = ({ 
  error, 
  reset, 
}: { 
  error: Error; 
  reset: () => void;
}) => {
  const getErrorIcon = () => {
    const message = error.message.toLowerCase();
    if (message.includes('websocket')) return <WifiOff className="w-12 h-12" />;
    if (message.includes('database')) return <Database className="w-12 h-12" />;
    if (message.includes('sync')) return <RefreshCw className="w-12 h-12" />;
    if (message.includes('calculation')) return <AlertTriangle className="w-12 h-12" />;
    return <ServerCrash className="w-12 h-12" />;
  };

  const getErrorTitle = () => {
    const message = error.message.toLowerCase();
    if (message.includes('websocket')) return 'Real-time Connection Lost';
    if (message.includes('database')) return 'Database Connection Error';
    if (message.includes('sync')) return 'Inventory Sync Failed';
    if (message.includes('calculation')) return 'Inventory Calculation Error';
    return 'Inventory System Error';
  };

  const getRecoverySteps = () => {
    const message = error.message.toLowerCase();
    if (message.includes('websocket')) {
      return [
        'Real-time updates are temporarily unavailable',
        'Inventory data will refresh when connection is restored',
        'You can continue working with cached data',
      ];
    }
    if (message.includes('database')) {
      return [
        'Unable to access inventory database',
        'Check your internet connection',
        'Contact support if the issue persists',
      ];
    }
    if (message.includes('sync')) {
      return [
        'Inventory data may be out of date',
        'Recent changes might not be reflected',
        'Try refreshing to sync latest data',
      ];
    }
    if (message.includes('calculation')) {
      return [
        'Inventory calculations detected an inconsistency',
        'This might indicate data corruption',
        'Please contact support immediately',
      ];
    }
    return ['An unexpected error occurred', 'Please try again or contact support'];
  };

  return (
    <Card className="p-8 max-w-lg mx-auto">
      <div className="flex justify-center mb-4 text-amber-600">
        {getErrorIcon()}
      </div>
      
      <h3 className="text-xl font-semibold text-center mb-2">{getErrorTitle()}</h3>
      
      <div className="space-y-2 mb-6">
        {getRecoverySteps().map((step, index) => (
          <div key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
            <span className="text-amber-600 mt-0.5">•</span>
            <span>{step}</span>
          </div>
        ))}
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button onClick={reset} variant="default">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry Connection
        </Button>
        <Button 
          variant="outline" 
          onClick={() => {
            toast.info('Working offline - changes will sync when reconnected');
          }}
        >
          Continue Offline
        </Button>
      </div>
      
      {process.env.NODE_ENV === 'development' && (
        <details className="mt-6 text-left">
          <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
            Technical Details
          </summary>
          <div className="mt-2 p-3 bg-muted rounded text-xs space-y-1">
            <p><strong>Error:</strong> {error.name}</p>
            <p><strong>Message:</strong> {error.message}</p>
            <p><strong>Time:</strong> {new Date().toISOString()}</p>
          </div>
        </details>
      )}
    </Card>
  );
};

// Demo component
const InventoryErrorDemo = ({ 
  errorType = 'none',
  useCustomFallback = false, 
}: { 
  errorType?: 'sync' | 'websocket' | 'database' | 'calculation' | 'none';
  useCustomFallback?: boolean;
}) => {
  const [shouldError, setShouldError] = useState(false);
  const [key, setKey] = useState(0);

  const reset = () => {
    setShouldError(false);
    setKey(k => k + 1);
    toast.success('Connection restored');
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          onClick={() => setShouldError(true)}
          variant="destructive"
          disabled={shouldError}
        >
          Simulate {errorType} Error
        </Button>
        <Button
          onClick={reset}
          variant="outline"
          disabled={!shouldError}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Reset
        </Button>
      </div>
      
      <InventoryErrorBoundary 
        key={key}
        fallback={useCustomFallback ? (error, reset) => (
          <InventoryErrorFallback error={error} reset={reset} />
        ) : undefined}
      >
        <InventoryComponent errorType={errorType} shouldError={shouldError} />
      </InventoryErrorBoundary>
      
      <Toaster position="top-right" />
    </div>
  );
};

// WebSocket simulation
const WebSocketSimulation = () => {
  const [wsStatus, setWsStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('connected');
  const [shouldError, setShouldError] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  const simulateDisconnect = () => {
    setWsStatus('disconnected');
    setShouldError(true);
    
    // Simulate reconnection attempts
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      setReconnectAttempts(attempts);
      setWsStatus('reconnecting');
      
      if (attempts >= 3) {
        clearInterval(interval);
        setWsStatus('connected');
        setShouldError(false);
        setReconnectAttempts(0);
        toast.success('WebSocket reconnected!');
      }
    }, 2000);
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-semibold">WebSocket Connection</h4>
          <Badge 
            variant={wsStatus === 'connected' ? 'default' : wsStatus === 'reconnecting' ? 'secondary' : 'destructive'}
          >
            {wsStatus === 'connected' && <CheckCircle className="w-3 h-3 mr-1" />}
            {wsStatus === 'disconnected' && <XCircle className="w-3 h-3 mr-1" />}
            {wsStatus === 'reconnecting' && <RefreshCw className="w-3 h-3 mr-1 animate-spin" />}
            {wsStatus}
          </Badge>
        </div>
        
        {wsStatus === 'reconnecting' && (
          <p className="text-sm text-muted-foreground">
            Reconnection attempt {reconnectAttempts}/3...
          </p>
        )}
        
        <Button
          onClick={simulateDisconnect}
          variant="outline"
          size="sm"
          disabled={wsStatus !== 'connected'}
          className="w-full"
        >
          Simulate Disconnect
        </Button>
      </Card>
      
      <InventoryErrorBoundary
        fallback={(error, reset) => (
          <InventoryErrorFallback error={error} reset={reset} />
        )}
      >
        <InventoryComponent 
          errorType="websocket" 
          shouldError={shouldError} 
        />
      </InventoryErrorBoundary>
    </div>
  );
};

// Multiple error boundaries
const MultipleInventoryComponents = () => {
  const [errors, setErrors] = useState({
    component1: false,
    component2: false,
    component3: false,
  });

  const triggerError = (component: keyof typeof errors) => {
    setErrors(prev => ({ ...prev, [component]: true }));
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Multiple Inventory Components</h3>
      <p className="text-sm text-muted-foreground">
        Each component has its own error boundary to prevent cascading failures
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => triggerError('component1')}
            className="w-full mb-2"
          >
            Break Warehouse A
          </Button>
          <InventoryErrorBoundary
            fallback={(_, reset) => (
              <Card className="p-4 bg-destructive/10 border-destructive/20">
                <p className="text-sm font-medium mb-2">Warehouse A Error</p>
                <Button size="sm" variant="outline" onClick={reset} className="w-full">
                  Reconnect
                </Button>
              </Card>
            )}
          >
            {errors.component1 ? (
              <InventoryComponent errorType="database" shouldError={true} />
            ) : (
              <Card className="p-4">
                <h4 className="font-medium mb-2">Warehouse A</h4>
                <p className="text-2xl font-bold">1,234</p>
                <p className="text-sm text-muted-foreground">units</p>
              </Card>
            )}
          </InventoryErrorBoundary>
        </div>
        
        <div>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => triggerError('component2')}
            className="w-full mb-2"
          >
            Break Warehouse B
          </Button>
          <InventoryErrorBoundary
            fallback={(_, reset) => (
              <Card className="p-4 bg-destructive/10 border-destructive/20">
                <p className="text-sm font-medium mb-2">Warehouse B Error</p>
                <Button size="sm" variant="outline" onClick={reset} className="w-full">
                  Reconnect
                </Button>
              </Card>
            )}
          >
            {errors.component2 ? (
              <InventoryComponent errorType="sync" shouldError={true} />
            ) : (
              <Card className="p-4">
                <h4 className="font-medium mb-2">Warehouse B</h4>
                <p className="text-2xl font-bold">856</p>
                <p className="text-sm text-muted-foreground">units</p>
              </Card>
            )}
          </InventoryErrorBoundary>
        </div>
        
        <div>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => triggerError('component3')}
            className="w-full mb-2"
          >
            Break Warehouse C
          </Button>
          <InventoryErrorBoundary
            fallback={(_, reset) => (
              <Card className="p-4 bg-destructive/10 border-destructive/20">
                <p className="text-sm font-medium mb-2">Warehouse C Error</p>
                <Button size="sm" variant="outline" onClick={reset} className="w-full">
                  Reconnect
                </Button>
              </Card>
            )}
          >
            {errors.component3 ? (
              <InventoryComponent errorType="calculation" shouldError={true} />
            ) : (
              <Card className="p-4">
                <h4 className="font-medium mb-2">Warehouse C</h4>
                <p className="text-2xl font-bold">2,108</p>
                <p className="text-sm text-muted-foreground">units</p>
              </Card>
            )}
          </InventoryErrorBoundary>
        </div>
      </div>
    </div>
  );
};

const meta = {
  title: 'UI/InventoryErrorBoundary',
  component: InventoryErrorBoundary,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof InventoryErrorBoundary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <Card className="p-6">
        <h3 className="text-lg font-semibold">Inventory Component</h3>
        <p className="text-muted-foreground">
          This component is protected by an inventory error boundary.
        </p>
      </Card>
    ),
  },
};

export const SyncError: Story = {
  args: {
    children: <div>Inventory Component</div>,
  },
  decorators: [
    () => <InventoryErrorDemo errorType="sync" useCustomFallback={true} />,
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Trigger error
    const triggerButton = canvas.getByRole('button', { name: /simulate sync error/i });
    await userEvent.click(triggerButton);
    
    // Should show sync error UI
    await waitFor(() => {
      expect(canvas.getByText('Inventory Sync Failed')).toBeInTheDocument();
      expect(canvas.getByText(/data may be out of date/i)).toBeInTheDocument();
    });
  },
};

export const WebSocketDisconnect: Story = {
  args: {
    children: <div>Inventory Component</div>,
  },
  decorators: [
    () => <WebSocketSimulation />,
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Simulate disconnect
    const disconnectButton = canvas.getByRole('button', { name: /simulate disconnect/i });
    await userEvent.click(disconnectButton);
    
    // Should show disconnected status
    await waitFor(() => {
      expect(canvas.getByText('disconnected')).toBeInTheDocument();
    });
    
    // Should show reconnecting
    await waitFor(() => {
      expect(canvas.getByText('reconnecting')).toBeInTheDocument();
      expect(canvas.getByText(/reconnection attempt/i)).toBeInTheDocument();
    }, { timeout: 3000 });
    
    // Should eventually reconnect
    await waitFor(() => {
      expect(canvas.getByText('connected')).toBeInTheDocument();
    }, { timeout: 8000 });
  },
};

export const DatabaseError: Story = {
  args: {
    children: <div>Inventory Component</div>,
  },
  decorators: [
    () => <InventoryErrorDemo errorType="database" useCustomFallback={true} />,
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Trigger error
    const triggerButton = canvas.getByRole('button', { name: /simulate database error/i });
    await userEvent.click(triggerButton);
    
    // Should show database error UI
    await waitFor(() => {
      expect(canvas.getByText('Database Connection Error')).toBeInTheDocument();
      expect(canvas.getByText(/unable to access inventory database/i)).toBeInTheDocument();
    });
  },
};

export const CalculationError: Story = {
  args: {
    children: <div>Inventory Component</div>,
  },
  decorators: [
    () => <InventoryErrorDemo errorType="calculation" useCustomFallback={true} />,
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Trigger error
    const triggerButton = canvas.getByRole('button', { name: /simulate calculation error/i });
    await userEvent.click(triggerButton);
    
    // Should show calculation error UI
    await waitFor(() => {
      expect(canvas.getByText('Inventory Calculation Error')).toBeInTheDocument();
      expect(canvas.getByText(/detected an inconsistency/i)).toBeInTheDocument();
    });
  },
};

export const WithRetry: Story = {
  args: {
    children: <div>Inventory Component</div>,
  },
  decorators: [
    () => <InventoryErrorDemo errorType="sync" useCustomFallback={true} />,
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Trigger error
    const triggerButton = canvas.getByRole('button', { name: /simulate sync error/i });
    await userEvent.click(triggerButton);
    
    // Wait for error UI
    await waitFor(() => {
      expect(canvas.getByText('Inventory Sync Failed')).toBeInTheDocument();
    });
    
    // Click retry
    const retryButton = canvas.getByRole('button', { name: /retry connection/i });
    await userEvent.click(retryButton);
    
    // Should restore normal view
    await waitFor(() => {
      expect(canvas.getByText('Inventory Status')).toBeInTheDocument();
    });
  },
};

export const ContinueOffline: Story = {
  args: {
    children: <div>Inventory Component</div>,
  },
  decorators: [
    () => <InventoryErrorDemo errorType="websocket" useCustomFallback={true} />,
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Trigger error
    const triggerButton = canvas.getByRole('button', { name: /simulate websocket error/i });
    await userEvent.click(triggerButton);
    
    // Wait for error UI
    await waitFor(() => {
      expect(canvas.getByText('Real-time Connection Lost')).toBeInTheDocument();
    });
    
    // Click continue offline
    const offlineButton = canvas.getByRole('button', { name: /continue offline/i });
    await userEvent.click(offlineButton);
    
    // Should show toast
    await waitFor(() => {
      expect(canvas.getByText(/working offline/i)).toBeInTheDocument();
    });
  },
};

export const DefaultFallback: Story = {
  args: {
    children: <div>Inventory Component</div>,
  },
  decorators: [
    () => <InventoryErrorDemo errorType="sync" useCustomFallback={false} />,
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Trigger error
    const triggerButton = canvas.getByRole('button', { name: /simulate sync error/i });
    await userEvent.click(triggerButton);
    
    // Should show default fallback
    await waitFor(() => {
      expect(canvas.getByText('Inventory Data Error')).toBeInTheDocument();
      expect(canvas.getByText(/encountered an error while loading/i)).toBeInTheDocument();
    });
  },
};

export const MultipleComponents: Story = {
  args: {
    children: <div>Inventory Component</div>,
  },
  decorators: [
    () => <MultipleInventoryComponents />,
  ],
};

export const ErrorDetails: Story = {
  args: {
    children: <div>Inventory Component</div>,
  },
  decorators: [
    () => {
      // Force development mode for this story
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const Demo = () => <InventoryErrorDemo errorType="database" useCustomFallback={true} />;
      
      // Restore original env
      useEffect(() => {
        return () => {
          process.env.NODE_ENV = originalEnv;
        };
      }, [originalEnv]);
      
      return <Demo />;
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Trigger error
    const triggerButton = canvas.getByRole('button', { name: /simulate database error/i });
    await userEvent.click(triggerButton);
    
    // Wait for error UI
    await waitFor(() => {
      expect(canvas.getByText('Database Connection Error')).toBeInTheDocument();
    });
    
    // Click technical details
    const detailsToggle = canvas.getByText('Technical Details');
    await userEvent.click(detailsToggle);
    
    // Should show error details
    await waitFor(() => {
      expect(canvas.getByText(/Error:/)).toBeInTheDocument();
      expect(canvas.getByText(/Message:/)).toBeInTheDocument();
    });
  },
};

export const LiveUpdates: Story = {
  args: {
    children: <div>Inventory Component</div>,
  },
  decorators: [
    () => {
      const [showError, setShowError] = useState(false);
      
      return (
        <div className="space-y-4">
          <Card className="p-4 bg-info/10 border-info/20">
            <p className="text-sm">
              Watch the inventory numbers update in real-time every 3 seconds
            </p>
          </Card>
          
          <Button
            onClick={() => setShowError(!showError)}
            variant={showError ? 'outline' : 'destructive'}
          >
            {showError ? 'Resume Updates' : 'Break Connection'}
          </Button>
          
          <InventoryErrorBoundary>
            <InventoryComponent 
              errorType="none" 
              shouldError={showError} 
            />
          </InventoryErrorBoundary>
        </div>
      );
    },
  ],
};

export const MobileView: Story = {
  args: {
    children: <div>Inventory Component</div>,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  decorators: [
    () => <InventoryErrorDemo errorType="sync" useCustomFallback={true} />,
  ],
};

export const TabletView: Story = {
  args: {
    children: <div>Inventory Component</div>,
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
  decorators: [
    () => <WebSocketSimulation />,
  ],
};