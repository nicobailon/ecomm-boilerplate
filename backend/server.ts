import express from 'express';
import { createServer } from 'http';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'path';
import * as trpcExpress from '@trpc/server/adapters/express';
import { connectDB, disconnectDB } from './lib/db.js';
import { errorHandler } from './middleware/error.middleware.js';
import { securityMiddleware, authRateLimit, trpcRateLimit, emailRateLimit } from './middleware/security.middleware.js';
import { validateEnvVariables } from './utils/validateEnv.js';
import { createContext } from './trpc/context.js';
import { appRouter } from './trpc/routers/app.router.js';
import { websocketService } from './lib/websocket.js';
import { inventoryMonitor } from './services/inventory-monitor.service.js';
import { cacheWarmingService } from './services/cache-warming.service.js';
import { getEmailQueueForShutdown, shutdownEmailQueue } from './lib/email-queue.js';
import { queueMonitoring, alertHandlers } from './lib/queue-monitoring.js';
import { redisMonitoring, monitoringHandlers } from './lib/redis-monitoring.js';
import { webhookMonitoring, webhookAlertHandlers } from './lib/webhook-monitoring.js';
import authRoutes from './routes/auth.route.js';
import productRoutes from './routes/product.route.js';
import cartRoutes from './routes/cart.route.js';
import couponRoutes from './routes/coupon.route.js';
import paymentRoutes from './routes/payment.route.js';
import analyticsRoutes from './routes/analytics.route.js';
import uploadRoutes from './routes/upload.route.js';
import inventoryRoutes from './routes/inventory.route.js';
import unsubscribeRoutes from './routes/unsubscribe.route.js';
import healthRoutes from './routes/health.route.js';

dotenv.config();
validateEnvVariables();

const app = express();
const PORT = parseInt(process.env.PORT ?? '3001', 10);

const __dirname = path.resolve();

app.use(securityMiddleware);
app.use(cors({
  origin: process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',') : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));

// Apply raw body parser for webhook endpoint before other parsers
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

// Apply JSON parsing to all routes except uploadthing and webhook
app.use((req, res, next) => {
  if (req.path.startsWith('/api/uploadthing') || req.path === '/api/payments/webhook') {
    next();
  } else {
    express.json({ limit: '10mb' })(req, res, next);
  }
});
app.use(cookieParser());

// tRPC request logging middleware removed for production

app.use(
  '/api/trpc',
  trpcRateLimit,
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext,
  }),
);

app.use('/api/auth', authRateLimit, authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/uploadthing', uploadRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/unsubscribe', emailRateLimit, unsubscribeRoutes);
app.use('/api', healthRoutes);

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '/frontend/dist')));

  app.get('*', (_req, res) => {
    res.sendFile(path.resolve(__dirname, 'frontend', 'dist', 'index.html'));
  });
}

app.use(errorHandler);

// Create HTTP server for WebSocket support
const httpServer = createServer(app);

// Initialize WebSocket service and inventory monitor
httpServer.listen(PORT, '0.0.0.0', () => {
  console.info('Server is running on http://localhost:' + PORT);
  
  void (async () => {
    try {
      await connectDB();
      
      // Warm caches after database connection
      await cacheWarmingService.warmAllCaches();
      
      await websocketService.initialize(httpServer);
      await inventoryMonitor.startMonitoring();
      console.info('Real-time inventory monitoring started');
      
      // Initialize email queue if available
      const emailQueue = await getEmailQueueForShutdown();
      if (emailQueue) {
        await emailQueue.isReady();
        console.info('Email queue initialized');
        
        // Set up queue monitoring and alerts
        queueMonitoring.onAlert(alertHandlers.console);
        
        // Add monitoring service alert if configured
        if (process.env.SENTRY_DSN ?? process.env.DATADOG_API_KEY) {
          queueMonitoring.onAlert(alertHandlers.monitoring);
        }
        
        // Add Slack alerts if configured
        if (process.env.SLACK_WEBHOOK_URL) {
          queueMonitoring.onAlert((alert) => {
            void alertHandlers.slack(alert);
          });
        }
        
        // Add email alerts if configured
        if (process.env.ALERT_EMAIL) {
          queueMonitoring.onAlert((alert) => {
            void alertHandlers.email(alert);
          });
        }
        
        console.info('Queue monitoring and alerts configured');
      } else {
        console.warn('Email queue not available - emails will be sent synchronously');
      }
      
      // Start Redis monitoring
      redisMonitoring.startMonitoring(30000); // Check every 30 seconds
      
      // Set up Redis monitoring alerts
      redisMonitoring.onAlert(monitoringHandlers.console);
      redisMonitoring.onAlert(monitoringHandlers.healthEndpoint);
      
      if (process.env.MONITORING_ENABLED === 'true') {
        redisMonitoring.onAlert(monitoringHandlers.metrics);
      }
      
      console.info('Redis monitoring started');
      
      // Start webhook monitoring
      webhookMonitoring.startMonitoring(60000); // Check every minute
      
      // Set up webhook monitoring alerts
      webhookMonitoring.onAlert(webhookAlertHandlers.console);
      webhookMonitoring.onAlert(webhookAlertHandlers.monitoring);
      
      if (process.env.SLACK_WEBHOOK_URL) {
        webhookMonitoring.onAlert((alert) => {
          void webhookAlertHandlers.slack(alert);
        });
      }
      
      console.info('Webhook monitoring started');
    } catch (error) {
      console.error('Failed to initialize services:', error);
    }
  })();
});

// Graceful shutdown handler
const gracefulShutdown = async (signal: string): Promise<void> => {
  console.info(`${signal} received, shutting down gracefully...`);
  
  try {
    // Stop inventory monitoring
    await inventoryMonitor.stopMonitoring();
    console.info('Inventory monitoring stopped');
    
    // Stop Redis monitoring
    redisMonitoring.stopMonitoring();
    console.info('Redis monitoring stopped');
    
    // Stop webhook monitoring
    webhookMonitoring.stopMonitoring();
    console.info('Webhook monitoring stopped');
    
    // Shutdown email queue with proper cleanup
    await shutdownEmailQueue();
    
    // Close WebSocket connections
    await websocketService.close();
    console.info('WebSocket connections closed');
    
    // Close HTTP server
    await new Promise<void>((resolve) => {
      httpServer.close(() => {
        console.info('HTTP server closed');
        resolve();
      });
    });
    
    // Disconnect from MongoDB
    await disconnectDB();
    
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
};

// Register graceful shutdown handlers
process.on('SIGTERM', () => {
  void gracefulShutdown('SIGTERM');
});

process.on('SIGINT', () => {
  void gracefulShutdown('SIGINT');
});

export default app;
