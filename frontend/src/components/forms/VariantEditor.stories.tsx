import type { Meta, StoryObj } from '@storybook/react-vite';
import { VariantEditor } from './VariantEditor';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productSchema, type ProductFormInput } from '@/lib/validations';
import { fn } from '@storybook/test';
import { within, userEvent, expect, waitFor } from '@storybook/test';
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Toaster, toast } from 'sonner';
import { AlertCircle, RefreshCw, AlertTriangle, Save, Package } from 'lucide-react';

// Default form values
const defaultValues: Partial<ProductFormInput> = {
  name: 'Test Product',
  description: 'Test product description',
  price: 99.99,
  image: 'https://example.com/product.jpg',
  collectionId: '',
  variants: [],
  variantTypes: [],
};

const FormWrapper = ({ children, initialValues = defaultValues }: { children: React.ReactNode; initialValues?: Partial<ProductFormInput> }) => {
  const methods = useForm<ProductFormInput>({
    resolver: zodResolver(productSchema),
    defaultValues: initialValues,
  });

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(fn())} className="space-y-6">
        {children}
        <div className="mt-4 p-4 bg-muted rounded-lg">
          <h3 className="text-sm font-medium mb-2">Form State</h3>
          <pre className="text-xs overflow-auto">
            {JSON.stringify(methods.watch(), null, 2)}
          </pre>
        </div>
      </form>
    </FormProvider>
  );
};

const meta = {
  title: 'Forms/VariantEditor',
  component: VariantEditor,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="max-w-4xl mx-auto p-6 bg-background">
        <FormWrapper>
          <Story />
        </FormWrapper>
      </div>
    ),
  ],
} satisfies Meta<typeof VariantEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithExistingVariants: Story = {
  decorators: [
    (Story) => (
      <div className="max-w-4xl mx-auto p-6 bg-background">
        <FormWrapper
          initialValues={{
            ...defaultValues,
            variants: [
              {
                variantId: 'var-small-001',
                label: 'Small',
                priceAdjustment: 0,
                inventory: 25,
                sku: 'PROD-S',
              },
              {
                variantId: 'var-medium-002',
                label: 'Medium',
                priceAdjustment: 0,
                inventory: 50,
                sku: 'PROD-M',
              },
              {
                variantId: 'var-large-003',
                label: 'Large',
                priceAdjustment: 5,
                inventory: 30,
                sku: 'PROD-L',
              },
              {
                variantId: 'var-xlarge-004',
                label: 'X-Large',
                priceAdjustment: 10,
                inventory: 15,
                sku: 'PROD-XL',
              },
            ],
          }}
        >
          <Story />
        </FormWrapper>
      </div>
    ),
  ],
};

export const WithPriceAdjustments: Story = {
  decorators: [
    (Story) => (
      <div className="max-w-4xl mx-auto p-6 bg-background">
        <FormWrapper
          initialValues={{
            ...defaultValues,
            price: 100.00,
            variants: [
              {
                variantId: 'var-basic-001',
                label: 'Basic Edition',
                priceAdjustment: -20,
                inventory: 100,
                sku: 'BASIC-001',
              },
              {
                variantId: 'var-standard-002',
                label: 'Standard Edition',
                priceAdjustment: 0,
                inventory: 75,
                sku: 'STANDARD-001',
              },
              {
                variantId: 'var-premium-003',
                label: 'Premium Edition',
                priceAdjustment: 50,
                inventory: 25,
                sku: 'PREMIUM-001',
              },
              {
                variantId: 'var-ultimate-004',
                label: 'Ultimate Edition',
                priceAdjustment: 150,
                inventory: 10,
                sku: 'ULTIMATE-001',
              },
            ],
          }}
        >
          <Story />
        </FormWrapper>
      </div>
    ),
  ],
};

export const LoadingState: Story = {
  args: {
    isLoading: true,
  },
  decorators: [
    (Story) => (
      <div className="max-w-4xl mx-auto p-6 bg-background">
        <FormWrapper
          initialValues={{
            ...defaultValues,
            variants: [
              { variantId: '1', label: 'Loading...', priceAdjustment: 0, inventory: 0, sku: '' },
              { variantId: '2', label: 'Loading...', priceAdjustment: 0, inventory: 0, sku: '' },
              { variantId: '3', label: 'Loading...', priceAdjustment: 0, inventory: 0, sku: '' },
            ],
          }}
        >
          <Story />
        </FormWrapper>
      </div>
    ),
  ],
};

