import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useFeatureFlags, useFeatureFlag } from '../useFeatureFlags';
import { useFeatureFlagsStore } from '@/stores/featureFlags.store';

// Mock the fetch API
global.fetch = vi.fn();

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

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const { result } = renderHook(() => useFeatureFlags());

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/status');
    });

    await waitFor(() => {
      expect(result.current.flags.USE_VARIANT_ATTRIBUTES).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should handle fetch errors gracefully', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useFeatureFlags());

    await waitFor(() => {
      expect(result.current.error).toBe('Network error');
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should handle non-ok responses', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const { result } = renderHook(() => useFeatureFlags());

    await waitFor(() => {
      expect(result.current.error).toBe('Failed to fetch feature flags');
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('should merge environment flags with runtime flags', async () => {
    const mockResponse = {
      useVariantAttributes: false,
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const { result } = renderHook(() => useFeatureFlags());

    await waitFor(() => {
      // Should have all env flags plus runtime flags
      expect(result.current.flags).toHaveProperty('USE_TRPC_PRODUCTS');
      expect(result.current.flags).toHaveProperty('USE_TRPC_CART');
      expect(result.current.flags).toHaveProperty('USE_VARIANT_ATTRIBUTES');
    });
  });

  it('should provide refetch function', async () => {
    const mockResponse = {
      useVariantAttributes: true,
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const { result } = renderHook(() => useFeatureFlags());

    await waitFor(() => {
      expect(result.current.refetch).toBeTypeOf('function');
    });

    // Call refetch
    await result.current.refetch();

    expect(global.fetch).toHaveBeenCalledTimes(2);
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
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ useVariantAttributes: true }),
    });

    const { result } = renderHook(() => useFeatureFlag('USE_VARIANT_ATTRIBUTES'));

    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });

  it('should return false for non-existent flags', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ useVariantAttributes: true }),
    });

    const { result } = renderHook(() => useFeatureFlag('NON_EXISTENT_FLAG' as any));

    await waitFor(() => {
      expect(result.current).toBe(false);
    });
  });

  it('should update when feature flags change', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ useVariantAttributes: false }),
    });

    const { result, rerender } = renderHook(() => useFeatureFlag('USE_VARIANT_ATTRIBUTES'));

    await waitFor(() => {
      expect(result.current).toBe(false);
    });

    // Update store state
    useFeatureFlagsStore.setState({
      flags: { useVariantAttributes: true },
    });

    rerender();

    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });
});