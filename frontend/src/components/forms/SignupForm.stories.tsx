import type { Meta, StoryObj } from '@storybook/react-vite';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { SignupForm } from './SignupForm';
import { useSignup } from '@/hooks/auth/useAuth';
import { vi } from 'vitest';
import { userEvent, within, expect, waitFor } from '@storybook/test';
import { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/Progress';
import { Check, X, AlertCircle, RefreshCw, Save, AlertTriangle, Shield, Ban } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { toast, Toaster } from 'sonner';
import type { SignupInput } from '@/lib/validations';
import type { RouterOutputs } from '@/lib/trpc';
import type { User } from '@/types';
import type { TRPCClientError } from '@trpc/client';
import type { AppRouter } from '@/lib/trpc';

// Mock the hook
vi.mock('@/hooks/auth/useAuth');

const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const meta = {
  title: 'Forms/SignupForm',
  component: SignupForm,
  decorators: [
    (Story) => {
      const queryClient = createQueryClient();
      return (
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <div className="max-w-md mx-auto p-4">
              <Story />
            </div>
          </BrowserRouter>
        </QueryClientProvider>
      );
    },
  ],
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof SignupForm>;

export default meta;
type Story = StoryObj<typeof meta>;

// Create properly typed mock for tRPC mutation
type SignupOutput = RouterOutputs['auth']['signup'];
type SignupMutation = ReturnType<typeof useSignup>;

// Base mock with required properties
const createMockSignup = (overrides?: Partial<SignupMutation>): SignupMutation => {
  const base = {
    mutate: vi.fn(),
    mutateAsync: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
    isSuccess: false,
    data: undefined as SignupOutput | undefined,
    reset: vi.fn(),
    status: 'idle' as const,
    variables: undefined,
    isIdle: true,
    isPaused: false,
    context: undefined,
    failureCount: 0,
    failureReason: null,
    submittedAt: 0,
    trpc: {
      path: 'auth.signup',
    },
  };
  
  return { ...base, ...overrides } as SignupMutation;
};

const mockSignup = createMockSignup();

export const Default: Story = {
  decorators: [
    (Story) => {
      const mockedUseSignup = vi.mocked(useSignup);
      mockedUseSignup.mockReturnValue(mockSignup);
      return <Story />;
    },
  ],
};

export const WithValidationErrors: Story = {
  decorators: [
    (Story) => {
      const mockedUseSignup = vi.mocked(useSignup);
      mockedUseSignup.mockReturnValue(mockSignup);
      return <Story />;
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Submit empty form to trigger validation errors
    const submitButton = canvas.getByRole('button', { name: /create account/i });
    await userEvent.click(submitButton);
    
    // Wait for validation errors
    await expect(canvas.getByText(/name must be at least 2 characters/i)).toBeInTheDocument();
    await expect(canvas.getByText(/invalid email address/i)).toBeInTheDocument();
    await expect(canvas.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
  },
};

export const PasswordMismatch: Story = {
  decorators: [
    (Story) => {
      const mockedUseSignup = vi.mocked(useSignup);
      mockedUseSignup.mockReturnValue(mockSignup);
      return <Story />;
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Fill form with mismatched passwords
    await userEvent.type(canvas.getByLabelText(/full name/i), 'John Doe');
    await userEvent.type(canvas.getByLabelText('Email'), 'john@example.com');
    await userEvent.type(canvas.getByLabelText('Password'), 'password123');
    await userEvent.type(canvas.getByLabelText(/confirm password/i), 'password456');
    
    // Submit to see mismatch error
    const submitButton = canvas.getByRole('button', { name: /create account/i });
    await userEvent.click(submitButton);
    
    // Check for password mismatch error
    await expect(canvas.getByText(/passwords don't match/i)).toBeInTheDocument();
  },
};

export const LoadingState: Story = {
  decorators: [
    (Story) => {
      const mockedUseSignup = vi.mocked(useSignup);
      mockedUseSignup.mockReturnValue(createMockSignup({
        isPending: true,
        isIdle: false,
        status: 'pending',
      }));
      return <Story />;
    },
  ],
};

export const SuccessFlow: Story = {
  decorators: [
    (Story) => {
      const mockedUseSignup = vi.mocked(useSignup);
      const mockMutate = vi.fn();
      mockedUseSignup.mockReturnValue(createMockSignup({
        mutate: mockMutate,
      }));
      return <Story />;
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Fill in valid registration data
    await userEvent.type(canvas.getByLabelText(/full name/i), 'Jane Smith');
    await userEvent.type(canvas.getByLabelText('Email'), 'jane@example.com');
    await userEvent.type(canvas.getByLabelText('Password'), 'securePassword123');
    await userEvent.type(canvas.getByLabelText(/confirm password/i), 'securePassword123');
    
    // Submit form
    const submitButton = canvas.getByRole('button', { name: /create account/i });
    await userEvent.click(submitButton);
    
    // Verify form was submitted with correct data
    await waitFor(() => {
      const mockMutate = vi.mocked(useSignup).mock.results[0]?.value.mutate;
      expect(mockMutate).toHaveBeenCalledWith({
        name: 'Jane Smith',
        email: 'jane@example.com',
        password: 'securePassword123',
        confirmPassword: 'securePassword123',
      });
    });
  },
};

export const ValidationStates: Story = {
  decorators: [
    (Story) => {
      const mockedUseSignup = vi.mocked(useSignup);
      mockedUseSignup.mockReturnValue(mockSignup);
      return <Story />;
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Test short name
    const nameInput = canvas.getByLabelText(/full name/i);
    await userEvent.type(nameInput, 'J');
    await userEvent.tab();
    
    // Test invalid email
    const emailInput = canvas.getByLabelText('Email');
    await userEvent.type(emailInput, 'notanemail');
    await userEvent.tab();
    
    // Test short password
    const passwordInput = canvas.getByLabelText('Password');
    await userEvent.type(passwordInput, '123');
    await userEvent.tab();
    
    // Submit to see all validation errors
    const submitButton = canvas.getByRole('button', { name: /create account/i });
    await userEvent.click(submitButton);
  },
};

// Enhanced SignupForm with password strength indicator
const SignupFormWithPasswordStrength = () => {
  const [password, setPassword] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordFeedback, setPasswordFeedback] = useState('');
  
  const calculatePasswordStrength = (pass: string) => {
    let strength = 0;
    const feedback: string[] = [];
    
    if (pass.length >= 8) {
      strength += 25;
      feedback.push('✓ At least 8 characters');
    } else {
      feedback.push('✗ At least 8 characters');
    }
    
    if (/[A-Z]/.test(pass)) {
      strength += 25;
      feedback.push('✓ Contains uppercase letter');
    } else {
      feedback.push('✗ Contains uppercase letter');
    }
    
    if (/[0-9]/.test(pass)) {
      strength += 25;
      feedback.push('✓ Contains number');
    } else {
      feedback.push('✗ Contains number');
    }
    
    if (/[^A-Za-z0-9]/.test(pass)) {
      strength += 25;
      feedback.push('✓ Contains special character');
    } else {
      feedback.push('✗ Contains special character');
    }
    
    setPasswordStrength(strength);
    setPasswordFeedback(feedback.join('\n'));
    
    return strength;
  };
  
  useEffect(() => {
    calculatePasswordStrength(password);
  }, [password]);
  
  const getStrengthText = () => {
    if (passwordStrength <= 25) return 'Weak';
    if (passwordStrength <= 50) return 'Fair';
    if (passwordStrength <= 75) return 'Good';
    return 'Strong';
  };
  
  return (
    <div className="space-y-4">
      <SignupForm />
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="font-medium">Password strength:</span>
          <span className={`font-medium ${
            passwordStrength <= 25 ? 'text-destructive' :
            passwordStrength <= 50 ? 'text-orange-500' :
            passwordStrength <= 75 ? 'text-yellow-500' :
            'text-green-500'
          }`}>
            {password && getStrengthText()}
          </span>
        </div>
        <Progress value={passwordStrength} className="h-2" />
        <div className="text-xs text-muted-foreground whitespace-pre-line">
          {passwordFeedback}
        </div>
      </div>
      {/* Hidden input to capture password changes */}
      <input
        type="hidden"
        onChange={() => {
          const passwordInput = document.querySelector('input[type="password"]')!;
          if (passwordInput) {
            passwordInput.addEventListener('input', (event) => {
              setPassword((event.target as HTMLInputElement).value);
            });
          }
        }}
      />
    </div>
  );
};

export const PasswordStrengthIndicator: Story = {
  render: () => <SignupFormWithPasswordStrength />,
  decorators: [
    (Story) => {
      const mockedUseSignup = vi.mocked(useSignup);
      mockedUseSignup.mockReturnValue(mockSignup);
      return <Story />;
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Type a weak password
    const passwordInput = canvas.getAllByLabelText('Password')[0] as HTMLInputElement;
    await userEvent.type(passwordInput, 'weak');
    
    // Check weak indicator
    await waitFor(() => {
      expect(canvas.getByText('Weak')).toBeInTheDocument();
    });
    
    // Type a strong password
    await userEvent.clear(passwordInput);
    await userEvent.type(passwordInput, 'StrongP@ssw0rd!');
    
    // Check strong indicator
    await waitFor(() => {
      expect(canvas.getByText('Strong')).toBeInTheDocument();
    });
  },
};

// Enhanced SignupForm with Terms Acceptance
const SignupFormWithTerms = () => {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [marketingAccepted, setMarketingAccepted] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  
  return (
    <div className="space-y-6">
      <div onSubmit={(e) => {
        e.preventDefault();
        if (!termsAccepted) {
          alert('Please accept the terms and conditions');
          return;
        }
        setFormSubmitted(true);
      }}>
        <SignupForm />
      </div>
      
      <div className="space-y-4">
        <div className="flex items-start">
          <input
            id="terms"
            type="checkbox"
            className="mt-1 rounded border-border"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            data-testid="terms-checkbox"
          />
          <label htmlFor="terms" className="ml-2 text-sm text-muted-foreground">
            I agree to the{' '}
            <a href="#" className="text-primary hover:underline" onClick={(e) => e.preventDefault()}>
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="text-primary hover:underline" onClick={(e) => e.preventDefault()}>
              Privacy Policy
            </a>
            <span className="text-destructive"> *</span>
          </label>
        </div>
        <div className="flex items-start">
          <input
            id="marketing"
            type="checkbox"
            className="mt-1 rounded border-border"
            checked={marketingAccepted}
            onChange={(e) => setMarketingAccepted(e.target.checked)}
            data-testid="marketing-checkbox"
          />
          <label htmlFor="marketing" className="ml-2 text-sm text-muted-foreground">
            I&apos;d like to receive marketing emails about products and updates
          </label>
        </div>
      </div>
      
      {formSubmitted && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800">
            Form submitted successfully!
            {marketingAccepted && ' You will receive marketing emails.'}
          </p>
        </div>
      )}
    </div>
  );
};

export const WithTermsAcceptance: Story = {
  render: () => <SignupFormWithTerms />,
  decorators: [
    (Story) => {
      const mockedUseSignup = vi.mocked(useSignup);
      mockedUseSignup.mockReturnValue(mockSignup);
      return <Story />;
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Fill form
    await userEvent.type(canvas.getByLabelText(/full name/i), 'John Terms');
    await userEvent.type(canvas.getByLabelText('Email'), 'john@terms.com');
    await userEvent.type(canvas.getByLabelText('Password'), 'password123');
    await userEvent.type(canvas.getByLabelText(/confirm password/i), 'password123');
    
    // Try to submit without accepting terms
    const submitButton = canvas.getByRole('button', { name: /create account/i });
    await userEvent.click(submitButton);
    
    // Accept terms
    const termsCheckbox = canvas.getByTestId('terms-checkbox');
    await userEvent.click(termsCheckbox);
    
    // Check marketing checkbox
    const marketingCheckbox = canvas.getByTestId('marketing-checkbox');
    await userEvent.click(marketingCheckbox);
    
    // Verify checkboxes are checked
    expect(termsCheckbox).toBeChecked();
    expect(marketingCheckbox).toBeChecked();
  },
};

export const MobileView: Story = {
  decorators: [
    (Story) => {
      const mockedUseSignup = vi.mocked(useSignup);
      mockedUseSignup.mockReturnValue(mockSignup);
      return <Story />;
    },
  ],
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const TabletView: Story = {
  decorators: [
    (Story) => {
      const mockedUseSignup = vi.mocked(useSignup);
      mockedUseSignup.mockReturnValue(mockSignup);
      return <Story />;
    },
  ],
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};

export const LongFormExample: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Create your account</h2>
        <p className="text-muted-foreground">
          Join thousands of happy customers
        </p>
      </div>
      
      <SignupForm />
      
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or sign up with
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <button className="inline-flex items-center justify-center rounded-md border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted">
          Google
        </button>
        <button className="inline-flex items-center justify-center rounded-md border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted">
          Facebook
        </button>
      </div>
      
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <a href="#" className="text-primary hover:underline">
          Sign in
        </a>
      </p>
    </div>
  ),
  decorators: [
    (Story) => {
      const mockedUseSignup = vi.mocked(useSignup);
      mockedUseSignup.mockReturnValue(mockSignup);
      return <Story />;
    },
  ],
};

export const AccessibilityFeatures: Story = {
  decorators: [
    (Story) => {
      const mockedUseSignup = vi.mocked(useSignup);
      mockedUseSignup.mockReturnValue(mockSignup);
      return <Story />;
    },
  ],
  render: () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Accessibility Features</h3>
      <div className="text-sm text-muted-foreground space-y-2 mb-4">
        <p>• All form fields have proper labels</p>
        <p>• Error messages are associated with inputs</p>
        <p>• Tab order follows logical flow</p>
        <p>• Loading states are announced to screen readers</p>
        <p>• Form validation provides clear feedback</p>
      </div>
      <SignupForm />
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

export const ComprehensiveFormTest: Story = {
  decorators: [
    (Story) => {
      const mockedUseSignup = vi.mocked(useSignup);
      const mockMutate = vi.fn();
      let callCount = 0;
      
      // Simulate different responses
      mockMutate.mockImplementation((data: SignupInput) => {
        callCount++;
        if (callCount === 1 && data.email === 'existing@example.com') {
          // Simulate email already exists error
          setTimeout(() => {
            mockedUseSignup.mockReturnValue(createMockSignup({
              isError: true,
              error: {
                message: 'Email already exists',
                data: {
                  code: 'BAD_REQUEST' as const,
                  httpStatus: 400,
                },
              } as unknown as TRPCClientError<AppRouter>,
            }));
          }, 500);
        } else {
          // Success
          setTimeout(() => {
            mockedUseSignup.mockReturnValue(createMockSignup({
              isSuccess: true,
              data: {
                user: {
                  _id: 'user123',
                  name: 'John Doe',
                  email: data.email,
                  role: 'customer' as const,
                  cartItems: [],
                } as User,
              },
            }));
          }, 1000);
        }
      });
      
      mockedUseSignup.mockReturnValue(createMockSignup({
        mutate: mockMutate,
      }));
      
      return <Story />;
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Test 1: Try with existing email
    await userEvent.type(canvas.getByLabelText(/full name/i), 'Test User');
    await userEvent.type(canvas.getByLabelText('Email'), 'existing@example.com');
    await userEvent.type(canvas.getByLabelText('Password'), 'TestPass123!');
    await userEvent.type(canvas.getByLabelText(/confirm password/i), 'TestPass123!');
    
    const submitButton = canvas.getByRole('button', { name: /create account/i });
    await userEvent.click(submitButton);
    
    // Clear form for second attempt
    await waitFor(() => {
      const emailInput = canvas.getByLabelText('Email');
      userEvent.clear(emailInput);
    });
    
    // Test 2: Successful registration
    await userEvent.type(canvas.getByLabelText('Email'), 'newuser@example.com');
    await userEvent.click(submitButton);
    
    // Verify successful submission
    await waitFor(() => {
      const mockMutate = vi.mocked(useSignup).mock.results[0]?.value.mutate;
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'newuser@example.com',
        }),
      );
    });
  },
};

export const PasswordStrengthInteractive: Story = {
  render: () => {
    const PasswordChecker = () => {
      const [password, setPassword] = useState('');
      
      const requirements = [
        { regex: /.{8,}/, text: 'At least 8 characters' },
        { regex: /[A-Z]/, text: 'One uppercase letter' },
        { regex: /[a-z]/, text: 'One lowercase letter' },
        { regex: /[0-9]/, text: 'One number' },
        { regex: /[^A-Za-z0-9]/, text: 'One special character' },
      ];
      
      const strength = requirements.filter(req => req.regex.test(password)).length;
      
      return (
        <div className="space-y-6">
          <SignupForm />
          <div className="border-t pt-6">
            <h3 className="text-sm font-medium mb-4">Password Requirements</h3>
            <div className="space-y-2">
              {requirements.map((req, index) => (
                <div 
                  key={index}
                  className={`flex items-center gap-2 text-sm ${
                    req.regex.test(password) ? 'text-green-600' : 'text-muted-foreground'
                  }`}
                >
                  {req.regex.test(password) ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                  {req.text}
                </div>
              ))}
            </div>
            
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Password strength</span>
                <span className={`font-medium ${
                  strength === 0 ? 'text-muted-foreground' :
                  strength <= 2 ? 'text-destructive' :
                  strength <= 3 ? 'text-orange-500' :
                  strength <= 4 ? 'text-yellow-500' :
                  'text-green-500'
                }`}>
                  {strength === 0 ? 'Enter password' :
                   strength <= 2 ? 'Weak' :
                   strength <= 3 ? 'Fair' :
                   strength <= 4 ? 'Good' :
                   'Strong'}
                </span>
              </div>
              <Progress 
                value={strength * 20} 
                className="h-2"
              />
            </div>
          </div>
          
          {/* Hidden listener for password input */}
          <div className="hidden">
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              data-testid="password-listener"
            />
          </div>
        </div>
      );
    };
    
    return <PasswordChecker />;
  },
  decorators: [
    (Story) => {
      const mockedUseSignup = vi.mocked(useSignup);
      mockedUseSignup.mockReturnValue(mockSignup);
      
      // Listen to password input changes
      useEffect(() => {
        const passwordInput = document.querySelector('input[type="password"]');
        const hiddenInput = document.querySelector('[data-testid="password-listener"]');
        
        if (passwordInput && hiddenInput) {
          const handleInput = (e: Event) => {
            const value = (e.target as HTMLInputElement).value;
            hiddenInput.setAttribute('value', value);
            hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
          };
          
          passwordInput.addEventListener('input', handleInput);
          return () => passwordInput.removeEventListener('input', handleInput);
        }
      }, []);
      
      return <Story />;
    },
  ],
};

// Enhanced Error State Stories
export const EmailAlreadyExistsError: Story = {
  decorators: [
    (Story) => {
      const [emailError, setEmailError] = useState<string | null>(null);
      
      return (
        <div className="space-y-4">
          {emailError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{emailError}</AlertDescription>
            </Alert>
          )}
          
          <Story />
          
          <Card className="p-4">
            <h4 className="font-medium mb-2">Email Exists Error Simulation</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Click to simulate email already exists error
            </p>
            <Button
              size="sm"
              onClick={() => {
                setEmailError('An account with this email address already exists. Please sign in instead.');
                toast.error('Email already registered');
              }}
            >
              Trigger Email Error
            </Button>
          </Card>
          <Toaster position="top-right" />
        </div>
      );
    },
  ],
};

export const WeakPasswordError: Story = {
  decorators: [
    (Story) => {
      const [passwordError, setPasswordError] = useState(true);
      const passwordRequirements = [
        'At least 8 characters',
        'One uppercase letter', 
        'One lowercase letter',
        'One number',
        'One special character',
      ];
      
      return (
        <div className="space-y-4">
          {passwordError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Weak Password</p>
                  <p className="text-sm">Your password must meet the following requirements:</p>
                  <ul className="text-sm list-disc list-inside">
                    {passwordRequirements.map((req, i) => (
                      <li key={i}>{req}</li>
                    ))}
                  </ul>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPasswordError(false)}
                  >
                    Got it
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          <Story />
          <Toaster position="top-right" />
        </div>
      );
    },
  ],
};

export const AccountCreationError: Story = {
  decorators: [
    (Story) => {
      const [createError, setCreateError] = useState<string | null>(null);
      const [isSubmitting, setIsSubmitting] = useState(false);
      
      const simulateCreateError = async () => {
        setIsSubmitting(true);
        setCreateError(null);
        
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setCreateError('Failed to create account. Please try again.');
        setIsSubmitting(false);
        toast.error('Account creation failed');
      };
      
      return (
        <div className="space-y-4">
          <Card className="p-4">
            <h4 className="font-medium mb-2">Account Creation Error Demo</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Click to simulate server error during account creation
            </p>
            <Button onClick={simulateCreateError} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Save className="w-4 h-4 mr-2 animate-pulse" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Create Account
                </>
              )}
            </Button>
          </Card>
          
          {createError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{createError}</AlertDescription>
            </Alert>
          )}
          
          <Story />
          <Toaster position="top-right" />
        </div>
      );
    },
  ],
};

export const ReCAPTCHAError: Story = {
  decorators: [
    (Story) => {
      const [captchaError, setCaptchaError] = useState(true);
      
      return (
        <div className="space-y-4">
          {captchaError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">reCAPTCHA Verification Failed</p>
                  <p className="text-sm">
                    Please verify that you&apos;re not a robot to continue.
                  </p>
                  <Button
                    size="sm"
                    variant="outline" 
                    onClick={() => {
                      setCaptchaError(false);
                      toast.info('reCAPTCHA refreshed');
                    }}
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Refresh reCAPTCHA
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          <Story />
          
          <Card className="p-4 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium">reCAPTCHA Demo</p>
                <p className="text-xs text-muted-foreground">Placeholder for reCAPTCHA widget</p>
              </div>
            </div>
          </Card>
          <Toaster position="top-right" />
        </div>
      );
    },
  ],
};

export const AgeVerificationError: Story = {
  decorators: [
    (Story) => {
      const [ageError, setAgeError] = useState(true);
      
      return (
        <div className="space-y-4">
          {ageError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Age Verification Required</p>
                  <p className="text-sm">
                    You must be at least 18 years old to create an account.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Date of birth provided indicates you are under 18.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setAgeError(false)}
                  >
                    Dismiss
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          <Story />
          <Toaster position="top-right" />
        </div>
      );
    },
  ],
};

export const TermsNotAcceptedError: Story = {
  decorators: [
    (Story) => {
      const [termsError, setTermsError] = useState(true);
      
      return (
        <div className="space-y-4">
          {termsError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Terms & Conditions Required</p>
                  <p className="text-sm">
                    You must accept our Terms of Service and Privacy Policy to create an account.
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        window.open('/terms', '_blank');
                      }}
                    >
                      Read Terms
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setTermsError(false)}
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          <Story />
          <Toaster position="top-right" />
        </div>
      );
    },
  ],
};

export const IPBlockedError: Story = {
  decorators: [
    (Story) => {
      const [ipError, setIpError] = useState(true);
      const blockedIP = '192.168.1.100';
      const blockedCountry = 'Unknown Location';
      
      return (
        <div className="space-y-4">
          {ipError && (
            <Alert variant="destructive">
              <Ban className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Registration Blocked</p>
                  <p className="text-sm">
                    Registration from your location is temporarily restricted.
                  </p>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>IP Address: {blockedIP}</p>
                    <p>Location: {blockedCountry}</p>
                  </div>
                  <p className="text-xs">
                    If you believe this is an error, please contact support.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIpError(false)}
                  >
                    Contact Support
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          <Story />
          <Toaster position="top-right" />
        </div>
      );
    },
  ],
};

export const ErrorRecovery: Story = {
  decorators: [
    (Story) => {
      const [error, setError] = useState<string | null>('Connection lost. Registration data saved.');
      const [isRetrying, setIsRetrying] = useState(false);
      const [retryCount, setRetryCount] = useState(0);
      
      const retry = async () => {
        setIsRetrying(true);
        setRetryCount(prev => prev + 1);
        
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        if (retryCount >= 1) {
          setError(null);
          toast.success('Registration successful!');
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
          
          <Story />
          <Toaster position="top-right" />
        </div>
      );
    },
  ],
};