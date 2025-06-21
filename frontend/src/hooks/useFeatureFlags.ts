import { useEffect } from 'react';
import { useFeatureFlagsStore } from '@/stores/featureFlags.store';
import { FEATURE_FLAGS as ENV_FLAGS } from '@/lib/feature-flags';
import { trpc } from '@/lib/trpc';
import { isDevelopment } from '@/lib/env';
import { toast } from 'sonner';

export function useFeatureFlags() {
  const { flags, setFlags, setLoading, setError } = useFeatureFlagsStore();
  
  // Use tRPC query to fetch feature flags
  const { data, isLoading, error, refetch } = trpc.status.flags.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  useEffect(() => {
    if (data) {
      setFlags({
        useVariantAttributes: data.useVariantAttributes,
      });
    }
  }, [data, setFlags]);

  useEffect(() => {
    setLoading(isLoading);
  }, [isLoading, setLoading]);

  useEffect(() => {
    const errorMessage = error?.message ?? null;
    setError(errorMessage);
    
    // Show non-blocking toast in dev mode when feature flag fetch fails
    if (isDevelopment && errorMessage && !isLoading) {
      toast.error(`Feature flags sync failed: ${errorMessage}`, {
        duration: 5000,
        id: 'feature-flags-error', // Prevent duplicate toasts
      });
    }
  }, [error, setError, isLoading]);

  // Merge environment flags with runtime flags
  // Runtime flags from /status endpoint take precedence
  const mergedFlags = {
    ...ENV_FLAGS,
    USE_VARIANT_ATTRIBUTES: data?.useVariantAttributes ?? flags.useVariantAttributes ?? ENV_FLAGS.USE_VARIANT_ATTRIBUTES,
  };

  return {
    flags: mergedFlags,
    isLoading,
    error: error?.message ?? null,
    refetch,
  };
}

// Hook to check a specific feature flag
export function useFeatureFlag(flagName: keyof typeof ENV_FLAGS | 'USE_VARIANT_ATTRIBUTES'): boolean {
  const { flags } = useFeatureFlags();
  return flags[flagName] ?? false;
}