import type { Meta, StoryObj } from '@storybook/react-vite';
import { within, expect, userEvent } from '@storybook/test';
import { BrowserRouter } from 'react-router-dom';
import { Breadcrumb } from './Breadcrumb';

const meta = {
  title: 'UI/Navigation/Breadcrumb',
  component: Breadcrumb,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A navigation aid that helps users understand their location within the application hierarchy. Supports proper ARIA navigation landmarks.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <BrowserRouter>
        <Story />
      </BrowserRouter>
    ),
  ],
  argTypes: {
    className: {
      control: 'text',
    },
  },
} satisfies Meta<typeof Breadcrumb>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    items: [
      { label: 'Home', href: '/' },
      { label: 'Products', href: '/products' },
      { label: 'Electronics', href: '/products/electronics' },
      { label: 'Laptop' },
    ],
  },
};

export const TwoLevels: Story = {
  args: {
    items: [
      { label: 'Home', href: '/' },
      { label: 'About' },
    ],
  },
};

export const SingleLevel: Story = {
  args: {
    items: [
      { label: 'Dashboard' },
    ],
  },
};

// E-commerce breadcrumb
export const EcommerceBreadcrumb: Story = {
  args: {
    items: [
      { label: 'Home', href: '/' },
      { label: 'Women', href: '/category/women' },
      { label: 'Clothing', href: '/category/women/clothing' },
      { label: 'Dresses', href: '/category/women/clothing/dresses' },
      { label: 'Summer Dress' },
    ],
  },
};

// Admin panel breadcrumb
export const AdminBreadcrumb: Story = {
  args: {
    items: [
      { label: 'Admin', href: '/admin' },
      { label: 'Products', href: '/admin/products' },
      { label: 'Edit Product' },
    ],
  },
};

// Blog breadcrumb
export const BlogBreadcrumb: Story = {
  args: {
    items: [
      { label: 'Blog', href: '/blog' },
      { label: '2024', href: '/blog/2024' },
      { label: 'January', href: '/blog/2024/01' },
      { label: 'How to Use React Hooks' },
    ],
  },
};

// Settings breadcrumb
export const SettingsBreadcrumb: Story = {
  args: {
    items: [
      { label: 'Settings', href: '/settings' },
      { label: 'Account', href: '/settings/account' },
      { label: 'Security', href: '/settings/account/security' },
      { label: 'Two-Factor Authentication' },
    ],
  },
};

// Breadcrumb with interaction test
export const InteractionTest: Story = {
  args: {
    items: [
      { label: 'Home', href: '/' },
      { label: 'Products', href: '/products' },
      { label: 'Current Page' },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Check navigation element exists
    const nav = canvas.getByRole('navigation', { name: 'Breadcrumb' });
    expect(nav).toBeInTheDocument();
    
    // Check all links are present
    const homeLink = canvas.getByRole('link', { name: 'Home' });
    const productsLink = canvas.getByRole('link', { name: 'Products' });
    expect(homeLink).toBeInTheDocument();
    expect(productsLink).toBeInTheDocument();
    
    // Check current page is not a link
    const currentPage = canvas.getByText('Current Page');
    expect(currentPage).toBeInTheDocument();
    expect(currentPage.tagName).not.toBe('A');
    
    // Check aria-current on last item
    const links = canvas.getAllByRole('link');
    expect(links[links.length - 1]).not.toHaveAttribute('aria-current');
    
    // Test hover state
    await userEvent.hover(homeLink);
    expect(homeLink).toHaveClass('hover:text-foreground');
  },
};

// Long breadcrumb with truncation
export const LongBreadcrumb: Story = {
  args: {
    items: [],
  },
  render: () => (
    <div className="w-96 overflow-hidden">
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Electronics & Computers', href: '/electronics' },
          { label: 'Laptops & Notebooks', href: '/electronics/laptops' },
          { label: 'Gaming Laptops', href: '/electronics/laptops/gaming' },
          { label: 'ASUS ROG Strix G15 Gaming Laptop' },
        ]}
      />
    </div>
  ),
};

// Breadcrumb with custom styling
export const CustomStyling: Story = {
  args: {
    items: [
      { label: 'Store', href: '/' },
      { label: 'Sales', href: '/sales' },
      { label: 'Black Friday Deals' },
    ],
    className: 'text-base font-medium',
  },
};

// Responsive breadcrumb
export const ResponsiveBreadcrumb: Story = {
  args: {
    items: [],
  },
  render: () => (
    <div className="space-y-4">
      <div className="p-4 border rounded">
        <h3 className="text-sm font-medium mb-2">Desktop View</h3>
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Documentation', href: '/docs' },
            { label: 'Components', href: '/docs/components' },
            { label: 'Breadcrumb' },
          ]}
        />
      </div>
      <div className="p-4 border rounded max-w-xs">
        <h3 className="text-sm font-medium mb-2">Mobile View (Truncated)</h3>
        <Breadcrumb
          className="text-xs"
          items={[
            { label: '...', href: '/docs' },
            { label: 'Components', href: '/docs/components' },
            { label: 'Breadcrumb' },
          ]}
        />
      </div>
    </div>
  ),
};

// Breadcrumb with icons
export const WithIcons: Story = {
  args: {
    items: [],
  },
  render: () => (
    <Breadcrumb
      items={[
        { label: '🏠 Home', href: '/' },
        { label: '📁 Documents', href: '/documents' },
        { label: '📄 Reports', href: '/documents/reports' },
        { label: '📊 Q4 2024 Report' },
      ]}
    />
  ),
};

// Accessibility focused example
export const AccessibilityFeatures: Story = {
  args: {
    items: [],
  },
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium mb-2">Standard Navigation</h3>
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Products', href: '/products' },
            { label: 'Current Product' },
          ]}
        />
        <p className="text-xs text-muted-foreground mt-2">
          Uses semantic nav element with aria-label
        </p>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">With Current Page</h3>
        <Breadcrumb
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Analytics', href: '/dashboard/analytics' },
            { label: 'Traffic Report' },
          ]}
        />
        <p className="text-xs text-muted-foreground mt-2">
          Last item marked with aria-current=&quot;page&quot;
        </p>
      </div>
    </div>
  ),
  parameters: {
    a11y: {
      config: {
        rules: [
          { id: 'landmark-one-main', enabled: false },
          { id: 'region', enabled: false },
        ],
      },
    },
  },
};

// Different separator styles
export const CustomSeparators: Story = {
  args: {
    items: [],
  },
  render: () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-2">Default (Chevron)</h3>
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Products', href: '/products' },
            { label: 'Item' },
          ]}
        />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">With Slash (Custom Component)</h3>
        <nav aria-label="Breadcrumb" className="flex items-center space-x-1 text-sm text-muted-foreground">
          <a href="/" className="hover:text-foreground hover:underline">Home</a>
          <span className="mx-1">/</span>
          <a href="/products" className="hover:text-foreground hover:underline">Products</a>
          <span className="mx-1">/</span>
          <span className="text-foreground font-medium">Item</span>
        </nav>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">With Dots (Custom Component)</h3>
        <nav aria-label="Breadcrumb" className="flex items-center space-x-1 text-sm text-muted-foreground">
          <a href="/" className="hover:text-foreground hover:underline">Home</a>
          <span className="mx-2">•</span>
          <a href="/products" className="hover:text-foreground hover:underline">Products</a>
          <span className="mx-2">•</span>
          <span className="text-foreground font-medium">Item</span>
        </nav>
      </div>
    </div>
  ),
};