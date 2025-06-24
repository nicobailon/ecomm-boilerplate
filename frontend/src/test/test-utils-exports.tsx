import React from 'react';
import type { ReactElement } from 'react';
import type { RenderOptions, RenderResult, RenderHookOptions, RenderHookResult } from '@testing-library/react';
import { render, act, cleanup, fireEvent, screen, waitFor, waitForElementToBeRemoved, within, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@/providers/theme-provider';

// Create a new QueryClient for each test
export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

// Shared QueryClient instance for tests that don't require mutation isolation
let sharedQueryClient: QueryClient | null = null;

// Get or create shared QueryClient instance
export const getSharedQueryClient = () => {
  sharedQueryClient ??= createTestQueryClient();
  return sharedQueryClient;
};

// Utility to reset shared QueryClient between test suites
export const resetSharedQueryClient = () => {
  sharedQueryClient = null;
};

// Mock data factories
export const createMockUser = (overrides = {}) => ({
  _id: '1',
  name: 'Test User',
  email: 'test@example.com',
  role: 'customer' as const,
  cartItems: [],
  ...overrides,
});

export const createMockProduct = (overrides = {}) => ({
  _id: '1',
  name: 'Test Product',
  description: 'Test product description',
  price: 99.99,
  image: 'https://example.com/image.jpg',
  category: 'jeans' as const,
  isFeatured: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export function createMockApiResponse<T>(data: T, overrides = {}) {
  return {
    success: true,
    data,
    ...overrides,
  };
}

// Re-export testing utilities
export {
  act,
  cleanup,
  fireEvent,
  screen,
  waitFor,
  waitForElementToBeRemoved,
  within,
  renderHook,
  type RenderResult,
  type RenderOptions,
  type RenderHookOptions,
  type RenderHookResult,
};

export interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
  useSharedQueryClient?: boolean;
  theme?: 'light' | 'dark' | 'system';
}

// Custom render function that includes providers
export const customRender = (
  ui: ReactElement,
  { 
    queryClient, 
    useSharedQueryClient = true,
    theme = 'light',
    ...renderOptions 
  }: CustomRenderOptions = {},
) => {
  // Use provided queryClient, shared instance, or create new one
  const client = queryClient ?? (useSharedQueryClient ? getSharedQueryClient() : createTestQueryClient());
  
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <ThemeProvider defaultTheme={theme}>
      <BrowserRouter>
        <QueryClientProvider client={client}>
          {children}
        </QueryClientProvider>
      </BrowserRouter>
    </ThemeProvider>
  );

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient: client,
  };
};

// Export theme-specific render helpers
export function renderInDarkMode(ui: ReactElement, options?: Omit<CustomRenderOptions, 'theme'>) {
  return customRender(ui, { ...options, theme: 'dark' });
}

export function renderInLightMode(ui: ReactElement, options?: Omit<CustomRenderOptions, 'theme'>) {
  return customRender(ui, { ...options, theme: 'light' });
}

export { customRender as renderWithProviders };

// Create wrapper for renderHook
export const createWrapper = (useSharedQueryClient = true, theme: 'light' | 'dark' | 'system' = 'light') => {
  const queryClient = useSharedQueryClient ? getSharedQueryClient() : createTestQueryClient();
  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <ThemeProvider defaultTheme={theme}>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
  TestWrapper.displayName = 'TestWrapper';
  return TestWrapper;
};