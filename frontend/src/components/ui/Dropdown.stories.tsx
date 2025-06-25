import type { Meta, StoryObj } from '@storybook/react-vite';
import { within, expect, userEvent } from '@storybook/test';
import { useState, useRef } from 'react';
import { Dropdown } from './Dropdown';
import { Button } from './Button';

const meta = {
  title: 'UI/Overlay/Dropdown',
  component: Dropdown,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A floating element that displays content on demand. Provides intelligent positioning and portal rendering for proper stacking context.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Dropdown>;

export default meta;
type Story = StoryObj<typeof meta>;

// Helper component for dropdown examples
const DropdownExample = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <Button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        variant="outline"
      >
        Toggle Dropdown
      </Button>
      <Dropdown
        isOpen={isOpen}
        triggerRef={triggerRef}
        className={className}
      >
        {children}
      </Dropdown>
    </>
  );
};

export const Default: Story = {
  args: {
    isOpen: false,
    triggerRef: { current: null },
    children: <div />,
  },
  render: () => (
    <DropdownExample className="bg-background border rounded-md shadow-md p-4">
      <div className="space-y-2">
        <p className="text-sm font-medium">Dropdown Content</p>
        <p className="text-sm text-muted-foreground">
          This is a basic dropdown component.
        </p>
      </div>
    </DropdownExample>
  ),
};

// Menu dropdown
export const MenuDropdown: Story = {
  args: {
    isOpen: false,
    triggerRef: { current: null },
    children: <div />,
  },
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);

    return (
      <>
        <Button
          ref={triggerRef}
          onClick={() => setIsOpen(!isOpen)}
          variant="outline"
        >
          Options
        </Button>
        <Dropdown
          isOpen={isOpen}
          triggerRef={triggerRef}
          className="bg-background border rounded-md shadow-lg py-1 min-w-[180px]"
        >
          <button
            className="w-full px-4 py-2 text-left text-sm hover:bg-muted transition-colors"
            onClick={() => {
              console.log('Edit clicked');
              setIsOpen(false);
            }}
          >
            Edit
          </button>
          <button
            className="w-full px-4 py-2 text-left text-sm hover:bg-muted transition-colors"
            onClick={() => {
              console.log('Duplicate clicked');
              setIsOpen(false);
            }}
          >
            Duplicate
          </button>
          <div className="h-px bg-border my-1" />
          <button
            className="w-full px-4 py-2 text-left text-sm hover:bg-muted transition-colors text-destructive"
            onClick={() => {
              console.log('Delete clicked');
              setIsOpen(false);
            }}
          >
            Delete
          </button>
        </Dropdown>
      </>
    );
  },
};

// User profile dropdown
export const UserProfileDropdown: Story = {
  args: {
    isOpen: false,
    triggerRef: { current: null },
    children: <div />,
  },
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);

    return (
      <>
        <button
          ref={triggerRef}
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
            JD
          </div>
          <span className="text-sm font-medium">John Doe</span>
          <span className="text-xs">▼</span>
        </button>
        <Dropdown
          isOpen={isOpen}
          triggerRef={triggerRef}
          className="bg-background border rounded-md shadow-lg py-2 w-64"
        >
          <div className="px-4 py-2 border-b">
            <p className="text-sm font-medium">John Doe</p>
            <p className="text-xs text-muted-foreground">john.doe@example.com</p>
          </div>
          <div className="py-1">
            <a href="#" className="block px-4 py-2 text-sm hover:bg-muted transition-colors">
              My Profile
            </a>
            <a href="#" className="block px-4 py-2 text-sm hover:bg-muted transition-colors">
              Settings
            </a>
            <a href="#" className="block px-4 py-2 text-sm hover:bg-muted transition-colors">
              Billing
            </a>
          </div>
          <div className="border-t pt-1">
            <button className="w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors text-destructive">
              Sign Out
            </button>
          </div>
        </Dropdown>
      </>
    );
  },
};

// Notification dropdown
export const NotificationDropdown: Story = {
  args: {
    isOpen: false,
    triggerRef: { current: null },
    children: <div />,
  },
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);

    return (
      <>
        <button
          ref={triggerRef}
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-2 rounded-md hover:bg-muted transition-colors"
        >
          <span className="text-lg">🔔</span>
          <span className="absolute top-0 right-0 w-2 h-2 bg-destructive rounded-full"></span>
        </button>
        <Dropdown
          isOpen={isOpen}
          triggerRef={triggerRef}
          className="bg-background border rounded-md shadow-lg w-80"
        >
          <div className="p-4 border-b">
            <h3 className="text-sm font-semibold">Notifications</h3>
          </div>
          <div className="max-h-80 overflow-y-auto">
            <div className="p-4 border-b hover:bg-muted transition-colors cursor-pointer">
              <div className="flex items-start gap-3">
                <span className="text-blue-500">📧</span>
                <div className="flex-1">
                  <p className="text-sm font-medium">New message from Sarah</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Hey, can you review the latest designs?
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">2 hours ago</p>
                </div>
              </div>
            </div>
            <div className="p-4 border-b hover:bg-muted transition-colors cursor-pointer">
              <div className="flex items-start gap-3">
                <span className="text-green-500">✅</span>
                <div className="flex-1">
                  <p className="text-sm font-medium">Order #1234 delivered</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Your order has been successfully delivered
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">5 hours ago</p>
                </div>
              </div>
            </div>
            <div className="p-4 hover:bg-muted transition-colors cursor-pointer">
              <div className="flex items-start gap-3">
                <span className="text-yellow-500">⚠️</span>
                <div className="flex-1">
                  <p className="text-sm font-medium">Low stock alert</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Product &quot;Wireless Mouse&quot; is running low
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">1 day ago</p>
                </div>
              </div>
            </div>
          </div>
          <div className="p-3 border-t">
            <button className="w-full text-center text-sm text-primary hover:underline">
              View all notifications
            </button>
          </div>
        </Dropdown>
      </>
    );
  },
};

