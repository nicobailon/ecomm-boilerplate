import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProductVariantAttributeSelector } from './ProductVariantAttributeSelector';
import { useState, useEffect } from 'react';
import { fn } from '@storybook/test';
import { within, userEvent, expect, waitFor } from '@storybook/test';
import { Skeleton } from '@/components/ui/Skeleton';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react';

interface IProductVariant {
  variantId: string;
  label: string;
  color?: string;
  price: number;
  inventory: number;
  images: string[];
  sku?: string;
  attributes?: Record<string, string | undefined>;
}

interface VariantType {
  name: string;
  values: string[];
}

const createTShirtVariants = (): IProductVariant[] => [
  {
    variantId: 'v1',
    label: 'Small Black T-Shirt',
    price: 29.99,
    inventory: 10,
    images: [],
    sku: 'TSH-BLK-S',
    attributes: { Size: 'Small', Color: 'Black' },
  },
  {
    variantId: 'v2',
    label: 'Small White T-Shirt',
    price: 29.99,
    inventory: 5,
    images: [],
    sku: 'TSH-WHT-S',
    attributes: { Size: 'Small', Color: 'White' },
  },
  {
    variantId: 'v3',
    label: 'Small Navy T-Shirt',
    price: 29.99,
    inventory: 0,
    images: [],
    sku: 'TSH-NVY-S',
    attributes: { Size: 'Small', Color: 'Navy' },
  },
  {
    variantId: 'v4',
    label: 'Medium Black T-Shirt',
    price: 29.99,
    inventory: 15,
    images: [],
    sku: 'TSH-BLK-M',
    attributes: { Size: 'Medium', Color: 'Black' },
  },
  {
    variantId: 'v5',
    label: 'Medium White T-Shirt',
    price: 29.99,
    inventory: 3,
    images: [],
    sku: 'TSH-WHT-M',
    attributes: { Size: 'Medium', Color: 'White' },
  },
  {
    variantId: 'v6',
    label: 'Medium Navy T-Shirt',
    price: 29.99,
    inventory: 8,
    images: [],
    sku: 'TSH-NVY-M',
    attributes: { Size: 'Medium', Color: 'Navy' },
  },
  {
    variantId: 'v7',
    label: 'Large Black T-Shirt',
    price: 34.99,
    inventory: 0,
    images: [],
    sku: 'TSH-BLK-L',
    attributes: { Size: 'Large', Color: 'Black' },
  },
  {
    variantId: 'v8',
    label: 'Large White T-Shirt',
    price: 34.99,
    inventory: 12,
    images: [],
    sku: 'TSH-WHT-L',
    attributes: { Size: 'Large', Color: 'White' },
  },
  {
    variantId: 'v9',
    label: 'Large Navy T-Shirt',
    price: 34.99,
    inventory: 20,
    images: [],
    sku: 'TSH-NVY-L',
    attributes: { Size: 'Large', Color: 'Navy' },
  },
];

const tshirtVariantTypes: VariantType[] = [
  { name: 'Size', values: ['Small', 'Medium', 'Large'] },
  { name: 'Color', values: ['Black', 'White', 'Navy'] },
];

const createShoeVariants = (): IProductVariant[] => [
  {
    variantId: 'shoe1',
    label: 'Size 8 - Black Leather',
    price: 89.99,
    inventory: 5,
    images: [],
    sku: 'SHOE-BLK-8',
    attributes: { Size: '8', Material: 'Leather', Color: 'Black' },
  },
  {
    variantId: 'shoe2',
    label: 'Size 9 - Black Leather',
    price: 89.99,
    inventory: 3,
    images: [],
    sku: 'SHOE-BLK-9',
    attributes: { Size: '9', Material: 'Leather', Color: 'Black' },
  },
  {
    variantId: 'shoe3',
    label: 'Size 10 - Black Leather',
    price: 89.99,
    inventory: 0,
    images: [],
    sku: 'SHOE-BLK-10',
    attributes: { Size: '10', Material: 'Leather', Color: 'Black' },
  },
  {
    variantId: 'shoe4',
    label: 'Size 8 - Brown Suede',
    price: 99.99,
    inventory: 8,
    images: [],
    sku: 'SHOE-BRN-8',
    attributes: { Size: '8', Material: 'Suede', Color: 'Brown' },
  },
  {
    variantId: 'shoe5',
    label: 'Size 9 - Brown Suede',
    price: 99.99,
    inventory: 15,
    images: [],
    sku: 'SHOE-BRN-9',
    attributes: { Size: '9', Material: 'Suede', Color: 'Brown' },
  },
  {
    variantId: 'shoe6',
    label: 'Size 10 - Brown Suede',
    price: 99.99,
    inventory: 2,
    images: [],
    sku: 'SHOE-BRN-10',
    attributes: { Size: '10', Material: 'Suede', Color: 'Brown' },
  },
];

