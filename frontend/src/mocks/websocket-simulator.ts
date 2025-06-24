import { EventEmitter } from 'events';

export type WebSocketState = 'CONNECTING' | 'OPEN' | 'CLOSING' | 'CLOSED';

export interface WebSocketMessage {
  id: string;
  type: string;
  data: unknown;
  timestamp: Date;
}

export interface WebSocketSimulatorOptions {
  url: string;
  autoReconnect?: boolean;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
  messageDelay?: number;
  connectionDelay?: number;
  failureRate?: number;
}

export class WebSocketSimulator extends EventEmitter {
  private state: WebSocketState = 'CLOSED';
  private reconnectAttempts = 0;
  private messageQueue: WebSocketMessage[] = [];
  private reconnectTimer?: NodeJS.Timeout;
  private connectionTimer?: NodeJS.Timeout;
  private options: Required<WebSocketSimulatorOptions>;

  constructor(options: WebSocketSimulatorOptions) {
    super();
    this.options = {
      autoReconnect: true,
      reconnectDelay: 1000,
      maxReconnectAttempts: 5,
      messageDelay: 0,
      connectionDelay: 100,
      failureRate: 0,
      ...options,
    };
  }

  connect(): void {
    if (this.state !== 'CLOSED') {
      console.warn('WebSocket is already connected or connecting');
      return;
    }

    this.state = 'CONNECTING';
    this.emit('connecting');

    this.connectionTimer = setTimeout(() => {
      if (Math.random() < this.options.failureRate) {
        this.handleConnectionError();
      } else {
        this.state = 'OPEN';
        this.reconnectAttempts = 0;
        this.emit('open');
        this.flushMessageQueue();
      }
    }, this.options.connectionDelay);
  }

  disconnect(): void {
    if (this.state === 'CLOSED') return;

    this.state = 'CLOSING';
    this.emit('closing');

    if (this.connectionTimer) {
      clearTimeout(this.connectionTimer);
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    setTimeout(() => {
      this.state = 'CLOSED';
      this.emit('close', { code: 1000, reason: 'Normal closure' });
    }, 50);
  }

  send(data: unknown): void {
    const message: WebSocketMessage = {
      id: `msg-${Date.now()}-${Math.random()}`,
      type: (data as { type?: string }).type ?? 'message',
      data,
      timestamp: new Date(),
    };

    if (this.state !== 'OPEN') {
      this.messageQueue.push(message);
      this.emit('queued', message);
      return;
    }

    if (Math.random() < this.options.failureRate) {
      this.emit('error', new Error('Failed to send message'));
      return;
    }

    setTimeout(() => {
      this.emit('message', message);
    }, this.options.messageDelay);
  }

  simulateIncomingMessage(type: string, data: unknown): void {
    if (this.state !== 'OPEN') {
      console.warn('Cannot receive messages when connection is not open');
      return;
    }

    const message: WebSocketMessage = {
      id: `incoming-${Date.now()}-${Math.random()}`,
      type,
      data,
      timestamp: new Date(),
    };

    setTimeout(() => {
      this.emit('message', message);
    }, this.options.messageDelay);
  }

  simulateConnectionDrop(): void {
    if (this.state !== 'OPEN') return;

    this.state = 'CLOSED';
    this.emit('close', { code: 1006, reason: 'Abnormal closure' });

    if (this.options.autoReconnect) {
      this.scheduleReconnect();
    }
  }

  getState(): WebSocketState {
    return this.state;
  }

  getQueueSize(): number {
    return this.messageQueue.length;
  }

  clearQueue(): void {
    this.messageQueue = [];
  }

  private handleConnectionError(): void {
    this.state = 'CLOSED';
    this.emit('error', new Error('Connection failed'));
    this.emit('close', { code: 1006, reason: 'Connection failed' });

    if (this.options.autoReconnect && this.reconnectAttempts < this.options.maxReconnectAttempts) {
      this.scheduleReconnect();
    } else if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      this.emit('maxReconnectAttemptsReached');
    }
  }

  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    const delay = this.options.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    this.emit('reconnectScheduled', { attempt: this.reconnectAttempts, delay });

    this.reconnectTimer = setTimeout(() => {
      this.emit('reconnecting', { attempt: this.reconnectAttempts });
      this.connect();
    }, delay);
  }

  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0 && this.state === 'OPEN') {
      const message = this.messageQueue.shift();
      if (message) {
        this.send(message.data);
      }
    }
  }
}

// Helper function to create a mock WebSocket that simulates real-time updates
export function createMockWebSocket(
  url: string,
  options?: Partial<WebSocketSimulatorOptions>,
): WebSocketSimulator {
  return new WebSocketSimulator({ url, ...options });
}

// Inventory update simulator
export class InventoryWebSocketSimulator extends WebSocketSimulator {
  private updateInterval?: NodeJS.Timeout;
  private productIds: string[] = [];

  constructor(productIds: string[], options?: Partial<WebSocketSimulatorOptions>) {
    super({ url: 'ws://localhost:3000/inventory', ...options });
    this.productIds = productIds;
  }

  startInventoryUpdates(intervalMs = 5000): void {
    this.updateInterval = setInterval(() => {
      if (this.getState() === 'OPEN' && this.productIds.length > 0) {
        const productId = this.productIds[Math.floor(Math.random() * this.productIds.length)];
        const change = Math.floor(Math.random() * 10) - 5; // -5 to +5
        
        this.simulateIncomingMessage('inventory_update', {
          productId,
          change,
          newValue: Math.max(0, Math.floor(Math.random() * 100)),
          timestamp: new Date().toISOString(),
        });
      }
    }, intervalMs);
  }

