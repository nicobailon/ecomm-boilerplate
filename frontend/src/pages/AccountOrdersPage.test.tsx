import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AccountOrdersPage from './AccountOrdersPage';
import { renderWithProviders } from '@/test/test-utils';
import type { RouterOutputs } from '@/lib/trpc';

// Mock hooks
const mockListMyOrders = vi.fn();
const mockGetMyOrderById = vi.fn();

// Store mock return values
let mockListMyOrdersReturn = {
  data: null as any,
  isLoading: false,
  error: null as any,
};

let mockGetMyOrderByIdReturn = {
  data: null as any,
  isLoading: false,
  error: null as any,
};

vi.mock('@/hooks/queries/useOrders', () => ({
  useListMyOrders: (filters: any) => {
    mockListMyOrders(filters);
    return mockListMyOrdersReturn;
  },
  useGetMyOrderById: (orderId: string | null) => {
    mockGetMyOrderById(orderId);
    return mockGetMyOrderByIdReturn;
  },
  // Mock other hooks that OrdersTable uses
  useListOrders: () => ({
    data: null,
    isLoading: false,
    error: null,
  }),
  useGetOrderById: () => ({
    data: null,
    isLoading: false,
    error: null,
  }),
  useUpdateOrderStatus: () => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useBulkUpdateOrderStatus: () => ({
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isPending: false,
  }),
  useExportOrders: () => ({
    exportOrders: vi.fn(),
    isExporting: false,
  }),
}));

// Mock the order status validation hook
vi.mock('@/hooks/useOrderStatusValidation', () => ({
  useOrderStatusValidation: () => ({
    validateBulkTransitions: vi.fn(),
    isValidTransition: vi.fn().mockReturnValue(true),
    getValidNextStatuses: vi.fn().mockReturnValue(['completed', 'cancelled']),
  }),
}));

// Mock sample data
const mockOrdersData: RouterOutputs['order']['listAll'] = {
  orders: [
    {
      _id: '507f1f77bcf86cd799439011',
      orderNumber: 'ORD-001',
      user: {
        _id: '507f1f77bcf86cd799439012',
        name: 'John Doe',
        email: 'customer@example.com',
      },
      email: 'customer@example.com',
      status: 'pending',
      products: [],
      totalAmount: 199.98,
      subtotal: 199.98,
      tax: 0,
      shipping: 0,
      discount: 0,
      shippingAddress: {
        fullName: 'John Doe',
        line1: '123 Main St',
        line2: undefined,
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'US',
      },
      billingAddress: undefined,
      paymentMethod: 'card',
      paymentIntentId: 'pi_123',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      stripeSessionId: 'cs_test_123456',
      statusHistory: [],
    },
    {
      _id: '507f1f77bcf86cd799439021',
      orderNumber: 'ORD-002',
      user: {
        _id: '507f1f77bcf86cd799439012',
        name: 'John Doe',
        email: 'customer@example.com',
      },
      email: 'customer@example.com',
      status: 'completed',
      products: [],
      totalAmount: 49.99,
      subtotal: 49.99,
      tax: 0,
      shipping: 0,
      discount: 0,
      shippingAddress: {
        fullName: 'John Doe',
        line1: '123 Main St',
        line2: undefined,
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'US',
      },
      billingAddress: undefined,
      paymentMethod: 'paypal',
      paymentIntentId: 'pi_456',
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-02'),
      stripeSessionId: 'cs_test_789012',
      statusHistory: [],
    },
  ],
  totalCount: 2,
  currentPage: 1,
  totalPages: 1,
};

const mockOrderDetail: RouterOutputs['order']['getById'] = {
  _id: '507f1f77bcf86cd799439011',
  orderNumber: 'ORD-001',
  user: {
    _id: '507f1f77bcf86cd799439012',
    name: 'John Doe',
    email: 'customer@example.com',
  },
  email: 'customer@example.com',
  status: 'pending',
  products: [
    {
      product: {
        _id: '507f1f77bcf86cd799439013',
        name: 'Product 1',
        image: 'image1.jpg',
      },
      price: 99.99,
      quantity: 2,
      variantId: undefined,
      variantDetails: undefined,
      variantLabel: undefined,
    },
  ],
  totalAmount: 199.98,
  subtotal: 199.98,
  tax: 0,
  shipping: 0,
  discount: 0,
  shippingAddress: {
    fullName: 'John Doe',
    line1: '123 Main St',
    line2: undefined,
    city: 'New York',
    state: 'NY',
    postalCode: '10001',
    country: 'US',
    phone: '+1234567890',
  },
  billingAddress: undefined,
  paymentMethod: 'card',
  paymentIntentId: 'pi_123',
  couponCode: undefined,
  originalAmount: undefined,
  createdAt: new Date('2024-01-01T10:00:00Z'),
  updatedAt: new Date('2024-01-01T10:00:00Z'),
  stripeSessionId: 'cs_test_123456',
  statusHistory: [],
};

