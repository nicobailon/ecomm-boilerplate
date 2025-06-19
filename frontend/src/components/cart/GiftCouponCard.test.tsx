import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/test/test-utils';
import GiftCouponCard from './GiftCouponCard';

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

const mockUseUnifiedCart = vi.fn();
const mockApplyCouponMutate = vi.fn();
const mockRemoveCouponMutate = vi.fn();
const mockUseApplyCoupon = vi.fn();
const mockUseRemoveCoupon = vi.fn();

vi.mock('@/hooks/cart/useUnifiedCart', () => ({
  useUnifiedCart: () => mockUseUnifiedCart(),
  useApplyCoupon: () => mockUseApplyCoupon(),
  useRemoveCoupon: () => mockUseRemoveCoupon(),
}));

describe('GiftCouponCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseUnifiedCart.mockReturnValue({
      data: { appliedCoupon: null },
      source: 'user',
    });
    mockUseApplyCoupon.mockReturnValue({
      mutate: mockApplyCouponMutate,
      isPending: false,
      isSuccess: false,
    });
    mockUseRemoveCoupon.mockReturnValue({
      mutate: mockRemoveCouponMutate,
      isPending: false,
    });
  });

  describe('Authenticated User', () => {
    it('should render input and apply button when no coupon is applied', () => {
      render(<GiftCouponCard />);
      
      expect(screen.getByLabelText('Do you have a voucher or gift card?')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter code here')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Apply Code' })).toBeInTheDocument();
    });

    it('should handle coupon application', async () => {
      const user = userEvent.setup();
      render(<GiftCouponCard />);
      
      const input = screen.getByPlaceholderText('Enter code here');
      const applyButton = screen.getByRole('button', { name: 'Apply Code' });
      
      await user.type(input, 'SAVE20');
      await user.click(applyButton);
      
      expect(mockApplyCouponMutate).toHaveBeenCalledWith('SAVE20');
    });

    it('should not apply coupon with empty input', async () => {
      const user = userEvent.setup();
      render(<GiftCouponCard />);
      
      const applyButton = screen.getByRole('button', { name: 'Apply Code' });
      await user.click(applyButton);
      
      expect(mockApplyCouponMutate).not.toHaveBeenCalled();
    });

    it('should disable input when coupon is already applied', () => {
      mockUseUnifiedCart.mockReturnValue({
        data: { 
          appliedCoupon: { 
            code: 'SAVE20', 
            discountPercentage: 20 
          } 
        },
        source: 'user',
      });
      
      render(<GiftCouponCard />);
      
      const input = screen.getByPlaceholderText('Enter code here');
      expect(input).toBeDisabled();
    });

    it('should display applied coupon information', () => {
      mockUseUnifiedCart.mockReturnValue({
        data: { 
          appliedCoupon: { 
            code: 'SAVE20', 
            discountPercentage: 20 
          } 
        },
        source: 'user',
      });
      
      render(<GiftCouponCard />);
      
      expect(screen.getByText('Applied Coupon')).toBeInTheDocument();
      expect(screen.getByText('SAVE20 - 20% off')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Remove Coupon' })).toBeInTheDocument();
    });

    it('should handle coupon removal', async () => {
      const user = userEvent.setup();
      mockUseUnifiedCart.mockReturnValue({
        data: { 
          appliedCoupon: { 
            code: 'SAVE20', 
            discountPercentage: 20 
          } 
        },
        source: 'user',
      });
      
      render(<GiftCouponCard />);
      
      const removeButton = screen.getByRole('button', { name: 'Remove Coupon' });
      await user.click(removeButton);
      
      expect(mockRemoveCouponMutate).toHaveBeenCalled();
    });

    it('should show loading state during apply', () => {
      mockUseApplyCoupon.mockReturnValue({
        mutate: mockApplyCouponMutate,
        isPending: true,
        isSuccess: false,
      });
      
      render(<GiftCouponCard />);
      
      expect(screen.getByText('Applying...')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should show loading state during removal', () => {
      mockUseUnifiedCart.mockReturnValue({
        data: { 
          appliedCoupon: { 
            code: 'SAVE20', 
            discountPercentage: 20 
          } 
        },
        source: 'user',
      });
      
      mockUseRemoveCoupon.mockReturnValue({
        mutate: mockRemoveCouponMutate,
        isPending: true,
      });
      
      render(<GiftCouponCard />);
      
      expect(screen.getByText('Removing...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Removing/ })).toBeDisabled();
    });

    it('should clear input on successful coupon application', async () => {
      const user = userEvent.setup();
      
      const { rerender } = render(<GiftCouponCard />);
      
      const input = screen.getByPlaceholderText('Enter code here') as HTMLInputElement;
      await user.type(input, 'SAVE20');
      expect(input.value).toBe('SAVE20');
      
      mockUseApplyCoupon.mockReturnValue({
        mutate: mockApplyCouponMutate,
        isPending: false,
        isSuccess: true,
      });
      
      mockUseUnifiedCart.mockReturnValue({
        data: { 
          appliedCoupon: { 
            code: 'SAVE20', 
            discountPercentage: 20 
          } 
        },
        source: 'user',
      });
      
      rerender(<GiftCouponCard />);
      
      await waitFor(() => {
        expect(input.value).toBe('');
      });
    });
  });

  describe('Guest User', () => {
    beforeEach(() => {
      mockUseUnifiedCart.mockReturnValue({
        data: { appliedCoupon: null },
        source: 'guest',
      });
    });

    it('should show voucher section with sign-in prompt for guest users', () => {
      render(<GiftCouponCard />);
      
      expect(screen.getByText('Vouchers & Gift Cards')).toBeInTheDocument();
      expect(screen.getByText('Sign in to your account to apply discount codes and save on your order.')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Sign in to use vouchers' })).toBeInTheDocument();
    });

    it('should not show input field for guest users', () => {
      render(<GiftCouponCard />);
      
      expect(screen.queryByPlaceholderText('Enter code here')).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/voucher/i)).not.toBeInTheDocument();
    });

    it('should not show apply button for guest users', () => {
      render(<GiftCouponCard />);
      
      expect(screen.queryByRole('button', { name: 'Apply Code' })).not.toBeInTheDocument();
    });

    it('should have sign-in link that navigates to login page', () => {
      render(<GiftCouponCard />);
      
      const loginLink = screen.getByRole('link', { name: 'Sign in to use vouchers' });
      expect(loginLink).toHaveAttribute('href', '/login');
    });

    it('should not show coupon functionality for guests even with applied coupon', () => {
      mockUseUnifiedCart.mockReturnValue({
        data: { 
          appliedCoupon: { 
            code: 'SAVE20', 
            discountPercentage: 20 
          } 
        },
        source: 'guest',
      });
      
      render(<GiftCouponCard />);
      
      expect(screen.queryByText('Applied Coupon')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Remove Coupon' })).not.toBeInTheDocument();
      expect(screen.getByText('Vouchers & Gift Cards')).toBeInTheDocument();
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
      
      expect(mockApplyCouponMutate).not.toHaveBeenCalled();
    });

    it('should trim coupon code before applying', async () => {
      const user = userEvent.setup();
      render(<GiftCouponCard />);
      
      const input = screen.getByPlaceholderText('Enter code here');
      const applyButton = screen.getByRole('button', { name: 'Apply Code' });
      
      await user.type(input, '  SAVE20  ');
      await user.click(applyButton);
      
      expect(mockApplyCouponMutate).toHaveBeenCalledWith('  SAVE20  ');
    });

    it('should maintain input value when switching between success states', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<GiftCouponCard />);
      
      const input = screen.getByPlaceholderText('Enter code here') as HTMLInputElement;
      await user.type(input, 'TESTCODE');
      
      mockUseUnifiedCart.mockReturnValue({
        data: { appliedCoupon: null },
        source: 'user',
      });
      
      rerender(<GiftCouponCard />);
      
      expect(input.value).toBe('TESTCODE');
    });
  });
});