import { Router } from 'express';
import { createCheckoutSession, checkoutSuccess } from '../controllers/payment.controller.js';
import { handleStripeWebhook, retryFailedWebhooks } from '../controllers/webhook.controller.js';
import { protectRoute, adminRoute } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/enhanced-validation.middleware.js';
import { checkoutSchema, checkoutSuccessSchema } from '../validations/index.js';
import { emailRateLimit, inventoryCheckRateLimit } from '../middleware/security.middleware.js';
import { 
  verifyWebhookSignature, 
  webhookRateLimiter
} from '../middleware/webhook.middleware.js';
import { 
  validateInventoryPreCheckout, 
  logInventoryValidation 
} from '../middleware/inventory-validation.middleware.js';

const router = Router();

router.post(
  '/create-checkout-session', 
  protectRoute, 
  inventoryCheckRateLimit,
  emailRateLimit, 
  validateBody(checkoutSchema), 
  logInventoryValidation,
  validateInventoryPreCheckout,
  createCheckoutSession
);
router.post('/checkout-success', protectRoute, emailRateLimit, validateBody(checkoutSuccessSchema), checkoutSuccess);

// Webhook endpoints
router.post(
  '/webhook',
  webhookRateLimiter,
  verifyWebhookSignature,
  handleStripeWebhook
);

// Admin endpoint to manually retry failed webhooks
router.post('/webhook/retry', protectRoute, adminRoute, retryFailedWebhooks);

export default router;