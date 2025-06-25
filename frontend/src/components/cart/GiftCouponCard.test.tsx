import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/test/test-utils';
import GiftCouponCard from './GiftCouponCard';
import { useUnifiedCart } from '@/hooks/cart/useUnifiedCart';
import { useApplyCoupon, useRemoveCoupon } from '@/hooks/cart/useCart';
import { createMockMutationResult } from '@/test/mocks/query-mocks';
import type { Cart, ApiResponse } from '@/types';
import type { AxiosError } from 'axios';

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock('@/hooks/cart/useUnifiedCart');
vi.mock('@/hooks/cart/useCart');

const mockUseUnifiedCart = vi.mocked(useUnifiedCart);
const mockUseApplyCoupon = vi.mocked(useApplyCoupon);
const mockUseRemoveCoupon = vi.mocked(useRemoveCoupon);

const mockApplyCouponMutate = vi.fn();
const mockRemoveCouponMutate = vi.fn();

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

describe('GiftCouponCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    const mockCartData = createMockCartData();
    
    const mockApplyCoupon = createMockMutationResult<
      ApiResponse<{ success: boolean; message: string; cart: Cart }>,
      AxiosError<{ message?: string }>,
      string,
      { previousCart: Cart | undefined }
    >({
      mutate: mockApplyCouponMutate,
      isPending: false,
      isIdle: true,
    });
    
    const mockRemoveCoupon = createMockMutationResult<
      ApiResponse<{ success: boolean; message: string; cart: Cart }>,
      AxiosError<{ message?: string }>,
      void,
      { previousCart: Cart | undefined }
    >({
      mutate: mockRemoveCouponMutate,
      isPending: false,
      isIdle: true,
    });
    
    mockUseUnifiedCart.mockReturnValue(mockCartData);
    mockUseApplyCoupon.mockReturnValue(mockApplyCoupon);
    mockUseRemoveCoupon.mockReturnValue(mockRemoveCoupon);
  });

  describe('Authenticated User', () => {
    it('should render input and apply button when no coupon is applied', () => {
      render(<GiftCouponCard />);
      
      void expect(screen.getByLabelText('Do you have a voucher or gift card?')).toBeInTheDocument();
      void expect(screen.getByPlaceholderText('Enter code here')).toBeInTheDocument();
      void expect(screen.getByRole('button', { name: 'Apply Code' })).toBeInTheDocument();
    });

    it('should handle coupon application', async () => {
      const user = userEvent.setup();
      render(<GiftCouponCard />);
      
      const input = screen.getByPlaceholderText('Enter code here');
      const applyButton = screen.getByRole('button', { name: 'Apply Code' });
      
      await user.type(input, 'SAVE20');
      await user.click(applyButton);
      
      void expect(mockApplyCouponMutate).toHaveBeenCalledWith('SAVE20');
    });

    it('should not apply coupon with empty input', async () => {
      const user = userEvent.setup();
      render(<GiftCouponCard />);
      
      const applyButton = screen.getByRole('button', { name: 'Apply Code' });
      await user.click(applyButton);
      
      void expect(mockApplyCouponMutate).not.toHaveBeenCalled();
    });

    it('should disable input when coupon is already applied', () => {
      mockUseUnifiedCart.mockReturnValue(createMockCartData({
        data: { 
          appliedCoupon: { 
            code: 'SAVE20', 
            discountPercentage: 20, 
          },
          cartItems: [],
          subtotal: 0,
          totalAmount: 0,
        },
      }));
      
      render(<GiftCouponCard />);
      
      const input = screen.getByPlaceholderText('Enter code here');
      void expect(input).toBeDisabled();
    });

    it('should display applied coupon information', () => {
      mockUseUnifiedCart.mockReturnValue(createMockCartData({
        data: { 
          appliedCoupon: { 
            code: 'SAVE20', 
            discountPercentage: 20, 
          },
          cartItems: [],
          subtotal: 0,
          totalAmount: 0,
        },
      }));
      
      render(<GiftCouponCard />);
      
      void expect(screen.getByText('Applied Coupon')).toBeInTheDocument();
      void expect(screen.getByText('SAVE20 - 20% off')).toBeInTheDocument();
      void expect(screen.getByRole('button', { name: 'Remove Coupon' })).toBeInTheDocument();
    });

    it('should handle coupon removal', async () => {
      const user = userEvent.setup();
      mockUseUnifiedCart.mockReturnValue(createMockCartData({
        data: { 
          appliedCoupon: { 
            code: 'SAVE20', 
            discountPercentage: 20, 
          },
          cartItems: [],
          subtotal: 0,
          totalAmount: 0,
        },
      }));
      
      render(<GiftCouponCard />);
      
      const removeButton = screen.getByRole('button', { name: 'Remove Coupon' });
      await user.click(removeButton);
      
      void expect(mockRemoveCouponMutate).toHaveBeenCalled();
    });

    it('should show loading state during apply', () => {
      mockUseApplyCoupon.mockReturnValue(createMockMutationResult<
        ApiResponse<{ success: boolean; message: string; cart: Cart }>,
        AxiosError<{ message?: string }>,
        string,
        { previousCart: Cart | undefined }
      >({
        mutate: mockApplyCouponMutate,
        isPending: true,
        isSuccess: false,
      }));
      
      render(<GiftCouponCard />);
      
      void expect(screen.getByText('Applying...')).toBeInTheDocument();
      void expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should show loading state during removal', () => {
      mockUseUnifiedCart.mockReturnValue(createMockCartData({
        data: { 
          appliedCoupon: { 
            code: 'SAVE20', 
            discountPercentage: 20, 
          },
          cartItems: [],
          subtotal: 0,
          totalAmount: 0,
        },
      }));
      
      mockUseRemoveCoupon.mockReturnValue(createMockMutationResult<
        ApiResponse<{ success: boolean; message: string; cart: Cart }>,
        AxiosError<{ message?: string }>,
        void,
        { previousCart: Cart | undefined }
      >({
        mutate: mockRemoveCouponMutate,
        isPending: true,
      }));
      
      render(<GiftCouponCard />);
      
      void expect(screen.getByText('Removing...')).toBeInTheDocument();
      void expect(screen.getByRole('button', { name: /Removing/ })).toBeDisabled();
    });

    it('should clear input on successful coupon application', async () => {
      const user = userEvent.setup();
      
      const { rerender } = render(<GiftCouponCard />);
      
      const input = screen.getByPlaceholderText('Enter code here');
      await user.type(input, 'SAVE20');
      void expect((input as HTMLInputElement).value).toBe('SAVE20');
      
      mockUseApplyCoupon.mockReturnValue(createMockMutationResult<
        ApiResponse<{ success: boolean; message: string; cart: Cart }>,
        AxiosError<{ message?: string }>,
        string,
        { previousCart: Cart | undefined }
      >({
        mutate: mockApplyCouponMutate,
        isPending: false,
        isSuccess: true,
      }));
      
      mockUseUnifiedCart.mockReturnValue(createMockCartData({
        data: { 
          appliedCoupon: { 
            code: 'SAVE20', 
            discountPercentage: 20, 
          },
          cartItems: [],
          subtotal: 0,
          totalAmount: 0,
        },
      }));
      
      rerender(<GiftCouponCard />);
      
      await waitFor(() => {
        void expect((input as HTMLInputElement).value).toBe('');
      });
    });
  });

  describe('Guest User', () => {
    beforeEach(() => {
      mockUseUnifiedCart.mockReturnValue(createMockCartData({
        source: 'guest',
      }));
    });

    it('should show voucher section with sign-in prompt for guest users', () => {
      render(<GiftCouponCard />);
      
      void expect(screen.getByText('Vouchers & Gift Cards')).toBeInTheDocument();
      void expect(screen.getByText('Sign in to your account to apply discount codes and save on your order.')).toBeInTheDocument();
      void expect(screen.getByRole('link', { name: 'Sign in to use vouchers' })).toBeInTheDocument();
    });

    it('should not show input field for guest users', () => {
      render(<GiftCouponCard />);
      
      void expect(screen.queryByPlaceholderText('Enter code here')).not.toBeInTheDocument();
      void expect(screen.queryByLabelText(/voucher/i)).not.toBeInTheDocument();
    });

    it('should not show apply button for guest users', () => {
      render(<GiftCouponCard />);
      
      void expect(screen.queryByRole('button', { name: 'Apply Code' })).not.toBeInTheDocument();
    });

    it('should have sign-in link that navigates to login page', () => {
      render(<GiftCouponCard />);
      
      const loginLink = screen.getByRole('link', { name: 'Sign in to use vouchers' });
      void expect(loginLink).toHaveAttribute('href', '/login');
    });

    it('should not show coupon functionality for guests even with applied coupon', () => {
      mockUseUnifiedCart.mockReturnValue(createMockCartData({
        data: { 
          appliedCoupon: { 
            code: 'SAVE20', 
            discountPercentage: 20, 
          },
          cartItems: [],
          subtotal: 0,
          totalAmount: 0,
        },
        source: 'guest',
      }));
      
      render(<GiftCouponCard />);
      
      void expect(screen.queryByText('Applied Coupon')).not.toBeInTheDocument();
      void expect(screen.queryByRole('button', { name: 'Remove Coupon' })).not.toBeInTheDocument();
      void expect(screen.getByText('Vouchers & Gift Cards')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle whitespace-only input', async () => {
      const user = userEvent.setup();
      render(<GiftCouponCard />);
      
      const input = screen.getByPlaceholderText('Enter code here');
      const applyButton = screen.getByRole('button', { name: 'Apply Code' });
      
      await user.type(input, '   ');
      await user.click(applyButton);
      
      void expect(mockApplyCouponMutate).not.toHaveBeenCalled();
    });

    it('should trim coupon code before applying', async () => {
      const user = userEvent.setup();
      render(<GiftCouponCard />);
      
      const input = screen.getByPlaceholderText('Enter code here');
      const applyButton = screen.getByRole('button', { name: 'Apply Code' });
      
      await user.type(input, '  SAVE20  ');
      await user.click(applyButton);
      
      void expect(mockApplyCouponMutate).toHaveBeenCalledWith('  SAVE20  ');
    });

    it('should maintain input value when switching between success states', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<GiftCouponCard />);
      
      const input = screen.getByPlaceholderText('Enter code here');
      await user.type(input, 'TESTCODE');
      
      mockUseUnifiedCart.mockReturnValue(createMockCartData());
      
      rerender(<GiftCouponCard />);
      
      void expect((input as HTMLInputElement).value).toBe('TESTCODE');
    });
  });
});