import { render, screen, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import VerifyEmailPage from '@/pages/VerifyEmailPage';
import { EmailVerificationBanner } from '@/components/ui/EmailVerificationBanner';

// Mock react-router-dom
const mockNavigate = vi.fn();
const mockParams = { token: undefined as string | undefined };
const mockSearchParams = new URLSearchParams();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => mockParams,
    useSearchParams: () => [mockSearchParams],
    Link: ({ children, to, ...props }: { children: React.ReactNode; to: string; [key: string]: unknown }) => (
      <a href={to} {...props}>{children}</a>
    ),
  };
});

// Mock auth hooks
const mockVerifyEmailMutation = {
  mutateAsync: vi.fn(),
  mutate: vi.fn(),
  isLoading: false,
  isPending: false,
  isError: false,
  error: null as { message: string; code: string } | null,
  data: undefined,
  isSuccess: false,
  reset: vi.fn(),
};

const mockResendVerificationMutation = {
  mutateAsync: vi.fn(),
  mutate: vi.fn(),
  isLoading: false,
  isPending: false,
  isError: false,
  error: null,
  data: undefined,
  isSuccess: false,
  reset: vi.fn(),
};

const mockUserData = {
  _id: '1',
  name: 'Test User',
  email: 'test@example.com',
  role: 'customer' as 'customer' | 'admin',
  cartItems: [],
  emailVerified: false,
};

vi.mock('@/hooks/auth/useAuth', () => ({
  useCurrentUser: () => ({
    data: mockUserData,
    isLoading: false,
    isError: false,
    error: null,
  }),
  useVerifyEmail: () => mockVerifyEmailMutation,
  useResendVerification: () => mockResendVerificationMutation,
}));

