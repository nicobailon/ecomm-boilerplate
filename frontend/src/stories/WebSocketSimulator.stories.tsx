import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Toaster, toast } from 'sonner';
import { useWebSocketSimulator, WebSocketSimulatorUI, type WebSocketMessage } from '@/mocks/utils/websocket-simulator';
import { 
  ShoppingCart, 
  Package, 
  TrendingUp, 
  Users,
  Activity,
  MessageSquare,
  Zap,
} from 'lucide-react';

// Create a mock simulator for stories that don't need interactivity
const createMockSimulator = () => ({
  state: {
    connectionState: 'connected' as const,
    quality: 'excellent' as const,
    messageQueue: [],
    sentMessages: [],
    receivedMessages: [],
    stats: {
      totalMessages: 0,
      droppedMessages: 0,
      avgLatency: 0,
      uptime: 0,
      reconnectCount: 0,
    },
    isActive: true,
  },
  connect: () => { /* Mock implementation */ },
  disconnect: () => { /* Mock implementation */ },
  sendMessage: () => null,
  simulateIncomingMessage: () => { /* Mock implementation */ },
  setConnectionQuality: () => undefined,
  flushMessageQueue: () => { /* Mock implementation */ },
  reconnect: () => { /* Mock implementation */ },
  attemptReconnect: () => { /* Mock implementation */ },
  clearHistory: () => { /* Mock implementation */ },
});

const meta = {
  title: 'Mocks/WebSocketSimulator',
  component: WebSocketSimulatorUI,
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    simulator: { control: false },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof WebSocketSimulatorUI>;

export default meta;
type Story = StoryObj<typeof meta>;

export const BasicSimulator: Story = {
  args: {
    simulator: createMockSimulator(),
  },
  render: () => {
    const simulator = useWebSocketSimulator();
    
    return (
      <div className="space-y-4">
        <WebSocketSimulatorUI simulator={simulator} />
        <Toaster position="top-right" />
      </div>
    );
  },
};

export const CompactMode: Story = {
  args: {
    simulator: createMockSimulator(),
  },
  render: () => {
    const simulator = useWebSocketSimulator({
      autoConnect: true,
      connectionQuality: 'good',
    });
    
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Compact WebSocket Status</h3>
        <WebSocketSimulatorUI simulator={simulator} compact />
        <Toaster position="top-right" />
      </div>
    );
  },
};

