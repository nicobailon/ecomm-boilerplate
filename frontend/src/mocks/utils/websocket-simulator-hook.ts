import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';
export type ConnectionQuality = 'excellent' | 'good' | 'poor' | 'unstable';

export interface WebSocketMessage {
  id: string;
  type: string;
  data: unknown;
  timestamp: Date;
  direction: 'incoming' | 'outgoing';
  acknowledged?: boolean;
}

export interface WebSocketSimulatorConfig {
  autoConnect?: boolean;
  reconnectAttempts?: number;
  messageDelay?: number;
  dropRate?: number;
  enableHeartbeat?: boolean;
  heartbeatInterval?: number;
  maxQueueSize?: number;
  connectionQuality?: ConnectionQuality;
}

export interface WebSocketSimulatorState {
  connectionState: ConnectionState;
  quality: ConnectionQuality;
  messageQueue: WebSocketMessage[];
  sentMessages: WebSocketMessage[];
  receivedMessages: WebSocketMessage[];
  stats: {
    totalMessages: number;
    droppedMessages: number;
    avgLatency: number;
    uptime: number;
    reconnectCount: number;
  };
  isActive: boolean;
}

export const useWebSocketSimulator = (
  config: WebSocketSimulatorConfig = {},
  onMessage?: (message: WebSocketMessage) => void,
  onStateChange?: (state: WebSocketSimulatorState) => void,
) => {
  const {
    autoConnect = true,
    reconnectAttempts = 3,
    messageDelay: _messageDelay = 100,
    dropRate: _dropRate = 0,
    enableHeartbeat = true,
    heartbeatInterval = 30000,
    maxQueueSize = 100,
    connectionQuality = 'excellent',
  } = config;

  const [state, setState] = useState<WebSocketSimulatorState>({
    connectionState: 'disconnected',
    quality: connectionQuality,
    messageQueue: [],
    sentMessages: [],
    receivedMessages: [],
    stats: {
      totalMessages: 0,
      droppedMessages: 0,
      avgLatency: 50,
      uptime: 0,
      reconnectCount: 0,
    },
    isActive: false,
  });

  const startTimeRef = useRef<Date | null>(null);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const functionsRef = useRef<{
    connect: () => void;
    sendMessage: (data: { type: string; data: unknown }) => string | null;
    attemptReconnect: () => void;
  }>({
    connect: () => { /* Initial no-op */ },
    sendMessage: () => null,
    attemptReconnect: () => { /* Initial no-op */ },
  });

  const updateState = useCallback((updates: Partial<WebSocketSimulatorState>) => {
    setState(prev => {
      const newState = { ...prev, ...updates };
      onStateChange?.(newState);
      return newState;
    });
  }, [onStateChange]);

  const getLatencyForQuality = (quality: ConnectionQuality): number => {
    const latencies = {
      excellent: 50,
      good: 150,
      poor: 500,
      unstable: Math.random() * 1000 + 200,
    };
    return latencies[quality];
  };

  const getDropRateForQuality = (quality: ConnectionQuality): number => {
    const dropRates = {
      excellent: 0,
      good: 0.01,
      poor: 0.05,
      unstable: 0.15,
    };
    return dropRates[quality];
  };

  // Define core functions that will be stored in ref
  const createFunctions = useCallback(() => {
    const connect = () => {
      updateState({ connectionState: 'connecting' });
      
      const connectionDelay = getLatencyForQuality(state.quality);
      
      setTimeout(() => {
        if (Math.random() > 0.1) { // 90% success rate
          updateState({ 
            connectionState: 'connected',
            isActive: true,
          });
          startTimeRef.current = new Date();
          toast.success('WebSocket connected');
          
          // Start heartbeat
          if (enableHeartbeat) {
            heartbeatRef.current = setInterval(() => {
              functionsRef.current.sendMessage({
                type: 'heartbeat',
                data: { timestamp: Date.now() },
              });
            }, heartbeatInterval);
          }
        } else {
          updateState({ connectionState: 'error' });
          toast.error('Connection failed');
          functionsRef.current.attemptReconnect();
        }
      }, connectionDelay);
    };

    const sendMessage = (data: { type: string; data: unknown }) => {
      if (state.connectionState !== 'connected') {
        // Queue message for later
        const queuedMessage: WebSocketMessage = {
          id: Date.now().toString(),
          type: data.type,
          data: data.data,
          timestamp: new Date(),
          direction: 'outgoing',
          acknowledged: false,
        };

        updateState({
          messageQueue: [...state.messageQueue.slice(-maxQueueSize + 1), queuedMessage],
        });
        
        toast.warning('Message queued - not connected');
        return queuedMessage.id;
      }

      const message: WebSocketMessage = {
        id: Date.now().toString(),
        type: data.type,
        data: data.data,
        timestamp: new Date(),
        direction: 'outgoing',
        acknowledged: false,
      };

      // Simulate message transmission
      const currentDropRate = getDropRateForQuality(state.quality);
      const latency = getLatencyForQuality(state.quality);
      
      if (Math.random() < currentDropRate) {
        updateState({
          stats: {
            ...state.stats,
            droppedMessages: state.stats.droppedMessages + 1,
            totalMessages: state.stats.totalMessages + 1,
          },
        });
        toast.error('Message dropped due to poor connection');
        return null;
      }

      setTimeout(() => {
        const acknowledgedMessage = { ...message, acknowledged: true };
        
        updateState({
          sentMessages: [...state.sentMessages.slice(-99), acknowledgedMessage],
          stats: {
            ...state.stats,
            totalMessages: state.stats.totalMessages + 1,
            avgLatency: (state.stats.avgLatency + latency) / 2,
          },
        });

        // Simulate server response for certain message types
        if (data.type === 'inventory.update' || data.type === 'cart.update') {
          setTimeout(() => {
            const responseMessage: WebSocketMessage = {
              id: (Date.now() + 1).toString(),
              type: `${data.type}.ack`,
              data: { success: true, messageId: message.id },
              timestamp: new Date(),
              direction: 'incoming',
              acknowledged: true,
            };
            
            updateState({
              receivedMessages: [...state.receivedMessages.slice(-99), responseMessage],
            });
            
            onMessage?.(responseMessage);
          }, latency / 2);
        }
      }, latency);

      return message.id;
    };

    const attemptReconnect = () => {
      if (state.stats.reconnectCount >= reconnectAttempts) {
        updateState({ connectionState: 'error' });
        toast.error(`Failed to reconnect after ${reconnectAttempts} attempts`);
        return;
      }

      updateState({ 
        connectionState: 'reconnecting',
        stats: {
          ...state.stats,
          reconnectCount: state.stats.reconnectCount + 1,
        },
      });

      const delay = Math.pow(2, state.stats.reconnectCount) * 1000; // Exponential backoff
      
      reconnectTimeoutRef.current = setTimeout(() => {
        functionsRef.current.connect();
      }, delay);
      
      toast.info(`Reconnecting in ${delay / 1000}s (attempt ${state.stats.reconnectCount + 1}/${reconnectAttempts})`);
    };

    return { connect, sendMessage, attemptReconnect };
  }, [state, enableHeartbeat, heartbeatInterval, maxQueueSize, onMessage, reconnectAttempts, updateState]);

  // Update function references when dependencies change
  useEffect(() => {
    functionsRef.current = createFunctions();
  }, [createFunctions]);

  const connect = useCallback(() => functionsRef.current.connect(), []);
  const sendMessage = useCallback((data: { type: string; data: unknown }) => functionsRef.current.sendMessage(data), []);
  const attemptReconnect = useCallback(() => functionsRef.current.attemptReconnect(), []);

  const disconnect = useCallback(() => {
    updateState({ 
      connectionState: 'disconnected',
      isActive: false,
    });
    
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    startTimeRef.current = null;
    toast.info('WebSocket disconnected');
  }, [updateState]);

  const simulateIncomingMessage = useCallback((data: { type: string; data: unknown }) => {
    if (state.connectionState !== 'connected') return;

    const message: WebSocketMessage = {
      id: Date.now().toString(),
      type: data.type,
      data: data.data,
      timestamp: new Date(),
      direction: 'incoming',
      acknowledged: true,
    };

    updateState({
      receivedMessages: [...state.receivedMessages.slice(-99), message],
      stats: {
        ...state.stats,
        totalMessages: state.stats.totalMessages + 1,
      },
    });

    onMessage?.(message);
  }, [state.connectionState, state.receivedMessages, state.stats, onMessage, updateState]);

  const setConnectionQuality = useCallback((quality: ConnectionQuality) => {
    updateState({ quality });
    
    if (quality === 'unstable') {
      // Randomly disconnect/reconnect for unstable connection
      const interval = setInterval(() => {
        if (Math.random() > 0.7) {
          if (state.connectionState === 'connected') {
            disconnect();
            setTimeout(connect, 2000);
          }
        }
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [state.connectionState, connect, disconnect, updateState]);

  const flushMessageQueue = useCallback(() => {
    if (state.connectionState !== 'connected' || state.messageQueue.length === 0) return;

    state.messageQueue.forEach(message => {
      sendMessage({ type: message.type, data: message.data });
    });

    updateState({ messageQueue: [] });
    toast.success(`Flushed ${state.messageQueue.length} queued messages`);
  }, [state.connectionState, state.messageQueue, sendMessage, updateState]);

  const clearHistory = useCallback(() => {
    updateState({
      sentMessages: [],
      receivedMessages: [],
      stats: {
        totalMessages: 0,
        droppedMessages: 0,
        avgLatency: 50,
        uptime: 0,
        reconnectCount: 0,
      },
    });
  }, [updateState]);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }
    
    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  // Update uptime
  useEffect(() => {
    if (state.connectionState === 'connected' && startTimeRef.current) {
      const interval = setInterval(() => {
        const uptime = startTimeRef.current 
          ? Math.floor((Date.now() - startTimeRef.current.getTime()) / 1000)
          : 0;
        updateState({
          stats: { ...state.stats, uptime },
        });
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [state.connectionState, state.stats, updateState]);

  return {
    state,
    connect,
    disconnect,
    sendMessage,
    simulateIncomingMessage,
    setConnectionQuality,
    flushMessageQueue,
    clearHistory,
    attemptReconnect,
  };
};