import { Router } from 'express';
import { getAnalytics, getDailySales } from '../controllers/analytics.controller.js';
import { protectRoute, adminRoute } from '../middleware/auth.middleware.js';
import { validateQuery } from '../middleware/enhanced-validation.middleware.js';
import { dateRangeSchema } from '../validations/index.js';

const router = Router();

router.get('/', protectRoute, adminRoute, getAnalytics);
router.get('/daily-sales', protectRoute, adminRoute, validateQuery(dateRangeSchema), getDailySales);

export default router;