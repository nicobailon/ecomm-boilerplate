import { render, screen } from '@/test/test-utils';
import VerifyEmailPage from './VerifyEmailPage';
import { vi } from 'vitest';

// Mock react-router-dom
const mockNavigate = vi.fn();
const mockParams = { token: 'test-token-123' };
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
const mockVerifyEmail = {
  mutate: vi.fn(),
  isPending: true,
  isSuccess: false,
  error: null as Error | null,
};

vi.mock('@/hooks/auth/useAuth', () => ({
  useVerifyEmail: () => mockVerifyEmail,
}));

describe('VerifyEmailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows verifying state initially', () => {
    render(<VerifyEmailPage />);
    
    void expect(screen.getByText(/verifying your email.../i)).toBeInTheDocument();
    void expect(screen.getByText(/please wait.../i)).toBeInTheDocument();
  });
});