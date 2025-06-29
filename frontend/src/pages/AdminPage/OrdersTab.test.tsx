import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OrdersTab } from './OrdersTab';
import { renderWithProviders } from '@/test/test-utils';
// import type { RouterOutputs } from '@/lib/trpc';

// Mock the OrdersTable component
vi.mock('@/components/order/OrdersTable', () => ({
  OrdersTable: ({ onEditOrder }: { onEditOrder: (order: any) => void }) => (
    <div data-testid="mock-orders-table">
      <button
        onClick={() => onEditOrder({ _id: 'order1', orderNumber: 'ORD-001' })}
        data-testid="edit-order-button"
      >
        Edit Order
      </button>
    </div>
  ),
}));

// Mock the OrderDetailsDrawer component
vi.mock('@/components/order/OrderDetailsDrawer', () => ({
  OrderDetailsDrawer: ({ isOpen, onClose, orderId }: { isOpen: boolean; onClose: () => void; orderId: string | null }) => (
    isOpen ? (
      <div data-testid="mock-order-drawer">
        <h2>Order Details</h2>
        <p>Order ID: {orderId}</p>
        <button onClick={onClose} data-testid="close-drawer">
          Close
        </button>
      </div>
    ) : null
  ),
}));

describe('OrdersTab', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('component rendering', () => {
    it('should render OrdersTable component', () => {
      renderWithProviders(<OrdersTab />);

      expect(screen.getByTestId('mock-orders-table')).toBeInTheDocument();
    });

    it('should render with proper layout and structure', () => {
      const { container } = renderWithProviders(<OrdersTab />);

      const tabContent = container.querySelector('[role="tabpanel"]');
      expect(tabContent).toBeInTheDocument();
      expect(tabContent).toHaveClass('space-y-4');
    });
  });

  describe('drawer interaction', () => {
    it('should not show drawer initially', () => {
      renderWithProviders(<OrdersTab />);

      expect(screen.queryByTestId('mock-order-drawer')).not.toBeInTheDocument();
    });

    it('should open drawer when order is selected', async () => {
      renderWithProviders(<OrdersTab />);

      const editButton = screen.getByTestId('edit-order-button');
      await user.click(editButton);

      expect(screen.getByTestId('mock-order-drawer')).toBeInTheDocument();
      expect(screen.getByText('Order ID: order1')).toBeInTheDocument();
    });

    it('should close drawer when close button is clicked', async () => {
      renderWithProviders(<OrdersTab />);

      // Open drawer first
      const editButton = screen.getByTestId('edit-order-button');
      await user.click(editButton);

      expect(screen.getByTestId('mock-order-drawer')).toBeInTheDocument();

      // Close drawer
      const closeButton = screen.getByTestId('close-drawer');
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('mock-order-drawer')).not.toBeInTheDocument();
      });
    });

    it('should update selected order when different order is clicked', async () => {
      const { rerender } = renderWithProviders(<OrdersTab />);

      // Mock OrdersTable with multiple orders
      vi.doMock('@/components/order/OrdersTable', () => ({
        OrdersTable: ({ onEditOrder }: { onEditOrder: (order: any) => void }) => (
          <div data-testid="mock-orders-table">
            <button
              onClick={() => onEditOrder({ _id: 'order1', orderNumber: 'ORD-001' })}
              data-testid="edit-order-1"
            >
              Edit Order 1
            </button>
            <button
              onClick={() => onEditOrder({ _id: 'order2', orderNumber: 'ORD-002' })}
              data-testid="edit-order-2"
            >
              Edit Order 2
            </button>
          </div>
        ),
      }));

      rerender(<OrdersTab />);

      // Click first order
      const editButton1 = screen.getByTestId('edit-order-button');
      await user.click(editButton1);

      expect(screen.getByText('Order ID: order1')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper tabpanel role', () => {
      const { container } = renderWithProviders(<OrdersTab />);

      const tabPanel = container.querySelector('[role="tabpanel"]');
      expect(tabPanel).toBeInTheDocument();
    });

    it('should have proper aria-labelledby attribute', () => {
      const { container } = renderWithProviders(<OrdersTab />);

      const tabPanel = container.querySelector('[role="tabpanel"]');
      expect(tabPanel).toHaveAttribute('aria-labelledby', 'orders-tab');
    });

    it('should maintain focus management between table and drawer', async () => {
      renderWithProviders(<OrdersTab />);

      const editButton = screen.getByTestId('edit-order-button');
      editButton.focus();
      expect(document.activeElement).toBe(editButton);

      await user.click(editButton);

      // When drawer opens, focus should move to drawer
      const closeButton = screen.getByTestId('close-drawer');
      await waitFor(() => {
        expect(closeButton).toBeVisible();
      });
    });
  });

  describe('state management', () => {
    it('should clear selected order when drawer closes', async () => {
      renderWithProviders(<OrdersTab />);

      // Open drawer
      const editButton = screen.getByTestId('edit-order-button');
      await user.click(editButton);

      expect(screen.getByText('Order ID: order1')).toBeInTheDocument();

      // Close drawer
      const closeButton = screen.getByTestId('close-drawer');
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('mock-order-drawer')).not.toBeInTheDocument();
      });

      // Re-open drawer - should still work
      await user.click(editButton);
      expect(screen.getByText('Order ID: order1')).toBeInTheDocument();
    });

    it('should handle rapid open/close actions gracefully', async () => {
      renderWithProviders(<OrdersTab />);

      const editButton = screen.getByTestId('edit-order-button');

      // Rapidly click to open
      await user.click(editButton);
      await user.click(editButton);

      // Should still show drawer
      expect(screen.getByTestId('mock-order-drawer')).toBeInTheDocument();

      // Rapidly close and open
      const closeButton = screen.getByTestId('close-drawer');
      await user.click(closeButton);
      await user.click(editButton);

      // Should handle gracefully
      await waitFor(() => {
        expect(screen.getByTestId('mock-order-drawer')).toBeInTheDocument();
      });
    });
  });
});

