import { Router } from 'express';
import { getCoupon, validateCoupon, applyCoupon, removeCoupon } from '../controllers/coupon.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validation.middleware.js';
import { couponValidationLimiter, couponApplicationLimiter, strictCouponLimiter } from '../middleware/rateLimiter.js';
import { applyCouponSchema } from '../validations/index.js';

const router = Router();

router.use(strictCouponLimiter);

router.get('/', protectRoute, getCoupon);
router.post('/validate', protectRoute, couponValidationLimiter, validateBody(applyCouponSchema), validateCoupon);
router.post('/apply', protectRoute, couponApplicationLimiter, validateBody(applyCouponSchema), applyCoupon);
router.delete('/remove', protectRoute, couponApplicationLimiter, removeCoupon);

export default router;