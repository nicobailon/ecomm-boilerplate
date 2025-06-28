import { Router } from 'express';
import { signup, login, logout, refreshToken, getProfile, forgotPassword, resetPassword } from '../controllers/auth.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';
import { validateBody } from '../middleware/validation.middleware.js';
import { loginSchema, signupSchema, refreshTokenSchema } from '../validations/index.js';
import { emailRateLimit } from '../middleware/security.middleware.js';
import { passwordResetRequestSchema, passwordResetConfirmSchema } from '../validations/email.validation.js';

const router = Router();

router.post('/signup', emailRateLimit, validateBody(signupSchema), signup);
router.post('/login', validateBody(loginSchema), login);
router.post('/logout', logout);
router.post('/refresh-token', validateBody(refreshTokenSchema), refreshToken);
router.get('/profile', protectRoute, getProfile);
router.post('/forgot-password', emailRateLimit, validateBody(passwordResetRequestSchema), forgotPassword);
router.post('/reset-password', validateBody(passwordResetConfirmSchema), resetPassword);

export default router;