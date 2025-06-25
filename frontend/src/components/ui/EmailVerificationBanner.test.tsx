import { render, screen } from '@/test/test-utils';
import { EmailVerificationBanner } from './EmailVerificationBanner';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import type { User } from '@/types';
import { createMockQueryResult } from '@/test/mocks/query-mocks';

import { trpc } from '@/lib/trpc';

const mockUser = {
  _id: '1',
  name: 'Test User',
  email: 'test@example.com',
  role: 'customer' as const,
  cartItems: [],
  emailVerified: false,
};

beforeEach(() => {
  const mockProfileQuery = createMockQueryResult<User>({
    data: mockUser,
    isLoading: false,
    isSuccess: true,
    isFetched: true,
    isFetchedAfterMount: true,
    dataUpdatedAt: Date.now(),
  });
  
  // Add the trpc property to match UseTRPCQueryResult
  const mockTRPCQuery = {
    ...mockProfileQuery,
    trpc: {
      path: 'auth.profile',
      queryKey: ['auth.profile'],
    },
  };
  
  vi.mocked(trpc.auth.profile.useQuery).mockReturnValue(mockTRPCQuery as ReturnType<typeof trpc.auth.profile.useQuery>);
});

describe('EmailVerificationBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders banner for unverified users', () => {
    render(<EmailVerificationBanner />);
    
    void expect(screen.getByText(/please verify your email address/i)).toBeInTheDocument();
    void expect(screen.getByRole('button', { name: /resend verification email/i })).toBeInTheDocument();
    void expect(screen.getByRole('button', { name: /dismiss/i })).toBeInTheDocument();
  });

  it('does not render when dismissed', () => {
    localStorage.setItem('email-verification-banner-dismissed', 'true');
    
    render(<EmailVerificationBanner />);
    
    void expect(screen.queryByText(/please verify your email address/i)).not.toBeInTheDocument();
  });

  it('dismisses banner and saves to localStorage', async () => {
    const user = userEvent.setup();
    render(<EmailVerificationBanner />);
    
    const dismissButton = screen.getByRole('button', { name: /dismiss/i });
    await user.click(dismissButton);
    
    void expect(screen.queryByText(/please verify your email address/i)).not.toBeInTheDocument();
    void expect(localStorage.getItem('email-verification-banner-dismissed')).toBe('true');
  });
});