import type { Meta, StoryObj } from '@storybook/react-vite';
import { within, expect, userEvent } from '@storybook/test';
import { Input } from '../Input';

const meta = {
  title: 'UI/Primitives/Input',
  component: Input,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'tel', 'url', 'search'],
    },
    disabled: {
      control: 'boolean',
    },
    label: {
      control: 'text',
    },
    error: {
      control: 'text',
    },
    placeholder: {
      control: 'text',
    },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    type: 'email',
    placeholder: 'Enter your email',
  },
};

export const WithLabel: Story = {
  args: {
    label: 'Email Address',
    type: 'email',
    placeholder: 'name@example.com',
  },
};

export const WithError: Story = {
  args: {
    label: 'Email Address',
    type: 'email',
    placeholder: 'name@example.com',
    error: 'Please enter a valid email address',
    defaultValue: 'invalid-email',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Email Address',
    type: 'email',
    placeholder: 'name@example.com',
    disabled: true,
    defaultValue: 'user@example.com',
  },
};

export const Password: Story = {
  args: {
    label: 'Password',
    type: 'password',
    placeholder: 'Enter your password',
  },
};

export const Search: Story = {
  args: {
    type: 'search',
    placeholder: 'Search products...',
  },
};

export const Number: Story = {
  args: {
    label: 'Quantity',
    type: 'number',
    placeholder: '0',
    min: 0,
    max: 100,
  },
};

// Story with interaction test
export const WithInteractionTest: Story = {
  args: {
    placeholder: 'Type something...',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByPlaceholderText('Type something...');

    // Test that input is initially empty
    void expect(input).toHaveValue('');

    // Type into the input
    await userEvent.type(input, 'Hello Storybook!');

    // Verify the typed value
    void expect(input).toHaveValue('Hello Storybook!');

    // Clear the input
    await userEvent.clear(input);
    void expect(input).toHaveValue('');
  },
};

// Story with validation test
export const EmailValidation: Story = {
  args: {
    type: 'email',
    placeholder: 'Enter your email',
    required: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByPlaceholderText('Enter your email');

    // Test invalid email
    await userEvent.type(input, 'invalid-email');
    void expect((input as HTMLInputElement).validity.valid).toBe(false);

    // Clear and test valid email
    await userEvent.clear(input);
    await userEvent.type(input, 'valid@email.com');
    void expect((input as HTMLInputElement).validity.valid).toBe(true);
  },
};

// Story testing disabled state interaction
export const DisabledInteraction: Story = {
  args: {
    placeholder: 'Cannot type here',
    disabled: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByPlaceholderText('Cannot type here');

    // Verify disabled state
    void expect(input).toBeDisabled();

    // Try to type (should not change value)
    await userEvent.type(input, 'This should not appear');
    void expect(input).toHaveValue('');
  },
};

// Story with form context
export const InForm: Story = {
  render: () => (
    <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
      <div>
        <label htmlFor="username" className="block text-sm font-medium mb-1">
          Username
        </label>
        <Input
          id="username"
          name="username"
          placeholder="Enter username"
          required
          minLength={3}
        />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          Email
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="email@example.com"
          required
        />
      </div>
      <button
        type="submit"
        className="px-4 py-2 bg-primary text-primary-foreground rounded"
      >
        Submit
      </button>
    </form>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Get form elements
    const usernameInput = canvas.getByLabelText('Username');
    const emailInput = canvas.getByLabelText('Email');
    const submitButton = canvas.getByRole('button', { name: 'Submit' });

    // Test form validation
    await userEvent.click(submitButton);
    
    // Inputs should be invalid (required)
    void expect(usernameInput).toBeInvalid();
    void expect(emailInput).toBeInvalid();

    // Fill in valid data
    await userEvent.type(usernameInput, 'johndoe');
    await userEvent.type(emailInput, 'john@example.com');

    // Inputs should now be valid
    void expect(usernameInput).toBeValid();
    void expect(emailInput).toBeValid();
  },
};

// Story with copy-paste test
export const CopyPasteTest: Story = {
  args: {
    placeholder: 'Copy and paste here',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByPlaceholderText('Copy and paste here');

    // Type some text
    await userEvent.type(input, 'Text to copy');
    
    // Select all and copy
    await userEvent.click(input);
    await userEvent.keyboard('{Control>}a{/Control}');
    await userEvent.keyboard('{Control>}c{/Control}');
    
    // Clear and paste
    await userEvent.clear(input);
    await userEvent.keyboard('{Control>}v{/Control}');
    
    // Verify pasted content
    void expect(input).toHaveValue('Text to copy');
  },
};

