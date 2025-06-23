import type { Meta, StoryObj } from '@storybook/react-vite';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { LoginForm } from './LoginForm';
import { userEvent, within, expect, waitFor } from '@storybook/test';
import { trpc } from '@/lib/trpc';
import { createTRPCClient } from '@/lib/trpc-client';
import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Toaster, toast } from 'sonner';
import { AlertCircle, RefreshCw, Lock, AlertTriangle, Wifi, WifiOff } from 'lucide-react';

const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const meta = {
  title: 'Forms/LoginForm',
  component: LoginForm,
  decorators: [
    (Story) => {
      const queryClient = createQueryClient();
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              <div className="max-w-md mx-auto p-4">
                <Story />
              </div>
            </BrowserRouter>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof LoginForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithValidationErrors: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Submit empty form to trigger validation errors
    const submitButton = canvas.getByRole('button', { name: /sign in/i });
    await userEvent.click(submitButton);
    
    // Wait for and verify validation errors appear
    await expect(canvas.getByText(/invalid email address/i)).toBeInTheDocument();
    await expect(canvas.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
  },
};

export const LoadingState: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Shows the form in a loading state. In real usage, this occurs while the login request is being processed.',
      },
    },
  },
};

export const WithError: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Shows the form with an error message. This typically appears when login credentials are invalid.',
      },
    },
  },
};

export const FilledForm: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Fill in the form
    const emailInput = canvas.getByLabelText(/email/i);
    const passwordInput = canvas.getByLabelText(/password/i);
    
    await userEvent.type(emailInput, 'user@example.com');
    await userEvent.type(passwordInput, 'password123');
  },
};

export const ValidationFlow: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Try invalid email
    const emailInput = canvas.getByLabelText(/email/i);
    await userEvent.type(emailInput, 'notanemail');
    await userEvent.tab();
    
    // Try short password
    const passwordInput = canvas.getByLabelText(/password/i);
    await userEvent.type(passwordInput, '123');
    await userEvent.tab();
    
    // Submit to see all errors
    const submitButton = canvas.getByRole('button', { name: /sign in/i });
    await userEvent.click(submitButton);
  },
};

export const SuccessFlow: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Fill in valid credentials
    const emailInput = canvas.getByLabelText(/email/i);
    const passwordInput = canvas.getByLabelText(/password/i);
    
    await userEvent.type(emailInput, 'john@example.com');
    await userEvent.type(passwordInput, 'password123');
    
    // Submit form
    const submitButton = canvas.getByRole('button', { name: /sign in/i });
    await userEvent.click(submitButton);
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates filling and submitting the form with valid credentials. In a real scenario, this would trigger a login request.',
      },
    },
  },
};

export const FullLoginFlow: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Initial state - form should be empty
    const emailInput = canvas.getByLabelText(/email/i) as HTMLInputElement;
    const passwordInput = canvas.getByLabelText(/password/i) as HTMLInputElement;
    expect(emailInput.value).toBe('');
    expect(passwordInput.value).toBe('');
    
    // Try to submit empty form
    const submitButton = canvas.getByRole('button', { name: /sign in/i });
    await userEvent.click(submitButton);
    
    // Should show validation errors
    await waitFor(() => {
      expect(canvas.getByText(/invalid email address/i)).toBeInTheDocument();
      expect(canvas.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
    });
    
    // Fix email but not password
    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.tab();
    
    // Email error should be gone
    await waitFor(() => {
      expect(canvas.queryByText(/invalid email address/i)).not.toBeInTheDocument();
      expect(canvas.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
    });
    
    // Add password
    await userEvent.type(passwordInput, 'securepassword123');
    
    // All errors should be gone
    await waitFor(() => {
      expect(canvas.queryByText(/invalid email address/i)).not.toBeInTheDocument();
      expect(canvas.queryByText(/password must be at least 6 characters/i)).not.toBeInTheDocument();
    });
    
    // Submit valid form
    await userEvent.click(submitButton);
    
    // Check button shows loading state
    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });
  },
};

