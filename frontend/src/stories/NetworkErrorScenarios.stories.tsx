import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { Switch } from '@/components/ui/Switch';
import { Label } from '@/components/ui/Label';
import { toast, Toaster } from 'sonner';
import { 
  Wifi, 
  WifiOff, 
  AlertCircle, 
  RefreshCw, 
  Clock, 
  Download,
  Loader2,
  CheckCircle,
  XCircle,
  Activity,
  CloudOff,
  Smartphone,
  Monitor,
} from 'lucide-react';

interface NetworkCondition {
  isOnline: boolean;
  latency: number;
  bandwidth: 'slow' | 'medium' | 'fast';
  packetLoss: number;
  jitter: number;
}

const NetworkSimulator = ({ 
  onConditionChange, 
}: { 
  onConditionChange: (condition: NetworkCondition) => void 
}) => {
  const [condition, setCondition] = useState<NetworkCondition>({
    isOnline: true,
    latency: 50,
    bandwidth: 'fast',
    packetLoss: 0,
    jitter: 0,
  });

  useEffect(() => {
    onConditionChange(condition);
  }, [condition, onConditionChange]);

  return (
    <Card className="p-6 space-y-4">
      <h3 className="text-lg font-semibold">Network Simulator</h3>
      
      <div className="flex items-center justify-between">
        <Label htmlFor="online">Connection Status</Label>
        <div className="flex items-center gap-2">
          <Switch
            id="online"
            checked={condition.isOnline}
            onCheckedChange={(checked) => 
              setCondition(prev => ({ ...prev, isOnline: checked }))
            }
          />
          {condition.isOnline ? (
            <Wifi className="w-4 h-4 text-green-500" />
          ) : (
            <WifiOff className="w-4 h-4 text-red-500" />
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Latency: {condition.latency}ms</Label>
        <input
          type="range"
          min="0"
          max="5000"
          value={condition.latency}
          onChange={(e) => 
            setCondition(prev => ({ ...prev, latency: parseInt(e.target.value) }))
          }
          className="w-full"
          disabled={!condition.isOnline}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0ms</span>
          <span>2500ms</span>
          <span>5000ms</span>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Bandwidth</Label>
        <div className="flex gap-2">
          {(['slow', 'medium', 'fast'] as const).map((speed) => (
            <Button
              key={speed}
              variant={condition.bandwidth === speed ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCondition(prev => ({ ...prev, bandwidth: speed }))}
              disabled={!condition.isOnline}
            >
              {speed}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Packet Loss: {condition.packetLoss}%</Label>
        <input
          type="range"
          min="0"
          max="50"
          value={condition.packetLoss}
          onChange={(e) => 
            setCondition(prev => ({ ...prev, packetLoss: parseInt(e.target.value) }))
          }
          className="w-full"
          disabled={!condition.isOnline}
        />
      </div>

      <div className="space-y-2">
        <Label>Jitter: {condition.jitter}ms</Label>
        <input
          type="range"
          min="0"
          max="100"
          value={condition.jitter}
          onChange={(e) => 
            setCondition(prev => ({ ...prev, jitter: parseInt(e.target.value) }))
          }
          className="w-full"
          disabled={!condition.isOnline}
        />
      </div>
    </Card>
  );
};

const RequestSimulator = ({ 
  networkCondition, 
}: { 
  networkCondition: NetworkCondition 
}) => {
  const [requests, setRequests] = useState<{
    id: string;
    url: string;
    status: 'pending' | 'success' | 'failed' | 'timeout';
    duration?: number;
    retries: number;
  }[]>([]);

  const makeRequest = async (url: string, retryCount = 0): Promise<void> => {
    const requestId = `req-${Date.now()}-${Math.random()}`;
    const startTime = Date.now();

    setRequests(prev => [...prev, {
      id: requestId,
      url,
      status: 'pending',
      retries: retryCount,
    }]);

    if (!networkCondition.isOnline) {
      setTimeout(() => {
        setRequests(prev => prev.map(req => 
          req.id === requestId 
            ? { ...req, status: 'failed', duration: Date.now() - startTime }
            : req,
        ));
        toast.error('Network offline');
      }, 100);
      return;
    }

    // Simulate latency
    await new Promise(resolve => setTimeout(resolve, networkCondition.latency));

    // Simulate packet loss
    if (Math.random() * 100 < networkCondition.packetLoss) {
      setRequests(prev => prev.map(req => 
        req.id === requestId 
          ? { ...req, status: 'failed', duration: Date.now() - startTime }
          : req,
      ));
      toast.error('Request failed due to packet loss');
      
      // Retry logic
      if (retryCount < 3) {
        setTimeout(() => {
          void makeRequest(url, retryCount + 1);
        }, 1000 * (retryCount + 1));
      }
      return;
    }

    // Simulate timeout for slow connections
    if (networkCondition.bandwidth === 'slow' && networkCondition.latency > 3000) {
      setTimeout(() => {
        setRequests(prev => prev.map(req => 
          req.id === requestId 
            ? { ...req, status: 'timeout', duration: Date.now() - startTime }
            : req,
        ));
        toast.error('Request timeout');
      }, 5000);
      return;
    }

    // Success
    setTimeout(() => {
      setRequests(prev => prev.map(req => 
        req.id === requestId 
          ? { ...req, status: 'success', duration: Date.now() - startTime }
          : req,
      ));
      toast.success('Request completed');
    }, networkCondition.bandwidth === 'slow' ? 2000 : 500);
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Request Simulator</h3>
        <Button
          onClick={() => { void makeRequest('/api/products'); }}
          size="sm"
        >
          Make Request
        </Button>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {requests.slice(-5).reverse().map((request) => (
          <div
            key={request.id}
            className="flex items-center justify-between p-3 bg-muted rounded-lg"
          >
            <div className="flex items-center gap-3">
              {request.status === 'pending' && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              {request.status === 'success' && (
                <CheckCircle className="w-4 h-4 text-green-500" />
              )}
              {request.status === 'failed' && (
                <XCircle className="w-4 h-4 text-red-500" />
              )}
              {request.status === 'timeout' && (
                <Clock className="w-4 h-4 text-orange-500" />
              )}
              <div>
                <p className="text-sm font-medium">{request.url}</p>
                <p className="text-xs text-muted-foreground">
                  {request.duration ? `${request.duration}ms` : 'In progress...'}
                  {request.retries > 0 && ` • Retry ${request.retries}`}
                </p>
              </div>
            </div>
            <Badge
              variant={
                request.status === 'success' ? 'default' :
                request.status === 'failed' ? 'destructive' :
                request.status === 'timeout' ? 'secondary' :
                'outline'
              }
            >
              {request.status}
            </Badge>
          </div>
        ))}
        {requests.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">
            No requests made yet
          </p>
        )}
      </div>
    </Card>
  );
};

const OfflineQueue = () => {
  const [queue, setQueue] = useState<{
    id: string;
    action: string;
    data: any;
    timestamp: Date;
    status: 'queued' | 'syncing' | 'synced' | 'failed';
  }[]>([]);
  const [isOnline, setIsOnline] = useState(true);

  const addToQueue = (action: string, data: any) => {
    const item = {
      id: `queue-${Date.now()}`,
      action,
      data,
      timestamp: new Date(),
      status: 'queued' as const,
    };
    
    setQueue(prev => [...prev, item]);
    
    if (!isOnline) {
      toast.info('Action queued for offline sync');
    }
  };

  const syncQueue = useCallback(async () => {
    if (!isOnline || queue.filter(item => item.status === 'queued').length === 0) {
      return;
    }

    for (const item of queue) {
      if (item.status !== 'queued') continue;
      
      setQueue(prev => prev.map(i => 
        i.id === item.id ? { ...i, status: 'syncing' } : i,
      ));

      await new Promise(resolve => setTimeout(resolve, 1000));

      const success = Math.random() > 0.2;
      
      setQueue(prev => prev.map(i => 
        i.id === item.id 
          ? { ...i, status: success ? 'synced' : 'failed' }
          : i,
      ));

      if (success) {
        toast.success(`Synced: ${item.action}`);
      } else {
        toast.error(`Failed to sync: ${item.action}`);
      }
    }
  }, [isOnline, queue]);

  useEffect(() => {
    if (isOnline) {
      void syncQueue();
    }
  }, [isOnline, syncQueue]);

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Offline Queue</h3>
        <div className="flex items-center gap-4">
          <Badge variant={isOnline ? 'default' : 'destructive'}>
            {isOnline ? 'Online' : 'Offline'}
          </Badge>
          <Switch
            checked={isOnline}
            onCheckedChange={setIsOnline}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={() => addToQueue('updateProduct', { id: 1, name: 'Product' })}
          size="sm"
          variant="outline"
        >
          Add Update
        </Button>
        <Button
          onClick={() => addToQueue('createOrder', { items: ['item1', 'item2'] })}
          size="sm"
          variant="outline"
        >
          Add Order
        </Button>
        <Button
          onClick={() => { void syncQueue(); }}
          size="sm"
          disabled={!isOnline || queue.filter(i => i.status === 'queued').length === 0}
        >
          <RefreshCw className="w-3 h-3 mr-1" />
          Sync Now
        </Button>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {queue.map((item) => (
          <div
            key={item.id}
            className={`p-3 rounded-lg border ${
              item.status === 'failed' ? 'border-red-200 bg-red-50' :
              item.status === 'synced' ? 'border-green-200 bg-green-50' :
              item.status === 'syncing' ? 'border-blue-200 bg-blue-50' :
              'border-gray-200 bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{item.action}</p>
                <p className="text-xs text-muted-foreground">
                  {item.timestamp.toLocaleTimeString()}
                </p>
              </div>
              <Badge
                variant={
                  item.status === 'synced' ? 'default' :
                  item.status === 'failed' ? 'destructive' :
                  item.status === 'syncing' ? 'secondary' :
                  'outline'
                }
              >
                {item.status}
              </Badge>
            </div>
          </div>
        ))}
        {queue.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">
            No queued actions
          </p>
        )}
      </div>
    </Card>
  );
};

const PartialDataLoader = () => {
  const [data, setData] = useState<{
    basic?: { id: string; name: string };
    details?: { description: string; price: number };
    inventory?: { stock: number; reserved: number };
    images?: string[];
  }>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const loadSection = async (section: string) => {
    setLoading(prev => ({ ...prev, [section]: true }));
    setErrors(prev => ({ ...prev, [section]: '' }));

    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    if (Math.random() > 0.7) {
      setErrors(prev => ({ ...prev, [section]: 'Failed to load' }));
      setLoading(prev => ({ ...prev, [section]: false }));
      return;
    }

    const mockData: Record<string, any> = {
      basic: { id: 'prod-123', name: 'Premium Product' },
      details: { description: 'High quality product with premium features', price: 99.99 },
      inventory: { stock: 50, reserved: 5 },
      images: [
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200',
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200',
      ],
    };

    setData(prev => ({ ...prev, [section]: mockData[section] }));
    setLoading(prev => ({ ...prev, [section]: false }));
  };

  const sections = ['basic', 'details', 'inventory', 'images'];

  return (
    <Card className="p-6 space-y-4">
      <h3 className="text-lg font-semibold">Partial Data Loading</h3>
      
      <div className="flex gap-2">
        <Button
          onClick={() => sections.forEach(s => void loadSection(s))}
          size="sm"
        >
          Load All
        </Button>
        <Button
          onClick={() => {
            setData({});
            setLoading({});
            setErrors({});
          }}
          size="sm"
          variant="outline"
        >
          Reset
        </Button>
      </div>

      <div className="space-y-4">
        {sections.map(section => (
          <div key={section} className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium capitalize">{section}</h4>
              <Button
                onClick={() => { void loadSection(section); }}
                size="sm"
                variant="ghost"
                disabled={loading[section]}
              >
                {loading[section] ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : errors[section] ? (
                  <RefreshCw className="w-4 h-4" />
                ) : data[section as keyof typeof data] ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
              </Button>
            </div>
            
            <div className="p-3 bg-muted rounded-lg min-h-[60px] flex items-center">
              {loading[section] ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">Loading...</span>
                </div>
              ) : errors[section] ? (
                <div className="flex items-center gap-2 text-red-500">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm">{errors[section]}</span>
                </div>
              ) : data[section as keyof typeof data] ? (
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(data[section as keyof typeof data], null, 2)}
                </pre>
              ) : (
                <span className="text-sm text-muted-foreground">
                  Click load button to fetch data
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

const TimeoutSimulator = () => {
  const [requests, setRequests] = useState<{
    id: string;
    duration: number;
    timeout: number;
    status: 'pending' | 'completed' | 'timeout';
    startTime: number;
  }[]>([]);
  const requestRefs = useRef<Record<string, NodeJS.Timeout>>({});

  const makeTimedRequest = (duration: number, timeout: number) => {
    const id = `timeout-${Date.now()}`;
    const startTime = Date.now();
    
    setRequests(prev => [...prev, {
      id,
      duration,
      timeout,
      status: 'pending',
      startTime,
    }]);

    const timeoutId = setTimeout(() => {
      setRequests(prev => prev.map(req => 
        req.id === id ? { ...req, status: 'timeout' } : req,
      ));
      toast.error(`Request timeout after ${timeout}ms`);
    }, timeout);

    requestRefs.current[id] = timeoutId;

    setTimeout(() => {
      clearTimeout(requestRefs.current[id]);
      setRequests(prev => prev.map(req => 
        req.id === id && req.status === 'pending'
          ? { ...req, status: 'completed' }
          : req,
      ));
      if (requests.find(r => r.id === id)?.status === 'pending') {
        toast.success(`Request completed in ${duration}ms`);
      }
    }, duration);
  };

  return (
    <Card className="p-6 space-y-4">
      <h3 className="text-lg font-semibold">Timeout Simulator</h3>
      
      <div className="grid grid-cols-2 gap-2">
        <Button
          onClick={() => makeTimedRequest(500, 1000)}
          size="sm"
          variant="outline"
        >
          Fast (500ms/1s)
        </Button>
        <Button
          onClick={() => makeTimedRequest(2000, 1500)}
          size="sm"
          variant="outline"
        >
          Timeout (2s/1.5s)
        </Button>
        <Button
          onClick={() => makeTimedRequest(3000, 5000)}
          size="sm"
          variant="outline"
        >
          Slow (3s/5s)
        </Button>
        <Button
          onClick={() => makeTimedRequest(8000, 5000)}
          size="sm"
          variant="outline"
        >
          Very Slow (8s/5s)
        </Button>
      </div>

      <div className="space-y-2">
        {requests.slice(-5).reverse().map((request) => {
          const elapsed = Date.now() - request.startTime;
          const progress = Math.min((elapsed / request.timeout) * 100, 100);
          
          return (
            <div key={request.id} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span>
                  {request.duration}ms request / {request.timeout}ms timeout
                </span>
                <Badge
                  variant={
                    request.status === 'completed' ? 'default' :
                    request.status === 'timeout' ? 'destructive' :
                    'outline'
                  }
                >
                  {request.status}
                </Badge>
              </div>
              {request.status === 'pending' && (
                <Progress value={progress} className="h-2" />
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
};

const meta = {
  title: 'Patterns/Network Error Scenarios',
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const NetworkSimulation: Story = {
  render: () => {
    const [networkCondition, setNetworkCondition] = useState<NetworkCondition>({
      isOnline: true,
      latency: 50,
      bandwidth: 'fast',
      packetLoss: 0,
      jitter: 0,
    });

    return (
      <div className="space-y-6">
        <Card className="p-4 bg-blue-50 border-blue-200">
          <h2 className="text-lg font-semibold mb-2">Network Simulation Demo</h2>
          <p className="text-sm text-muted-foreground">
            Simulate various network conditions to test how your application handles connectivity issues.
          </p>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <NetworkSimulator onConditionChange={setNetworkCondition} />
          <RequestSimulator networkCondition={networkCondition} />
        </div>

        <Toaster position="bottom-right" />
      </div>
    );
  },
};

export const OfflineSyncQueue: Story = {
  render: () => (
    <div className="space-y-6">
      <Card className="p-4 bg-orange-50 border-orange-200">
        <h2 className="text-lg font-semibold mb-2">Offline Sync Queue</h2>
        <p className="text-sm text-muted-foreground">
          Queue actions while offline and sync them when connection is restored.
        </p>
      </Card>

      <OfflineQueue />
      <Toaster position="bottom-right" />
    </div>
  ),
};

export const PartialDataLoading: Story = {
  render: () => (
    <div className="space-y-6">
      <Card className="p-4 bg-green-50 border-green-200">
        <h2 className="text-lg font-semibold mb-2">Partial Data Loading</h2>
        <p className="text-sm text-muted-foreground">
          Load different sections of data independently to provide a better user experience.
        </p>
      </Card>

      <PartialDataLoader />
      <Toaster position="bottom-right" />
    </div>
  ),
};

export const TimeoutHandling: Story = {
  render: () => (
    <div className="space-y-6">
      <Card className="p-4 bg-purple-50 border-purple-200">
        <h2 className="text-lg font-semibold mb-2">Request Timeout Handling</h2>
        <p className="text-sm text-muted-foreground">
          Test how your application handles requests that exceed timeout limits.
        </p>
      </Card>

      <TimeoutSimulator />
      <Toaster position="bottom-right" />
    </div>
  ),
};

export const CompleteNetworkScenario: Story = {
  render: () => {
    const [networkCondition, setNetworkCondition] = useState<NetworkCondition>({
      isOnline: true,
      latency: 50,
      bandwidth: 'fast',
      packetLoss: 0,
      jitter: 0,
    });

    return (
      <div className="space-y-6">
        <Card className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <h2 className="text-xl font-bold mb-2">Complete Network Scenario Testing</h2>
          <p className="text-sm text-muted-foreground">
            Test all aspects of network error handling in one comprehensive view.
          </p>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <NetworkSimulator onConditionChange={setNetworkCondition} />
          <RequestSimulator networkCondition={networkCondition} />
          <OfflineQueue />
          <PartialDataLoader />
          <TimeoutSimulator />
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Network Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Connection</span>
                <Badge variant={networkCondition.isOnline ? 'default' : 'destructive'}>
                  {networkCondition.isOnline ? 'Online' : 'Offline'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Latency</span>
                <Badge
                  variant={
                    networkCondition.latency < 100 ? 'default' :
                    networkCondition.latency < 500 ? 'secondary' :
                    'destructive'
                  }
                >
                  {networkCondition.latency}ms
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Bandwidth</span>
                <Badge>{networkCondition.bandwidth}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Packet Loss</span>
                <Badge
                  variant={networkCondition.packetLoss > 10 ? 'destructive' : 'outline'}
                >
                  {networkCondition.packetLoss}%
                </Badge>
              </div>
            </div>
          </Card>
        </div>

        <Toaster position="bottom-right" />
      </div>
    );
  },
};

export const ConnectionQualityIndicator: Story = {
  render: () => {
    const [quality, setQuality] = useState<'excellent' | 'good' | 'fair' | 'poor'>('excellent');

    const qualityConfig = {
      excellent: { color: 'text-green-500', bars: 4, latency: '< 50ms' },
      good: { color: 'text-yellow-500', bars: 3, latency: '50-150ms' },
      fair: { color: 'text-orange-500', bars: 2, latency: '150-300ms' },
      poor: { color: 'text-red-500', bars: 1, latency: '> 300ms' },
    };

    return (
      <div className="space-y-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Connection Quality Indicator</h3>
          
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-end gap-1">
              {[1, 2, 3, 4].map((bar) => (
                <div
                  key={bar}
                  className={`w-3 bg-gray-200 rounded-sm transition-all ${
                    bar <= qualityConfig[quality].bars
                      ? `${qualityConfig[quality].color} bg-current`
                      : ''
                  }`}
                  style={{ height: `${bar * 8}px` }}
                />
              ))}
            </div>
            <span className={`ml-3 text-sm font-medium ${qualityConfig[quality].color}`}>
              {quality} ({qualityConfig[quality].latency})
            </span>
          </div>

          <div className="flex gap-2 justify-center">
            {(['excellent', 'good', 'fair', 'poor'] as const).map((q) => (
              <Button
                key={q}
                onClick={() => setQuality(q)}
                variant={quality === q ? 'default' : 'outline'}
                size="sm"
              >
                {q}
              </Button>
            ))}
          </div>
        </Card>
      </div>
    );
  },
};

export const AdaptiveLoadingStrategy: Story = {
  render: () => {
    const [connectionSpeed, setConnectionSpeed] = useState<'slow' | 'fast'>('fast');
    const [strategy, setStrategy] = useState<'full' | 'progressive' | 'minimal'>('full');

    useEffect(() => {
      if (connectionSpeed === 'slow') {
        setStrategy('minimal');
      } else {
        setStrategy('full');
      }
    }, [connectionSpeed]);

    return (
      <div className="space-y-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Adaptive Loading Strategy</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Connection Speed</Label>
              <div className="flex gap-2">
                <Button
                  onClick={() => setConnectionSpeed('slow')}
                  variant={connectionSpeed === 'slow' ? 'default' : 'outline'}
                  size="sm"
                >
                  <CloudOff className="w-4 h-4 mr-1" />
                  Slow
                </Button>
                <Button
                  onClick={() => setConnectionSpeed('fast')}
                  variant={connectionSpeed === 'fast' ? 'default' : 'outline'}
                  size="sm"
                >
                  <Wifi className="w-4 h-4 mr-1" />
                  Fast
                </Button>
              </div>
            </div>

            <Alert>
              <Activity className="h-4 w-4" />
              <AlertDescription>
                <strong>Current Strategy:</strong> {strategy}
                <br />
                {strategy === 'minimal' && 'Loading only essential content'}
                {strategy === 'progressive' && 'Loading content as needed'}
                {strategy === 'full' && 'Loading all content immediately'}
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-3 gap-4">
              <Card className={`p-4 ${strategy === 'minimal' ? 'opacity-100' : 'opacity-50'}`}>
                <h4 className="font-medium mb-2">Minimal</h4>
                <ul className="text-sm space-y-1">
                  <li>• Text content only</li>
                  <li>• No images</li>
                  <li>• Basic styling</li>
                </ul>
              </Card>
              
              <Card className={`p-4 ${strategy === 'progressive' ? 'opacity-100' : 'opacity-50'}`}>
                <h4 className="font-medium mb-2">Progressive</h4>
                <ul className="text-sm space-y-1">
                  <li>• Lazy load images</li>
                  <li>• Load on scroll</li>
                  <li>• Prioritize viewport</li>
                </ul>
              </Card>
              
              <Card className={`p-4 ${strategy === 'full' ? 'opacity-100' : 'opacity-50'}`}>
                <h4 className="font-medium mb-2">Full</h4>
                <ul className="text-sm space-y-1">
                  <li>• All content</li>
                  <li>• High-res images</li>
                  <li>• Preload assets</li>
                </ul>
              </Card>
            </div>
          </div>
        </Card>
      </div>
    );
  },
};

export const DeviceNetworkStatus: Story = {
  render: () => {
    const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
    const [networkType, setNetworkType] = useState<'wifi' | '4g' | '3g' | 'offline'>('wifi');

    const networkProfiles = {
      wifi: { speed: 'Fast', latency: 'Low', reliability: 'High' },
      '4g': { speed: 'Good', latency: 'Medium', reliability: 'Good' },
      '3g': { speed: 'Slow', latency: 'High', reliability: 'Fair' },
      offline: { speed: 'None', latency: 'N/A', reliability: 'None' },
    };

    return (
      <div className="space-y-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Device & Network Status</h3>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium">Device Type</h4>
              <div className="flex gap-2">
                <Button
                  onClick={() => setDeviceType('mobile')}
                  variant={deviceType === 'mobile' ? 'default' : 'outline'}
                  size="sm"
                >
                  <Smartphone className="w-4 h-4 mr-1" />
                  Mobile
                </Button>
                <Button
                  onClick={() => setDeviceType('tablet')}
                  variant={deviceType === 'tablet' ? 'default' : 'outline'}
                  size="sm"
                >
                  <Monitor className="w-4 h-4 mr-1" />
                  Tablet
                </Button>
                <Button
                  onClick={() => setDeviceType('desktop')}
                  variant={deviceType === 'desktop' ? 'default' : 'outline'}
                  size="sm"
                >
                  <Monitor className="w-4 h-4 mr-1" />
                  Desktop
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Network Type</h4>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => setNetworkType('wifi')}
                  variant={networkType === 'wifi' ? 'default' : 'outline'}
                  size="sm"
                >
                  <Wifi className="w-4 h-4 mr-1" />
                  WiFi
                </Button>
                <Button
                  onClick={() => setNetworkType('4g')}
                  variant={networkType === '4g' ? 'default' : 'outline'}
                  size="sm"
                >
                  4G
                </Button>
                <Button
                  onClick={() => setNetworkType('3g')}
                  variant={networkType === '3g' ? 'default' : 'outline'}
                  size="sm"
                >
                  3G
                </Button>
                <Button
                  onClick={() => setNetworkType('offline')}
                  variant={networkType === 'offline' ? 'default' : 'outline'}
                  size="sm"
                >
                  <WifiOff className="w-4 h-4 mr-1" />
                  Offline
                </Button>
              </div>
            </div>
          </div>

          <Card className="mt-6 p-4 bg-muted">
            <h4 className="font-medium mb-3">Network Profile</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Speed</p>
                <p className="font-medium">{networkProfiles[networkType].speed}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Latency</p>
                <p className="font-medium">{networkProfiles[networkType].latency}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Reliability</p>
                <p className="font-medium">{networkProfiles[networkType].reliability}</p>
              </div>
            </div>
          </Card>
        </Card>
      </div>
    );
  },
};