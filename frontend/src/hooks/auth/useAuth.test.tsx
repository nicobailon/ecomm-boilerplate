import { renderHook } from '@testing-library/react';
import { createWrapper } from '@/test/test-utils';
import { useLogin, useSignup, useLogout } from './useAuth';
import { vi, describe, it, expect } from 'vitest';
import type * as ReactRouterDom from 'react-router-dom';

// Mock the API client
vi.mock('@/lib/api-client', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

// Mock react-router-dom
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof ReactRouterDom>();
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Auth Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useLogin', () => {
    it('should provide login mutation', () => {
      const { result } = renderHook(() => useLogin(), { wrapper: createWrapper() });
      const loginMutation = result.current;
      
      void expect(loginMutation.mutate).toBeDefined();
      void expect(loginMutation.isPending).toBe(false);
    });
  });

  describe('useSignup', () => {
    it('should provide signup mutation', () => {
      const { result } = renderHook(() => useSignup(), { wrapper: createWrapper() });
      const signupMutation = result.current;
      
      void expect(signupMutation.mutate).toBeDefined();
      void expect(signupMutation.isPending).toBe(false);
    });
  });

  describe('useLogout', () => {
    it('should provide logout mutation', () => {
      const { result } = renderHook(() => useLogout(), { wrapper: createWrapper() });
      const logoutMutation = result.current;
      
      void expect(logoutMutation.mutate).toBeDefined();
      void expect(logoutMutation.isPending).toBe(false);
    });
  });
});