import { Server, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { createLogger } from '../utils/logger.js';
import { redis, isRedisHealthy } from './redis.js';
import { RedisHealthService, withRedisHealth } from './redis-health.js';

// Remove the module declaration as it conflicts with socket.io's built-in types
// We'll use type assertions instead

const logger = createLogger({ service: 'WebSocketService' });

export interface InventoryUpdate {
  productId: string;
  variantId?: string;
  availableStock: number;
  totalStock: number;
  stockStatus: 'in_stock' | 'low_stock' | 'out_of_stock';
  timestamp: number;
}

export interface CartValidation {
  userId: string;
  productId: string;
  variantId?: string;
  requestedQuantity: number;
  availableQuantity: number;
  action: 'reduce' | 'remove' | 'ok';
}

class WebSocketService {
  private io: Server | null = null;
  private pubClient: typeof redis | null = null;
  private subClient: typeof redis | null = null;
  private isRedisConnected = false;
  private pendingPublishes: { channel: string; message: string }[] = [];

  async initialize(httpServer: HTTPServer): Promise<void> {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    // Initialize Redis pub/sub only if Redis is healthy
    if (isRedisHealthy()) {
      try {
        // Use the shared Redis client with duplicate for pub/sub
        this.pubClient = redis.duplicate();
        this.subClient = redis.duplicate();
        
        // Monitor pub client health
        this.pubClient.on('error', (error: Error) => {
          logger.error('[WebSocket] PubClient error:', error);
          this.isRedisConnected = false;
          RedisHealthService.markUnhealthy(error.message);
        });
        
        this.pubClient.on('ready', () => {
          logger.info('[WebSocket] PubClient connected');
          this.isRedisConnected = true;
          // Publish any pending messages
          void this.processPendingPublishes();
        });
        
        // Monitor sub client health
        this.subClient.on('error', (error: Error) => {
          logger.error('[WebSocket] SubClient error:', error);
          this.isRedisConnected = false;
          RedisHealthService.markUnhealthy(error.message);
        });
        
        // Set up message handler before subscribing
        this.subClient.on('message', (channel: string, message: string) => {
          if (channel === 'inventory:updates' && typeof message === 'string') {
            const update = JSON.parse(message) as InventoryUpdate;
            this.broadcastInventoryUpdate(update);
          } else if (channel === 'cart:validation' && typeof message === 'string') {
            const validation = JSON.parse(message) as CartValidation;
            this.sendCartValidation(validation);
          }
        });

        this.subClient.on('ready', async () => {
          logger.info('[WebSocket] SubClient connected');
          try {
            // Subscribe to channels after connection is ready
            if (this.subClient) {
              await this.subClient.subscribe('inventory:updates');
              await this.subClient.subscribe('cart:validation');
              logger.info('[WebSocket] Subscribed to Redis channels');
            }
          } catch (error) {
            logger.error('[WebSocket] Failed to subscribe to channels:', error);
          }
        });
        
        this.isRedisConnected = true;
      } catch (error) {
        logger.error('[WebSocket] Failed to initialize Redis pub/sub:', error);
        this.isRedisConnected = false;
        // Continue without Redis - direct WebSocket only
      }
    } else {
      logger.warn('[WebSocket] Redis unhealthy, running without pub/sub support');
      this.isRedisConnected = false;
    }

    this.io.use((socket: Socket, next: (err?: Error) => void) => {
      try {
        const token = socket.handshake.auth.token as string | undefined;
        if (token && process.env.ACCESS_TOKEN_SECRET) {
          const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET) as { userId: string };
          // Type socket.data properly
          (socket as Socket & { data: { userId: string } }).data = { userId: decoded.userId };
        }
        next();
      } catch {
        next(new Error('Authentication error'));
      }
    });

    this.io.on('connection', (socket: Socket) => {
      // Access userId from socket data safely
      const socketWithData = socket as Socket & { data?: { userId?: string } };
      const userId = socketWithData.data?.userId;
      logger.info('websocket.connection', {
        socketId: socket.id,
        userId,
      });

      // Join user-specific room for authenticated users
      if (userId) {
        void socket.join(`user:${userId}`);
      }

      // Subscribe to product inventory updates
      socket.on('subscribe:inventory', (productIds: string[]) => {
        productIds.forEach(productId => {
          void socket.join(`inventory:${productId}`);
        });
      });

      // Unsubscribe from product inventory updates
      socket.on('unsubscribe:inventory', (productIds: string[]) => {
        productIds.forEach(productId => {
          void socket.leave(`inventory:${productId}`);
        });
      });

      // Subscribe to cart validations for specific user
      if (userId) {
        socket.on('subscribe:cart', () => {
          void socket.join(`cart:${userId}`);
        });
      }

      socket.on('disconnect', () => {
        logger.info('websocket.disconnect', {
          socketId: socket.id,
          userId,
        });
      });
    });

    logger.info('WebSocket service initialized');
  }

  private broadcastInventoryUpdate(update: InventoryUpdate): void {
    if (!this.io) return;

    // Broadcast to all clients watching this product
    this.io.to(`inventory:${update.productId}`).emit('inventory:update', update);
  }

  private sendCartValidation(validation: CartValidation): void {
    if (!this.io) return;

    // Send to specific user's cart room
    this.io.to(`cart:${validation.userId}`).emit('cart:validation', validation);
  }

  async publishInventoryUpdate(update: InventoryUpdate): Promise<void> {
    if (this.isRedisConnected && this.pubClient) {
      try {
        await withRedisHealth(
          async () => {
            if (this.pubClient) {
              await this.pubClient.publish('inventory:updates', JSON.stringify(update));
            }
          },
          () => {
            // Fallback: Store for later publishing
            this.pendingPublishes.push({
              channel: 'inventory:updates',
              message: JSON.stringify(update),
            });
            // Also broadcast directly if possible
            this.broadcastInventoryUpdate(update);
          },
          'WebSocket inventory publish',
        );
      } catch (error) {
        logger.error('[WebSocket] Failed to publish inventory update:', error);
        // Direct broadcast as fallback
        this.broadcastInventoryUpdate(update);
      }
    } else {
      // No Redis - broadcast directly
      this.broadcastInventoryUpdate(update);
    }
  }

  async publishCartValidation(validation: CartValidation): Promise<void> {
    if (this.isRedisConnected && this.pubClient) {
      try {
        await withRedisHealth(
          async () => {
            if (this.pubClient) {
              await this.pubClient.publish('cart:validation', JSON.stringify(validation));
            }
          },
          () => {
            // Fallback: Store for later publishing
            this.pendingPublishes.push({
              channel: 'cart:validation',
              message: JSON.stringify(validation),
            });
            // Also send directly if possible
            this.sendCartValidation(validation);
          },
          'WebSocket cart validation publish',
        );
      } catch (error) {
        logger.error('[WebSocket] Failed to publish cart validation:', error);
        // Direct send as fallback
        this.sendCartValidation(validation);
      }
    } else {
      // No Redis - send directly
      this.sendCartValidation(validation);
    }
  }
  
  private async processPendingPublishes(): Promise<void> {
    if (!this.isRedisConnected || !this.pubClient || this.pendingPublishes.length === 0) {
      return;
    }
    
    logger.info(`[WebSocket] Processing ${this.pendingPublishes.length} pending publishes`);
    const pending = [...this.pendingPublishes];
    this.pendingPublishes = [];
    
    for (const { channel, message } of pending) {
      try {
        await this.pubClient.publish(channel, message);
      } catch (error) {
        logger.error('[WebSocket] Failed to publish pending message:', error);
        // Re-add to pending if failed
        this.pendingPublishes.push({ channel, message });
      }
    }
  }

  getIO(): Server | null {
    return this.io;
  }
}

export const websocketService = new WebSocketService();