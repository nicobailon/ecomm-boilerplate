import type { Meta, StoryObj } from '@storybook/react-vite';
import Navbar from './Navbar';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { trpc } from '@/lib/trpc';
import { createTRPCClient } from '@/lib/trpc-client';
import { within, userEvent, expect, waitFor } from '@storybook/test';
import type { User } from '@/types';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Menu, X, Search, User as UserIcon, ChevronDown } from 'lucide-react';

const mockCustomerUser: User = {
  _id: '1',
  name: 'John Doe',
  email: 'john@example.com',
  role: 'customer',
  cartItems: [],
};

const mockAdminUser: User = {
  _id: '2',
  name: 'Admin User',
  email: 'admin@example.com',
  role: 'admin',
  cartItems: [],
};

const mockCartItems = [
  {
    product: {
      _id: 'prod1',
      name: 'Test Product',
      price: 99.99,
      image: 'https://example.com/product.jpg',
      description: 'Test description',
      isFeatured: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    quantity: 2,
  },
  {
    product: {
      _id: 'prod2',
      name: 'Another Product',
      price: 49.99,
      image: 'https://example.com/product2.jpg',
      description: 'Another description',
      isFeatured: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    quantity: 1,
  },
];

// Wrapper component for providing context
const NavbarWrapper = ({ 
  user = null, 
  cartItems = [],
  initialPath = '/',
}: { 
  user?: User | null;
  cartItems?: any[];
  initialPath?: string;
}) => {
  const mockQueryClient = new QueryClient({
    defaultOptions: {
      queries: { staleTime: Infinity, retry: false },
    },
  });
  
  // Mock auth profile data
  if (user) {
    mockQueryClient.setQueryData(['auth.profile'], user);
  }
  
  // Mock cart data
  mockQueryClient.setQueryData(['cart'], {
    cartItems,
    subtotal: cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0),
    totalAmount: cartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0),
    appliedCoupon: null,
  });
  
  return (
    <MemoryRouter initialEntries={[initialPath]}>
      <QueryClientProvider client={mockQueryClient}>
        <trpc.Provider client={createTRPCClient()} queryClient={mockQueryClient}>
          <div className="min-h-[200px] bg-background">
            <Navbar />
          </div>
        </trpc.Provider>
      </QueryClientProvider>
    </MemoryRouter>
  );
};

const meta: Meta<typeof Navbar> = {
  title: 'Layout/Navbar',
  component: Navbar,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const GuestUser: Story = {
  render: () => <NavbarWrapper />,
};

export const LoggedInCustomer: Story = {
  render: () => <NavbarWrapper user={mockCustomerUser} />,
};

export const LoggedInAdmin: Story = {
  render: () => <NavbarWrapper user={mockAdminUser} />,
};

export const AdminOnDashboard: Story = {
  render: () => <NavbarWrapper user={mockAdminUser} initialPath="/secret-dashboard" />,
};

export const WithCartItems: Story = {
  render: () => <NavbarWrapper user={mockCustomerUser} cartItems={mockCartItems} />,
};

export const WithManyCartItems: Story = {
  render: () => {
    const manyItems = Array.from({ length: 15 }, (_, i) => ({
      product: {
        _id: `prod${i}`,
        name: `Product ${i + 1}`,
        price: 29.99 + i,
        image: `https://example.com/product${i}.jpg`,
        description: `Description ${i + 1}`,
        isFeatured: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      quantity: 1,
    }));
    return <NavbarWrapper user={mockCustomerUser} cartItems={manyItems} />;
  },
};

export const MobileView: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  render: () => <NavbarWrapper user={mockCustomerUser} cartItems={mockCartItems} />,
};

export const TabletView: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
  render: () => <NavbarWrapper user={mockAdminUser} />,
};

export const DarkMode: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
  },
  render: () => (
    <div className="dark">
      <NavbarWrapper user={mockCustomerUser} cartItems={mockCartItems} />
    </div>
  ),
};

export const LogoutInteraction: Story = {
  render: () => <NavbarWrapper user={mockCustomerUser} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Find and click logout button
    const logoutButton = await canvas.findByRole('button', { name: /log out/i });
    await userEvent.click(logoutButton);
    
    // Button should show loading state
    await expect(logoutButton).toHaveTextContent(/logging out/i);
    await expect(logoutButton).toBeDisabled();
  },
};

export const NavigationActive: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-2">Home Page Active</h3>
        <NavbarWrapper user={mockCustomerUser} initialPath="/" />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Dashboard Active (Admin)</h3>
        <NavbarWrapper user={mockAdminUser} initialPath="/secret-dashboard" />
      </div>
    </div>
  ),
};