export const KeyboardNavigation: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Focus should start on email field
    const emailInput = canvas.getByLabelText(/email/i);
    await userEvent.click(emailInput);
    expect(document.activeElement).toBe(emailInput);
    
    // Tab to password field
    await userEvent.tab();
    const passwordInput = canvas.getByLabelText(/password/i);
    expect(document.activeElement).toBe(passwordInput);
    
    // Tab to submit button
    await userEvent.tab();
    const submitButton = canvas.getByRole('button', { name: /sign in/i });
    expect(document.activeElement).toBe(submitButton);
    
    // Enter key should submit when button is focused
    await userEvent.keyboard('{Enter}');
    
    // Should trigger validation since form is empty
    await waitFor(() => {
      expect(canvas.getByText(/invalid email address/i)).toBeInTheDocument();
    });
  },
};

export const EmailValidationFlow: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const emailInput = canvas.getByLabelText(/email/i);
    
    // Test various invalid email formats
    const invalidEmails = [
      'notanemail',
      'missing@domain',
      '@nodomain.com',
      'spaces in@email.com',
      'double@@domain.com',
    ];
    
    for (const invalidEmail of invalidEmails) {
      await userEvent.clear(emailInput);
      await userEvent.type(emailInput, invalidEmail);
      await userEvent.tab();
      
      await waitFor(() => {
        expect(canvas.getByText(/invalid email address/i)).toBeInTheDocument();
      });
    }
    
    // Test valid email
    await userEvent.clear(emailInput);
    await userEvent.type(emailInput, 'valid.email@example.com');
    await userEvent.tab();
    
    await waitFor(() => {
      expect(canvas.queryByText(/invalid email address/i)).not.toBeInTheDocument();
    });
  },
};

export const PasswordValidationFlow: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const passwordInput = canvas.getByLabelText(/password/i);
    
    // Test too short password
    await userEvent.type(passwordInput, '12345');
    await userEvent.tab();
    
    await waitFor(() => {
      expect(canvas.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
    });
    
    // Test exactly 6 characters
    await userEvent.clear(passwordInput);
    await userEvent.type(passwordInput, '123456');
    await userEvent.tab();
    
    await waitFor(() => {
      expect(canvas.queryByText(/password must be at least 6 characters/i)).not.toBeInTheDocument();
    });
  },
};

export const WithRememberMe: Story = {
  render: () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Login Form with Remember Me</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Note: Remember Me checkbox not yet implemented in the component
      </p>
      <LoginForm />
      <div className="mt-4 flex items-center space-x-2">
        <input type="checkbox" id="remember" className="rounded" />
        <label htmlFor="remember" className="text-sm text-muted-foreground">
          Remember me for 30 days
        </label>
      </div>
    </div>
  ),
};

export const WithSocialLogin: Story = {
  render: () => (
    <div className="space-y-6">
      <LoginForm />
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <button className="inline-flex items-center justify-center rounded-md border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring">
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google
        </button>
        <button className="inline-flex items-center justify-center rounded-md border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring">
          <svg className="mr-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
          </svg>
          GitHub
        </button>
      </div>
    </div>
  ),
};

export const MobileView: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const TabletView: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};

export const AccessibilityFeatures: Story = {
  render: () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Accessibility Features</h3>
      <div className="text-sm text-muted-foreground space-y-2 mb-4">
        <p>• Form has noValidate to prevent browser validation conflicts</p>
        <p>• All inputs have proper labels</p>
        <p>• Error messages are associated with inputs</p>
        <p>• Loading states are announced</p>
        <p>• Tab navigation works correctly</p>
      </div>
      <LoginForm />
    </div>
  ),
  parameters: {
    a11y: {
      config: {
        rules: [
          { id: 'label', enabled: true },
          { id: 'color-contrast', enabled: true },
          { id: 'form-field-multiple-labels', enabled: true },
        ],
      },
    },
  },
};

