import type { Meta, StoryObj } from '@storybook/react-vite';
import { within, expect, userEvent } from '@storybook/test';
import { Drawer } from './Drawer';
import { Button } from './Button';
import { Input } from './Input';
import { Label } from './Label';
import { Textarea } from './Textarea';
import { scrollableSections, cartItems } from '@/stories/data/mock-data';

const meta = {
  title: 'UI/Navigation/Drawer',
  component: Drawer,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
## Drawer Component

The Drawer component provides a sliding panel overlay that emerges from the edge of the screen. It's useful for navigation menus, forms, or detailed content that temporarily takes focus.

### When to use
- Mobile navigation menus
- Filter panels in e-commerce
- Settings or configuration panels
- Shopping carts
- Detailed information panels

### Best practices
- Use drawers for temporary tasks that don't require a full page
- Provide a clear way to close the drawer (close button and overlay click)
- Keep drawer content focused and relevant
- Consider the drawer direction based on your UI layout
- Ensure drawer content is accessible via keyboard navigation

### Accessibility notes
- The drawer traps focus when open
- Escape key closes the drawer
- Screen readers announce the drawer title and description
- Focus returns to the trigger element when closed
- Background content is inert when drawer is open
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: 'Whether the drawer is open',
    },
    onClose: {
      action: 'onClose',
      description: 'Callback when the drawer should close',
    },
    title: {
      control: 'text',
      description: 'Title displayed at the top of the drawer',
    },
    description: {
      control: 'text',
      description: 'Description text below the title',
    },
    side: {
      control: 'select',
      options: ['left', 'right'],
      description: 'Which side the drawer slides from',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
  args: {
    isOpen: false,
    side: 'right',
    title: 'Drawer Title',
  },
} satisfies Meta<typeof Drawer>;

export default meta;
type Story = StoryObj<typeof meta>;

const DrawerDemo = ({ side = 'right', content }: { side?: 'left' | 'right', content?: React.ReactNode }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      <div className="p-8">
        <Button onClick={() => setIsOpen(true)}>
          Open {side} drawer
        </Button>
      </div>
      <Drawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Example Drawer"
        description="This is a drawer component"
        side={side}
      >
        {content || (
          <div className="space-y-4">
            <p>This is the drawer content.</p>
            <Button onClick={() => setIsOpen(false)}>Close Drawer</Button>
          </div>
        )}
      </Drawer>
    </>
  );
};

export const Default: Story = {
  args: {
    isOpen: false,
    onClose: () => { console.log('Drawer closed'); },
    children: <div />,
  },
  render: () => <DrawerDemo />,
};

export const LeftSide: Story = {
  args: {
    isOpen: false,
    onClose: () => { console.log('Drawer closed'); },
    children: <div />,
  },
  render: () => <DrawerDemo side="left" />,
};

export const NavigationExample: Story = {
  args: {
    isOpen: false,
    onClose: () => { console.log('Drawer closed'); },
    children: <div />,
  },
  render: () => {
    const [isOpen, setIsOpen] = React.useState(false);
    
    return (
      <>
        <div className="p-8">
          <Button onClick={() => setIsOpen(true)} variant="outline">
            ☰ Menu
          </Button>
        </div>
        <Drawer
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Navigation"
          side="left"
        >
          <nav className="space-y-2">
            <a href="#" className="block px-4 py-2 rounded-md hover:bg-accent">Home</a>
            <a href="#" className="block px-4 py-2 rounded-md hover:bg-accent">Products</a>
            <a href="#" className="block px-4 py-2 rounded-md hover:bg-accent">About</a>
            <a href="#" className="block px-4 py-2 rounded-md hover:bg-accent">Contact</a>
            <hr className="my-4" />
            <a href="#" className="block px-4 py-2 rounded-md hover:bg-accent">Settings</a>
            <a href="#" className="block px-4 py-2 rounded-md hover:bg-accent">Help</a>
          </nav>
        </Drawer>
      </>
    );
  },
};

