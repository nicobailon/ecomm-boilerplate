import type { Meta, StoryObj } from '@storybook/react-vite';
import { within, expect, userEvent } from '@storybook/test';
import { ThemeToggle } from './theme-toggle';
// import { ThemeProvider } from '@/providers/ThemeProvider';

// Mock ThemeProvider for stories
const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

const meta = {
  title: 'UI/Controls/ThemeToggle',
  component: ThemeToggle,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A control for switching between light, dark, and system theme preferences. Includes keyboard shortcuts and screen reader announcements.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <ThemeProvider>
        <Story />
      </ThemeProvider>
    ),
  ],
} satisfies Meta<typeof ThemeToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

// Theme toggle in context
export const InHeader: Story = {
  render: () => (
    <header className="w-full px-6 py-4 border-b bg-background">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold">My Application</h1>
        <div className="flex items-center gap-4">
          <nav className="flex items-center gap-4">
            <a href="#" className="text-sm hover:underline">Home</a>
            <a href="#" className="text-sm hover:underline">About</a>
            <a href="#" className="text-sm hover:underline">Contact</a>
          </nav>
          <ThemeToggle />
        </div>
      </div>
    </header>
  ),
};

// Theme toggle with visual feedback
export const WithVisualFeedback: Story = {
  render: () => (
    <div className="space-y-6 p-8 border rounded-lg">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Theme Settings</h2>
        <ThemeToggle />
      </div>
      <div className="space-y-4">
        <div className="p-4 bg-background border rounded">
          <h3 className="font-medium mb-2">Background Color</h3>
          <p className="text-sm text-muted-foreground">
            This box demonstrates the current theme&apos;s background color.
          </p>
        </div>
        <div className="p-4 bg-muted rounded">
          <h3 className="font-medium mb-2">Muted Background</h3>
          <p className="text-sm text-muted-foreground">
            This shows how muted backgrounds appear in the current theme.
          </p>
        </div>
        <div className="p-4 bg-primary text-primary-foreground rounded">
          <h3 className="font-medium mb-2">Primary Color</h3>
          <p className="text-sm">
            Primary colors adapt based on the selected theme.
          </p>
        </div>
      </div>
    </div>
  ),
};

