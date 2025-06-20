import { describe, it, expect, beforeEach, vi } from 'vitest';
import { couponRouter } from '../../trpc/routers/coupon.router.js';
import { couponService } from '../../services/coupon.service.js';
import { cartService } from '../../services/cart.service.js';
import { TRPCError } from '@trpc/server';
import { AppError } from '../../utils/AppError.js';

vi.mock('../../services/coupon.service.js');
vi.mock('../../services/cart.service.js');

describe('Coupon tRPC Router', () => {
  const mockUserId = 'user123';
  const mockAdminUserId = 'admin123';
  
  const mockContext = {
    req: {} as any,
    res: {} as any,
    user: {
      _id: mockUserId,
      email: 'user@example.com',
      role: 'customer',
    } as any,
  };

  const mockAdminContext = {
    req: {} as any,
    res: {} as any,
    user: {
      _id: mockAdminUserId,
      email: 'admin@example.com',
      role: 'admin',
    } as any,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Admin Procedures', () => {
    describe('listAll', () => {
      it('should list all discounts for admin', async () => {
        const mockResponse = {
          discounts: [
            { _id: '1', code: 'DISC1', discountPercentage: 10 } as any,
            { _id: '2', code: 'DISC2', discountPercentage: 20 } as any,
          ],
          total: 2,
        };

        vi.mocked(couponService.listAllDiscounts).mockResolvedValue(mockResponse);

        const caller = couponRouter.createCaller(mockAdminContext);
        const result = await caller.listAll({ page: 1, limit: 20 });

        expect(result).toEqual(mockResponse);
        expect(couponService.listAllDiscounts).toHaveBeenCalledWith({
          page: 1,
          limit: 20,
        });
      });

      it('should throw error for non-admin users', async () => {
        const caller = couponRouter.createCaller(mockContext);

        await expect(
          caller.listAll({ page: 1, limit: 20 })
        ).rejects.toThrow(TRPCError);
      });
    });

    describe('create', () => {
      it('should create a new discount', async () => {
        const mockInput = {
          code: 'SUMMER20',
          discountPercentage: 20,
          expirationDate: '2024-12-31T23:59:59Z',
          isActive: true,
          description: 'Summer sale',
          maxUses: 100,
          minimumPurchaseAmount: 50,
        };

        const mockCreatedDiscount = {
          ...mockInput,
          _id: 'new-id',
          currentUses: 0,
        };

        vi.mocked(couponService.createDiscount).mockResolvedValue(mockCreatedDiscount as any);

        const caller = couponRouter.createCaller(mockAdminContext);
        const result = await caller.create(mockInput);

        expect(result).toEqual(mockCreatedDiscount);
        expect(couponService.createDiscount).toHaveBeenCalledWith(mockInput);
      });

      it('should handle duplicate code error', async () => {
        const mockInput = {
          code: 'EXISTING',
          discountPercentage: 10,
          expirationDate: '2024-12-31T23:59:59Z',
          isActive: true,
        };

        vi.mocked(couponService.createDiscount).mockRejectedValue(
          new AppError('A discount code with this name already exists', 409)
        );

        const caller = couponRouter.createCaller(mockAdminContext);

        await expect(caller.create(mockInput)).rejects.toThrow(TRPCError);
      });
    });

    describe('update', () => {
      it('should update a discount', async () => {
        const mockInput = {
          id: 'discount-id',
          data: {
            discountPercentage: 25,
            isActive: false,
          },
        };

        const mockUpdatedDiscount = {
          _id: 'discount-id',
          code: 'UPDATE20',
          discountPercentage: 25,
          isActive: false,
        };

        vi.mocked(couponService.updateDiscount).mockResolvedValue(mockUpdatedDiscount as any);

        const caller = couponRouter.createCaller(mockAdminContext);
        const result = await caller.update(mockInput);

        expect(result).toEqual(mockUpdatedDiscount);
        expect(couponService.updateDiscount).toHaveBeenCalledWith(
          mockInput.id,
          mockInput.data
        );
      });

      it('should handle not found error', async () => {
        const mockInput = {
          id: 'invalid-id',
          data: { isActive: false },
        };

        vi.mocked(couponService.updateDiscount).mockRejectedValue(
          new AppError('Discount not found', 404)
        );

        const caller = couponRouter.createCaller(mockAdminContext);

        await expect(caller.update(mockInput)).rejects.toThrow(TRPCError);
      });
    });

    describe('delete', () => {
      it('should delete a discount', async () => {
        const mockResponse = {
          success: true,
          message: 'Discount has been permanently deleted',
        };

        vi.mocked(couponService.deleteDiscount).mockResolvedValue(mockResponse);

        const caller = couponRouter.createCaller(mockAdminContext);
        const result = await caller.delete({ id: 'discount-id' });

        expect(result).toEqual(mockResponse);
        expect(couponService.deleteDiscount).toHaveBeenCalledWith('discount-id');
      });

      it('should handle deactivation for discounts with uses', async () => {
        const mockResponse = {
          success: true,
          message: 'Discount has been deactivated (has existing uses)',
        };

        vi.mocked(couponService.deleteDiscount).mockResolvedValue(mockResponse);

        const caller = couponRouter.createCaller(mockAdminContext);
        const result = await caller.delete({ id: 'used-discount-id' });

        expect(result).toEqual(mockResponse);
      });
    });
  });

  describe('User Procedures', () => {
    describe('validate', () => {
      it('should validate a coupon code', async () => {
        const mockValidResponse = {
          message: 'Coupon is valid',
          code: 'SAVE20',
          discountPercentage: 20,
        };

        vi.mocked(couponService.validateCoupon).mockResolvedValue(mockValidResponse);

        const caller = couponRouter.createCaller(mockContext);
        const result = await caller.validate({ code: 'SAVE20' });

        expect(result).toEqual(mockValidResponse);
        expect(couponService.validateCoupon).toHaveBeenCalledWith(
          mockUserId,
          'SAVE20'
        );
      });
    });

    describe('applyCoupon', () => {
      it('should apply coupon and return updated cart', async () => {
        const mockCart = {
          items: [],
          totalAmount: 80,
          discount: 20,
        };

        vi.mocked(couponService.applyCouponToUser).mockResolvedValue(undefined);
        vi.mocked(cartService.calculateCartTotals).mockResolvedValue(mockCart as any);

        const caller = couponRouter.createCaller(mockContext);
        const result = await caller.applyCoupon({ code: 'SAVE20' });

        expect(result).toEqual({
          success: true,
          message: 'Coupon applied successfully',
          cart: mockCart,
        });
      });
    });
  });
});