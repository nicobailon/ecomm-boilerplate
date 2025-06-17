import { Router } from 'express';
import { getCoupon, validateCoupon } from '../controllers/coupon.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validation.middleware.js';
import { applyCouponSchema } from '../validations/index.js';

const router = Router();

router.get('/', protectRoute, getCoupon);
router.post('/validate', protectRoute, validateBody(applyCouponSchema), validateCoupon);

export default router;