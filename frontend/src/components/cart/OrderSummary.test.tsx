import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/test/test-utils';
import OrderSummary from './OrderSummary';
import { toast } from 'sonner';
import { useUnifiedCart } from '@/hooks/cart/useUnifiedCart';
import type { Product } from '@/types';

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

vi.mock('@/hooks/cart/useUnifiedCart');
const mockUseUnifiedCart = vi.mocked(useUnifiedCart);

const createMockProduct = (overrides?: Partial<Product>): Product => ({
  _id: '1',
  name: 'Test Product',
  description: 'Test description',
  price: 100,
  image: 'test.jpg',
  isFeatured: false,
  inventory: 10,
  sku: 'TEST-SKU',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

const createMockCartData = (overrides?: Partial<ReturnType<typeof useUnifiedCart>>): ReturnType<typeof useUnifiedCart> => ({
  data: {
    appliedCoupon: null,
    cartItems: [],
    subtotal: 0,
    totalAmount: 0,
  },
  source: 'user' as const,
  totalQuantity: 0,
  isLoading: false,
  isError: false,
  error: null,
  ...overrides,
});

describe('OrderSummary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const mockCartData = createMockCartData({
      data: {
        subtotal: 100,
        totalAmount: 100,
        appliedCoupon: null,
        cartItems: [
          { 
            product: createMockProduct(), 
            quantity: 1, 
          },
        ],
      },
      totalQuantity: 1,
    });
    
    mockUseUnifiedCart.mockReturnValue(mockCartData);
  });

  describe('Basic Display', () => {
    it('should render order summary with correct totals', () => {
      render(<OrderSummary />);
      
      void expect(screen.getByText('Order summary')).toBeInTheDocument();
      void expect(screen.getByText('Original price')).toBeInTheDocument();
      void expect(screen.getAllByText('$100.00')).toHaveLength(2); // Original price and Total
      void expect(screen.getByText('Total')).toBeInTheDocument();
      void expect(screen.getByRole('button', { name: 'Proceed to Checkout' })).toBeInTheDocument();
    });

    it('should show continue shopping link', () => {
      render(<OrderSummary />);
      
      const continueLink = screen.getByRole('link', { name: /Continue Shopping/i });
      void expect(continueLink).toHaveAttribute('href', '/');
    });

    it('should handle empty cart', () => {
      mockUseUnifiedCart.mockReturnValue(createMockCartData({
        data: {
          subtotal: 0,
          totalAmount: 0,
          appliedCoupon: null,
          cartItems: [],
        },
      }));
      
      render(<OrderSummary />);
      
      const checkoutButton = screen.getByRole('button', { name: 'Proceed to Checkout' });
      void expect(checkoutButton).toBeDisabled();
    });
  });

  describe('Discount Display', () => {
    it('should display savings when coupon is applied', () => {
      mockUseUnifiedCart.mockReturnValue(createMockCartData({
        data: {
          subtotal: 100,
          totalAmount: 80,
          appliedCoupon: {
            code: 'SAVE20',
            discountPercentage: 20,
          },
          cartItems: [
            { product: createMockProduct({ price: 100 }), quantity: 1 },
          ],
        },
        totalQuantity: 1,
      }));
      
      render(<OrderSummary />);
      
      void expect(screen.getByText('Savings')).toBeInTheDocument();
      void expect(screen.getByText('-$20.00')).toBeInTheDocument();
      void expect(screen.getByText('Coupon (SAVE20)')).toBeInTheDocument();
      void expect(screen.getByText('-20%')).toBeInTheDocument();
      void expect(screen.getByText('$80.00')).toBeInTheDocument();
    });

    it('should not show savings section when no discount', () => {
      render(<OrderSummary />);
      
      void expect(screen.queryByText('Savings')).not.toBeInTheDocument();
      void expect(screen.queryByText(/Coupon/)).not.toBeInTheDocument();
    });

    it('should calculate correct savings for different percentages', () => {
      const testCases = [
        { percentage: 10, subtotal: 100, total: 90, savings: 10 },
        { percentage: 25, subtotal: 200, total: 150, savings: 50 },
        { percentage: 50, subtotal: 80, total: 40, savings: 40 },
        { percentage: 100, subtotal: 100, total: 0, savings: 100 },
      ];

      testCases.forEach(({ percentage, subtotal, total, savings }) => {
        mockUseUnifiedCart.mockReturnValue(createMockCartData({
          data: {
            subtotal,
            totalAmount: total,
            appliedCoupon: {
              code: `SAVE${percentage}`,
              discountPercentage: percentage,
            },
            cartItems: [{ product: createMockProduct({ _id: '1', price: subtotal }), quantity: 1 }],
          },
          totalQuantity: 1,
        }));

        const { unmount } = render(<OrderSummary />);
        
        void expect(screen.getByText(`-$${savings.toFixed(2)}`)).toBeInTheDocument();
        void expect(screen.getByText(`-${percentage}%`)).toBeInTheDocument();
        
        unmount();
      });
    });

    it('should handle decimal discount percentages', () => {
      mockUseUnifiedCart.mockReturnValue(createMockCartData({
        data: {
          subtotal: 99.99,
          totalAmount: 87.49,
          appliedCoupon: {
            code: 'PRECISE',
            discountPercentage: 12.5,
          },
          cartItems: [{ product: createMockProduct({ price: 99.99 }), quantity: 1 }],
        },
        totalQuantity: 1,
      }));
      
      render(<OrderSummary />);
      
      expect(screen.getByText('Coupon (PRECISE)')).toBeInTheDocument();
      expect(screen.getByText('-12.5%')).toBeInTheDocument();
      expect(screen.getByText('-$12.50')).toBeInTheDocument();
      expect(screen.getByText('$87.49')).toBeInTheDocument();
    });
  });

  describe('Guest User Experience', () => {
    beforeEach(() => {
      mockUseUnifiedCart.mockReturnValue(createMockCartData({
        data: {
          subtotal: 100,
          totalAmount: 100,
          appliedCoupon: null,
          cartItems: [
            { product: createMockProduct({ price: 100 }), quantity: 1 },
          ],
        },
        source: 'guest',
        totalQuantity: 1,
      }));
    });

    it('should redirect guest users to login on checkout', async () => {
      const user = userEvent.setup();
      render(<OrderSummary />);
      
      const checkoutButton = screen.getByRole('button', { name: 'Proceed to Checkout' });
      await user.click(checkoutButton);
      
      void expect(toast.error).toHaveBeenCalledWith('Please login to proceed with checkout');
      void expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    it('should display order summary for guests', () => {
      render(<OrderSummary />);
      
      void expect(screen.getByText('Order summary')).toBeInTheDocument();
      void expect(screen.getAllByText('$100.00')).toHaveLength(2);
      void expect(screen.getByRole('button', { name: 'Proceed to Checkout' })).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large numbers', () => {
      mockUseUnifiedCart.mockReturnValue(createMockCartData({
        data: {
          subtotal: 999999.99,
          totalAmount: 499999.99,
          appliedCoupon: {
            code: 'MEGA50',
            discountPercentage: 50,
          },
          cartItems: [{ product: createMockProduct({ price: 999999.99 }), quantity: 1 }],
        },
        totalQuantity: 1,
      }));
      
      render(<OrderSummary />);
      
      void expect(screen.getByText('$999999.99')).toBeInTheDocument();
      void expect(screen.getByText('-$500000.00')).toBeInTheDocument();
      void expect(screen.getByText('$499999.99')).toBeInTheDocument();
    });

    it('should handle zero total with 100% discount', () => {
      mockUseUnifiedCart.mockReturnValue(createMockCartData({
        data: {
          subtotal: 50,
          totalAmount: 0,
          appliedCoupon: {
            code: 'FREE100',
            discountPercentage: 100,
          },
          cartItems: [{ product: createMockProduct({ price: 50 }), quantity: 1 }],
        },
        totalQuantity: 1,
      }));
      
      render(<OrderSummary />);
      
      void expect(screen.getByText('$50.00')).toBeInTheDocument();
      void expect(screen.getByText('-$50.00')).toBeInTheDocument();
      void expect(screen.getByText('$0.00')).toBeInTheDocument();
      void expect(screen.getByText('-100%')).toBeInTheDocument();
    });
  });
});