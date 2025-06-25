import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../server.js';
import { User, type IUserDocument } from '../models/user.model.js';
import { Product, type IProductDocument } from '../models/product.model.js';
import jwt from 'jsonwebtoken';
import { TypeGuards } from './helpers/typed-mock-utils.js';

describe('Checkout Integration', () => {
  let mongoServer: MongoMemoryServer;
  let token: string;
  let testUser: IUserDocument;
  let testProduct: IProductDocument & { _id: mongoose.Types.ObjectId };

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear all collections
    await User.deleteMany({});
    await Product.deleteMany({});

    // Create test user
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    });

    // Generate JWT token
    token = jwt.sign(
      { userId: testUser._id },
      process.env.ACCESS_TOKEN_SECRET ?? 'test-secret',
      { expiresIn: '1h' },
    );

    // Create test product with variant
    testProduct = (await Product.create({
      name: 'Test Product',
      description: 'Test description',
      price: 29.99,
      image: 'https://example.com/image.jpg',
      sku: 'TEST-001',
      variants: [
        {
          variantId: 'variant-1',
          label: 'Large',
          price: 29.99,
          inventory: 10,
          reservedInventory: 0,
          images: [],
        },
      ],
    })) as IProductDocument & { _id: mongoose.Types.ObjectId };
  });

  describe('POST /api/payments/create-checkout-session', () => {
    it('should create checkout session without price field', async () => {
      const checkoutData = {
        products: [
          {
            _id: testProduct._id.toString(),
            quantity: 2,
            variantId: 'variant-1',
            variantLabel: 'Large',
          },
        ],
      };

      const response = await request(app)
        .post('/api/payments/create-checkout-session')
        .set('Authorization', `Bearer ${token}`)
        .send(checkoutData);

      void expect(response.status).toBe(200);
      void expect(response.body).toHaveProperty('id');
      const responseBody = response.body as { id: string };
      void expect(responseBody.id).toMatch(/^cs_test_/); // Stripe session ID format
    });

    it('should create checkout session with coupon code', async () => {
      const checkoutData = {
        products: [
          {
            _id: testProduct._id.toString(),
            quantity: 1,
            variantId: 'variant-1',
            variantLabel: 'Large',
          },
        ],
        couponCode: 'DISCOUNT10',
      };

      const response = await request(app)
        .post('/api/payments/create-checkout-session')
        .set('Authorization', `Bearer ${token}`)
        .send(checkoutData);

      void expect(response.status).toBe(200);
      void expect(response.body).toHaveProperty('id');
    });

    it('should reject checkout with invalid product ID', async () => {
      const checkoutData = {
        products: [
          {
            _id: 'invalid-id',
            quantity: 1,
          },
        ],
      };

      const response = await request(app)
        .post('/api/payments/create-checkout-session')
        .set('Authorization', `Bearer ${token}`)
        .send(checkoutData);

      void expect(response.status).toBe(400);
      if (TypeGuards.isApiErrorResponse(response.body)) {
        void expect(response.body.success).toBe(false);
        void expect(response.body.errors).toBeDefined();
      } else {
        throw new Error('Expected error response');
      }
    });

    it('should reject checkout with insufficient inventory', async () => {
      const checkoutData = {
        products: [
          {
            _id: testProduct._id.toString(),
            quantity: 100, // More than available
            variantId: 'variant-1',
          },
        ],
      };

      const response = await request(app)
        .post('/api/payments/create-checkout-session')
        .set('Authorization', `Bearer ${token}`)
        .send(checkoutData);

      void expect(response.status).toBe(400);
      const body = response.body as { success: boolean; error: string };
      void expect(body.success).toBe(false);
      void expect(body.error).toContain('Insufficient inventory');
    });

    it('should reject checkout with null couponCode', async () => {
      const checkoutData = {
        products: [
          {
            _id: testProduct._id.toString(),
            quantity: 1,
            variantId: 'variant-1',
          },
        ],
        couponCode: null, // This should be rejected
      };

      const response = await request(app)
        .post('/api/payments/create-checkout-session')
        .set('Authorization', `Bearer ${token}`)
        .send(checkoutData);

      void expect(response.status).toBe(400);
      const body = response.body as { success: boolean; errors: { message: string }[] };
      void expect(body).toHaveProperty('success', false);
      void expect(body).toHaveProperty('errors');
      void expect(Array.isArray(body.errors)).toBe(true);
      void expect(body.errors[0]).toHaveProperty('message');
      void expect(body.errors[0].message).toContain('Expected string');
    });

    it('should handle multiple products in single checkout', async () => {
      // Create another product
      const secondProduct = (await Product.create({
        name: 'Second Product',
        description: 'Another test product',
        price: 19.99,
        image: 'https://example.com/image2.jpg',
        sku: 'TEST-002',
        variants: [
          {
            variantId: 'default',
            label: 'Default',
            price: 19.99,
            inventory: 5,
            images: [],
          },
        ],
      })) as IProductDocument & { _id: mongoose.Types.ObjectId };

      const checkoutData = {
        products: [
          {
            _id: testProduct._id.toString(),
            quantity: 2,
            variantId: 'variant-1',
            variantLabel: 'Large',
          },
          {
            _id: secondProduct._id.toString(),
            quantity: 1,
            variantId: 'default',
            variantLabel: 'Default',
          },
        ],
      };

      const response = await request(app)
        .post('/api/payments/create-checkout-session')
        .set('Authorization', `Bearer ${token}`)
        .send(checkoutData);

      void expect(response.status).toBe(200);
      void expect(response.body).toHaveProperty('id');
    });

    it('should reject checkout without authentication', async () => {
      const checkoutData = {
        products: [
          {
            _id: testProduct._id.toString(),
            quantity: 1,
            variantId: 'variant-1',
          },
        ],
      };

      const response = await request(app)
        .post('/api/payments/create-checkout-session')
        .send(checkoutData);

      void expect(response.status).toBe(401);
    });
  });
});