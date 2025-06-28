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
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      error: {
        message: 'Too many authentication attempts, please try again later.',
        code: 'TOO_MANY_REQUESTS',
      },
    });
  },
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
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    res.status(429).json({
      error: {
        message: 'Too many requests from this IP, please try again later.',
        code: 'TOO_MANY_REQUESTS',
      },
    });
  },
});

export const collectionCreationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many collections created, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

export const emailRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 email requests per windowMs
  message: 'Too many email requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  handler: (_req, res) => {
    res.status(429).json({
      error: {
        message: 'Too many email requests, please try again later.',
        code: 'TOO_MANY_REQUESTS',
      },
    });
  },
});

export const inventoryCheckRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // limit each IP to 30 inventory check requests per minute
  message: 'Too many inventory check requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});
