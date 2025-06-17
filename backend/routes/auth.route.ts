import { Router } from 'express';
import { signup, login, logout, refreshToken, getProfile } from '../controllers/auth.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validation.middleware.js';
import { loginSchema, signupSchema } from '../validations/index.js';

const router = Router();

router.post('/signup', validateBody(signupSchema), signup);
router.post('/login', validateBody(loginSchema), login);
router.post('/logout', logout);
router.post('/refresh-token', refreshToken);
router.get('/profile', protectRoute, getProfile);

export default router;