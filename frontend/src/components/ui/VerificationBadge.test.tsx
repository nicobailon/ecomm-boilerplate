import { render, screen } from '@/test/test-utils';
import { VerificationBadge } from './VerificationBadge';

describe('VerificationBadge', () => {
  it('renders verified badge with label', () => {
    render(<VerificationBadge verified={true} showLabel={true} />);
    
    void expect(screen.getByText(/verified/i)).toBeInTheDocument();
    const badge = screen.getByText(/verified/i);
    void expect(badge).toHaveClass('text-green-500');
  });

  it('renders unverified badge with label', () => {
    render(<VerificationBadge verified={false} showLabel={true} />);
    
    void expect(screen.getByText(/unverified/i)).toBeInTheDocument();
    const badge = screen.getByText(/unverified/i);
    void expect(badge).toHaveClass('text-yellow-500');
  });

  it('renders without label by default', () => {
    render(<VerificationBadge verified={true} />);
    
    void expect(screen.queryByText(/verified/i)).not.toBeInTheDocument();
    // But icon should still be present
    void expect(screen.getByLabelText(/email verified/i)).toBeInTheDocument();
  });

  it('renders with small size', () => {
    const { container } = render(<VerificationBadge verified={true} size="sm" />);
    
    const icon = container.querySelector('svg');
    void expect(icon).toHaveClass('h-4 w-4');
  });

  it('renders with medium size by default', () => {
    const { container } = render(<VerificationBadge verified={true} />);
    
    const icon = container.querySelector('svg');
    void expect(icon).toHaveClass('h-5 w-5');
  });

  it('displays correct icon for verified status', () => {
    render(<VerificationBadge verified={true} />);
    
    void expect(screen.getByLabelText(/email verified/i)).toBeInTheDocument();
  });

  it('displays correct icon for unverified status', () => {
    render(<VerificationBadge verified={false} />);
    
    void expect(screen.getByLabelText(/email unverified/i)).toBeInTheDocument();
  });
});