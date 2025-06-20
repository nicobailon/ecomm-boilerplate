import { describe, it, expect, beforeEach, vi } from 'vitest';
import { appRouter } from './app.router.js';
import { authService } from '../../services/auth.service.js';
import { TRPCError } from '@trpc/server';
import type { Response } from 'express';

vi.mock('../../services/auth.service.js');

describe('Auth Router', () => {
  let mockResponse: Partial<Response>;
  let cookieStore: Record<string, any> = {};

  beforeEach(() => {
    cookieStore = {};
    mockResponse = {
      cookie: vi.fn((name: string, value: string, options?: any) => {
        cookieStore[name] = { value, options };
        return mockResponse as Response;
      }) as any,
      clearCookie: vi.fn((name: string) => {
        delete cookieStore[name];
        return mockResponse as Response;
      }),
    };
    vi.clearAllMocks();
  });

  describe('signup', () => {
    it('should successfully sign up a new user', async () => {
      const mockUser = {
        _id: '123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'customer',
      };
      const mockTokens = {
        accessToken: 'access123',
        refreshToken: 'refresh123',
      };

      vi.mocked(authService.signup).mockResolvedValue({
        user: mockUser,
        tokens: mockTokens,
      });

      const caller = appRouter.createCaller({
        req: { cookies: {} } as any,
        res: mockResponse as Response,
        user: null,
      });

      const result = await caller.auth.signup({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.user).toEqual(mockUser);
      expect(mockResponse.cookie).toHaveBeenCalledTimes(2);
      expect(cookieStore.accessToken.value).toBe('access123');
      expect(cookieStore.refresh.value).toBe('refresh123');
    });

    it('should throw BAD_REQUEST for existing user', async () => {
      vi.mocked(authService.signup).mockRejectedValue({
        message: 'User already exists',
        statusCode: 400,
      });

      const caller = appRouter.createCaller({
        req: { cookies: {} } as any,
        res: mockResponse as Response,
        user: null,
      });

      await expect(caller.auth.signup({
        name: 'Test User',
        email: 'existing@example.com',
        password: 'password123',
      })).rejects.toThrow(TRPCError);
    });
  });

  describe('login', () => {
    it('should successfully login a user', async () => {
      const mockUser = {
        _id: '123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'customer',
      };
      const mockTokens = {
        accessToken: 'access456',
        refreshToken: 'refresh456',
      };

      vi.mocked(authService.login).mockResolvedValue({
        user: mockUser,
        tokens: mockTokens,
      });

      const caller = appRouter.createCaller({
        req: { cookies: {} } as any,
        res: mockResponse as Response,
        user: null,
      });

      const result = await caller.auth.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.user).toEqual(mockUser);
      expect(mockResponse.cookie).toHaveBeenCalledTimes(2);
    });
  });

  describe('logout', () => {
    it('should successfully logout a user', async () => {
      vi.mocked(authService.logout).mockResolvedValue();

      const caller = appRouter.createCaller({
        req: { cookies: { refresh: 'refresh123' } } as any,
        res: mockResponse as Response,
        user: null,
      });

      const result = await caller.auth.logout();

      expect(result.success).toBe(true);
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('accessToken');
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('refresh');
    });
  });

  describe('refresh', () => {
    it('should successfully refresh access token', async () => {
      vi.mocked(authService.refreshAccessToken).mockResolvedValue('newAccess789');

      const caller = appRouter.createCaller({
        req: { cookies: {} } as any,
        res: mockResponse as Response,
        user: null,
      });

      const result = await caller.auth.refresh({
        refreshToken: 'refresh123',
      });

      expect(result.accessToken).toBe('newAccess789');
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'accessToken',
        'newAccess789',
        expect.any(Object)
      );
    });
  });

  describe('profile', () => {
    it('should get user profile when authenticated', async () => {
      const mockProfile = {
        _id: '123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'customer',
        cartItems: [],
      };

      vi.mocked(authService.getProfile).mockResolvedValue(mockProfile as any);

      const caller = appRouter.createCaller({
        req: { cookies: {} } as any,
        res: mockResponse as Response,
        user: { _id: '123' } as any,
      });

      const result = await caller.auth.profile();

      expect(result).toEqual(mockProfile);
    });

    it('should throw UNAUTHORIZED when not authenticated', async () => {
      const caller = appRouter.createCaller({
        req: { cookies: {} } as any,
        res: mockResponse as Response,
        user: null,
      });

      await expect(caller.auth.profile()).rejects.toThrow(TRPCError);
    });
  });
});