import { Request, Response, NextFunction } from 'express';
import Stripe from 'stripe';
import { stripe } from '../lib/stripe.js';
import { WebhookError } from '../types/webhook.types.js';
import rateLimit from 'express-rate-limit';

export interface WebhookRequest extends Request {
  stripeEvent?: Stripe.Event;
}

const verifyWebhookSignatureAsync = (
  req: WebhookRequest,
  res: Response,
  next: NextFunction,
): void => {
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new WebhookError(
        'Webhook secret not configured',
        'WEBHOOK_SECRET_MISSING',
        500,
        false,
      );
    }

    const signature = req.headers['stripe-signature'];
    if (!signature || typeof signature !== 'string') {
      throw new WebhookError(
        'Missing stripe-signature header',
        'SIGNATURE_MISSING',
        401,
        false,
      );
    }

    // When using express.raw(), the body is available as a Buffer in req.body
    let rawBody: Buffer;
    if (Buffer.isBuffer(req.body)) {
      rawBody = req.body;
    } else if (typeof req.body === 'string') {
      // Handle case where body might be a string (e.g., in tests)
      rawBody = Buffer.from(req.body);
    } else if (req.body && typeof req.body === 'object') {
      // Handle case where body is already parsed (shouldn't happen with raw parser)
      rawBody = Buffer.from(JSON.stringify(req.body));
    } else {
      throw new WebhookError(
        'Raw body not available',
        'RAW_BODY_MISSING',
        400,
        false,
      );
    }

    try {
      const event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret,
      );

      req.stripeEvent = event;
      next();
    } catch (err) {
      if (err instanceof Error) {
        console.error('Webhook signature verification failed:', err.message);
        throw new WebhookError(
          'Invalid webhook signature',
          'INVALID_SIGNATURE',
          401,
          false,
        );
      }
      throw err;
    }
  } catch (error) {
    if (error instanceof WebhookError) {
      res.status(error.statusCode).json({
        error: error.message,
        code: error.code,
      });
    } else {
      console.error('Unexpected error in webhook middleware:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      });
    }
  }
};

export const verifyWebhookSignature = verifyWebhookSignatureAsync;

export const webhookRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 1000, // 1000 requests per minute
  message: 'Too many webhook requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.warn('Webhook rate limit exceeded:', {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      eventId: (req.body as { id?: string })?.id,
    });
    res.status(429).json({
      error: 'Too many webhook requests',
      code: 'RATE_LIMIT_EXCEEDED',
    });
  },
});

