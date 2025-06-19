import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';

export const securityMiddleware = [
  helmet(),
  mongoSanitize(),
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP',
  }),
];

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many authentication attempts',
});

export const trpcRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: 'Too many tRPC requests from this IP',
  keyGenerator: (req) => {
    const body = req.body as Record<string, { procedure?: string }> | undefined;
    const procedure = body?.['0']?.procedure ?? 'unknown';
    return `${req.ip}-${procedure}`;
  },
});

export const collectionCreationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many collections created, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});
