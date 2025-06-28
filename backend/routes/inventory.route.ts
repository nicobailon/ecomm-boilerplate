import express from 'express';
import { z } from 'zod';
import {
  getProductInventory,
  checkAvailability,
  updateInventory,
  bulkUpdateInventory,
  getInventoryMetrics,
  getOutOfStockProducts,
  getInventoryTurnover,
} from '../controllers/inventory.controller.js';
import { adminRoute } from '../middleware/auth.middleware.js';
import { validateRequest, validateParams } from '../middleware/validation.middleware.js';
import {
  inventoryUpdateSchema,
  bulkInventoryUpdateSchema,
} from '../validations/inventory.validation.js';
import { rateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Public routes with rate limiting
router.get('/check/:productId', rateLimiter(100, 1), validateParams(z.object({ productId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID format') })), checkAvailability);
router.get('/product/:productId', validateParams(z.object({ productId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID format') })), getProductInventory);

// Admin-only routes
router.post(
  '/update',
  adminRoute,
  validateRequest(inventoryUpdateSchema),
  updateInventory,
);

router.post(
  '/bulk-update',
  adminRoute,
  validateRequest(bulkInventoryUpdateSchema),
  bulkUpdateInventory,
);

router.get('/metrics', adminRoute, getInventoryMetrics);
router.get('/out-of-stock', adminRoute, getOutOfStockProducts);
router.get('/turnover', adminRoute, getInventoryTurnover);

export default router;