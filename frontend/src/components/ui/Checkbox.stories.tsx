import type { Meta, StoryObj } from '@storybook/react-vite';
import { within } from '@storybook/test';
import { expect } from 'vitest';
import { userEvent } from '@storybook/test';
import { useState } from 'react';
import { Checkbox } from './Checkbox';

const meta = {
  title: 'UI/Primitives/Checkbox',
  component: Checkbox,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A form control that allows users to select one or more options from a set. Supports indeterminate state and follows ARIA checkbox patterns with proper labeling.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    checked: {
      control: 'boolean',
    },
    disabled: {
      control: 'boolean',
    },
    defaultChecked: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const Checked: Story = {
  args: {
    defaultChecked: true,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const DisabledChecked: Story = {
  args: {
    disabled: true,
    defaultChecked: true,
  },
};

// Interactive checkbox with label
export const WithLabel: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Checkbox id="terms" />
      <label
        htmlFor="terms"
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        Accept terms and conditions
      </label>
    </div>
  ),
};

// Controlled checkbox with state
export const Controlled: Story = {
  render: () => {
    const [checked, setChecked] = useState(false);

    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="controlled"
            checked={checked}
            onCheckedChange={setChecked}
          />
          <label htmlFor="controlled" className="text-sm font-medium">
            Subscribe to newsletter
          </label>
        </div>
        <p className="text-sm text-muted-foreground">
          Checkbox is {checked ? 'checked' : 'unchecked'}
        </p>
      </div>
    );
  },
};

// Multiple checkboxes
export const MultipleCheckboxes: Story = {
  render: () => {
    const [selectedItems, setSelectedItems] = useState<string[]>([]);

    const items = [
      { id: 'react', label: 'React' },
      { id: 'vue', label: 'Vue' },
      { id: 'angular', label: 'Angular' },
      { id: 'svelte', label: 'Svelte' },
    ];

    const handleCheckedChange = (id: string, checked: boolean) => {
      if (checked) {
        setSelectedItems([...selectedItems, id]);
      } else {
        setSelectedItems(selectedItems.filter(item => item !== id));
      }
    };

    return (
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Select your favorite frameworks:</h3>
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id} className="flex items-center space-x-2">
              <Checkbox
                id={item.id}
                checked={selectedItems.includes(item.id)}
                onCheckedChange={(checked) => handleCheckedChange(item.id, checked)}
              />
              <label htmlFor={item.id} className="text-sm font-medium">
                {item.label}
              </label>
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground">
          Selected: {selectedItems.join(', ') || 'None'}
        </p>
      </div>
    );
  },
};

// Checkbox with interaction test
export const InteractionTest: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Checkbox id="test-checkbox" />
      <label htmlFor="test-checkbox" className="text-sm font-medium">
        Click me
      </label>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Get checkbox
    const checkbox = canvas.getByRole('checkbox');
    
    // Initially unchecked
    await expect(checkbox).not.toBeChecked();
    
    // Click to check
    await userEvent.click(checkbox);
    await expect(checkbox).toBeChecked();
    
    // Click to uncheck
    await userEvent.click(checkbox);
    await expect(checkbox).not.toBeChecked();
    
    // Test clicking the label
    const label = canvas.getByText('Click me');
    await userEvent.click(label);
    await expect(checkbox).toBeChecked();
    
    // Verify checkbox has focus after label click (proper htmlFor/id wiring)
    await expect(checkbox).toHaveFocus();
  },
};

// Form with required checkbox
export const InForm: Story = {
  render: () => {
    const [formSubmitted, setFormSubmitted] = useState(false);
    const [agreed, setAgreed] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (agreed) {
        setFormSubmitted(true);
      }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Newsletter Signup</h3>
          <input
            type="email"
            placeholder="Enter your email"
            className="w-full px-3 py-2 border rounded-md"
            required
          />
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="agree"
            checked={agreed}
            onCheckedChange={setAgreed}
            required
          />
          <label htmlFor="agree" className="text-sm">
            I agree to receive marketing emails
          </label>
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50"
          disabled={!agreed}
        >
          Subscribe
        </button>
        {formSubmitted && (
          <p className="text-sm text-green-600">Successfully subscribed!</p>
        )}
      </form>
    );
  },
};

