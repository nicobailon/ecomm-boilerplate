import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminPage from './index';
import { renderWithProviders } from '@/test/test-utils';

// Mock the tab components
vi.mock('./InventoryTab', () => ({
  InventoryTab: () => <div data-testid="inventory-tab">Inventory Tab Content</div>,
}));

vi.mock('./ProductsTab', () => ({
  ProductsTab: () => <div data-testid="products-tab">Products Tab Content</div>,
}));

vi.mock('./OrdersTab', () => ({
  OrdersTab: () => <div data-testid="orders-tab">Orders Tab Content</div>,
}));

vi.mock('./AnalyticsTab', () => ({
  default: () => <div data-testid="analytics-tab">Analytics Tab Content</div>,
}));

vi.mock('./DiscountsTab', () => ({
  default: () => <div data-testid="discounts-tab">Discounts Tab Content</div>,
}));

vi.mock('./CollectionsTab', () => ({
  CollectionsTab: () => <div data-testid="collections-tab">Collections Tab Content</div>,
}));

// Mock other components
vi.mock('@/components/forms/ProductForm', () => ({
  ProductForm: () => <div data-testid="product-form">Product Form</div>,
}));

vi.mock('@/components/product/ProductsTable', () => ({
  ProductsTable: ({ onEditProduct, highlightProductId }: any) => (
    <div data-testid="products-table">
      Products Table
      {highlightProductId && <span data-testid="highlight-id">{highlightProductId}</span>}
      <button onClick={() => onEditProduct({ _id: 'prod1', name: 'Test Product' })}>Edit Product</button>
    </div>
  ),
}));

vi.mock('@/components/drawers/ProductEditDrawer', () => ({
  ProductEditDrawer: ({ isOpen, product, onClose }: any) => (
    isOpen ? (
      <div data-testid="product-edit-drawer">
        Edit Drawer
        {product && <span>{product.name}</span>}
        <button onClick={onClose}>Close</button>
      </div>
    ) : null
  ),
}));

vi.mock('@/components/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: any) => <>{children}</>,
}));

vi.mock('@/components/discount/DiscountErrorFallback', () => ({
  DiscountErrorFallback: () => <div>Error</div>,
}));

vi.mock('@/components/ui/transition-overlay', () => ({
  TransitionOverlay: ({ isVisible, message }: any) => (
    isVisible ? <div data-testid="transition-overlay">{message}</div> : null
  ),
}));

vi.mock('@/components/ui/tabs', () => {
  const TabsContext = React.createContext<{ value: string; onValueChange: (value: string) => void } | null>(null);
  
  return {
    Tabs: ({ value, onValueChange, children }: any) => (
      <TabsContext.Provider value={{ value, onValueChange }}>
        <div data-testid="tabs" data-value={value}>
          {children}
        </div>
      </TabsContext.Provider>
    ),
    TabsList: ({ children }: any) => <div role="tablist">{children}</div>,
    TabsTrigger: ({ value: triggerValue, children, disabled, id, className }: any) => {
      const context = React.useContext(TabsContext);
      return (
        <button
          role="tab"
          id={id}
          aria-selected={context?.value === triggerValue ? 'true' : 'false'}
          onClick={() => {
            if (!disabled && context) {
              context.onValueChange(triggerValue);
            }
          }}
          disabled={disabled}
          className={className}
        >
          {children}
        </button>
      );
    },
    TabsContent: ({ value: contentValue, children }: any) => {
      const context = React.useContext(TabsContext);
      return context?.value === contentValue ? (
        <div role="tabpanel" aria-labelledby={`${contentValue}-tab`}>{children}</div>
      ) : null;
    },
  };
});

// Mock hooks
vi.mock('@/hooks/product/useProductCreation', () => ({
  useProductCreation: () => {
    return {
      isNavigating: false,
      newProductId: null,
      clearHighlight: vi.fn(),
    };
  },
}));

vi.mock('@/hooks/product/useProductEditor', () => ({
  useProductEditor: () => ({
    selectedProduct: null,
    isEditDrawerOpen: false,
    openEditor: vi.fn(),
    closeEditor: vi.fn(),
  }),
}));

// Mock useAuthUser hook
const mockUser = {
  _id: 'user1',
  name: 'Admin User',
  email: 'admin@example.com',
  role: 'admin',
};

vi.mock('@/hooks/useAuthUser', () => ({
  useAuthUser: vi.fn(() => mockUser),
}));

