import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../Button';
import { ShoppingCart, Trash2, Heart, Download, ChevronRight } from 'lucide-react';
import { useState } from 'react';

const meta = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'],
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon'],
    },
    isLoading: {
      control: 'boolean',
    },
    disabled: {
      control: 'boolean',
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    variant: 'default',
    children: 'Button',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary',
  },
};

export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Delete',
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Outline',
  },
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Ghost',
  },
};

export const Link: Story = {
  args: {
    variant: 'link',
    children: 'Link Button',
  },
};

export const WithIcon: Story = {
  args: {
    variant: 'default',
    children: (
      <>
        <ShoppingCart className="mr-2 h-4 w-4" />
        Add to Cart
      </>
    ),
  },
};

export const IconOnly: Story = {
  args: {
    variant: 'outline',
    size: 'icon',
    children: <Heart className="h-4 w-4" />,
  },
};

export const Loading: Story = {
  args: {
    variant: 'default',
    isLoading: true,
    children: 'Loading...',
  },
};

export const Disabled: Story = {
  args: {
    variant: 'default',
    disabled: true,
    children: 'Disabled',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      <div>
        <h3 className="mb-4 text-lg font-semibold">Variants</h3>
        <div className="flex flex-wrap gap-4">
          <Button variant="default">Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
        </div>
      </div>
      
      <div>
        <h3 className="mb-4 text-lg font-semibold">Sizes</h3>
        <div className="flex items-center gap-4">
          <Button size="sm">Small</Button>
          <Button size="default">Default</Button>
          <Button size="lg">Large</Button>
          <Button size="icon"><ShoppingCart className="h-4 w-4" /></Button>
        </div>
      </div>
      
      <div>
        <h3 className="mb-4 text-lg font-semibold">States</h3>
        <div className="flex gap-4">
          <Button>Normal</Button>
          <Button isLoading>Loading</Button>
          <Button disabled>Disabled</Button>
        </div>
      </div>
      
      <div>
        <h3 className="mb-4 text-lg font-semibold">With Icons</h3>
        <div className="flex flex-wrap gap-4">
          <Button variant="default">
            <ShoppingCart className="mr-2 h-4 w-4" />
            Add to Cart
          </Button>
          <Button variant="destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Item
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
          <Button variant="secondary">
            Continue
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  ),
};

export const KeyboardNavigation: Story = {
  render: () => (
    <div role="group" aria-label="Button keyboard navigation demo">
      <h3 className="mb-4 text-lg font-semibold">Tab through these buttons</h3>
      <div className="flex gap-4">
        <Button variant="default" autoFocus>
          First (focused)
        </Button>
        <Button variant="secondary">Second</Button>
        <Button variant="outline">Third</Button>
        <Button disabled>Disabled (skipped)</Button>
      </div>
    </div>
  ),
  parameters: {
    a11y: {
      config: {
        rules: [
          { id: 'color-contrast', enabled: true },
          { id: 'button-name', enabled: true },
        ],
      },
    },
  },
};

export const InteractiveLoadingButton: Story = {
  render: () => {
    const [isLoading, setIsLoading] = useState(false);
    
    const handleClick = () => {
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
      }, 2000);
    };
    
    return (
      <div className="flex flex-col items-center gap-4">
        <h3 className="text-lg font-semibold">Click to see loading state</h3>
        <Button 
          onClick={handleClick} 
          isLoading={isLoading}
          aria-busy={isLoading}
          aria-live="polite"
        >
          {isLoading ? 'Processing...' : 'Submit Order'}
        </Button>
        <p className="text-sm text-muted-foreground">
          Button will show loading state for 2 seconds
        </p>
      </div>
    );
  },
};

export const InteractiveCounter: Story = {
  render: () => {
    const [count, setCount] = useState(0);
    
    return (
      <div className="flex flex-col items-center gap-4">
        <h3 className="text-lg font-semibold">Interactive Counter</h3>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCount(count - 1)}
            aria-label="Decrease count"
          >
            -
          </Button>
          <span className="mx-4 text-xl font-semibold">{count}</span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCount(count + 1)}
            aria-label="Increase count"
          >
            +
          </Button>
        </div>
        <Button
          variant="secondary"
          onClick={() => setCount(0)}
        >
          Reset
        </Button>
      </div>
    );
  },
};

export const InteractiveToggle: Story = {
  render: () => {
    const [isActive, setIsActive] = useState(false);
    
    return (
      <div className="flex flex-col items-center gap-4">
        <h3 className="text-lg font-semibold">Toggle Button State</h3>
        <Button
          variant={isActive ? 'default' : 'outline'}
          onClick={() => setIsActive(!isActive)}
          aria-pressed={isActive}
        >
          <Heart 
            className={`mr-2 h-4 w-4 ${isActive ? 'fill-current' : ''}`}
            aria-hidden="true"
          />
          {isActive ? 'Favorited' : 'Add to Favorites'}
        </Button>
        <p className="text-sm text-muted-foreground">
          Click to toggle favorite state
        </p>
      </div>
    );
  },
};

export const AriaLabels: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <h3 className="mb-2 text-lg font-semibold">Buttons with ARIA labels</h3>
      <div className="flex gap-4">
        <Button
          variant="outline"
          size="icon"
          aria-label="Add to favorites"
        >
          <Heart className="h-4 w-4" />
        </Button>
        <Button
          variant="destructive"
          size="icon"
          aria-label="Delete item"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
        <Button
          variant="default"
          aria-label="Add to shopping cart"
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          Add to Cart
        </Button>
      </div>
      <div className="mt-4 text-sm text-muted-foreground">
        Icon-only buttons must have aria-labels for screen readers
      </div>
    </div>
  ),
};

export const LoadingStates: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <h3 className="mb-2 text-lg font-semibold">Loading states with ARIA</h3>
      <div className="flex gap-4">
        <Button isLoading aria-busy="true" aria-label="Submitting form">
          Submit
        </Button>
        <Button variant="secondary" isLoading aria-busy="true">
          Processing...
        </Button>
        <Button variant="outline" disabled aria-disabled="true">
          Complete
        </Button>
      </div>
      <div className="mt-4 text-sm text-muted-foreground">
        Loading buttons should have aria-busy="true" for assistive technology
      </div>
    </div>
  ),
};

export const ResponsiveButtons: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <h3 className="mb-2 text-lg font-semibold">Responsive button layouts</h3>
      <div className="flex flex-col sm:flex-row gap-4">
        <Button className="w-full sm:w-auto">Mobile Full Width</Button>
        <Button variant="secondary" className="w-full sm:w-auto">
          Responsive Button
        </Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Button variant="outline">Grid Item 1</Button>
        <Button variant="outline">Grid Item 2</Button>
        <Button variant="outline">Grid Item 3</Button>
        <Button variant="outline">Grid Item 4</Button>
      </div>
    </div>
  ),
  parameters: {
    viewport: {
      defaultViewport: 'mobile',
    },
  },
};