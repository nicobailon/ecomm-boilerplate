import rateLimit from 'express-rate-limit';

declare module 'express' {
  interface Request {
    userId?: string;
  }
}

export const collectionCreationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each user to 20 collection creations per window
  message: 'Too many collections created, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.userId || req.ip || 'anonymous';
  },
  skip: (req) => {
    return req.ip === '::1' || req.ip === '127.0.0.1';
  },
});

export const collectionCheckLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // limit to 60 checks per minute
  message: 'Too many requests, please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.userId || req.ip || 'anonymous';
  },
  skip: (req) => {
    return req.ip === '::1' || req.ip === '127.0.0.1';
  },
});