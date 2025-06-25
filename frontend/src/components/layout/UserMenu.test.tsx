import { render, screen, waitFor } from '@/test/test-utils';
import { UserMenu } from './UserMenu';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { useCurrentUser, useLogout } from '@/hooks/auth/useAuth';
import type { User } from '@/types';
import { createMockMutationResult } from '@/test/mocks/query-mocks';

vi.mock('@/hooks/auth/useAuth');

describe('UserMenu', () => {
  const mockUser: User = {
    _id: '1',
    name: 'Test User',
    email: 'test@example.com',
    role: 'customer' as const,
    cartItems: [],
    emailVerified: true,
  };

  const mockLogout = createMockMutationResult({
    mutate: vi.fn(),
    isPending: false,
    isIdle: true,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useCurrentUser).mockReturnValue({ data: mockUser } as unknown as ReturnType<typeof useCurrentUser>);
    vi.mocked(useLogout).mockReturnValue(mockLogout as unknown as ReturnType<typeof useLogout>);
  });

  it('renders user menu button', () => {
    render(<UserMenu />);
    
    void expect(screen.getByRole('button', { name: /user menu/i })).toBeInTheDocument();
  });

  it('opens dropdown menu on click', async () => {
    const user = userEvent.setup();
    render(<UserMenu />);
    
    const menuButton = screen.getByRole('button', { name: /user menu/i });
    await user.click(menuButton);
    
    void expect(screen.getByText(mockUser.name)).toBeInTheDocument();
    void expect(screen.getByText(mockUser.email)).toBeInTheDocument();
  });

  it('shows verification status for verified user', async () => {
    const user = userEvent.setup();
    render(<UserMenu />);
    
    await user.click(screen.getByRole('button', { name: /user menu/i }));
    
    void expect(screen.getByText(/email verified/i)).toBeInTheDocument();
  });

  it('shows verification status for unverified user', async () => {
    const user = userEvent.setup();
    const unverifiedUser = { ...mockUser, emailVerified: false };
    vi.mocked(useCurrentUser).mockReturnValue({ data: unverifiedUser } as unknown as ReturnType<typeof useCurrentUser>);
    render(<UserMenu />);
    
    await user.click(screen.getByRole('button', { name: /user menu/i }));
    
    void expect(screen.getByText(/email not verified/i)).toBeInTheDocument();
  });

  it('shows admin dashboard link for admin users', async () => {
    const user = userEvent.setup();
    const adminUser = { ...mockUser, role: 'admin' as const };
    vi.mocked(useCurrentUser).mockReturnValue({ data: adminUser } as unknown as ReturnType<typeof useCurrentUser>);
    render(<UserMenu />);
    
    await user.click(screen.getByRole('button', { name: /user menu/i }));
    
    void expect(screen.getByRole('link', { name: /admin dashboard/i })).toBeInTheDocument();
  });

  it('does not show admin dashboard link for customer users', async () => {
    const user = userEvent.setup();
    render(<UserMenu />);
    
    await user.click(screen.getByRole('button', { name: /user menu/i }));
    
    void expect(screen.queryByRole('link', { name: /admin dashboard/i })).not.toBeInTheDocument();
  });

  it('closes dropdown when clicking outside', async () => {
    const user = userEvent.setup();
    render(
      <div>
        <UserMenu />
        <div data-testid="outside">Outside element</div>
      </div>,
    );
    
    await user.click(screen.getByRole('button', { name: /user menu/i }));
    void expect(screen.getByText(mockUser.name)).toBeInTheDocument();
    
    await user.click(screen.getByTestId('outside'));
    
    await waitFor(() => {
      void expect(screen.queryByText(mockUser.name)).not.toBeInTheDocument();
    });
  });

  it('closes dropdown when pressing Escape', async () => {
    const user = userEvent.setup();
    render(<UserMenu />);
    
    await user.click(screen.getByRole('button', { name: /user menu/i }));
    void expect(screen.getByText(mockUser.name)).toBeInTheDocument();
    
    await user.keyboard('{Escape}');
    
    await waitFor(() => {
      void expect(screen.queryByText(mockUser.name)).not.toBeInTheDocument();
    });
  });
});