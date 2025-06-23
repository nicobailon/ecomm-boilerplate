import type { Meta, StoryObj } from '@storybook/react-vite';
import { within } from '@storybook/test';
import { expect } from 'vitest';
import { userEvent } from '@storybook/test';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from './Dialog';
import { Button } from './Button';
import { Input } from './Input';
import { Label } from './Label';
import { Textarea } from './Textarea';

const meta = {
  title: 'UI/Overlay/Dialog',
  component: Dialog,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
## Dialog Component

The Dialog component displays content in a layer above the app, centered on screen. It's ideal for important messages, confirmations, or complex forms that require user attention.

### When to use
- Confirmation dialogs for destructive actions
- Forms that require focused attention
- Important notifications or alerts
- Quick actions that don't need a full page
- Media viewers (image, video previews)

### Best practices
- Keep dialogs focused on a single task
- Provide clear actions (confirm/cancel)
- Use descriptive titles and descriptions
- Avoid nesting dialogs
- Consider mobile responsiveness
- Ensure critical actions are keyboard accessible

### Accessibility notes
- Focus is trapped within the dialog when open
- Escape key closes the dialog
- Focus returns to trigger element when closed
- Screen readers announce dialog content
- Background content is inert while dialog is open
        `,
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Open Dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you sure?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete your account
            and remove your data from our servers.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button variant="destructive">Delete Account</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const FormDialog: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Edit Profile</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" defaultValue="John Doe" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" defaultValue="@johndoe" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea 
              id="bio" 
              placeholder="Tell us about yourself"
              className="resize-none"
              rows={3}
            />
          </div>
        </form>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button type="submit">Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const AlertDialog: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="destructive">Delete Item</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Item</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this item? This action is irreversible.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Keep Item</Button>
          </DialogClose>
          <Button variant="destructive">Delete Forever</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const InformationDialog: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">View Details</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Order Details</DialogTitle>
          <DialogDescription>
            Order #12345 - Placed on December 1, 2023
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Items</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between">
                <span>Product A × 2</span>
                <span>$59.98</span>
              </li>
              <li className="flex justify-between">
                <span>Product B × 1</span>
                <span>$39.99</span>
              </li>
            </ul>
          </div>
          <div className="border-t pt-4">
            <div className="flex justify-between font-medium">
              <span>Total</span>
              <span>$99.97</span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button>Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const CustomWidthDialog: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Open Wide Dialog</Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Wide Dialog</DialogTitle>
          <DialogDescription>
            This dialog has a custom maximum width for displaying more content
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <h4 className="font-medium">Column 1</h4>
            <p className="text-sm text-muted-foreground">
              Content can be arranged in multiple columns when you have more space.
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium">Column 2</h4>
            <p className="text-sm text-muted-foreground">
              This is useful for comparison views or detailed forms.
            </p>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button>Got it</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const ScrollableContent: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Terms & Conditions</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Terms & Conditions</DialogTitle>
          <DialogDescription>
            Please read and accept our terms and conditions
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto max-h-[50vh] space-y-4 pr-2">
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i}>
              <h4 className="font-medium mb-2">Section {i + 1}</h4>
              <p className="text-sm text-muted-foreground">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do 
                eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut 
                enim ad minim veniam, quis nostrud exercitation ullamco laboris.
              </p>
            </div>
          ))}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Decline</Button>
          </DialogClose>
          <Button>Accept</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const InteractiveTest: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Open Test Dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Interactive Test</DialogTitle>
          <DialogDescription>
            This dialog is used for testing interactions
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="test-input">Test Input</Label>
            <Input id="test-input" placeholder="Type something..." />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    
    await step('Open dialog', async () => {
      const trigger = canvas.getByText('Open Test Dialog');
      await userEvent.click(trigger);
      
      const title = await canvas.findByText('Interactive Test');
      await expect(title).toBeInTheDocument();
    });
    
    await step('Interact with form', async () => {
      const input = canvas.getByPlaceholderText('Type something...');
      await userEvent.click(input);
      await userEvent.type(input, 'Test content');
      await expect(input).toHaveValue('Test content');
    });
    
    await step('Close dialog with cancel button', async () => {
      const cancelButton = canvas.getByText('Cancel');
      await userEvent.click(cancelButton);
      
      await expect(canvas.queryByText('Interactive Test')).not.toBeInTheDocument();
    });
    
    await step('Reopen and close with X button', async () => {
      const trigger = canvas.getByText('Open Test Dialog');
      await userEvent.click(trigger);
      
      const closeButton = await canvas.findByLabelText('Close');
      await expect(closeButton).toBeInTheDocument();
      await userEvent.click(closeButton);
      
      await expect(canvas.queryByText('Interactive Test')).not.toBeInTheDocument();
    });
  },
};

export const NestedActions: Story = {
  render: () => {
    const [showConfirm, setShowConfirm] = React.useState(false);
    
    return (
      <>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Open Dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Main Dialog</DialogTitle>
              <DialogDescription>
                This dialog contains an action that shows a confirmation
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <p>Click the button below to see a confirmation message.</p>
              <Button 
                onClick={() => setShowConfirm(true)}
                variant="destructive"
              >
                Delete Item
              </Button>
              {showConfirm && (
                <div className="p-4 border rounded-lg bg-destructive/10">
                  <p className="text-sm font-medium text-destructive">
                    Are you sure? This cannot be undone.
                  </p>
                  <div className="flex gap-2 mt-2">
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => setShowConfirm(false)}
                    >
                      Yes, Delete
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setShowConfirm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button>Close</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  },
};

import React from 'react';