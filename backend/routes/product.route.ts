import { Router } from 'express';
import * as productController from '../controllers/product.controller.js';
import { protectRoute, adminRoute } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', productController.getAllProducts);
router.get('/featured', productController.getFeaturedProducts);
router.get('/category/:category', productController.getProductsByCategory);
router.get('/recommendations', productController.getRecommendedProducts);

router.post('/', protectRoute, adminRoute, productController.createProduct);
router.patch('/:id', protectRoute, adminRoute, productController.updateProduct);
router.delete('/:id', protectRoute, adminRoute, productController.deleteProduct);
router.patch('/toggle-featured/:id', protectRoute, adminRoute, productController.toggleFeaturedProduct);

export default router;