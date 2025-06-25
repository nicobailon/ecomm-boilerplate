import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TRPCError } from '@trpc/server';
import { couponRouter } from '../../trpc/routers/coupon.router.js';
import { couponService } from '../../services/coupon.service.js';
import { AppError } from '../../utils/AppError.js';
import type { Request, Response } from 'express';
import type { IUserDocument } from '../../models/user.model.js';

vi.mock('../../services/coupon.service.js');

describe('coupon.create tRPC endpoint', () => {
  const mockAdminContext = {
    req: {} as Request,
    res: {} as Response,
    user: {
      _id: 'admin123',
      email: 'admin@test.com',
      role: 'admin',
    } as unknown as IUserDocument,
  };

  const mockUserContext = {
    req: {} as Request,
    res: {} as Response,
    user: {
      _id: 'user123',
      email: 'user@test.com',
      role: 'customer',
    } as unknown as IUserDocument,
  };

  const mockUnauthContext = {
    req: {} as any,
    res: {} as any,
    user: null,
  };

  const validInput = {
    code: 'SUMMER2024',
    discountPercentage: 20,
    expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
    isActive: true,
    description: 'Summer sale discount',
    maxUses: 100,
    minimumPurchaseAmount: 50,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create a discount when called by admin with valid data', async () => {
    const mockCreatedDiscount = {
      _id: 'discount123',
      ...validInput,
      code: validInput.code.toUpperCase(),
      currentUses: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(couponService.createDiscount).mockResolvedValue(mockCreatedDiscount as any);

    const caller = couponRouter.createCaller(mockAdminContext);
    const result = await caller.create(validInput);

    void expect(couponService.createDiscount).toHaveBeenCalledWith(validInput);
    void expect(result).toEqual(mockCreatedDiscount);
  });

  it('should reject when called by non-admin user', async () => {
    const caller = couponRouter.createCaller(mockUserContext);
    
    await expect(caller.create(validInput)).rejects.toThrow(TRPCError);
    await expect(caller.create(validInput)).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
  });

  it('should reject when called without authentication', async () => {
    const caller = couponRouter.createCaller(mockUnauthContext);
    
    await expect(caller.create(validInput)).rejects.toThrow(TRPCError);
    await expect(caller.create(validInput)).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
  });

  it('should handle date strings in ISO format', async () => {
    const inputWithISODate = {
      ...validInput,
      expirationDate: '2024-12-31T23:59:59.999Z',
    };

    const mockCreatedDiscount = {
      _id: 'discount123',
      ...inputWithISODate,
      code: inputWithISODate.code.toUpperCase(),
      currentUses: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(couponService.createDiscount).mockResolvedValue(mockCreatedDiscount as any);

    const caller = couponRouter.createCaller(mockAdminContext);
    const result = await caller.create(inputWithISODate);

    void expect(result).toEqual(mockCreatedDiscount);
  });

  it('should handle conflict error when discount code already exists', async () => {
    const conflictError = new AppError('A discount code with this name already exists', 409);
    vi.mocked(couponService.createDiscount).mockRejectedValue(conflictError);

    const caller = couponRouter.createCaller(mockAdminContext);
    
    await expect(caller.create(validInput)).rejects.toThrow(TRPCError);
    await expect(caller.create(validInput)).rejects.toMatchObject({
      code: 'CONFLICT',
      message: 'A discount code with this name already exists',
    });
  });

  it('should validate required fields', async () => {
    const caller = couponRouter.createCaller(mockAdminContext);

    // Missing code
    await expect(caller.create({
      ...validInput,
      code: '',
    })).rejects.toThrow();

    // Invalid discount percentage
    await expect(caller.create({
      ...validInput,
      discountPercentage: 150,
    })).rejects.toThrow();

    // Invalid date format
    await expect(caller.create({
      ...validInput,
      expirationDate: 'invalid-date',
    })).rejects.toThrow();
  });

  it('should handle optional fields correctly', async () => {
    const minimalInput = {
      code: 'MINIMAL10',
      discountPercentage: 10,
      expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      isActive: true,
    };

    const mockCreatedDiscount = {
      _id: 'discount124',
      ...minimalInput,
      code: minimalInput.code.toUpperCase(),
      currentUses: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(couponService.createDiscount).mockResolvedValue(mockCreatedDiscount as any);

    const caller = couponRouter.createCaller(mockAdminContext);
    const result = await caller.create(minimalInput);

    void expect(couponService.createDiscount).toHaveBeenCalledWith(minimalInput);
    void expect(result).toEqual(mockCreatedDiscount);
  });
});