import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OrderDetailsDrawer } from './OrderDetailsDrawer';
import { renderWithProviders } from '@/test/utils';
import type { RouterOutputs } from '@/lib/trpc';

// Mock hooks
const mockGetOrderById = vi.fn();
const mockUpdateOrderStatus = vi.fn();

vi.mock('@/hooks/queries/useOrders', () => ({
  useGetOrderById: () => mockGetOrderById(),
  useUpdateOrderStatus: () => ({
    mutate: mockUpdateOrderStatus,
    isLoading: false,
  }),
}));

// Mock order data
const mockOrder: RouterOutputs['order']['getById'] = {
  _id: 'order1',
  orderNumber: 'ORD-001',
  userId: 'user1',
  email: 'customer@example.com',
  status: 'pending',
  items: [
    {
      productId: 'prod1',
      name: 'Product 1',
      price: 99.99,
      quantity: 2,
      image: 'image1.jpg',
    },
    {
      productId: 'prod2',
      name: 'Product 2',
      price: 49.99,
      quantity: 1,
      image: 'image2.jpg',
    },
  ],
  totalAmount: 249.97,
  subtotal: 249.97,
  tax: 0,
  shipping: 0,
  discount: 0,
  shippingAddress: {
    fullName: 'John Doe',
    street: '123 Main St',
    city: 'New York',
    state: 'NY',
    postalCode: '10001',
    country: 'US',
    phone: '+1234567890',
  },
  billingAddress: {
    fullName: 'John Doe',
    street: '123 Main St',
    city: 'New York',
    state: 'NY',
    postalCode: '10001',
    country: 'US',
  },
  paymentMethod: 'card',
  paymentIntentId: 'pi_123',
  createdAt: new Date('2024-01-01T10:00:00Z').toISOString(),
  updatedAt: new Date('2024-01-01T10:00:00Z').toISOString(),
};