export const AddVariantInteraction: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Click Add Variant button
    const addButton = canvas.getByRole('button', { name: /Add Variant/ });
    await userEvent.click(addButton);
    
    // A new row should appear
    await waitFor(() => {
      expect(canvas.getByRole('textbox', { name: 'Variant 1 label' })).toBeInTheDocument();
    });
    
    // Type in the label field
    const labelInput = canvas.getByRole('textbox', { name: 'Variant 1 label' });
    await userEvent.type(labelInput, 'Small Size');
    
    // Tab to price adjustment
    await userEvent.tab();
    await userEvent.type(document.activeElement as HTMLElement, '-5');
    
    // Tab to inventory
    await userEvent.tab();
    await userEvent.tab(); // Skip final price display
    await userEvent.type(document.activeElement as HTMLElement, '20');
    
    // Tab to SKU
    await userEvent.tab();
    await userEvent.type(document.activeElement as HTMLElement, 'SMALL-001');
    
    // Blur from the label field to trigger ID generation
    await labelInput.blur();
    
    // Verify final price calculation
    await waitFor(() => {
      expect(canvas.getByText('$94.99')).toBeInTheDocument(); // Base price 99.99 - 5
    });
  },
};

export const DeleteVariantInteraction: Story = {
  decorators: [
    (Story) => (
      <div className="max-w-4xl mx-auto p-6 bg-background">
        <FormWrapper
          initialValues={{
            ...defaultValues,
            variants: [
              {
                variantId: 'var-1',
                label: 'Small',
                priceAdjustment: 0,
                inventory: 10,
                sku: 'S-001',
              },
              {
                variantId: 'var-2',
                label: 'Medium',
                priceAdjustment: 0,
                inventory: 15,
                sku: 'M-001',
              },
              {
                variantId: 'var-3',
                label: 'Large',
                priceAdjustment: 5,
                inventory: 8,
                sku: 'L-001',
              },
            ],
          }}
        >
          <Story />
        </FormWrapper>
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Find all delete buttons
    const deleteButtons = canvas.getAllByRole('button', { name: /Remove variant/ });
    expect(deleteButtons).toHaveLength(3);
    
    // Click the middle one (Medium variant)
    await userEvent.click(deleteButtons[1]);
    
    // Verify the variant was removed
    await waitFor(() => {
      expect(canvas.queryByDisplayValue('Medium')).not.toBeInTheDocument();
      expect(canvas.getByDisplayValue('Small')).toBeInTheDocument();
      expect(canvas.getByDisplayValue('Large')).toBeInTheDocument();
    });
  },
};

export const DuplicateLabels: Story = {
  decorators: [
    (Story) => (
      <div className="max-w-4xl mx-auto p-6 bg-background">
        <FormWrapper
          initialValues={{
            ...defaultValues,
            variants: [
              {
                variantId: 'var-1',
                label: 'Large',
                priceAdjustment: 0,
                inventory: 10,
                sku: 'L-001',
              },
              {
                variantId: 'var-2',
                label: 'Large',
                priceAdjustment: 5,
                inventory: 15,
                sku: 'L-002',
              },
              {
                variantId: 'var-3',
                label: 'Small',
                priceAdjustment: -5,
                inventory: 20,
                sku: 'S-001',
              },
            ],
          }}
        >
          <Story />
        </FormWrapper>
      </div>
    ),
  ],
};

export const ValidationErrors: Story = {
  decorators: [
    (Story) => (
      <div className="max-w-4xl mx-auto p-6 bg-background">
        <FormWrapper
          initialValues={{
            ...defaultValues,
            variants: [
              {
                variantId: '',
                label: '',
                priceAdjustment: 0,
                inventory: -5,
                sku: '',
              },
              {
                variantId: '',
                label: '',
                priceAdjustment: 0,
                inventory: -10,
                sku: '',
              },
            ],
          }}
        >
          <Story />
        </FormWrapper>
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Submit form to trigger validation
    const form = canvas.getByRole('form');
    // Trigger form submission
    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    form.appendChild(submitButton);
    submitButton.click();
    form.removeChild(submitButton);
    
    // Check for validation errors
    await waitFor(() => {
      const labelErrors = canvas.getAllByText('Label is required');
      expect(labelErrors).toHaveLength(2);
      
      const inventoryErrors = canvas.getAllByText('Inventory cannot be negative');
      expect(inventoryErrors).toHaveLength(2);
    });
  },
};

export const SKUGeneration: Story = {
  decorators: [
    (Story) => (
      <div className="max-w-4xl mx-auto p-6 bg-background">
        <FormWrapper
          initialValues={{
            ...defaultValues,
            name: 'Premium T-Shirt',
            variants: [
              {
                variantId: 'var-xs',
                label: 'Extra Small',
                priceAdjustment: -5,
                inventory: 10,
                sku: 'PTS-XS-001',
              },
              {
                variantId: 'var-s',
                label: 'Small',
                priceAdjustment: 0,
                inventory: 25,
                sku: 'PTS-S-001',
              },
              {
                variantId: 'var-m',
                label: 'Medium',
                priceAdjustment: 0,
                inventory: 30,
                sku: 'PTS-M-001',
              },
              {
                variantId: 'var-l',
                label: 'Large',
                priceAdjustment: 5,
                inventory: 20,
                sku: 'PTS-L-001',
              },
              {
                variantId: 'var-xl',
                label: 'Extra Large',
                priceAdjustment: 10,
                inventory: 15,
                sku: 'PTS-XL-001',
              },
            ],
          }}
        >
          <Story />
        </FormWrapper>
      </div>
    ),
  ],
};

export const EmptyState: Story = {};

export const SingleVariant: Story = {
  decorators: [
    (Story) => (
      <div className="max-w-4xl mx-auto p-6 bg-background">
        <FormWrapper
          initialValues={{
            ...defaultValues,
            variants: [
              {
                variantId: 'var-default',
                label: 'Default',
                priceAdjustment: 0,
                inventory: 100,
                sku: 'DEFAULT-001',
              },
            ],
          }}
        >
          <Story />
        </FormWrapper>
      </div>
    ),
  ],
};

export const InventoryManagement: Story = {
  decorators: [
    (Story) => (
      <div className="max-w-4xl mx-auto p-6 bg-background">
        <FormWrapper
          initialValues={{
            ...defaultValues,
            variants: [
              {
                variantId: 'var-1',
                label: 'In Stock',
                priceAdjustment: 0,
                inventory: 100,
                sku: 'STOCK-001',
              },
              {
                variantId: 'var-2',
                label: 'Low Stock',
                priceAdjustment: 0,
                inventory: 5,
                sku: 'LOW-001',
              },
              {
                variantId: 'var-3',
                label: 'Out of Stock',
                priceAdjustment: 0,
                inventory: 0,
                sku: 'OUT-001',
              },
            ],
          }}
        >
          <Story />
        </FormWrapper>
      </div>
    ),
  ],
};

export const ComplexPricing: Story = {
  decorators: [
    (Story) => (
      <div className="max-w-4xl mx-auto p-6 bg-background">
        <FormWrapper
          initialValues={{
            ...defaultValues,
            price: 299.99,
            variants: [
              {
                variantId: 'var-student',
                label: 'Student License',
                priceAdjustment: -100,
                inventory: 1000,
                sku: 'LIC-STU',
              },
              {
                variantId: 'var-personal',
                label: 'Personal License',
                priceAdjustment: 0,
                inventory: 500,
                sku: 'LIC-PER',
              },
              {
                variantId: 'var-team',
                label: 'Team License (5 users)',
                priceAdjustment: 200,
                inventory: 200,
                sku: 'LIC-TEAM',
              },
              {
                variantId: 'var-enterprise',
                label: 'Enterprise License',
                priceAdjustment: 700,
                inventory: 50,
                sku: 'LIC-ENT',
              },
            ],
          }}
        >
          <Story />
        </FormWrapper>
      </div>
    ),
  ],
};

export const LivePriceCalculation: Story = {
  decorators: [
    (Story) => (
      <div className="max-w-4xl mx-auto p-6 bg-background">
        <FormWrapper
          initialValues={{
            ...defaultValues,
            price: 50.00,
            variants: [
              {
                variantId: 'var-1',
                label: 'Basic',
                priceAdjustment: -10.50,
                inventory: 10,
                sku: 'BASIC',
              },
              {
                variantId: 'var-2',
                label: 'Standard',
                priceAdjustment: 0,
                inventory: 20,
                sku: 'STANDARD',
              },
              {
                variantId: 'var-3',
                label: 'Premium',
                priceAdjustment: 25.75,
                inventory: 15,
                sku: 'PREMIUM',
              },
            ],
          }}
        >
          <Story />
        </FormWrapper>
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Find a price adjustment input
    const priceInputs = canvas.getAllByRole('spinbutton', { name: /price adjustment/ });
    const secondInput = priceInputs[1]; // Standard variant
    
    // Clear and type new adjustment
    await userEvent.clear(secondInput);
    await userEvent.type(secondInput, '15.25');
    
    // Verify the final price updates
    await waitFor(() => {
      const prices = canvas.getAllByText(/^\$\d+\.\d{2}$/);
      const standardPrice = prices.find(el => el.textContent === '$65.25');
      expect(standardPrice).toBeInTheDocument(); // 50 + 15.25
    });
  },
};

export const MobileView: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  decorators: [
    (Story) => (
      <div className="p-4 bg-background">
        <FormWrapper
          initialValues={{
            ...defaultValues,
            variants: [
              {
                variantId: 'var-1',
                label: 'Small',
                priceAdjustment: 0,
                inventory: 10,
                sku: 'S-001',
              },
              {
                variantId: 'var-2',
                label: 'Large',
                priceAdjustment: 5,
                inventory: 5,
                sku: 'L-001',
              },
            ],
          }}
        >
          <Story />
        </FormWrapper>
      </div>
    ),
  ],
};

export const TabletView: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
  decorators: [
    (Story) => (
      <div className="p-4 bg-background">
        <FormWrapper
          initialValues={{
            ...defaultValues,
            variants: [
              {
                variantId: 'var-1',
                label: 'Small',
                priceAdjustment: 0,
                inventory: 10,
                sku: 'S-001',
              },
              {
                variantId: 'var-2',
                label: 'Medium',
                priceAdjustment: 0,
                inventory: 15,
                sku: 'M-001',
              },
              {
                variantId: 'var-3',
                label: 'Large',
                priceAdjustment: 5,
                inventory: 8,
                sku: 'L-001',
              },
            ],
          }}
        >
          <Story />
        </FormWrapper>
      </div>
    ),
  ],
};

// Enhanced Error State Stories
export const SaveError: Story = {
  decorators: [
    (Story) => {
      const [saveError, setSaveError] = useState<string | null>(null);
      const [isSaving, setIsSaving] = useState(false);
      
      const simulateSaveError = async () => {
        setIsSaving(true);
        setSaveError(null);
        
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setSaveError('Failed to save variants. Please try again.');
        setIsSaving(false);
        toast.error('Failed to save variants');
      };
      
      return (
        <div className="max-w-4xl mx-auto p-6 bg-background space-y-4">
          <Card className="p-4">
            <h4 className="font-medium mb-2">Save Error Simulation</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Click save to simulate a server error
            </p>
            <Button onClick={simulateSaveError} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Save className="w-4 h-4 mr-2 animate-pulse" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Variants
                </>
              )}
            </Button>
          </Card>
          
          {saveError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{saveError}</AlertDescription>
            </Alert>
          )}
          
          <FormWrapper
            initialValues={{
              ...defaultValues,
              variants: [
                {
                  variantId: 'var-1',
                  label: 'Small',
                  priceAdjustment: 0,
                  inventory: 10,
                  sku: 'S-001',
                },
                {
                  variantId: 'var-2',
                  label: 'Large',
                  priceAdjustment: 5,
                  inventory: 5,
                  sku: 'L-001',
                },
              ],
            }}
          >
            <Story />
          </FormWrapper>
          <Toaster position="top-right" />
        </div>
      );
    },
  ],
};

