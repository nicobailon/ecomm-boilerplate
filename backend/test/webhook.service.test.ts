import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import mongoose from 'mongoose';
import Stripe from 'stripe';
import { WebhookService } from '../services/webhook.service.js';
import { WebhookEvent } from '../models/webhook-event.model.js';
import { Order } from '../models/order.model.js';
import { User } from '../models/user.model.js';
import { WebhookError } from '../types/webhook.types.js';
import { inventoryService } from '../services/inventory.service.js';
import { queueEmail } from '../lib/email-queue.js';
import { stripe } from '../lib/stripe.js';

// Mock dependencies
vi.mock('../models/webhook-event.model.js');
vi.mock('../models/order.model.js');
vi.mock('../models/user.model.js');
vi.mock('../services/inventory.service.js');
vi.mock('../lib/email-queue.js', () => ({
  queueEmail: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../lib/stripe.js');
vi.mock('../lib/webhook-monitoring.js', () => ({
  webhookMonitoring: {
    logWebhookEvent: vi.fn(),
  },
}));

describe('WebhookService', () => {
  let webhookService: WebhookService;
  let mockSession: any;

  beforeEach(() => {
    webhookService = new WebhookService();
    mockSession = {
      withTransaction: vi.fn((callback) => callback()),
      endSession: vi.fn(),
      abortTransaction: vi.fn(),
      commitTransaction: vi.fn(),
      startTransaction: vi.fn(),
    };
    vi.spyOn(mongoose, 'startSession').mockResolvedValue(mockSession);
    
    // Ensure queueEmail returns a Promise
    vi.mocked(queueEmail).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe('processWebhookEvent', () => {
    it('should skip already processed events', async () => {
      const mockEvent: Stripe.Event = {
        id: 'evt_test123',
        type: 'payment_intent.succeeded',
        created: Date.now(),
        data: { object: {} as any },
      } as Stripe.Event;

      vi.mocked(WebhookEvent.findOne).mockResolvedValueOnce({ processed: true } as any);

      const result = await webhookService.processWebhookEvent(mockEvent);

      expect(result).toEqual({
        success: true,
        message: 'Event already processed',
      });
      expect(WebhookEvent.findOne).toHaveBeenCalledWith({ stripeEventId: 'evt_test123' });
    });

    it('should handle payment_intent.succeeded events', async () => {
      const mockPaymentIntent = {
        id: 'pi_test123',
        object: 'payment_intent' as const,
        amount: 10000,
        amount_capturable: 0,
        amount_received: 10000,
        application: null,
        application_fee_amount: null,
        canceled_at: null,
        cancellation_reason: null,
        capture_method: 'automatic' as const,
        client_secret: 'pi_test123_secret',
        confirmation_method: 'automatic' as const,
        created: 1234567890,
        currency: 'usd',
        customer: null,
        description: null,
        invoice: null,
        last_payment_error: null,
        latest_charge: null,
        livemode: false,
        metadata: {
          checkoutSessionId: 'cs_test123',
        },
        next_action: null,
        on_behalf_of: null,
        payment_method: null,
        payment_method_configuration_details: null,
        payment_method_options: {},
        payment_method_types: ['card'],
        processing: null,
        receipt_email: null,
        review: null,
        setup_future_usage: null,
        shipping: null,
        source: null,
        statement_descriptor: null,
        statement_descriptor_suffix: null,
        status: 'succeeded' as const,
        transfer_data: null,
        transfer_group: null,
        automatic_payment_methods: null,
      } as Stripe.PaymentIntent;

      const mockEvent = {
        id: 'evt_test123',
        object: 'event' as const,
        type: 'payment_intent.succeeded' as const,
        created: Date.now(),
        data: { 
          object: mockPaymentIntent,
        },
        livemode: false,
        pending_webhooks: 0,
        request: null,
        api_version: '2023-10-16' as const,
      } as Stripe.Event;

      vi.mocked(WebhookEvent.findOne).mockResolvedValueOnce(null);
      // Mock Order.findOne to support both direct calls and session calls
      vi.mocked(Order.findOne).mockImplementation(() => {
        const result = null;
        return {
          then: (resolve: any) => resolve(result),
          catch: () => {},
          session: () => ({ then: (resolve: any) => resolve(result) }),
        } as any;
      });
      vi.mocked(stripe.checkout.sessions.retrieve).mockResolvedValueOnce({
        id: 'cs_test123',
        metadata: {
          userId: '507f1f77bcf86cd799439011',
          products: JSON.stringify([
            { id: 'prod123', quantity: 2, price: 50 },
          ]),
        },
        amount_total: 10000,
        amount_subtotal: 10000,
        total_details: {
          amount_tax: 0,
          amount_shipping: 0,
          amount_discount: 0,
        },
      } as any);
      const mockUser = { 
        _id: '507f1f77bcf86cd799439011', 
        email: 'test@example.com',
        save: vi.fn(),
        cartItems: [],
        appliedCoupon: null,
      };
      vi.mocked(User.findById).mockImplementation(() => ({
        session: () => mockUser,
      }) as any);
      vi.mocked(Order.countDocuments).mockResolvedValueOnce(5);
      
      // Mock inventory validation to pass
      vi.mocked(inventoryService.validateAndReserveInventory).mockResolvedValueOnce({
        isValid: true,
        errors: [],
        validatedProducts: [{
          productId: 'prod123',
          requestedQuantity: 2,
          availableStock: 10,
          productName: 'Test Product',
        }],
      });
      
      // Mock inventory operations
      vi.mocked(inventoryService.atomicInventoryDeduction).mockResolvedValue(true);
      vi.mocked(inventoryService.updateInventory).mockResolvedValue({
        success: true,
        previousQuantity: 10,
        newQuantity: 8,
        availableStock: 8,
        historyRecord: {
          _id: 'history123',
          productId: 'prod123',
          changeType: 'sale',
          changeAmount: -2,
          previousQuantity: 10,
          newQuantity: 8,
          reason: 'sale',
          userId: '507f1f77bcf86cd799439011',
          metadata: {},
          timestamp: new Date(),
        } as any,
      });
      
      const mockSave = vi.fn().mockResolvedValue({ _id: 'order123' });
      vi.mocked(Order).mockImplementation(() => ({
        save: mockSave,
      }) as any);
      const mockOrderDoc = { _id: 'order123' };
      vi.mocked(Order.findById).mockImplementation(() => ({
        populate: () => ({ session: () => mockOrderDoc }),
        session: () => mockOrderDoc,
      }) as any);

      const result = await webhookService.processWebhookEvent(mockEvent);

      expect(result.success).toBe(true);
      expect(result.orderId).toBeDefined();
      expect(mockSave).toHaveBeenCalled();
      expect(inventoryService.updateInventory).toHaveBeenCalledWith(
        'prod123',
        undefined,
        -2,
        'sale',
        '507f1f77bcf86cd799439011',
        expect.objectContaining({
          orderId: expect.any(String),
          skipDeduction: true,
          webhookEventId: 'evt_test123',
        })
      );
    });

    it('should handle payment_intent.payment_failed events', async () => {
      const mockPaymentIntent = {
        id: 'pi_test123',
        object: 'payment_intent' as const,
        amount: 10000,
        amount_capturable: 0,
        amount_received: 0,
        application: null,
        application_fee_amount: null,
        canceled_at: null,
        cancellation_reason: null,
        capture_method: 'automatic' as const,
        client_secret: 'pi_test123_secret',
        confirmation_method: 'automatic' as const,
        created: 1234567890,
        currency: 'usd',
        customer: null,
        description: null,
        invoice: null,
        last_payment_error: {
          charge: undefined,
          code: 'card_declined',
          decline_code: 'generic_decline',
          doc_url: 'https://stripe.com/docs/error-codes/card-declined',
          message: 'Card declined',
          payment_method: undefined,
          type: 'card_error' as const,
        },
        latest_charge: null,
        livemode: false,
        metadata: {
          userId: '507f1f77bcf86cd799439011',
        },
        next_action: null,
        on_behalf_of: null,
        payment_method: null,
        payment_method_configuration_details: null,
        payment_method_options: {},
        payment_method_types: ['card'],
        processing: null,
        receipt_email: null,
        review: null,
        setup_future_usage: null,
        shipping: null,
        source: null,
        statement_descriptor: null,
        statement_descriptor_suffix: null,
        status: 'requires_payment_method' as const,
        transfer_data: null,
        transfer_group: null,
        automatic_payment_methods: null,
      } as Stripe.PaymentIntent;

      const mockEvent = {
        id: 'evt_test123',
        object: 'event' as const,
        type: 'payment_intent.payment_failed' as const,
        created: Date.now(),
        data: { 
          object: mockPaymentIntent,
        },
        livemode: false,
        pending_webhooks: 0,
        request: null,
        api_version: '2023-10-16' as const,
      } as Stripe.Event;

      vi.mocked(WebhookEvent.findOne).mockResolvedValueOnce(null);
      vi.mocked(User.findById).mockResolvedValueOnce({
        _id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
      } as any);

      const result = await webhookService.processWebhookEvent(mockEvent);

      expect(result).toEqual({
        success: true,
        error: 'Payment failed',
      });
      expect(queueEmail).toHaveBeenCalledWith('paymentFailed', expect.any(Object));
    });

    it('should handle checkout.session.completed events', async () => {
      const mockSession: Stripe.Checkout.Session = {
        id: 'cs_test123',
        payment_status: 'paid',
        payment_intent: 'pi_test123',
      } as Stripe.Checkout.Session;

      const mockEvent: Stripe.Event = {
        id: 'evt_test123',
        type: 'checkout.session.completed',
        created: Date.now(),
        data: { object: mockSession },
      } as Stripe.Event;

      vi.mocked(WebhookEvent.findOne).mockResolvedValueOnce(null);
      vi.mocked(Order.findOne).mockImplementation(() => ({
        session: vi.fn().mockResolvedValue(null),
      }) as any);
      vi.mocked(stripe.checkout.sessions.retrieve).mockResolvedValueOnce({
        id: 'cs_test123',
        metadata: {
          userId: '507f1f77bcf86cd799439011',
          products: JSON.stringify([
            { id: 'prod123', quantity: 1, price: 100 },
          ]),
        },
        amount_total: 10000,
        payment_intent: 'pi_test123',
      } as any);
      const mockUser = { 
        _id: '507f1f77bcf86cd799439011', 
        email: 'test@example.com',
        save: vi.fn(),
        cartItems: [],
        appliedCoupon: null,
      };
      vi.mocked(User.findById).mockImplementation(() => ({
        session: () => mockUser,
      }) as any);
      vi.mocked(Order.countDocuments).mockResolvedValueOnce(3);
      const mockSave = vi.fn();
      vi.mocked(Order).mockImplementation(() => ({
        save: mockSave,
      }) as any);
      const mockOrderDoc = { _id: 'order123' };
      vi.mocked(Order.findById).mockImplementation(() => ({
        populate: () => mockOrderDoc,
        session: () => mockOrderDoc,
      }) as any);

      const result = await webhookService.processWebhookEvent(mockEvent);

      expect(result.success).toBe(true);
      expect(result.orderId).toBeDefined();
    });

    it('should handle unhandled event types gracefully', async () => {
      const mockEvent: Stripe.Event = {
        id: 'evt_test123',
        type: 'customer.subscription.created' as any,
        created: Date.now(),
        data: { object: {} as any },
      } as Stripe.Event;

      vi.mocked(WebhookEvent.findOne).mockResolvedValueOnce(null);

      const result = await webhookService.processWebhookEvent(mockEvent);

      expect(result).toEqual({ 
        success: true,
        message: expect.stringContaining('Unhandled event type'),
      });
    });

    it('should handle and record errors during processing', async () => {
      const mockEvent: Stripe.Event = {
        id: 'evt_test123',
        type: 'payment_intent.succeeded',
        created: Date.now(),
        data: { 
          object: { 
            id: 'pi_test123',
            metadata: {
              checkoutSessionId: 'cs_test123',
            },
          } as any,
        },
      } as Stripe.Event;

      vi.mocked(WebhookEvent.findOne).mockResolvedValueOnce(null);
      vi.mocked(Order.findOne).mockRejectedValueOnce(new Error('Database error'));

      await expect(webhookService.processWebhookEvent(mockEvent)).rejects.toThrow(
        WebhookError
      );

      // Check the second call which is the error recording
      expect(WebhookEvent.findOneAndUpdate).toHaveBeenNthCalledWith(
        2,
        { stripeEventId: 'evt_test123' },
        expect.objectContaining({
          $inc: { retryCount: 1 },
          $set: expect.objectContaining({
            error: 'Database error',
          }),
        }),
        { upsert: true }
      );
    });
  });

  describe('idempotency', () => {
    it('should prevent duplicate order creation for same session ID', async () => {
      const mockPaymentIntent = {
        id: 'pi_test123',
        object: 'payment_intent' as const,
        amount: 10000,
        amount_capturable: 0,
        amount_received: 10000,
        application: null,
        application_fee_amount: null,
        canceled_at: null,
        cancellation_reason: null,
        capture_method: 'automatic' as const,
        client_secret: 'pi_test123_secret',
        confirmation_method: 'automatic' as const,
        created: 1234567890,
        currency: 'usd',
        customer: null,
        description: null,
        invoice: null,
        last_payment_error: null,
        latest_charge: null,
        livemode: false,
        metadata: {
          checkoutSessionId: 'cs_test123',
        },
        next_action: null,
        on_behalf_of: null,
        payment_method: null,
        payment_method_configuration_details: null,
        payment_method_options: {},
        payment_method_types: ['card'],
        processing: null,
        receipt_email: null,
        review: null,
        setup_future_usage: null,
        shipping: null,
        source: null,
        statement_descriptor: null,
        statement_descriptor_suffix: null,
        status: 'succeeded' as const,
        transfer_data: null,
        transfer_group: null,
        automatic_payment_methods: null,
      } as Stripe.PaymentIntent;

      const mockEvent = {
        id: 'evt_test123',
        object: 'event' as const,
        type: 'payment_intent.succeeded' as const,
        created: Date.now(),
        data: { 
          object: mockPaymentIntent,
        },
        livemode: false,
        pending_webhooks: 0,
        request: null,
        api_version: '2023-10-16' as const,
      } as Stripe.Event;

      vi.mocked(WebhookEvent.findOne).mockResolvedValueOnce(null);
      vi.mocked(Order.findOne).mockImplementation(() => ({
        session: vi.fn().mockResolvedValue(null),
        then: (resolve: any) => resolve({ _id: 'existing_order_id' }),
      }) as any);

      const result = await webhookService.processWebhookEvent(mockEvent);

      expect(result).toEqual({
        success: true,
        orderId: 'existing_order_id',
        message: expect.any(String),
      });
      expect(Order).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle inventory validation failures gracefully', async () => {
      const mockSession = {
        id: 'cs_test123',
        payment_status: 'paid',
        metadata: {
          userId: '507f1f77bcf86cd799439011',
          products: JSON.stringify([
            { id: 'product123', quantity: 10, price: 100 }
          ]),
        },
      } as any;

      vi.mocked(WebhookEvent.findOne).mockResolvedValueOnce(null);
      // Mock Order.findOne to support both direct calls and .session() calls
      vi.mocked(Order.findOne).mockImplementation(() => ({
        session: vi.fn().mockResolvedValue(null),
        then: (resolve: any) => resolve(null),
      }) as any);
      
      const mockUser = { 
        _id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        cartItems: [],
        appliedCoupon: null,
        save: vi.fn(),
      };
      vi.mocked(User.findById).mockImplementation(() => ({
        session: () => mockUser,
      }) as any);
      
      vi.mocked(stripe.checkout.sessions.retrieve).mockResolvedValueOnce({
        ...mockSession,
        amount_total: 10000,
        amount_subtotal: 10000,
        total_details: {
          amount_tax: 0,
          amount_shipping: 0,
          amount_discount: 0,
        },
      });

      // Mock inventory validation failure
      vi.mocked(inventoryService.validateAndReserveInventory).mockResolvedValueOnce({
        isValid: false,
        errors: ['Insufficient inventory for product123'],
        validatedProducts: [],
      });

      // Mock Order.countDocuments for order number generation
      vi.mocked(Order.countDocuments).mockResolvedValueOnce(0);
      
      // Mock the Order constructor and save
      const mockOrder = {
        _id: 'order123',
        save: vi.fn().mockResolvedValue({ _id: 'order123' }),
      };
      vi.mocked(Order).mockImplementation(() => mockOrder as any);
      
      // Mock Order.findById for email sending
      vi.mocked(Order.findById).mockImplementation(() => ({
        populate: () => ({
          session: () => ({ _id: 'order123', products: [] }),
        }),
      }) as any);

      const result = await webhookService.createOrderFromSession('cs_test123', 'pi_test123', 'evt_test123');

      expect(result.success).toBe(true);
      expect(result.orderId).toBe('order123');
      
      // Verify order was created with pending_inventory status
      expect(Order).toHaveBeenCalledWith(expect.objectContaining({
        status: 'pending_inventory',
        inventoryIssues: ['Insufficient inventory for product123'],
      }));

      // Verify inventory was NOT deducted
      expect(inventoryService.atomicInventoryDeduction).not.toHaveBeenCalled();
    });

    it('should handle network timeouts during session retrieval', async () => {
      const mockEvent: Stripe.Event = {
        id: 'evt_test123',
        type: 'checkout.session.completed',
        created: Date.now(),
        data: { 
          object: { 
            id: 'cs_test123',
            payment_status: 'paid',
          } as any,
        },
      } as Stripe.Event;

      vi.mocked(WebhookEvent.findOne).mockResolvedValueOnce(null);
      // Mock Order.findOne to return null for both direct call and with session
      let orderFindOneCallCount = 0;
      vi.mocked(Order.findOne).mockImplementation(() => {
        orderFindOneCallCount++;
        if (orderFindOneCallCount === 1) {
          // First call - direct call, return null
          return Promise.resolve(null) as any;
        } else {
          // Second call - with .session(), return chainable object
          return {
            session: vi.fn().mockResolvedValue(null),
          } as any;
        }
      });
      
      // Mock network timeout
      vi.mocked(stripe.checkout.sessions.retrieve).mockRejectedValueOnce(
        new Error('Request timeout')
      );

      await expect(
        webhookService.processWebhookEvent(mockEvent)
      ).rejects.toThrow(WebhookError);

      // Verify error was recorded
      // Check the second call which is the error recording
      expect(WebhookEvent.findOneAndUpdate).toHaveBeenNthCalledWith(
        2,
        { stripeEventId: 'evt_test123' },
        expect.objectContaining({
          $inc: { retryCount: 1 },
          $set: expect.objectContaining({
            error: 'Request timeout',
          }),
        }),
        { upsert: true }
      );
    });

    it('should handle webhook signature verification failures', async () => {
      // This is tested in the integration tests since signature verification
      // happens in the middleware, not the service
      // But we can test the WebhookError handling
      const error = new WebhookError(
        'Invalid signature',
        'INVALID_SIGNATURE',
        401,
        false
      );

      expect(error.message).toBe('Invalid signature');
      expect(error.code).toBe('INVALID_SIGNATURE');
      expect(error.statusCode).toBe(401);
      expect(error.shouldRetry).toBe(false);
    });
  });

  describe('retryFailedEvents', () => {
    it('should retry failed webhook events', async () => {
      const failedEvents = [
        {
          stripeEventId: 'evt_failed1',
          processed: false,
          retryCount: 1,
          error: 'Temporary error',
        },
        {
          stripeEventId: 'evt_failed2',
          processed: false,
          retryCount: 2,
          error: 'Network error',
        },
      ];

      vi.mocked(WebhookEvent.find).mockImplementation(() => ({
        sort: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(failedEvents),
      }) as any);

      vi.mocked(stripe.events.retrieve).mockImplementation((eventId) => 
        Promise.resolve({
          id: eventId,
          type: 'payment_intent.succeeded',
          data: { object: {} },
        } as any)
      );

      // Mock successful reprocessing
      vi.mocked(WebhookEvent.findOne).mockResolvedValue(null);
      vi.mocked(Order.findOne).mockResolvedValue({ _id: 'order123' } as any);

      await webhookService.retryFailedEvents();

      expect(stripe.events.retrieve).toHaveBeenCalledTimes(2);
      expect(stripe.events.retrieve).toHaveBeenCalledWith('evt_failed1');
      expect(stripe.events.retrieve).toHaveBeenCalledWith('evt_failed2');
    });

    it('should handle errors during retry gracefully', async () => {
      const failedEvents = [
        {
          stripeEventId: 'evt_failed1',
          processed: false,
          retryCount: 1,
        },
      ];

      vi.mocked(WebhookEvent.find).mockImplementation(() => ({
        sort: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(failedEvents),
      }) as any);

      vi.mocked(stripe.events.retrieve).mockRejectedValueOnce(
        new Error('Event not found')
      );

      // Should not throw
      await expect(webhookService.retryFailedEvents()).resolves.not.toThrow();
    });
  });

  describe('order creation', () => {
    it('should create order with proper data from webhook', async () => {
      // Clear all mocks to ensure clean state
      vi.clearAllMocks();
      
      const mockSession: Stripe.Checkout.Session = {
        id: 'cs_test123',
        payment_status: 'paid',
        payment_intent: 'pi_test123',
        metadata: {
          userId: '507f1f77bcf86cd799439011',
          products: JSON.stringify([
            {
              id: 'prod123',
              quantity: 2,
              price: 50,
              variantId: 'var123',
              variantDetails: { size: 'M', color: 'Blue' },
              variantLabel: 'Medium Blue',
            },
          ]),
          couponCode: 'DISCOUNT10',
        },
        amount_total: 9000,
        amount_subtotal: 10000,
        total_details: {
          amount_tax: 0,
          amount_shipping: 0,
          amount_discount: 1000,
        },
        shipping_details: {
          name: 'John Doe',
          address: {
            line1: '123 Main St',
            city: 'New York',
            state: 'NY',
            postal_code: '10001',
            country: 'US',
          },
        },
        customer_details: {
          name: 'John Doe',
          phone: '+1234567890',
          address: {
            line1: '123 Main St',
            city: 'New York',
            state: 'NY',
            postal_code: '10001',
            country: 'US',
          },
        },
      } as any;

      const mockEvent: Stripe.Event = {
        id: 'evt_test123',
        type: 'checkout.session.completed',
        created: Date.now(),
        data: { object: mockSession },
      } as Stripe.Event;

      vi.mocked(WebhookEvent.findOne).mockResolvedValueOnce(null);
      // Mock Order.findOne to return null for order creation
      let orderFindCallCount = 0;
      vi.mocked(Order.findOne).mockImplementation(() => {
        orderFindCallCount++;
        if (orderFindCallCount === 1) {
          // First call - direct call, return null
          return Promise.resolve(null) as any;
        } else {
          // Second call - with .session(), return chainable object
          return {
            session: vi.fn().mockResolvedValue(null),
          } as any;
        }
      });
      vi.mocked(stripe.checkout.sessions.retrieve).mockResolvedValueOnce({
        ...mockSession,
        lastResponse: {
          headers: {},
          requestId: 'req_test123',
          statusCode: 200,
        }
      });
      vi.mocked(User.findById).mockImplementation(() => ({
        session: () => ({ 
          _id: '507f1f77bcf86cd799439011', 
          email: 'test@example.com',
          name: 'John Doe',
          save: vi.fn(),
        }),
      }) as any);
      vi.mocked(Order.countDocuments).mockResolvedValueOnce(10);
      
      // Mock inventory validation to pass
      vi.mocked(inventoryService.validateAndReserveInventory).mockResolvedValueOnce({
        isValid: true,
        errors: [],
        validatedProducts: [{
          productId: 'prod123',
          requestedQuantity: 2,
          availableStock: 10,
          productName: 'Test Product',
          variantId: 'var123',
          variantDetails: 'Medium Blue',
        }],
      });
      
      // Mock inventory deduction
      vi.mocked(inventoryService.atomicInventoryDeduction).mockResolvedValue(true);
      vi.mocked(inventoryService.updateInventory).mockResolvedValue({
        success: true,
        previousQuantity: 10,
        newQuantity: 8,
        availableStock: 8,
        historyRecord: {
          _id: 'history123',
          productId: 'prod123',
          changeType: 'sale',
          changeAmount: -2,
          previousQuantity: 10,
          newQuantity: 8,
          reason: 'sale',
          userId: '507f1f77bcf86cd799439011',
          metadata: {},
          timestamp: new Date(),
        } as any,
      });
      
      let savedOrder: any;
      vi.mocked(Order).mockImplementation((data) => {
        savedOrder = data;
        return {
          save: vi.fn().mockResolvedValue({ _id: 'order123' }),
        } as any;
      });
      
      // Mock Order.findById for email
      vi.mocked(Order.findById).mockImplementation(() => ({
        populate: () => ({
          session: () => ({ _id: 'order123', products: [] }),
        }),
      }) as any);

      await webhookService.processWebhookEvent(mockEvent);

      expect(savedOrder).toMatchObject({
        orderNumber: expect.stringMatching(/^ORD-\d{8}-\d{4}$/),
        user: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        products: [
          {
            product: 'prod123',
            quantity: 2,
            price: 50,
            variantId: 'var123',
            variantDetails: { size: 'M', color: 'Blue' },
            variantLabel: 'Medium Blue',
          },
        ],
        totalAmount: 90,
        subtotal: 100,
        tax: 0,
        shipping: 0,
        discount: 10,
        stripeSessionId: 'cs_test123',
        paymentIntentId: 'pi_test123',
        couponCode: 'DISCOUNT10',
        originalAmount: 100,
        webhookEventId: 'evt_test123',
        shippingAddress: expect.objectContaining({
          fullName: 'John Doe',
          line1: '123 Main St',
          city: 'New York',
          state: 'NY',
          postalCode: '10001',
          country: 'US',
          phone: '+1234567890',
        }),
        billingAddress: expect.objectContaining({
          fullName: 'John Doe',
          line1: '123 Main St',
          city: 'New York',
          state: 'NY',
          postalCode: '10001',
          country: 'US',
        }),
      });
    });
  });
});