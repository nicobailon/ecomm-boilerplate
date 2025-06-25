import type { Meta, StoryObj } from '@storybook/react-vite';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DiscountEditDrawer } from './DiscountEditDrawer';
import { trpc } from '@/lib/trpc';
import { createTRPCClient } from '@/lib/trpc-client';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { within, userEvent, expect, waitFor } from '@storybook/test';
import { addDays, format } from 'date-fns';
import type { Discount } from '@/types/discount';
import { Toaster } from 'sonner';
import { fn } from '@storybook/test';
import { Skeleton } from '@/components/ui/Skeleton';
import { Card } from '@/components/ui/Card';
import { Loader2, RefreshCw } from 'lucide-react';

const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const mockDiscount: Discount = {
  _id: 'disc1',
  code: 'SUMMER2024',
  discountPercentage: 20,
  expirationDate: addDays(new Date(), 30).toISOString(),
  isActive: true,
  description: 'Summer sale - 20% off all items',
  maxUses: 100,
  currentUses: 25,
  minimumPurchaseAmount: 50,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const expiredDiscount: Discount = {
  _id: 'disc2',
  code: 'EXPIRED2023',
  discountPercentage: 15,
  expirationDate: addDays(new Date(), -30).toISOString(),
  isActive: false,
  description: 'Old discount code',
  currentUses: 50,
  createdAt: addDays(new Date(), -60).toISOString(),
  updatedAt: addDays(new Date(), -30).toISOString(),
};

const unlimitedDiscount: Discount = {
  _id: 'disc3',
  code: 'UNLIMITED10',
  discountPercentage: 10,
  expirationDate: addDays(new Date(), 365).toISOString(),
  isActive: true,
  description: 'Unlimited use discount',
  currentUses: 1234,
  createdAt: addDays(new Date(), -90).toISOString(),
  updatedAt: new Date().toISOString(),
};

const fixedAmountDiscount: Discount = {
  _id: 'disc4',
  code: 'SAVE25DOLLARS',
  discountPercentage: 0, // Could be extended to support fixed amounts
  expirationDate: addDays(new Date(), 60).toISOString(),
  isActive: true,
  description: 'Save $25 on your purchase',
  maxUses: 500,
  currentUses: 123,
  minimumPurchaseAmount: 100,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const meta = {
  title: 'Drawers/DiscountEditDrawer',
  component: DiscountEditDrawer,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => {
      const queryClient = createQueryClient();
      const [isOpen, setIsOpen] = useState(false);
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <div className="p-4">
              <Button onClick={() => setIsOpen(true)}>
                Open Discount Drawer
              </Button>
              <Story isOpen={isOpen} onClose={() => setIsOpen(false)} />
              <Toaster position="top-right" />
            </div>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
  args: {
    isOpen: false,
    onClose: fn(),
  },
} satisfies Meta<typeof DiscountEditDrawer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CreateMode: Story = {
  args: {
    isOpen: true,
    mode: 'create',
  },
  decorators: [
    (Story) => {
      const queryClient = createQueryClient();
      const [isOpen, setIsOpen] = useState(true);
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <div className="p-4">
              <Button onClick={() => setIsOpen(true)}>
                Create New Discount
              </Button>
              <Story isOpen={isOpen} onClose={() => setIsOpen(false)} />
              <Toaster position="top-right" />
            </div>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
};

export const EditMode: Story = {
  args: {
    isOpen: true,
    mode: 'edit',
    discount: mockDiscount,
  },
  decorators: [
    (Story) => {
      const queryClient = createQueryClient();
      const [isOpen, setIsOpen] = useState(true);
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <div className="p-4">
              <Button onClick={() => setIsOpen(true)}>
                Edit Discount
              </Button>
              <Story isOpen={isOpen} onClose={() => setIsOpen(false)} />
              <Toaster position="top-right" />
            </div>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
};

export const EditExpiredDiscount: Story = {
  args: {
    isOpen: true,
    mode: 'edit',
    discount: expiredDiscount,
  },
  decorators: [
    (Story) => {
      const queryClient = createQueryClient();
      const [isOpen, setIsOpen] = useState(true);
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <div className="p-4">
              <Button onClick={() => setIsOpen(true)}>
                Edit Expired Discount
              </Button>
              <Story isOpen={isOpen} onClose={() => setIsOpen(false)} />
              <Toaster position="top-right" />
            </div>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
};

export const EditUnlimitedDiscount: Story = {
  args: {
    isOpen: true,
    mode: 'edit',
    discount: unlimitedDiscount,
  },
  decorators: [
    (Story) => {
      const queryClient = createQueryClient();
      const [isOpen, setIsOpen] = useState(true);
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <div className="p-4">
              <Button onClick={() => setIsOpen(true)}>
                Edit Unlimited Discount
              </Button>
              <Story isOpen={isOpen} onClose={() => setIsOpen(false)} />
              <Toaster position="top-right" />
            </div>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
};

export const ValidationErrors: Story = {
  args: {
    isOpen: true,
    mode: 'create',
  },
  decorators: [
    (Story) => {
      const queryClient = createQueryClient();
      const [isOpen, setIsOpen] = useState(true);
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <Story isOpen={isOpen} onClose={() => setIsOpen(false)} />
            <Toaster position="top-right" />
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    await waitFor(() => {
      expect(canvas.getByText('Create Discount Code')).toBeInTheDocument();
    });
    
    // Clear the code field and submit to trigger validation
    const codeInput = canvas.getByLabelText('Discount Code');
    await userEvent.clear(codeInput);
    
    // Set invalid percentage
    const percentageInput = canvas.getByRole('spinbutton', { name: /percentage/i });
    await userEvent.clear(percentageInput);
    await userEvent.type(percentageInput, '150');
    
    // Submit form
    const submitButton = canvas.getByRole('button', { name: /create discount/i });
    await userEvent.click(submitButton);
    
    // Check for validation errors
    await waitFor(() => {
      expect(canvas.getByText(/required/i)).toBeInTheDocument();
    });
  },
};

export const PercentageSliderInteraction: Story = {
  args: {
    isOpen: true,
    mode: 'create',
  },
  decorators: [
    (Story) => {
      const queryClient = createQueryClient();
      const [isOpen, setIsOpen] = useState(true);
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <Story isOpen={isOpen} onClose={() => setIsOpen(false)} />
            <Toaster position="top-right" />
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    await waitFor(() => {
      expect(canvas.getByText('Create Discount Code')).toBeInTheDocument();
    });
    
    // Test percentage input sync with slider
    const percentageInput = canvas.getByRole('spinbutton', { name: /percentage/i });
    await userEvent.clear(percentageInput);
    await userEvent.type(percentageInput, '75');
    
    // Verify slider updated
    const slider = canvas.getByRole('slider', { name: /percentage slider/i });
    expect(slider).toHaveAttribute('aria-valuenow', '75');
  },
};

export const CodeAutoUppercase: Story = {
  args: {
    isOpen: true,
    mode: 'create',
  },
  decorators: [
    (Story) => {
      const queryClient = createQueryClient();
      const [isOpen, setIsOpen] = useState(true);
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <Story isOpen={isOpen} onClose={() => setIsOpen(false)} />
            <Toaster position="top-right" />
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    await waitFor(() => {
      expect(canvas.getByText('Create Discount Code')).toBeInTheDocument();
    });
    
    // Type lowercase code
    const codeInput = canvas.getByLabelText('Discount Code');
    await userEvent.type(codeInput, 'winter2024');
    
    // Verify it's uppercase
    expect(codeInput).toHaveValue('WINTER2024');
  },
};

export const DatePickerInteraction: Story = {
  args: {
    isOpen: true,
    mode: 'create',
  },
  decorators: [
    (Story) => {
      const queryClient = createQueryClient();
      const [isOpen, setIsOpen] = useState(true);
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <Story isOpen={isOpen} onClose={() => setIsOpen(false)} />
            <Toaster position="top-right" />
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    await waitFor(() => {
      expect(canvas.getByText('Create Discount Code')).toBeInTheDocument();
    });
    
    // Interact with date picker
    const dateInput = canvas.getByLabelText('Expiration Date');
    const futureDate = addDays(new Date(), 60);
    const formattedDate = format(futureDate, 'yyyy-MM-dd\'T\'HH:mm');
    
    await userEvent.clear(dateInput);
    await userEvent.type(dateInput, formattedDate);
  },
};

export const LoadingState: Story = {
  args: {
    isOpen: true,
    mode: 'create',
  },
  decorators: [
    (Story) => {
      const queryClient = createQueryClient();
      const [isOpen, setIsOpen] = useState(true);
      const [isSubmitting, setIsSubmitting] = useState(false);
      
      // Mock a slow submission
      const handleClose = () => {
        if (!isSubmitting) {
          setIsSubmitting(true);
          setTimeout(() => {
            setIsSubmitting(false);
            setIsOpen(false);
          }, 3000);
        }
      };
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <div className="p-4">
              <p className="mb-4 text-sm text-muted-foreground">
                Click &quot;Create Discount&quot; to see loading state
              </p>
              <Story isOpen={isOpen} onClose={handleClose} />
              <Toaster position="top-right" />
            </div>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
};

export const MobileView: Story = {
  args: {
    isOpen: true,
    mode: 'create',
  },
  decorators: [
    (Story) => {
      const queryClient = createQueryClient();
      const [isOpen, setIsOpen] = useState(true);
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <Story isOpen={isOpen} onClose={() => setIsOpen(false)} />
            <Toaster position="top-right" />
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const TabletView: Story = {
  args: {
    isOpen: true,
    mode: 'edit',
    discount: mockDiscount,
  },
  decorators: [
    (Story) => {
      const queryClient = createQueryClient();
      const [isOpen, setIsOpen] = useState(true);
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <Story isOpen={isOpen} onClose={() => setIsOpen(false)} />
            <Toaster position="top-right" />
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};

export const CompleteFormFlow: Story = {
  args: {
    isOpen: true,
    mode: 'create',
  },
  decorators: [
    (Story) => {
      const queryClient = createQueryClient();
      const [isOpen, setIsOpen] = useState(true);
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <Story isOpen={isOpen} onClose={() => setIsOpen(false)} />
            <Toaster position="top-right" />
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    await waitFor(() => {
      expect(canvas.getByText('Create Discount Code')).toBeInTheDocument();
    });
    
    // Fill out complete form
    const codeInput = canvas.getByLabelText('Discount Code');
    await userEvent.type(codeInput, 'NEWYEAR2025');
    
    const percentageInput = canvas.getByRole('spinbutton', { name: /percentage/i });
    await userEvent.clear(percentageInput);
    await userEvent.type(percentageInput, '25');
    
    const descriptionInput = canvas.getByLabelText('Description (Optional)');
    await userEvent.type(descriptionInput, 'New Year special discount - 25% off everything');
    
    const maxUsesInput = canvas.getByLabelText('Max Uses (Optional)');
    await userEvent.type(maxUsesInput, '500');
    
    const minPurchaseInput = canvas.getByLabelText('Min Purchase (Optional)');
    await userEvent.type(minPurchaseInput, '75.00');
    
    // Toggle active status
    const activeSwitch = canvas.getByRole('switch', { name: /active status/i });
    await userEvent.click(activeSwitch);
    await userEvent.click(activeSwitch); // Toggle back on
  },
};

export const DiscountUsageInfo: Story = {
  args: {
    isOpen: true,
    mode: 'edit',
    discount: {
      ...mockDiscount,
      maxUses: 100,
      currentUses: 75,
    },
  },
  decorators: [
    (Story) => {
      const queryClient = createQueryClient();
      const [isOpen, setIsOpen] = useState(true);
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <div className="p-4">
              <div className="mb-4 p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">Usage Information</h3>
                <p className="text-sm">Current Uses: 75 / 100</p>
                <p className="text-sm text-muted-foreground">75% of maximum uses consumed</p>
              </div>
              <Story isOpen={isOpen} onClose={() => setIsOpen(false)} />
              <Toaster position="top-right" />
            </div>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
};

export const CodeGenerationDemo: Story = {
  args: {
    isOpen: true,
    mode: 'create',
  },
  decorators: [
    (Story) => {
      const queryClient = createQueryClient();
      const [isOpen, setIsOpen] = useState(true);
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <div className="p-4">
              <div className="mb-4 p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">Code Generation Feature</h3>
                <p className="text-sm text-muted-foreground">
                  Click the generate button (if available) to auto-generate a unique discount code
                </p>
              </div>
              <Story isOpen={isOpen} onClose={() => setIsOpen(false)} />
              <Toaster position="top-right" />
            </div>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
};

export const MaxUsesReached: Story = {
  args: {
    isOpen: true,
    mode: 'edit',
    discount: {
      ...mockDiscount,
      currentUses: 100,
      maxUses: 100,
    },
  },
  decorators: [
    (Story) => {
      const queryClient = createQueryClient();
      const [isOpen, setIsOpen] = useState(true);
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <div className="p-4">
              <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <h3 className="font-semibold mb-2 text-destructive">Maximum Uses Reached</h3>
                <p className="text-sm text-destructive">
                  This discount code has reached its maximum usage limit
                </p>
              </div>
              <Story isOpen={isOpen} onClose={() => setIsOpen(false)} />
              <Toaster position="top-right" />
            </div>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
};

export const FixedAmountDiscountDemo: Story = {
  args: {
    isOpen: true,
    mode: 'edit',
    discount: fixedAmountDiscount,
  },
  decorators: [
    (Story) => {
      const queryClient = createQueryClient();
      const [isOpen, setIsOpen] = useState(true);
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <div className="p-4">
              <div className="mb-4 p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">Fixed Amount Discount</h3>
                <p className="text-sm text-muted-foreground">
                  Note: Currently only percentage discounts are supported. 
                  Fixed amount discounts could be added in a future update.
                </p>
              </div>
              <Story isOpen={isOpen} onClose={() => setIsOpen(false)} />
              <Toaster position="top-right" />
            </div>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
};

export const SuccessConfirmation: Story = {
  args: {
    isOpen: true,
    mode: 'create',
  },
  decorators: [
    (Story) => {
      const queryClient = createQueryClient();
      const [isOpen, setIsOpen] = useState(true);
      const [showSuccess, setShowSuccess] = useState(false);
      
      const handleClose = () => {
        setShowSuccess(true);
        setIsOpen(false);
        setTimeout(() => setShowSuccess(false), 3000);
      };
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <div className="p-4">
              {showSuccess && (
                <div className="mb-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <h3 className="font-semibold mb-2 text-green-700">Success!</h3>
                  <p className="text-sm text-green-600">
                    Discount code created successfully
                  </p>
                </div>
              )}
              <Button onClick={() => setIsOpen(true)}>
                Create New Discount
              </Button>
              <Story isOpen={isOpen} onClose={handleClose} />
              <Toaster position="top-right" />
            </div>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
};

export const KeyboardNavigation: Story = {
  args: {
    isOpen: true,
    mode: 'create',
  },
  decorators: [
    (Story) => {
      const queryClient = createQueryClient();
      const [isOpen, setIsOpen] = useState(true);
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <Story isOpen={isOpen} onClose={() => setIsOpen(false)} />
            <Toaster position="top-right" />
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    await waitFor(() => {
      expect(canvas.getByText('Create Discount Code')).toBeInTheDocument();
    });
    
    // Focus should be on first input
    const codeInput = canvas.getByLabelText('Discount Code');
    await userEvent.click(codeInput);
    expect(document.activeElement).toBe(codeInput);
    
    // Tab through form fields
    await userEvent.tab(); // To percentage input
    const percentageInput = canvas.getByRole('spinbutton', { name: /percentage/i });
    expect(document.activeElement).toBe(percentageInput);
    
    await userEvent.tab(); // To slider
    const slider = canvas.getByRole('slider', { name: /percentage slider/i });
    expect(document.activeElement).toBe(slider);
    
    // Use arrow keys on slider
    await userEvent.keyboard('{ArrowRight}');
    await userEvent.keyboard('{ArrowRight}');
    expect(slider).toHaveAttribute('aria-valuenow', '12'); // Started at 10, moved right twice
    
    await userEvent.tab(); // To expiration date
    await userEvent.tab(); // To description
    await userEvent.tab(); // To max uses
    await userEvent.tab(); // To min purchase
    await userEvent.tab(); // To active switch
    
    const activeSwitch = canvas.getByRole('switch', { name: /active status/i });
    expect(document.activeElement).toBe(activeSwitch);
    
    // Space to toggle switch
    await userEvent.keyboard(' ');
    expect(activeSwitch).toHaveAttribute('aria-checked', 'false');
    
    // Escape to close drawer
    await userEvent.keyboard('{Escape}');
  },
};

export const DatePickerKeyboardNav: Story = {
  args: {
    isOpen: true,
    mode: 'create',
  },
  decorators: [
    (Story) => {
      const queryClient = createQueryClient();
      const [isOpen, setIsOpen] = useState(true);
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <Story isOpen={isOpen} onClose={() => setIsOpen(false)} />
            <Toaster position="top-right" />
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    await waitFor(() => {
      expect(canvas.getByText('Create Discount Code')).toBeInTheDocument();
    });
    
    // Focus on date picker
    const dateInput = canvas.getByLabelText('Expiration Date');
    await userEvent.click(dateInput);
    
    // Type a date
    const futureDate = addDays(new Date(), 30);
    const formattedDate = format(futureDate, 'yyyy-MM-dd');
    await userEvent.clear(dateInput);
    await userEvent.type(dateInput, formattedDate);
    
    // Verify date was set
    expect(dateInput).toHaveValue(formattedDate);
  },
};

export const AccessibilityFeatures: Story = {
  args: {
    isOpen: true,
    mode: 'edit',
    discount: mockDiscount,
  },
  decorators: [
    (Story) => {
      const queryClient = createQueryClient();
      const [isOpen, setIsOpen] = useState(true);
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <Story isOpen={isOpen} onClose={() => setIsOpen(false)} />
            <Toaster position="top-right" />
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    await waitFor(() => {
      expect(canvas.getByRole('dialog')).toBeInTheDocument();
    });
    
    // Check all form inputs have labels
    const codeInput = canvas.getByLabelText('Discount Code');
    expect(codeInput).toBeInTheDocument();
    
    const percentageInput = canvas.getByLabelText(/Discount Percentage/i);
    expect(percentageInput).toBeInTheDocument();
    
    // Check slider has accessible name
    const slider = canvas.getByRole('slider');
    expect(slider).toHaveAccessibleName();
    
    // Check switch has accessible label
    const activeSwitch = canvas.getByRole('switch');
    expect(activeSwitch).toHaveAccessibleName();
    
    // Submit with errors to check announcements
    const codeField = canvas.getByLabelText('Discount Code');
    await userEvent.clear(codeField);
    
    const submitButton = canvas.getByRole('button', { name: /save changes/i });
    await userEvent.click(submitButton);
    
    // Error should be announced
    await waitFor(() => {
      const errorMessage = canvas.getByText(/required/i);
      expect(errorMessage.closest('[role="alert"]')).toBeInTheDocument();
    });
  },
};

export const FocusManagement: Story = {
  args: {
    isOpen: true,
    mode: 'create',
  },
  decorators: [
    (Story) => {
      const queryClient = createQueryClient();
      const [isOpen, setIsOpen] = useState(true);
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <Story isOpen={isOpen} onClose={() => setIsOpen(false)} />
            <Toaster position="top-right" />
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    await waitFor(() => {
      const drawer = canvas.getByRole('dialog');
      expect(drawer).toBeInTheDocument();
    });
    
    // Check focus is trapped within drawer
    const drawer = canvas.getByRole('dialog');
    const focusableElements = drawer.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    
    expect(focusableElements.length).toBeGreaterThan(0);
    
    // First element should have focus or be focusable
    const firstElement = focusableElements[0] as HTMLElement;
    firstElement.focus();
    expect(document.activeElement).toBe(firstElement);
  },
};

export const InitialLoadingState: Story = {
  decorators: [
    () => (
      <div className="min-h-screen bg-background">
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
          <div className="fixed inset-y-0 right-0 w-full max-w-md bg-background border-l border-border shadow-lg">
            <div className="flex flex-col h-full">
              <div className="p-6 border-b border-border">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-7 w-48" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              </div>
              
              <div className="flex-1 p-6 space-y-6">
                <div className="space-y-4">
                  <div>
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  
                  <div>
                    <Skeleton className="h-4 w-32 mb-2" />
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-10 flex-1" />
                      <Skeleton className="h-10 w-20" />
                    </div>
                    <Skeleton className="h-2 w-full mt-2" />
                  </div>
                  
                  <div>
                    <Skeleton className="h-4 w-28 mb-2" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  
                  <div>
                    <Skeleton className="h-4 w-36 mb-2" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Skeleton className="h-4 w-20 mb-2" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                    <div>
                      <Skeleton className="h-4 w-24 mb-2" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-6 w-12" />
                  </div>
                </div>
              </div>
              
              <div className="p-6 border-t border-border">
                <div className="flex gap-3">
                  <Skeleton className="h-10 flex-1" />
                  <Skeleton className="h-10 w-20" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
  ],
  args: {
    isOpen: false,
    mode: 'create' as const,
  },
  render: () => <div></div>,
};

export const LazyLoadingContent: Story = {
  args: {
    isOpen: true,
    mode: 'edit',
    discount: mockDiscount,
  },
  decorators: [
    (Story) => {
      const queryClient = createQueryClient();
      const [isOpen, setIsOpen] = useState(true);
      const [isLoading, setIsLoading] = useState(true);
      
      useState(() => {
        setTimeout(() => setIsLoading(false), 2000);
      });
      
      if (isLoading) {
        return (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
            <div className="fixed inset-y-0 right-0 w-full max-w-md bg-background border-l">
              <div className="p-6">
                <div className="flex items-center justify-center h-32">
                  <div className="text-center space-y-3">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                    <p className="text-sm text-muted-foreground">Loading discount details...</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      }
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <Story isOpen={isOpen} onClose={() => setIsOpen(false)} />
            <Toaster position="top-right" />
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
};

export const ProgressiveFieldLoading: Story = {
  args: {
    isOpen: true,
    mode: 'create',
  },
  decorators: [
    () => {
      const queryClient = createQueryClient();
      const [loadedFields, setLoadedFields] = useState(0);
      const totalFields = 6;
      
      useState(() => {
        const interval = setInterval(() => {
          setLoadedFields(prev => {
            if (prev >= totalFields) {
              clearInterval(interval);
              return totalFields;
            }
            return prev + 1;
          });
        }, 400);
        
        return () => clearInterval(interval);
      });
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
              <div className="fixed inset-y-0 right-0 w-full max-w-md bg-background border-l">
                <div className="flex flex-col h-full">
                  <div className="p-6 border-b">
                    <h2 className="text-lg font-semibold">Create Discount Code</h2>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Loading fields: {loadedFields}/{totalFields}
                    </div>
                  </div>
                  
                  <div className="flex-1 p-6 space-y-4">
                    {/* Code field */}
                    <div className={loadedFields >= 1 ? 'opacity-100' : 'opacity-30'}>
                      {loadedFields >= 1 ? (
                        <div>
                          <label className="text-sm font-medium">Discount Code</label>
                          <input className="w-full mt-1 p-2 border rounded" placeholder="Enter code" />
                        </div>
                      ) : (
                        <Skeleton className="h-16 w-full" />
                      )}
                    </div>
                    
                    {/* Percentage field */}
                    <div className={loadedFields >= 2 ? 'opacity-100' : 'opacity-30'}>
                      {loadedFields >= 2 ? (
                        <div>
                          <label className="text-sm font-medium">Discount Percentage</label>
                          <div className="flex gap-2 mt-1">
                            <input className="flex-1 p-2 border rounded" type="number" />
                            <span className="p-2 text-sm">%</span>
                          </div>
                        </div>
                      ) : (
                        <Skeleton className="h-16 w-full" />
                      )}
                    </div>
                    
                    {/* Date field */}
                    <div className={loadedFields >= 3 ? 'opacity-100' : 'opacity-30'}>
                      {loadedFields >= 3 ? (
                        <div>
                          <label className="text-sm font-medium">Expiration Date</label>
                          <input className="w-full mt-1 p-2 border rounded" type="datetime-local" />
                        </div>
                      ) : (
                        <Skeleton className="h-16 w-full" />
                      )}
                    </div>
                    
                    {/* Description field */}
                    <div className={loadedFields >= 4 ? 'opacity-100' : 'opacity-30'}>
                      {loadedFields >= 4 ? (
                        <div>
                          <label className="text-sm font-medium">Description</label>
                          <textarea className="w-full mt-1 p-2 border rounded" rows={3} />
                        </div>
                      ) : (
                        <Skeleton className="h-20 w-full" />
                      )}
                    </div>
                    
                    {/* Usage fields */}
                    <div className={loadedFields >= 5 ? 'opacity-100' : 'opacity-30'}>
                      {loadedFields >= 5 ? (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium">Max Uses</label>
                            <input className="w-full mt-1 p-2 border rounded" type="number" />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Min Purchase</label>
                            <input className="w-full mt-1 p-2 border rounded" type="number" />
                          </div>
                        </div>
                      ) : (
                        <Skeleton className="h-16 w-full" />
                      )}
                    </div>
                    
                    {/* Active toggle */}
                    <div className={loadedFields >= 6 ? 'opacity-100' : 'opacity-30'}>
                      {loadedFields >= 6 ? (
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium">Active Status</label>
                          <div className="w-12 h-6 bg-primary rounded-full relative">
                            <div className="absolute top-1 right-1 w-4 h-4 bg-white rounded-full" />
                          </div>
                        </div>
                      ) : (
                        <Skeleton className="h-8 w-full" />
                      )}
                    </div>
                  </div>
                  
                  <div className="p-6 border-t">
                    <div className="flex gap-3">
                      <button className="flex-1 px-4 py-2 bg-muted text-muted-foreground rounded disabled">Cancel</button>
                      <button className="px-6 py-2 bg-primary text-primary-foreground rounded disabled">Create</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <Toaster position="top-right" />
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
  render: () => <div></div>,
};

export const SavingState: Story = {
  args: {
    isOpen: true,
    mode: 'create',
  },
  decorators: [
    (Story) => {
      const queryClient = createQueryClient();
      const [isOpen, setIsOpen] = useState(true);
      const [isSaving, setIsSaving] = useState(false);
      const [progress, setProgress] = useState(0);
      
      const simulateSave = () => {
        setIsSaving(true);
        setProgress(0);
        
        const interval = setInterval(() => {
          setProgress(prev => {
            if (prev >= 100) {
              clearInterval(interval);
              setTimeout(() => {
                setIsSaving(false);
                setIsOpen(false);
              }, 500);
              return 100;
            }
            return prev + 10;
          });
        }, 200);
      };
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <div className="space-y-4">
              <Card className="p-4">
                <h4 className="font-medium mb-2">Save Progress Demo</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Click &quot;Start Save&quot; to see the saving state with progress
                </p>
                <Button onClick={simulateSave} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Start Save'}
                </Button>
                {isSaving && (
                  <div className="mt-3">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary transition-all duration-200" style={{ width: `${progress}%` }} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{progress}% complete</p>
                  </div>
                )}
              </Card>
              
              {isSaving && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
                  <div className="fixed inset-y-0 right-0 w-full max-w-md bg-background border-l">
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center space-y-4">
                        <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
                        <div>
                          <h3 className="font-medium">Saving Discount</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Please wait while we save your discount code...
                          </p>
                        </div>
                        <div className="w-64 mx-auto">
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary transition-all duration-200" style={{ width: `${progress}%` }} />
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{progress}%</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <Story isOpen={isOpen && !isSaving} onClose={() => setIsOpen(false)} />
            </div>
            <Toaster position="top-right" />
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
};

export const RefreshableDiscountData: Story = {
  args: {
    isOpen: true,
    mode: 'edit',
    discount: mockDiscount,
  },
  decorators: [
    (Story) => {
      const queryClient = createQueryClient();
      const [isOpen, setIsOpen] = useState(true);
      const [isRefreshing, setIsRefreshing] = useState(false);
      const [lastUpdated, setLastUpdated] = useState(new Date());
      
      const refreshData = async () => {
        setIsRefreshing(true);
        await new Promise(resolve => setTimeout(resolve, 1500));
        setLastUpdated(new Date());
        setIsRefreshing(false);
      };
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <div className="space-y-4">
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Discount Data</h4>
                    <p className="text-xs text-muted-foreground">
                      Last updated: {lastUpdated.toLocaleTimeString()}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { void refreshData(); }}
                    disabled={isRefreshing}
                  >
                    {isRefreshing ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        Refreshing...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Refresh
                      </>
                    )}
                  </Button>
                </div>
              </Card>
              
              <div className={isRefreshing ? 'opacity-50 pointer-events-none' : ''}>
                <Story isOpen={isOpen} onClose={() => setIsOpen(false)} />
              </div>
              
              {isRefreshing && (
                <div className="fixed inset-0 bg-background/20 z-40">
                  <div className="fixed top-4 right-4">
                    <Card className="p-3">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Refreshing discount data...</span>
                      </div>
                    </Card>
                  </div>
                </div>
              )}
            </div>
            <Toaster position="top-right" />
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
};

export const ShimmerLoadingEffect: Story = {
  decorators: [
    () => (
      <div className="min-h-screen bg-background">
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
          <div className="fixed inset-y-0 right-0 w-full max-w-md bg-background border-l">
            <div className="flex flex-col h-full">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <div className="h-7 w-48 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer rounded" />
                  <div className="h-8 w-8 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer rounded-full" />
                </div>
              </div>
              
              <div className="flex-1 p-6 space-y-6">
                <div className="space-y-4">
                  <div>
                    <div className="h-4 w-24 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer rounded mb-2" />
                    <div className="h-10 w-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer rounded" />
                  </div>
                  
                  <div>
                    <div className="h-4 w-32 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer rounded mb-2" />
                    <div className="flex items-center gap-4">
                      <div className="h-10 flex-1 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer rounded" />
                      <div className="h-10 w-20 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer rounded" />
                    </div>
                    <div className="h-2 w-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer rounded mt-2" />
                  </div>
                  
                  <div>
                    <div className="h-4 w-28 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer rounded mb-2" />
                    <div className="h-10 w-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer rounded" />
                  </div>
                  
                  <div>
                    <div className="h-4 w-36 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer rounded mb-2" />
                    <div className="h-20 w-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer rounded" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="h-4 w-20 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer rounded mb-2" />
                      <div className="h-10 w-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer rounded" />
                    </div>
                    <div>
                      <div className="h-4 w-24 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer rounded mb-2" />
                      <div className="h-10 w-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer rounded" />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="h-4 w-20 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer rounded" />
                    <div className="h-6 w-12 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer rounded" />
                  </div>
                </div>
              </div>
              
              <div className="p-6 border-t">
                <div className="flex gap-3">
                  <div className="h-10 flex-1 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer rounded" />
                  <div className="h-10 w-20 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer rounded" />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <style>{`
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          .animate-shimmer {
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
          }
        `}</style>
      </div>
    ),
  ],
  args: {
    isOpen: false,
    mode: 'create' as const,
  },
  render: () => <div></div>,
};

export const ValidationLoadingState: Story = {
  args: {
    isOpen: true,
    mode: 'create',
  },
  decorators: [
    (Story) => {
      const queryClient = createQueryClient();
      const [isOpen, setIsOpen] = useState(true);
      const [isValidating, setIsValidating] = useState(false);
      const [validationSteps, setValidationSteps] = useState<string[]>([]);
      
      const runValidation = () => {
        setIsValidating(true);
        setValidationSteps([]);
        
        const steps = [
          'Checking code uniqueness...',
          'Validating percentage range...',
          'Verifying date format...',
          'Checking business rules...',
          'Validation complete!',
        ];
        
        steps.forEach((step, index) => {
          setTimeout(() => {
            setValidationSteps(prev => [...prev, step]);
            if (index === steps.length - 1) {
              setTimeout(() => setIsValidating(false), 500);
            }
          }, (index + 1) * 600);
        });
      };
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <div className="space-y-4">
              <Card className="p-4">
                <h4 className="font-medium mb-2">Validation Loading Demo</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  See step-by-step validation with loading indicators
                </p>
                <Button onClick={runValidation} disabled={isValidating}>
                  Run Validation
                </Button>
                
                {isValidating && (
                  <div className="mt-4 space-y-2">
                    {validationSteps.map((step, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <Loader2 className="w-3 h-3 animate-spin text-primary" />
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
              
              <div className={isValidating ? 'opacity-70 pointer-events-none' : ''}>
                <Story isOpen={isOpen} onClose={() => setIsOpen(false)} />
              </div>
              
              {isValidating && (
                <div className="fixed bottom-4 right-4 z-50">
                  <Card className="p-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      <span className="text-sm">Validating form data...</span>
                    </div>
                  </Card>
                </div>
              )}
            </div>
            <Toaster position="top-right" />
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
};