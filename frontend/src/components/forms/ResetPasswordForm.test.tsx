import { render, screen } from '@/test/test-utils';
import { ResetPasswordForm } from './ResetPasswordForm';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

describe('ResetPasswordForm', () => {
  const defaultProps = {
    token: 'test-token-123',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form fields', () => {
    render(<ResetPasswordForm {...defaultProps} />);
    
    void expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
    void expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    void expect(screen.getByRole('button', { name: /reset password/i })).toBeInTheDocument();
  });

  it('shows password strength indicator', async () => {
    const user = userEvent.setup();
    render(<ResetPasswordForm {...defaultProps} />);
    
    const passwordInput = screen.getByLabelText(/^password/i);
    
    await user.type(passwordInput, '123');
    void expect(screen.getByText(/too short/i)).toBeInTheDocument();
    
    await user.clear(passwordInput);
    await user.type(passwordInput, 'password');
    void expect(screen.getByText(/weak/i)).toBeInTheDocument();
    
    await user.clear(passwordInput);
    await user.type(passwordInput, 'password123');
    void expect(screen.getByText(/fair/i)).toBeInTheDocument();
    
    await user.clear(passwordInput);
    await user.type(passwordInput, 'Password123');
    void expect(screen.getByText(/strong/i)).toBeInTheDocument();
  });

  it('toggles password visibility', async () => {
    const user = userEvent.setup();
    render(<ResetPasswordForm {...defaultProps} />);
    
    const passwordInput = screen.getByLabelText(/^password/i);
    const toggleButton = screen.getByLabelText(/toggle password visibility/i);
    
    void expect(passwordInput).toHaveAttribute('type', 'password');
    
    await user.click(toggleButton);
    void expect(passwordInput).toHaveAttribute('type', 'text');
    
    await user.click(toggleButton);
    void expect(passwordInput).toHaveAttribute('type', 'password');
  });

  it('validates password length', async () => {
    const user = userEvent.setup();
    render(<ResetPasswordForm {...defaultProps} />);
    
    const passwordInput = screen.getByLabelText(/^password/i);
    const confirmInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /reset password/i });
    
    await user.type(passwordInput, '123');
    await user.type(confirmInput, '123');
    await user.click(submitButton);
    
    await screen.findByText(/password must be at least 6 characters/i);
  });

  it('validates password confirmation match', async () => {
    const user = userEvent.setup();
    render(<ResetPasswordForm {...defaultProps} />);
    
    const passwordInput = screen.getByLabelText(/^password/i);
    const confirmInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /reset password/i });
    
    await user.type(passwordInput, 'password123');
    await user.type(confirmInput, 'different123');
    await user.click(submitButton);
    
    await screen.findByText(/passwords don't match/i);
  });
});