const shoeVariantTypes: VariantType[] = [
  { name: 'Size', values: ['8', '9', '10'] },
  { name: 'Material', values: ['Leather', 'Suede'] },
  { name: 'Color', values: ['Black', 'Brown'] },
];

const meta = {
  title: 'Product/ProductVariantAttributeSelector',
  component: ProductVariantAttributeSelector,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="w-[400px] p-6 bg-background rounded-lg border">
        <Story />
      </div>
    ),
  ],
  args: {
    onVariantSelect: fn(),
  },
} satisfies Meta<typeof ProductVariantAttributeSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    variants: createTShirtVariants(),
    variantTypes: tshirtVariantTypes,
    selectedVariant: null,
    basePrice: 29.99,
  },
  render: (args) => {
    const [selectedVariant, setSelectedVariant] = useState<IProductVariant | null>(null);
    return (
      <ProductVariantAttributeSelector
        {...args}
        selectedVariant={selectedVariant}
        onVariantSelect={(variant) => {
          setSelectedVariant(variant);
          args.onVariantSelect(variant);
        }}
      />
    );
  },
};

export const WithPreselectedVariant: Story = {
  args: {
    variants: createTShirtVariants(),
    variantTypes: tshirtVariantTypes,
    selectedVariant: createTShirtVariants()[3], // Medium Black
    basePrice: 29.99,
  },
  render: (args) => {
    const [selectedVariant, setSelectedVariant] = useState<IProductVariant | null>(args.selectedVariant);
    return (
      <ProductVariantAttributeSelector
        {...args}
        selectedVariant={selectedVariant}
        onVariantSelect={(variant) => {
          setSelectedVariant(variant);
          args.onVariantSelect(variant);
        }}
      />
    );
  },
};

export const MultipleAttributes: Story = {
  args: {
    variants: createShoeVariants(),
    variantTypes: shoeVariantTypes,
    selectedVariant: null,
    basePrice: 89.99,
  },
  render: (args) => {
    const [selectedVariant, setSelectedVariant] = useState<IProductVariant | null>(null);
    return (
      <ProductVariantAttributeSelector
        {...args}
        selectedVariant={selectedVariant}
        onVariantSelect={(variant) => {
          setSelectedVariant(variant);
          args.onVariantSelect(variant);
        }}
      />
    );
  },
};

export const WithLowStock: Story = {
  args: {
    variants: createTShirtVariants().map(v => ({
      ...v,
      inventory: v.inventory > 0 ? Math.min(v.inventory, 3) : 0,
    })),
    variantTypes: tshirtVariantTypes,
    selectedVariant: null,
    basePrice: 29.99,
  },
  render: (args) => {
    const [selectedVariant, setSelectedVariant] = useState<IProductVariant | null>(null);
    return (
      <ProductVariantAttributeSelector
        {...args}
        selectedVariant={selectedVariant}
        onVariantSelect={(variant) => {
          setSelectedVariant(variant);
          args.onVariantSelect(variant);
        }}
      />
    );
  },
};

export const WithPriceDifferences: Story = {
  args: {
    variants: createTShirtVariants().map((v, i) => ({
      ...v,
      price: i < 3 ? 24.99 : i < 6 ? 29.99 : 34.99,
    })),
    variantTypes: tshirtVariantTypes,
    selectedVariant: null,
    basePrice: 24.99,
  },
  render: (args) => {
    const [selectedVariant, setSelectedVariant] = useState<IProductVariant | null>(null);
    return (
      <ProductVariantAttributeSelector
        {...args}
        selectedVariant={selectedVariant}
        onVariantSelect={(variant) => {
          setSelectedVariant(variant);
          args.onVariantSelect(variant);
        }}
      />
    );
  },
};

