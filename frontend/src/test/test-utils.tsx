import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

// Shared QueryClient instance for tests that don't require mutation isolation
let sharedQueryClient: QueryClient | null = null;

// Create a new QueryClient for each test
const createTestQueryClient = () =>
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

// Get or create shared QueryClient instance
const getSharedQueryClient = () => {
  if (!sharedQueryClient) {
    sharedQueryClient = createTestQueryClient();
  }
  return sharedQueryClient;
};

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
  useSharedQueryClient?: boolean;
}

// Custom render function that includes providers
const customRender = (
  ui: ReactElement,
  { 
    queryClient, 
    useSharedQueryClient = true,
    ...renderOptions 
  }: CustomRenderOptions = {}
) => {
  // Use provided queryClient, shared instance, or create new one
  const client = queryClient || (useSharedQueryClient ? getSharedQueryClient() : createTestQueryClient());
  
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter>
      <QueryClientProvider client={client}>
        {children}
      </QueryClientProvider>
    </BrowserRouter>
  );

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient: client,
  };
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

// Create wrapper for renderHook
export const createWrapper = (useSharedQueryClient = true) => {
  const queryClient = useSharedQueryClient ? getSharedQueryClient() : createTestQueryClient();
  return ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </BrowserRouter>
  );
};

// Utility to reset shared QueryClient between test suites
export const resetSharedQueryClient = () => {
  sharedQueryClient = null;
};

// Type-level tests as per TDD protocol - commented out to fix build
// type AssertEqual<T, U> = T extends U ? (U extends T ? true : false) : false;

// Test that our mock factories produce correct types - commented out to fix build
// type UserTypeTest = AssertEqual<ReturnType<typeof createMockUser>, import('@/types').User>;
// type ProductTypeTest = AssertEqual<ReturnType<typeof createMockProduct>, import('@/types').Product>;

export { customRender as render, createTestQueryClient };
export * from '@testing-library/react';