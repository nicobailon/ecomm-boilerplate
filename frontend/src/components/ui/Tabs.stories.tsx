import type { Meta, StoryObj } from '@storybook/react-vite';
import React from 'react';
import { within, expect, userEvent } from '@storybook/test';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs';
import { demoProducts } from '@/stories/helpers/demo-data';

const meta = {
  title: 'UI/Navigation/Tabs',
  component: Tabs,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A set of layered sections of content, known as tab panels, that display one panel at a time. Supports keyboard navigation and ARIA tab patterns.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    defaultValue: {
      control: 'text',
    },
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
    },
  },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="account" className="w-[400px]">
      <TabsList>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
      </TabsList>
      <TabsContent value="account">
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Account</h3>
          <p className="text-sm text-muted-foreground">
            Make changes to your account here. Click save when you&apos;re done.
          </p>
        </div>
      </TabsContent>
      <TabsContent value="password">
        <div className="space-y-2">
          <h3 className="text-lg font-medium">Password</h3>
          <p className="text-sm text-muted-foreground">
            Change your password here. After saving, you&apos;ll be logged out.
          </p>
        </div>
      </TabsContent>
    </Tabs>
  ),
};

export const WithThreeTabs: Story = {
  render: () => (
    <Tabs defaultValue="overview" className="w-[400px]">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
        <TabsTrigger value="reports">Reports</TabsTrigger>
      </TabsList>
      <TabsContent value="overview">
        <div className="p-4 border rounded-md">
          <h3 className="font-medium mb-2">Overview</h3>
          <p className="text-sm text-muted-foreground">
            View your account overview and recent activity.
          </p>
        </div>
      </TabsContent>
      <TabsContent value="analytics">
        <div className="p-4 border rounded-md">
          <h3 className="font-medium mb-2">Analytics</h3>
          <p className="text-sm text-muted-foreground">
            Detailed analytics and insights about your performance.
          </p>
        </div>
      </TabsContent>
      <TabsContent value="reports">
        <div className="p-4 border rounded-md">
          <h3 className="font-medium mb-2">Reports</h3>
          <p className="text-sm text-muted-foreground">
            Generate and download detailed reports.
          </p>
        </div>
      </TabsContent>
    </Tabs>
  ),
};

// Product details tabs example
export const ProductDetails: Story = {
  render: () => (
    <Tabs defaultValue="description" className="w-[600px]">
      <TabsList>
        <TabsTrigger value="description">Description</TabsTrigger>
        <TabsTrigger value="specifications">Specifications</TabsTrigger>
        <TabsTrigger value="reviews">Reviews (24)</TabsTrigger>
        <TabsTrigger value="shipping">Shipping</TabsTrigger>
      </TabsList>
      <TabsContent value="description" className="space-y-4">
        <h3 className="text-lg font-semibold">Product Description</h3>
        <p className="text-sm leading-relaxed">{demoProducts.productDetails.description}</p>
        <ul className="list-disc list-inside text-sm space-y-1">
          {demoProducts.productDetails.features.map((feature, i) => (
            <li key={i}>{feature}</li>
          ))}
        </ul>
      </TabsContent>
      <TabsContent value="specifications" className="space-y-4">
        <h3 className="text-lg font-semibold">Technical Specifications</h3>
        <dl className="grid grid-cols-2 gap-2 text-sm">
          {Object.entries(demoProducts.productDetails.specifications).map(([key, value]) => (
            <React.Fragment key={key}>
              <dt className="font-medium capitalize">{key}:</dt>
              <dd>{value}</dd>
            </React.Fragment>
          ))}
        </dl>
      </TabsContent>
      <TabsContent value="reviews" className="space-y-4">
        <h3 className="text-lg font-semibold">Customer Reviews</h3>
        <div className="space-y-3">
          {demoProducts.reviews.map((review) => (
            <div key={review.id} className="border-b pb-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm">{review.author}</span>
                <span className="text-yellow-500">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
              </div>
              <p className="text-sm text-muted-foreground">{review.comment}</p>
            </div>
          ))}
        </div>
      </TabsContent>
      <TabsContent value="shipping" className="space-y-4">
        <h3 className="text-lg font-semibold">Shipping Information</h3>
        <div className="text-sm space-y-2">
          <p>
            <span className="font-medium">Standard Shipping:</span> {demoProducts.shippingInfo.standard}
          </p>
          <p>
            <span className="font-medium">Express Shipping:</span> {demoProducts.shippingInfo.express}
          </p>
          <p>
            <span className="font-medium">International:</span> {demoProducts.shippingInfo.international}
          </p>
          <p className="text-muted-foreground">
            Free shipping on orders over ${demoProducts.shippingInfo.freeShippingThreshold}
          </p>
        </div>
      </TabsContent>
    </Tabs>
  ),
};

