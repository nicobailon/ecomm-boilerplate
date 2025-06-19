import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CouponService } from '../../services/coupon.service.js';
import { Coupon } from '../../models/coupon.model.js';
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

    it('should convert coupon codes to uppercase', async () => {
      vi.mocked(Coupon.findOne).mockResolvedValue(null);

      await expect(
        couponService.validateCoupon(mockUserId, 'save20')
      ).rejects.toThrow(new AppError('Coupon not found', 404));

      expect(Coupon.findOne).toHaveBeenCalledWith({
        code: 'SAVE20', // Converted to uppercase
        userId: mockUserId,
        isActive: true
      });
    });

    it('should validate general discount codes when no user-specific coupon found', async () => {
      const mockGeneralCoupon = {
        code: 'GENERAL20',
        discountPercentage: 20,
        expirationDate: new Date(Date.now() + 86400000),
        isActive: true,
        maxUses: 100,
        currentUses: 10,
        save: vi.fn()
      };

      vi.mocked(Coupon.findOne)
        .mockResolvedValueOnce(null) // No user-specific coupon
        .mockResolvedValueOnce(mockGeneralCoupon); // General coupon found

      const result = await couponService.validateCoupon(mockUserId, 'general20');

      expect(result).toEqual({
        message: 'Coupon is valid',
        code: 'GENERAL20',
        discountPercentage: 20
      });
    });

    it('should check max uses limit', async () => {
      const mockCoupon = {
        code: 'LIMITED10',
        discountPercentage: 10,
        expirationDate: new Date(Date.now() + 86400000),
        isActive: true,
        maxUses: 5,
        currentUses: 5,
        save: vi.fn()
      };

      vi.mocked(Coupon.findOne)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockCoupon);

      await expect(
        couponService.validateCoupon(mockUserId, 'LIMITED10')
      ).rejects.toThrow(new AppError('Coupon has reached maximum usage limit', 400));
    });

    it('should check minimum purchase amount', async () => {
      const mockCoupon = {
        code: 'MIN50',
        discountPercentage: 15,
        expirationDate: new Date(Date.now() + 86400000),
        isActive: true,
        minimumPurchaseAmount: 50,
        save: vi.fn()
      };

      vi.mocked(Coupon.findOne)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockCoupon);

      await expect(
        couponService.validateCoupon(mockUserId, 'MIN50', 30)
      ).rejects.toThrow(new AppError('Minimum purchase amount of $50 required', 400));
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
      } as any;

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
      } as any;

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
      } as any;
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

  describe('Admin Methods', () => {
    describe('listAllDiscounts', () => {
      it('should list all discounts with pagination', async () => {
        const mockDiscounts = [
          { _id: '1', code: 'DISC1', discountPercentage: 10 },
          { _id: '2', code: 'DISC2', discountPercentage: 20 },
        ];

        vi.mocked(Coupon.find).mockReturnValue({
          sort: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          skip: vi.fn().mockReturnThis(),
          lean: vi.fn().mockResolvedValue(mockDiscounts),
        } as any);
        vi.mocked(Coupon.countDocuments).mockResolvedValue(50);

        const result = await couponService.listAllDiscounts({ page: 2, limit: 10 });

        expect(result).toEqual({
          discounts: mockDiscounts,
          total: 50,
        });
        expect(Coupon.find).toHaveBeenCalledWith({});
      });

      it('should filter by active status', async () => {
        vi.mocked(Coupon.find).mockReturnValue({
          sort: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          skip: vi.fn().mockReturnThis(),
          lean: vi.fn().mockResolvedValue([]),
        } as any);
        vi.mocked(Coupon.countDocuments).mockResolvedValue(0);

        await couponService.listAllDiscounts({ isActive: true });

        expect(Coupon.find).toHaveBeenCalledWith({ isActive: true });
      });
    });

    describe('createDiscount', () => {
      it('should create a new discount successfully', async () => {
        const mockInput = {
          code: 'summer20',
          discountPercentage: 20,
          expirationDate: '2024-12-31T23:59:59Z',
          isActive: true,
          description: 'Summer sale',
          maxUses: 100,
          minimumPurchaseAmount: 50,
        };

        const mockSavedCoupon = {
          ...mockInput,
          code: 'SUMMER20',
          currentUses: 0,
          _id: 'new-id',
          save: vi.fn().mockResolvedValue(true),
        };

        vi.mocked(Coupon.findOne).mockResolvedValue(null);
        vi.mocked(Coupon).mockImplementation(() => mockSavedCoupon as any);

        const result = await couponService.createDiscount(mockInput);

        expect(result).toBe(mockSavedCoupon);
        expect(mockSavedCoupon.save).toHaveBeenCalled();
      });

      it('should throw error for duplicate code', async () => {
        vi.mocked(Coupon.findOne).mockResolvedValue({ code: 'EXISTING' } as any);

        await expect(
          couponService.createDiscount({
            code: 'existing',
            discountPercentage: 10,
            expirationDate: '2024-12-31T23:59:59Z',
            isActive: true,
          })
        ).rejects.toThrow(new AppError('A discount code with this name already exists', 409));
      });
    });

    describe('updateDiscount', () => {
      it('should update discount successfully', async () => {
        const mockCoupon = {
          _id: 'test-id',
          code: 'UPDATE20',
          discountPercentage: 20,
          isActive: true,
          save: vi.fn().mockResolvedValue(true),
        };

        vi.mocked(Coupon.findById).mockResolvedValue(mockCoupon);

        await couponService.updateDiscount('test-id', {
          discountPercentage: 25,
          isActive: false,
        });

        expect(mockCoupon.discountPercentage).toBe(25);
        expect(mockCoupon.isActive).toBe(false);
        expect(mockCoupon.save).toHaveBeenCalled();
      });

      it('should throw error for non-existent discount', async () => {
        vi.mocked(Coupon.findById).mockResolvedValue(null);

        await expect(
          couponService.updateDiscount('invalid-id', { isActive: false })
        ).rejects.toThrow(new AppError('Discount not found', 404));
      });
    });

    describe('deleteDiscount', () => {
      it('should permanently delete discount with no uses', async () => {
        const mockCoupon = {
          _id: 'delete-id',
          code: 'DELETE20',
          currentUses: 0,
        };

        vi.mocked(Coupon.findById).mockResolvedValue(mockCoupon);
        vi.mocked(Coupon.findByIdAndDelete).mockResolvedValue(mockCoupon);

        const result = await couponService.deleteDiscount('delete-id');

        expect(result).toEqual({
          success: true,
          message: 'Discount has been permanently deleted',
        });
        expect(Coupon.findByIdAndDelete).toHaveBeenCalledWith('delete-id');
      });

      it('should deactivate discount with existing uses', async () => {
        const mockCoupon = {
          _id: 'deactivate-id',
          code: 'DEACTIVATE20',
          currentUses: 5,
          isActive: true,
          save: vi.fn(),
        };

        vi.mocked(Coupon.findById).mockResolvedValue(mockCoupon);

        const result = await couponService.deleteDiscount('deactivate-id');

        expect(result).toEqual({
          success: true,
          message: 'Discount has been deactivated (has existing uses)',
        });
        expect(mockCoupon.isActive).toBe(false);
        expect(mockCoupon.save).toHaveBeenCalled();
      });
    });

    describe('incrementUsage', () => {
      it('should increment usage count atomically', async () => {
        const mockUpdatedCoupon = {
          code: 'INCREMENT20',
          currentUses: 6,
          maxUses: 10,
          isActive: true,
          save: vi.fn(),
        };

        vi.mocked(Coupon.findOneAndUpdate).mockResolvedValue(mockUpdatedCoupon);

        await couponService.incrementUsage('increment20');

        expect(Coupon.findOneAndUpdate).toHaveBeenCalledWith(
          {
            code: 'INCREMENT20',
            isActive: true,
            $or: [
              { maxUses: { $exists: false } },
              { $expr: { $lt: ['$currentUses', '$maxUses'] } }
            ]
          },
          { $inc: { currentUses: 1 } },
          { new: true, runValidators: true }
        );
        expect(mockUpdatedCoupon.save).not.toHaveBeenCalled();
      });

      it('should deactivate coupon when max uses reached', async () => {
        const mockUpdatedCoupon = {
          code: 'MAXED20',
          currentUses: 10,
          maxUses: 10,
          isActive: true,
          save: vi.fn(),
        };

        vi.mocked(Coupon.findOneAndUpdate).mockResolvedValue(mockUpdatedCoupon);

        await couponService.incrementUsage('MAXED20');

        expect(mockUpdatedCoupon.isActive).toBe(false);
        expect(mockUpdatedCoupon.save).toHaveBeenCalled();
      });

      it('should deactivate user-specific coupons after first use', async () => {
        const mockUserCoupon = {
          code: 'USER50',
          currentUses: 1,
          userId: 'user123',
          isActive: true,
          save: vi.fn(),
        };

        vi.mocked(Coupon.findOneAndUpdate).mockResolvedValue(mockUserCoupon);

        await couponService.incrementUsage('USER50');

        expect(mockUserCoupon.isActive).toBe(false);
        expect(mockUserCoupon.save).toHaveBeenCalled();
      });

      it('should throw error when coupon not found', async () => {
        vi.mocked(Coupon.findOneAndUpdate).mockResolvedValue(null);
        vi.mocked(Coupon.findOne).mockResolvedValue(null);

        await expect(
          couponService.incrementUsage('NOTFOUND')
        ).rejects.toThrow(new AppError('Coupon not found', 404));
      });

      it('should throw error when coupon is inactive', async () => {
        vi.mocked(Coupon.findOneAndUpdate).mockResolvedValue(null);
        vi.mocked(Coupon.findOne).mockResolvedValue({
          code: 'INACTIVE',
          isActive: false,
        } as any);

        await expect(
          couponService.incrementUsage('INACTIVE')
        ).rejects.toThrow(new AppError('Coupon is no longer active', 400));
      });

      it('should throw error when max uses already reached', async () => {
        vi.mocked(Coupon.findOneAndUpdate).mockResolvedValue(null);
        vi.mocked(Coupon.findOne).mockResolvedValue({
          code: 'MAXED',
          isActive: true,
          maxUses: 5,
          currentUses: 5,
        } as any);

        await expect(
          couponService.incrementUsage('MAXED')
        ).rejects.toThrow(new AppError('Coupon has reached maximum usage limit', 400));
      });
    });
  });
});