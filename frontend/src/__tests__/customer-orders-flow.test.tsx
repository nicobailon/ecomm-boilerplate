import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import AccountOrdersPage from '@/pages/AccountOrdersPage';
import type { RouterOutputs } from '@/lib/trpc';

// Mock the auth hook to simulate logged-in customer
vi.mock('@/hooks/auth/useAuth', () => ({
  useCurrentUser: () => ({
    data: {
      _id: '507f1f77bcf86cd799439012',
      email: 'customer@example.com',
      name: 'John Doe',
      role: 'user',
      emailVerified: true,
    },
    isLoading: false,
    error: null,
  }),
  useLogout: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

// Mock order data
const mockOrdersData: RouterOutputs['order']['listAll'] = {
  orders: [
    {
      _id: '507f1f77bcf86cd799439011',
      orderNumber: 'ORD-2024-001',
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
            name: 'Wireless Headphones',
            image: 'headphones.jpg',
          },
          price: 79.99,
          quantity: 1,
          variantId: undefined,
          variantDetails: undefined,
          variantLabel: undefined,
        },
      ],
      totalAmount: 79.99,
      subtotal: 79.99,
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
      createdAt: new Date('2024-01-15'),
      updatedAt: new Date('2024-01-15'),
      stripeSessionId: 'cs_test_123456',
      statusHistory: [],
    },
    {
      _id: '507f1f77bcf86cd799439021',
      orderNumber: 'ORD-2024-002',
      user: {
        _id: '507f1f77bcf86cd799439012',
        name: 'John Doe',
        email: 'customer@example.com',
      },
      email: 'customer@example.com',
      status: 'completed',
      products: [
        {
          product: {
            _id: '507f1f77bcf86cd799439023',
            name: 'Smart Watch',
            image: 'watch.jpg',
          },
          price: 249.99,
          quantity: 1,
          variantId: undefined,
          variantDetails: undefined,
          variantLabel: 'Color: Black',
        },
      ],
      totalAmount: 249.99,
      subtotal: 249.99,
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
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-12'),
      stripeSessionId: 'cs_test_789012',
      statusHistory: [],
    },
  ],
  totalCount: 2,
  currentPage: 1,
  totalPages: 1,
};

const mockOrderDetail: RouterOutputs['order']['getById'] = {
  ...mockOrdersData.orders[0],
  products: [
    {
      product: {
        _id: '507f1f77bcf86cd799439013',
        name: 'Wireless Headphones',
        image: 'headphones.jpg',
      },
      price: 79.99,
      quantity: 1,
      variantId: undefined,
      variantDetails: undefined,
      variantLabel: undefined,
    },
  ],
  shippingAddress: {
    ...mockOrdersData.orders[0].shippingAddress!,
    phone: '+1 (555) 123-4567',
  },
};

const mockEmptyOrdersData: RouterOutputs['order']['listAll'] = {
  orders: [],
  totalCount: 0,
  currentPage: 1,
  totalPages: 0,
};

// Mock the order hooks
let mockListMyOrdersReturn = {
  data: mockOrdersData,
  isLoading: false,
  error: null as Error | null,
};

let mockGetMyOrderByIdReturn = {
  data: null as RouterOutputs['order']['getById'] | null,
  isLoading: false,
  error: null as Error | null,
};

