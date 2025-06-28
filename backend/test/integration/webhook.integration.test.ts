import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../server.js';
import { WebhookEvent } from '../../models/webhook-event.model.js';
import { Order } from '../../models/order.model.js';
import { User } from '../../models/user.model.js';
import { Product } from '../../models/product.model.js';

// Test webhook secret
const TEST_WEBHOOK_SECRET = 'whsec_test_secret';

describe('Webhook Integration Tests', () => {
  let testUser: any;
  let testProduct: any;

  beforeAll(async () => {
    // Ensure test database connection
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce_test');
    }
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clean up collections
    await Promise.all([
      WebhookEvent.deleteMany({}),
      Order.deleteMany({}),
      User.deleteMany({}),
      Product.deleteMany({}),
    ]);

    // Create test user
    testUser = await User.create({
      name: 'Test User',
      email: 'webhook@test.com',
      password: 'hashedpassword',
      role: 'customer',
    });

    // Create test product
    testProduct = await Product.create({
      name: 'Test Product',
      description: 'Product for webhook testing',
      price: 50,
      image: 'test.jpg',
      category: 'test',
      isFeatured: false,
      inventory: 100,
    });

    // Set test webhook secret
    process.env.STRIPE_WEBHOOK_SECRET = TEST_WEBHOOK_SECRET;
  });

  afterEach(async () => {
    // Clean up after each test
    await Promise.all([
      WebhookEvent.deleteMany({}),
      Order.deleteMany({}),
    ]);
  });

  describe('POST /api/payments/webhook', () => {
    it('should process payment_intent.succeeded webhook successfully', async () => {
      const payload = {
        id: 'evt_test_payment_succeeded',
        type: 'payment_intent.succeeded',
        created: Math.floor(Date.now() / 1000),
        data: {
          object: {
            id: 'pi_test_123',
            metadata: {
              checkoutSessionId: 'cs_test_123',
            },
          },
        },
      };

      // Mock Stripe session retrieval - session values used in mock setup
      // The actual session object would be mocked in the stripe.checkout.sessions.retrieve call

      // Create signature
      const signature = generateWebhookSignature(payload, TEST_WEBHOOK_SECRET);

      // Make webhook request
      const response = await request(app)
        .post('/api/payments/webhook')
        .set('stripe-signature', signature)
        .send(payload)
        .expect(200);

      expect(response.body).toMatchObject({
        received: true,
        processed: true,
        orderId: expect.any(String),
      });

      // Verify webhook event was recorded
      const webhookEvent = await WebhookEvent.findOne({ stripeEventId: 'evt_test_payment_succeeded' });
      expect(webhookEvent).toBeTruthy();
      expect(webhookEvent?.processed).toBe(true);
      expect(webhookEvent?.orderId).toBeTruthy();

      // Verify order was created
      const order = await Order.findOne({ stripeSessionId: 'cs_test_123' });
      expect(order).toBeTruthy();
      expect(order?.totalAmount).toBe(100);
      expect(order?.products).toHaveLength(1);
      expect(order?.webhookEventId).toBe('evt_test_payment_succeeded');
    });

    it('should handle checkout.session.completed webhook', async () => {
      const payload = {
        id: 'evt_test_checkout_completed',
        type: 'checkout.session.completed',
        created: Math.floor(Date.now() / 1000),
        data: {
          object: {
            id: 'cs_test_456',
            payment_status: 'paid',
            payment_intent: 'pi_test_456',
            metadata: {
              userId: testUser._id.toString(),
              products: JSON.stringify([
                {
                  id: testProduct._id.toString(),
                  quantity: 1,
                  price: testProduct.price,
                },
              ]),
            },
            amount_total: 5000,
            amount_subtotal: 5000,
            total_details: {
              amount_tax: 0,
              amount_shipping: 0,
              amount_discount: 0,
            },
          },
        },
      };

      const signature = generateWebhookSignature(payload, TEST_WEBHOOK_SECRET);

      const response = await request(app)
        .post('/api/payments/webhook')
        .set('stripe-signature', signature)
        .send(payload)
        .expect(200);

      expect(response.body.processed).toBe(true);

      const order = await Order.findOne({ stripeSessionId: 'cs_test_456' });
      expect(order).toBeTruthy();
      expect(order?.paymentIntentId).toBe('pi_test_456');
    });

    it('should handle payment_intent.payment_failed webhook', async () => {
      const payload = {
        id: 'evt_test_payment_failed',
        type: 'payment_intent.payment_failed',
        created: Math.floor(Date.now() / 1000),
        data: {
          object: {
            id: 'pi_test_failed',
            metadata: {
              userId: testUser._id.toString(),
            },
            last_payment_error: {
              message: 'Card was declined',
            },
          },
        },
      };

      const signature = generateWebhookSignature(payload, TEST_WEBHOOK_SECRET);

      const response = await request(app)
        .post('/api/payments/webhook')
        .set('stripe-signature', signature)
        .send(payload)
        .expect(200);

      expect(response.body).toMatchObject({
        received: true,
        processed: true,
        error: 'Payment failed',
      });

      // Verify no order was created
      const order = await Order.findOne({ paymentIntentId: 'pi_test_failed' });
      expect(order).toBeFalsy();
    });

    it('should reject webhook with invalid signature', async () => {
      const payload = {
        id: 'evt_test_invalid',
        type: 'payment_intent.succeeded',
        created: Math.floor(Date.now() / 1000),
        data: { object: {} },
      };

      const response = await request(app)
        .post('/api/payments/webhook')
        .set('stripe-signature', 'invalid_signature')
        .send(payload)
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'Invalid webhook signature',
        code: 'INVALID_SIGNATURE',
      });

      // Verify no webhook event was recorded
      const webhookEvent = await WebhookEvent.findOne({ stripeEventId: 'evt_test_invalid' });
      expect(webhookEvent).toBeFalsy();
    });

    it('should handle missing signature header', async () => {
      const payload = {
        id: 'evt_test_no_sig',
        type: 'payment_intent.succeeded',
        created: Math.floor(Date.now() / 1000),
        data: { object: {} },
      };

      const response = await request(app)
        .post('/api/payments/webhook')
        .send(payload)
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'Missing stripe-signature header',
        code: 'SIGNATURE_MISSING',
      });
    });
  });

  describe('Idempotency', () => {
    it('should handle duplicate webhook events gracefully', async () => {
      const payload = {
        id: 'evt_test_duplicate',
        type: 'payment_intent.succeeded',
        created: Math.floor(Date.now() / 1000),
        data: {
          object: {
            id: 'pi_test_dup',
            metadata: {
              checkoutSessionId: 'cs_test_dup',
            },
          },
        },
      };

      const signature = generateWebhookSignature(payload, TEST_WEBHOOK_SECRET);

      // First request - should process
      const response1 = await request(app)
        .post('/api/payments/webhook')
        .set('stripe-signature', signature)
        .send(payload)
        .expect(200);

      expect(response1.body.processed).toBe(true);

      // Second request - should skip
      const response2 = await request(app)
        .post('/api/payments/webhook')
        .set('stripe-signature', signature)
        .send(payload)
        .expect(200);

      expect(response2.body).toMatchObject({
        received: true,
        processed: true,
        error: 'Event already processed',
      });

      // Verify only one order was created
      const orders = await Order.find({ webhookEventId: 'evt_test_duplicate' });
      expect(orders).toHaveLength(1);

      // Verify webhook event is marked as processed
      const webhookEvents = await WebhookEvent.find({ stripeEventId: 'evt_test_duplicate' });
      expect(webhookEvents).toHaveLength(1);
      expect(webhookEvents[0].processed).toBe(true);
    });

    it('should prevent duplicate orders for same session', async () => {
      // Create an existing order
      await Order.create({
        orderNumber: 'ORD-TEST-0001',
        user: testUser._id,
        email: testUser.email,
        products: [],
        totalAmount: 100,
        subtotal: 100,
        tax: 0,
        shipping: 0,
        discount: 0,
        stripeSessionId: 'cs_existing',
        status: 'completed',
        paymentIntentId: 'pi_existing',
      });

      const payload = {
        id: 'evt_test_existing_order',
        type: 'payment_intent.succeeded',
        created: Math.floor(Date.now() / 1000),
        data: {
          object: {
            id: 'pi_new',
            metadata: {
              checkoutSessionId: 'cs_existing',
            },
          },
        },
      };

      const signature = generateWebhookSignature(payload, TEST_WEBHOOK_SECRET);

      const response = await request(app)
        .post('/api/payments/webhook')
        .set('stripe-signature', signature)
        .send(payload)
        .expect(200);

      expect(response.body.processed).toBe(true);

      // Verify no duplicate order was created
      const orders = await Order.find({ stripeSessionId: 'cs_existing' });
      expect(orders).toHaveLength(1);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // Force a database error by closing the connection
      await mongoose.connection.close();

      const payload = {
        id: 'evt_test_db_error',
        type: 'payment_intent.succeeded',
        created: Math.floor(Date.now() / 1000),
        data: {
          object: {
            id: 'pi_test_db_error',
            metadata: {
              checkoutSessionId: 'cs_test_db_error',
            },
          },
        },
      };

      const signature = generateWebhookSignature(payload, TEST_WEBHOOK_SECRET);

      const response = await request(app)
        .post('/api/payments/webhook')
        .set('stripe-signature', signature)
        .send(payload)
        .expect(500);

      expect(response.body).toMatchObject({
        error: expect.any(String),
        code: expect.any(String),
      });

      // Reconnect for cleanup
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce_test');
    });

    it('should handle missing user gracefully', async () => {
      const payload = {
        id: 'evt_test_no_user',
        type: 'checkout.session.completed',
        created: Math.floor(Date.now() / 1000),
        data: {
          object: {
            id: 'cs_test_no_user',
            payment_status: 'paid',
            metadata: {
              userId: new mongoose.Types.ObjectId().toString(), // Non-existent user
              products: JSON.stringify([{ id: testProduct._id.toString(), quantity: 1, price: 50 }]),
            },
            amount_total: 5000,
          },
        },
      };

      const signature = generateWebhookSignature(payload, TEST_WEBHOOK_SECRET);

      const response = await request(app)
        .post('/api/payments/webhook')
        .set('stripe-signature', signature)
        .send(payload)
        .expect(200);

      expect(response.body.processed).toBe(false);

      // Verify webhook event was recorded with error
      const webhookEvent = await WebhookEvent.findOne({ stripeEventId: 'evt_test_no_user' });
      expect(webhookEvent?.error).toBeTruthy();
      expect(webhookEvent?.processed).toBe(false);
    });
  });

  describe('Retry Mechanism', () => {
    it('should allow admin to retry failed webhooks', async () => {
      // Create a failed webhook event
      await WebhookEvent.create({
        stripeEventId: 'evt_test_retry',
        eventType: 'payment_intent.succeeded',
        processed: false,
        error: 'Temporary failure',
        retryCount: 1,
      });

      // Create admin user
      await User.create({
        name: 'Admin User',
        email: 'admin@test.com',
        password: 'hashedpassword',
        role: 'admin',
      });

      // Generate auth token for admin
      const authToken = 'mock_admin_token'; // In real test, generate proper JWT

      const response = await request(app)
        .post('/api/payments/webhook/retry')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Failed webhook retry process initiated',
      });
    });
  });
});

// Helper function to generate webhook signature
function generateWebhookSignature(payload: any, secret: string): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const payloadString = JSON.stringify(payload);
  
  // In real implementation, use proper Stripe signature generation
  // This is a simplified version for testing
  const crypto = require('crypto');
  const signedPayload = `${timestamp}.${payloadString}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');
  
  return `t=${timestamp},v1=${signature}`;
}