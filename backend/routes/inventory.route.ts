import express from 'express';
import {
  getProductInventory,
  checkAvailability,
  updateInventory,
  bulkUpdateInventory,
  getInventoryHistory,
  getLowStockProducts,
  getInventoryMetrics,
  getOutOfStockProducts,
  getInventoryTurnover,
} from '../controllers/inventory.controller.js';
import { adminRoute } from '../middleware/auth.middleware.js';
import { validateRequest } from '../middleware/validation.middleware.js';
import {
  inventoryUpdateSchema,
  bulkInventoryUpdateSchema,
} from '../validations/inventory.validation.js';
import { rateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Public routes with rate limiting
router.get('/check/:productId', rateLimiter(100, 1), checkAvailability);
router.get('/product/:productId', getProductInventory);

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

router.get('/history/:productId', adminRoute, getInventoryHistory);
router.get('/low-stock', adminRoute, getLowStockProducts);
router.get('/metrics', adminRoute, getInventoryMetrics);
router.get('/out-of-stock', adminRoute, getOutOfStockProducts);
router.get('/turnover', adminRoute, getInventoryTurnover);

export default router;