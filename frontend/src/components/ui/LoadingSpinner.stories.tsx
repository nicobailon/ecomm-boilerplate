import type { Meta, StoryObj } from '@storybook/react-vite';
import LoadingSpinner from './LoadingSpinner';
import { Button } from './Button';

const meta = {
  title: 'UI/Feedback/LoadingSpinner',
  component: LoadingSpinner,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
## LoadingSpinner Component

The LoadingSpinner component provides visual feedback during asynchronous operations. It indicates that content is being loaded or processed.

### When to use
- Page or route loading states
- Data fetching operations
- File uploads or processing
- Any asynchronous operation that takes noticeable time

### Best practices
- Always include descriptive text for screen readers (using \`sr-only\` class)
- Consider showing loading progress or estimated time for long operations
- Provide context about what is loading when possible
- Use skeleton screens for content-heavy pages instead of spinners
- Avoid multiple spinners on the same screen

### Accessibility notes
- The component includes screen reader text "Loading"
- Consider adding more specific loading messages for context
- Ensure the spinner has sufficient contrast with backgrounds
- Avoid relying solely on animation to convey loading state
        `,
      },
    },
    ...(process.env.CHROMATIC && {
      chromatic: {
        pauseAnimationAtEnd: true,
        delay: 100,
      },
    }),
  },
  tags: ['autodocs'],
} satisfies Meta<typeof LoadingSpinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const CustomSizes: Story = {
  render: () => {
    const SpinnerWithSize = ({ size }: { size: string }) => (
      <div className="flex items-center justify-center p-8">
        <div className="relative">
          <div className={`${size} ${size} border-primary/20 border-2 rounded-full`} />
          <div className={`${size} ${size} border-primary border-t-2 animate-[spin_3s_linear_infinite] rounded-full absolute left-0 top-0`} />
        </div>
      </div>
    );

    return (
      <div className="space-y-8">
        <div>
          <p className="text-sm font-medium mb-2">Small (w-8 h-8)</p>
          <SpinnerWithSize size="w-8 h-8" />
        </div>
        <div>
          <p className="text-sm font-medium mb-2">Medium (w-12 h-12)</p>
          <SpinnerWithSize size="w-12 h-12" />
        </div>
        <div>
          <p className="text-sm font-medium mb-2">Default (w-20 h-20)</p>
          <SpinnerWithSize size="w-20 h-20" />
        </div>
        <div>
          <p className="text-sm font-medium mb-2">Large (w-32 h-32)</p>
          <SpinnerWithSize size="w-32 h-32" />
        </div>
      </div>
    );
  },
};

export const InlineSpinner: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span>Loading content</span>
        <div className="relative">
          <div className="w-4 h-4 border-primary/20 border-2 rounded-full" />
          <div className="w-4 h-4 border-primary border-t-2 animate-spin rounded-full absolute left-0 top-0" />
        </div>
      </div>
      
      <Button disabled className="flex items-center gap-2">
        <div className="relative">
          <div className="w-4 h-4 border-primary-foreground/20 border-2 rounded-full" />
          <div className="w-4 h-4 border-primary-foreground border-t-2 animate-spin rounded-full absolute left-0 top-0" />
        </div>
        Processing...
      </Button>
    </div>
  ),
};

export const WithText: Story = {
  render: () => (
    <div className="flex flex-col items-center justify-center p-16 space-y-4">
      <div className="relative">
        <div className="w-16 h-16 border-primary/20 border-2 rounded-full" />
        <div className="w-16 h-16 border-primary border-t-2 animate-spin rounded-full absolute left-0 top-0" />
      </div>
      <p className="text-sm text-muted-foreground">Loading your data...</p>
    </div>
  ),
};

