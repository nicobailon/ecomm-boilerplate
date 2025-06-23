import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProductVariantSelector } from './ProductVariantSelector';
import { useState } from 'react';
import { within, userEvent, expect, waitFor, fn } from '@storybook/test';

interface IProductVariant {
  variantId: string;
  label: string;
  color?: string;
  price: number;
  inventory: number;
  images: string[];
  sku?: string;
}

// Single variant type (size only)
const sizeVariants: IProductVariant[] = [
  { variantId: 'v1', label: 'Small', price: 29.99, inventory: 10, images: [], sku: 'TSH-S' },
  { variantId: 'v2', label: 'Medium', price: 29.99, inventory: 5, images: [], sku: 'TSH-M' },
  { variantId: 'v3', label: 'Large', price: 29.99, inventory: 0, images: [], sku: 'TSH-L' },
  { variantId: 'v4', label: 'XL', price: 29.99, inventory: 3, images: [], sku: 'TSH-XL' },
  { variantId: 'v5', label: 'XXL', price: 34.99, inventory: 8, images: [], sku: 'TSH-XXL' },
];

// Color only variants
const colorVariants: IProductVariant[] = [
  { variantId: 'c1', label: '', color: '#000000', price: 49.99, inventory: 15, images: [], sku: 'HOD-BLK' },
  { variantId: 'c2', label: '', color: '#FFFFFF', price: 49.99, inventory: 0, images: [], sku: 'HOD-WHT' },
  { variantId: 'c3', label: '', color: '#FF0000', price: 49.99, inventory: 2, images: [], sku: 'HOD-RED' },
  { variantId: 'c4', label: '', color: '#0000FF', price: 49.99, inventory: 20, images: [], sku: 'HOD-BLU' },
  { variantId: 'c5', label: '', color: '#808080', price: 49.99, inventory: 7, images: [], sku: 'HOD-GRY' },
];

// Combined variants (size and color)
const combinedVariants: IProductVariant[] = [
  { variantId: 'sc1', label: 'S / Black', color: '#000000', price: 79.99, inventory: 12, images: [], sku: 'JKT-S-BLK' },
  { variantId: 'sc2', label: 'S / Brown', color: '#8B4513', price: 79.99, inventory: 0, images: [], sku: 'JKT-S-BRN' },
  { variantId: 'sc3', label: 'M / Black', color: '#000000', price: 79.99, inventory: 8, images: [], sku: 'JKT-M-BLK' },
  { variantId: 'sc4', label: 'M / Brown', color: '#8B4513', price: 79.99, inventory: 3, images: [], sku: 'JKT-M-BRN' },
  { variantId: 'sc5', label: 'L / Black', color: '#000000', price: 79.99, inventory: 5, images: [], sku: 'JKT-L-BLK' },
  { variantId: 'sc6', label: 'L / Brown', color: '#8B4513', price: 79.99, inventory: 0, images: [], sku: 'JKT-L-BRN' },
  { variantId: 'sc7', label: 'XL / Black', color: '#000000', price: 84.99, inventory: 2, images: [], sku: 'JKT-XL-BLK' },
  { variantId: 'sc8', label: 'XL / Brown', color: '#8B4513', price: 84.99, inventory: 1, images: [], sku: 'JKT-XL-BRN' },
];

// Variants with price differences
const priceVariants: IProductVariant[] = [
  { variantId: 'p1', label: 'Standard Edition', price: 59.99, inventory: 50, images: [], sku: 'GAME-STD' },
  { variantId: 'p2', label: 'Deluxe Edition', price: 79.99, inventory: 20, images: [], sku: 'GAME-DLX' },
  { variantId: 'p3', label: 'Collector\'s Edition', price: 129.99, inventory: 5, images: [], sku: 'GAME-COL' },
  { variantId: 'p4', label: 'Ultimate Edition', price: 149.99, inventory: 0, images: [], sku: 'GAME-ULT' },
];

// Many variants scenario
const manyVariants: IProductVariant[] = Array.from({ length: 20 }, (_, i) => ({
  variantId: `mv${i}`,
  label: `Option ${i + 1}`,
  color: i % 3 === 0 ? `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}` : undefined,
  price: 99.99 + (i % 5) * 10,
  inventory: i % 4 === 0 ? 0 : Math.floor(Math.random() * 20) + 1,
  images: [],
  sku: `PROD-OPT-${i + 1}`,
}));