export const AllStates: Story = {
  render: () => (
    <div className="w-80 space-y-6">
      <div>
        <h3 className="mb-4 text-lg font-semibold">Input Types</h3>
        <div className="space-y-4">
          <Input
            label="Text Input"
            type="text"
            placeholder="Enter text"
          />
          <Input
            label="Email Input"
            type="email"
            placeholder="name@example.com"
          />
          <Input
            label="Password Input"
            type="password"
            placeholder="Enter password"
          />
          <Input
            label="Number Input"
            type="number"
            placeholder="0"
            min={0}
            max={100}
          />
          <Input
            label="Search Input"
            type="search"
            placeholder="Search..."
          />
        </div>
      </div>
      
      <div>
        <h3 className="mb-4 text-lg font-semibold">Input States</h3>
        <div className="space-y-4">
          <Input
            label="Normal State"
            type="text"
            placeholder="Normal input"
          />
          <Input
            label="With Value"
            type="text"
            defaultValue="This input has a value"
          />
          <Input
            label="Error State"
            type="email"
            placeholder="name@example.com"
            error="This field is required"
            defaultValue="invalid"
          />
          <Input
            label="Disabled State"
            type="text"
            placeholder="Disabled input"
            disabled
            defaultValue="Cannot edit this"
          />
        </div>
      </div>
      
      <div>
        <h3 className="mb-4 text-lg font-semibold">Without Labels</h3>
        <div className="space-y-4">
          <Input
            type="text"
            placeholder="Text input without label"
          />
          <Input
            type="email"
            placeholder="Email without label"
            error="Error message appears below"
          />
        </div>
      </div>
    </div>
  ),
};

export const ValidationStates: Story = {
  render: () => (
    <div className="w-80 space-y-6">
      <h3 className="text-lg font-semibold">Validation States</h3>
      <div className="space-y-4">
        <Input
          label="Valid Email"
          type="email"
          defaultValue="user@example.com"
          className="border-success focus-visible:ring-success"
        />
        <Input
          label="Invalid Email"
          type="email"
          defaultValue="invalid-email"
          error="Please enter a valid email address"
        />
        <Input
          label="Required Field"
          type="text"
          error="This field is required"
          aria-invalid="true"
          aria-describedby="error-required"
        />
        <div id="error-required" className="sr-only">
          This field is required and must be filled out
        </div>
      </div>
    </div>
  ),
  parameters: {
    a11y: {
      config: {
        rules: [
          { id: 'color-contrast', enabled: true },
          { id: 'label', enabled: true },
        ],
      },
    },
  },
};

// Story with label accessibility test and play function
export const WithLabelInteraction: Story = {
  render: (args) => (
    <div className="space-y-2">
      <label htmlFor="test-input" className="text-sm font-medium">
        Full Name
      </label>
      <Input id="test-input" {...args} />
    </div>
  ),
  args: {
    placeholder: 'John Doe',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Test that label is properly associated
    const label = canvas.getByText('Full Name');
    const input = canvas.getByPlaceholderText('John Doe');
    
    // Click label should focus input
    await userEvent.click(label);
    void expect(input).toHaveFocus();
  },
};

export const AccessibilityFeatures: Story = {
  render: () => (
    <div className="w-80 space-y-6">
      <h3 className="text-lg font-semibold">Accessibility Features</h3>
      <div className="space-y-4">
        <Input
          label="Username"
          type="text"
          placeholder="Enter username"
          aria-label="Username input"
          aria-required="true"
          autoComplete="username"
        />
        <Input
          label="Password"
          type="password"
          placeholder="Enter password"
          aria-label="Password input"
          aria-required="true"
          autoComplete="current-password"
        />
        <Input
          label="Search"
          type="search"
          placeholder="Search products..."
          aria-label="Search products"
          role="searchbox"
        />
        <Input
          label="Quantity"
          type="number"
          defaultValue="1"
          min={1}
          max={99}
          aria-label="Product quantity"
          aria-valuemin={1}
          aria-valuemax={99}
          aria-valuenow={1}
        />
      </div>
    </div>
  ),
};

export const ResponsiveInputs: Story = {
  render: () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Responsive Input Layouts</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="First Name"
          type="text"
          placeholder="John"
        />
        <Input
          label="Last Name"
          type="text"
          placeholder="Doe"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input
          label="City"
          type="text"
          placeholder="New York"
        />
        <Input
          label="State"
          type="text"
          placeholder="NY"
        />
        <Input
          label="Zip Code"
          type="text"
          placeholder="10001"
        />
      </div>
    </div>
  ),
  parameters: {
    viewport: {
      defaultViewport: 'mobile',
    },
  },
};