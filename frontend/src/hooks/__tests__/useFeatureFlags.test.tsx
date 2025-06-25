import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useFeatureFlags, useFeatureFlag } from '../useFeatureFlags';
import { useFeatureFlagsStore } from '@/stores/featureFlags.store';

// Mock the fetch API
const mockFetch = vi.fn();
global.fetch = mockFetch as typeof fetch;

describe('useFeatureFlags', () => {
  beforeEach(() => {
    // Reset store state before each test
    useFeatureFlagsStore.setState({
      flags: { useVariantAttributes: false },
      isLoading: false,
      error: null,
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch feature flags on mount', async () => {
    const mockResponse = {
      useVariantAttributes: true,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    } as Response);

    const { result } = renderHook(() => useFeatureFlags());

    await waitFor(() => {
      void expect(mockFetch).toHaveBeenCalledWith('/api/status');
    });

    await waitFor(() => {
      void expect(result.current.flags.USE_VARIANT_ATTRIBUTES).toBe(true);
      void expect(result.current.isLoading).toBe(false);
    });
  });

  it('should handle fetch errors gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useFeatureFlags());

    await waitFor(() => {
      void expect(result.current.error).toBe('Network error');
      void expect(result.current.isLoading).toBe(false);
    });
  });

  it('should handle non-ok responses', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response);

    const { result } = renderHook(() => useFeatureFlags());

    await waitFor(() => {
      void expect(result.current.error).toBe('Failed to fetch feature flags');
      void expect(result.current.isLoading).toBe(false);
    });
  });

  it('should merge environment flags with runtime flags', async () => {
    const mockResponse = {
      useVariantAttributes: false,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    } as Response);

    const { result } = renderHook(() => useFeatureFlags());

    await waitFor(() => {
      // Should have all env flags plus runtime flags
      void expect(result.current.flags).toHaveProperty('USE_TRPC_PRODUCTS');
      void expect(result.current.flags).toHaveProperty('USE_TRPC_CART');
      void expect(result.current.flags).toHaveProperty('USE_VARIANT_ATTRIBUTES');
    });
  });

  it('should provide refetch function', async () => {
    const mockResponse = {
      useVariantAttributes: true,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    } as Response);

    const { result } = renderHook(() => useFeatureFlags());

    await waitFor(() => {
      void expect(result.current.refetch).toBeTypeOf('function');
    });

    // Call refetch
    await result.current.refetch();

    void expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});

describe('useFeatureFlag', () => {
  beforeEach(() => {
    useFeatureFlagsStore.setState({
      flags: { useVariantAttributes: true },
      isLoading: false,
      error: null,
    });
  });

  it('should return the value of a specific feature flag', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ useVariantAttributes: true }),
    } as Response);

    const { result } = renderHook(() => useFeatureFlag('USE_VARIANT_ATTRIBUTES'));

    await waitFor(() => {
      void expect(result.current).toBe(true);
    });
  });

  it('should return false for non-existent flags', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ useVariantAttributes: true }),
    } as Response);

    const { result } = renderHook(() => useFeatureFlag('USE_TRPC_PRODUCTS' as const));

    await waitFor(() => {
      void expect(result.current).toBe(false);
    });
  });

  it('should update when feature flags change', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ useVariantAttributes: false }),
    } as Response);

    const { result, rerender } = renderHook(() => useFeatureFlag('USE_VARIANT_ATTRIBUTES'));

    await waitFor(() => {
      void expect(result.current).toBe(false);
    });

    // Update store state
    useFeatureFlagsStore.setState({
      flags: { useVariantAttributes: true },
    });

    rerender();

    await waitFor(() => {
      void expect(result.current).toBe(true);
    });
  });
});