import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'path';
import * as trpcExpress from '@trpc/server/adapters/express';
import { connectDB } from './lib/db.js';
import { errorHandler } from './middleware/error.middleware.js';
import { securityMiddleware, authRateLimit, trpcRateLimit } from './middleware/security.middleware.js';
import { validateEnvVariables } from './utils/validateEnv.js';
import { createContext } from './trpc/context.js';
import { appRouter } from './trpc/routers/app.router.js';
import authRoutes from './routes/auth.route.js';
import productRoutes from './routes/product.route.js';
import cartRoutes from './routes/cart.route.js';
import couponRoutes from './routes/coupon.route.js';
import paymentRoutes from './routes/payment.route.js';
import analyticsRoutes from './routes/analytics.route.js';
import uploadRoutes from './routes/upload.route.js';

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
// Apply JSON parsing to all routes except uploadthing
app.use((req, res, next) => {
  if (req.path.startsWith('/api/uploadthing')) {
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

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '/frontend/dist')));

  app.get('*', (_req, res) => {
    res.sendFile(path.resolve(__dirname, 'frontend', 'dist', 'index.html'));
  });
}

app.use(errorHandler);

app.listen(PORT, '0.0.0.0', () => {
  console.error('Server is running on http://localhost:' + PORT);
  void connectDB();
});
