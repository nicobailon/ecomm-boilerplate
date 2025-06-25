import { render, screen } from '@/test/test-utils';
import { Input } from './Input';

describe('Input Component', () => {
  it('renders input with label', () => {
    render(<Input label="Email" name="email" />);
    
    void expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    void expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('displays error message when provided', () => {
    render(<Input label="Email" name="email" error="Email is required" />);
    
    void expect(screen.getByText('Email is required')).toBeInTheDocument();
    void expect(screen.getByLabelText(/email/i)).toHaveClass('border-destructive');
  });

  it('applies correct type attribute', () => {
    render(<Input type="password" label="Password" name="password" />);
    
    void expect(screen.getByLabelText(/password/i)).toHaveAttribute('type', 'password');
  });

  it('forwards ref correctly', () => {
    const ref = { current: null };
    render(<Input ref={ref} label="Test" name="test" />);
    
    void expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });
});