export const OutOfStockCombinations: Story = {
  args: {
    variants: createTShirtVariants().map(v => ({
      ...v,
      // All Black variants are out of stock
      inventory: v.attributes?.Color === 'Black' ? 0 : v.inventory,
    })),
    variantTypes: tshirtVariantTypes,
    selectedVariant: null,
    basePrice: 29.99,
  },
  render: (args) => {
    const [selectedVariant, setSelectedVariant] = useState<IProductVariant | null>(null);
    return (
      <ProductVariantAttributeSelector
        {...args}
        selectedVariant={selectedVariant}
        onVariantSelect={(variant) => {
          setSelectedVariant(variant);
          args.onVariantSelect(variant);
        }}
      />
    );
  },
};

export const SingleAttribute: Story = {
  args: {
    variants: [
      {
        variantId: 'v1',
        label: 'Small',
        price: 19.99,
        inventory: 10,
        images: [],
        sku: 'PROD-S',
        attributes: { Size: 'Small' },
      },
      {
        variantId: 'v2',
        label: 'Medium',
        price: 19.99,
        inventory: 15,
        images: [],
        sku: 'PROD-M',
        attributes: { Size: 'Medium' },
      },
      {
        variantId: 'v3',
        label: 'Large',
        price: 24.99,
        inventory: 5,
        images: [],
        sku: 'PROD-L',
        attributes: { Size: 'Large' },
      },
    ],
    variantTypes: [{ name: 'Size', values: ['Small', 'Medium', 'Large'] }],
    selectedVariant: null,
    basePrice: 19.99,
  },
  render: (args) => {
    const [selectedVariant, setSelectedVariant] = useState<IProductVariant | null>(null);
    return (
      <ProductVariantAttributeSelector
        {...args}
        selectedVariant={selectedVariant}
        onVariantSelect={(variant) => {
          setSelectedVariant(variant);
          args.onVariantSelect(variant);
        }}
      />
    );
  },
};

export const SelectionInteraction: Story = {
  args: {
    variants: createTShirtVariants(),
    variantTypes: tshirtVariantTypes,
    selectedVariant: null,
    basePrice: 29.99,
  },
  render: (args) => {
    const [selectedVariant, setSelectedVariant] = useState<IProductVariant | null>(null);
    return (
      <ProductVariantAttributeSelector
        {...args}
        selectedVariant={selectedVariant}
        onVariantSelect={(variant) => {
          setSelectedVariant(variant);
          args.onVariantSelect(variant);
        }}
      />
    );
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    
    // Select Medium size
    const mediumButton = canvas.getByRole('radio', { name: /Size: Medium/ });
    await userEvent.click(mediumButton);
    
    await waitFor(() => {
      expect(mediumButton).toHaveAttribute('aria-checked', 'true');
    });
    
    // Select White color
    const whiteButton = canvas.getByRole('radio', { name: /Color: White/ });
    await userEvent.click(whiteButton);
    
    await waitFor(() => {
      expect(whiteButton).toHaveAttribute('aria-checked', 'true');
      expect(canvas.getByText('Selected: Medium White T-Shirt')).toBeInTheDocument();
      expect(args.onVariantSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          label: 'Medium White T-Shirt',
        }),
      );
    });
  },
};