export const DuplicateSKUError: Story = {
  decorators: [
    (Story) => {
      const [skuError, setSkuError] = useState<string | null>(null);
      
      useEffect(() => {
        // Simulate SKU conflict detection
        const timer = setTimeout(() => {
          setSkuError('SKU "PROD-M" is already in use by another product');
          toast.error('Duplicate SKU detected');
        }, 2000);
        
        return () => clearTimeout(timer);
      }, []);
      
      return (
        <div className="max-w-4xl mx-auto p-6 bg-background space-y-4">
          {skuError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <span>{skuError}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSkuError(null)}
                  >
                    Dismiss
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          <FormWrapper
            initialValues={{
              ...defaultValues,
              variants: [
                {
                  variantId: 'var-s',
                  label: 'Small',
                  priceAdjustment: 0,
                  inventory: 25,
                  sku: 'PROD-S',
                },
                {
                  variantId: 'var-m',
                  label: 'Medium',
                  priceAdjustment: 0,
                  inventory: 30,
                  sku: 'PROD-M', // Duplicate SKU
                },
                {
                  variantId: 'var-l',
                  label: 'Large',
                  priceAdjustment: 5,
                  inventory: 20,
                  sku: 'PROD-M', // Duplicate SKU
                },
              ],
            }}
          >
            <Story />
          </FormWrapper>
          <Toaster position="top-right" />
        </div>
      );
    },
  ],
};