describe('AdminPage', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('tab navigation', () => {
    it('should render all tabs', () => {
      renderWithProviders(<AdminPage />);

      expect(screen.getByRole('tab', { name: /inventory/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /products/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /orders/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /analytics/i })).toBeInTheDocument();
    });

    it('should show create product form by default', () => {
      renderWithProviders(<AdminPage />);

      expect(screen.getByTestId('product-form')).toBeInTheDocument();
      expect(screen.queryByTestId('products-tab')).not.toBeInTheDocument();
      expect(screen.queryByTestId('orders-tab')).not.toBeInTheDocument();
      expect(screen.queryByTestId('analytics-tab')).not.toBeInTheDocument();
    });

    it('should switch to orders tab when clicked', async () => {
      renderWithProviders(<AdminPage />);

      const ordersTab = screen.getByRole('tab', { name: /orders/i });
      await user.click(ordersTab);

      expect(screen.queryByTestId('inventory-tab')).not.toBeInTheDocument();
      expect(screen.queryByTestId('products-tab')).not.toBeInTheDocument();
      expect(screen.getByTestId('orders-tab')).toBeInTheDocument();
      expect(screen.queryByTestId('analytics-tab')).not.toBeInTheDocument();
    });

    it('should maintain tab state when switching between tabs', async () => {
      renderWithProviders(<AdminPage />);

      // Switch to orders tab
      const ordersTab = screen.getByRole('tab', { name: /orders/i });
      await user.click(ordersTab);
      expect(screen.getByTestId('orders-tab')).toBeInTheDocument();

      // Switch to products tab
      const productsTab = screen.getByRole('tab', { name: /products/i });
      await user.click(productsTab);
      expect(screen.getByTestId('products-table')).toBeInTheDocument();

      // Switch back to orders tab
      await user.click(ordersTab);
      expect(screen.getByTestId('orders-tab')).toBeInTheDocument();
    });

    it('should update aria-selected attribute correctly', async () => {
      renderWithProviders(<AdminPage />);

      const createTab = screen.getByRole('tab', { name: /create product/i });
      const ordersTab = screen.getByRole('tab', { name: /orders/i });

      expect(createTab).toHaveAttribute('aria-selected', 'true');
      expect(ordersTab).toHaveAttribute('aria-selected', 'false');

      await user.click(ordersTab);

      expect(createTab).toHaveAttribute('aria-selected', 'false');
      expect(ordersTab).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('orders tab integration', () => {
    it('should render OrdersTab component when orders tab is active', async () => {
      renderWithProviders(<AdminPage />);

      const ordersTab = screen.getByRole('tab', { name: /orders/i });
      await user.click(ordersTab);

      expect(screen.getByTestId('orders-tab')).toBeInTheDocument();
    });

    it('should have proper tab panel attributes for orders tab', async () => {
      const { container } = renderWithProviders(<AdminPage />);

      const ordersTab = screen.getByRole('tab', { name: /orders/i });
      await user.click(ordersTab);

      const tabPanel = container.querySelector('[role="tabpanel"]');
      expect(tabPanel).toHaveAttribute('aria-labelledby', 'orders-tab');
    });

    it.skip('should handle keyboard navigation to orders tab', async () => {
      // Skip for now - keyboard navigation requires more complex mocking
      renderWithProviders(<AdminPage />);

      const inventoryTab = screen.getByRole('tab', { name: /inventory/i });
      inventoryTab.focus();

      // Navigate to orders tab using arrow keys
      await user.keyboard('{ArrowRight}{ArrowRight}');

      // Orders tab should be focused
      const ordersTab = screen.getByRole('tab', { name: /orders/i });
      expect(document.activeElement).toBe(ordersTab);

      // Press Enter to activate
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.getByTestId('orders-tab')).toBeInTheDocument();
      });
    });

    it('should show orders tab icon', () => {
      renderWithProviders(<AdminPage />);

      const ordersTab = screen.getByRole('tab', { name: /orders/i });
      const icon = ordersTab.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      const { container } = renderWithProviders(<AdminPage />);

      const tabList = screen.getByRole('tablist');
      expect(tabList).toBeInTheDocument();

      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(7); // create, products, collections, analytics, discounts, inventory, orders

      const tabPanel = container.querySelector('[role="tabpanel"]');
      expect(tabPanel).toBeInTheDocument();
    });

    it.skip('should support keyboard navigation', async () => {
      // Skip for now - keyboard navigation requires more complex mocking
      renderWithProviders(<AdminPage />);

      const firstTab = screen.getByRole('tab', { name: /inventory/i });
      firstTab.focus();

      // Navigate through tabs using arrow keys
      await user.keyboard('{ArrowRight}');
      expect(document.activeElement).toBe(screen.getByRole('tab', { name: /products/i }));

      await user.keyboard('{ArrowRight}');
      expect(document.activeElement).toBe(screen.getByRole('tab', { name: /orders/i }));

      await user.keyboard('{ArrowRight}');
      expect(document.activeElement).toBe(screen.getByRole('tab', { name: /analytics/i }));

      // Wrap around
      await user.keyboard('{ArrowRight}');
      expect(document.activeElement).toBe(screen.getByRole('tab', { name: /inventory/i }));

      // Navigate backwards
      await user.keyboard('{ArrowLeft}');
      expect(document.activeElement).toBe(screen.getByRole('tab', { name: /analytics/i }));
    });

    it.skip('should activate tab on Enter or Space key', async () => {
      // Skip for now - keyboard navigation requires more complex mocking
      renderWithProviders(<AdminPage />);

      const ordersTab = screen.getByRole('tab', { name: /orders/i });
      ordersTab.focus();

      await user.keyboard('{Enter}');
      expect(screen.getByTestId('orders-tab')).toBeInTheDocument();

      // Switch to another tab
      const productsTab = screen.getByRole('tab', { name: /products/i });
      productsTab.focus();

      await user.keyboard(' '); // Space key
      expect(screen.getByTestId('products-tab')).toBeInTheDocument();
    });
  });

  describe('page structure', () => {
    it('should have proper page title', () => {
      renderWithProviders(<AdminPage />);

      expect(screen.getByRole('heading', { name: /admin dashboard/i })).toBeInTheDocument();
    });

    it('should maintain consistent layout when switching tabs', async () => {
      const { container } = renderWithProviders(<AdminPage />);

      // Check that tabs structure exists
      expect(screen.getByTestId('tabs')).toBeInTheDocument();

      // Switch to orders tab
      const ordersTab = screen.getByRole('tab', { name: /orders/i });
      await user.click(ordersTab);

      // Layout should remain consistent
      expect(screen.getByTestId('tabs')).toBeInTheDocument();
      expect(container.querySelector('[role="tabpanel"]')).toBeInTheDocument();
    });
  });
});

