import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { PaymentService } from '../../services/payment.service.js';
import { couponService } from '../../services/coupon.service.js';
import { stripe } from '../../lib/stripe.js';
import { Coupon } from '../../models/coupon.model.js';
import { Order } from '../../models/order.model.js';
import { Product } from '../../models/product.model.js';
import { AppError } from '../../utils/AppError.js';
import mongoose from 'mongoose';

vi.mock('../../lib/stripe.js');
vi.mock('../../models/coupon.model.js');
vi.mock('../../models/order.model.js');
vi.mock('../../models/product.model.js');
vi.mock('../../services/coupon.service.js');

describe('PaymentService - Coupon Integration', () => {
  let paymentService: PaymentService;
  const mockUser = {
    _id: new mongoose.Types.ObjectId(),
    email: 'test@example.com',
  };

  beforeEach(() => {
    paymentService = new PaymentService();
    vi.clearAllMocks();
    
    // Mock mongoose session
    const mockSession = {
      withTransaction: vi.fn(async (fn) => await fn()),
      endSession: vi.fn(),
    };
    vi.spyOn(mongoose, 'startSession').mockResolvedValue(mockSession as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createCheckoutSession with coupons', () => {
    const mockProducts = [
      { _id: '507f1f77bcf86cd799439011', quantity: 2 },
      { _id: '507f1f77bcf86cd799439012', quantity: 1 },
    ];

    const mockValidProducts = [
      { _id: '507f1f77bcf86cd799439011', name: 'Product 1', price: 50, image: 'image1.jpg' },
      { _id: '507f1f77bcf86cd799439012', name: 'Product 2', price: 100, image: 'image2.jpg' },
    ];

    beforeEach(() => {
      vi.mocked(Product.find).mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockValidProducts),
      } as any);

      vi.mocked(stripe.checkout.sessions.create).mockResolvedValue({
        id: 'test-session-id',
      } as any);
    });

    it('should apply user-specific coupon correctly', async () => {
      const mockCoupon = {
        _id: 'coupon-id',
        code: 'USER20',
        discountPercentage: 20,
        expirationDate: new Date(Date.now() + 86400000),
        isActive: true,
        userId: mockUser._id,
      };

      vi.mocked(Coupon.findOne).mockResolvedValue(mockCoupon);
      vi.mocked(stripe.coupons.create).mockResolvedValue({ id: 'stripe-coupon-id' } as any);

      const sessionId = await paymentService.createCheckoutSession(
        mockUser as any,
        mockProducts,
        'USER20'
      );

      expect(sessionId).toBe('test-session-id');
      expect(Coupon.findOne).toHaveBeenCalledWith({
        code: 'USER20',
        userId: mockUser._id,
        isActive: true,
      });

      // Verify Stripe session was created with discount
      expect(stripe.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          discounts: [{ coupon: 'stripe-coupon-id' }],
          metadata: expect.objectContaining({
            couponCode: 'USER20',
          }),
        })
      );
    });

    it('should apply general discount code when no user-specific coupon found', async () => {
      const mockGeneralCoupon = {
        _id: 'general-coupon-id',
        code: 'SUMMER20',
        discountPercentage: 20,
        expirationDate: new Date(Date.now() + 86400000),
        isActive: true,
        maxUses: 100,
        currentUses: 10,
        minimumPurchaseAmount: 50,
      };

      vi.mocked(Coupon.findOne)
        .mockResolvedValueOnce(null) // No user-specific coupon
        .mockResolvedValueOnce(mockGeneralCoupon); // General coupon found

      vi.mocked(stripe.coupons.create).mockResolvedValue({ id: 'stripe-coupon-id' } as any);

      const sessionId = await paymentService.createCheckoutSession(
        mockUser as any,
        mockProducts,
        'summer20'
      );

      expect(sessionId).toBe('test-session-id');
      expect(Coupon.findOne).toHaveBeenCalledTimes(2);
    });

    it('should validate minimum purchase amount', async () => {
      const mockCoupon = {
        code: 'MIN100',
        discountPercentage: 25,
        expirationDate: new Date(Date.now() + 86400000),
        isActive: true,
        minimumPurchaseAmount: 300, // $300 minimum
      };

      vi.mocked(Coupon.findOne)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockCoupon);

      // Total is $200 (50*2 + 100*1), which is less than $300
      await expect(
        paymentService.createCheckoutSession(mockUser as any, mockProducts, 'MIN100')
      ).rejects.toThrow(new AppError('Minimum purchase amount of $300 required', 400));
    });

    it('should check max uses limit', async () => {
      const mockCoupon = {
        code: 'MAXED',
        discountPercentage: 15,
        expirationDate: new Date(Date.now() + 86400000),
        isActive: true,
        maxUses: 5,
        currentUses: 5,
      };

      vi.mocked(Coupon.findOne)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockCoupon);

      await expect(
        paymentService.createCheckoutSession(mockUser as any, mockProducts, 'MAXED')
      ).rejects.toThrow(new AppError('Coupon has reached maximum usage limit', 400));
    });
  });

  describe('processCheckoutSuccess with coupons', () => {
    const mockSessionId = 'cs_test_123';
    const mockStripeSession = {
      payment_status: 'paid',
      amount_total: 16000, // $160
      metadata: {
        userId: 'user123',
        couponCode: 'SAVE20',
        products: JSON.stringify([
          { id: 'prod1', quantity: 2, price: 50 },
          { id: 'prod2', quantity: 1, price: 100 },
        ]),
      },
    };

    beforeEach(() => {
      vi.mocked(stripe.checkout.sessions.retrieve).mockResolvedValue(mockStripeSession as any);
      
      // Mock Order constructor and save method
      const mockOrder = {
        _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'),
        totalAmount: 160,
        save: vi.fn().mockResolvedValue(true),
      };
      
      vi.mocked(Order).mockImplementation(() => mockOrder as any);
    });

    it('should increment coupon usage on successful payment', async () => {
      const result = await paymentService.processCheckoutSuccess(mockSessionId);

      expect(couponService.incrementUsage).toHaveBeenCalledWith('SAVE20');
      expect(result.totalAmount).toBe(160);
    });

    it('should use transaction for atomicity', async () => {
      const mockSession = {
        withTransaction: vi.fn(async (fn) => await fn()),
        endSession: vi.fn(),
      };
      vi.mocked(mongoose.startSession).mockResolvedValue(mockSession as any);

      await paymentService.processCheckoutSuccess(mockSessionId);

      expect(mongoose.startSession).toHaveBeenCalled();
      expect(mockSession.withTransaction).toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
    });

    it('should rollback on coupon increment failure', async () => {
      vi.mocked(couponService.incrementUsage).mockRejectedValue(
        new AppError('Coupon has reached maximum usage limit', 400)
      );

      const mockSession = {
        withTransaction: vi.fn(async (fn) => {
          try {
            await fn();
          } catch (error) {
            throw error;
          }
        }),
        endSession: vi.fn(),
      };
      vi.mocked(mongoose.startSession).mockResolvedValue(mockSession as any);

      await expect(
        paymentService.processCheckoutSuccess(mockSessionId)
      ).rejects.toThrow();

      expect(Order.prototype.save).not.toHaveBeenCalled();
      expect(mockSession.endSession).toHaveBeenCalled();
    });

    it('should handle payment without coupon', async () => {
      const sessionWithoutCoupon = {
        ...mockStripeSession,
        metadata: {
          ...mockStripeSession.metadata,
          couponCode: '',
        },
      };
      vi.mocked(stripe.checkout.sessions.retrieve).mockResolvedValue(sessionWithoutCoupon as any);

      const result = await paymentService.processCheckoutSuccess(mockSessionId);

      expect(couponService.incrementUsage).not.toHaveBeenCalled();
      expect(result.totalAmount).toBe(160);
    });
  });

  describe('Concurrent coupon usage', () => {
    it('should handle concurrent checkout attempts gracefully', async () => {
      const mockCoupon = {
        code: 'LIMITED1',
        discountPercentage: 50,
        expirationDate: new Date(Date.now() + 86400000),
        isActive: true,
        maxUses: 1,
        currentUses: 0,
      };

      vi.mocked(Coupon.findOne)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockCoupon);

      // First call should succeed
      vi.mocked(couponService.incrementUsage).mockResolvedValueOnce(undefined);
      
      // Second call should fail
      vi.mocked(couponService.incrementUsage).mockRejectedValueOnce(
        new AppError('Coupon has reached maximum usage limit', 400)
      );

      const mockProducts = [{ _id: '507f1f77bcf86cd799439011', quantity: 1 }];
      const mockValidProducts = [{ _id: '507f1f77bcf86cd799439011', name: 'Product', price: 100, image: 'img.jpg' }];
      
      vi.mocked(Product.find).mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockValidProducts),
      } as any);

      vi.mocked(stripe.checkout.sessions.create).mockResolvedValue({ id: 'session1' } as any);
      vi.mocked(stripe.coupons.create).mockResolvedValue({ id: 'stripe-coupon' } as any);

      // First checkout should succeed
      const session1 = await paymentService.createCheckoutSession(
        mockUser as any,
        mockProducts,
        'LIMITED1'
      );
      expect(session1).toBe('session1');

      // Process the first checkout
      vi.mocked(stripe.checkout.sessions.retrieve).mockResolvedValue({
        payment_status: 'paid',
        amount_total: 5000,
        metadata: {
          userId: mockUser._id.toString(),
          couponCode: 'LIMITED1',
          products: JSON.stringify([{ id: mockProducts[0]._id, quantity: 1, price: 100 }]),
        },
      } as any);

      // Mock Order for the concurrent test
      const mockOrder = {
        _id: new mongoose.Types.ObjectId(),
        totalAmount: 50,
        save: vi.fn().mockResolvedValue(true),
      };
      vi.mocked(Order).mockImplementation(() => mockOrder as any);

      const result1 = await paymentService.processCheckoutSuccess('session1');
      expect(result1.totalAmount).toBe(50);

      // Second checkout should fail during processing
      await expect(
        paymentService.processCheckoutSuccess('session2')
      ).rejects.toThrow();
    });
  });
});