describe('Email Verification E2E - Basic Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    mockParams.token = undefined;
    mockSearchParams.delete('token');
    localStorage.clear();
    
    // Reset mutation states
    mockVerifyEmailMutation.isSuccess = false;
    mockVerifyEmailMutation.isPending = false;
    mockVerifyEmailMutation.isError = false;
    mockVerifyEmailMutation.error = null;
    mockResendVerificationMutation.isSuccess = false;
    mockResendVerificationMutation.isPending = false;
    
    // Reset user data
    mockUserData.emailVerified = false;
    mockUserData.role = 'customer';
  });

  describe('Email Verification Page', () => {
    it('shows loading state when verifying', () => {
      mockParams.token = 'valid-token-1234567890abcdef';
      mockVerifyEmailMutation.isPending = true;
      
      render(<VerifyEmailPage />);

      void expect(screen.getByText(/verifying your email.../i)).toBeInTheDocument();
      void expect(screen.getByText(/please wait while we verify your email address/i)).toBeInTheDocument();
    });

    it('shows error for missing token', () => {
      mockParams.token = undefined;
      
      render(<VerifyEmailPage />);

      void expect(screen.getByRole('heading', { name: /verification failed/i })).toBeInTheDocument();
      void expect(screen.getByText(/no verification token provided/i)).toBeInTheDocument();
      void expect(screen.getByText(/go to login/i)).toBeInTheDocument();
    });

    it('shows success message when verification succeeds', async () => {
      mockParams.token = 'valid-token-1234567890abcdef';
      
      // Mock immediate success
      mockVerifyEmailMutation.mutate.mockImplementation((_, options: { onSuccess?: (data: { success: boolean; user: typeof mockUserData }) => void }) => {
        void setTimeout(() => {
          mockVerifyEmailMutation.isSuccess = true;
          options?.onSuccess?.({
            success: true,
            user: { ...mockUserData, emailVerified: true },
          });
        }, 0);
      });

      const { rerender } = render(<VerifyEmailPage />);

      // Wait for success callback
      await waitFor(() => {
        rerender(<VerifyEmailPage />);
        void expect(screen.getByRole('heading', { name: /email verified/i })).toBeInTheDocument();
      });

      void expect(screen.getByText(/your email has been successfully verified/i)).toBeInTheDocument();
      void expect(screen.getByRole('button', { name: /start shopping/i })).toBeInTheDocument();
    });

    it('navigates home when continue button clicked', async () => {
      const user = userEvent.setup();
      mockParams.token = 'valid-token-1234567890abcdef';
      
      // Set success state
      mockVerifyEmailMutation.isSuccess = true;
      
      render(<VerifyEmailPage />);

      const continueButton = screen.getByRole('button', { name: /start shopping/i });
      await user.click(continueButton);

      void expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    it('shows error for invalid token', async () => {
      mockParams.token = 'invalid-token-1234567890abcdef';
      
      // Mock error
      mockVerifyEmailMutation.mutate.mockImplementation((_, options: { onError?: (error: { message: string; code: string }) => void }) => {
        void setTimeout(() => {
          mockVerifyEmailMutation.isError = true;
          mockVerifyEmailMutation.error = {
            message: 'Invalid or expired verification token',
            code: 'INVALID_TOKEN',
          };
          options?.onError?.({
            message: 'Invalid or expired verification token',
            code: 'INVALID_TOKEN',
          });
        }, 0);
      });

      const { rerender } = render(<VerifyEmailPage />);

      await waitFor(() => {
        rerender(<VerifyEmailPage />);
        void expect(screen.getByRole('heading', { name: /verification failed/i })).toBeInTheDocument();
      });

      void expect(screen.getByText(/the verification link is invalid or has expired/i)).toBeInTheDocument();
    });

    it('handles token from query parameters', async () => {
      // Set token in query params instead of route params
      mockSearchParams.set('token', 'query-token-1234567890abcdef');
      
      render(<VerifyEmailPage />);

      await waitFor(() => {
        void expect(mockVerifyEmailMutation.mutate).toHaveBeenCalledWith({
          token: 'query-token-1234567890abcdef',
        });
      });
    });

    it('prioritizes route param over query param', async () => {
      // Set both route param and query param
      mockParams.token = 'route-token-1234567890abcdef';
      mockSearchParams.set('token', 'query-token-1234567890abcdef');
      
      render(<VerifyEmailPage />);

      await waitFor(() => {
        void expect(mockVerifyEmailMutation.mutate).toHaveBeenCalledWith({
          token: 'route-token-1234567890abcdef',
        });
      });
    });

    it('shows admin-specific messaging for admin users', async () => {
      // Set user as admin
      mockUserData.role = 'admin';
      mockParams.token = 'valid-token-1234567890abcdef';

      // Mock immediate success
      mockVerifyEmailMutation.mutate.mockImplementation((_, options: { onSuccess?: (data: { success: boolean; user: typeof mockUserData }) => void }) => {
        void setTimeout(() => {
          mockVerifyEmailMutation.isSuccess = true;
          options?.onSuccess?.({
            success: true,
            user: { ...mockUserData, emailVerified: true },
          });
        }, 0);
      });

      const { rerender } = render(<VerifyEmailPage />);

      // Wait for success callback
      await waitFor(() => {
        rerender(<VerifyEmailPage />);
        void expect(screen.getByRole('heading', { name: /email verified/i })).toBeInTheDocument();
      });

      void expect(screen.getByText(/you can now access all admin features/i)).toBeInTheDocument();
      void expect(screen.getByRole('button', { name: /go to dashboard/i })).toBeInTheDocument();
    });

    it('navigates to admin dashboard when admin clicks continue button', async () => {
      const user = userEvent.setup();
      // Set user as admin
      mockUserData.role = 'admin';
      mockParams.token = 'valid-token-1234567890abcdef';

      // Set success state
      mockVerifyEmailMutation.isSuccess = true;

      render(<VerifyEmailPage />);

      const continueButton = screen.getByRole('button', { name: /go to dashboard/i });
      await user.click(continueButton);

      void expect(mockNavigate).toHaveBeenCalledWith('/secret-dashboard');
    });
  });

  describe('Email Verification Banner', () => {
    it('shows banner for unverified users', () => {
      mockUserData.emailVerified = false;
      
      render(<EmailVerificationBanner />);

      void expect(screen.getByText(/please verify your email address to access all features/i)).toBeInTheDocument();
      void expect(screen.getByRole('button', { name: /resend verification email/i })).toBeInTheDocument();
      void expect(screen.getByRole('button', { name: /dismiss email verification banner/i })).toBeInTheDocument();
    });

    it('does not show banner for verified users', () => {
      mockUserData.emailVerified = true;
      
      render(<EmailVerificationBanner />);

      void expect(screen.queryByText(/please verify your email address to access all features/i)).not.toBeInTheDocument();
    });

    it('does not show banner when previously dismissed', () => {
      localStorage.setItem('email-verification-banner-dismissed', 'true');
      mockUserData.emailVerified = false;
      
      render(<EmailVerificationBanner />);

      void expect(screen.queryByText(/please verify your email address to access all features/i)).not.toBeInTheDocument();
    });

    it('dismisses banner and saves to localStorage', async () => {
      const user = userEvent.setup();
      mockUserData.emailVerified = false;
      
      render(<EmailVerificationBanner />);

      const dismissButton = screen.getByRole('button', { name: /dismiss email verification banner/i });
      await user.click(dismissButton);

      void expect(screen.queryByText(/please verify your email address to access all features/i)).not.toBeInTheDocument();
      void expect(localStorage.getItem('email-verification-banner-dismissed')).toBe('true');
    });

    it('resends verification email', async () => {
      const user = userEvent.setup();
      mockUserData.emailVerified = false;
      
      render(<EmailVerificationBanner />);

      const resendButton = screen.getByRole('button', { name: /resend verification email/i });
      await user.click(resendButton);

      await waitFor(() => {
        void expect(mockResendVerificationMutation.mutate).toHaveBeenCalled();
      });
    });

    it('shows success message after resending', async () => {
      const user = userEvent.setup();
      mockUserData.emailVerified = false;
      
      // Mock successful resend
      mockResendVerificationMutation.mutate.mockImplementation((_, options: { onSuccess?: () => void }) => {
        // Call onSuccess callback
        options?.onSuccess?.();
      });

      render(<EmailVerificationBanner />);

      const resendButton = screen.getByRole('button', { name: /resend verification email/i });
      await user.click(resendButton);

      // The success is handled by toast notification which is outside this component
      // We can verify the cooldown started by checking the button text
      await waitFor(() => {
        void expect(screen.getByText(/resend in \d+s/i)).toBeInTheDocument();
      });
    });
  });
});