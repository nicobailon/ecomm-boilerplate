import type { Meta, StoryObj } from '@storybook/react-vite';
import { ErrorBoundary } from './ErrorBoundary';
import { Button } from './ui/Button';
import { useState } from 'react';

const meta = {
  title: 'Components/ErrorBoundary',
  component: ErrorBoundary,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ErrorBoundary>;

export default meta;
type Story = StoryObj<typeof meta>;

const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('This is a test error thrown by the component');
  }
  return <div>Component is working normally</div>;
};

export const Default: Story = {
  args: {
    children: (
      <div className="p-4 border rounded">
        <h3 className="text-lg font-semibold mb-2">Protected Component</h3>
        <p>This component is wrapped in an ErrorBoundary</p>
      </div>
    ),
  },
};

export const WithError: Story = {
  args: {
    children: <ThrowError shouldThrow={true} />,
  },
};

const InteractiveErrorComponent = () => {
  const [hasError, setHasError] = useState(false);
  const [key, setKey] = useState(0);

  const reset = () => {
    setHasError(false);
    setKey(prev => prev + 1);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          onClick={() => setHasError(true)}
          variant="destructive"
        >
          Trigger Error
        </Button>
        <Button
          onClick={reset}
          variant="secondary"
        >
          Reset
        </Button>
      </div>
      
      <ErrorBoundary key={key}>
        <ThrowError shouldThrow={hasError} />
      </ErrorBoundary>
    </div>
  );
};

export const InteractiveError: Story = {
  args: {
    children: <div />,
  },
  render: () => <InteractiveErrorComponent />,
};

const NestedErrorBoundariesComponent = () => {
  const [outerError, setOuterError] = useState(false);
  const [innerError, setInnerError] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          onClick={() => setOuterError(true)}
          variant="destructive"
          size="sm"
        >
          Trigger Outer Error
        </Button>
        <Button
          onClick={() => setInnerError(true)}
          variant="destructive"
          size="sm"
        >
          Trigger Inner Error
        </Button>
        <Button
          onClick={() => {
            setOuterError(false);
            setInnerError(false);
          }}
          variant="secondary"
          size="sm"
        >
          Reset All
        </Button>
      </div>
      
      <ErrorBoundary>
        <div className="p-4 border-2 border-blue-500 rounded">
          <h4 className="font-semibold mb-2">Outer Boundary</h4>
          <ThrowError shouldThrow={outerError} />
          
          <ErrorBoundary>
            <div className="mt-4 p-4 border-2 border-green-500 rounded">
              <h4 className="font-semibold mb-2">Inner Boundary</h4>
              <ThrowError shouldThrow={innerError} />
            </div>
          </ErrorBoundary>
        </div>
      </ErrorBoundary>
    </div>
  );
};

export const NestedErrorBoundaries: Story = {
  args: {
    children: <div />,
  },
  render: () => <NestedErrorBoundariesComponent />,
};

const AsyncErrorComponent = () => {
  const [loading, setLoading] = useState(true);
  
  useState(() => {
    setTimeout(() => {
      setLoading(false);
      throw new Error('Async error after loading');
    }, 1000);
  });
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return <div>This won't render</div>;
};

export const AsyncError: Story = {
  args: {
    children: <AsyncErrorComponent />,
  },
};