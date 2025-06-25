import type { Meta, StoryObj } from '@storybook/react-vite';
import { within, expect, userEvent } from '@storybook/test';
import { useState } from 'react';
import { Switch } from './Switch';

const meta = {
  title: 'UI/Primitives/Switch',
  component: Switch,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A toggle control that represents on/off states. Ideal for settings and preferences. Provides clear visual feedback and supports keyboard navigation.',
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
} satisfies Meta<typeof Switch>;

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

// Switch with label
export const WithLabel: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Switch id="airplane-mode" />
      <label
        htmlFor="airplane-mode"
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        Airplane Mode
      </label>
    </div>
  ),
};

// Controlled switch with state
export const Controlled: Story = {
  render: () => {
    const [enabled, setEnabled] = useState(false);

    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="notifications"
            checked={enabled}
            onCheckedChange={setEnabled}
          />
          <label htmlFor="notifications" className="text-sm font-medium">
            Enable notifications
          </label>
        </div>
        <p className="text-sm text-muted-foreground">
          Notifications are {enabled ? 'enabled' : 'disabled'}
        </p>
      </div>
    );
  },
};

// Settings panel with multiple switches
export const SettingsPanel: Story = {
  render: () => {
    const [settings, setSettings] = useState({
      notifications: true,
      marketing: false,
      analytics: true,
      newsletter: false,
    });

    const updateSetting = (key: keyof typeof settings, value: boolean) => {
      setSettings(prev => ({ ...prev, [key]: value }));
    };

    return (
      <div className="w-80 space-y-4 rounded-lg border p-6">
        <h3 className="text-lg font-semibold">Privacy Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label htmlFor="notifications" className="text-sm font-medium">
              Push Notifications
            </label>
            <Switch
              id="notifications"
              checked={settings.notifications}
              onCheckedChange={(checked) => updateSetting('notifications', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <label htmlFor="marketing" className="text-sm font-medium">
              Marketing Emails
            </label>
            <Switch
              id="marketing"
              checked={settings.marketing}
              onCheckedChange={(checked) => updateSetting('marketing', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <label htmlFor="analytics" className="text-sm font-medium">
              Analytics Cookies
            </label>
            <Switch
              id="analytics"
              checked={settings.analytics}
              onCheckedChange={(checked) => updateSetting('analytics', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <label htmlFor="newsletter" className="text-sm font-medium">
              Newsletter
            </label>
            <Switch
              id="newsletter"
              checked={settings.newsletter}
              onCheckedChange={(checked) => updateSetting('newsletter', checked)}
            />
          </div>
        </div>
      </div>
    );
  },
};

// Switch with interaction test
export const InteractionTest: Story = {
  render: () => (
    <div className="flex items-center space-x-2">
      <Switch id="test-switch" />
      <label htmlFor="test-switch" className="text-sm font-medium">
        Test Switch
      </label>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Get switch
    const switchElement = canvas.getByRole('switch');
    
    // Initially unchecked
    void expect(switchElement).toHaveAttribute('data-state', 'unchecked');
    void expect(switchElement).toHaveAttribute('aria-checked', 'false');
    
    // Click to check
    await userEvent.click(switchElement);
    void expect(switchElement).toHaveAttribute('data-state', 'checked');
    void expect(switchElement).toHaveAttribute('aria-checked', 'true');
    
    // Click to uncheck
    await userEvent.click(switchElement);
    void expect(switchElement).toHaveAttribute('data-state', 'unchecked');
    void expect(switchElement).toHaveAttribute('aria-checked', 'false');
    
    // Test keyboard interaction
    switchElement.focus();
    await userEvent.keyboard(' '); // Space key
    void expect(switchElement).toHaveAttribute('data-state', 'checked');
  },
};

// Form with switch
export const InForm: Story = {
  render: () => {
    const [formData, setFormData] = useState({
      username: '',
      publicProfile: false,
      emailNotifications: true,
    });
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setSubmitted(true);
    };

    return (
      <form onSubmit={handleSubmit} className="w-80 space-y-4">
        <div>
          <label htmlFor="username" className="text-sm font-medium">
            Username
          </label>
          <input
            id="username"
            type="text"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            className="mt-1 w-full px-3 py-2 border rounded-md"
            required
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="public-profile" className="text-sm font-medium">
              Make profile public
            </label>
            <Switch
              id="public-profile"
              checked={formData.publicProfile}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, publicProfile: checked })
              }
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Allow others to see your profile
          </p>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="email-notifications" className="text-sm font-medium">
              Email notifications
            </label>
            <Switch
              id="email-notifications"
              checked={formData.emailNotifications}
              onCheckedChange={(checked) => 
                setFormData({ ...formData, emailNotifications: checked })
              }
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Receive updates via email
          </p>
        </div>
        <button
          type="submit"
          className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md"
        >
          Save Settings
        </button>
        {submitted && (
          <div className="text-sm space-y-1">
            <p className="text-green-600">Settings saved!</p>
            <p className="text-muted-foreground">
              Profile: {formData.publicProfile ? 'Public' : 'Private'}
            </p>
            <p className="text-muted-foreground">
              Emails: {formData.emailNotifications ? 'Enabled' : 'Disabled'}
            </p>
          </div>
        )}
      </form>
    );
  },
};

// Dark mode toggle example
export const DarkModeToggle: Story = {
  render: () => {
    const [isDark, setIsDark] = useState(false);

    return (
      <div 
        className={cn(
          'p-8 rounded-lg transition-colors duration-300',
          isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900',
        )}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Theme Settings</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm">☀️</span>
            <Switch
              id="dark-mode"
              checked={isDark}
              onCheckedChange={setIsDark}
            />
            <span className="text-sm">🌙</span>
          </div>
        </div>
        <p className="text-sm opacity-80">
          Current theme: {isDark ? 'Dark' : 'Light'} mode
        </p>
      </div>
    );
  },
};

// Accessibility focused example
export const AccessibilityFeatures: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <label htmlFor="screen-reader" className="text-sm font-medium">
            Screen Reader
          </label>
          <p className="text-xs text-muted-foreground">
            Enable screen reader support
          </p>
        </div>
        <Switch
          id="screen-reader"
          aria-label="Enable screen reader support"
          aria-describedby="screen-reader-desc"
        />
      </div>
      <div className="flex items-center justify-between">
        <div>
          <label htmlFor="high-contrast" className="text-sm font-medium">
            High Contrast
          </label>
          <p id="high-contrast-desc" className="text-xs text-muted-foreground">
            Increase color contrast for better visibility
          </p>
        </div>
        <Switch
          id="high-contrast"
          aria-describedby="high-contrast-desc"
        />
      </div>
      <div className="flex items-center justify-between">
        <div>
          <label htmlFor="reduce-motion" className="text-sm font-medium">
            Reduce Motion
          </label>
          <p className="text-xs text-muted-foreground">
            Minimize animations and transitions
          </p>
        </div>
        <Switch
          id="reduce-motion"
          aria-label="Reduce motion and animations"
        />
      </div>
    </div>
  ),
  parameters: {
    a11y: {
      config: {
        rules: [
          { id: 'button-name', enabled: true },
          { id: 'role-img-alt', enabled: true },
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
        <Switch id="small" className="h-4 w-7 [&>span]:h-3 [&>span]:w-3 [&>span]:data-[state=checked]:translate-x-3" />
        <label htmlFor="small" className="text-xs">Small switch</label>
      </div>
      <div className="flex items-center space-x-2">
        <Switch id="medium" />
        <label htmlFor="medium" className="text-sm">Medium switch (default)</label>
      </div>
      <div className="flex items-center space-x-2">
        <Switch id="large" className="h-6 w-11 [&>span]:h-5 [&>span]:w-5 [&>span]:data-[state=checked]:translate-x-5" />
        <label htmlFor="large" className="text-base">Large switch</label>
      </div>
    </div>
  ),
};

// Custom styled switch
export const CustomStyling: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Switch 
          id="custom-1" 
          className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500"
        />
        <label htmlFor="custom-1" className="text-sm">
          Green when on, red when off
        </label>
      </div>
      <div className="flex items-center space-x-2">
        <Switch 
          id="custom-2" 
          className="data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-purple-500 data-[state=checked]:to-pink-500"
        />
        <label htmlFor="custom-2" className="text-sm">
          Gradient when enabled
        </label>
      </div>
    </div>
  ),
};

// Import cn function for className merging
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}