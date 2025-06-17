import { Router } from 'express';
import { getCoupon, validateCoupon } from '../controllers/coupon.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', protectRoute, getCoupon);
router.post('/validate', protectRoute, validateCoupon);

export default router;