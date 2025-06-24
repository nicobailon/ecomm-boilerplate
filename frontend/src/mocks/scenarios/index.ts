import type { HttpHandler } from 'msw';
import { handlers as defaultHandlers } from '../handlers';
import { trpcScenarios } from '../utils/trpc-mock';
import { 
  createMockProduct, 
  createMockInventoryUpdate, 
} from '../factories';

// Success scenarios
export const successScenarios: HttpHandler[] = [
  ...defaultHandlers,
];

// Error scenarios
export const errorScenarios: HttpHandler[] = [
  trpcScenarios.error('auth.login', { message: 'Invalid credentials', code: 'UNAUTHORIZED' }),
  trpcScenarios.error('auth.signup', { message: 'User already exists', code: 'CONFLICT' }),
  trpcScenarios.error('product.getById', { message: 'Product not found', code: 'NOT_FOUND' }),
  trpcScenarios.error('cart.update', { message: 'Insufficient inventory', code: 'BAD_REQUEST' }),
  trpcScenarios.error('coupon.validate', { message: 'Invalid coupon code', code: 'NOT_FOUND' }),
  trpcScenarios.error('payment.createCheckoutSession', { message: 'Payment failed', code: 'PAYMENT_ERROR' }),
  trpcScenarios.error('inventory.update', { message: 'Concurrent update conflict', code: 'CONFLICT' }),
  trpcScenarios.error('media.delete', { message: 'Permission denied', code: 'FORBIDDEN' }),
];

// Loading scenarios (with long delays)
export const loadingScenarios: HttpHandler[] = [
  trpcScenarios.loading('product.getAll', 5000),
  trpcScenarios.loading('cart.get', 3000),
  trpcScenarios.loading('collection.getAll', 4000),
  trpcScenarios.loading('inventory.getAll', 6000),
  trpcScenarios.loading('analytics.getDashboard', 8000),
];

// Network error scenarios
export const networkErrorScenarios: HttpHandler[] = [
  trpcScenarios.networkError('auth.me'),
  trpcScenarios.networkError('product.getAll'),
  trpcScenarios.networkError('cart.get'),
  trpcScenarios.networkError('inventory.update'),
];

// Empty state scenarios
export const emptyStateScenarios: HttpHandler[] = [
  trpcScenarios.success('product.getAll', { products: [], totalProducts: 0, currentPage: 1, totalPages: 0 }),
  trpcScenarios.success('cart.get', { items: [] }),
  trpcScenarios.success('collection.getAll', []),
  trpcScenarios.success('media.getAll', []),
];

// Real-time inventory update scenarios
export const realtimeInventoryScenarios: HttpHandler[] = [
  trpcScenarios.success('inventory.getAll', 
    Array.from({ length: 10 }, (_, i) => 
      createMockProduct({ 
        _id: `prod-${i}`,
        inventory: Math.floor(Math.random() * 50), 
      }),
    ),
  ),
  // Simulate inventory updates every 2 seconds
  trpcScenarios.success('inventory.subscribe', {
    updates: Array.from({ length: 5 }, (_, i) => 
      createMockInventoryUpdate(`prod-${i}`, Math.floor(Math.random() * 100)),
    ),
  }, { delay: 2000 }),
];

// Conflict resolution scenarios
export const conflictScenarios: HttpHandler[] = [
  trpcScenarios.error('cart.update', { 
    message: 'Item quantity has been updated by another user', 
    code: 'CONFLICT', 
  }, { status: 409 }),
  trpcScenarios.error('inventory.update', { 
    message: 'Inventory has been modified, please refresh', 
    code: 'CONFLICT', 
  }, { status: 409 }),
  trpcScenarios.error('product.update', { 
    message: 'Product has been updated by another admin', 
    code: 'CONFLICT', 
  }, { status: 409 }),
];

// Performance testing scenarios
export const performanceScenarios: HttpHandler[] = [
  // Large dataset
  trpcScenarios.success('product.getAll', {
    products: Array.from({ length: 1000 }, (_, i) => 
      createMockProduct({ 
        _id: `perf-prod-${i}`,
        name: `Performance Test Product ${i}`, 
      }),
    ),
    totalProducts: 10000,
    currentPage: 1,
    totalPages: 100,
  }, { delay: 2000 }),
  
  // Slow network simulation
  trpcScenarios.success('inventory.getAll', 
    Array.from({ length: 100 }, (_, i) => 
      createMockProduct({ _id: `slow-prod-${i}` }),
    ), 
    { delay: 5000 },
  ),
];

// Auth failure scenarios
export const authFailureScenarios: HttpHandler[] = [
  trpcScenarios.error('auth.me', { message: 'Unauthorized', code: 'UNAUTHORIZED' }, { status: 401 }),
  trpcScenarios.error('product.create', { message: 'Admin access required', code: 'FORBIDDEN' }, { status: 403 }),
  trpcScenarios.error('inventory.update', { message: 'Session expired', code: 'UNAUTHORIZED' }, { status: 401 }),
];

// Partial data scenarios
export const partialDataScenarios: HttpHandler[] = [
  trpcScenarios.success('product.getAll', {
    products: Array.from({ length: 3 }, (_, i) => 
      createMockProduct({ 
        _id: `partial-${i}`,
        // Missing some fields to simulate partial data
        image: i === 1 ? '' : 'https://via.placeholder.com/400',
        description: i === 2 ? '' : 'Product description',
      }),
    ),
    totalProducts: 10,
    currentPage: 1,
    totalPages: 1,
  }),
];

// Combine scenarios for different story needs
export const scenarioPresets = {
  default: successScenarios,
  errors: [...defaultHandlers, ...errorScenarios],
  loading: [...defaultHandlers, ...loadingScenarios],
  networkErrors: [...defaultHandlers, ...networkErrorScenarios],
  empty: [...defaultHandlers, ...emptyStateScenarios],
  realtime: [...defaultHandlers, ...realtimeInventoryScenarios],
  conflicts: [...defaultHandlers, ...conflictScenarios],
  performance: [...defaultHandlers, ...performanceScenarios],
  authFailure: [...defaultHandlers, ...authFailureScenarios],
  partialData: [...defaultHandlers, ...partialDataScenarios],
  mixed: [
    ...defaultHandlers,
    ...errorScenarios.slice(0, 2),
    ...loadingScenarios.slice(0, 2),
    ...emptyStateScenarios.slice(0, 1),
  ],
};