// Language selector dropdown
export const LanguageSelector: Story = {
  args: {
    isOpen: false,
    triggerRef: { current: null },
    children: <div />,
  },
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedLang, setSelectedLang] = useState('en');
    const triggerRef = useRef<HTMLButtonElement>(null);

    const languages = [
      { code: 'en', name: 'English', flag: '🇺🇸' },
      { code: 'es', name: 'Español', flag: '🇪🇸' },
      { code: 'fr', name: 'Français', flag: '🇫🇷' },
      { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
      { code: 'ja', name: '日本語', flag: '🇯🇵' },
    ];

    const selected = languages.find(lang => lang.code === selectedLang);

    return (
      <>
        <button
          ref={triggerRef}
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 border rounded-md hover:bg-muted transition-colors"
        >
          <span>{selected?.flag}</span>
          <span className="text-sm">{selected?.name}</span>
          <span className="text-xs">▼</span>
        </button>
        <Dropdown
          isOpen={isOpen}
          triggerRef={triggerRef}
          className="bg-background border rounded-md shadow-lg py-1 min-w-[150px]"
        >
          {languages.map(lang => (
            <button
              key={lang.code}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors ${
                lang.code === selectedLang ? 'bg-muted' : ''
              }`}
              onClick={() => {
                setSelectedLang(lang.code);
                setIsOpen(false);
              }}
            >
              <span>{lang.flag}</span>
              <span>{lang.name}</span>
              {lang.code === selectedLang && <span className="ml-auto">✓</span>}
            </button>
          ))}
        </Dropdown>
      </>
    );
  },
};

// Dropdown with interaction test
export const InteractionTest: Story = {
  args: {
    isOpen: false,
    triggerRef: { current: null },
    children: <div />,
  },
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState('');
    const triggerRef = useRef<HTMLButtonElement>(null);

    return (
      <div className="space-y-4">
        <button
          ref={triggerRef}
          onClick={() => setIsOpen(!isOpen)}
          className="px-4 py-2 border rounded-md"
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          Test Dropdown
        </button>
        <Dropdown
          isOpen={isOpen}
          triggerRef={triggerRef}
          className="bg-background border rounded-md shadow-lg py-1"
        >
          <button
            className="w-full px-4 py-2 text-left text-sm hover:bg-muted"
            onClick={() => {
              setSelectedItem('Item 1');
              setIsOpen(false);
            }}
          >
            Item 1
          </button>
          <button
            className="w-full px-4 py-2 text-left text-sm hover:bg-muted"
            onClick={() => {
              setSelectedItem('Item 2');
              setIsOpen(false);
            }}
          >
            Item 2
          </button>
        </Dropdown>
        {selectedItem && (
          <p className="text-sm text-muted-foreground">
            Selected: {selectedItem}
          </p>
        )}
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Get trigger button
    const trigger = canvas.getByRole('button', { name: 'Test Dropdown' });
    
    // Initially closed
    void expect(trigger).toHaveAttribute('aria-expanded', 'false');
    
    // Click to open
    await userEvent.click(trigger);
    void expect(trigger).toHaveAttribute('aria-expanded', 'true');
    
    // Find dropdown items
    const item1 = await canvas.findByText('Item 1');
    void expect(item1).toBeVisible();
    
    // Click an item
    await userEvent.click(item1);
    
    // Dropdown should close and selection should be shown
    void expect(trigger).toHaveAttribute('aria-expanded', 'false');
    const selectedText = canvas.getByText('Selected: Item 1');
    void expect(selectedText).toBeInTheDocument();
  },
};

// Dropdown with search
export const SearchableDropdown: Story = {
  args: {
    isOpen: false,
    triggerRef: { current: null },
    children: <div />,
  },
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const triggerRef = useRef<HTMLButtonElement>(null);

    const items = [
      'Apple', 'Banana', 'Cherry', 'Date', 'Elderberry',
      'Fig', 'Grape', 'Honeydew', 'Kiwi', 'Lemon',
    ];

    const filteredItems = items.filter(item =>
      item.toLowerCase().includes(search.toLowerCase()),
    );

    return (
      <>
        <Button
          ref={triggerRef}
          onClick={() => setIsOpen(!isOpen)}
          variant="outline"
        >
          Select Fruit
        </Button>
        <Dropdown
          isOpen={isOpen}
          triggerRef={triggerRef}
          className="bg-background border rounded-md shadow-lg p-2 w-64"
        >
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 border rounded-md text-sm mb-2"
            autoFocus
          />
          <div className="max-h-48 overflow-y-auto">
            {filteredItems.length > 0 ? (
              filteredItems.map(item => (
                <button
                  key={item}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-muted rounded transition-colors"
                  onClick={() => {
                    console.log(`Selected: ${item}`);
                    setIsOpen(false);
                    setSearch('');
                  }}
                >
                  {item}
                </button>
              ))
            ) : (
              <p className="px-3 py-2 text-sm text-muted-foreground">
                No results found
              </p>
            )}
          </div>
        </Dropdown>
      </>
    );
  },
};

// Multi-level dropdown
export const MultiLevelDropdown: Story = {
  args: {
    isOpen: false,
    triggerRef: { current: null },
    children: <div />,
  },
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    const [submenuOpen, setSubmenuOpen] = useState<string | null>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);

    return (
      <>
        <Button
          ref={triggerRef}
          onClick={() => setIsOpen(!isOpen)}
          variant="outline"
        >
          File Menu
        </Button>
        <Dropdown
          isOpen={isOpen}
          triggerRef={triggerRef}
          className="bg-background border rounded-md shadow-lg py-1 min-w-[200px]"
        >
          <button className="w-full px-4 py-2 text-left text-sm hover:bg-muted">
            New File
          </button>
          <button className="w-full px-4 py-2 text-left text-sm hover:bg-muted">
            Open...
          </button>
          <div
            className="relative"
            onMouseEnter={() => setSubmenuOpen('recent')}
            onMouseLeave={() => setSubmenuOpen(null)}
          >
            <button className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center justify-between">
              Open Recent
              <span className="text-xs">▶</span>
            </button>
            {submenuOpen === 'recent' && (
              <div className="absolute left-full top-0 ml-1 bg-background border rounded-md shadow-lg py-1 min-w-[150px]">
                <button className="w-full px-4 py-2 text-left text-sm hover:bg-muted">
                  project-1.txt
                </button>
                <button className="w-full px-4 py-2 text-left text-sm hover:bg-muted">
                  project-2.txt
                </button>
                <button className="w-full px-4 py-2 text-left text-sm hover:bg-muted">
                  project-3.txt
                </button>
              </div>
            )}
          </div>
          <div className="h-px bg-border my-1" />
          <button className="w-full px-4 py-2 text-left text-sm hover:bg-muted">
            Save
          </button>
          <button className="w-full px-4 py-2 text-left text-sm hover:bg-muted">
            Save As...
          </button>
        </Dropdown>
      </>
    );
  },
};

// Custom styled dropdown
export const CustomStyling: Story = {
  args: {
    isOpen: false,
    triggerRef: { current: null },
    children: <div />,
  },
  render: () => (
    <DropdownExample className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border-purple-200 dark:border-purple-800 rounded-lg shadow-xl p-6">
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100">
          Special Offer! 🎉
        </h3>
        <p className="text-sm text-purple-700 dark:text-purple-300">
          Get 25% off your next purchase with code SAVE25
        </p>
        <button className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-md hover:from-purple-700 hover:to-pink-700 transition-colors">
          Apply Discount
        </button>
      </div>
    </DropdownExample>
  ),
};

// Accessibility focused example
export const AccessibilityFeatures: Story = {
  args: {
    isOpen: false,
    triggerRef: { current: null },
    children: <div />,
  },
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);

    return (
      <>
        <button
          ref={triggerRef}
          onClick={() => setIsOpen(!isOpen)}
          className="px-4 py-2 border rounded-md"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-label="Select an option from the dropdown"
        >
          Accessible Dropdown
        </button>
        <Dropdown
          isOpen={isOpen}
          triggerRef={triggerRef}
          className="bg-background border rounded-md shadow-lg py-1"
          role="listbox"
          aria-label="Options"
        >
          <button
            role="option"
            aria-selected="false"
            className="w-full px-4 py-2 text-left text-sm hover:bg-muted"
            onClick={() => setIsOpen(false)}
          >
            Option 1
          </button>
          <button
            role="option"
            aria-selected="false"
            className="w-full px-4 py-2 text-left text-sm hover:bg-muted"
            onClick={() => setIsOpen(false)}
          >
            Option 2
          </button>
          <button
            role="option"
            aria-selected="false"
            className="w-full px-4 py-2 text-left text-sm hover:bg-muted"
            onClick={() => setIsOpen(false)}
          >
            Option 3
          </button>
        </Dropdown>
      </>
    );
  },
  parameters: {
    a11y: {
      config: {
        rules: [
          { id: 'aria-roles', enabled: true },
          { id: 'button-name', enabled: true },
        ],
      },
    },
  },
};