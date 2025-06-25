import { render, screen } from '@/test/test-utils';
import { LoginForm } from './LoginForm';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

// Mock the auth hooks
vi.mock('@/hooks/queries/useAuth', () => ({
  useLogin: () => ({
    mutate: vi.fn(),
    isPending: false,
  }),
}));

describe('LoginForm', () => {
  it('renders login form fields', () => {
    render(<LoginForm />);
    
    void expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    void expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    void expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('validates email field', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    // Fill in invalid email
    await user.type(emailInput, 'invalid-email');
    // Fill in password to avoid password validation error
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);
    
    // Wait for validation error to appear
    await screen.findByText(/invalid email address/i);
  });

  it('validates password field', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    // Fill in valid email
    await user.type(emailInput, 'test@example.com');
    // Fill in short password
    await user.type(passwordInput, '123');
    await user.click(submitButton);
    
    // Wait for validation error to appear
    await screen.findByText(/password must be at least 6 characters/i);
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    
    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);
    
    // Form should not show validation errors
    void expect(screen.queryByText(/invalid email address/i)).not.toBeInTheDocument();
    void expect(screen.queryByText(/password must be at least 6 characters/i)).not.toBeInTheDocument();
  });
});