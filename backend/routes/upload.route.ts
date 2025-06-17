import { Router } from 'express';
import { uploadthingHandler } from '../lib/uploadthing.js';
import { protectRoute, adminRoute } from '../middleware/auth.middleware.js';

const router = Router();

// The Express app will use this route for all /api/uploadthing requests
// The `protectRoute` and `adminRoute` middleware ensure only authenticated admins can access the uploader.
router.use('/', protectRoute, adminRoute, uploadthingHandler);

export default router;