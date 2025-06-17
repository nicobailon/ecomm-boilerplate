import { Router, Request, Response, NextFunction } from 'express';
import { uploadthingHandler } from '../lib/uploadthing.js';
import { protectRoute, adminRoute } from '../middleware/auth.middleware.js';
import { AuthRequest } from '../types/express.js';

const router = Router();

// Logging middleware for debugging upload requests
const uploadLogger = (_req: Request, _res: Response, next: NextFunction) => {
  next();
};

// Handle OPTIONS requests for CORS preflight
router.options('*', (req: Request, res: Response) => {
  const origin = req.headers.origin;
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-UploadThing-Version, Cookie');
  res.sendStatus(200);
});

// Handle GET requests (route config) without auth - these are just metadata requests
router.get('/', uploadLogger, uploadthingHandler);

// For POST requests, we need to differentiate between client uploads and UploadThing callbacks
router.post('/', uploadLogger, (req: Request, res: Response, next: NextFunction) => {
  // Check if this is a callback from UploadThing servers
  // Callbacks won't have user authentication and that's OK
  const isCallback = req.headers['x-uploadthing-package'] || 
                    (req.headers['user-agent'] && req.headers['user-agent'].includes('uploadthing'));
  
  if (isCallback) {
    // Let UploadThing handle the callback without auth
    return uploadthingHandler(req, res, next);
  }
  
  // For client uploads, require authentication
  protectRoute(req as AuthRequest, res, (err?: any) => {
    if (err) return next(err);
    
    // Check admin access
    adminRoute(req as AuthRequest, res, (err?: any) => {
      if (err) return next(err);
      
      // User is authenticated and is admin, proceed with upload
      uploadthingHandler(req, res, next);
    });
  });
});

// Handle all other methods
router.use('/', uploadLogger, uploadthingHandler);

export default router;