describe('AccountOrdersPage', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to default successful state
    mockListMyOrdersReturn = {
      data: mockOrdersData,
      isLoading: false,
      error: null,
    };
    mockGetMyOrderByIdReturn = {
      data: mockOrderDetail,
      isLoading: false,
      error: null,
    };
  });

  it('should render page title and description', () => {
    renderWithProviders(<AccountOrdersPage />);

    expect(screen.getByText('My Orders')).toBeInTheDocument();
    expect(screen.getByText('View your order history and track deliveries')).toBeInTheDocument();
  });

  it('should render order list and handle order selection', async () => {
    renderWithProviders(<AccountOrdersPage />);

    // Check that orders are displayed
    expect(screen.getByText('ORD-001')).toBeInTheDocument();
    expect(screen.getByText('ORD-002')).toBeInTheDocument();

    // Click on the first order's view button (customer mode uses eye icon)
    const viewButtons = screen.getAllByRole('button', { name: /view order/i });
    await user.click(viewButtons[0]);

    // Wait for drawer to open - the drawer should request order details
    await waitFor(() => {
      expect(mockGetMyOrderById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
    });
  });

  it('should handle error states gracefully', () => {
    // Override the mock to return an error
    mockListMyOrdersReturn = {
      data: undefined,
      isLoading: false,
      error: new Error('Failed to load orders'),
    };

    renderWithProviders(<AccountOrdersPage />);

    expect(screen.getByText('My Orders')).toBeInTheDocument();
    expect(screen.getByText('Failed to load orders. Please try again.')).toBeInTheDocument();
  });

  it('should handle loading state', () => {
    // Override the mock to return loading state
    mockListMyOrdersReturn = {
      data: undefined,
      isLoading: true,
      error: null,
    };

    renderWithProviders(<AccountOrdersPage />);

    // Should show loading spinner
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('should pass customer mode to child components', () => {
    renderWithProviders(<AccountOrdersPage />);

    // The OrdersTable should be in customer mode
    // This is tested by checking that admin-only features are not present
    expect(screen.queryByPlaceholderText(/search orders/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /export/i })).not.toBeInTheDocument();
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
  });

  it('should handle empty order list', () => {
    // Override the mock to return empty orders
    mockListMyOrdersReturn = {
      data: {
        orders: [],
        totalCount: 0,
        currentPage: 1,
        totalPages: 0,
      },
      isLoading: false,
      error: null,
    };

    renderWithProviders(<AccountOrdersPage />);

    expect(screen.getByText(/No orders found/i)).toBeInTheDocument();
  });

  it('should close order details drawer', async () => {
    renderWithProviders(<AccountOrdersPage />);

    // Open drawer (customer mode uses view button)
    const viewButtons = screen.getAllByRole('button', { name: /view order/i });
    await user.click(viewButtons[0]);

    // Find and click close button
    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);

    // The drawer should no longer request order details after closing
    vi.clearAllMocks();
    await waitFor(() => {
      expect(mockGetMyOrderById).not.toHaveBeenCalled();
    });
  });

  it('should use filters from useListMyOrders', () => {
    renderWithProviders(<AccountOrdersPage />);

    // The hook should have been called with initial filters
    expect(mockListMyOrders).toHaveBeenCalledWith({});
  });

  it('should show correct order count', () => {
    renderWithProviders(<AccountOrdersPage />);

    // Check pagination info
    expect(screen.getByText(/page 1 of 1/i)).toBeInTheDocument();
    
    // Check that both orders are visible
    const orderNumbers = screen.getAllByText(/ORD-00[12]/);
    expect(orderNumbers).toHaveLength(2);
  });
});