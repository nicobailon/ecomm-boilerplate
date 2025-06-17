import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'path';
import { connectDB } from './lib/db.js';
import { errorHandler } from './middleware/error.middleware.js';
import { securityMiddleware, authRateLimit } from './middleware/security.middleware.js';
import { validateEnvVariables } from './utils/validateEnv.js';
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
const PORT = process.env.PORT || 5001;

const __dirname = path.resolve();

app.use(securityMiddleware);
app.use(cors({
  origin: process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',') : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

app.use('/api/auth', authRateLimit, authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/uploadthing', uploadRoutes);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "/frontend/dist")));

  app.get("*", (_req, res) => {
    res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
  });
}

app.use(errorHandler);

app.listen(PORT, '0.0.0.0', () => {
  console.log("Server is running on http://localhost:" + PORT);
  connectDB();
});
