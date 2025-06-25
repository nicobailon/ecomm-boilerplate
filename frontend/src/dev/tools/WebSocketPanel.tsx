import React, { useState } from 'react';
import { useWebSocketSimulator, ConnectionState, ConnectionQuality, WebSocketMessage } from '@/mocks/utils/websocket-simulator-hook';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wifi, WifiOff, Send, Trash2, RefreshCw, Zap, Clock, AlertCircle } from 'lucide-react';

interface WebSocketPanelProps {
  onMessage?: (message: WebSocketMessage) => void;
}

export const WebSocketPanel: React.FC<WebSocketPanelProps> = ({ onMessage }) => {
  const {
    state,
    connect,
    disconnect,
    sendMessage,
    simulateIncomingMessage,
    setConnectionQuality,
    flushMessageQueue,
    clearHistory,
    attemptReconnect,
  } = useWebSocketSimulator(
    { autoConnect: false },
    onMessage
  );

  const [messageType, setMessageType] = useState('inventory.update');
  const [customData, setCustomData] = useState('{}');

  const connectionStateColors: Record<ConnectionState, string> = {
    disconnected: 'bg-gray-500',
    connecting: 'bg-yellow-500',
    connected: 'bg-green-500',
    reconnecting: 'bg-orange-500',
    error: 'bg-red-500',
  };

  const qualityColors: Record<ConnectionQuality, string> = {
    excellent: 'text-green-600',
    good: 'text-blue-600',
    poor: 'text-orange-600',
    unstable: 'text-red-600',
  };

  const predefinedMessages = [
    { type: 'inventory.update', label: 'Inventory Update', data: { productId: '123', quantity: 5 } },
    { type: 'cart.update', label: 'Cart Update', data: { action: 'add', productId: '456', quantity: 1 } },
    { type: 'price.change', label: 'Price Change', data: { productId: '789', oldPrice: 99.99, newPrice: 79.99 } },
    { type: 'user.notification', label: 'User Notification', data: { message: 'Your order has been shipped!' } },
    { type: 'system.maintenance', label: 'System Maintenance', data: { scheduled: '2024-12-25T00:00:00Z', duration: '2h' } },
  ];

  const handleSendMessage = (type: string, data: unknown) => {
    const messageId = sendMessage({ type, data });
    if (messageId) {
      console.log(`Message sent: ${messageId}`);
    }
  };

  const handleSendCustomMessage = () => {
    try {
      const data = JSON.parse(customData);
      handleSendMessage(messageType, data);
    } catch (error) {
      console.error('Invalid JSON data:', error);
    }
  };

  const handleSimulateIncoming = (type: string, data: unknown) => {
    simulateIncomingMessage({ type, data });
  };

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">WebSocket Connection</h3>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${connectionStateColors[state.connectionState]}`} />
            <span className="text-sm capitalize">{state.connectionState}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Quality:</span>
              <span className={`text-sm font-medium ${qualityColors[state.quality]}`}>
                {state.quality}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Uptime:</span>
              <span className="text-sm">{state.stats.uptime}s</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Avg Latency:</span>
              <span className="text-sm">{state.stats.avgLatency}ms</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Messages:</span>
              <span className="text-sm">{state.stats.totalMessages}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Dropped:</span>
              <span className="text-sm text-red-600">{state.stats.droppedMessages}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Queued:</span>
              <span className="text-sm">{state.messageQueue.length}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {state.connectionState === 'disconnected' ? (
            <Button onClick={connect} size="sm" className="flex-1">
              <Wifi className="w-4 h-4 mr-2" />
              Connect
            </Button>
          ) : (
            <Button onClick={disconnect} size="sm" variant="destructive" className="flex-1">
              <WifiOff className="w-4 h-4 mr-2" />
              Disconnect
            </Button>
          )}
          <Button 
            onClick={attemptReconnect} 
            size="sm" 
            variant="outline"
            disabled={state.connectionState === 'connected'}
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </Card>

      {/* Connection Quality Control */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Connection Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Connection Quality</label>
            <Select
              value={state.quality}
              onChange={(e) => setConnectionQuality(e.target.value as ConnectionQuality)}
              options={[
                { value: 'excellent', label: 'Excellent' },
                { value: 'good', label: 'Good' },
                { value: 'poor', label: 'Poor' },
                { value: 'unstable', label: 'Unstable' }
              ]}
            />
          </div>
          {state.messageQueue.length > 0 && (
            <Button onClick={flushMessageQueue} size="sm" variant="outline" className="w-full">
              <Send className="w-4 h-4 mr-2" />
              Flush Message Queue ({state.messageQueue.length})
            </Button>
          )}
        </div>
      </Card>

      {/* Message Controls */}
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Message Controls</h3>
        
        <Tabs defaultValue="predefined" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="predefined">Predefined</TabsTrigger>
            <TabsTrigger value="custom">Custom</TabsTrigger>
          </TabsList>
          
          <TabsContent value="predefined" className="space-y-2 mt-4">
            <h4 className="text-sm font-medium mb-2">Send Message:</h4>
            {predefinedMessages.map((msg) => (
              <Button
                key={msg.type}
                onClick={() => handleSendMessage(msg.type, msg.data)}
                variant="outline"
                size="sm"
                className="w-full justify-start"
                disabled={state.connectionState !== 'connected'}
              >
                <Zap className="w-4 h-4 mr-2" />
                {msg.label}
              </Button>
            ))}
            
            <h4 className="text-sm font-medium mt-4 mb-2">Simulate Incoming:</h4>
            {predefinedMessages.map((msg) => (
              <Button
                key={`incoming-${msg.type}`}
                onClick={() => handleSimulateIncoming(msg.type, msg.data)}
                variant="outline"
                size="sm"
                className="w-full justify-start"
                disabled={state.connectionState !== 'connected'}
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                {msg.label} (Incoming)
              </Button>
            ))}
          </TabsContent>
          
          <TabsContent value="custom" className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Message Type</label>
              <input
                type="text"
                value={messageType}
                onChange={(e) => setMessageType(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm"
                placeholder="e.g., inventory.update"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Data (JSON)</label>
              <textarea
                value={customData}
                onChange={(e) => setCustomData(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm font-mono"
                rows={4}
                placeholder='{"key": "value"}'
              />
            </div>
            <Button
              onClick={handleSendCustomMessage}
              size="sm"
              className="w-full"
              disabled={state.connectionState !== 'connected'}
            >
              <Send className="w-4 h-4 mr-2" />
              Send Custom Message
            </Button>
          </TabsContent>
        </Tabs>
      </Card>

      {/* Message History */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Message History</h3>
          <Button onClick={clearHistory} size="sm" variant="ghost">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
        
        <Tabs defaultValue="sent" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sent">Sent ({state.sentMessages.length})</TabsTrigger>
            <TabsTrigger value="received">Received ({state.receivedMessages.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="sent">
            <div className="h-48 w-full overflow-auto">
              <div className="space-y-2">
                {state.sentMessages.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No messages sent</p>
                ) : (
                  state.sentMessages.map((msg) => (
                    <div key={msg.id} className="p-2 bg-gray-50 rounded-md text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant="outline" className="text-xs">
                          {msg.type}
                        </Badge>
                        <span className="text-gray-500">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <pre className="text-xs overflow-auto">
                        {JSON.stringify(msg.data, null, 2)}
                      </pre>
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="received">
            <div className="h-48 w-full overflow-auto">
              <div className="space-y-2">
                {state.receivedMessages.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No messages received</p>
                ) : (
                  state.receivedMessages.map((msg) => (
                    <div key={msg.id} className="p-2 bg-blue-50 rounded-md text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant="outline" className="text-xs">
                          {msg.type}
                        </Badge>
                        <span className="text-gray-500">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <pre className="text-xs overflow-auto">
                        {JSON.stringify(msg.data, null, 2)}
                      </pre>
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};