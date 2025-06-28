import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import Stripe from 'stripe';
import { stripe } from '../lib/stripe.js';
import paymentRouter from '../routes/payment.route.js';
import { WebhookEvent } from '../models/webhook-event.model.js';
import { Order } from '../models/order.model.js';
import { User } from '../models/user.model.js';
import { Product } from '../models/product.model.js';
import { connectDB } from '../lib/db.js';
import mongoose from 'mongoose';
import { WebhookError } from '../types/webhook.types.js';

// Mock stripe signature verification
vi.mock('../lib/stripe.js', () => ({
  stripe: {
    webhooks: {
      constructEvent: vi.fn(),
    },
    checkout: {
      sessions: {
        retrieve: vi.fn(),
      },
    },
  },
}));

describe('Webhook Integration Tests', () => {
  let app: express.Application;
  let mockSession: Partial<Stripe.Checkout.Session>;
  let testUser: any;
  let testProduct: any;

  beforeEach(async () => {
    // Connect to test database
    await connectDB();

    // Clear collections
    await WebhookEvent.deleteMany({});
    await Order.deleteMany({});
    await User.deleteMany({});
    await Product.deleteMany({});

    // Create test data
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'hashedpassword',
    });

    testProduct = await Product.create({
      name: 'Test Product',
      slug: 'test-product',
      price: 100,
      description: 'Test product description',
      image: 'https://example.com/image.jpg',
      variants: [{
        variantId: 'default',
        label: 'Default',
        price: 100,
        inventory: 10,
      }],
    });

    // Setup Express app
    app = express();
    
    // Apply raw body parser for webhook endpoint BEFORE mounting the router
    app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
    
    // Apply JSON parsing to all other routes
    app.use((req, res, next) => {
      if (req.path === '/api/payments/webhook') {
        next();
      } else {
        express.json()(req, res, next);
      }
    });
    
    // Mount the payment router
    app.use('/api/payments', paymentRouter);

    // Setup mock session
    mockSession = {
      id: 'cs_test_123',
      payment_status: 'paid',
      amount_total: 10000,
      amount_subtotal: 9000,
      total_details: {
        amount_tax: 500,
        amount_shipping: 500,
        amount_discount: 0,
      },
      customer_details: {
        email: 'test@example.com',
        name: 'Test User',
        phone: null,
        tax_exempt: 'none' as const,
        tax_ids: [],
        address: {
          line1: '123 Test St',
          line2: null,
          city: 'Test City',
          state: 'TS',
          postal_code: '12345',
          country: 'US',
        },
      },
      shipping_details: {
        name: 'Test User',
        address: {
          line1: '123 Test St',
          line2: null,
          city: 'Test City',
          state: 'TS',
          postal_code: '12345',
          country: 'US',
        },
      },
      metadata: {
        userId: testUser._id.toString(),
        products: JSON.stringify([{
          id: testProduct._id.toString(),
          name: 'Test Product',
          price: 100,
          image: 'https://example.com/image.jpg',
          quantity: 2,
        }]),
      },
    };

    // Set webhook secret
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
  });

  afterEach(async () => {
    // Clean up test data before closing connection
    await Promise.all([
      WebhookEvent.deleteMany({}),
      Order.deleteMany({}),
      User.deleteMany({}),
      Product.deleteMany({}),
    ]);

    await mongoose.connection.close();
    vi.clearAllMocks();
  });

  describe('POST /api/payments/webhook', () => {
    it('should successfully process a valid checkout.session.completed event', async () => {
      const mockEvent: Partial<Stripe.Event> = {
        id: 'evt_test_123',
        type: 'checkout.session.completed',
        created: Date.now(),
        data: {
          object: mockSession as Stripe.Checkout.Session,
        },
      };

      // Mock stripe signature verification
      vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(mockEvent as Stripe.Event);
      vi.mocked(stripe.checkout.sessions.retrieve).mockResolvedValue({
        ...mockSession,
        line_items: {
          data: [{
            id: 'li_test_123',
            price: {
              product: testProduct._id.toString(),
            },
            quantity: 2,
          }],
        },
      } as any);

      const response = await request(app)
        .post('/api/payments/webhook')
        .set('stripe-signature', 'test-signature')
        .send(Buffer.from(JSON.stringify(mockEvent)));
      
      if (response.status !== 200) {
        console.log('Test 1 - Response error:', response.status, response.body);
      }
      expect(response.status).toBe(200);

      expect(response.body).toMatchObject({
        received: true,
        processed: true,
      });
      expect(response.body.orderId).toBeDefined();

      // Verify order was created
      const order = await Order.findOne({ stripeSessionId: 'cs_test_123' });
      expect(order).toBeTruthy();
      expect(order?.user.toString()).toBe(testUser._id.toString());
      expect(order?.totalAmount).toBe(100);
      expect(order?.status).toBe('completed');

      // Verify webhook event was recorded
      const webhookEvent = await WebhookEvent.findOne({ stripeEventId: 'evt_test_123' });
      expect(webhookEvent).toBeTruthy();
      expect(webhookEvent?.processed).toBe(true);
    });

    it('should handle insufficient inventory gracefully', async () => {
      // Update product to have insufficient inventory
      await Product.findByIdAndUpdate(testProduct._id, {
        'variants.0.inventory': 1
      });

      const mockEvent: Partial<Stripe.Event> = {
        id: 'evt_test_inventory_123',
        type: 'checkout.session.completed',
        data: {
          object: mockSession as Stripe.Checkout.Session,
        },
      };

      vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(mockEvent as Stripe.Event);
      vi.mocked(stripe.checkout.sessions.retrieve).mockResolvedValue({
        ...mockSession,
        line_items: {
          data: [{
            id: 'li_test_123',
            price: {
              product: testProduct._id.toString(),
            },
            quantity: 2,
          }],
        },
      } as any);

      await request(app)
        .post('/api/payments/webhook')
        .set('stripe-signature', 'test-signature')
        .send(Buffer.from(JSON.stringify(mockEvent)))
        .expect(200);

      // Verify order was created with pending_inventory status
      const order = await Order.findOne({ stripeSessionId: 'cs_test_123' });
      expect(order).toBeTruthy();
      expect(order?.status).toBe('pending_inventory');
      expect(order?.inventoryIssues).toBeDefined();
      expect(order?.inventoryIssues?.length).toBeGreaterThan(0);

      // Verify inventory was NOT deducted
      const updatedProduct = await Product.findById(testProduct._id);
      expect(updatedProduct?.variants[0]?.inventory).toBe(1);
    });

    it('should reject events with invalid signature', async () => {
      const mockEvent = {
        id: 'evt_test_invalid',
        type: 'checkout.session.completed',
        data: { object: mockSession },
      };

      // Mock signature verification failure
      vi.mocked(stripe.webhooks.constructEvent).mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      const response = await request(app)
        .post('/api/payments/webhook')
        .set('stripe-signature', 'invalid-signature')
        .send(Buffer.from(JSON.stringify(mockEvent)))
        .expect(401);

      expect(response.body.error).toBe('Invalid webhook signature');
    });

    it('should handle missing stripe-signature header', async () => {
      const response = await request(app)
        .post('/api/payments/webhook')
        .send(Buffer.from(JSON.stringify({ test: 'data' })))
        .expect(401);

      expect(response.body.error).toBe('Missing stripe-signature header');
    });

    it('should prevent duplicate event processing', async () => {
      // Create a processed event
      await WebhookEvent.create({
        stripeEventId: 'evt_test_duplicate',
        type: 'checkout.session.completed',
        processed: true,
        retryCount: 0,
      });

      const mockEvent: Partial<Stripe.Event> = {
        id: 'evt_test_duplicate',
        type: 'checkout.session.completed',
        data: {
          object: mockSession as Stripe.Checkout.Session,
        },
      };

      vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(mockEvent as Stripe.Event);

      const response = await request(app)
        .post('/api/payments/webhook')
        .set('stripe-signature', 'test-signature')
        .send(Buffer.from(JSON.stringify(mockEvent)))
        .expect(200);

      expect(response.body).toMatchObject({
        received: true,
        processed: false,
      });

      // Verify no new order was created
      const orderCount = await Order.countDocuments();
      expect(orderCount).toBe(0);
    });

    it('should handle network timeouts gracefully', async () => {
      const mockEvent: Partial<Stripe.Event> = {
        id: 'evt_test_timeout',
        type: 'checkout.session.completed',
        data: {
          object: mockSession as Stripe.Checkout.Session,
        },
      };

      vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(mockEvent as Stripe.Event);
      
      // Mock a timeout when retrieving session
      vi.mocked(stripe.checkout.sessions.retrieve).mockRejectedValue(
        new Error('Request timeout')
      );

      const response = await request(app)
        .post('/api/payments/webhook')
        .set('stripe-signature', 'test-signature')
        .send(Buffer.from(JSON.stringify(mockEvent)))
        .expect(500);

      expect(response.body.error).toContain('Request timeout');
    });

    it('should handle missing session gracefully', async () => {
      const mockEvent: Partial<Stripe.Event> = {
        id: 'evt_test_missing_session',
        type: 'checkout.session.completed',
        data: {
          object: { 
            id: 'cs_test_missing',
            payment_status: 'paid'
          } as Stripe.Checkout.Session,
        },
      };

      vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(mockEvent as Stripe.Event);
      vi.mocked(stripe.checkout.sessions.retrieve).mockResolvedValue(null as any);

      const response = await request(app)
        .post('/api/payments/webhook')
        .set('stripe-signature', 'test-signature')
        .send(Buffer.from(JSON.stringify(mockEvent)))
        .expect(200);

      expect(response.body).toMatchObject({
        received: true,
        processed: false,
        error: 'Session not found',
        code: 'SESSION_NOT_FOUND',
      });
    });

    it('should handle raw body correctly', async () => {
      const mockEvent: Partial<Stripe.Event> = {
        id: 'evt_test_raw_body',
        type: 'checkout.session.completed',
        data: {
          object: mockSession as Stripe.Checkout.Session,
        },
      };

      // Mock to capture the actual body passed to constructEvent
      let capturedBody: any;
      vi.mocked(stripe.webhooks.constructEvent).mockImplementation((body) => {
        capturedBody = body;
        return mockEvent as Stripe.Event;
      });

      vi.mocked(stripe.checkout.sessions.retrieve).mockResolvedValue({
        ...mockSession,
        line_items: {
          data: [{
            id: 'li_test_123',
            price: {
              product: testProduct._id.toString(),
            },
            quantity: 1,
          }],
        },
      } as any);

      const rawBody = JSON.stringify(mockEvent);
      await request(app)
        .post('/api/payments/webhook')
        .set('stripe-signature', 'test-signature')
        .set('content-type', 'application/json')
        .send(rawBody)
        .expect(200);

      // Verify the body was passed as a Buffer
      expect(Buffer.isBuffer(capturedBody)).toBe(true);
      expect(capturedBody.toString()).toBe(rawBody);
    });
  });

  describe('Webhook Retry Mechanism', () => {
    it('should record failed webhook events for retry', async () => {
      const testEventId = `evt_test_fail_${Date.now()}`;
      const mockEvent: Partial<Stripe.Event> = {
        id: testEventId,
        type: 'checkout.session.completed',
        data: {
          object: mockSession as Stripe.Checkout.Session,
        },
      };

      vi.mocked(stripe.webhooks.constructEvent).mockReturnValue(mockEvent as Stripe.Event);
      
      // Mock an error during processing
      vi.mocked(stripe.checkout.sessions.retrieve).mockRejectedValue(
        new WebhookError('Processing failed', 'PROCESSING_ERROR', 500, true)
      );

      await request(app)
        .post('/api/payments/webhook')
        .set('stripe-signature', 'test-signature')
        .send(Buffer.from(JSON.stringify(mockEvent)))
        .expect(500);

      // Verify webhook event was recorded as failed
      const webhookEvent = await WebhookEvent.findOne({ stripeEventId: testEventId });
      expect(webhookEvent).toBeTruthy();
      expect(webhookEvent?.processed).toBe(false);
      expect(webhookEvent?.attempts).toBe(1);
      expect(webhookEvent?.lastError).toContain('Processing failed');
    });
  });
});