export const FormExample: Story = {
  args: {
    isOpen: false,
    onClose: () => { console.log('Drawer closed'); },
    children: <div />,
  },
  render: () => {
    const [isOpen, setIsOpen] = React.useState(false);
    
    return (
      <>
        <div className="p-8">
          <Button onClick={() => setIsOpen(true)}>
            Edit Profile
          </Button>
        </div>
        <Drawer
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Edit Profile"
          description="Update your profile information"
        >
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="John Doe" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="john@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea id="bio" placeholder="Tell us about yourself..." rows={4} />
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="submit" onClick={() => setIsOpen(false)}>
                Save Changes
              </Button>
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Drawer>
      </>
    );
  },
};

export const ShoppingCartExample: Story = {
  args: {
    isOpen: false,
    onClose: () => { console.log('Drawer closed'); },
    children: <div />,
  },
  render: () => {
    const [isOpen, setIsOpen] = React.useState(false);
    
    return (
      <>
        <div className="p-8">
          <Button onClick={() => setIsOpen(true)}>
            🛒 Cart (3)
          </Button>
        </div>
        <Drawer
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Shopping Cart"
          description="3 items in your cart"
        >
          <div className="space-y-4">
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="flex gap-4 p-4 border rounded-lg">
                  <div className="w-16 h-16 bg-muted rounded" />
                  <div className="flex-1">
                    <h4 className="font-medium">{item.name}</h4>
                    <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                  </div>
                  <p className="font-medium">{item.price}</p>
                </div>
              ))}
            </div>
            <div className="border-t pt-4">
              <div className="flex justify-between mb-4">
                <span className="font-medium">Total</span>
                <span className="font-medium">$299.97</span>
              </div>
              <Button className="w-full">Checkout</Button>
            </div>
          </div>
        </Drawer>
      </>
    );
  },
};

export const InteractiveTest: Story = {
  args: {
    isOpen: false,
    onClose: () => { console.log('Drawer closed'); },
    children: <div />,
  },
  render: () => <DrawerDemo />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    
    await step('Open drawer by clicking button', async () => {
      const openButton = canvas.getByText('Open right drawer');
      await userEvent.click(openButton);
      
      const title = await canvas.findByText('Example Drawer');
      expect(title).toBeInTheDocument();
    });
    
    await step('Close drawer using close button', async () => {
      const openButton = canvas.getByText('Open right drawer');
      const closeButton = canvas.getByLabelText('Close');
      await userEvent.click(closeButton);
      
      expect(canvas.queryByText('Example Drawer')).not.toBeInTheDocument();
      
      // Assert focus returns to trigger button
      expect(openButton).toHaveFocus();
    });
    
    await step('Reopen and close with content button', async () => {
      const openButton = canvas.getByText('Open right drawer');
      await userEvent.click(openButton);
      
      const closeButton = await canvas.findByText('Close Drawer');
      await expect(closeButton).toBeInTheDocument();
      await userEvent.click(closeButton);
      
      expect(canvas.queryByText('Example Drawer')).not.toBeInTheDocument();
      
      // Assert focus returns to trigger button again
      expect(openButton).toHaveFocus();
    });
  },
};

export const ScrollableContent: Story = {
  args: {
    isOpen: false,
    onClose: () => { console.log('Drawer closed'); },
    children: <div />,
  },
  render: () => {
    const [isOpen, setIsOpen] = React.useState(false);
    
    return (
      <>
        <div className="p-8">
          <Button onClick={() => setIsOpen(true)}>
            Open Scrollable Drawer
          </Button>
        </div>
        <Drawer
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Long Content"
          description="This drawer contains scrollable content"
        >
          <div className="space-y-4">
            {scrollableSections.map((section) => (
              <div key={section.id} className="p-4 border rounded-lg">
                <h3 className="font-medium">{section.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {section.description}
                </p>
              </div>
            ))}
          </div>
        </Drawer>
      </>
    );
  },
};

export const NoTitleOrDescription: Story = {
  args: {
    isOpen: false,
    onClose: () => { console.log('Drawer closed'); },
    children: <div />,
  },
  render: () => {
    const [isOpen, setIsOpen] = React.useState(false);
    
    return (
      <>
        <div className="p-8">
          <Button onClick={() => setIsOpen(true)}>
            Open Minimal Drawer
          </Button>
        </div>
        <Drawer
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
        >
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Custom Content</h2>
            <p>This drawer has no title or description props.</p>
            <p>The content is completely custom.</p>
          </div>
        </Drawer>
      </>
    );
  },
};

import React from 'react';