// Settings page tabs
export const SettingsTabs: Story = {
  render: () => (
    <Tabs defaultValue="general" className="w-[500px]">
      <TabsList>
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="security">Security</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
        <TabsTrigger value="billing">Billing</TabsTrigger>
      </TabsList>
      <TabsContent value="general" className="space-y-4">
        <h3 className="text-lg font-medium">General Settings</h3>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Display Name</label>
            <input type="text" className="w-full mt-1 px-3 py-2 border rounded-md" placeholder="John Doe" />
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <input type="email" className="w-full mt-1 px-3 py-2 border rounded-md" placeholder="john@example.com" />
          </div>
        </div>
      </TabsContent>
      <TabsContent value="security" className="space-y-4">
        <h3 className="text-lg font-medium">Security Settings</h3>
        <div className="space-y-3">
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm">
            Change Password
          </button>
          <button className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm">
            Enable Two-Factor Authentication
          </button>
        </div>
      </TabsContent>
      <TabsContent value="notifications" className="space-y-4">
        <h3 className="text-lg font-medium">Notification Preferences</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="checkbox" defaultChecked />
            <span className="text-sm">Email notifications</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" defaultChecked />
            <span className="text-sm">Push notifications</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" />
            <span className="text-sm">SMS notifications</span>
          </label>
        </div>
      </TabsContent>
      <TabsContent value="billing" className="space-y-4">
        <h3 className="text-lg font-medium">Billing Information</h3>
        <p className="text-sm text-muted-foreground">
          Manage your subscription and payment methods.
        </p>
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm">
          Manage Subscription
        </button>
      </TabsContent>
    </Tabs>
  ),
};

// Tabs with interaction test
export const InteractionTest: Story = {
  render: () => (
    <Tabs defaultValue="tab1" className="w-[400px]">
      <TabsList>
        <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        <TabsTrigger value="tab3">Tab 3</TabsTrigger>
      </TabsList>
      <TabsContent value="tab1">
        <p>Content for Tab 1</p>
      </TabsContent>
      <TabsContent value="tab2">
        <p>Content for Tab 2</p>
      </TabsContent>
      <TabsContent value="tab3">
        <p>Content for Tab 3</p>
      </TabsContent>
    </Tabs>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Check initial state
    const tab1Content = canvas.getByText('Content for Tab 1');
    expect(tab1Content).toBeVisible();
    
    // Click on Tab 2
    const tab2Trigger = canvas.getByRole('tab', { name: 'Tab 2' });
    await userEvent.click(tab2Trigger);
    
    // Check Tab 2 is active
    const tab2Content = canvas.getByText('Content for Tab 2');
    expect(tab2Content).toBeVisible();
    expect(tab1Content).not.toBeVisible();
    
    // Click on Tab 3
    const tab3Trigger = canvas.getByRole('tab', { name: 'Tab 3' });
    await userEvent.click(tab3Trigger);
    
    // Check Tab 3 is active
    const tab3Content = canvas.getByText('Content for Tab 3');
    expect(tab3Content).toBeVisible();
    expect(tab2Content).not.toBeVisible();
    
    // Test keyboard navigation
    tab3Trigger.focus();
    await userEvent.keyboard('{ArrowLeft}');
    expect(tab2Content).toBeVisible();
  },
};

// Disabled tab example
export const WithDisabledTab: Story = {
  render: () => (
    <Tabs defaultValue="active" className="w-[400px]">
      <TabsList>
        <TabsTrigger value="active">Active Tab</TabsTrigger>
        <TabsTrigger value="disabled" disabled>
          Disabled Tab
        </TabsTrigger>
        <TabsTrigger value="another">Another Tab</TabsTrigger>
      </TabsList>
      <TabsContent value="active">
        <p>This tab is active and clickable.</p>
      </TabsContent>
      <TabsContent value="disabled">
        <p>You shouldn&apos;t see this content.</p>
      </TabsContent>
      <TabsContent value="another">
        <p>This tab is also active and clickable.</p>
      </TabsContent>
    </Tabs>
  ),
};