export const KeyboardNavigation: Story = {
  args: {
    variants: createTShirtVariants(),
    variantTypes: tshirtVariantTypes,
    selectedVariant: null,
    basePrice: 29.99,
  },
  render: (args) => {
    const [selectedVariant, setSelectedVariant] = useState<IProductVariant | null>(null);
    return (
      <ProductVariantAttributeSelector
        {...args}
        selectedVariant={selectedVariant}
        onVariantSelect={(variant) => {
          setSelectedVariant(variant);
          args.onVariantSelect(variant);
        }}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Focus on first size option
    const smallButton = canvas.getByRole('radio', { name: /Size: Small/ });
    smallButton.focus();
    
    // Arrow right to Medium
    await userEvent.keyboard('{ArrowRight}');
    
    await waitFor(() => {
      const mediumButton = canvas.getByRole('radio', { name: /Size: Medium/ });
      expect(document.activeElement).toBe(mediumButton);
    });
    
    // Arrow right to Large
    await userEvent.keyboard('{ArrowRight}');
    
    await waitFor(() => {
      const largeButton = canvas.getByRole('radio', { name: /Size: Large/ });
      expect(document.activeElement).toBe(largeButton);
    });
    
    // Arrow right should wrap to Small
    await userEvent.keyboard('{ArrowRight}');
    
    await waitFor(() => {
      expect(document.activeElement).toBe(smallButton);
    });
  },
};

export const InvalidCombination: Story = {
  args: {
    variants: [
      {
        variantId: 'v1',
        label: 'Small Red',
        price: 29.99,
        inventory: 10,
        images: [],
        sku: 'TSH-RED-S',
        attributes: { Size: 'Small', Color: 'Red' },
      },
      {
        variantId: 'v2',
        label: 'Medium Blue',
        price: 29.99,
        inventory: 5,
        images: [],
        sku: 'TSH-BLU-M',
        attributes: { Size: 'Medium', Color: 'Blue' },
      },
      {
        variantId: 'v3',
        label: 'Large Green',
        price: 34.99,
        inventory: 8,
        images: [],
        sku: 'TSH-GRN-L',
        attributes: { Size: 'Large', Color: 'Green' },
      },
    ],
    variantTypes: [
      { name: 'Size', values: ['Small', 'Medium', 'Large'] },
      { name: 'Color', values: ['Red', 'Blue', 'Green'] },
    ],
    selectedVariant: null,
    basePrice: 29.99,
  },
  render: (args) => {
    const [selectedVariant, setSelectedVariant] = useState<IProductVariant | null>(null);
    return (
      <ProductVariantAttributeSelector
        {...args}
        selectedVariant={selectedVariant}
        onVariantSelect={(variant) => {
          setSelectedVariant(variant);
          args.onVariantSelect(variant);
        }}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Select Small size
    const smallButton = canvas.getByRole('radio', { name: /Size: Small/ });
    await userEvent.click(smallButton);
    
    // Try to select Blue color (which isn't available for Small)
    const blueButton = canvas.getByRole('radio', { name: /Color: Blue/ });
    await userEvent.click(blueButton);
    
    await waitFor(() => {
      expect(canvas.getByText('This combination is not available. Please select different options.')).toBeInTheDocument();
    });
  },
};

export const MobileView: Story = {
  args: {
    variants: createTShirtVariants(),
    variantTypes: tshirtVariantTypes,
    selectedVariant: null,
    basePrice: 29.99,
  },
  render: (args) => {
    const [selectedVariant, setSelectedVariant] = useState<IProductVariant | null>(null);
    return (
      <ProductVariantAttributeSelector
        {...args}
        selectedVariant={selectedVariant}
        onVariantSelect={(variant) => {
          setSelectedVariant(variant);
          args.onVariantSelect(variant);
        }}
      />
    );
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-sm mx-auto p-4 bg-background rounded-lg border">
        <Story />
      </div>
    ),
  ],
};

export const AllOutOfStock: Story = {
  args: {
    variants: createTShirtVariants().map(v => ({
      ...v,
      inventory: 0,
    })),
    variantTypes: tshirtVariantTypes,
    selectedVariant: null,
    basePrice: 29.99,
  },
  render: (args) => {
    const [selectedVariant, setSelectedVariant] = useState<IProductVariant | null>(null);
    return (
      <ProductVariantAttributeSelector
        {...args}
        selectedVariant={selectedVariant}
        onVariantSelect={(variant) => {
          setSelectedVariant(variant);
          args.onVariantSelect(variant);
        }}
      />
    );
  },
};

export const ComplexAttributes: Story = {
  args: {
    variants: [
      {
        variantId: 'watch1',
        label: '42mm Silver Stainless Steel with Black Leather',
        price: 299.99,
        inventory: 5,
        images: [],
        sku: 'WATCH-42-SIL-SS-BLK',
        attributes: {
          'Case Size': '42mm',
          'Case Material': 'Stainless Steel',
          'Case Color': 'Silver',
          'Band Material': 'Leather',
          'Band Color': 'Black',
        },
      },
      {
        variantId: 'watch2',
        label: '42mm Silver Stainless Steel with Brown Leather',
        price: 299.99,
        inventory: 3,
        images: [],
        sku: 'WATCH-42-SIL-SS-BRN',
        attributes: {
          'Case Size': '42mm',
          'Case Material': 'Stainless Steel',
          'Case Color': 'Silver',
          'Band Material': 'Leather',
          'Band Color': 'Brown',
        },
      },
      {
        variantId: 'watch3',
        label: '42mm Gold Stainless Steel with Black Leather',
        price: 349.99,
        inventory: 2,
        images: [],
        sku: 'WATCH-42-GLD-SS-BLK',
        attributes: {
          'Case Size': '42mm',
          'Case Material': 'Stainless Steel',
          'Case Color': 'Gold',
          'Band Material': 'Leather',
          'Band Color': 'Black',
        },
      },
      {
        variantId: 'watch4',
        label: '38mm Silver Aluminum with White Sport Band',
        price: 199.99,
        inventory: 10,
        images: [],
        sku: 'WATCH-38-SIL-AL-WHT',
        attributes: {
          'Case Size': '38mm',
          'Case Material': 'Aluminum',
          'Case Color': 'Silver',
          'Band Material': 'Sport Band',
          'Band Color': 'White',
        },
      },
    ],
    variantTypes: [
      { name: 'Case Size', values: ['38mm', '42mm'] },
      { name: 'Case Material', values: ['Aluminum', 'Stainless Steel'] },
      { name: 'Case Color', values: ['Silver', 'Gold'] },
      { name: 'Band Material', values: ['Leather', 'Sport Band'] },
      { name: 'Band Color', values: ['Black', 'Brown', 'White'] },
    ],
    selectedVariant: null,
    basePrice: 199.99,
  },
  render: (args) => {
    const [selectedVariant, setSelectedVariant] = useState<IProductVariant | null>(null);
    return (
      <ProductVariantAttributeSelector
        {...args}
        selectedVariant={selectedVariant}
        onVariantSelect={(variant) => {
          setSelectedVariant(variant);
          args.onVariantSelect(variant);
        }}
      />
    );
  },
};

// Loading State Stories
export const LoadingState: Story = {
  args: {
    variants: [],
    variantTypes: [],
    selectedVariant: null,
    basePrice: 29.99,
  },
  decorators: [
    () => (
      <div className="w-[400px] p-6 bg-background rounded-lg border">
        <div className="space-y-4">
          <div>
            <Skeleton className="h-5 w-12 mb-2" />
            <div className="flex gap-2">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-10 w-20" />
              ))}
            </div>
          </div>
          <div>
            <Skeleton className="h-5 w-14 mb-2" />
            <div className="flex gap-2">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-10 w-20" />
              ))}
            </div>
          </div>
          <div className="pt-4">
            <Skeleton className="h-6 w-32 mb-1" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </div>
    ),
  ],
  render: () => <div />,
};

