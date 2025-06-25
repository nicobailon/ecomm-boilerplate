import { render, screen, waitFor } from '@/test/test-utils';
import { ForgotPasswordForm } from './ForgotPasswordForm';
import userEvent from '@testing-library/user-event';

describe('ForgotPasswordForm', () => {
  it('renders form fields', () => {
    render(<ForgotPasswordForm />);
    
    void expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    void expect(screen.getByRole('button', { name: /send reset instructions/i })).toBeInTheDocument();
  });

  it('validates email field', async () => {
    const user = userEvent.setup();
    render(<ForgotPasswordForm />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole('button', { name: /send reset instructions/i });
    
    await user.type(emailInput, 'invalid-email');
    await user.click(submitButton);
    
    await screen.findByText(/invalid email address/i);
  });

  it('submits form with valid email', async () => {
    const user = userEvent.setup();
    render(<ForgotPasswordForm />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole('button', { name: /send reset instructions/i });
    
    await user.type(emailInput, 'test@example.com');
    await user.click(submitButton);
    
    // Just verify the form was submitted without errors
    await waitFor(() => {
      void expect(screen.queryByText(/invalid email address/i)).not.toBeInTheDocument();
    });
  });
});