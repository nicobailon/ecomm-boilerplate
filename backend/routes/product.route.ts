import { Router } from 'express';
import * as productController from '../controllers/product.controller.js';
import { protectRoute, adminRoute } from '../middleware/auth.middleware.js';
import { validateBody, validateQuery, validateParams } from '../middleware/validation.middleware.js';
import { createProductSchema, updateProductSchema, paginationSchema, productIdParamSchema, categoryParamSchema } from '../validations/index.js';

const router = Router();

router.get('/', validateQuery(paginationSchema), productController.getAllProducts);
router.get('/featured', productController.getFeaturedProducts);
router.get('/category/:category', validateParams(categoryParamSchema), productController.getProductsByCategory);
router.get('/recommendations', productController.getRecommendedProducts);
router.get('/:id', validateParams(productIdParamSchema), productController.getProduct);

router.post('/', protectRoute, adminRoute, validateBody(createProductSchema), productController.createProduct);
router.patch('/:id', protectRoute, adminRoute, validateParams(productIdParamSchema), validateBody(updateProductSchema), productController.updateProduct);
router.delete('/:id', protectRoute, adminRoute, validateParams(productIdParamSchema), productController.deleteProduct);
router.patch('/toggle-featured/:id', protectRoute, adminRoute, validateParams(productIdParamSchema), productController.toggleFeaturedProduct);

export default router;