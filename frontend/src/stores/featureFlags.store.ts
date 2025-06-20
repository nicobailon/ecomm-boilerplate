import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface FeatureFlagsState {
  flags: {
    useVariantAttributes: boolean;
  };
  isLoading: boolean;
  error: string | null;
  setFlags: (flags: Partial<FeatureFlagsState['flags']>) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  fetchFeatureFlags: () => Promise<void>;
}

export const useFeatureFlagsStore = create<FeatureFlagsState>()(
  devtools(
    (set) => ({
      flags: {
        useVariantAttributes: false,
      },
      isLoading: false,
      error: null,
      setFlags: (flags) =>
        set((state) => ({
          flags: { ...state.flags, ...flags },
        })),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      fetchFeatureFlags: async () => {
        set({ isLoading: true, error: null });
        // Note: This is called from the store, not a React component
        // We'll need to use the tRPC client directly or move this to a hook
        set({
          isLoading: false,
          // We'll update this when called from the hook with tRPC
        });
      },
    }),
    {
      name: 'feature-flags-store',
    }
  )
);