export const ColorVariants: Story = {
  render: () => {
    const ColoredSpinner = ({ borderColor }: { borderColor: string }) => (
      <div className="relative">
        <div className={`w-12 h-12 ${borderColor}/20 border-2 rounded-full`} />
        <div className={`w-12 h-12 ${borderColor} border-t-2 animate-[spin_2s_linear_infinite] rounded-full absolute left-0 top-0`} />
      </div>
    );

    return (
      <div className="grid grid-cols-3 gap-8">
        <div className="flex flex-col items-center space-y-2">
          <ColoredSpinner borderColor="border-primary" />
          <span className="text-sm">Primary</span>
        </div>
        <div className="flex flex-col items-center space-y-2">
          <ColoredSpinner borderColor="border-success" />
          <span className="text-sm">Success</span>
        </div>
        <div className="flex flex-col items-center space-y-2">
          <ColoredSpinner borderColor="border-destructive" />
          <span className="text-sm">Destructive</span>
        </div>
        <div className="flex flex-col items-center space-y-2">
          <ColoredSpinner borderColor="border-warning" />
          <span className="text-sm">Warning</span>
        </div>
        <div className="flex flex-col items-center space-y-2">
          <ColoredSpinner borderColor="border-info" />
          <span className="text-sm">Info</span>
        </div>
        <div className="flex flex-col items-center space-y-2">
          <ColoredSpinner borderColor="border-muted-foreground" />
          <span className="text-sm">Muted</span>
        </div>
      </div>
    );
  },
};

export const LoadingStates: Story = {
  render: () => {
    const [loading, setLoading] = React.useState(false);
    const [data, setData] = React.useState<string | null>(null);

    const handleLoad = () => {
      setLoading(true);
      setData(null);
      
      setTimeout(() => {
        setLoading(false);
        setData('Data loaded successfully!');
      }, 2000);
    };

    return (
      <div className="space-y-4 p-8">
        <Button onClick={handleLoad} disabled={loading}>
          {loading ? 'Loading...' : 'Load Data'}
        </Button>
        
        <div className="min-h-[200px] border rounded-lg p-4">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="relative">
                <div className="w-12 h-12 border-primary/20 border-2 rounded-full" />
                <div className="w-12 h-12 border-primary border-t-2 animate-spin rounded-full absolute left-0 top-0" />
                <div className="sr-only">Loading data</div>
              </div>
            </div>
          ) : data ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-success">{data}</p>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Click the button to load data</p>
            </div>
          )}
        </div>
      </div>
    );
  },
};

export const CardLoading: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="border rounded-lg p-6">
          <div className="flex items-center justify-center h-32">
            <div className="relative">
              <div className="w-10 h-10 border-primary/20 border-2 rounded-full" />
              <div className="w-10 h-10 border-primary border-t-2 animate-spin rounded-full absolute left-0 top-0" />
            </div>
          </div>
          <p className="text-center text-sm text-muted-foreground mt-2">
            Loading item {i}...
          </p>
        </div>
      ))}
    </div>
  ),
};

export const FullPageSpinner: Story = {
  parameters: {
    layout: 'fullscreen',
  },
  render: () => <LoadingSpinner />,
};

export const CustomAnimation: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-medium mb-2">Pulse Animation</p>
        <div className="flex items-center justify-center p-8">
          <div className="w-12 h-12 bg-primary rounded-full animate-pulse" />
        </div>
      </div>
      
      <div>
        <p className="text-sm font-medium mb-2">Bounce Animation</p>
        <div className="flex items-center justify-center p-8 gap-2">
          <div className="w-3 h-3 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
          <div className="w-3 h-3 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
          <div className="w-3 h-3 bg-primary rounded-full animate-bounce" />
        </div>
      </div>
      
      <div>
        <p className="text-sm font-medium mb-2">Custom Spin Speed</p>
        <div className="flex items-center justify-center p-8">
          <div className="relative">
            <div className="w-12 h-12 border-primary/20 border-2 rounded-full" />
            <div className="w-12 h-12 border-primary border-t-2 rounded-full absolute left-0 top-0 animate-[spin_0.5s_linear_infinite]" />
          </div>
        </div>
      </div>
    </div>
  ),
};

import React from 'react';