export const ThemeToggle: Story = {
  render: () => <NavbarWrapper user={mockCustomerUser} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Find theme toggle button (it should have an icon)
    const themeToggle = canvas.getByRole('button', { name: /toggle theme/i });
    
    // Click to toggle theme
    await userEvent.click(themeToggle);
    
    // The button should still be there and clickable
    await expect(themeToggle).toBeInTheDocument();
  },
};

export const ResponsiveText: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-2">Desktop View - Full Text</h3>
        <div className="w-full">
          <NavbarWrapper user={mockAdminUser} cartItems={mockCartItems} />
        </div>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Mobile View - Icons Only</h3>
        <div className="w-[375px] mx-auto border">
          <NavbarWrapper user={mockAdminUser} cartItems={mockCartItems} />
        </div>
      </div>
    </div>
  ),
};

export const ScrolledState: Story = {
  render: () => (
    <div>
      <NavbarWrapper user={mockCustomerUser} cartItems={mockCartItems} />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Page Content</h1>
        <p className="mb-4">The navbar has a backdrop blur effect and semi-transparent background.</p>
        <div className="h-[800px] bg-muted rounded-lg p-4">
          <p>Scroll down to see the navbar&apos;s fixed positioning and backdrop effect.</p>
        </div>
      </div>
    </div>
  ),
};

export const LoadingState: Story = {
  render: () => {
    // Create a custom query client that simulates loading
    const loadingQueryClient = new QueryClient({
      defaultOptions: {
        queries: { 
          staleTime: Infinity,
          retry: false,
        },
      },
    });
    
    // Don't set any data to simulate loading
    
    return (
      <MemoryRouter>
        <QueryClientProvider client={loadingQueryClient}>
          <trpc.Provider client={createTRPCClient()} queryClient={loadingQueryClient}>
            <div className="min-h-[200px] bg-background">
              <Navbar />
            </div>
          </trpc.Provider>
        </QueryClientProvider>
      </MemoryRouter>
    );
  },
};

