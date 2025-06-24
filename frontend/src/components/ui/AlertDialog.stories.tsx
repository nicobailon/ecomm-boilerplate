import type { Meta, StoryObj } from '@storybook/react-vite';
import { within, expect, userEvent } from '@storybook/test';
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
  ConfirmDialog,
} from './AlertDialog';
import { Button } from './Button';

const meta = {
  title: 'UI/Overlay/AlertDialog',
  component: AlertDialog,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A modal dialog that interrupts the user with important content and expects a response. Used for confirmations, warnings, and critical actions. Follows ARIA dialog patterns with proper focus management and keyboard navigation.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof AlertDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline">Show Dialog</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your
            account and remove your data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="ghost">Cancel</Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button>Continue</Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
};

export const Destructive: Story = {
  render: () => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Delete Account</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Account</AlertDialogTitle>
          <AlertDialogDescription>
            This action is irreversible. All your data will be permanently deleted
            and you will not be able to recover your account.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="ghost">Cancel</Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button variant="destructive">Yes, delete my account</Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
};

export const WithLongContent: Story = {
  render: () => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button>Terms & Conditions</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Terms & Conditions</AlertDialogTitle>
          <AlertDialogDescription className="max-h-[300px] overflow-y-auto">
            By using our service, you agree to the following terms and conditions.
            This is a legally binding agreement between you and our company. Please
            read these terms carefully before proceeding.
            <br /><br />
            1. You must be at least 18 years old to use our service.
            <br />
            2. You are responsible for maintaining the security of your account.
            <br />
            3. You agree not to use our service for any illegal activities.
            <br />
            4. We reserve the right to terminate your account at any time.
            <br />
            5. Our service is provided &quot;as is&quot; without any warranties.
            <br /><br />
            By clicking &quot;I Agree&quot;, you acknowledge that you have read and understood
            these terms and agree to be bound by them.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="ghost">Decline</Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button>I Agree</Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
};

// Story with ConfirmDialog convenience component
export const ConfirmDialogStory: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    const [lastAction, setLastAction] = useState<string>('');

    return (
      <div className="space-y-4">
        <Button onClick={() => setOpen(true)}>Delete Item</Button>
        {lastAction && (
          <p className="text-sm text-muted-foreground">
            Last action: {lastAction}
          </p>
        )}
        <ConfirmDialog
          open={open}
          onOpenChange={setOpen}
          title="Delete Item"
          description="Are you sure you want to delete this item? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          variant="destructive"
          onConfirm={() => {
            setLastAction('Item deleted');
            setOpen(false);
          }}
        />
      </div>
    );
  },
};

// Story with loading state
export const LoadingState: Story = {
  render: () => {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleConfirm = () => {
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        setOpen(false);
      }, 2000);
    };

    return (
      <div>
        <Button onClick={() => setOpen(true)}>Process Payment</Button>
        <ConfirmDialog
          open={open}
          onOpenChange={setOpen}
          title="Process Payment"
          description="Are you sure you want to process this payment of $99.99?"
          confirmText="Process Payment"
          cancelText="Cancel"
          onConfirm={handleConfirm}
          isLoading={isLoading}
        />
      </div>
    );
  },
};

// Story with interaction test
export const InteractionTest: Story = {
  render: () => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button>Open Dialog</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Action</AlertDialogTitle>
          <AlertDialogDescription>
            This is a test dialog for interaction testing.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="ghost">Cancel</Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button>Confirm</Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Click the trigger button
    const triggerButton = canvas.getByRole('button', { name: 'Open Dialog' });
    await userEvent.click(triggerButton);
    
    // Wait for dialog to appear and check content
    const dialog = await canvas.findByRole('alertdialog');
    expect(dialog).toBeInTheDocument();
    
    // Check dialog title and description
    const title = canvas.getByText('Confirm Action');
    const description = canvas.getByText('This is a test dialog for interaction testing.');
    expect(title).toBeInTheDocument();
    expect(description).toBeInTheDocument();
    
    // Test cancel button
    const cancelButton = canvas.getByRole('button', { name: 'Cancel' });
    await userEvent.click(cancelButton);
    
    // Dialog should be closed
    expect(dialog).not.toBeInTheDocument();
  },
};

// Story with custom styling
export const CustomStyling: Story = {
  render: () => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="secondary">Custom Dialog</Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-purple-900 dark:text-purple-100">
            Special Offer! 🎉
          </AlertDialogTitle>
          <AlertDialogDescription className="text-purple-700 dark:text-purple-300">
            You&apos;ve been selected for a special discount! Would you like to apply
            a 25% discount to your next purchase?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="ghost">Maybe later</Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
              Apply Discount
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
};

// Story demonstrating accessibility
export const AccessibilityFeatures: Story = {
  render: () => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button>Accessible Dialog</Button>
      </AlertDialogTrigger>
      <AlertDialogContent aria-describedby="dialog-description">
        <AlertDialogHeader>
          <AlertDialogTitle id="dialog-title">
            Accessibility Example
          </AlertDialogTitle>
          <AlertDialogDescription id="dialog-description">
            This dialog demonstrates proper ARIA attributes and keyboard navigation.
            Press Tab to navigate between buttons, and Escape to close.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="ghost" aria-label="Cancel the action">
              Cancel
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button aria-label="Confirm the action">
              Confirm
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
  parameters: {
    a11y: {
      config: {
        rules: [
          { id: 'aria-dialog-name', enabled: true },
          { id: 'aria-text', enabled: true },
        ],
      },
    },
  },
};

// Story with multiple actions
export const MultipleActions: Story = {
  render: () => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button>Save Changes</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Save Changes?</AlertDialogTitle>
          <AlertDialogDescription>
            You have unsaved changes. What would you like to do?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel asChild>
            <Button variant="ghost">Don&apos;t Save</Button>
          </AlertDialogCancel>
          <AlertDialogCancel asChild>
            <Button variant="outline">Cancel</Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button>Save Changes</Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
};