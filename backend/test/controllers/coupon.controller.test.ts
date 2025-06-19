import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Response } from 'express';
import { AuthRequest } from '../../types/express.js';
import { applyCoupon, removeCoupon } from '../../controllers/coupon.controller.js';
import { couponService } from '../../services/coupon.service.js';
import { cartService } from '../../services/cart.service.js';
import mongoose from 'mongoose';
import { IUserDocument } from '../../models/user.model.js';

vi.mock('../../services/coupon.service.js');
vi.mock('../../services/cart.service.js');

describe('CouponController - Concurrent Usage Prevention', () => {
  let mockReq: Partial<AuthRequest>;
  let mockRes: Partial<Response>;
  let mockUser: IUserDocument;
  let statusMock: vi.Mock;
  let jsonMock: vi.Mock;

  beforeEach(() => {
    mockUser = {
      _id: new mongoose.Types.ObjectId(),
      email: 'test@example.com',
      appliedCoupon: null,
      save: vi.fn()
    } as unknown as IUserDocument;

    jsonMock = vi.fn();
    statusMock = vi.fn().mockReturnValue({ json: jsonMock });

    mockReq = {
      user: mockUser,
      body: {}
    };

    mockRes = {
      status: statusMock,
      json: jsonMock
    };

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('applyCoupon - concurrent request handling', () => {
    it('should handle simultaneous coupon applications correctly', async () => {
      mockReq.body = { code: 'RACE20' };
      
      // Mock cart response
      const mockCartResponse = {
        cartItems: [],
        subtotal: 100,
        totalAmount: 80,
        appliedCoupon: { code: 'RACE20', discountPercentage: 20 }
      };

      // Simulate slow database operation
      let applyCouponResolve: ((value: void) => void) | undefined;
      const applyCouponPromise = new Promise((resolve) => {
        applyCouponResolve = resolve;
      });

      vi.mocked(couponService.applyCouponToUser).mockImplementation(async () => {
        await applyCouponPromise;
        mockUser.appliedCoupon = { code: 'RACE20', discountPercentage: 20 };
      });

      vi.mocked(cartService.calculateCartTotals).mockResolvedValue(mockCartResponse);

      // Start three concurrent requests
      const request1 = applyCoupon(mockReq as AuthRequest, mockRes as Response, vi.fn());
      const request2 = applyCoupon(mockReq as AuthRequest, mockRes as Response, vi.fn());
      const request3 = applyCoupon(mockReq as AuthRequest, mockRes as Response, vi.fn());

      // All requests should be pending
      expect(couponService.applyCouponToUser).toHaveBeenCalledTimes(3);

      // Resolve the database operation
      applyCouponResolve();

      // Wait for all requests to complete
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      // All requests should complete successfully
      expect(jsonMock).toHaveBeenCalledTimes(3);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: "Coupon applied successfully",
        cart: mockCartResponse
      });
    });

    it('should handle race condition when user already has a coupon', async () => {
      // User already has a coupon
      mockUser.appliedCoupon = { code: 'EXISTING10', discountPercentage: 10 };
      mockReq.body = { code: 'NEW20' };

      const mockCartResponse = {
        cartItems: [],
        subtotal: 100,
        totalAmount: 80,
        appliedCoupon: { code: 'NEW20', discountPercentage: 20 }
      };

      vi.mocked(couponService.applyCouponToUser).mockImplementation(async () => {
        // Simulate checking existing coupon
        if (mockUser.appliedCoupon && mockUser.appliedCoupon.code !== 'NEW20') {
          mockUser.appliedCoupon = { code: 'NEW20', discountPercentage: 20 };
        }
      });

      vi.mocked(cartService.calculateCartTotals).mockResolvedValue(mockCartResponse);

      // Execute multiple concurrent requests
      await Promise.all([
        applyCoupon(mockReq as any, mockRes as any, vi.fn()),
        applyCoupon(mockReq as any, mockRes as any, vi.fn())
      ]);

      // Should replace the existing coupon
      expect(mockUser.appliedCoupon.code).toBe('NEW20');
    });

    it('should handle error in one request without affecting others', async () => {
      mockReq.body = { code: 'ERROR20' };
      
      let callCount = 0;
      vi.mocked(couponService.applyCouponToUser).mockImplementation(async () => {
        callCount++;
        if (callCount === 2) {
          throw new Error('Database connection lost');
        }
        mockUser.appliedCoupon = { code: 'ERROR20', discountPercentage: 20 };
      });

      const mockCartResponse = {
        cartItems: [],
        subtotal: 100,
        totalAmount: 80,
        appliedCoupon: { code: 'ERROR20', discountPercentage: 20 }
      };
      vi.mocked(cartService.calculateCartTotals).mockResolvedValue(mockCartResponse);

      const nextFn1 = vi.fn();
      const nextFn2 = vi.fn();
      const nextFn3 = vi.fn();

      // Execute three requests
      await Promise.allSettled([
        applyCoupon(mockReq as any, mockRes as any, nextFn1),
        applyCoupon(mockReq as any, mockRes as any, nextFn2), // This one will fail
        applyCoupon(mockReq as any, mockRes as any, nextFn3)
      ]);

      // Two should succeed, one should fail
      expect(jsonMock).toHaveBeenCalledTimes(2);
      expect(nextFn2).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Database connection lost'
      }));
    });
  });

  describe('removeCoupon - concurrent request handling', () => {
    it('should handle simultaneous coupon removals correctly', async () => {
      mockUser.appliedCoupon = { code: 'REMOVE20', discountPercentage: 20 };

      const mockCartResponse = {
        cartItems: [],
        subtotal: 100,
        totalAmount: 100,
        appliedCoupon: null
      };

      let removeCouponResolve: ((value: void) => void) | undefined;
      const removeCouponPromise = new Promise((resolve) => {
        removeCouponResolve = resolve;
      });

      vi.mocked(couponService.removeCouponFromUser).mockImplementation(async () => {
        await removeCouponPromise;
        mockUser.appliedCoupon = null;
      });

      vi.mocked(cartService.calculateCartTotals).mockResolvedValue(mockCartResponse);

      // Start three concurrent removal requests
      const request1 = removeCoupon(mockReq as AuthRequest, mockRes as Response, vi.fn());
      const request2 = removeCoupon(mockReq as AuthRequest, mockRes as Response, vi.fn());
      const request3 = removeCoupon(mockReq as AuthRequest, mockRes as Response, vi.fn());

      // Resolve the operation
      removeCouponResolve();

      await Promise.all([request1, request2, request3]);

      // All should complete successfully
      expect(jsonMock).toHaveBeenCalledTimes(3);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: "Coupon removed successfully",
        cart: mockCartResponse
      });
      expect(mockUser.appliedCoupon).toBeNull();
    });

    it('should handle removal when no coupon exists', async () => {
      mockUser.appliedCoupon = null;

      const mockCartResponse = {
        cartItems: [],
        subtotal: 100,
        totalAmount: 100,
        appliedCoupon: null
      };

      vi.mocked(couponService.removeCouponFromUser).mockResolvedValue(undefined);
      vi.mocked(cartService.calculateCartTotals).mockResolvedValue(mockCartResponse);

      // Multiple concurrent requests to remove non-existent coupon
      await Promise.all([
        removeCoupon(mockReq as any, mockRes as any, vi.fn()),
        removeCoupon(mockReq as any, mockRes as any, vi.fn())
      ]);

      expect(jsonMock).toHaveBeenCalledTimes(2);
      expect(mockUser.appliedCoupon).toBeNull();
    });
  });

  describe('apply and remove race conditions', () => {
    it('should handle apply and remove called simultaneously', async () => {
      mockUser.appliedCoupon = null;
      mockReq.body = { code: 'CONFLICT20' };

      // Mock responses
      const applyCartResponse = {
        cartItems: [],
        subtotal: 100,
        totalAmount: 80,
        appliedCoupon: { code: 'CONFLICT20', discountPercentage: 20 }
      };

      const removeCartResponse = {
        cartItems: [],
        subtotal: 100,
        totalAmount: 100,
        appliedCoupon: null
      };

      // Set up mocks with delays to simulate race condition
      let applyResolve: ((value: void) => void) | undefined;
      let removeResolve: ((value: void) => void) | undefined;
      
      const applyPromise = new Promise(resolve => { applyResolve = resolve; });
      const removePromise = new Promise(resolve => { removeResolve = resolve; });

      vi.mocked(couponService.applyCouponToUser).mockImplementation(async () => {
        await applyPromise;
        mockUser.appliedCoupon = { code: 'CONFLICT20', discountPercentage: 20 };
      });

      vi.mocked(couponService.removeCouponFromUser).mockImplementation(async () => {
        await removePromise;
        mockUser.appliedCoupon = null;
      });

      vi.mocked(cartService.calculateCartTotals)
        .mockResolvedValueOnce(applyCartResponse)
        .mockResolvedValueOnce(removeCartResponse);

      // Start both operations
      const applyRequest = applyCoupon(mockReq as AuthRequest, mockRes as Response, vi.fn());
      const removeRequest = removeCoupon(mockReq as AuthRequest, mockRes as Response, vi.fn());

      // Resolve in specific order to test race condition
      removeResolve();
      await new Promise(resolve => setTimeout(resolve, 10));
      applyResolve();

      await Promise.all([applyRequest, removeRequest]);

      // Both should complete, final state depends on execution order
      expect(jsonMock).toHaveBeenCalledTimes(2);
    });

    it('should maintain data integrity with rapid apply/remove cycles', async () => {
      const operations: Promise<void>[] = [];
      
      // Alternate between apply and remove
      for (let i = 0; i < 10; i++) {
        if (i % 2 === 0) {
          mockReq.body = { code: `CYCLE${i}` };
          vi.mocked(couponService.applyCouponToUser).mockResolvedValueOnce(undefined);
          vi.mocked(cartService.calculateCartTotals).mockResolvedValueOnce({
            cartItems: [],
            subtotal: 100,
            totalAmount: 90,
            appliedCoupon: { code: `CYCLE${i}`, discountPercentage: 10 }
          });
          applyCoupon(mockReq as AuthRequest, mockRes as Response, vi.fn());
          operations.push(Promise.resolve());
        } else {
          vi.mocked(couponService.removeCouponFromUser).mockResolvedValueOnce(undefined);
          vi.mocked(cartService.calculateCartTotals).mockResolvedValueOnce({
            cartItems: [],
            subtotal: 100,
            totalAmount: 100,
            appliedCoupon: null
          });
          removeCoupon(mockReq as AuthRequest, mockRes as Response, vi.fn());
          operations.push(Promise.resolve());
        }
      }

      await Promise.all(operations);

      // All operations should complete
      expect(jsonMock).toHaveBeenCalledTimes(10);
    });
  });
});