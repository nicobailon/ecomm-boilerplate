import type { Meta, StoryObj } from '@storybook/react-vite';
import { within } from '@storybook/test';
import { expect } from 'vitest';
import { Label } from './Label';
import { Input } from './Input';
import { Textarea } from './Textarea';
import { Checkbox } from './Checkbox';

const meta = {
  title: 'UI/Primitives/Label',
  component: Label,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
## Label Component

The Label component provides accessible text labels for form controls. It ensures proper accessibility by creating associations between labels and their corresponding inputs.

### When to use
- With all form inputs (text fields, checkboxes, radio buttons, etc.)
- For any interactive control that needs descriptive text
- When building accessible forms

### Best practices
- Always use labels with form controls for accessibility
- Use the \`htmlFor\` prop to associate labels with specific inputs
- Keep label text concise and descriptive
- Use the \`required\` prop to indicate mandatory fields
- Position labels consistently (above or to the left of inputs)

### Accessibility notes
- Labels are essential for screen reader users
- Clicking a label focuses its associated input
- The \`required\` indicator is visually marked with an asterisk
- Labels inherit disabled state from their peer elements
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    children: {
      control: 'text',
      description: 'The label text content',
    },
    required: {
      control: 'boolean',
      description: 'Shows a red asterisk to indicate required field',
    },
    htmlFor: {
      control: 'text',
      description: 'ID of the form element this label is for',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
  args: {
    children: 'Label text',
  },
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Email address',
  },
};

export const Required: Story = {
  args: {
    children: 'Username',
    required: true,
    htmlFor: 'username-input',
  },
  render: (args) => (
    <div className="space-y-2">
      <Label {...args} />
      <Input id="username-input" placeholder="Enter username" aria-required="true" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByPlaceholderText('Enter username');
    
    // Assert that the input has aria-required attribute
    await expect(input).toHaveAttribute('aria-required', 'true');
  },
};

export const WithInput: Story = {
  render: () => (
    <div className="space-y-2">
      <Label htmlFor="email">Email address</Label>
      <Input id="email" type="email" placeholder="Enter your email" />
    </div>
  ),
};

export const WithTextarea: Story = {
  render: () => (
    <div className="space-y-2">
      <Label htmlFor="bio" required>Bio</Label>
      <Textarea id="bio" placeholder="Tell us about yourself..." rows={4} />
    </div>
  ),
};

export const WithCheckbox: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Checkbox id="terms" />
      <Label htmlFor="terms">
        I agree to the terms and conditions
      </Label>
    </div>
  ),
};

export const FormExample: Story = {
  render: () => (
    <form className="space-y-4 max-w-md">
      <div className="space-y-2">
        <Label htmlFor="name" required>Full Name</Label>
        <Input id="name" placeholder="John Doe" />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email" required>Email</Label>
        <Input id="email" type="email" placeholder="john@example.com" />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input id="phone" type="tel" placeholder="+1 (555) 000-0000" />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="message">Message</Label>
        <Textarea id="message" placeholder="Optional message..." rows={3} />
      </div>
      
      <div className="flex items-center space-x-2">
        <Checkbox id="newsletter" />
        <Label htmlFor="newsletter">
          Send me newsletter updates
        </Label>
      </div>
    </form>
  ),
};

export const DisabledState: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="disabled-input">Disabled Field</Label>
        <Input id="disabled-input" disabled placeholder="This is disabled" />
        <p className="text-sm text-muted-foreground">
          The label automatically adapts to the disabled state of its peer
        </p>
      </div>
    </div>
  ),
};

export const LabelVariations: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <Label>Default Label</Label>
      </div>
      
      <div>
        <Label required>Required Label</Label>
      </div>
      
      <div>
        <Label className="text-lg">Large Label</Label>
      </div>
      
      <div>
        <Label className="text-xs uppercase tracking-wide">Small Uppercase Label</Label>
      </div>
      
      <div>
        <Label className="text-primary">Colored Label</Label>
      </div>
      
      <div>
        <Label className="font-normal">Normal Weight Label</Label>
      </div>
    </div>
  ),
};

export const InlineLabels: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Label htmlFor="inline-1" className="min-w-[100px]">First Name</Label>
        <Input id="inline-1" placeholder="John" />
      </div>
      
      <div className="flex items-center gap-4">
        <Label htmlFor="inline-2" className="min-w-[100px]">Last Name</Label>
        <Input id="inline-2" placeholder="Doe" />
      </div>
      
      <div className="flex items-center gap-4">
        <Label htmlFor="inline-3" className="min-w-[100px]" required>Email</Label>
        <Input id="inline-3" type="email" placeholder="john@example.com" />
      </div>
    </div>
  ),
};

export const WithHelperText: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password" required>Password</Label>
        <Input id="password" type="password" />
        <p className="text-sm text-muted-foreground">
          Must be at least 8 characters long
        </p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input id="username" />
        <p className="text-sm text-muted-foreground">
          This will be your public display name
        </p>
      </div>
    </div>
  ),
};