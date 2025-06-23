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
                Click "Create Discount" to see loading state
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
    expect(dateInput).toHaveValue(expect.stringContaining(formattedDate));
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
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    expect(focusableElements.length).toBeGreaterThan(0);
    
    // First element should have focus or be focusable
    const firstElement = focusableElements[0] as HTMLElement;
    firstElement.focus();
    expect(document.activeElement).toBe(firstElement);
  },
};