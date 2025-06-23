import type { Meta, StoryObj } from '@storybook/react-vite';
import { Progress } from './Progress';

const meta = {
  title: 'UI/Feedback/Progress',
  component: Progress,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
## Progress Component

The Progress component displays the completion status of a task or process. It provides visual feedback to users about ongoing operations.

### When to use
- Loading states for file uploads
- Multi-step form completion
- Task or process completion tracking
- Download progress indicators

### Best practices
- Always provide an accessible label for screen readers using \`aria-label\` or \`aria-labelledby\`
- Use appropriate variants to match the context (success for completed, warning for issues, etc.)
- Consider showing percentage text alongside the progress bar for clarity
- Animate value changes smoothly for better user experience

### Accessibility notes
- The component uses \`role="progressbar"\` with proper ARIA attributes
- Ensure the progress value is announced to screen readers when it updates
- Provide context about what is being loaded or processed
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
      description: 'The progress value from 0 to 100',
    },
    variant: {
      control: 'select',
      options: ['default', 'success', 'warning', 'destructive'],
      description: 'Visual variant of the progress bar',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes for the root element',
    },
    indicatorClassName: {
      control: 'text',
      description: 'Additional CSS classes for the indicator element',
    },
  },
  args: {
    value: 50,
    variant: 'default',
  },
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    value: 66,
    'aria-label': 'Loading progress',
    'aria-valuemin': 0,
    'aria-valuemax': 100,
    'aria-valuenow': 66,
    'aria-valuetext': '66 percent',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium">Default</label>
        <Progress value={75} variant="default" aria-label="Default progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={75} aria-valuetext="75 percent" />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Success</label>
        <Progress value={100} variant="success" aria-label="Success progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={100} aria-valuetext="100 percent complete" />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Warning</label>
        <Progress value={60} variant="warning" aria-label="Warning progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={60} aria-valuetext="60 percent" />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Destructive</label>
        <Progress value={30} variant="destructive" aria-label="Error progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={30} aria-valuetext="30 percent" />
      </div>
    </div>
  ),
};

export const ProgressStates: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Not started</span>
          <span>0%</span>
        </div>
        <Progress value={0} aria-label="Not started" aria-valuemin={0} aria-valuemax={100} aria-valuenow={0} aria-valuetext="0 percent, not started" />
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>In progress</span>
          <span>45%</span>
        </div>
        <Progress value={45} aria-label="45% complete" aria-valuemin={0} aria-valuemax={100} aria-valuenow={45} aria-valuetext="45 percent complete" />
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Almost done</span>
          <span>90%</span>
        </div>
        <Progress value={90} variant="warning" aria-label="90% complete" aria-valuemin={0} aria-valuemax={100} aria-valuenow={90} aria-valuetext="90 percent complete, almost done" />
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Complete</span>
          <span>100%</span>
        </div>
        <Progress value={100} variant="success" aria-label="Complete" aria-valuemin={0} aria-valuemax={100} aria-valuenow={100} aria-valuetext="100 percent, complete" />
      </div>
    </div>
  ),
};

export const WithLabels: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">File Upload Progress</h3>
        <div className="space-y-1">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Uploading document.pdf</span>
            <span>2.4MB / 5.2MB</span>
          </div>
          <Progress value={46} aria-label="Upload 46% complete" aria-valuemin={0} aria-valuemax={100} aria-valuenow={46} aria-valuetext="46 percent uploaded, 2.4 megabytes of 5.2 megabytes" />
          <p className="text-xs text-muted-foreground">46% • About 30 seconds remaining</p>
        </div>
      </div>
    </div>
  ),
};

export const CustomStyling: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium">Custom height</label>
        <Progress value={60} className="h-4" aria-label="Custom height progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={60} aria-valuetext="60 percent" />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Custom colors with gradient</label>
        <Progress 
          value={75} 
          className="h-3" 
          indicatorClassName="bg-gradient-to-r from-blue-500 to-purple-500"
          aria-label="Custom gradient progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={75}
          aria-valuetext="75 percent"
        />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Rounded none</label>
        <Progress value={50} className="rounded-none" aria-label="Square progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={50} aria-valuetext="50 percent" />
      </div>
    </div>
  ),
};

export const AnimatedProgress: Story = {
  render: function AnimatedProgressStory() {
    const [progress, setProgress] = React.useState(0);

    React.useEffect(() => {
      const timer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(timer);
            return 100;
          }
          return prev + 2;
        });
      }, 100);

      return () => clearInterval(timer);
    }, []);

    return (
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Processing...</span>
          <span>{progress}%</span>
        </div>
        <Progress 
          value={progress} 
          variant={progress === 100 ? 'success' : 'default'}
          aria-label={`Processing ${progress}% complete`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          aria-valuetext={`${progress} percent${progress === 100 ? ' complete' : ''}`}
        />
        {progress === 100 && (
          <p className="text-sm text-success">✓ Processing complete!</p>
        )}
      </div>
    );
  },
};

import React from 'react';