// Indeterminate state (visual example)
export const IndeterminateState: Story = {
  render: () => {
    const [parentChecked, setParentChecked] = useState(false);
    const [childStates, setChildStates] = useState({
      option1: false,
      option2: true,
      option3: false,
    });

    const someChecked = Object.values(childStates).some(Boolean);
    const allChecked = Object.values(childStates).every(Boolean);
    
    const handleParentChange = (checked: boolean) => {
      setParentChecked(checked);
      setChildStates({
        option1: checked,
        option2: checked,
        option3: checked,
      });
    };

    const handleChildChange = (key: keyof typeof childStates, checked: boolean) => {
      const newStates = { ...childStates, [key]: checked };
      setChildStates(newStates);
      
      const newAllChecked = Object.values(newStates).every(Boolean);
      setParentChecked(newAllChecked);
    };

    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="parent"
            checked={parentChecked}
            onCheckedChange={handleParentChange}
            className={someChecked && !allChecked ? 'opacity-50' : ''}
          />
          <label htmlFor="parent" className="text-sm font-medium">
            Select All {someChecked && !allChecked && '(Mixed)'}
          </label>
        </div>
        <div className="ml-6 space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="child1"
              checked={childStates.option1}
              onCheckedChange={(checked) => handleChildChange('option1', checked)}
            />
            <label htmlFor="child1" className="text-sm">Option 1</label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="child2"
              checked={childStates.option2}
              onCheckedChange={(checked) => handleChildChange('option2', checked)}
            />
            <label htmlFor="child2" className="text-sm">Option 2</label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="child3"
              checked={childStates.option3}
              onCheckedChange={(checked) => handleChildChange('option3', checked)}
            />
            <label htmlFor="child3" className="text-sm">Option 3</label>
          </div>
        </div>
      </div>
    );
  },
};

// Accessibility focused example
export const AccessibilityFeatures: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Checkbox
          id="a11y-required"
          aria-required="true"
          aria-label="Required checkbox"
        />
        <label htmlFor="a11y-required" className="text-sm font-medium">
          Required field <span className="text-red-500">*</span>
        </label>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox
          id="a11y-described"
          aria-describedby="checkbox-description"
        />
        <label htmlFor="a11y-described" className="text-sm font-medium">
          With description
        </label>
      </div>
      <p id="checkbox-description" className="text-xs text-muted-foreground ml-6">
        This checkbox has additional descriptive text for screen readers
      </p>
      <div className="flex items-center space-x-2">
        <Checkbox
          id="a11y-invalid"
          aria-invalid="true"
          aria-errormessage="checkbox-error"
        />
        <label htmlFor="a11y-invalid" className="text-sm font-medium text-red-600">
          Invalid selection
        </label>
      </div>
      <p id="checkbox-error" className="text-xs text-red-600 ml-6">
        This selection is required
      </p>
    </div>
  ),
  parameters: {
    a11y: {
      config: {
        rules: [
          { id: 'checkbox-name', enabled: true },
          { id: 'label', enabled: true },
        ],
      },
    },
  },
};

// Different sizes example
export const DifferentSizes: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Checkbox id="small" className="h-3 w-3" />
        <label htmlFor="small" className="text-xs">Small checkbox</label>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox id="medium" className="h-4 w-4" />
        <label htmlFor="medium" className="text-sm">Medium checkbox (default)</label>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox id="large" className="h-5 w-5" />
        <label htmlFor="large" className="text-base">Large checkbox</label>
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox id="xlarge" className="h-6 w-6" />
        <label htmlFor="xlarge" className="text-lg">Extra large checkbox</label>
      </div>
    </div>
  ),
};