import { renderHook, createWrapper } from '@/test/test-utils';
import { useLogin, useSignup, useLogout } from './useAuth';
import { vi } from 'vitest';

// Mock the API client
vi.mock('@/lib/api-client', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

// Mock react-router-dom
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
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
      
      expect(result.current.mutate).toBeDefined();
      expect(result.current.isPending).toBe(false);
    });
  });

  describe('useSignup', () => {
    it('should provide signup mutation', () => {
      const { result } = renderHook(() => useSignup(), { wrapper: createWrapper() });
      
      expect(result.current.mutate).toBeDefined();
      expect(result.current.isPending).toBe(false);
    });
  });

  describe('useLogout', () => {
    it('should provide logout mutation', () => {
      const { result } = renderHook(() => useLogout(), { wrapper: createWrapper() });
      
      expect(result.current.mutate).toBeDefined();
      expect(result.current.isPending).toBe(false);
    });
  });
});