export const InventoryUpdateSimulation: Story = {
  args: {
    simulator: createMockSimulator(),
  },
  render: () => {
    const [inventoryUpdates, setInventoryUpdates] = useState<any[]>([]);
    
    const simulator = useWebSocketSimulator(
      {
        autoConnect: true,
        connectionQuality: 'excellent',
        enableHeartbeat: true,
      },
      (message: WebSocketMessage) => {
        if (message.type.startsWith('inventory.')) {
          setInventoryUpdates(prev => [...prev.slice(-9), {
            id: message.id,
            type: message.type,
            data: message.data,
            timestamp: message.timestamp,
          }]);
        }
      },
    );
    
    const sendInventoryUpdate = () => {
      const products = ['prod1', 'prod2', 'prod3', 'prod4'];
      const productId = products[Math.floor(Math.random() * products.length)];
      const newStock = Math.floor(Math.random() * 50);
      
      simulator.sendMessage({
        type: 'inventory.update',
        data: {
          productId,
          stock: newStock,
          timestamp: Date.now(),
        },
      });
    };
    
    const simulateExternalUpdate = () => {
      const products = ['prod1', 'prod2', 'prod3', 'prod4'];
      const productId = products[Math.floor(Math.random() * products.length)];
      const newStock = Math.floor(Math.random() * 50);
      
      simulator.simulateIncomingMessage({
        type: 'inventory.stock_changed',
        data: {
          productId,
          stock: newStock,
          changedBy: 'other_user',
          reason: 'external_update',
        },
      });
    };
    
    return (
      <div className="space-y-4">
        <WebSocketSimulatorUI simulator={simulator} />
        
        <Card className="p-4">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Package className="w-4 h-4" />
            Inventory Management Demo
          </h4>
          <div className="flex gap-2 mb-4">
            <Button onClick={sendInventoryUpdate}>
              Send Inventory Update
            </Button>
            <Button variant="outline" onClick={simulateExternalUpdate}>
              Simulate External Update
            </Button>
          </div>
          
          {inventoryUpdates.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-sm font-medium">Recent Inventory Updates:</h5>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {inventoryUpdates.slice(-10).reverse().map(update => (
                  <div key={update.id} className="text-xs p-2 bg-muted rounded">
                    <div className="flex justify-between">
                      <span className="font-medium">{update.type}</span>
                      <span className="text-muted-foreground">
                        {update.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-muted-foreground">
                      Product: {update.data.productId}, Stock: {update.data.stock}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
        
        <Toaster position="top-right" />
      </div>
    );
  },
};

export const MultiUserCartSync: Story = {
  args: {
    simulator: createMockSimulator(),
  },
  render: () => {
    const [cartEvents, setCartEvents] = useState<any[]>([]);
    const [currentCart, setCurrentCart] = useState({
      items: [],
      total: 0,
      lastUpdated: new Date(),
    });
    
    const simulator = useWebSocketSimulator(
      {
        autoConnect: true,
        connectionQuality: 'good',
        enableHeartbeat: true,
      },
      (message: WebSocketMessage) => {
        if (message.type.startsWith('cart.')) {
          setCartEvents(prev => [...prev.slice(-9), {
            id: message.id,
            type: message.type,
            data: message.data,
            timestamp: message.timestamp,
          }]);
          
          if (message.type === 'cart.item_added' || message.type === 'cart.item_removed') {
            setCurrentCart(prev => ({
              ...prev,
              lastUpdated: new Date(),
            }));
          }
        }
      },
    );
    
    const addToCart = () => {
      const productId = `prod${Math.floor(Math.random() * 5) + 1}`;
      const quantity = Math.floor(Math.random() * 3) + 1;
      
      simulator.sendMessage({
        type: 'cart.add_item',
        data: {
          productId,
          quantity,
          userId: 'current_user',
        },
      });
    };
    
    const simulateOtherUserAction = () => {
      const actions = ['cart.item_added', 'cart.item_removed', 'cart.quantity_changed'];
      const action = actions[Math.floor(Math.random() * actions.length)];
      
      simulator.simulateIncomingMessage({
        type: action,
        data: {
          productId: `prod${Math.floor(Math.random() * 5) + 1}`,
          quantity: Math.floor(Math.random() * 3) + 1,
          userId: 'other_user',
          conflicts: action === 'cart.item_removed' ? ['quantity_mismatch'] : undefined,
        },
      });
    };
    
    return (
      <div className="space-y-4">
        <WebSocketSimulatorUI simulator={simulator} />
        
        <Card className="p-4">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" />
            Multi-User Cart Synchronization
          </h4>
          <div className="flex gap-2 mb-4">
            <Button onClick={addToCart}>
              Add to My Cart
            </Button>
            <Button variant="outline" onClick={simulateOtherUserAction}>
              Simulate Other User Action
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h5 className="text-sm font-medium mb-2">Cart Status</h5>
              <div className="p-3 bg-muted rounded">
                <div className="text-sm">
                  <div>Items: {currentCart.items.length}</div>
                  <div>Total: ${currentCart.total.toFixed(2)}</div>
                  <div className="text-muted-foreground">
                    Last updated: {currentCart.lastUpdated.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h5 className="text-sm font-medium mb-2">Recent Events</h5>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {cartEvents.slice(-5).reverse().map(event => (
                  <div key={event.id} className="text-xs p-2 bg-muted rounded">
                    <div className="flex justify-between">
                      <span className="font-medium">{event.type}</span>
                      <Badge variant="secondary" className="text-xs">
                        {event.data.userId === 'current_user' ? 'You' : 'Other'}
                      </Badge>
                    </div>
                    {event.data.conflicts && (
                      <div className="text-orange-600">
                        ⚠️ Conflict: {event.data.conflicts.join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
        
        <Toaster position="top-right" />
      </div>
    );
  },
};

export const ConnectionQualityTest: Story = {
  args: {
    simulator: createMockSimulator(),
  },
  render: () => {
    const [_messages, setMessages] = useState<any[]>([]);
    const [testResults, setTestResults] = useState<{
      quality: string;
      successRate: number;
      avgLatency: number;
      duration: number;
    }[]>([]);
    
    const simulator = useWebSocketSimulator(
      {
        autoConnect: false,
        connectionQuality: 'excellent',
      },
      (message: WebSocketMessage) => {
        setMessages(prev => [...prev.slice(-19), message]);
      },
    );
    
    const runQualityTest = async (quality: 'excellent' | 'good' | 'poor' | 'unstable') => {
      setTestResults([]);
      setMessages([]);
      
      simulator.setConnectionQuality(quality);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (simulator.state.connectionState !== 'connected') {
        simulator.connect();
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      const startTime = Date.now();
      const testMessages = 20;
      const results = [];
      
      for (let i = 0; i < testMessages; i++) {
        const messageId = simulator.sendMessage({
          type: 'test.message',
          data: { index: i, timestamp: Date.now() },
        });
        
        if (messageId) {
          results.push({ sent: true, timestamp: Date.now() });
        } else {
          results.push({ sent: false, timestamp: Date.now() });
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      const successRate = (results.filter(r => r.sent).length / testMessages) * 100;
      
      setTestResults(prev => [...prev, {
        quality,
        duration,
        successRate,
        totalMessages: testMessages,
        droppedMessages: simulator.state.stats.droppedMessages,
        avgLatency: simulator.state.stats.avgLatency,
      }]);
      
      toast.info(`${quality} test completed: ${successRate.toFixed(1)}% success rate`);
    };
    
    return (
      <div className="space-y-4">
        <WebSocketSimulatorUI simulator={simulator} />
        
        <Card className="p-4">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Connection Quality Testing
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
            <Button size="sm" onClick={() => runQualityTest('excellent')}>
              Test Excellent
            </Button>
            <Button size="sm" onClick={() => runQualityTest('good')}>
              Test Good
            </Button>
            <Button size="sm" onClick={() => runQualityTest('poor')}>
              Test Poor
            </Button>
            <Button size="sm" onClick={() => runQualityTest('unstable')}>
              Test Unstable
            </Button>
          </div>
          
          {testResults.length > 0 && (
            <div className="space-y-3">
              <h5 className="text-sm font-medium">Test Results</h5>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Quality</th>
                      <th className="text-left p-2">Success Rate</th>
                      <th className="text-left p-2">Avg Latency</th>
                      <th className="text-left p-2">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {testResults.map((result, i) => (
                      <tr key={i} className="border-b">
                        <td className="p-2">
                          <Badge variant="secondary">{result.quality}</Badge>
                        </td>
                        <td className="p-2">{result.successRate.toFixed(1)}%</td>
                        <td className="p-2">{Math.round(result.avgLatency)}ms</td>
                        <td className="p-2">{(result.duration / 1000).toFixed(1)}s</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </Card>
        
        <Toaster position="top-right" />
      </div>
    );
  },
};

export const RealtimeAnalytics: Story = {
  args: {
    simulator: createMockSimulator(),
  },
  render: () => {
    const [analyticsData, setAnalyticsData] = useState({
      activeUsers: 0,
      pageViews: 0,
      cartEvents: 0,
      revenue: 0,
    });
    
    const simulator = useWebSocketSimulator(
      {
        autoConnect: true,
        connectionQuality: 'excellent',
        enableHeartbeat: true,
      },
      (message: WebSocketMessage) => {
        if (message.type === 'analytics.update') {
          setAnalyticsData(message.data as typeof analyticsData);
        }
      },
    );
    
    useEffect(() => {
      if (simulator.state.connectionState === 'connected') {
        const interval = setInterval(() => {
          simulator.simulateIncomingMessage({
            type: 'analytics.update',
            data: {
              activeUsers: Math.floor(Math.random() * 100) + 50,
              pageViews: Math.floor(Math.random() * 1000) + 500,
              cartEvents: Math.floor(Math.random() * 50) + 10,
              revenue: Math.floor(Math.random() * 10000) + 5000,
            },
          });
        }, 2000);
        
        return () => clearInterval(interval);
      }
    }, [simulator]);
    
    return (
      <div className="space-y-4">
        <WebSocketSimulatorUI simulator={simulator} compact />
        
        <Card className="p-4">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Real-time Analytics Dashboard
          </h4>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-2xl font-bold">{analyticsData.activeUsers}</div>
              <div className="text-sm text-muted-foreground">Active Users</div>
            </div>
            
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Activity className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-2xl font-bold">{analyticsData.pageViews}</div>
              <div className="text-sm text-muted-foreground">Page Views</div>
            </div>
            
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <ShoppingCart className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-2xl font-bold">{analyticsData.cartEvents}</div>
              <div className="text-sm text-muted-foreground">Cart Events</div>
            </div>
            
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Zap className="w-5 h-5 text-yellow-600" />
              </div>
              <div className="text-2xl font-bold">${analyticsData.revenue.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground">Revenue</div>
            </div>
          </div>
          
          {simulator.state.connectionState !== 'connected' && (
            <Alert className="mt-4">
              <MessageSquare className="h-4 w-4" />
              <AlertDescription>
                Analytics updates paused - WebSocket disconnected
              </AlertDescription>
            </Alert>
          )}
        </Card>
        
        <Toaster position="top-right" />
      </div>
    );
  },
};

export const MessageQueueDemo: Story = {
  args: {
    simulator: createMockSimulator(),
  },
  render: () => {
    const [queuedActions, setQueuedActions] = useState<string[]>([]);
    
    const simulator = useWebSocketSimulator(
      {
        autoConnect: false,
        maxQueueSize: 10,
      },
      (message: WebSocketMessage) => {
        if (message.type.endsWith('.ack')) {
          const data = message.data as { messageId: string };
          toast.success(`Message acknowledged: ${data.messageId}`);
        }
      },
    );
    
    const addAction = (action: string) => {
      setQueuedActions(prev => [...prev, action]);
      simulator.sendMessage({
        type: `action.${action.toLowerCase().replace(' ', '_')}`,
        data: {
          action,
          timestamp: Date.now(),
          userId: 'demo_user',
        },
      });
    };
    
    const actions = [
      'Add to Cart',
      'Update Quantity',
      'Remove Item',
      'Apply Coupon',
      'Update Profile',
      'Save Preferences',
    ];
    
    return (
      <div className="space-y-4">
        <WebSocketSimulatorUI simulator={simulator} />
        
        <Card className="p-4">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Message Queue Demo
          </h4>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
            {actions.map(action => (
              <Button
                key={action}
                size="sm"
                variant="outline"
                onClick={() => addAction(action)}
              >
                {action}
              </Button>
            ))}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h5 className="text-sm font-medium mb-2">Queue Status</h5>
              <div className="p-3 bg-muted rounded">
                <div className="text-sm space-y-1">
                  <div>Queued: {simulator.state.messageQueue.length}</div>
                  <div>Sent: {simulator.state.sentMessages.length}</div>
                  <div>Received: {simulator.state.receivedMessages.length}</div>
                  <div>Dropped: {simulator.state.stats.droppedMessages}</div>
                </div>
              </div>
            </div>
            
            <div>
              <h5 className="text-sm font-medium mb-2">Actions Triggered</h5>
              <div className="max-h-32 overflow-y-auto">
                {queuedActions.slice(-10).reverse().map((action, i) => (
                  <div key={i} className="text-xs p-1 mb-1 bg-muted rounded">
                    {action}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {simulator.state.messageQueue.length > 0 && (
            <Alert className="mt-4">
              <MessageSquare className="h-4 w-4" />
              <AlertDescription>
                {simulator.state.messageQueue.length} messages will be sent when connection is established.
                <Button 
                  size="sm" 
                  className="ml-2" 
                  onClick={simulator.flushMessageQueue}
                  disabled={simulator.state.connectionState !== 'connected'}
                >
                  Flush Now
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </Card>
        
        <Toaster position="top-right" />
      </div>
    );
  },
};