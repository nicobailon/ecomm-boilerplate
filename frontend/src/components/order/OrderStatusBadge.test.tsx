import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OrderStatusBadge } from './OrderStatusBadge';
import type { OrderStatus } from '@/types/order';

describe('OrderStatusBadge', () => {
  describe('rendering for each status', () => {
    it('should render pending status with yellow/warning badge', () => {
      render(<OrderStatusBadge status="pending" />);
      
      const badge = screen.getByText('Pending');
      expect(badge).toBeInTheDocument();
      expect(badge.parentElement).toHaveClass('bg-yellow-50');
      expect(badge.parentElement).toHaveClass('text-yellow-700');
      expect(badge.parentElement).toHaveClass('border-yellow-200');
    });

    it('should render completed status with green badge', () => {
      render(<OrderStatusBadge status="completed" />);
      
      const badge = screen.getByText('Completed');
      expect(badge).toBeInTheDocument();
      expect(badge.parentElement).toHaveClass('bg-green-50');
      expect(badge.parentElement).toHaveClass('text-green-700');
      expect(badge.parentElement).toHaveClass('border-green-200');
    });

    it('should render cancelled status with red/destructive badge', () => {
      render(<OrderStatusBadge status="cancelled" />);
      
      const badge = screen.getByText('Cancelled');
      expect(badge).toBeInTheDocument();
      expect(badge.parentElement).toHaveClass('bg-red-50');
      expect(badge.parentElement).toHaveClass('text-red-700');
      expect(badge.parentElement).toHaveClass('border-red-200');
    });

    it('should render refunded status with blue/secondary badge', () => {
      render(<OrderStatusBadge status="refunded" />);
      
      const badge = screen.getByText('Refunded');
      expect(badge).toBeInTheDocument();
      expect(badge.parentElement).toHaveClass('bg-muted');
    });
  });

  describe('proper Badge variant usage', () => {
    it('should use warning variant for pending status', () => {
      const { container } = render(<OrderStatusBadge status="pending" />);
      const badge = container.querySelector('[data-variant="warning"]');
      expect(badge).toBeInTheDocument();
    });

    it('should use default variant for completed status', () => {
      const { container } = render(<OrderStatusBadge status="completed" />);
      const badge = container.querySelector('[data-variant="default"]');
      expect(badge).toBeInTheDocument();
    });

    it('should use destructive variant for cancelled status', () => {
      const { container } = render(<OrderStatusBadge status="cancelled" />);
      const badge = container.querySelector('[data-variant="destructive"]');
      expect(badge).toBeInTheDocument();
    });

    it('should use secondary variant for refunded status', () => {
      const { container } = render(<OrderStatusBadge status="refunded" />);
      const badge = container.querySelector('[data-variant="secondary"]');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('icon rendering', () => {
    it('should render clock icon for pending status', () => {
      render(<OrderStatusBadge status="pending" />);
      expect(screen.getByTestId('clock-icon')).toBeInTheDocument();
    });

    it('should render check circle icon for completed status', () => {
      render(<OrderStatusBadge status="completed" />);
      expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument();
    });

    it('should render x circle icon for cancelled status', () => {
      render(<OrderStatusBadge status="cancelled" />);
      expect(screen.getByTestId('x-circle-icon')).toBeInTheDocument();
    });

    it('should render refresh icon for refunded status', () => {
      render(<OrderStatusBadge status="refunded" />);
      expect(screen.getByTestId('refresh-icon')).toBeInTheDocument();
    });
  });

  describe('type safety', () => {
    it('should accept valid OrderStatus type', () => {
      const statuses: OrderStatus[] = ['pending', 'completed', 'cancelled', 'refunded'];
      
      statuses.forEach(status => {
        const { container } = render(<OrderStatusBadge status={status} />);
        expect(container.firstChild).toBeInTheDocument();
      });
    });
  });

  describe('accessibility', () => {
    it('should have appropriate role and aria-label', () => {
      render(<OrderStatusBadge status="pending" />);
      const badge = screen.getByText('Pending').parentElement;
      expect(badge).toHaveAttribute('role', 'status');
      expect(badge).toHaveAttribute('aria-label', 'Order status: pending');
    });
  });
});

// Type-level tests
type AssertEqual<T, U> = T extends U ? (U extends T ? true : false) : false;

// Test that OrderStatus is properly typed
type TestOrderStatus = AssertEqual<
  Parameters<typeof OrderStatusBadge>[0]['status'],
  'pending' | 'completed' | 'cancelled' | 'refunded'
>;

const _testOrderStatus: TestOrderStatus = true;