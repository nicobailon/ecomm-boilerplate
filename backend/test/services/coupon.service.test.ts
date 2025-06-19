import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CouponService } from '../../services/coupon.service.js';
import { Coupon } from '../../models/coupon.model.js';
import { User } from '../../models/user.model.js';
import { AppError } from '../../utils/AppError.js';
import mongoose from 'mongoose';

vi.mock('../../models/coupon.model.js');
vi.mock('../../models/user.model.js');

describe('CouponService', () => {
  let couponService: CouponService;
  const mockUserId = new mongoose.Types.ObjectId().toString();
  const mockUser = {
    _id: mockUserId,
    email: 'test@example.com',
    appliedCoupon: null,
    save: vi.fn()
  };

  beforeEach(() => {
    couponService = new CouponService();
    vi.clearAllMocks();
    mockUser.appliedCoupon = null;
    mockUser.save.mockResolvedValue(mockUser);
  });

  describe('validateCoupon', () => {
    it('should validate a valid coupon successfully', async () => {
      const mockCoupon = {
        code: 'SAVE20',
        discountPercentage: 20,
        expirationDate: new Date(Date.now() + 86400000), // Tomorrow
        isActive: true,
        save: vi.fn()
      };

      vi.mocked(Coupon.findOne).mockResolvedValue(mockCoupon);

      const result = await couponService.validateCoupon(mockUserId, 'SAVE20');

      expect(result).toEqual({
        message: 'Coupon is valid',
        code: 'SAVE20',
        discountPercentage: 20
      });
      expect(Coupon.findOne).toHaveBeenCalledWith({
        code: 'SAVE20',
        userId: mockUserId,
        isActive: true
      });
    });

    it('should throw error for non-existent coupon', async () => {
      vi.mocked(Coupon.findOne).mockResolvedValue(null);

      await expect(
        couponService.validateCoupon(mockUserId, 'INVALID')
      ).rejects.toThrow(new AppError('Coupon not found', 404));
    });

    it('should throw error for expired coupon and deactivate it', async () => {
      const mockExpiredCoupon = {
        code: 'EXPIRED20',
        discountPercentage: 20,
        expirationDate: new Date(Date.now() - 86400000), // Yesterday
        isActive: true,
        save: vi.fn()
      };

      vi.mocked(Coupon.findOne).mockResolvedValue(mockExpiredCoupon);

      await expect(
        couponService.validateCoupon(mockUserId, 'EXPIRED20')
      ).rejects.toThrow(new AppError('Coupon expired', 404));

      expect(mockExpiredCoupon.isActive).toBe(false);
      expect(mockExpiredCoupon.save).toHaveBeenCalled();
    });

    it('should handle edge case: coupon expires at exact current time', async () => {
      const now = new Date();
      const mockCoupon = {
        code: 'EDGE20',
        discountPercentage: 20,
        expirationDate: new Date(now.getTime() - 1), // 1ms in the past
        isActive: true,
        save: vi.fn()
      };

      vi.mocked(Coupon.findOne).mockResolvedValue(mockCoupon);

      await expect(
        couponService.validateCoupon(mockUserId, 'EDGE20')
      ).rejects.toThrow(new AppError('Coupon expired', 404));
    });

    it('should be case-sensitive for coupon codes', async () => {
      vi.mocked(Coupon.findOne).mockResolvedValue(null);

      await expect(
        couponService.validateCoupon(mockUserId, 'save20')
      ).rejects.toThrow(new AppError('Coupon not found', 404));

      expect(Coupon.findOne).toHaveBeenCalledWith({
        code: 'save20', // Different case
        userId: mockUserId,
        isActive: true
      });
    });
  });

  describe('applyCouponToUser', () => {
    it('should apply coupon to user successfully', async () => {
      const mockCoupon = {
        code: 'SAVE30',
        discountPercentage: 30,
        expirationDate: new Date(Date.now() + 86400000),
        isActive: true,
        save: vi.fn()
      };

      vi.mocked(Coupon.findOne).mockResolvedValue(mockCoupon);

      await couponService.applyCouponToUser(mockUser as any, 'SAVE30');

      expect(mockUser.appliedCoupon).toEqual({
        code: 'SAVE30',
        discountPercentage: 30
      });
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should replace existing coupon when applying new one', async () => {
      mockUser.appliedCoupon = {
        code: 'OLD10',
        discountPercentage: 10
      };

      const mockCoupon = {
        code: 'NEW20',
        discountPercentage: 20,
        expirationDate: new Date(Date.now() + 86400000),
        isActive: true,
        save: vi.fn()
      };

      vi.mocked(Coupon.findOne).mockResolvedValue(mockCoupon);

      await couponService.applyCouponToUser(mockUser as any, 'NEW20');

      expect(mockUser.appliedCoupon).toEqual({
        code: 'NEW20',
        discountPercentage: 20
      });
    });

    it('should handle database save errors gracefully', async () => {
      const mockCoupon = {
        code: 'SAVE25',
        discountPercentage: 25,
        expirationDate: new Date(Date.now() + 86400000),
        isActive: true,
        save: vi.fn()
      };

      vi.mocked(Coupon.findOne).mockResolvedValue(mockCoupon);
      mockUser.save.mockRejectedValue(new Error('Database error'));

      await expect(
        couponService.applyCouponToUser(mockUser as any, 'SAVE25')
      ).rejects.toThrow('Database error');

      // User object was modified but not saved
      expect(mockUser.appliedCoupon).toEqual({
        code: 'SAVE25',
        discountPercentage: 25
      });
    });
  });

  describe('removeCouponFromUser', () => {
    it('should remove coupon from user successfully', async () => {
      mockUser.appliedCoupon = {
        code: 'REMOVE20',
        discountPercentage: 20
      };

      await couponService.removeCouponFromUser(mockUser as any);

      expect(mockUser.appliedCoupon).toBeNull();
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should handle removing when no coupon is applied', async () => {
      mockUser.appliedCoupon = null;

      await couponService.removeCouponFromUser(mockUser as any);

      expect(mockUser.appliedCoupon).toBeNull();
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should handle database save errors when removing', async () => {
      mockUser.appliedCoupon = {
        code: 'ERROR20',
        discountPercentage: 20
      };
      mockUser.save.mockRejectedValue(new Error('Save failed'));

      await expect(
        couponService.removeCouponFromUser(mockUser as any)
      ).rejects.toThrow('Save failed');

      // Coupon was removed from object but not persisted
      expect(mockUser.appliedCoupon).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('should handle discount percentage boundaries', async () => {
      const testCases = [
        { percentage: 0, expected: true },    // 0% discount
        { percentage: 100, expected: true },  // 100% discount
        { percentage: 50.5, expected: true }, // Decimal percentage
      ];

      for (const testCase of testCases) {
        const mockCoupon = {
          code: `DISCOUNT${testCase.percentage}`,
          discountPercentage: testCase.percentage,
          expirationDate: new Date(Date.now() + 86400000),
          isActive: true,
          save: vi.fn()
        };

        vi.mocked(Coupon.findOne).mockResolvedValue(mockCoupon);

        const result = await couponService.validateCoupon(
          mockUserId, 
          `DISCOUNT${testCase.percentage}`
        );

        expect(result.discountPercentage).toBe(testCase.percentage);
      }
    });

    it('should handle concurrent validation attempts', async () => {
      const mockCoupon = {
        code: 'CONCURRENT20',
        discountPercentage: 20,
        expirationDate: new Date(Date.now() + 86400000),
        isActive: true,
        save: vi.fn()
      };

      vi.mocked(Coupon.findOne).mockResolvedValue(mockCoupon);

      // Simulate concurrent validations
      const validations = await Promise.all([
        couponService.validateCoupon(mockUserId, 'CONCURRENT20'),
        couponService.validateCoupon(mockUserId, 'CONCURRENT20'),
        couponService.validateCoupon(mockUserId, 'CONCURRENT20')
      ]);

      expect(validations).toHaveLength(3);
      validations.forEach(result => {
        expect(result.code).toBe('CONCURRENT20');
        expect(result.discountPercentage).toBe(20);
      });
    });
  });
});