import type { Meta, StoryObj } from '@storybook/react-vite';
import { CreatableCollectionSelect, CreatableCollectionSelectSkeleton } from './CreatableCollectionSelect';
import { useState } from 'react';
import { userEvent, within, expect } from '@storybook/test';
import { toast } from 'sonner';

const mockCollections = [
  { _id: '1', name: 'Summer Collection', slug: 'summer-collection' },
  { _id: '2', name: 'Winter Collection', slug: 'winter-collection' },
  { _id: '3', name: 'Spring Collection', slug: 'spring-collection' },
  { _id: '4', name: 'Fall Collection', slug: 'fall-collection' },
  { _id: '5', name: 'New Arrivals', slug: 'new-arrivals' },
  { _id: '6', name: 'Best Sellers', slug: 'best-sellers' },
  { _id: '7', name: 'Limited Edition', slug: 'limited-edition' },
  { _id: '8', name: 'Holiday Specials', slug: 'holiday-specials' },
];

const ControlledComponent = (args: any) => {
  const [value, setValue] = useState(args.value || '');
  
  return (
    <CreatableCollectionSelect
      {...args}
      value={value}
      onChange={setValue}
    />
  );
};

const meta: Meta<typeof CreatableCollectionSelect> = {
  title: 'UI/CreatableCollectionSelect',
  component: CreatableCollectionSelect,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ minHeight: '400px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => <ControlledComponent {...args} />,
  args: {
    collections: mockCollections,
    placeholder: 'Select a collection...',
  },
};

export const WithLabel: Story = {
  render: (args) => <ControlledComponent {...args} />,
  args: {
    collections: mockCollections,
    placeholder: 'Select a collection...',
    label: 'Product Collection',
  },
};

export const WithPreselectedValue: Story = {
  render: (args) => <ControlledComponent {...args} />,
  args: {
    collections: mockCollections,
    value: '2',
    placeholder: 'Select a collection...',
    label: 'Collection',
  },
};

export const Loading: Story = {
  args: {
    collections: [],
    isLoading: true,
    placeholder: 'Loading collections...',
  },
};

export const Empty: Story = {
  args: {
    collections: [],
    placeholder: 'No collections available',
  },
};

export const WithError: Story = {
  render: (args) => <ControlledComponent {...args} />,
  args: {
    collections: mockCollections,
    placeholder: 'Select a collection...',
    error: 'Please select a collection',
  },
};

export const Disabled: Story = {
  args: {
    collections: mockCollections,
    disabled: true,
    placeholder: 'Select a collection...',
    value: '1',
  },
};

export const WithCreateFunction: Story = {
  render: (args) => <ControlledComponent {...args} />,
  args: {
    collections: mockCollections,
    placeholder: 'Select or create collection...',
    onCreateCollection: async (name: string) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success(`Created collection: ${name}`);
      return `new-${Date.now()}`;
    },
  },
};

export const CreateWithError: Story = {
  render: (args) => <ControlledComponent {...args} />,
  args: {
    collections: mockCollections,
    placeholder: 'Select or create collection...',
    onCreateCollection: async (name: string) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      throw new Error(`Collection "${name}" already exists`);
    },
  },
};

export const ManyCollections: Story = {
  render: (args) => <ControlledComponent {...args} />,
  args: {
    collections: Array.from({ length: 50 }, (_, i) => ({
      _id: `${i + 1}`,
      name: `Collection ${i + 1}`,
      slug: `collection-${i + 1}`,
    })),
    placeholder: 'Select from many collections...',
  },
};

export const LongCollectionNames: Story = {
  render: (args) => <ControlledComponent {...args} />,
  args: {
    collections: [
      { _id: '1', name: 'This is a very long collection name that might overflow the select component', slug: 'very-long-name' },
      { _id: '2', name: 'Another extremely long collection name for testing purposes and edge cases', slug: 'another-long-name' },
      { _id: '3', name: 'Short name', slug: 'short-name' },
    ],
    placeholder: 'Select a collection...',
  },
};

