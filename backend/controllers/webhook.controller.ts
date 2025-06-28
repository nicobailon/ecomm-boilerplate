import { Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { WebhookRequest } from '../middleware/webhook.middleware.js';
import { webhookService } from '../services/webhook.service.js';
import { WebhookError } from '../types/webhook.types.js';

export const handleStripeWebhook = asyncHandler(async (req: WebhookRequest, res: Response) => {
  const event = req.stripeEvent;

  if (!event) {
    throw new WebhookError(
      'Stripe event not found in request',
      'EVENT_MISSING',
      400,
      false
    );
  }

  console.info(`Webhook received: ${event.type} (${event.id})`);

  try {
    const result = await webhookService.processWebhookEvent(event);

    if (result.success) {
      res.status(200).json({ 
        received: true,
        processed: true,
        orderId: result.orderId,
      });
    } else {
      console.warn(`Webhook processing returned failure: ${result.error}`);
      res.status(200).json({ 
        received: true,
        processed: false,
        error: result.error,
      });
    }
  } catch (error) {
    if (error instanceof WebhookError) {
      console.error(`Webhook error [${error.code}]: ${error.message}`);
      
      if (error.shouldRetry) {
        res.status(error.statusCode).json({
          error: error.message,
          code: error.code,
          retry: true,
        });
      } else {
        res.status(200).json({
          received: true,
          processed: false,
          error: error.message,
          code: error.code,
        });
      }
    } else {
      console.error('Unexpected webhook processing error:', error);
      res.status(500).json({
        error: 'Internal server error processing webhook',
        code: 'INTERNAL_ERROR',
      });
    }
  }
});

export const retryFailedWebhooks = asyncHandler(async (_req: WebhookRequest, res: Response) => {
  console.info('Manual webhook retry triggered');
  
  try {
    await webhookService.retryFailedEvents();
    
    res.status(200).json({
      success: true,
      message: 'Failed webhook retry process initiated',
    });
  } catch (error) {
    console.error('Error retrying failed webhooks:', error);
    throw new WebhookError(
      'Failed to retry webhooks',
      'RETRY_ERROR',
      500,
      false
    );
  }
});