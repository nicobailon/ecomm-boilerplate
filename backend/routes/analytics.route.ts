import { Router } from 'express';
import { getAnalytics, getDailySales } from '../controllers/analytics.controller.js';
import { protectRoute, adminRoute } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', protectRoute, adminRoute, getAnalytics);
router.get('/daily-sales', protectRoute, adminRoute, getDailySales);

export default router;