export const SkeletonState: Story = {
  render: () => <CreatableCollectionSelectSkeleton />,
};

export const SearchInteraction: Story = {
  render: (args) => <ControlledComponent {...args} />,
  args: {
    collections: mockCollections,
    placeholder: 'Select a collection...',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    const button = await canvas.findByRole('combobox');
    await userEvent.click(button);
    
    const searchInput = await canvas.findByRole('searchbox');
    await userEvent.type(searchInput, 'summer');
    
    const options = await canvas.findAllByRole('option');
    await expect(options).toHaveLength(1);
    await expect(options[0]).toHaveTextContent('Summer Collection');
  },
};

export const KeyboardNavigation: Story = {
  render: (args) => <ControlledComponent {...args} />,
  args: {
    collections: mockCollections.slice(0, 3),
    placeholder: 'Select a collection...',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    const button = await canvas.findByRole('combobox');
    button.focus();
    
    await userEvent.keyboard('{Enter}');
    
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{ArrowDown}');
    
    const options = await canvas.findAllByRole('option');
    await expect(options[1]).toHaveClass('bg-accent');
  },
};

export const MobileView: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  render: (args) => <ControlledComponent {...args} />,
  args: {
    collections: mockCollections,
    placeholder: 'Select a collection...',
    label: 'Collection',
  },
};

export const DarkMode: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
  },
  render: (args) => (
    <div className="dark">
      <div className="bg-background p-8">
        <ControlledComponent {...args} />
      </div>
    </div>
  ),
  args: {
    collections: mockCollections,
    placeholder: 'Select a collection...',
    label: 'Collection',
  },
};

export const InFormContext: Story = {
  render: (args) => (
    <form className="space-y-4 max-w-md">
      <div>
        <label htmlFor="product-name" className="text-sm font-medium text-foreground mb-1 block">
          Product Name
        </label>
        <input
          id="product-name"
          type="text"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="Enter product name"
        />
      </div>
      
      <ControlledComponent {...args} />
      
      <div>
        <label htmlFor="price" className="text-sm font-medium text-foreground mb-1 block">
          Price
        </label>
        <input
          id="price"
          type="number"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="0.00"
        />
      </div>
      
      <button
        type="submit"
        className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground h-10 px-4 py-2"
      >
        Save Product
      </button>
    </form>
  ),
  args: {
    collections: mockCollections,
    placeholder: 'Select a collection...',
    label: 'Collection',
  },
};

export const WithValidation: Story = {
  render: () => {
    const Component = () => {
      const [value, setValue] = useState('');
      const [error, setError] = useState('');
      
      const handleChange = (newValue: string) => {
        setValue(newValue);
        setError('');
      };
      
      const handleValidate = () => {
        if (!value) {
          setError('Collection is required');
        }
      };
      
      return (
        <div className="space-y-4 max-w-md">
          <CreatableCollectionSelect
            collections={mockCollections}
            value={value}
            onChange={handleChange}
            error={error}
            placeholder="Select a collection..."
            label="Collection (required)"
          />
          <button
            onClick={handleValidate}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground h-10 px-4 py-2"
          >
            Validate
          </button>
        </div>
      );
    };
    
    return <Component />;
  },
};

export const RetryScenario: Story = {
  render: (args) => {
    let attemptCount = 0;
    
    const createWithRetry = async (name: string) => {
      attemptCount++;
      if (attemptCount < 3) {
        throw new Error(`Network error (attempt ${attemptCount})`);
      }
      toast.success(`Created collection: ${name} after ${attemptCount} attempts`);
      attemptCount = 0;
      return `new-${Date.now()}`;
    };
    
    return <ControlledComponent {...args} onCreateCollection={createWithRetry} />;
  },
  args: {
    collections: mockCollections,
    placeholder: 'Select or create collection...',
  },
};