// Vertical tabs
export const VerticalTabs: Story = {
  render: () => (
    <Tabs defaultValue="profile" orientation="vertical" className="flex gap-4 w-[600px]">
      <TabsList className="flex-col h-auto w-[200px]">
        <TabsTrigger value="profile" className="w-full justify-start">
          Profile
        </TabsTrigger>
        <TabsTrigger value="preferences" className="w-full justify-start">
          Preferences
        </TabsTrigger>
        <TabsTrigger value="privacy" className="w-full justify-start">
          Privacy
        </TabsTrigger>
        <TabsTrigger value="advanced" className="w-full justify-start">
          Advanced
        </TabsTrigger>
      </TabsList>
      <div className="flex-1">
        <TabsContent value="profile">
          <h3 className="text-lg font-medium mb-2">Profile Settings</h3>
          <p className="text-sm text-muted-foreground">
            Manage your profile information and public appearance.
          </p>
        </TabsContent>
        <TabsContent value="preferences">
          <h3 className="text-lg font-medium mb-2">Preferences</h3>
          <p className="text-sm text-muted-foreground">
            Customize your experience and interface settings.
          </p>
        </TabsContent>
        <TabsContent value="privacy">
          <h3 className="text-lg font-medium mb-2">Privacy Settings</h3>
          <p className="text-sm text-muted-foreground">
            Control your data and privacy preferences.
          </p>
        </TabsContent>
        <TabsContent value="advanced">
          <h3 className="text-lg font-medium mb-2">Advanced Settings</h3>
          <p className="text-sm text-muted-foreground">
            Configure advanced options and developer settings.
          </p>
        </TabsContent>
      </div>
    </Tabs>
  ),
};

// Tabs with icons
export const WithIcons: Story = {
  render: () => (
    <Tabs defaultValue="home" className="w-[400px]">
      <TabsList>
        <TabsTrigger value="home">
          <span className="flex items-center gap-2">
            <span>🏠</span>
            Home
          </span>
        </TabsTrigger>
        <TabsTrigger value="dashboard">
          <span className="flex items-center gap-2">
            <span>📊</span>
            Dashboard
          </span>
        </TabsTrigger>
        <TabsTrigger value="settings">
          <span className="flex items-center gap-2">
            <span>⚙️</span>
            Settings
          </span>
        </TabsTrigger>
      </TabsList>
      <TabsContent value="home">
        <p>Welcome to your home page!</p>
      </TabsContent>
      <TabsContent value="dashboard">
        <p>View your analytics and metrics here.</p>
      </TabsContent>
      <TabsContent value="settings">
        <p>Manage your application settings.</p>
      </TabsContent>
    </Tabs>
  ),
};

// Accessibility focused example
export const AccessibilityFeatures: Story = {
  render: () => (
    <Tabs defaultValue="accessible" className="w-[500px]">
      <TabsList aria-label="Accessibility example tabs">
        <TabsTrigger value="accessible" aria-label="Accessible design tab">
          Accessible Design
        </TabsTrigger>
        <TabsTrigger value="screen-reader" aria-label="Screen reader support tab">
          Screen Reader
        </TabsTrigger>
        <TabsTrigger value="keyboard" aria-label="Keyboard navigation tab">
          Keyboard Nav
        </TabsTrigger>
      </TabsList>
      <TabsContent value="accessible" aria-labelledby="accessible-tab">
        <h3 id="accessible-tab" className="text-lg font-medium mb-2">
          Accessible Design Principles
        </h3>
        <p className="text-sm text-muted-foreground">
          Our tabs are built with accessibility in mind, featuring proper ARIA
          attributes and keyboard navigation support.
        </p>
      </TabsContent>
      <TabsContent value="screen-reader" aria-labelledby="screen-reader-tab">
        <h3 id="screen-reader-tab" className="text-lg font-medium mb-2">
          Screen Reader Support
        </h3>
        <p className="text-sm text-muted-foreground">
          All tabs announce their state and content properly to assistive
          technologies.
        </p>
      </TabsContent>
      <TabsContent value="keyboard" aria-labelledby="keyboard-tab">
        <h3 id="keyboard-tab" className="text-lg font-medium mb-2">
          Keyboard Navigation
        </h3>
        <p className="text-sm text-muted-foreground">
          Use arrow keys to navigate between tabs, Enter or Space to select.
        </p>
      </TabsContent>
    </Tabs>
  ),
  parameters: {
    a11y: {
      config: {
        rules: [
          { id: 'tabindex', enabled: true },
          { id: 'aria-roles', enabled: true },
        ],
      },
    },
  },
};