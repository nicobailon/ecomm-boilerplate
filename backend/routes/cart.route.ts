import { Router } from 'express';
import { getCartProducts, addToCart, removeFromCart, updateQuantity } from '../controllers/cart.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';
import { validateBody, validateParams } from '../middleware/validation.middleware.js';
import { addToCartSchema, updateQuantitySchema, productIdParamSchema } from '../validations/index.js';

const router = Router();

router.get('/', protectRoute, getCartProducts);
router.post('/', protectRoute, validateBody(addToCartSchema), addToCart);
router.delete('/', protectRoute, removeFromCart);
router.delete('/:productId', protectRoute, validateParams(productIdParamSchema), removeFromCart);
router.put('/:id', protectRoute, validateParams(productIdParamSchema), validateBody(updateQuantitySchema), updateQuantity);

export default router;