import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/test/test-utils';
import OrderSummary from './OrderSummary';
import { toast } from 'sonner';
import type { useUnifiedCart } from '@/hooks/cart/useUnifiedCart';

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// Mock Stripe to prevent loading errors in tests
vi.mock('@stripe/stripe-js', () => ({
  loadStripe: vi.fn(() => Promise.resolve({
    redirectToCheckout: vi.fn(() => Promise.resolve({ error: null })),
  })),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockUseUnifiedCart = vi.fn();
vi.mock('@/hooks/cart/useUnifiedCart', () => ({
  useUnifiedCart: () => mockUseUnifiedCart() as ReturnType<typeof useUnifiedCart>,
}));

describe('OrderSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseUnifiedCart.mockReturnValue({
      data: {
        subtotal: 100,
        totalAmount: 100,
        appliedCoupon: null,
        cartItems: [
          { product: { _id: '1', price: 100 }, quantity: 1 },
        ],
      },
      source: 'user',
    });
  });

  describe('Basic Display', () => {
    it('should render order summary with correct totals', () => {
      render(<OrderSummary />);
      
      expect(screen.getByText('Order summary')).toBeInTheDocument();
      expect(screen.getByText('Original price')).toBeInTheDocument();
      expect(screen.getAllByText('$100.00')).toHaveLength(2); // Original price and Total
      expect(screen.getByText('Total')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Proceed to Checkout' })).toBeInTheDocument();
    });

    it('should show continue shopping link', () => {
      render(<OrderSummary />);
      
      const continueLink = screen.getByRole('link', { name: /Continue Shopping/i });
      expect(continueLink).toHaveAttribute('href', '/');
    });

    it('should handle empty cart', () => {
      mockUseUnifiedCart.mockReturnValue({
        data: {
          subtotal: 0,
          totalAmount: 0,
          appliedCoupon: null,
          cartItems: [],
        },
        source: 'user',
      });
      
      render(<OrderSummary />);
      
      const checkoutButton = screen.getByRole('button', { name: 'Proceed to Checkout' });
      expect(checkoutButton).toBeDisabled();
    });
  });

  describe('Discount Display', () => {
    it('should display savings when coupon is applied', () => {
      mockUseUnifiedCart.mockReturnValue({
        data: {
          subtotal: 100,
          totalAmount: 80,
          appliedCoupon: {
            code: 'SAVE20',
            discountPercentage: 20,
          },
          cartItems: [
            { product: { _id: '1', price: 100 }, quantity: 1 },
          ],
        },
        source: 'user',
      });
      
      render(<OrderSummary />);
      
      expect(screen.getByText('Savings')).toBeInTheDocument();
      expect(screen.getByText('-$20.00')).toBeInTheDocument();
      expect(screen.getByText('Coupon (SAVE20)')).toBeInTheDocument();
      expect(screen.getByText('-20%')).toBeInTheDocument();
      expect(screen.getByText('$80.00')).toBeInTheDocument();
    });

    it('should not show savings section when no discount', () => {
      render(<OrderSummary />);
      
      expect(screen.queryByText('Savings')).not.toBeInTheDocument();
      expect(screen.queryByText(/Coupon/)).not.toBeInTheDocument();
    });

    it('should calculate correct savings for different percentages', () => {
      const testCases = [
        { percentage: 10, subtotal: 100, total: 90, savings: 10 },
        { percentage: 25, subtotal: 200, total: 150, savings: 50 },
        { percentage: 50, subtotal: 80, total: 40, savings: 40 },
        { percentage: 100, subtotal: 100, total: 0, savings: 100 },
      ];

      testCases.forEach(({ percentage, subtotal, total, savings }) => {
        mockUseUnifiedCart.mockReturnValue({
          data: {
            subtotal,
            totalAmount: total,
            appliedCoupon: {
              code: `SAVE${percentage}`,
              discountPercentage: percentage,
            },
            cartItems: [{ product: { _id: '1', price: subtotal }, quantity: 1 }],
          },
          source: 'user',
        });

        const { unmount } = render(<OrderSummary />);
        
        expect(screen.getByText(`-$${savings.toFixed(2)}`)).toBeInTheDocument();
        expect(screen.getByText(`-${percentage}%`)).toBeInTheDocument();
        
        unmount();
      });
    });

    it('should handle decimal discount percentages', () => {
      mockUseUnifiedCart.mockReturnValue({
        data: {
          subtotal: 99.99,
          totalAmount: 87.49,
          appliedCoupon: {
            code: 'PRECISE',
            discountPercentage: 12.5,
          },
          cartItems: [{ product: { _id: '1', price: 99.99 }, quantity: 1 }],
        },
        source: 'user',
      });
      
      render(<OrderSummary />);
      
      expect(screen.getByText('Coupon (PRECISE)')).toBeInTheDocument();
      expect(screen.getByText('-12.5%')).toBeInTheDocument();
      expect(screen.getByText('-$12.50')).toBeInTheDocument();
      expect(screen.getByText('$87.49')).toBeInTheDocument();
    });
  });

  describe('Guest User Experience', () => {
    beforeEach(() => {
      mockUseUnifiedCart.mockReturnValue({
        data: {
          subtotal: 100,
          totalAmount: 100,
          appliedCoupon: null,
          cartItems: [
            { product: { _id: '1', price: 100 }, quantity: 1 },
          ],
        },
        source: 'guest',
      });
    });

    it('should redirect guest users to login on checkout', async () => {
      const user = userEvent.setup();
      render(<OrderSummary />);
      
      const checkoutButton = screen.getByRole('button', { name: 'Proceed to Checkout' });
      await user.click(checkoutButton);
      
      expect(toast.error).toHaveBeenCalledWith('Please login to proceed with checkout');
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    it('should display order summary for guests', () => {
      render(<OrderSummary />);
      
      expect(screen.getByText('Order summary')).toBeInTheDocument();
      expect(screen.getAllByText('$100.00')).toHaveLength(2);
      expect(screen.getByRole('button', { name: 'Proceed to Checkout' })).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large numbers', () => {
      mockUseUnifiedCart.mockReturnValue({
        data: {
          subtotal: 999999.99,
          totalAmount: 499999.99,
          appliedCoupon: {
            code: 'MEGA50',
            discountPercentage: 50,
          },
          cartItems: [{ product: { _id: '1', price: 999999.99 }, quantity: 1 }],
        },
        source: 'user',
      });
      
      render(<OrderSummary />);
      
      expect(screen.getByText('$999999.99')).toBeInTheDocument();
      expect(screen.getByText('-$500000.00')).toBeInTheDocument();
      expect(screen.getByText('$499999.99')).toBeInTheDocument();
    });

    it('should handle zero total with 100% discount', () => {
      mockUseUnifiedCart.mockReturnValue({
        data: {
          subtotal: 50,
          totalAmount: 0,
          appliedCoupon: {
            code: 'FREE100',
            discountPercentage: 100,
          },
          cartItems: [{ product: { _id: '1', price: 50 }, quantity: 1 }],
        },
        source: 'user',
      });
      
      render(<OrderSummary />);
      
      expect(screen.getByText('$50.00')).toBeInTheDocument();
      expect(screen.getByText('-$50.00')).toBeInTheDocument();
      expect(screen.getByText('$0.00')).toBeInTheDocument();
      expect(screen.getByText('-100%')).toBeInTheDocument();
    });
  });
});