export const LazyLoadingVariants: Story = {
  args: {
    variants: [],
    variantTypes: [],
    selectedVariant: null,
    basePrice: 29.99,
  },
  render: () => {
    const [loading, setLoading] = useState(true);
    const [variants, setVariants] = useState<IProductVariant[]>([]);
    const [selectedVariant, setSelectedVariant] = useState<IProductVariant | null>(null);

    useEffect(() => {
      const timer = setTimeout(() => {
        setVariants(createTShirtVariants());
        setLoading(false);
      }, 2000);

      return () => clearTimeout(timer);
    }, []);

    if (loading) {
      return (
        <div className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm text-muted-foreground">Loading variants...</span>
            </div>
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i}>
                  <Skeleton className="h-5 w-16 mb-2" />
                  <div className="flex gap-2">
                    {[1, 2, 3].map(j => (
                      <Skeleton key={j} className="h-10 w-20" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      );
    }

    return (
      <ProductVariantAttributeSelector
        variants={variants}
        variantTypes={tshirtVariantTypes}
        selectedVariant={selectedVariant}
        basePrice={29.99}
        onVariantSelect={setSelectedVariant}
      />
    );
  },
};

export const InventoryCheckLoading: Story = {
  args: {
    variants: createTShirtVariants(),
    variantTypes: tshirtVariantTypes,
    selectedVariant: null,
    basePrice: 29.99,
  },
  render: () => {
    const [selectedVariant, setSelectedVariant] = useState<IProductVariant | null>(null);
    const [checkingInventory, setCheckingInventory] = useState(false);
    const [inventoryStatus, setInventoryStatus] = useState<Record<string, boolean>>({});

    const handleVariantSelect = async (variant: IProductVariant | null) => {
      if (!variant) return;

      setCheckingInventory(true);
      setSelectedVariant(variant);

      // Simulate inventory check
      await new Promise(resolve => setTimeout(resolve, 1500));

      setInventoryStatus(prev => ({
        ...prev,
        [variant.variantId]: variant.inventory > 0,
      }));
      setCheckingInventory(false);
    };

    return (
      <div className="space-y-4">
        <ProductVariantAttributeSelector
          variants={createTShirtVariants()}
          variantTypes={tshirtVariantTypes}
          selectedVariant={selectedVariant}
          basePrice={29.99}
          onVariantSelect={handleVariantSelect}
        />

        {checkingInventory && (
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Checking availability...</span>
            </div>
          </Card>
        )}

        {selectedVariant && !checkingInventory && inventoryStatus[selectedVariant.variantId] !== undefined && (
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Availability:</span>
              <Badge variant={inventoryStatus[selectedVariant.variantId] ? 'default' : 'destructive'}>
                {inventoryStatus[selectedVariant.variantId] ? 'In Stock' : 'Out of Stock'}
              </Badge>
            </div>
          </Card>
        )}
      </div>
    );
  },
};

export const PartialLoadingState: Story = {
  args: {
    variants: createTShirtVariants(),
    variantTypes: tshirtVariantTypes,
    selectedVariant: null,
    basePrice: 29.99,
  },
  render: () => {
    const [loadingAttributes, setLoadingAttributes] = useState<string[]>(['Color']);
    const [selectedVariant, setSelectedVariant] = useState<IProductVariant | null>(null);

    useEffect(() => {
      const timer = setTimeout(() => {
        setLoadingAttributes([]);
      }, 2000);

      return () => clearTimeout(timer);
    }, []);

    const renderAttribute = (type: VariantType) => {
      if (loadingAttributes.includes(type.name)) {
        return (
          <div key={type.name}>
            <div className="text-sm font-medium mb-2">{type.name}</div>
            <div className="flex gap-2">
              {type.values.map(value => (
                <Skeleton key={value} className="h-10 w-20" />
              ))}
            </div>
          </div>
        );
      }

      return null;
    };

    return (
      <div className="space-y-4">
        <Card className="p-4">
          <h4 className="text-sm font-medium mb-2">Partial Loading Demo</h4>
          <p className="text-xs text-muted-foreground mb-4">
            Color options are loading from server...
          </p>
        </Card>

        <div className="space-y-4">
          {tshirtVariantTypes.map(type => {
            if (loadingAttributes.includes(type.name)) {
              return renderAttribute(type);
            }
            return null;
          })}
        </div>

        <ProductVariantAttributeSelector
          variants={createTShirtVariants()}
          variantTypes={tshirtVariantTypes.filter(t => !loadingAttributes.includes(t.name))}
          selectedVariant={selectedVariant}
          basePrice={29.99}
          onVariantSelect={setSelectedVariant}
        />
      </div>
    );
  },
};

export const RefreshableVariants: Story = {
  args: {
    variants: createTShirtVariants(),
    variantTypes: tshirtVariantTypes,
    selectedVariant: null,
    basePrice: 29.99,
  },
  render: () => {
    const [loading, setLoading] = useState(false);
    const [variants, setVariants] = useState(createTShirtVariants());
    const [selectedVariant, setSelectedVariant] = useState<IProductVariant | null>(null);
    const [lastRefreshed, setLastRefreshed] = useState(new Date());

    const refreshVariants = async () => {
      setLoading(true);

      await new Promise(resolve => setTimeout(resolve, 1500));

      // Simulate inventory changes
      setVariants(prev => prev.map(v => ({
        ...v,
        inventory: Math.floor(Math.random() * 20),
      })));

      setLastRefreshed(new Date());
      setLoading(false);
    };

    return (
      <div className="space-y-4">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="text-sm font-medium">Variant Inventory</h4>
              <p className="text-xs text-muted-foreground">
                Last updated: {lastRefreshed.toLocaleTimeString()}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => { void refreshVariants(); }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  Refreshing...
                </>
              ) : (
                <>
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Refresh
                </>
              )}
            </Button>
          </div>
        </Card>

        <div className={loading ? 'opacity-50 pointer-events-none' : ''}>
          <ProductVariantAttributeSelector
            variants={variants}
            variantTypes={tshirtVariantTypes}
            selectedVariant={selectedVariant}
            basePrice={29.99}
            onVariantSelect={setSelectedVariant}
          />
        </div>
      </div>
    );
  },
};

