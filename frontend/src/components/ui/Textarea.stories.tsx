import type { Meta, StoryObj } from '@storybook/react-vite';
import { within } from '@storybook/test';
import { expect } from 'vitest';
import { userEvent } from '@storybook/test';
import { Textarea } from './Textarea';

const meta = {
  title: 'UI/Primitives/Textarea',
  component: Textarea,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
## Textarea Component

The Textarea component is a multi-line text input field that allows users to enter longer form text content.

### When to use
- Collecting feedback or comments
- Message composition
- Description fields
- Any input requiring multiple lines of text

### Best practices
- Always provide a label for accessibility (either through the \`label\` prop or an associated \`<label>\` element)
- Set appropriate \`rows\` attribute for expected content length
- Use \`maxLength\` when character limits are important
- Provide helpful placeholder text
- Show character count for limited inputs
- Use the \`error\` prop to display validation messages

### Accessibility notes
- The component automatically associates the label with the textarea
- Error messages are announced to screen readers
- Ensure proper keyboard navigation is maintained
- Use \`aria-describedby\` for additional help text
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: 'Label text displayed above the textarea',
    },
    error: {
      control: 'text',
      description: 'Error message displayed below the textarea',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text shown when empty',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the textarea is disabled',
    },
    rows: {
      control: { type: 'number', min: 1, max: 20 },
      description: 'Number of visible text rows',
    },
    maxLength: {
      control: 'number',
      description: 'Maximum character length',
    },
  },
  args: {
    placeholder: 'Type your message here...',
    rows: 4,
  },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: 'Enter your text here...',
  },
};

export const WithLabel: Story = {
  args: {
    label: 'Message',
    placeholder: 'Type your message...',
  },
};

export const WithError: Story = {
  args: {
    label: 'Description',
    error: 'Description is required',
    placeholder: 'Enter a description...',
  },
};

export const Disabled: Story = {
  args: {
    label: 'Comments',
    placeholder: 'Comments are disabled',
    disabled: true,
    value: 'This field is currently disabled',
  },
};

export const DifferentSizes: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium mb-2">Small (2 rows)</p>
        <Textarea rows={2} placeholder="Compact textarea..." />
      </div>
      <div>
        <p className="text-sm font-medium mb-2">Medium (4 rows)</p>
        <Textarea rows={4} placeholder="Standard textarea..." />
      </div>
      <div>
        <p className="text-sm font-medium mb-2">Large (8 rows)</p>
        <Textarea rows={8} placeholder="Extended textarea..." />
      </div>
    </div>
  ),
};

export const WithCharacterCount: Story = {
  render: function CharacterCountStory() {
    const [value, setValue] = React.useState('');
    const maxLength = 200;

    return (
      <div className="space-y-2">
        <Textarea
          label="Bio"
          placeholder="Tell us about yourself..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={maxLength}
          rows={4}
        />
        <p className="text-sm text-muted-foreground text-right">
          {value.length}/{maxLength} characters
        </p>
      </div>
    );
  },
};

export const FormExample: Story = {
  render: () => (
    <form className="space-y-4 max-w-md">
      <Textarea
        label="Feedback"
        placeholder="Share your thoughts..."
        rows={5}
        required
      />
      <Textarea
        label="Additional Comments (Optional)"
        placeholder="Any other comments?"
        rows={3}
      />
      <button
        type="submit"
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        onClick={(e) => e.preventDefault()}
      >
        Submit Feedback
      </button>
    </form>
  ),
};

export const ValidationStates: Story = {
  render: () => (
    <div className="space-y-4">
      <Textarea
        label="Valid Input"
        value="This is valid content"
        className="border-green-500 focus-visible:ring-green-500"
      />
      <Textarea
        label="With Warning"
        value="Almost at character limit..."
        className="border-yellow-500 focus-visible:ring-yellow-500"
      />
      <Textarea
        label="With Error"
        error="Please provide more detail (minimum 50 characters)"
        value="Too short"
      />
    </div>
  ),
};

export const InteractiveTest: Story = {
  args: {
    label: 'Test Input',
    placeholder: 'Type something to test...',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    const textarea = canvas.getByPlaceholderText('Type something to test...');
    
    await userEvent.click(textarea);
    await expect(textarea).toHaveFocus();
    
    await userEvent.type(textarea, 'Hello, this is a test message!');
    await expect(textarea).toHaveValue('Hello, this is a test message!');
    
    await userEvent.clear(textarea);
    await expect(textarea).toHaveValue('');
    
    await userEvent.type(textarea, 'New content');
    await expect(textarea).toHaveValue('New content');
  },
};

export const ResizeBehavior: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium mb-2">Resize: Vertical (default)</p>
        <Textarea placeholder="You can resize this vertically..." />
      </div>
      <div>
        <p className="text-sm font-medium mb-2">Resize: None</p>
        <Textarea placeholder="Fixed size textarea..." className="resize-none" />
      </div>
      <div>
        <p className="text-sm font-medium mb-2">Resize: Both</p>
        <Textarea placeholder="Resize in any direction..." className="resize" />
      </div>
    </div>
  ),
};

import React from 'react';