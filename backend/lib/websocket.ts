import { Server, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { createLogger } from '../utils/logger.js';
import { redis } from './redis.js';

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

  async initialize(httpServer: HTTPServer): Promise<void> {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.CLIENT_URL ?? 'http://localhost:5173',
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    // Set up Redis pub/sub for scaling across multiple servers
    this.pubClient ??= redis.duplicate();
    this.subClient ??= redis.duplicate();

    // Subscribe to inventory updates channel
    await this.subClient.subscribe('inventory:updates', (message) => {
      if (typeof message === 'string') {
        const update = JSON.parse(message) as InventoryUpdate;
        this.broadcastInventoryUpdate(update);
      }
    });

    // Subscribe to cart validation channel
    await this.subClient.subscribe('cart:validation', (message) => {
      if (typeof message === 'string') {
        const validation = JSON.parse(message) as CartValidation;
        this.sendCartValidation(validation);
      }
    });

    this.io.use((socket: Socket, next: (err?: Error) => void) => {
      try {
        const token = socket.handshake.auth.token as string | undefined;
        if (token && process.env.ACCESS_TOKEN_SECRET) {
          const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET) as { userId: string };
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          socket.data.userId = decoded.userId;
        }
        next();
      } catch {
        next(new Error('Authentication error'));
      }
    });

    this.io.on('connection', (socket: Socket) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const userId = socket.data.userId as string | undefined;
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
    if (this.pubClient) {
      await this.pubClient.publish('inventory:updates', JSON.stringify(update));
    }
  }

  async publishCartValidation(validation: CartValidation): Promise<void> {
    if (this.pubClient) {
      await this.pubClient.publish('cart:validation', JSON.stringify(validation));
    }
  }

  getIO(): Server | null {
    return this.io;
  }
}

export const websocketService = new WebSocketService();