export const ScreenReaderAnnouncements: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Submit invalid form
    const submitButton = canvas.getByRole('button', { name: /sign in/i });
    await userEvent.click(submitButton);
    
    // Check that error messages have proper ARIA attributes
    await waitFor(() => {
      const emailError = canvas.getByText(/invalid email address/i);
      const passwordError = canvas.getByText(/password must be at least 6 characters/i);
      
      // Errors should have role="alert" for screen reader announcement
      expect(emailError.closest('[role="alert"]')).toBeInTheDocument();
      expect(passwordError.closest('[role="alert"]')).toBeInTheDocument();
    });
    
    // Fill form correctly
    const emailInput = canvas.getByLabelText(/email/i);
    const passwordInput = canvas.getByLabelText(/password/i);
    
    await userEvent.type(emailInput, 'user@example.com');
    await userEvent.type(passwordInput, 'password123');
    
    // Errors should be removed from DOM
    await waitFor(() => {
      expect(canvas.queryByText(/invalid email address/i)).not.toBeInTheDocument();
      expect(canvas.queryByText(/password must be at least 6 characters/i)).not.toBeInTheDocument();
    });
  },
};

export const FocusManagement: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Submit with errors
    const submitButton = canvas.getByRole('button', { name: /sign in/i });
    await userEvent.click(submitButton);
    
    // Focus should remain on submit button after validation
    expect(document.activeElement).toBe(submitButton);
    
    // Type in email field
    const emailInput = canvas.getByLabelText(/email/i);
    await userEvent.click(emailInput);
    await userEvent.type(emailInput, 'test@');
    
    // Clear and check focus retention
    await userEvent.clear(emailInput);
    expect(document.activeElement).toBe(emailInput);
  },
};

export const HighContrastMode: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">Normal Mode</h3>
        <LoginForm />
      </div>
      <div style={{ filter: 'contrast(2) saturate(0)' }}>
        <h3 className="text-lg font-semibold mb-4">High Contrast Mode</h3>
        <LoginForm />
      </div>
    </div>
  ),
};

// Enhanced Error State Stories
export const InvalidCredentialsError: Story = {
  decorators: [
    (_Story) => {
      const [loginError, setLoginError] = useState<string | null>(null);
      
      return (
        <div className="space-y-4">
          {loginError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{loginError}</AlertDescription>
            </Alert>
          )}
          
          <LoginForm />
          
          <Card className="p-4">
            <h4 className="font-medium mb-2">Login Error Simulation</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Click to simulate invalid credentials error
            </p>
            <Button
              size="sm"
              onClick={() => {
                setLoginError('Invalid email or password. Please try again.');
                toast.error('Login failed');
              }}
            >
              Trigger Login Error
            </Button>
          </Card>
          <Toaster position="top-right" />
        </div>
      );
    },
  ],
};

export const AccountLockedError: Story = {
  decorators: [
    (_Story) => {
      const [lockError, setLockError] = useState(true);
      
      return (
        <div className="space-y-4">
          {lockError && (
            <Alert variant="destructive">
              <Lock className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Account Locked</p>
                  <p className="text-sm">
                    Too many failed login attempts. Your account has been temporarily locked for security.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Please try again in 30 minutes or reset your password.
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setLockError(false)}>
                      Dismiss
                    </Button>
                    <Button size="sm" variant="outline">
                      Reset Password
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          <LoginForm />
          <Toaster position="top-right" />
        </div>
      );
    },
  ],
};

export const NetworkError: Story = {
  decorators: [
    (_Story) => {
      const [isOffline, setIsOffline] = useState(true);
      
      return (
        <div className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isOffline ? (
                  <WifiOff className="w-4 h-4 text-red-500" />
                ) : (
                  <Wifi className="w-4 h-4 text-green-500" />
                )}
                <span className="text-sm font-medium">
                  {isOffline ? 'Offline' : 'Online'}
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsOffline(!isOffline)}
              >
                Toggle Connection
              </Button>
            </div>
          </Card>
          
          {isOffline && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No internet connection. Please check your network and try again.
              </AlertDescription>
            </Alert>
          )}
          
          <LoginForm />
          <Toaster position="top-right" />
        </div>
      );
    },
  ],
};