// Enhanced Navbar with mobile menu and search
const EnhancedNavbar = ({ user, cartItems }: { user?: User | null; cartItems?: any[] }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const mockQueryClient = new QueryClient({
    defaultOptions: {
      queries: { staleTime: Infinity, retry: false },
    },
  });
  
  // Mock auth profile data
  if (user) {
    mockQueryClient.setQueryData(['auth.profile'], user);
  }
  
  // Mock cart data
  mockQueryClient.setQueryData(['cart'], {
    cartItems: cartItems || [],
    subtotal: (cartItems || []).reduce((sum, item) => sum + (item.product.price * item.quantity), 0),
    totalAmount: (cartItems || []).reduce((sum, item) => sum + (item.product.price * item.quantity), 0),
    appliedCoupon: null,
  });
  
  const cartItemsCount = (cartItems || []).reduce((sum, item) => sum + item.quantity, 0);
  
  return (
    <QueryClientProvider client={mockQueryClient}>
      <trpc.Provider client={createTRPCClient()} queryClient={mockQueryClient}>
        <div className="min-h-[200px] bg-background">
          {/* Enhanced Navbar */}
          <header className="fixed top-0 left-0 w-full bg-background/90 backdrop-blur-md shadow-lg z-40 transition-all duration-300 border-b border-border">
            <div className="container mx-auto px-4 py-3">
              <div className="flex justify-between items-center">
                {/* Logo */}
                <a href="/" className="text-2xl font-bold text-primary">
                  E-Commerce
                </a>
                
                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center gap-4">
                  <a href="/" className="text-muted-foreground hover:text-primary transition-colors">
                    Home
                  </a>
                  
                  {/* Search Bar */}
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsSearchOpen(!isSearchOpen)}
                      data-testid="search-toggle"
                    >
                      <Search className="h-5 w-5" />
                    </Button>
                    {isSearchOpen && (
                      <div className="absolute top-full right-0 mt-2 w-64 bg-background border rounded-lg shadow-lg p-2">
                        <Input
                          type="text"
                          placeholder="Search products..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full"
                          data-testid="search-input"
                          autoFocus
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* Cart */}
                  <a href="/cart" className="relative group text-muted-foreground hover:text-primary transition-colors">
                    <div className="flex items-center gap-1">
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17M17 13v8m0-8l2.293 2.293c.63.63.184 1.707-.707 1.707H5.414M17 21a2 2 0 11-4 0 2 2 0 014 0zm-10 0a2 2 0 11-4 0 2 2 0 014 0z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span>Cart</span>
                    </div>
                    {cartItemsCount > 0 && (
                      <span
                        className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs"
                        data-testid="cart-badge"
                      >
                        {cartItemsCount}
                      </span>
                    )}
                  </a>
                  
                  {/* User Menu */}
                  {user ? (
                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                        className="flex items-center gap-2"
                        data-testid="user-menu-toggle"
                      >
                        <UserIcon className="h-5 w-5" />
                        <span>{user.name}</span>
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                      {isUserMenuOpen && (
                        <div className="absolute top-full right-0 mt-2 w-48 bg-background border rounded-lg shadow-lg py-2">
                          <div className="px-4 py-2 border-b">
                            <p className="text-sm font-medium">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                          <a href="/profile" className="block px-4 py-2 text-sm hover:bg-muted transition-colors">
                            Profile
                          </a>
                          <a href="/orders" className="block px-4 py-2 text-sm hover:bg-muted transition-colors">
                            Orders
                          </a>
                          {user.role === 'admin' && (
                            <a href="/secret-dashboard" className="block px-4 py-2 text-sm hover:bg-muted transition-colors">
                              Dashboard
                            </a>
                          )}
                          <button className="w-full text-left px-4 py-2 text-sm hover:bg-muted transition-colors text-destructive">
                            Log Out
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <a href="/login" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                        Login
                      </a>
                      <a href="/signup" className="text-sm bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors">
                        Sign Up
                      </a>
                    </div>
                  )}
                </nav>
                
                {/* Mobile Menu Button */}
                <button
                  className="md:hidden p-2"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  data-testid="mobile-menu-toggle"
                >
                  {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
              </div>
              
              {/* Mobile Menu */}
              {isMobileMenuOpen && (
                <nav className="md:hidden mt-4 pb-4 border-t pt-4">
                  <a href="/" className="block py-2 text-muted-foreground hover:text-primary transition-colors">
                    Home
                  </a>
                  <a href="/cart" className="block py-2 text-muted-foreground hover:text-primary transition-colors">
                    Cart {cartItemsCount > 0 && `(${cartItemsCount})`}
                  </a>
                  {user ? (
                    <>
                      <a href="/profile" className="block py-2 text-muted-foreground hover:text-primary transition-colors">
                        Profile
                      </a>
                      <a href="/orders" className="block py-2 text-muted-foreground hover:text-primary transition-colors">
                        Orders
                      </a>
                      {user.role === 'admin' && (
                        <a href="/secret-dashboard" className="block py-2 text-muted-foreground hover:text-primary transition-colors">
                          Dashboard
                        </a>
                      )}
                      <button className="block w-full text-left py-2 text-destructive hover:text-destructive/80 transition-colors">
                        Log Out
                      </button>
                    </>
                  ) : (
                    <>
                      <a href="/login" className="block py-2 text-muted-foreground hover:text-primary transition-colors">
                        Login
                      </a>
                      <a href="/signup" className="block py-2 text-muted-foreground hover:text-primary transition-colors">
                        Sign Up
                      </a>
                    </>
                  )}
                  
                  {/* Mobile Search */}
                  <div className="mt-4 border-t pt-4">
                    <Input
                      type="text"
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full"
                      data-testid="mobile-search-input"
                    />
                  </div>
                </nav>
              )}
            </div>
          </header>
        </div>
      </trpc.Provider>
    </QueryClientProvider>
  );
};

export const MobileMenuInteraction: Story = {
  render: () => <EnhancedNavbar user={mockCustomerUser} cartItems={mockCartItems} />,
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Click mobile menu toggle
    const menuToggle = canvas.getByTestId('mobile-menu-toggle');
    await userEvent.click(menuToggle);
    
    // Menu should be open
    await waitFor(() => {
      expect(canvas.getByText('Orders')).toBeInTheDocument();
    });
    
    // Click again to close
    await userEvent.click(menuToggle);
    
    // Menu should be closed
    await waitFor(() => {
      expect(canvas.queryByText('Orders')).not.toBeInTheDocument();
    });
  },
};

export const SearchFunctionality: Story = {
  render: () => <EnhancedNavbar user={mockCustomerUser} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Click search toggle
    const searchToggle = canvas.getByTestId('search-toggle');
    await userEvent.click(searchToggle);
    
    // Search input should appear
    await waitFor(() => {
      const searchInput = canvas.getByTestId('search-input');
      expect(searchInput).toBeInTheDocument();
    });
    
    // Type in search
    const searchInput = canvas.getByTestId('search-input');
    await userEvent.type(searchInput, 'laptop');
    
    // Verify search value
    expect(searchInput).toHaveValue('laptop');
  },
};

export const CartBadgeUpdates: Story = {
  render: () => {
    const [cartItems, setCartItems] = useState(mockCartItems);
    
    const addItem = () => {
      setCartItems([...cartItems, {
        product: {
          _id: `prod${cartItems.length + 1}`,
          name: `New Product ${cartItems.length + 1}`,
          price: 39.99,
          image: 'https://example.com/new.jpg',
          description: 'New product',
          isFeatured: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        quantity: 1,
      }]);
    };
    
    const removeItem = () => {
      setCartItems(cartItems.slice(0, -1));
    };
    
    return (
      <div className="space-y-4">
        <EnhancedNavbar user={mockCustomerUser} cartItems={cartItems} />
        <div className="mt-20 p-4 space-x-4">
          <Button onClick={addItem}>Add Item to Cart</Button>
          <Button onClick={removeItem} variant="destructive" disabled={cartItems.length === 0}>
            Remove Item from Cart
          </Button>
          <span className="text-sm text-muted-foreground">
            Current items: {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
          </span>
        </div>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Initial badge should show 3
    const badge = canvas.getByTestId('cart-badge');
    expect(badge).toHaveTextContent('3');
    
    // Add item
    const addButton = canvas.getByText('Add Item to Cart');
    await userEvent.click(addButton);
    
    // Badge should update to 4
    await waitFor(() => {
      expect(badge).toHaveTextContent('4');
    });
    
    // Remove item
    const removeButton = canvas.getByText('Remove Item from Cart');
    await userEvent.click(removeButton);
    
    // Badge should update back to 3
    await waitFor(() => {
      expect(badge).toHaveTextContent('3');
    });
  },
};

export const UserMenuInteraction: Story = {
  render: () => <EnhancedNavbar user={mockAdminUser} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Click user menu toggle
    const userMenuToggle = canvas.getByTestId('user-menu-toggle');
    await userEvent.click(userMenuToggle);
    
    // Menu should open with user info
    await waitFor(() => {
      expect(canvas.getByText(mockAdminUser.email)).toBeInTheDocument();
      expect(canvas.getByText('Dashboard')).toBeInTheDocument(); // Admin only
    });
    
    // Click outside to close (simulate by clicking toggle again)
    await userEvent.click(userMenuToggle);
    
    // Menu should close
    await waitFor(() => {
      expect(canvas.queryByText(mockAdminUser.email)).not.toBeInTheDocument();
    });
  },
};

export const MobileSearchInteraction: Story = {
  render: () => <EnhancedNavbar user={mockCustomerUser} cartItems={mockCartItems} />,
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Open mobile menu
    const menuToggle = canvas.getByTestId('mobile-menu-toggle');
    await userEvent.click(menuToggle);
    
    // Find mobile search input
    await waitFor(() => {
      const mobileSearch = canvas.getByTestId('mobile-search-input');
      expect(mobileSearch).toBeInTheDocument();
    });
    
    // Type in mobile search
    const mobileSearch = canvas.getByTestId('mobile-search-input');
    await userEvent.type(mobileSearch, 'phone case');
    
    // Verify search value
    expect(mobileSearch).toHaveValue('phone case');
  },
};

export const CompleteNavbarFlow: Story = {
  render: () => <EnhancedNavbar user={mockCustomerUser} cartItems={mockCartItems} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Test search
    const searchToggle = canvas.getByTestId('search-toggle');
    await userEvent.click(searchToggle);
    
    const searchInput = await canvas.findByTestId('search-input');
    await userEvent.type(searchInput, 'test search');
    
    // Test user menu
    const userMenuToggle = canvas.getByTestId('user-menu-toggle');
    await userEvent.click(userMenuToggle);
    
    // Verify menu items
    await waitFor(() => {
      expect(canvas.getByText('Profile')).toBeInTheDocument();
      expect(canvas.getByText('Orders')).toBeInTheDocument();
    });
    
    // Close user menu
    await userEvent.click(userMenuToggle);
  },
};

export const ResponsiveBreakpoints: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-medium mb-2">Mobile View (&lt; 768px)</h3>
        <div className="w-[375px] mx-auto border rounded overflow-hidden">
          <EnhancedNavbar user={mockCustomerUser} cartItems={mockCartItems} />
        </div>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Tablet View (768px - 1024px)</h3>
        <div className="w-[768px] mx-auto border rounded overflow-hidden">
          <EnhancedNavbar user={mockCustomerUser} cartItems={mockCartItems} />
        </div>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">Desktop View (&gt; 1024px)</h3>
        <div className="w-full border rounded overflow-hidden">
          <EnhancedNavbar user={mockCustomerUser} cartItems={mockCartItems} />
        </div>
      </div>
    </div>
  ),
};