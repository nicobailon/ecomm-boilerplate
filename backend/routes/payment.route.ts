import { Router } from 'express';
import { createCheckoutSession, checkoutSuccess } from '../controllers/payment.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validation.middleware.js';
import { checkoutSchema, checkoutSuccessSchema } from '../validations/index.js';
import { emailRateLimit } from '../middleware/security.middleware.js';

const router = Router();

router.post('/create-checkout-session', protectRoute, emailRateLimit, validateBody(checkoutSchema), createCheckoutSession);
router.post('/checkout-success', protectRoute, emailRateLimit, validateBody(checkoutSuccessSchema), checkoutSuccess);

export default router;