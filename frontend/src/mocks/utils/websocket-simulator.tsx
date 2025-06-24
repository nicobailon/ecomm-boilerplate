import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Wifi, 
  WifiOff, 
  AlertCircle, 
  RefreshCw, 
  Play, 
  Pause, 
  Clock,
  MessageSquare,
} from 'lucide-react';
import type { ConnectionState, ConnectionQuality, useWebSocketSimulator } from './websocket-simulator-hook';

// Re-export everything from the hook file
export { 
  useWebSocketSimulator,
  type ConnectionState,
  type ConnectionQuality,
  type WebSocketMessage,
  type WebSocketSimulatorConfig,
  type WebSocketSimulatorState,
} from './websocket-simulator-hook';

export interface WebSocketSimulatorUIProps {
  simulator: ReturnType<typeof useWebSocketSimulator>;
  showControls?: boolean;
  showStats?: boolean;
  showMessages?: boolean;
  compact?: boolean;
}

export const WebSocketSimulatorUI: React.FC<WebSocketSimulatorUIProps> = ({
  simulator,
  showControls = true,
  showStats = true,
  showMessages = true,
  compact = false,
}) => {
  const { state, connect, disconnect, setConnectionQuality, flushMessageQueue, clearHistory } = simulator;

  const getConnectionColor = (connectionState: ConnectionState) => {
    switch (connectionState) {
      case 'connected': return 'text-green-600 border-green-200 bg-green-50';
      case 'connecting': return 'text-blue-600 border-blue-200 bg-blue-50';
      case 'reconnecting': return 'text-yellow-600 border-yellow-200 bg-yellow-50';
      case 'error': return 'text-red-600 border-red-200 bg-red-50';
      default: return 'text-gray-600 border-gray-200 bg-gray-50';
    }
  };

  const getQualityColor = (quality: ConnectionQuality) => {
    switch (quality) {
      case 'excellent': return 'bg-green-500';
      case 'good': return 'bg-blue-500';
      case 'poor': return 'bg-yellow-500';
      case 'unstable': return 'bg-red-500';
    }
  };

  if (compact) {
    return (
      <Card className={`p-3 ${getConnectionColor(state.connectionState)}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {state.connectionState === 'connected' ? (
              <Wifi className="w-4 h-4" />
            ) : state.connectionState === 'connecting' || state.connectionState === 'reconnecting' ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <WifiOff className="w-4 h-4" />
            )}
            <span className="text-sm font-medium capitalize">{state.connectionState}</span>
            <Badge variant="secondary" className="text-xs">
              {state.quality}
            </Badge>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MessageSquare className="w-3 h-3" />
            {state.stats.totalMessages}
            {state.messageQueue.length > 0 && (
              <span className="ml-1 text-orange-600">+{state.messageQueue.length} queued</span>
            )}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <div className="space-y-4">
        {/* Connection Status */}
        <div className={`p-3 border rounded-lg ${getConnectionColor(state.connectionState)}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {state.connectionState === 'connected' ? (
                <Wifi className="w-5 h-5" />
              ) : state.connectionState === 'connecting' || state.connectionState === 'reconnecting' ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : state.connectionState === 'error' ? (
                <AlertCircle className="w-5 h-5" />
              ) : (
                <WifiOff className="w-5 h-5" />
              )}
              <div>
                <span className="font-medium capitalize">{state.connectionState}</span>
                {state.connectionState === 'connected' && (
                  <div className="text-sm opacity-75">
                    Uptime: {Math.floor(state.stats.uptime / 60)}m {state.stats.uptime % 60}s
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${getQualityColor(state.quality)}`} />
                <span className="text-sm font-medium capitalize">{state.quality}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        {showControls && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={connect}
                disabled={state.connectionState === 'connected' || state.connectionState === 'connecting'}
              >
                <Play className="w-3 h-3 mr-1" />
                Connect
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={disconnect}
                disabled={state.connectionState === 'disconnected'}
              >
                <Pause className="w-3 h-3 mr-1" />
                Disconnect
              </Button>
              {state.messageQueue.length > 0 && (
                <Button size="sm" variant="outline" onClick={flushMessageQueue}>
                  Flush Queue ({state.messageQueue.length})
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={clearHistory}>
                Clear History
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Quality:</label>
              <select
                value={state.quality}
                onChange={(e) => setConnectionQuality(e.target.value as ConnectionQuality)}
                className="text-sm border rounded px-2 py-1"
              >
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="poor">Poor</option>
                <option value="unstable">Unstable</option>
              </select>
            </div>
          </div>
        )}

        {/* Message Queue Alert */}
        {state.messageQueue.length > 0 && (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              {state.messageQueue.length} messages queued for transmission
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="stats" className="w-full">
          <TabsList>
            {showStats && <TabsTrigger value="stats">Stats</TabsTrigger>}
            {showMessages && <TabsTrigger value="messages">Messages</TabsTrigger>}
          </TabsList>
          
          {showStats && (
            <TabsContent value="stats" className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-lg font-semibold">{state.stats.totalMessages}</div>
                  <div className="text-sm text-muted-foreground">Total Messages</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-lg font-semibold">{state.stats.droppedMessages}</div>
                  <div className="text-sm text-muted-foreground">Dropped</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-lg font-semibold">{Math.round(state.stats.avgLatency)}ms</div>
                  <div className="text-sm text-muted-foreground">Avg Latency</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-lg font-semibold">{state.stats.reconnectCount}</div>
                  <div className="text-sm text-muted-foreground">Reconnects</div>
                </div>
              </div>
            </TabsContent>
          )}
          
          {showMessages && (
            <TabsContent value="messages" className="space-y-3">
              <div className="max-h-48 overflow-y-auto space-y-2">
                {[...state.receivedMessages.slice(-10), ...state.sentMessages.slice(-10)]
                  .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
                  .map(message => (
                    <div key={message.id} className="text-xs p-2 bg-muted rounded">
                      <div className="flex justify-between items-center">
                        <span className={`font-medium ${
                          message.direction === 'incoming' ? 'text-blue-600' : 'text-green-600'
                        }`}>
                          {message.direction === 'incoming' ? '↓' : '↑'} {message.type}
                        </span>
                        <span className="text-muted-foreground">
                          {message.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      {message.acknowledged && (
                        <div className="text-green-600 text-xs">✓ Acknowledged</div>
                      )}
                    </div>
                  ))}
                {state.receivedMessages.length === 0 && state.sentMessages.length === 0 && (
                  <div className="text-center text-muted-foreground py-4">
                    No messages yet
                  </div>
                )}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </Card>
  );
};