export const StaggeredLoading: Story = {
  args: {
    variants: createTShirtVariants(),
    variantTypes: tshirtVariantTypes,
    selectedVariant: null,
    basePrice: 29.99,
  },
  render: () => {
    const [loadedTypes, setLoadedTypes] = useState<string[]>([]);

    useEffect(() => {
      const loadTypes = async () => {
        for (const type of tshirtVariantTypes) {
          await new Promise(resolve => setTimeout(resolve, 800));
          setLoadedTypes(prev => [...prev, type.name]);
        }
      };

      loadTypes().catch(() => {});
    }, []);

    const isLoaded = (typeName: string) => loadedTypes.includes(typeName);

    return (
      <div className="space-y-4">
        <Card className="p-4">
          <h4 className="text-sm font-medium mb-2">Staggered Loading</h4>
          <p className="text-xs text-muted-foreground">
            Attributes load progressively...
          </p>
        </Card>

        <div className="space-y-4">
          {tshirtVariantTypes.map(type => (
            <div key={type.name} className="space-y-2">
              <div className="text-sm font-medium">{type.name}</div>
              <div className="flex gap-2">
                {isLoaded(type.name) ? (
                  type.values.map(value => (
                    <Button
                      key={value}
                      variant="outline"
                      size="sm"
                      className="animate-in fade-in duration-500"
                    >
                      {value}
                    </Button>
                  ))
                ) : (
                  type.values.map((_, i) => (
                    <Skeleton key={i} className="h-9 w-20" />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  },
};

export const LoadingWithError: Story = {
  args: {
    variants: createTShirtVariants(),
    variantTypes: tshirtVariantTypes,
    selectedVariant: null,
    basePrice: 29.99,
  },
  render: () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [selectedVariant, setSelectedVariant] = useState<IProductVariant | null>(null);

    useEffect(() => {
      const timer = setTimeout(() => {
        setLoading(false);
        setError(true);
      }, 2000);

      return () => clearTimeout(timer);
    }, []);

    const retry = () => {
      setLoading(true);
      setError(false);

      setTimeout(() => {
        setLoading(false);
        setError(false);
      }, 1500);
    };

    if (loading) {
      return (
        <Card className="p-6">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading variant options...</p>
          </div>
        </Card>
      );
    }

    if (error) {
      return (
        <Card className="p-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="text-destructive">
              <AlertCircle className="w-8 h-8" />
            </div>
            <p className="text-sm font-medium">Failed to load variants</p>
            <p className="text-xs text-muted-foreground">
              Please check your connection and try again
            </p>
            <Button size="sm" onClick={() => { void retry(); }}>
              <RefreshCw className="w-3 h-3 mr-1" />
              Try Again
            </Button>
          </div>
        </Card>
      );
    }

    return (
      <ProductVariantAttributeSelector
        variants={createTShirtVariants()}
        variantTypes={tshirtVariantTypes}
        selectedVariant={selectedVariant}
        basePrice={29.99}
        onVariantSelect={setSelectedVariant}
      />
    );
  },
};