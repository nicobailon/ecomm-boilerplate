import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from '../Badge';

const meta = {
  title: 'UI/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'destructive', 'outline', 'success', 'warning', 'info'],
    },
    children: {
      control: 'text',
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'New',
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
    children: 'Sale',
  },
};

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Outline',
  },
};

export const Success: Story = {
  args: {
    variant: 'success',
    children: 'Active',
  },
};

export const Warning: Story = {
  args: {
    variant: 'warning',
    children: 'Pending',
  },
};

export const Info: Story = {
  args: {
    variant: 'info',
    children: 'Info',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      <div>
        <h3 className="mb-4 text-lg font-semibold">Badge Variants</h3>
        <div className="flex flex-wrap gap-4">
          <Badge variant="default">Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="info">Info</Badge>
        </div>
      </div>
      
      <div>
        <h3 className="mb-4 text-lg font-semibold">Common Use Cases</h3>
        <div className="flex flex-wrap gap-4">
          <Badge variant="default">New</Badge>
          <Badge variant="destructive">Sale</Badge>
          <Badge variant="success">In Stock</Badge>
          <Badge variant="warning">Low Stock</Badge>
          <Badge variant="secondary">Featured</Badge>
          <Badge variant="outline">Limited Edition</Badge>
        </div>
      </div>
      
      <div>
        <h3 className="mb-4 text-lg font-semibold">Status Badges</h3>
        <div className="flex flex-wrap gap-4">
          <Badge variant="success">Published</Badge>
          <Badge variant="warning">Draft</Badge>
          <Badge variant="destructive">Archived</Badge>
          <Badge variant="secondary">Private</Badge>
        </div>
      </div>
      
      <div>
        <h3 className="mb-4 text-lg font-semibold">E-commerce Badges</h3>
        <div className="flex flex-wrap gap-4">
          <Badge variant="destructive">50% OFF</Badge>
          <Badge variant="default">Best Seller</Badge>
          <Badge variant="success">Free Shipping</Badge>
          <Badge variant="warning">Last 3 Items</Badge>
          <Badge variant="secondary">Pre-order</Badge>
          <Badge variant="outline">Exclusive</Badge>
        </div>
      </div>
    </div>
  ),
};