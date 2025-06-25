import { render, screen, waitFor } from '@/test/test-utils';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage';

// Mock react-router-dom
const mockNavigate = vi.fn();
const mockSearchParams = new URLSearchParams();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [mockSearchParams],
    Link: ({ children, to, ...props }: React.ComponentPropsWithoutRef<'a'> & { to: string }) => (
      <a href={to} {...props}>{children}</a>
    ),
  };
});

// Mock the auth hooks
const mockForgotPasswordMutation = {
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

const mockResetPasswordMutation = {
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

vi.mock('@/hooks/auth/useAuth', () => ({
  useForgotPassword: () => mockForgotPasswordMutation,
  useResetPassword: () => mockResetPasswordMutation,
}));

describe('Password Reset E2E - Basic Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    mockSearchParams.delete('token');
    
    // Reset mutation states
    mockForgotPasswordMutation.isSuccess = false;
    mockForgotPasswordMutation.isPending = false;
    mockResetPasswordMutation.isSuccess = false;
    mockResetPasswordMutation.isPending = false;
  });

  it('renders forgot password page correctly', () => {
    render(<ForgotPasswordPage />);

    void expect(screen.getByRole('heading', { name: /reset your password/i })).toBeInTheDocument();
    void expect(screen.getByText(/enter your email address and we'll send you instructions/i)).toBeInTheDocument();
    void expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    void expect(screen.getByRole('button', { name: /send password reset instructions/i })).toBeInTheDocument();
    void expect(screen.getByText(/back to login/i)).toBeInTheDocument();
  });

  it('submits forgot password form', async () => {
    const user = userEvent.setup();
    
    render(<ForgotPasswordPage />);

    const emailInput = screen.getByLabelText(/email address/i);
    const submitButton = screen.getByRole('button', { name: /send password reset instructions/i });

    // Type valid email
    await user.type(emailInput, 'test@example.com');
    
    // Submit form
    await user.click(submitButton);

    // Verify mutation was called
    await waitFor(() => {
      void expect(mockForgotPasswordMutation.mutate).toHaveBeenCalledWith({
        email: 'test@example.com',
      });
    });
  });

  it('shows success message after submission', async () => {
    const user = userEvent.setup();
    
    // Set up mutation to simulate success
    mockForgotPasswordMutation.mutate.mockImplementation(() => {
      mockForgotPasswordMutation.isSuccess = true;
    });

    const { rerender } = render(<ForgotPasswordPage />);

    const emailInput = screen.getByLabelText(/email address/i);
    await user.type(emailInput, 'test@example.com');
    await user.click(screen.getByRole('button', { name: /send password reset instructions/i }));

    // Re-render to show success state
    rerender(<ForgotPasswordPage />);

    // Check for success message and button state
    void expect(screen.getByText(/check your email for password reset instructions/i)).toBeInTheDocument();
    void expect(screen.getByRole('button', { name: /email has been sent/i })).toBeDisabled();
  });

  it('renders reset password page with valid token', () => {
    mockSearchParams.set('token', 'valid-token');
    
    render(<ResetPasswordPage />);

    void expect(screen.getByRole('heading', { name: /create new password/i })).toBeInTheDocument();
    void expect(screen.getByText(/enter your new password below/i)).toBeInTheDocument();
    const passwordInput = screen.getByLabelText('New password');
    const confirmPasswordInput = screen.getByLabelText('Confirm new password');
    void expect(passwordInput).toBeInTheDocument();
    void expect(confirmPasswordInput).toBeInTheDocument();
    void expect(screen.getByRole('button', { name: /reset password with new password/i })).toBeInTheDocument();
  });

  it('shows error message for missing token', () => {
    mockSearchParams.delete('token');
    
    render(<ResetPasswordPage />);

    void expect(screen.getByRole('heading', { name: /invalid reset link/i })).toBeInTheDocument();
    void expect(screen.getByText(/this password reset link is invalid or has expired/i)).toBeInTheDocument();
    void expect(screen.getByText(/request new reset link/i)).toBeInTheDocument();
  });

  it('submits reset password form', async () => {
    const user = userEvent.setup();
    mockSearchParams.set('token', 'valid-token');
    
    render(<ResetPasswordPage />);

    const passwordInput = screen.getByLabelText('New password');
    const confirmPasswordInput = screen.getByLabelText('Confirm new password');
    const submitButton = screen.getByRole('button', { name: /reset password with new password/i });

    // Type passwords
    await user.type(passwordInput, 'NewSecurePassword123!');
    await user.type(confirmPasswordInput, 'NewSecurePassword123!');

    // Submit form
    await user.click(submitButton);

    // Verify mutation was called
    await waitFor(() => {
      void expect(mockResetPasswordMutation.mutate).toHaveBeenCalledWith({
        token: 'valid-token',
        password: 'NewSecurePassword123!',
      });
    });
  });

  it('shows password strength indicator', async () => {
    const user = userEvent.setup();
    mockSearchParams.set('token', 'valid-token');
    
    render(<ResetPasswordPage />);

    const passwordInput = screen.getByLabelText('New password');

    // Test different password strengths
    await user.type(passwordInput, '123');
    void expect(screen.getByText(/too short/i)).toBeInTheDocument();

    await user.clear(passwordInput);
    await user.type(passwordInput, 'weakpassword');
    void expect(screen.getByText(/fair/i)).toBeInTheDocument();

    await user.clear(passwordInput);
    await user.type(passwordInput, 'Strong123!');
    void expect(screen.getByText(/strong/i)).toBeInTheDocument();
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    mockSearchParams.set('token', 'valid-token');
    
    render(<ResetPasswordPage />);

    const passwordInput = screen.getByLabelText('New password');
    const confirmPasswordInput = screen.getByLabelText('Confirm new password');
    
    // Find toggle buttons by aria-label
    const showPasswordBtn = screen.getByRole('button', { name: 'Show password' });

    // Initially password type
    void expect(passwordInput).toHaveAttribute('type', 'password');
    void expect(confirmPasswordInput).toHaveAttribute('type', 'password');

    // Click to show password
    await user.click(showPasswordBtn);
    void expect(passwordInput).toHaveAttribute('type', 'text');
    
    // Verify button changed to hide
    void expect(screen.getByRole('button', { name: 'Hide password' })).toBeInTheDocument();

    // Click again to hide password
    await user.click(screen.getByRole('button', { name: 'Hide password' }));
    void expect(passwordInput).toHaveAttribute('type', 'password');
  });
});