describe('OrderDetailsDrawer', () => {
  const mockOnClose = vi.fn();
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetOrderById.mockReturnValue({
      data: mockOrder,
      isLoading: false,
      error: null,
    });
  });

  describe('drawer open/close states', () => {
    it('should render when isOpen is true', () => {
      renderWithProviders(
        <OrderDetailsDrawer
          isOpen={true}
          onClose={mockOnClose}
          orderId="order1"
        />
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Order Details')).toBeInTheDocument();
    });

    it('should not render when isOpen is false', () => {
      renderWithProviders(
        <OrderDetailsDrawer
          isOpen={false}
          onClose={mockOnClose}
          orderId="order1"
        />
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should call onClose when close button clicked', async () => {
      renderWithProviders(
        <OrderDetailsDrawer
          isOpen={true}
          onClose={mockOnClose}
          orderId="order1"
        />
      );

      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when clicking outside', async () => {
      renderWithProviders(
        <OrderDetailsDrawer
          isOpen={true}
          onClose={mockOnClose}
          orderId="order1"
        />
      );

      const overlay = screen.getByTestId('sheet-overlay');
      await user.click(overlay);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('order information display', () => {
    it('should display order number and date', () => {
      renderWithProviders(
        <OrderDetailsDrawer
          isOpen={true}
          onClose={mockOnClose}
          orderId="order1"
        />
      );

      expect(screen.getByText('ORD-001')).toBeInTheDocument();
      expect(screen.getByText('Jan 01, 2024 at 10:00 AM')).toBeInTheDocument();
    });

    it('should display customer information', () => {
      renderWithProviders(
        <OrderDetailsDrawer
          isOpen={true}
          onClose={mockOnClose}
          orderId="order1"
        />
      );

      expect(screen.getByText('Customer Information')).toBeInTheDocument();
      expect(screen.getByText('customer@example.com')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('+1234567890')).toBeInTheDocument();
    });

    it('should display shipping address', () => {
      renderWithProviders(
        <OrderDetailsDrawer
          isOpen={true}
          onClose={mockOnClose}
          orderId="order1"
        />
      );

      expect(screen.getByText('Shipping Address')).toBeInTheDocument();
      expect(screen.getByText('123 Main St')).toBeInTheDocument();
      expect(screen.getByText('New York, NY 10001')).toBeInTheDocument();
      expect(screen.getByText('US')).toBeInTheDocument();
    });

    it('should display billing address', () => {
      renderWithProviders(
        <OrderDetailsDrawer
          isOpen={true}
          onClose={mockOnClose}
          orderId="order1"
        />
      );

      expect(screen.getByText('Billing Address')).toBeInTheDocument();
      // Check it appears in billing section
      const billingSection = screen.getByTestId('billing-address-section');
      expect(billingSection).toHaveTextContent('123 Main St');
    });

    it('should display order items', () => {
      renderWithProviders(
        <OrderDetailsDrawer
          isOpen={true}
          onClose={mockOnClose}
          orderId="order1"
        />
      );

      expect(screen.getByText('Order Items')).toBeInTheDocument();
      expect(screen.getByText('Product 1')).toBeInTheDocument();
      expect(screen.getByText('Product 2')).toBeInTheDocument();
      expect(screen.getByText('$99.99 × 2')).toBeInTheDocument();
      expect(screen.getByText('$49.99 × 1')).toBeInTheDocument();
    });

    it('should display order summary', () => {
      renderWithProviders(
        <OrderDetailsDrawer
          isOpen={true}
          onClose={mockOnClose}
          orderId="order1"
        />
      );

      expect(screen.getByText('Order Summary')).toBeInTheDocument();
      expect(screen.getByText('Subtotal')).toBeInTheDocument();
      expect(screen.getByText('$249.97')).toBeInTheDocument();
      expect(screen.getByText('Tax')).toBeInTheDocument();
      expect(screen.getByText('$0.00')).toBeInTheDocument();
      expect(screen.getByText('Shipping')).toBeInTheDocument();
      expect(screen.getByText('Total')).toBeInTheDocument();
    });

    it('should display payment information', () => {
      renderWithProviders(
        <OrderDetailsDrawer
          isOpen={true}
          onClose={mockOnClose}
          orderId="order1"
        />
      );

      expect(screen.getByText('Payment Method')).toBeInTheDocument();
      expect(screen.getByText('Credit Card')).toBeInTheDocument();
      expect(screen.getByText('pi_123')).toBeInTheDocument();
    });

    it('should display current order status', () => {
      renderWithProviders(
        <OrderDetailsDrawer
          isOpen={true}
          onClose={mockOnClose}
          orderId="order1"
        />
      );

      expect(screen.getByText('Order Status')).toBeInTheDocument();
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });
  });

  describe('status update functionality', () => {
    it('should render status update form', () => {
      renderWithProviders(
        <OrderDetailsDrawer
          isOpen={true}
          onClose={mockOnClose}
          orderId="order1"
        />
      );

      expect(screen.getByText('Update Status')).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: /status/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /update status/i })).toBeInTheDocument();
    });

    it('should show current status as selected', () => {
      renderWithProviders(
        <OrderDetailsDrawer
          isOpen={true}
          onClose={mockOnClose}
          orderId="order1"
        />
      );

      const statusSelect = screen.getByRole('combobox', { name: /status/i });
      expect(statusSelect).toHaveValue('pending');
    });

    it('should handle status update', async () => {
      renderWithProviders(
        <OrderDetailsDrawer
          isOpen={true}
          onClose={mockOnClose}
          orderId="order1"
        />
      );

      const statusSelect = screen.getByRole('combobox', { name: /status/i });
      await user.selectOptions(statusSelect, 'completed');

      const updateButton = screen.getByRole('button', { name: /update status/i });
      await user.click(updateButton);

      expect(mockUpdateOrderStatus).toHaveBeenCalledWith({
        orderId: 'order1',
        status: 'completed',
      });
    });

    it('should disable update button when status unchanged', () => {
      renderWithProviders(
        <OrderDetailsDrawer
          isOpen={true}
          onClose={mockOnClose}
          orderId="order1"
        />
      );

      const updateButton = screen.getByRole('button', { name: /update status/i });
      expect(updateButton).toBeDisabled();
    });

    it('should show loading state during update', () => {
      mockUpdateOrderStatus.mockReturnValue({
        mutate: vi.fn(),
        isLoading: true,
      });

      renderWithProviders(
        <OrderDetailsDrawer
          isOpen={true}
          onClose={mockOnClose}
          orderId="order1"
        />
      );

      const updateButton = screen.getByRole('button', { name: /update status/i });
      expect(updateButton).toBeDisabled();
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });
  });

  describe('loading and error states', () => {
    it('should show loading state when fetching order', () => {
      mockGetOrderById.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      });

      renderWithProviders(
        <OrderDetailsDrawer
          isOpen={true}
          onClose={mockOnClose}
          orderId="order1"
        />
      );

      expect(screen.getByTestId('drawer-loading-spinner')).toBeInTheDocument();
    });

    it('should show error state when order fetch fails', () => {
      mockGetOrderById.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Failed to load order'),
      });

      renderWithProviders(
        <OrderDetailsDrawer
          isOpen={true}
          onClose={mockOnClose}
          orderId="order1"
        />
      );

      expect(screen.getByText(/Failed to load order/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    it('should handle missing order data gracefully', () => {
      mockGetOrderById.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      });

      renderWithProviders(
        <OrderDetailsDrawer
          isOpen={true}
          onClose={mockOnClose}
          orderId="order1"
        />
      );

      expect(screen.getByText(/Order not found/i)).toBeInTheDocument();
    });

    it('should refetch order when orderId changes', async () => {
      const { rerender } = renderWithProviders(
        <OrderDetailsDrawer
          isOpen={true}
          onClose={mockOnClose}
          orderId="order1"
        />
      );

      expect(mockGetOrderById).toHaveBeenCalledWith('order1');

      rerender(
        <OrderDetailsDrawer
          isOpen={true}
          onClose={mockOnClose}
          orderId="order2"
        />
      );

      await waitFor(() => {
        expect(mockGetOrderById).toHaveBeenCalledWith('order2');
      });
    });
  });

  describe('edge cases', () => {
    it('should handle order with no items', () => {
      mockGetOrderById.mockReturnValue({
        data: { ...mockOrder, items: [] },
        isLoading: false,
        error: null,
      });

      renderWithProviders(
        <OrderDetailsDrawer
          isOpen={true}
          onClose={mockOnClose}
          orderId="order1"
        />
      );

      expect(screen.getByText(/No items in this order/i)).toBeInTheDocument();
    });

    it('should handle missing addresses', () => {
      mockGetOrderById.mockReturnValue({
        data: { ...mockOrder, shippingAddress: undefined, billingAddress: undefined },
        isLoading: false,
        error: null,
      });

      renderWithProviders(
        <OrderDetailsDrawer
          isOpen={true}
          onClose={mockOnClose}
          orderId="order1"
        />
      );

      expect(screen.getByText(/No shipping address/i)).toBeInTheDocument();
      expect(screen.getByText(/No billing address/i)).toBeInTheDocument();
    });

    it('should format different payment methods correctly', () => {
      const paymentMethods = [
        { method: 'card', display: 'Credit Card' },
        { method: 'paypal', display: 'PayPal' },
        { method: 'stripe', display: 'Stripe' },
        { method: 'cash', display: 'Cash' },
      ];

      paymentMethods.forEach(({ method, display }) => {
        mockGetOrderById.mockReturnValue({
          data: { ...mockOrder, paymentMethod: method },
          isLoading: false,
          error: null,
        });

        const { unmount } = renderWithProviders(
          <OrderDetailsDrawer
            isOpen={true}
            onClose={mockOnClose}
            orderId="order1"
          />
        );

        expect(screen.getByText(display)).toBeInTheDocument();
        unmount();
      });
    });
  });
});

// Type-level tests
type AssertEqual<T, U> = T extends U ? (U extends T ? true : false) : false;

// Test that OrderDetailsDrawer props are properly typed
type TestOrderDetailsDrawerProps = AssertEqual<
  Parameters<typeof OrderDetailsDrawer>[0],
  {
    isOpen: boolean;
    onClose: () => void;
    orderId: string | null;
  }
>;

const _testOrderDetailsDrawerProps: TestOrderDetailsDrawerProps = true;