import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Response } from 'express';
import Stripe from 'stripe';
import { handleStripeWebhook, retryFailedWebhooks } from '../controllers/webhook.controller.js';
import { WebhookRequest } from '../middleware/webhook.middleware.js';
import { webhookService } from '../services/webhook.service.js';
import { WebhookError } from '../types/webhook.types.js';

// Mock dependencies
vi.mock('../services/webhook.service.js', () => ({
  webhookService: {
    processWebhookEvent: vi.fn(),
    retryFailedEvents: vi.fn(),
  },
}));

describe('WebhookController', () => {
  let mockReq: Partial<WebhookRequest>;
  let mockRes: Partial<Response>;
  let mockNext: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockReq = {
      stripeEvent: {
        id: 'evt_test123',
        type: 'payment_intent.succeeded',
        created: Date.now(),
        data: { object: {} as any },
      } as Stripe.Event,
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    mockNext = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('handleStripeWebhook', () => {
    it('should process webhook successfully', async () => {
      vi.mocked(webhookService.processWebhookEvent).mockResolvedValueOnce({
        success: true,
        orderId: 'order123',
      });

      await handleStripeWebhook(
        mockReq as WebhookRequest,
        mockRes as Response,
        mockNext,
      );

      expect(webhookService.processWebhookEvent).toHaveBeenCalledWith(mockReq.stripeEvent);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        received: true,
        processed: true,
        orderId: 'order123',
      });
    });

    it('should handle processing failures gracefully', async () => {
      vi.mocked(webhookService.processWebhookEvent).mockResolvedValueOnce({
        success: false,
        error: 'Missing required data',
      });

      await handleStripeWebhook(
        mockReq as WebhookRequest,
        mockRes as Response,
        mockNext,
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        received: true,
        processed: false,
        error: 'Missing required data',
      });
    });

    it('should handle missing stripe event', async () => {
      mockReq.stripeEvent = undefined;

      await handleStripeWebhook(
        mockReq as WebhookRequest,
        mockRes as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(WebhookError));
      const error = mockNext.mock.calls[0][0];
      expect(error.code).toBe('EVENT_MISSING');
      expect(error.statusCode).toBe(400);
    });

    it('should handle WebhookError with retry', async () => {
      const webhookError = new WebhookError(
        'Database connection failed',
        'DB_ERROR',
        500,
        true,
      );

      vi.mocked(webhookService.processWebhookEvent).mockRejectedValueOnce(webhookError);

      await handleStripeWebhook(
        mockReq as WebhookRequest,
        mockRes as Response,
        mockNext,
      );

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Database connection failed',
        code: 'DB_ERROR',
        retry: true,
      });
    });

    it('should handle WebhookError without retry', async () => {
      const webhookError = new WebhookError(
        'Invalid event data',
        'INVALID_DATA',
        400,
        false,
      );

      vi.mocked(webhookService.processWebhookEvent).mockRejectedValueOnce(webhookError);

      await handleStripeWebhook(
        mockReq as WebhookRequest,
        mockRes as Response,
        mockNext,
      );

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        received: true,
        processed: false,
        error: 'Invalid event data',
        code: 'INVALID_DATA',
      });
    });

    it('should handle unexpected errors', async () => {
      vi.mocked(webhookService.processWebhookEvent).mockRejectedValueOnce(
        new Error('Unexpected error'),
      );

      await handleStripeWebhook(
        mockReq as WebhookRequest,
        mockRes as Response,
        mockNext,
      );

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Internal server error processing webhook',
        code: 'INTERNAL_ERROR',
      });
    });

    it('should log webhook events', async () => {
      const consoleSpy = vi.spyOn(console, 'info');
      
      vi.mocked(webhookService.processWebhookEvent).mockResolvedValueOnce({
        success: true,
      });

      await handleStripeWebhook(
        mockReq as WebhookRequest,
        mockRes as Response,
        mockNext,
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        'Webhook received: payment_intent.succeeded (evt_test123)',
      );
    });
  });

  describe('retryFailedWebhooks', () => {
    it('should trigger webhook retry successfully', async () => {
      vi.mocked(webhookService.retryFailedEvents).mockResolvedValueOnce({ processed: 5, failed: 1 });

      await retryFailedWebhooks(
        mockReq as WebhookRequest,
        mockRes as Response,
        mockNext,
      );

      expect(webhookService.retryFailedEvents).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Failed webhook retry process initiated',
      });
    });

    it('should handle retry errors', async () => {
      vi.mocked(webhookService.retryFailedEvents).mockRejectedValueOnce(
        new Error('Retry failed'),
      );

      await retryFailedWebhooks(
        mockReq as WebhookRequest,
        mockRes as Response,
        mockNext,
      );

      expect(mockNext).toHaveBeenCalledWith(expect.any(WebhookError));
      const error = mockNext.mock.calls[0][0];
      expect(error.message).toBe('Failed to retry webhooks');
      expect(error.code).toBe('RETRY_ERROR');
      expect(error.statusCode).toBe(500);
    });

    it('should log retry attempts', async () => {
      const consoleSpy = vi.spyOn(console, 'info');
      
      vi.mocked(webhookService.retryFailedEvents).mockResolvedValueOnce({ processed: 5, failed: 1 });

      await retryFailedWebhooks(
        mockReq as WebhookRequest,
        mockRes as Response,
        mockNext,
      );

      expect(consoleSpy).toHaveBeenCalledWith('Manual webhook retry triggered');
    });
  });
});