export const InventoryValidationError: Story = {
  decorators: [
    (Story) => (
      <div className="max-w-4xl mx-auto p-6 bg-background space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">Inventory Validation Errors</p>
              <ul className="text-sm list-disc list-inside">
                <li>Negative inventory values are not allowed</li>
                <li>Maximum inventory per variant is 9999</li>
                <li>Total inventory across all variants cannot exceed warehouse capacity</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>
        
        <FormWrapper
          initialValues={{
            ...defaultValues,
            variants: [
              {
                variantId: 'var-1',
                label: 'Negative Stock',
                priceAdjustment: 0,
                inventory: -10,
                sku: 'NEG-001',
              },
              {
                variantId: 'var-2',
                label: 'Excessive Stock',
                priceAdjustment: 0,
                inventory: 10000,
                sku: 'EXC-001',
              },
              {
                variantId: 'var-3',
                label: 'Valid Stock',
                priceAdjustment: 0,
                inventory: 100,
                sku: 'VAL-001',
              },
            ],
          }}
        >
          <Story />
        </FormWrapper>
        <Toaster position="top-right" />
      </div>
    ),
  ],
};

export const PriceCalculationError: Story = {
  decorators: [
    (Story) => {
      const [priceError, setPriceError] = useState(false);
      
      return (
        <div className="max-w-4xl mx-auto p-6 bg-background space-y-4">
          <Card className="p-4">
            <h4 className="font-medium mb-2">Price Calculation Error Demo</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Shows what happens when price adjustments result in negative prices
            </p>
            <Button
              size="sm"
              onClick={() => {
                setPriceError(true);
                toast.error('Variant price cannot be negative');
              }}
            >
              Trigger Price Error
            </Button>
          </Card>
          
          {priceError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Price adjustment results in negative price for "Clearance" variant
              </AlertDescription>
            </Alert>
          )}
          
          <FormWrapper
            initialValues={{
              ...defaultValues,
              price: 50.00,
              variants: [
                {
                  variantId: 'var-1',
                  label: 'Regular',
                  priceAdjustment: 0,
                  inventory: 100,
                  sku: 'REG-001',
                },
                {
                  variantId: 'var-2',
                  label: 'Clearance',
                  priceAdjustment: -75, // Results in negative price
                  inventory: 50,
                  sku: 'CLR-001',
                },
              ],
            }}
          >
            <Story />
          </FormWrapper>
          <Toaster position="top-right" />
        </div>
      );
    },
  ],
};

