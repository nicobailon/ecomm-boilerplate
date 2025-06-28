import { Router } from 'express';
import { getCartProducts, addToCart, removeFromCart, updateQuantity } from '../controllers/cart.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';
import { validateBody, validateParams } from '../middleware/enhanced-validation.middleware.js';
import { validateAddToCart, validateCartInventory, includeCartValidationWarnings } from '../middleware/cart-validation.middleware.js';
import { addToCartSchema, updateQuantitySchema, productIdParamSchema, cartProductIdParamSchema } from '../validations/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/', protectRoute, asyncHandler(validateCartInventory), includeCartValidationWarnings, getCartProducts);
router.post('/', protectRoute, validateBody(addToCartSchema), asyncHandler(validateAddToCart), addToCart);
router.delete('/', protectRoute, removeFromCart);
router.delete('/:productId', protectRoute, validateParams(cartProductIdParamSchema), removeFromCart);
router.put('/:id', protectRoute, validateParams(productIdParamSchema), validateBody(updateQuantitySchema), updateQuantity);

export default router;