export const RateLimitError: Story = {
  decorators: [
    (_Story) => {
      const [rateLimitError, setRateLimitError] = useState(true);
      const [countdown, _setCountdown] = useState(30);
      
      return (
        <div className="space-y-4">
          {rateLimitError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Too Many Requests</p>
                  <p className="text-sm">
                    You've made too many login attempts. Please wait before trying again.
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{countdown}s remaining</Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setRateLimitError(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          <LoginForm />
          <Toaster position="top-right" />
        </div>
      );
    },
  ],
};

export const SessionExpiredError: Story = {
  decorators: [
    (_Story) => {
      const [sessionError, setSessionError] = useState(true);
      
      return (
        <div className="space-y-4">
          {sessionError && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Session Expired</p>
                  <p className="text-sm">
                    Your session has expired. Please log in again to continue.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSessionError(false)}
                  >
                    Dismiss
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          <LoginForm />
          <Toaster position="top-right" />
        </div>
      );
    },
  ],
};

export const ServerError: Story = {
  decorators: [
    (_Story) => {
      const [serverError, setServerError] = useState<string | null>(
        'Unable to connect to authentication server. Please try again later.'
      );
      
      return (
        <div className="space-y-4">
          {serverError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <span>{serverError}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setServerError(null);
                      toast.info('Retrying connection...');
                    }}
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Retry
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          <LoginForm />
          <Toaster position="top-right" />
        </div>
      );
    },
  ],
};

export const EmailNotVerifiedError: Story = {
  decorators: [
    (_Story) => {
      const [verificationError, _setVerificationError] = useState(true);
      const [resendLoading, setResendLoading] = useState(false);
      
      const resendVerification = async () => {
        setResendLoading(true);
        await new Promise(resolve => setTimeout(resolve, 2000));
        setResendLoading(false);
        toast.success('Verification email sent!');
      };
      
      return (
        <div className="space-y-4">
          {verificationError && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Email Not Verified</p>
                  <p className="text-sm">
                    Please verify your email address before logging in.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={resendVerification}
                    disabled={resendLoading}
                  >
                    {resendLoading ? 'Sending...' : 'Resend Verification Email'}
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          <LoginForm />
          <Toaster position="top-right" />
        </div>
      );
    },
  ],
};

export const ErrorRecovery: Story = {
  decorators: [
    (_Story) => {
      const [error, setError] = useState<string | null>('Connection lost. Please try again.');
      const [isRetrying, setIsRetrying] = useState(false);
      const [retryCount, setRetryCount] = useState(0);
      
      const retry = async () => {
        setIsRetrying(true);
        setRetryCount(prev => prev + 1);
        
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        if (retryCount >= 1) {
          setError(null);
          toast.success('Connection restored!');
        } else {
          toast.error('Still having issues. Please try again.');
        }
        
        setIsRetrying(false);
      };
      
      return (
        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <span>{error}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={retry}
                    disabled={isRetrying}
                  >
                    {isRetrying ? (
                      <>
                        <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                        Retrying...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Retry ({retryCount + 1}/2)
                      </>
                    )}
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          <Card className="p-4">
            <h4 className="font-medium mb-2">Error Recovery Demo</h4>
            <p className="text-sm text-muted-foreground">
              {retryCount === 0 ? 'First retry will fail, second will succeed' : 'Next retry will succeed'}
            </p>
          </Card>
          
          <LoginForm />
          <Toaster position="top-right" />
        </div>
      );
    },
  ],
};