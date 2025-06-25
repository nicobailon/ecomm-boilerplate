import { render, screen } from '@/test/test-utils';
import EmailVerificationSentPage from './EmailVerificationSentPage';

describe('EmailVerificationSentPage', () => {
  it('renders page content', () => {
    render(<EmailVerificationSentPage />);
    
    void expect(screen.getByText(/check your email/i)).toBeInTheDocument();
    void expect(screen.getByText(/we've sent a verification email/i)).toBeInTheDocument();
    void expect(screen.getByRole('button', { name: /resend verification email/i })).toBeInTheDocument();
    void expect(screen.getByRole('link', { name: /continue to homepage/i })).toBeInTheDocument();
  });

  it('navigates to homepage when continue button is clicked', () => {
    render(<EmailVerificationSentPage />);
    
    const continueLink = screen.getByRole('link', { name: /continue to homepage/i });
    void expect(continueLink).toHaveAttribute('href', '/');
  });

  it('displays support link', () => {
    render(<EmailVerificationSentPage />);
    
    const supportLink = screen.getByRole('link', { name: /contact support/i });
    void expect(supportLink).toHaveAttribute('href', '/support');
  });
});