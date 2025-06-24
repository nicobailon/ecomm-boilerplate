import type { Meta, StoryObj } from '@storybook/react-vite';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ProductInfo } from './ProductInfo';
import { mockProduct, mockProductOnSale, mockProductOutOfStock } from '@/test/mocks';
import { useUnifiedAddToCart } from '@/hooks/cart/useUnifiedCart';
import { useProductInventory } from '@/hooks/queries/useInventory';
import { vi } from 'vitest';
import { userEvent, within } from '@storybook/test';
import type { Product } from '@/types';

// Mock the hooks
vi.mock('@/hooks/cart/useUnifiedCart');
vi.mock('@/hooks/queries/useInventory');

const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const meta = {
  title: 'Product/ProductInfo',
  component: ProductInfo,
  decorators: [
    (Story) => {
      const queryClient = createQueryClient();
      return (
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <div className="max-w-2xl mx-auto p-4">
              <Story />
            </div>
          </BrowserRouter>
        </QueryClientProvider>
      );
    },
  ],
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ProductInfo>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockAddToCart = {
  mutate: vi.fn(),
  mutateAsync: vi.fn().mockResolvedValue({}),
  isPending: false,
};

const mockInventoryData = {
  availableStock: 50,
  currentStock: 50,
};

const createProductWithVariants = (): Product => ({
  ...mockProduct,
  variants: [
    {
      variantId: 'var-1',
      label: 'Black / Small',
      color: '#000000',
      price: 299,
      inventory: 10,
      images: [],
      sku: 'WH-BLACK-S',
    },
    {
      variantId: 'var-2',
      label: 'White / Medium',
      color: '#FFFFFF',
      price: 299,
      inventory: 25,
      images: [],
      sku: 'WH-WHITE-M',
    },
    {
      variantId: 'var-3',
      label: 'Blue / Large',
      color: '#0000FF',
      price: 319,
      inventory: 0,
      images: [],
      sku: 'WH-BLUE-L',
    },
  ],
});

export const Default: Story = {
  args: {
    product: mockProduct,
    selectedVariant: null,
  },
  decorators: [
    (Story) => {
      (useUnifiedAddToCart as any).mockReturnValue(mockAddToCart);
      (useProductInventory as any).mockReturnValue({
        data: mockInventoryData,
        isLoading: false,
      });
      return <Story />;
    },
  ],
};

export const WithSelectedVariant: Story = {
  args: {
    product: createProductWithVariants(),
    selectedVariant: {
      variantId: 'var-1',
      label: 'Black / Small',
      color: '#000000',
      price: 299,
      inventory: 10,
      images: [],
      sku: 'WH-BLACK-S',
    },
  },
  decorators: [
    (Story) => {
      (useUnifiedAddToCart as any).mockReturnValue(mockAddToCart);
      (useProductInventory as any).mockReturnValue({
        data: { availableStock: 10, currentStock: 10 },
        isLoading: false,
      });
      return <Story />;
    },
  ],
};

export const OutOfStock: Story = {
  args: {
    product: mockProductOutOfStock,
    selectedVariant: null,
  },
  decorators: [
    (Story) => {
      (useUnifiedAddToCart as any).mockReturnValue(mockAddToCart);
      (useProductInventory as any).mockReturnValue({
        data: { availableStock: 0, currentStock: 0 },
        isLoading: false,
      });
      return <Story />;
    },
  ],
};

export const LowStock: Story = {
  args: {
    product: mockProduct,
    selectedVariant: null,
  },
  decorators: [
    (Story) => {
      (useUnifiedAddToCart as any).mockReturnValue(mockAddToCart);
      (useProductInventory as any).mockReturnValue({
        data: { availableStock: 3, currentStock: 3 },
        isLoading: false,
      });
      return <Story />;
    },
  ],
};

export const OnSale: Story = {
  args: {
    product: mockProductOnSale,
    selectedVariant: null,
  },
  decorators: [
    (Story) => {
      (useUnifiedAddToCart as any).mockReturnValue(mockAddToCart);
      (useProductInventory as any).mockReturnValue({
        data: mockInventoryData,
        isLoading: false,
      });
      return <Story />;
    },
  ],
};

export const NeedsVariantSelection: Story = {
  args: {
    product: createProductWithVariants(),
    selectedVariant: null,
  },
  decorators: [
    (Story) => {
      (useUnifiedAddToCart as any).mockReturnValue(mockAddToCart);
      (useProductInventory as any).mockReturnValue({
        data: null,
        isLoading: false,
      });
      return <Story />;
    },
  ],
};

export const LoadingInventory: Story = {
  args: {
    product: mockProduct,
    selectedVariant: null,
  },
  decorators: [
    (Story) => {
      (useUnifiedAddToCart as any).mockReturnValue(mockAddToCart);
      (useProductInventory as any).mockReturnValue({
        data: null,
        isLoading: true,
      });
      return <Story />;
    },
  ],
};

export const AddingToCart: Story = {
  args: {
    product: mockProduct,
    selectedVariant: null,
  },
  decorators: [
    (Story) => {
      (useUnifiedAddToCart as any).mockReturnValue({
        ...mockAddToCart,
        isPending: true,
      });
      (useProductInventory as any).mockReturnValue({
        data: mockInventoryData,
        isLoading: false,
      });
      return <Story />;
    },
  ],
};

export const QuantitySelector: Story = {
  args: {
    product: mockProduct,
    selectedVariant: null,
  },
  decorators: [
    (Story) => {
      (useUnifiedAddToCart as any).mockReturnValue(mockAddToCart);
      (useProductInventory as any).mockReturnValue({
        data: { availableStock: 20, currentStock: 20 },
        isLoading: false,
      });
      return <Story />;
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Increase quantity
    const increaseButton = canvas.getByLabelText('Increase quantity');
    await userEvent.click(increaseButton);
    await userEvent.click(increaseButton);
    
    // Type in quantity input
    const quantityInput = canvas.getByLabelText('Quantity');
    await userEvent.clear(quantityInput);
    await userEvent.type(quantityInput, '5');
  },
};

export const VariantWithPriceDifference: Story = {
  args: {
    product: createProductWithVariants(),
    selectedVariant: {
      variantId: 'var-3',
      label: 'Premium Edition',
      price: 399,
      inventory: 15,
      images: [],
    },
  },
  decorators: [
    (Story) => {
      (useUnifiedAddToCart as any).mockReturnValue(mockAddToCart);
      (useProductInventory as any).mockReturnValue({
        data: { availableStock: 15, currentStock: 15 },
        isLoading: false,
      });
      return <Story />;
    },
  ],
};

export const NotifyWhenAvailable: Story = {
  args: {
    product: createProductWithVariants(),
    selectedVariant: {
      variantId: 'var-3',
      label: 'Blue / Large',
      color: '#0000FF',
      price: 319,
      inventory: 0,
      images: [],
      sku: 'WH-BLUE-L',
    },
  },
  decorators: [
    (Story) => {
      (useUnifiedAddToCart as any).mockReturnValue(mockAddToCart);
      (useProductInventory as any).mockReturnValue({
        data: { availableStock: 0, currentStock: 0 },
        isLoading: false,
      });
      return <Story />;
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Click notify button
    const notifyButton = canvas.getByText('Notify me when available');
    await userEvent.click(notifyButton);
  },
};

export const LongDescription: Story = {
  args: {
    product: {
      ...mockProduct,
      description: 'Experience unparalleled audio quality with our Premium Wireless Headphones. Featuring advanced noise-cancellation technology, these headphones deliver crystal-clear sound across all frequencies. The ergonomic design ensures comfort during extended listening sessions, while the premium materials guarantee durability. With up to 30 hours of battery life, wireless connectivity, and intuitive touch controls, these headphones are perfect for music enthusiasts, professionals, and travelers alike. The included carrying case and auxiliary cable provide added convenience for any situation.',
    },
    selectedVariant: null,
  },
  decorators: [
    (Story) => {
      (useUnifiedAddToCart as any).mockReturnValue(mockAddToCart);
      (useProductInventory as any).mockReturnValue({
        data: mockInventoryData,
        isLoading: false,
      });
      return <Story />;
    },
  ],
};

export const MobileView: Story = {
  args: {
    product: mockProduct,
    selectedVariant: null,
  },
  decorators: [
    (Story) => {
      (useUnifiedAddToCart as any).mockReturnValue(mockAddToCart);
      (useProductInventory as any).mockReturnValue({
        data: mockInventoryData,
        isLoading: false,
      });
      return <Story />;
    },
  ],
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const TabletView: Story = {
  args: {
    product: createProductWithVariants(),
    selectedVariant: {
      variantId: 'var-2',
      label: 'White / Medium',
      color: '#FFFFFF',
      price: 299,
      inventory: 25,
      images: [],
      sku: 'WH-WHITE-M',
    },
  },
  decorators: [
    (Story) => {
      (useUnifiedAddToCart as any).mockReturnValue(mockAddToCart);
      (useProductInventory as any).mockReturnValue({
        data: { availableStock: 25, currentStock: 25 },
        isLoading: false,
      });
      return <Story />;
    },
  ],
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};

export const AllStates: Story = {
  args: {
    product: mockProduct,
    selectedVariant: null,
  },
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">Different Product States</h3>
        <div className="grid gap-8">
          <div className="border rounded-lg p-6">
            <h4 className="text-sm font-medium mb-4">In Stock</h4>
            <ProductInfo product={mockProduct} selectedVariant={null} />
          </div>
          
          <div className="border rounded-lg p-6">
            <h4 className="text-sm font-medium mb-4">Low Stock</h4>
            <ProductInfo 
              product={mockProduct} 
              selectedVariant={null}
            />
          </div>
          
          <div className="border rounded-lg p-6">
            <h4 className="text-sm font-medium mb-4">Out of Stock</h4>
            <ProductInfo 
              product={mockProductOutOfStock} 
              selectedVariant={null}
            />
          </div>
        </div>
      </div>
    </div>
  ),
  decorators: [
    (Story) => {
      (useUnifiedAddToCart as any).mockReturnValue(mockAddToCart);
      (useProductInventory as any).mockReturnValue({
        data: { availableStock: 3, currentStock: 3 },
        isLoading: false,
      });
      return <Story />;
    },
  ],
};

export const AccessibilityFeatures: Story = {
  args: {
    product: mockProduct,
    selectedVariant: null,
  },
  decorators: [
    (Story) => {
      (useUnifiedAddToCart as any).mockReturnValue(mockAddToCart);
      (useProductInventory as any).mockReturnValue({
        data: mockInventoryData,
        isLoading: false,
      });
      return <Story />;
    },
  ],
  render: (args) => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Accessibility Features</h3>
      <div className="text-sm text-muted-foreground space-y-2 mb-4">
        <p>• Clear aria-labels for all interactive elements</p>
        <p>• Keyboard navigation support</p>
        <p>• Screen reader friendly stock status</p>
        <p>• Focus indicators on all controls</p>
        <p>• Descriptive button states</p>
      </div>
      <ProductInfo {...args} />
    </div>
  ),
  parameters: {
    a11y: {
      config: {
        rules: [
          { id: 'color-contrast', enabled: true },
          { id: 'button-name', enabled: true },
          { id: 'label', enabled: true },
        ],
      },
    },
  },
};