  stopInventoryUpdates(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = undefined;
    }
  }

  simulateBulkUpdate(updates: { productId: string; newValue: number }[]): void {
    this.simulateIncomingMessage('bulk_inventory_update', {
      updates,
      timestamp: new Date().toISOString(),
    });
  }

  simulateOutOfStock(productId: string): void {
    this.simulateIncomingMessage('out_of_stock', {
      productId,
      timestamp: new Date().toISOString(),
    });
  }

  simulateRestock(productId: string, quantity: number): void {
    this.simulateIncomingMessage('restock', {
      productId,
      quantity,
      timestamp: new Date().toISOString(),
    });
  }
}

// Price update simulator
export class PriceWebSocketSimulator extends WebSocketSimulator {
  private priceUpdateInterval?: NodeJS.Timeout;
  private productIds: string[] = [];

  constructor(productIds: string[], options?: Partial<WebSocketSimulatorOptions>) {
    super({ url: 'ws://localhost:3000/prices', ...options });
    this.productIds = productIds;
  }

  startPriceUpdates(intervalMs = 10000): void {
    this.priceUpdateInterval = setInterval(() => {
      if (this.getState() === 'OPEN' && this.productIds.length > 0) {
        const productId = this.productIds[Math.floor(Math.random() * this.productIds.length)];
        const changePercent = (Math.random() * 10 - 5) / 100; // -5% to +5%
        
        this.simulateIncomingMessage('price_update', {
          productId,
          changePercent,
          newPrice: (Math.random() * 200 + 10).toFixed(2),
          timestamp: new Date().toISOString(),
        });
      }
    }, intervalMs);
  }

  stopPriceUpdates(): void {
    if (this.priceUpdateInterval) {
      clearInterval(this.priceUpdateInterval);
      this.priceUpdateInterval = undefined;
    }
  }

  simulateFlashSale(productIds: string[], discountPercent: number, durationMs: number): void {
    this.simulateIncomingMessage('flash_sale_start', {
      productIds,
      discountPercent,
      endsAt: new Date(Date.now() + durationMs).toISOString(),
    });

    setTimeout(() => {
      this.simulateIncomingMessage('flash_sale_end', {
        productIds,
        timestamp: new Date().toISOString(),
      });
    }, durationMs);
  }
}

// Chat/notification simulator
export class NotificationWebSocketSimulator extends WebSocketSimulator {
  constructor(options?: Partial<WebSocketSimulatorOptions>) {
    super({ url: 'ws://localhost:3000/notifications', ...options });
  }

  simulateOrderUpdate(orderId: string, status: string): void {
    this.simulateIncomingMessage('order_update', {
      orderId,
      status,
      timestamp: new Date().toISOString(),
    });
  }

  simulateNewMessage(from: string, message: string): void {
    this.simulateIncomingMessage('new_message', {
      from,
      message,
      timestamp: new Date().toISOString(),
    });
  }

  simulateSystemAlert(level: 'info' | 'warning' | 'error', message: string): void {
    this.simulateIncomingMessage('system_alert', {
      level,
      message,
      timestamp: new Date().toISOString(),
    });
  }
}

// Collaborative editing simulator
export class CollaborativeWebSocketSimulator extends WebSocketSimulator {
  private users = new Map<string, { name: string; color: string; cursor?: { x: number; y: number } }>();

  constructor(options?: Partial<WebSocketSimulatorOptions>) {
    super({ url: 'ws://localhost:3000/collaborate', ...options });
  }

  simulateUserJoin(userId: string, name: string, color: string): void {
    this.users.set(userId, { name, color });
    this.simulateIncomingMessage('user_joined', {
      userId,
      name,
      color,
      timestamp: new Date().toISOString(),
    });
  }

  simulateUserLeave(userId: string): void {
    const user = this.users.get(userId);
    if (user) {
      this.users.delete(userId);
      this.simulateIncomingMessage('user_left', {
        userId,
        name: user.name,
        timestamp: new Date().toISOString(),
      });
    }
  }

  simulateCursorMove(userId: string, x: number, y: number): void {
    const user = this.users.get(userId);
    if (user) {
      user.cursor = { x, y };
      this.simulateIncomingMessage('cursor_move', {
        userId,
        x,
        y,
        timestamp: new Date().toISOString(),
      });
    }
  }

  simulateTextChange(userId: string, changes: unknown): void {
    this.simulateIncomingMessage('text_change', {
      userId,
      changes,
      timestamp: new Date().toISOString(),
    });
  }

  getActiveUsers(): { userId: string; name: string; color: string }[] {
    return [...this.users.entries()].map(([userId, user]) => ({
      userId,
      name: user.name,
      color: user.color,
    }));
  }
}

// Helper to create different types of WebSocket simulators
export const WebSocketFactory = {
  createInventorySocket: (productIds: string[], options?: Partial<WebSocketSimulatorOptions>) => {
    return new InventoryWebSocketSimulator(productIds, options);
  },

  createPriceSocket: (productIds: string[], options?: Partial<WebSocketSimulatorOptions>) => {
    return new PriceWebSocketSimulator(productIds, options);
  },

  createNotificationSocket: (options?: Partial<WebSocketSimulatorOptions>) => {
    return new NotificationWebSocketSimulator(options);
  },

  createCollaborativeSocket: (options?: Partial<WebSocketSimulatorOptions>) => {
    return new CollaborativeWebSocketSimulator(options);
  },

  createGenericSocket: (url: string, options?: Partial<WebSocketSimulatorOptions>) => {
    return new WebSocketSimulator({ url, ...options });
  },
};