import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OrdersTable } from './OrdersTable';
import { renderWithProviders } from '@/test/test-utils';
import type { RouterOutputs } from '@/lib/trpc';

// Mock tRPC hooks
const mockListOrders = vi.fn();
const mockUpdateOrderStatus = vi.fn();
const mockBulkUpdateOrderStatus = vi.fn();
const mockExportOrders = vi.fn();

vi.mock('@/hooks/queries/useOrders', () => ({
  useListOrders: () => mockListOrders(),
  useUpdateOrderStatus: () => ({
    mutate: mockUpdateOrderStatus,
    isLoading: false,
  }),
  useBulkUpdateOrderStatus: () => ({
    mutate: mockBulkUpdateOrderStatus,
    isLoading: false,
  }),
  useExportOrders: () => ({
    mutate: mockExportOrders,
    isLoading: false,
  }),
}));

// Mock debounce to execute immediately in tests
vi.mock('lodash.debounce', () => ({
  default: (fn: any) => fn,
}));

// Sample order data
const mockOrders: RouterOutputs['order']['listAll'] = {
  orders: [
    {
      _id: 'order1' as any,
      orderNumber: 'ORD-001',
      user: {
        _id: 'user1' as any,
        name: 'John Doe',
        email: 'customer1@example.com',
      },
      email: 'customer1@example.com',
      status: 'pending',
      products: [
        {
          product: {
            _id: 'prod1' as any,
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
      },
      billingAddress: undefined,
      paymentMethod: 'card',
      paymentIntentId: 'pi_123',
      createdAt: new Date('2024-01-01') as any,
      updatedAt: new Date('2024-01-01') as any,
    },
    {
      _id: 'order2' as any,
      orderNumber: 'ORD-002',
      user: {
        _id: 'user2' as any,
        name: 'Jane Smith',
        email: 'customer2@example.com',
      },
      email: 'customer2@example.com',
      status: 'completed',
      products: [
        {
          product: {
            _id: 'prod2' as any,
            name: 'Product 2',
            image: 'image2.jpg',
          },
          price: 49.99,
          quantity: 1,
          variantId: undefined,
          variantDetails: undefined,
          variantLabel: undefined,
        },
      ],
      totalAmount: 49.99,
      subtotal: 49.99,
      tax: 0,
      shipping: 0,
      discount: 0,
      shippingAddress: {
        fullName: 'Jane Smith',
        line1: '456 Oak Ave',
        line2: undefined,
        city: 'Los Angeles',
        state: 'CA',
        postalCode: '90001',
        country: 'US',
      },
      billingAddress: undefined,
      paymentMethod: 'paypal',
      paymentIntentId: 'pi_456',
      createdAt: new Date('2024-01-02') as any,
      updatedAt: new Date('2024-01-02') as any,
    },
  ],
  totalCount: 2,
  currentPage: 1,
  totalPages: 1,
};

describe('OrdersTable', () => {
  const mockOnEditOrder = vi.fn();
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    mockListOrders.mockReturnValue({
      data: mockOrders,
      isLoading: false,
      error: null,
    });
  });

  describe('table rendering', () => {
    it('should render table with orders data', () => {
      renderWithProviders(<OrdersTable onEditOrder={mockOnEditOrder} />);

      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getByText('ORD-001')).toBeInTheDocument();
      expect(screen.getByText('ORD-002')).toBeInTheDocument();
      expect(screen.getByText('customer1@example.com')).toBeInTheDocument();
      expect(screen.getByText('customer2@example.com')).toBeInTheDocument();
    });

    it('should render loading state', () => {
      mockListOrders.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      });

      renderWithProviders(<OrdersTable onEditOrder={mockOnEditOrder} />);
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('should render error state', () => {
      mockListOrders.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Failed to load orders'),
      });

      renderWithProviders(<OrdersTable onEditOrder={mockOnEditOrder} />);
      expect(screen.getByText(/Failed to load orders/i)).toBeInTheDocument();
    });

    it('should render empty state when no orders', () => {
      mockListOrders.mockReturnValue({
        data: { orders: [], totalCount: 0, currentPage: 1, totalPages: 0 },
        isLoading: false,
        error: null,
      });

      renderWithProviders(<OrdersTable onEditOrder={mockOnEditOrder} />);
      expect(screen.getByText(/No orders found/i)).toBeInTheDocument();
    });
  });

  describe('column definitions and custom cells', () => {
    it('should render all required columns', () => {
      renderWithProviders(<OrdersTable onEditOrder={mockOnEditOrder} />);

      const headers = ['Order', 'Customer', 'Status', 'Date', 'Items', 'Total', 'Actions'];
      headers.forEach(header => {
        expect(screen.getByRole('columnheader', { name: new RegExp(header, 'i') })).toBeInTheDocument();
      });
    });

    it('should render order status badges correctly', () => {
      renderWithProviders(<OrdersTable onEditOrder={mockOnEditOrder} />);

      const pendingBadge = screen.getByText('Pending');
      const completedBadge = screen.getByText('Completed');

      expect(pendingBadge).toBeInTheDocument();
      expect(completedBadge).toBeInTheDocument();
    });

    it('should format dates correctly', () => {
      renderWithProviders(<OrdersTable onEditOrder={mockOnEditOrder} />);

      expect(screen.getByText('Jan 01, 2024')).toBeInTheDocument();
      expect(screen.getByText('Jan 02, 2024')).toBeInTheDocument();
    });

    it('should format currency correctly', () => {
      renderWithProviders(<OrdersTable onEditOrder={mockOnEditOrder} />);

      expect(screen.getByText('$199.98')).toBeInTheDocument();
      expect(screen.getByText('$49.99')).toBeInTheDocument();
    });

    it('should show item count', () => {
      renderWithProviders(<OrdersTable onEditOrder={mockOnEditOrder} />);

      expect(screen.getByText('2 items')).toBeInTheDocument();
      expect(screen.getByText('1 item')).toBeInTheDocument();
    });
  });

  describe('filtering functionality', () => {
    it('should filter by search term', async () => {
      renderWithProviders(<OrdersTable onEditOrder={mockOnEditOrder} />);

      const searchInput = screen.getByPlaceholderText(/search orders/i);
      await user.type(searchInput, 'ORD-001');

      await waitFor(() => {
        expect(mockListOrders).toHaveBeenCalledWith(
          expect.objectContaining({
            search: 'ORD-001',
          })
        );
      });
    });

    it('should filter by status', async () => {
      renderWithProviders(<OrdersTable onEditOrder={mockOnEditOrder} />);

      const statusSelect = screen.getByRole('combobox', { name: /status/i });
      await user.click(statusSelect);
      await user.click(screen.getByRole('option', { name: /pending/i }));

      await waitFor(() => {
        expect(mockListOrders).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'pending',
          })
        );
      });
    });

    it('should filter by date range', async () => {
      renderWithProviders(<OrdersTable onEditOrder={mockOnEditOrder} />);

      const dateRangeButton = screen.getByRole('button', { name: /date range/i });
      await user.click(dateRangeButton);

      // Select start and end dates
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      await waitFor(() => {
        expect(mockListOrders).toHaveBeenCalledWith(
          expect.objectContaining({
            startDate: expect.any(Date),
            endDate: expect.any(Date),
          })
        );
      });
    });

    it('should clear all filters', async () => {
      renderWithProviders(<OrdersTable onEditOrder={mockOnEditOrder} />);

      // Apply some filters first
      const searchInput = screen.getByPlaceholderText(/search orders/i);
      await user.type(searchInput, 'test');

      const clearButton = screen.getByRole('button', { name: /clear filters/i });
      await user.click(clearButton);

      await waitFor(() => {
        expect(mockListOrders).toHaveBeenCalledWith(
          expect.objectContaining({
            search: '',
            status: undefined,
            startDate: undefined,
            endDate: undefined,
          })
        );
      });
    });
  });

  describe('sorting functionality', () => {
    it('should sort by date', async () => {
      renderWithProviders(<OrdersTable onEditOrder={mockOnEditOrder} />);

      const dateHeader = screen.getByRole('columnheader', { name: /date/i });
      await user.click(dateHeader);

      await waitFor(() => {
        expect(mockListOrders).toHaveBeenCalledWith(
          expect.objectContaining({
            sortBy: 'createdAt',
            sortOrder: 'desc',
          })
        );
      });

      // Click again to reverse sort
      await user.click(dateHeader);

      await waitFor(() => {
        expect(mockListOrders).toHaveBeenCalledWith(
          expect.objectContaining({
            sortBy: 'createdAt',
            sortOrder: 'asc',
          })
        );
      });
    });

    it('should sort by total amount', async () => {
      renderWithProviders(<OrdersTable onEditOrder={mockOnEditOrder} />);

      const totalHeader = screen.getByRole('columnheader', { name: /total/i });
      await user.click(totalHeader);

      await waitFor(() => {
        expect(mockListOrders).toHaveBeenCalledWith(
          expect.objectContaining({
            sortBy: 'totalAmount',
            sortOrder: 'desc',
          })
        );
      });
    });
  });

  describe('pagination controls', () => {
    it('should render pagination controls', () => {
      renderWithProviders(<OrdersTable onEditOrder={mockOnEditOrder} />);

      expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
      expect(screen.getByText(/page 1 of 1/i)).toBeInTheDocument();
    });

    it('should handle page navigation', async () => {
      mockListOrders.mockReturnValue({
        data: { ...mockOrders, hasMore: true },
        isLoading: false,
        error: null,
      });

      renderWithProviders(<OrdersTable onEditOrder={mockOnEditOrder} />);

      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);

      await waitFor(() => {
        expect(mockListOrders).toHaveBeenCalledWith(
          expect.objectContaining({
            page: 2,
          })
        );
      });
    });

    it('should handle page size change', async () => {
      renderWithProviders(<OrdersTable onEditOrder={mockOnEditOrder} />);

      const pageSizeSelect = screen.getByRole('combobox', { name: /rows per page/i });
      await user.click(pageSizeSelect);
      await user.click(screen.getByRole('option', { name: /20/i }));

      await waitFor(() => {
        expect(mockListOrders).toHaveBeenCalledWith(
          expect.objectContaining({
            limit: 20,
          })
        );
      });
    });
  });

  describe('bulk selection and actions', () => {
    it('should handle row selection', async () => {
      renderWithProviders(<OrdersTable onEditOrder={mockOnEditOrder} />);

      const firstRowCheckbox = screen.getAllByRole('checkbox')[1]; // Skip header checkbox
      await user.click(firstRowCheckbox);

      expect(screen.getByText(/1 selected/i)).toBeInTheDocument();
    });

    it('should handle select all', async () => {
      renderWithProviders(<OrdersTable onEditOrder={mockOnEditOrder} />);

      const selectAllCheckbox = screen.getAllByRole('checkbox')[0];
      await user.click(selectAllCheckbox);

      expect(screen.getByText(/2 selected/i)).toBeInTheDocument();
    });

    it('should show bulk action bar when items selected', async () => {
      renderWithProviders(<OrdersTable onEditOrder={mockOnEditOrder} />);

      const firstRowCheckbox = screen.getAllByRole('checkbox')[1];
      await user.click(firstRowCheckbox);

      expect(screen.getByTestId('bulk-action-bar')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /mark as completed/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /mark as cancelled/i })).toBeInTheDocument();
    });

    it('should handle bulk status update', async () => {
      renderWithProviders(<OrdersTable onEditOrder={mockOnEditOrder} />);

      const firstRowCheckbox = screen.getAllByRole('checkbox')[1];
      await user.click(firstRowCheckbox);

      const bulkCompleteButton = screen.getByRole('button', { name: /mark as completed/i });
      await user.click(bulkCompleteButton);

      expect(mockBulkUpdateOrderStatus).toHaveBeenCalledWith({
        orderIds: ['order1'],
        status: 'completed',
      });
    });
  });

  describe('export functionality', () => {
    it('should render export button', () => {
      renderWithProviders(<OrdersTable onEditOrder={mockOnEditOrder} />);

      expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument();
    });

    it('should handle export with current filters', async () => {
      renderWithProviders(<OrdersTable onEditOrder={mockOnEditOrder} />);

      // Apply a filter first
      const searchInput = screen.getByPlaceholderText(/search orders/i);
      await user.type(searchInput, 'test');

      const exportButton = screen.getByRole('button', { name: /export/i });
      await user.click(exportButton);

      expect(mockExportOrders).toHaveBeenCalledWith({
        search: 'test',
        status: undefined,
        startDate: undefined,
        endDate: undefined,
      });
    });
  });

  describe('row actions', () => {
    it('should render action menu for each row', () => {
      renderWithProviders(<OrdersTable onEditOrder={mockOnEditOrder} />);

      const actionButtons = screen.getAllByRole('button', { name: /actions/i });
      expect(actionButtons).toHaveLength(2); // One for each order
    });

    it('should handle view/edit action', async () => {
      renderWithProviders(<OrdersTable onEditOrder={mockOnEditOrder} />);

      const firstActionButton = screen.getAllByRole('button', { name: /actions/i })[0];
      await user.click(firstActionButton);

      const viewButton = screen.getByRole('menuitem', { name: /view details/i });
      await user.click(viewButton);

      expect(mockOnEditOrder).toHaveBeenCalledWith(mockOrders.orders[0]);
    });

    it('should handle status update from action menu', async () => {
      renderWithProviders(<OrdersTable onEditOrder={mockOnEditOrder} />);

      const firstActionButton = screen.getAllByRole('button', { name: /actions/i })[0];
      await user.click(firstActionButton);

      const completeButton = screen.getByRole('menuitem', { name: /mark as completed/i });
      await user.click(completeButton);

      expect(mockUpdateOrderStatus).toHaveBeenCalledWith({
        orderId: 'order1',
        status: 'completed',
      });
    });
  });

  describe('column visibility', () => {
    it('should allow toggling column visibility', async () => {
      renderWithProviders(<OrdersTable onEditOrder={mockOnEditOrder} />);

      const columnsButton = screen.getByRole('button', { name: /columns/i });
      await user.click(columnsButton);

      const customerCheckbox = screen.getByRole('checkbox', { name: /customer/i });
      await user.click(customerCheckbox);

      expect(screen.queryByText('customer1@example.com')).not.toBeInTheDocument();
    });
  });

  describe('responsive behavior', () => {
    it('should hide certain columns on small screens', () => {
      // Mock window.matchMedia for mobile viewport
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(max-width: 768px)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      renderWithProviders(<OrdersTable onEditOrder={mockOnEditOrder} />);

      // On mobile, some columns should be hidden
      expect(screen.queryByRole('columnheader', { name: /items/i })).not.toBeInTheDocument();
    });
  });
});

// Type-level tests
type AssertEqual<T, U> = T extends U ? (U extends T ? true : false) : false;

// Test that OrdersTable props are properly typed
type TestOrdersTableProps = AssertEqual<
  Parameters<typeof OrdersTable>[0],
  {
    onEditOrder?: (order: RouterOutputs['order']['listAll']['orders'][0]) => void;
  }
>;

const _testOrdersTableProps: TestOrdersTableProps = true;