const meta = {
  title: 'Product/ProductVariantSelector',
  component: ProductVariantSelector,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  args: {
    selectedVariant: null,
    onVariantSelect: fn(),
  },
  decorators: [
    (Story) => {
      const [selectedVariant, setSelectedVariant] = useState<IProductVariant | null>(null);
      
      return (
        <div className="max-w-lg">
          <Story selectedVariant={selectedVariant} onVariantSelect={setSelectedVariant} />
          {selectedVariant && (
            <div className="mt-6 p-4 bg-muted rounded-lg">
              <h4 className="font-semibold mb-2">Selected Variant:</h4>
              <pre className="text-xs">{JSON.stringify(selectedVariant, null, 2)}</pre>
            </div>
          )}
        </div>
      );
    },
  ],
} satisfies Meta<typeof ProductVariantSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SingleVariantType: Story = {
  args: {
    variants: sizeVariants,
    basePrice: 29.99,
  },
};

export const ColorOnlyVariants: Story = {
  args: {
    variants: colorVariants,
    basePrice: 49.99,
  },
};

export const CombinedVariants: Story = {
  args: {
    variants: combinedVariants,
    basePrice: 79.99,
  },
};

export const PriceVariations: Story = {
  args: {
    variants: priceVariants,
    basePrice: 59.99,
  },
};

export const OutOfStockCombinations: Story = {
  args: {
    variants: combinedVariants.map(v => ({
      ...v,
      inventory: ['sc2', 'sc6'].includes(v.variantId) ? 0 : v.inventory,
    })),
    basePrice: 79.99,
  },
  decorators: [
    (Story) => (
      <div>
        <div className="mb-4 p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            Notice how S/Brown and L/Brown are out of stock
          </p>
        </div>
        <Story />
      </div>
    ),
  ],
};

export const LowStockWarnings: Story = {
  args: {
    variants: sizeVariants.map(v => ({
      ...v,
      inventory: v.variantId === 'v2' ? 3 : v.variantId === 'v4' ? 1 : v.inventory,
    })),
    basePrice: 29.99,
  },
};

export const AllOutOfStock: Story = {
  args: {
    variants: sizeVariants.map(v => ({ ...v, inventory: 0 })),
    basePrice: 29.99,
  },
};

export const AutoSelection: Story = {
  args: {
    variants: sizeVariants,
    basePrice: 29.99,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Should auto-select first in-stock variant
    await waitFor(() => {
      const smallButton = canvas.getByRole('radio', { name: /small/i });
      expect(smallButton).toHaveAttribute('aria-checked', 'true');
    });
  },
};

export const VariantInteraction: Story = {
  args: {
    variants: sizeVariants,
    basePrice: 29.99,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Click on Medium variant
    const mediumButton = canvas.getByRole('radio', { name: /medium/i });
    await userEvent.click(mediumButton);
    
    // Should show loading state briefly
    await waitFor(() => {
      expect(canvas.getByText(/checking inventory/i)).toBeInTheDocument();
    });
    
    // Loading should disappear
    await waitFor(() => {
      expect(canvas.queryByText(/checking inventory/i)).not.toBeInTheDocument();
    }, { timeout: 1000 });
    
    // Should be selected
    expect(mediumButton).toHaveAttribute('aria-checked', 'true');
    
    // Should show low stock warning
    await waitFor(() => {
      expect(canvas.getByText(/only 5 left/i)).toBeInTheDocument();
    });
  },
};

export const HoverTooltips: Story = {
  args: {
    variants: sizeVariants,
    basePrice: 29.99,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Hover over Medium variant
    const mediumButton = canvas.getByRole('radio', { name: /medium/i });
    await userEvent.hover(mediumButton);
    
    // Tooltip should appear
    await waitFor(() => {
      const tooltip = canvas.getByRole('tooltip');
      expect(tooltip).toBeInTheDocument();
      expect(tooltip).toHaveTextContent(/5 in stock/i);
    });
    
    // Unhover
    await userEvent.unhover(mediumButton);
    
    // Hover over out of stock variant
    const largeButton = canvas.getByRole('radio', { name: /large.*out of stock/i });
    await userEvent.hover(largeButton);
    
    await waitFor(() => {
      const tooltip = canvas.getByRole('tooltip');
      expect(tooltip).toHaveTextContent(/out of stock/i);
    });
  },
};