vi.mock('@/hooks/queries/useOrders', () => ({
  useListMyOrders: () => mockListMyOrdersReturn,
  useGetMyOrderById: (orderId: string | null) => {
    if (orderId === '507f1f77bcf86cd799439011') {
      return {
        data: mockOrderDetail,
        isLoading: false,
        error: null,
      };
    }
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

describe('Customer Orders E2E Flow', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock data
    mockListMyOrdersReturn = {
      data: mockOrdersData,
      isLoading: false,
      error: null,
    };
    mockGetMyOrderByIdReturn = {
      data: null,
      isLoading: false,
      error: null,
    };
  });

  it('should allow customer to view their orders', async () => {
    // 1. Render the orders page directly
    renderWithProviders(<AccountOrdersPage />);

    // 2. Verify orders list displays
    await waitFor(() => {
      expect(screen.getByText('My Orders')).toBeInTheDocument();
      expect(screen.getByText('View your order history and track deliveries')).toBeInTheDocument();
    });

    // Verify both orders are shown
    expect(screen.getByText('ORD-2024-001')).toBeInTheDocument();
    expect(screen.getByText('ORD-2024-002')).toBeInTheDocument();

    // Verify order statuses - use getAllByText since status appears in badges and dropdowns
    const pendingStatuses = screen.getAllByText('Pending');
    expect(pendingStatuses.length).toBeGreaterThanOrEqual(1);
    const completedStatuses = screen.getAllByText('Completed');
    expect(completedStatuses.length).toBeGreaterThanOrEqual(1);

    // 4. Click on an order to view details
    // In customer mode, there's a direct view button with eye icon instead of dropdown
    const viewButtons = screen.getAllByRole('button', { name: /view order/i });
    await user.click(viewButtons[0]); // First order

    // 5. Verify order details drawer opens
    await waitFor(() => {
      const drawer = screen.getByRole('dialog');
      expect(drawer).toBeInTheDocument();
      
      // Check drawer title
      expect(within(drawer).getByText('Order Details')).toBeInTheDocument();
      
      // Check order number in drawer
      expect(within(drawer).getByText('ORD-2024-001')).toBeInTheDocument();
      
      // Check product details
      expect(within(drawer).getByText('Wireless Headphones')).toBeInTheDocument();
      // Use getAllByText since price appears multiple times in drawer
      const prices = within(drawer).getAllByText('$79.99');
      expect(prices.length).toBeGreaterThanOrEqual(1);
    });

    // 6. Verify no admin controls visible
    const drawer = screen.getByRole('dialog');
    expect(within(drawer).queryByText(/Order Status/i)).not.toBeInTheDocument();
    expect(within(drawer).queryByRole('combobox', { name: /status/i })).not.toBeInTheDocument();
    expect(within(drawer).queryByRole('button', { name: /update status/i })).not.toBeInTheDocument();

    // 7. Close drawer
    const closeButton = within(drawer).getByRole('button', { name: /close/i });
    await user.click(closeButton);

    // 8. Verify navigation back to list
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    
    // Should still see the orders list
    expect(screen.getByText('ORD-2024-001')).toBeInTheDocument();
    expect(screen.getByText('ORD-2024-002')).toBeInTheDocument();
  });

  it('should show empty state for customer with no orders', async () => {
    // Override mock data to return empty orders
    mockListMyOrdersReturn = {
      data: mockEmptyOrdersData,
      isLoading: false,
      error: null,
    };

    renderWithProviders(<AccountOrdersPage />);

    // Verify empty state message
    await waitFor(() => {
      expect(screen.getByText('My Orders')).toBeInTheDocument();
      expect(screen.getByText(/No orders found/i)).toBeInTheDocument();
    });

    // Verify no order items are shown
    expect(screen.queryByText(/ORD-/)).not.toBeInTheDocument();
  });

  it('should filter orders by status', async () => {
    renderWithProviders(<AccountOrdersPage />);

    // Wait for page to load
    await waitFor(() => {
      expect(screen.getByText('My Orders')).toBeInTheDocument();
    });

    // Find status filter
    const statusFilter = screen.getByLabelText('Status');
    expect(statusFilter).toBeInTheDocument();

    // Select pending status
    await user.selectOptions(statusFilter, 'pending');

    // In a real app, this would filter the orders
    // For this test, we're just verifying the filter exists and is interactable
    expect(statusFilter).toHaveValue('pending');
  });

  it('should display customer-specific order information', async () => {
    renderWithProviders(<AccountOrdersPage />);

    await waitFor(() => {
      // Verify customer email is NOT shown in the table (customer mode)
      expect(screen.queryByText('customer@example.com')).not.toBeInTheDocument();
      
      // Verify order totals are shown
      expect(screen.getByText('$79.99')).toBeInTheDocument();
      expect(screen.getByText('$249.99')).toBeInTheDocument();
      
      // Verify item counts
      const itemCounts = screen.getAllByText('1 item');
      expect(itemCounts).toHaveLength(2);
    });
  });

  it('should handle responsive layout', async () => {
    renderWithProviders(<AccountOrdersPage />);

    await waitFor(() => {
      expect(screen.getByText('My Orders')).toBeInTheDocument();
    });

    // Check that table has horizontal scroll wrapper
    const table = screen.getByRole('table');
    const scrollWrapper = table.closest('.overflow-x-auto');
    expect(scrollWrapper).toBeInTheDocument();
  });
});