// Theme toggle with state display
export const WithStateDisplay: Story = {
  render: () => {
    const MockThemeProvider = ({ children }: { children: React.ReactNode }) => {
      const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
      
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Current theme:</span>
            <span className="px-2 py-1 bg-muted rounded text-sm">
              {theme}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Toggle theme:</span>
            {children}
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4">
            <button
              onClick={() => setTheme('light')}
              className={`px-3 py-2 rounded text-sm ${
                theme === 'light' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              Light
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`px-3 py-2 rounded text-sm ${
                theme === 'dark' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              Dark
            </button>
            <button
              onClick={() => setTheme('system')}
              className={`px-3 py-2 rounded text-sm ${
                theme === 'system' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              System
            </button>
          </div>
        </div>
      );
    };

    return (
      <MockThemeProvider>
        <ThemeToggle />
      </MockThemeProvider>
    );
  },
};

// Theme toggle with interaction test
export const InteractionTest: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Find the theme toggle button
    const button = canvas.getByRole('button');
    
    // Check initial aria-label
    expect(button).toHaveAttribute('aria-label');
    
    // Click to change theme
    await userEvent.click(button);
    
    // Button should still be present and functional
    expect(button).toBeInTheDocument();
    
    // Test keyboard shortcut tooltip
    expect(button).toHaveAttribute('title', 'Toggle theme (Ctrl+Shift+L)');
  },
};

// Theme toggle in settings panel
export const InSettingsPanel: Story = {
  render: () => (
    <div className="w-80 p-6 border rounded-lg space-y-6">
      <h2 className="text-lg font-semibold">Appearance Settings</h2>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Theme</p>
            <p className="text-xs text-muted-foreground">
              Choose your preferred color scheme
            </p>
          </div>
          <ThemeToggle />
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Font Size</p>
            <p className="text-xs text-muted-foreground">
              Adjust text size for readability
            </p>
          </div>
          <select className="px-3 py-1 border rounded text-sm">
            <option>Small</option>
            <option>Medium</option>
            <option>Large</option>
          </select>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Reduce Motion</p>
            <p className="text-xs text-muted-foreground">
              Minimize animations
            </p>
          </div>
          <input type="checkbox" className="rounded" />
        </div>
      </div>
      
      <p className="text-xs text-muted-foreground">
        Tip: Use Ctrl+Shift+L to quickly toggle theme
      </p>
    </div>
  ),
};

// Theme toggle with preview cards
export const WithPreviewCards: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Choose Your Theme</h2>
        <ThemeToggle />
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="border rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary">
          <div className="p-4 bg-white">
            <div className="w-full h-2 bg-gray-200 rounded mb-2"></div>
            <div className="w-3/4 h-2 bg-gray-300 rounded mb-2"></div>
            <div className="w-1/2 h-2 bg-gray-200 rounded"></div>
          </div>
          <div className="p-2 bg-gray-50 text-center">
            <p className="text-xs font-medium">Light</p>
          </div>
        </div>
        
        <div className="border rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary">
          <div className="p-4 bg-gray-900">
            <div className="w-full h-2 bg-gray-700 rounded mb-2"></div>
            <div className="w-3/4 h-2 bg-gray-600 rounded mb-2"></div>
            <div className="w-1/2 h-2 bg-gray-700 rounded"></div>
          </div>
          <div className="p-2 bg-gray-800 text-center">
            <p className="text-xs font-medium text-white">Dark</p>
          </div>
        </div>
        
        <div className="border rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary">
          <div className="p-4 bg-gradient-to-b from-white to-gray-900">
            <div className="w-full h-2 bg-gray-400 rounded mb-2"></div>
            <div className="w-3/4 h-2 bg-gray-500 rounded mb-2"></div>
            <div className="w-1/2 h-2 bg-gray-400 rounded"></div>
          </div>
          <div className="p-2 bg-gray-200 text-center">
            <p className="text-xs font-medium">System</p>
          </div>
        </div>
      </div>
    </div>
  ),
};

// Accessibility focused example
export const AccessibilityFeatures: Story = {
  render: () => (
    <div className="space-y-6 p-6 border rounded-lg">
      <h2 className="text-lg font-semibold">Accessibility Features</h2>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-muted rounded">
          <div>
            <p className="font-medium">Theme Toggle</p>
            <p className="text-sm text-muted-foreground">
              Includes aria-label for screen readers
            </p>
          </div>
          <ThemeToggle />
        </div>
        
        <div className="p-4 border rounded">
          <h3 className="font-medium mb-2">Keyboard Shortcut</h3>
          <p className="text-sm text-muted-foreground mb-2">
            Press <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl</kbd> + 
            <kbd className="px-2 py-1 bg-muted rounded text-xs mx-1">Shift</kbd> + 
            <kbd className="px-2 py-1 bg-muted rounded text-xs mx-1">L</kbd> to toggle theme
          </p>
        </div>
        
        <div className="p-4 border rounded">
          <h3 className="font-medium mb-2">Screen Reader Announcements</h3>
          <p className="text-sm text-muted-foreground">
            Theme changes are announced to assistive technologies
          </p>
        </div>
      </div>
    </div>
  ),
  parameters: {
    a11y: {
      config: {
        rules: [
          { id: 'button-name', enabled: true },
          { id: 'color-contrast', enabled: true },
        ],
      },
    },
  },
};

// Theme toggle variations
export const Variations: Story = {
  render: () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Icon Button (Default)</h3>
        <ThemeToggle />
      </div>
      
      <div className="space-y-4">
        <h3 className="text-sm font-medium">With Label (Custom Implementation)</h3>
        <button className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-muted">
          <Sun className="h-4 w-4" />
          <span className="text-sm">Light Theme</span>
        </button>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Dropdown Style (Custom Implementation)</h3>
        <select className="px-4 py-2 border rounded-md text-sm">
          <option value="light">☀️ Light</option>
          <option value="dark">🌙 Dark</option>
          <option value="system">💻 System</option>
        </select>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Radio Group (Custom Implementation)</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input type="radio" name="theme" value="light" />
            <span className="text-sm">Light</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="theme" value="dark" />
            <span className="text-sm">Dark</span>
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="theme" value="system" defaultChecked />
            <span className="text-sm">System</span>
          </label>
        </div>
      </div>
    </div>
  ),
};

// Import required for the story
import { useState } from 'react';
import { Sun } from 'lucide-react';