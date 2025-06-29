import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import EmailVerifiedSuccess from '../EmailVerifiedSuccess';

describe('EmailVerifiedSuccess', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Role-based content', () => {
    it('renders customer-specific content', () => {
      render(
        <EmailVerifiedSuccess
          role="customer"
          onCountdownFinish={() => {}}
          showCountdown={false}
        />
      );

      expect(screen.getByText('Email Verified!')).toBeInTheDocument();
      expect(screen.getByText('Your email has been successfully verified. You can now enjoy the full shopping experience.')).toBeInTheDocument();
      expect(screen.getByText('Start Shopping')).toBeInTheDocument();
    });

    it('renders admin-specific content', () => {
      render(
        <EmailVerifiedSuccess
          role="admin"
          onCountdownFinish={() => {}}
          showCountdown={false}
        />
      );

      expect(screen.getByText('Email Verified!')).toBeInTheDocument();
      expect(screen.getByText('Your email has been successfully verified. You can now access all admin features.')).toBeInTheDocument();
      expect(screen.getByText('Go to Dashboard')).toBeInTheDocument();
    });
  });

  describe('Countdown functionality', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it('shows countdown when enabled', () => {
      vi.useFakeTimers();
      
      const { rerender } = render(
        <EmailVerifiedSuccess
          role="customer"
          onCountdownFinish={() => {}}
          showCountdown={true}
          countdownSeconds={3}
        />
      );

      expect(screen.getByText('Redirecting in 3 seconds...')).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(1000);
      });
      
      rerender(
        <EmailVerifiedSuccess
          role="customer"
          onCountdownFinish={() => {}}
          showCountdown={true}
          countdownSeconds={3}
        />
      );
      
      expect(screen.getByText('Redirecting in 2 seconds...')).toBeInTheDocument();
    });

    it('calls onCountdownFinish when countdown reaches 0', () => {
      vi.useFakeTimers();
      const mockOnCountdownFinish = vi.fn();
      
      render(
        <EmailVerifiedSuccess
          role="customer"
          onCountdownFinish={mockOnCountdownFinish}
          showCountdown={true}
          countdownSeconds={1}
        />
      );

      expect(mockOnCountdownFinish).not.toHaveBeenCalled();

      // Advance to 0
      act(() => {
        vi.runAllTimers();
      });
      
      expect(mockOnCountdownFinish).toHaveBeenCalledTimes(1);
    });

    it('does not show countdown when disabled', () => {
      render(
        <EmailVerifiedSuccess
          role="customer"
          onCountdownFinish={() => {}}
          showCountdown={false}
        />
      );

      expect(screen.queryByText(/Redirecting in/)).not.toBeInTheDocument();
    });
  });

  describe('Button interactions', () => {
    it('calls onCountdownFinish when button is clicked', async () => {
      const mockOnCountdownFinish = vi.fn();
      
      render(
        <EmailVerifiedSuccess
          role="customer"
          onCountdownFinish={mockOnCountdownFinish}
          showCountdown={false}
        />
      );

      const button = screen.getByText('Start Shopping');
      
      await act(async () => {
        await userEvent.click(button);
      });

      expect(mockOnCountdownFinish).toHaveBeenCalledTimes(1);
    });

    it('navigates directly when no callback provided', async () => {
      // Save original location
      const originalLocation = window.location;
      
      // Mock window.location
      Object.defineProperty(window, 'location', {
        value: { ...originalLocation, href: '' },
        writable: true,
        configurable: true,
      });
      
      render(
        <EmailVerifiedSuccess
          role="admin"
          showCountdown={false}
        />
      );

      const button = screen.getByText('Go to Dashboard');
      
      await act(async () => {
        await userEvent.click(button);
      });

      expect(window.location.href).toBe('/secret-dashboard');
      
      // Restore original location
      Object.defineProperty(window, 'location', {
        value: originalLocation,
        writable: true,
        configurable: true,
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', () => {
      render(
        <EmailVerifiedSuccess
          role="customer"
          onCountdownFinish={() => {}}
          showCountdown={false}
        />
      );

      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toHaveTextContent('Email Verified!');
    });

    it('button has appropriate accessibility attributes', () => {
      render(
        <EmailVerifiedSuccess
          role="customer"
          onCountdownFinish={() => {}}
          showCountdown={false}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Start Shopping');
    });
  });
});