export const BulkImportError: Story = {
  decorators: [
    (Story) => {
      const [importError, setImportError] = useState<string | null>(null);
      const [isImporting, setIsImporting] = useState(false);
      
      const simulateImport = async () => {
        setIsImporting(true);
        setImportError(null);
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        setImportError('Failed to import variants from CSV: Invalid format on line 3');
        setIsImporting(false);
        toast.error('Import failed');
      };
      
      return (
        <div className="max-w-4xl mx-auto p-6 bg-background space-y-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium mb-1">Bulk Import</h4>
                <p className="text-sm text-muted-foreground">
                  Import variants from CSV file
                </p>
              </div>
              <Button onClick={simulateImport} disabled={isImporting}>
                {isImporting ? (
                  <>
                    <Package className="w-4 h-4 mr-2 animate-pulse" />
                    Importing...
                  </>
                ) : (
                  'Import CSV'
                )}
              </Button>
            </div>
          </Card>
          
          {importError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p>{importError}</p>
                  <Button size="sm" variant="outline" onClick={() => setImportError(null)}>
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Try Again
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          <FormWrapper>
            <Story />
          </FormWrapper>
          <Toaster position="top-right" />
        </div>
      );
    },
  ],
};

export const FormSubmissionError: Story = {
  decorators: [
    (Story) => {
      const methods = useForm<ProductFormInput>({
        resolver: zodResolver(productSchema),
        defaultValues: {
          ...defaultValues,
          variants: [
            {
              variantId: '',
              label: '', // Empty label
              priceAdjustment: 0,
              inventory: -5, // Negative inventory
              sku: '', // Empty SKU
            },
            {
              variantId: 'var-2',
              label: 'Valid Variant',
              priceAdjustment: 999999, // Excessive price
              inventory: 10,
              sku: 'VALID-001',
            },
          ],
        },
      });
      
      const [showErrors, setShowErrors] = useState(false);
      
      const handleSubmit = async (data: ProductFormInput) => {
        console.log('Form submitted:', data);
      };
      
      const triggerValidation = async () => {
        const isValid = await methods.trigger();
        if (!isValid) {
          setShowErrors(true);
          toast.error('Please fix the errors before submitting');
        }
      };
      
      return (
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(handleSubmit)} className="max-w-4xl mx-auto p-6 bg-background space-y-6">
            <Card className="p-4">
              <h4 className="font-medium mb-2">Form Validation Demo</h4>
              <p className="text-sm text-muted-foreground mb-3">
                This form has multiple validation errors
              </p>
              <Button type="button" onClick={triggerValidation}>
                Validate Form
              </Button>
            </Card>
            
            {showErrors && Object.keys(methods.formState.errors).length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-medium mb-2">Please fix the following errors:</p>
                  <ul className="text-sm list-disc list-inside">
                    {methods.formState.errors.variants && (
                      <li>Variant fields have validation errors</li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            
            <Story />
            
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h3 className="text-sm font-medium mb-2">Form State</h3>
              <pre className="text-xs overflow-auto">
                {JSON.stringify(methods.watch(), null, 2)}
              </pre>
            </div>
          </form>
          <Toaster position="top-right" />
        </FormProvider>
      );
    },
  ],
};

export const ErrorRecovery: Story = {
  decorators: [
    (Story) => {
      const [error, setError] = useState<string | null>('Connection lost. Changes not saved.');
      const [isRetrying, setIsRetrying] = useState(false);
      const [retryCount, setRetryCount] = useState(0);
      
      const retry = async () => {
        setIsRetrying(true);
        setRetryCount(prev => prev + 1);
        
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        if (retryCount >= 1) {
          setError(null);
          toast.success('Changes saved successfully!');
        } else {
          toast.error('Still having issues. Please try again.');
        }
        
        setIsRetrying(false);
      };
      
      return (
        <div className="max-w-4xl mx-auto p-6 bg-background space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <span>{error}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={retry}
                    disabled={isRetrying}
                  >
                    {isRetrying ? (
                      <>
                        <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                        Retrying...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Retry ({retryCount + 1}/2)
                      </>
                    )}
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          <Card className="p-4">
            <h4 className="font-medium mb-2">Error Recovery Demo</h4>
            <p className="text-sm text-muted-foreground">
              {retryCount === 0 ? 'First retry will fail, second will succeed' : 'Next retry will succeed'}
            </p>
          </Card>
          
          <FormWrapper
            initialValues={{
              ...defaultValues,
              variants: [
                {
                  variantId: 'var-1',
                  label: 'Small',
                  priceAdjustment: 0,
                  inventory: 10,
                  sku: 'S-001',
                },
              ],
            }}
          >
            <Story />
          </FormWrapper>
          <Toaster position="top-right" />
        </div>
      );
    },
  ],
};