export const KeyboardNavigation: Story = {
  args: {
    variants: sizeVariants,
    basePrice: 29.99,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Focus first variant
    const smallButton = canvas.getByRole('radio', { name: /small/i });
    smallButton.focus();
    
    // Tab to next variant
    await userEvent.tab();
    
    // Medium should be focused
    const mediumButton = canvas.getByRole('radio', { name: /medium/i });
    expect(document.activeElement).toBe(mediumButton);
    
    // Press Space to select
    await userEvent.keyboard(' ');
    
    // Should be selected
    await waitFor(() => {
      expect(mediumButton).toHaveAttribute('aria-checked', 'true');
    });
  },
};

export const ImageChanges: Story = {
  args: {
    variants: colorVariants.map(v => ({
      ...v,
      images: [`https://via.placeholder.com/500/${v.color?.replace('#', '')}/FFFFFF?text=${v.sku}`],
    })),
    basePrice: 49.99,
  },
  decorators: [
    () => {
      const [selectedVariant, setSelectedVariant] = useState<IProductVariant | null>(null);
      
      return (
        <div>
          <div className="mb-6">
            {selectedVariant?.images[0] && (
              <img 
                src={selectedVariant.images[0]} 
                alt={`Product in ${selectedVariant.color}`}
                className="w-full max-w-sm mx-auto rounded-lg"
              />
            )}
          </div>
          <ProductVariantSelector 
            variants={colorVariants.map(v => ({
              ...v,
              images: [`https://via.placeholder.com/500/${v.color?.replace('#', '')}/FFFFFF?text=${v.sku}`],
            }))}
            selectedVariant={selectedVariant} 
            onVariantSelect={setSelectedVariant}
            basePrice={49.99}
          />
        </div>
      );
    },
  ],
};

export const ManyVariants: Story = {
  args: {
    variants: manyVariants,
    basePrice: 99.99,
  },
};

export const LightColorHandling: Story = {
  args: {
    variants: [
      { variantId: 'lc1', label: '', color: '#FFFFFF', price: 39.99, inventory: 10, images: [], sku: 'TSH-WHT' },
      { variantId: 'lc2', label: '', color: '#FFFACD', price: 39.99, inventory: 8, images: [], sku: 'TSH-CRM' },
      { variantId: 'lc3', label: '', color: '#F0E68C', price: 39.99, inventory: 5, images: [], sku: 'TSH-YLW' },
      { variantId: 'lc4', label: '', color: '#E6E6FA', price: 39.99, inventory: 12, images: [], sku: 'TSH-LAV' },
      { variantId: 'lc5', label: '', color: '#FFB6C1', price: 39.99, inventory: 3, images: [], sku: 'TSH-PNK' },
    ],
    basePrice: 39.99,
  },
};

export const MobileView: Story = {
  args: {
    variants: combinedVariants,
    basePrice: 79.99,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const RTLSupport: Story = {
  args: {
    variants: sizeVariants,
    basePrice: 29.99,
  },
  decorators: [
    (Story) => (
      <div dir="rtl" className="text-right">
        <Story />
      </div>
    ),
  ],
};

export const LoadingStates: Story = {
  args: {
    variants: sizeVariants,
    basePrice: 29.99,
  },
  decorators: [
    () => {
      const [selectedVariant, setSelectedVariant] = useState<IProductVariant | null>(null);
      const [isLoading, setIsLoading] = useState(false);
      
      const handleSelect = async (variant: IProductVariant) => {
        setIsLoading(true);
        // Simulate slower API call
        await new Promise(resolve => setTimeout(resolve, 2000));
        setSelectedVariant(variant);
        setIsLoading(false);
      };
      
      return (
        <div>
          <ProductVariantSelector 
            variants={sizeVariants}
            selectedVariant={selectedVariant} 
            onVariantSelect={handleSelect}
            basePrice={29.99}
          />
          {isLoading && (
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span>Updating product details...</span>
            </div>
          )}
        </div>
      );
    },
  ],
};