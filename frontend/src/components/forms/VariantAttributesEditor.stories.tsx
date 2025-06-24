import type { Meta, StoryObj } from '@storybook/react-vite';
import { VariantAttributesEditor } from './VariantAttributesEditor';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productSchema, type ProductFormInput } from '@/lib/validations';
import { fn } from '@storybook/test';
import { within, userEvent, expect, waitFor } from '@storybook/test';
import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Toaster, toast } from 'sonner';
import { AlertCircle, RefreshCw, Save, AlertTriangle, Database, Package, Copy } from 'lucide-react';

// Default form values
const defaultValues: Partial<ProductFormInput> = {
  name: 'Test Product',
  description: 'Test product description',
  price: 49.99,
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
          <pre className="text-xs">
            {JSON.stringify(methods.watch(), null, 2)}
          </pre>
        </div>
      </form>
    </FormProvider>
  );
};

const meta = {
  title: 'Forms/VariantAttributesEditor',
  component: VariantAttributesEditor,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="max-w-6xl mx-auto p-6 bg-background">
        <FormWrapper>
          <Story />
        </FormWrapper>
      </div>
    ),
  ],
} satisfies Meta<typeof VariantAttributesEditor>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithExistingVariantTypes: Story = {
  decorators: [
    (Story) => (
      <div className="max-w-6xl mx-auto p-6 bg-background">
        <FormWrapper
          initialValues={{
            ...defaultValues,
            variantTypes: [
              { name: 'size', values: ['S', 'M', 'L', 'XL'] },
              { name: 'color', values: ['Black', 'White', 'Navy'] },
            ],
          }}
        >
          <Story />
        </FormWrapper>
      </div>
    ),
  ],
};

export const WithGeneratedVariants: Story = {
  decorators: [
    (Story) => (
      <div className="max-w-6xl mx-auto p-6 bg-background">
        <FormWrapper
          initialValues={{
            ...defaultValues,
            variantTypes: [
              { name: 'size', values: ['S', 'M', 'L'] },
              { name: 'color', values: ['Black', 'White'] },
            ],
            variants: [
              { label: 'S / Black', priceAdjustment: 0, inventory: 10, sku: 'PROD-S-BLK', attributes: { size: 'S', color: 'Black' } },
              { label: 'S / White', priceAdjustment: 0, inventory: 15, sku: 'PROD-S-WHT', attributes: { size: 'S', color: 'White' } },
              { label: 'M / Black', priceAdjustment: 0, inventory: 20, sku: 'PROD-M-BLK', attributes: { size: 'M', color: 'Black' } },
              { label: 'M / White', priceAdjustment: 0, inventory: 5, sku: 'PROD-M-WHT', attributes: { size: 'M', color: 'White' } },
              { label: 'L / Black', priceAdjustment: 5, inventory: 8, sku: 'PROD-L-BLK', attributes: { size: 'L', color: 'Black' } },
              { label: 'L / White', priceAdjustment: 5, inventory: 12, sku: 'PROD-L-WHT', attributes: { size: 'L', color: 'White' } },
            ],
          }}
        >
          <Story />
        </FormWrapper>
      </div>
    ),
  ],
};

export const WithDuplicateVariants: Story = {
  decorators: [
    (Story) => (
      <div className="max-w-6xl mx-auto p-6 bg-background">
        <FormWrapper
          initialValues={{
            ...defaultValues,
            variantTypes: [
              { name: 'size', values: ['S', 'M'] },
              { name: 'color', values: ['Black', 'White'] },
            ],
            variants: [
              { label: 'S / Black', priceAdjustment: 0, inventory: 10, sku: 'SKU-1', attributes: { size: 'S', color: 'Black' } },
              { label: 'S / Black', priceAdjustment: 5, inventory: 15, sku: 'SKU-2', attributes: { size: 'S', color: 'Black' } },
              { label: 'M / White', priceAdjustment: 0, inventory: 20, sku: 'SKU-3', attributes: { size: 'M', color: 'White' } },
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
};

export const AddVariantTypeInteraction: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Add a Size variant type
    const typeNameInput = canvas.getByPlaceholderText('Type name (e.g., Size)');
    await userEvent.type(typeNameInput, 'Size');
    
    const valuesInput = canvas.getByPlaceholderText(/Values \(comma-separated/);
    await userEvent.type(valuesInput, 'Small, Medium, Large');
    
    const addButton = canvas.getByRole('button', { name: /Add Type/ });
    await userEvent.click(addButton);
    
    // Verify the type was added
    await waitFor(() => {
      expect(canvas.getByText('size')).toBeInTheDocument();
      expect(canvas.getByText('Small')).toBeInTheDocument();
      expect(canvas.getByText('Medium')).toBeInTheDocument();
      expect(canvas.getByText('Large')).toBeInTheDocument();
    });
  },
};

export const GenerateVariantsInteraction: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Add Size type
    const typeNameInput = canvas.getByPlaceholderText('Type name (e.g., Size)');
    await userEvent.type(typeNameInput, 'Size');
    
    const valuesInput = canvas.getByPlaceholderText(/Values \(comma-separated/);
    await userEvent.type(valuesInput, 'S, M');
    
    const addTypeButton = canvas.getByRole('button', { name: /Add Type/ });
    await userEvent.click(addTypeButton);
    
    // Clear inputs
    await userEvent.clear(typeNameInput);
    await userEvent.clear(valuesInput);
    
    // Add Color type
    await userEvent.type(typeNameInput, 'Color');
    await userEvent.type(valuesInput, 'Black, White');
    await userEvent.click(addTypeButton);
    
    // Generate variants
    const generateButton = canvas.getByRole('button', { name: /Generate Variants/ });
    await userEvent.click(generateButton);
    
    // Verify variants were generated (2 sizes × 2 colors = 4 variants)
    await waitFor(() => {
      expect(canvas.getByDisplayValue('S / Black')).toBeInTheDocument();
      expect(canvas.getByDisplayValue('S / White')).toBeInTheDocument();
      expect(canvas.getByDisplayValue('M / Black')).toBeInTheDocument();
      expect(canvas.getByDisplayValue('M / White')).toBeInTheDocument();
    });
  },
};

export const ManualVariantAddition: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Click add variant manually button
    const addVariantButton = canvas.getByRole('button', { name: /Add Variant Manually/ });
    await userEvent.click(addVariantButton);
    
    // A new row should appear in the variants table
    await waitFor(() => {
      expect(canvas.getAllByRole('row')).toHaveLength(2); // Header + 1 variant row
    });
  },
};

export const DeleteVariantType: Story = {
  decorators: [
    (Story) => (
      <div className="max-w-6xl mx-auto p-6 bg-background">
        <FormWrapper
          initialValues={{
            ...defaultValues,
            variantTypes: [
              { name: 'size', values: ['S', 'M', 'L'] },
              { name: 'color', values: ['Red', 'Blue', 'Green'] },
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
    
    // Find and click the first delete button
    const deleteButtons = canvas.getAllByRole('button').filter(btn => 
      btn.querySelector('svg') && btn.className.includes('text-destructive'),
    );
    
    if (deleteButtons.length > 0) {
      await userEvent.click(deleteButtons[0]);
    }
    
    // Verify the type was removed
    await waitFor(() => {
      expect(canvas.queryByText('size')).not.toBeInTheDocument();
      expect(canvas.getByText('color')).toBeInTheDocument(); // Second type should still exist
    });
  },
};

export const EditVariantDetails: Story = {
  decorators: [
    (Story) => (
      <div className="max-w-6xl mx-auto p-6 bg-background">
        <FormWrapper
          initialValues={{
            ...defaultValues,
            price: 50.00,
            variantTypes: [
              { name: 'size', values: ['S', 'M'] },
            ],
            variants: [
              { label: 'S', priceAdjustment: 0, inventory: 10, sku: '', attributes: { size: 'S' } },
              { label: 'M', priceAdjustment: 0, inventory: 15, sku: '', attributes: { size: 'M' } },
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
    
    // Find price adjustment input for first variant
    const priceInputs = canvas.getAllByRole('spinbutton').filter(input => 
      input.getAttribute('name')?.includes('priceAdjustment'),
    );
    
    if (priceInputs.length > 0) {
      await userEvent.clear(priceInputs[0]);
      await userEvent.type(priceInputs[0], '5.50');
    }
    
    // Find inventory input
    const inventoryInputs = canvas.getAllByRole('spinbutton').filter(input => 
      input.getAttribute('name')?.includes('inventory'),
    );
    
    if (inventoryInputs.length > 0) {
      await userEvent.clear(inventoryInputs[0]);
      await userEvent.type(inventoryInputs[0], '25');
    }
    
    // Find SKU input
    const skuInputs = canvas.getAllByPlaceholderText('Optional');
    
    if (skuInputs.length > 0) {
      await userEvent.type(skuInputs[0], 'PROD-S-001');
    }
    
    // Verify final price calculation
    await waitFor(() => {
      expect(canvas.getByText('$55.50')).toBeInTheDocument(); // Base price 50 + adjustment 5.50
    });
  },
};

export const ComplexVariantTypes: Story = {
  decorators: [
    (Story) => (
      <div className="max-w-6xl mx-auto p-6 bg-background">
        <FormWrapper
          initialValues={{
            ...defaultValues,
            variantTypes: [
              { name: 'size', values: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] },
              { name: 'color', values: ['Black', 'White', 'Navy', 'Gray', 'Red'] },
              { name: 'material', values: ['Cotton', 'Polyester', 'Wool Blend'] },
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

export const SingleVariantType: Story = {
  decorators: [
    (Story) => (
      <div className="max-w-6xl mx-auto p-6 bg-background">
        <FormWrapper
          initialValues={{
            ...defaultValues,
            variantTypes: [
              { name: 'size', values: ['One Size'] },
            ],
            variants: [
              { label: 'One Size', priceAdjustment: 0, inventory: 100, sku: 'PROD-OS', attributes: { size: 'One Size' } },
            ],
          }}
        >
          <Story />
        </FormWrapper>
      </div>
    ),
  ],
};

export const PriceVariations: Story = {
  decorators: [
    (Story) => (
      <div className="max-w-6xl mx-auto p-6 bg-background">
        <FormWrapper
          initialValues={{
            ...defaultValues,
            price: 100.00,
            variantTypes: [
              { name: 'edition', values: ['Standard', 'Deluxe', 'Premium'] },
            ],
            variants: [
              { label: 'Standard', priceAdjustment: 0, inventory: 50, sku: 'PROD-STD', attributes: { edition: 'Standard' } },
              { label: 'Deluxe', priceAdjustment: 25, inventory: 30, sku: 'PROD-DLX', attributes: { edition: 'Deluxe' } },
              { label: 'Premium', priceAdjustment: 50, inventory: 10, sku: 'PROD-PRM', attributes: { edition: 'Premium' } },
            ],
          }}
        >
          <Story />
        </FormWrapper>
      </div>
    ),
  ],
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
            variantTypes: [
              { name: 'size', values: ['S', 'M', 'L'] },
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
            variantTypes: [
              { name: 'size', values: ['S', 'M', 'L'] },
              { name: 'color', values: ['Black', 'White'] },
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
      <div className="max-w-6xl mx-auto p-6 bg-background">
        <FormWrapper
          initialValues={{
            ...defaultValues,
            variantTypes: [
              { name: 'size', values: ['S', 'M'] },
            ],
            variants: [
              { label: 'S', priceAdjustment: 0, inventory: -5, sku: '', attributes: { size: 'S' } },
              { label: 'M', priceAdjustment: 0, inventory: -10, sku: '', attributes: { size: 'M' } },
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
    
    // Trigger validation by submitting the form
    const form = canvas.getByRole('form');
    // Trigger form submission
    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    form.appendChild(submitButton);
    submitButton.click();
    form.removeChild(submitButton);
    
    // Check for error messages
    await waitFor(() => {
      const errorMessages = canvas.getAllByText('Cannot be negative');
      expect(errorMessages).toHaveLength(2);
    });
  },
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
        
        setSaveError('Failed to save variant configuration. Please try again.');
        setIsSaving(false);
        toast.error('Failed to save variant configuration');
      };
      
      return (
        <div className="max-w-6xl mx-auto p-6 bg-background space-y-4">
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
                  Save Configuration
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
              variantTypes: [
                { name: 'size', values: ['S', 'M', 'L'] },
                { name: 'color', values: ['Black', 'White'] },
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

export const VariantGenerationError: Story = {
  decorators: [
    (Story) => {
      const [generationError, setGenerationError] = useState<string | null>(null);
      
      return (
        <div className="max-w-6xl mx-auto p-6 bg-background space-y-4">
          {generationError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <span>{generationError}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setGenerationError(null)}
                  >
                    Dismiss
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          <Card className="p-4">
            <h4 className="font-medium mb-2">Variant Generation Error Demo</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Too many variant combinations (exceeds limit of 100)
            </p>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => {
                setGenerationError('Cannot generate more than 100 variants. Please reduce the number of options.');
                toast.error('Too many variant combinations');
              }}
            >
              Trigger Generation Error
            </Button>
          </Card>
          
          <FormWrapper
            initialValues={{
              ...defaultValues,
              variantTypes: [
                { name: 'size', values: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] },
                { name: 'color', values: ['Black', 'White', 'Navy', 'Gray', 'Red', 'Blue', 'Green'] },
                { name: 'material', values: ['Cotton', 'Polyester', 'Wool'] },
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

export const DuplicateAttributeError: Story = {
  decorators: [
    (Story) => {
      const [duplicateError, setDuplicateError] = useState(true);
      
      return (
        <div className="max-w-6xl mx-auto p-6 bg-background space-y-4">
          {duplicateError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Duplicate Variant Detected</p>
                  <p className="text-sm">Multiple variants with attributes &quot;M / Black&quot; found. Each variant must have unique attributes.</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setDuplicateError(false)}
                  >
                    Fix Duplicates
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          <FormWrapper
            initialValues={{
              ...defaultValues,
              variantTypes: [
                { name: 'size', values: ['S', 'M', 'L'] },
                { name: 'color', values: ['Black', 'White'] },
              ],
              variants: [
                { label: 'S / Black', priceAdjustment: 0, inventory: 10, sku: 'S-BLK-1', attributes: { size: 'S', color: 'Black' } },
                { label: 'M / Black', priceAdjustment: 5, inventory: 15, sku: 'M-BLK-1', attributes: { size: 'M', color: 'Black' } },
                { label: 'M / Black', priceAdjustment: 10, inventory: 20, sku: 'M-BLK-2', attributes: { size: 'M', color: 'Black' } },
                { label: 'L / White', priceAdjustment: 5, inventory: 8, sku: 'L-WHT-1', attributes: { size: 'L', color: 'White' } },
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

export const InvalidAttributeValue: Story = {
  decorators: [
    (Story) => {
      const [validationError, setValidationError] = useState<string | null>(null);
      
      const validateAttributes = () => {
        setValidationError('Invalid attribute value: "Extra Large" is not defined in size options');
        toast.error('Invalid attribute value detected');
      };
      
      return (
        <div className="max-w-6xl mx-auto p-6 bg-background space-y-4">
          <Card className="p-4">
            <h4 className="font-medium mb-2">Attribute Validation Demo</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Detects when variant attributes don&apos;t match defined options
            </p>
            <Button size="sm" onClick={validateAttributes}>
              Validate Attributes
            </Button>
          </Card>
          
          {validationError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{validationError}</AlertDescription>
            </Alert>
          )}
          
          <FormWrapper
            initialValues={{
              ...defaultValues,
              variantTypes: [
                { name: 'size', values: ['S', 'M', 'L'] },
              ],
              variants: [
                { label: 'Small', priceAdjustment: 0, inventory: 10, sku: 'SM-001', attributes: { size: 'S' } },
                { label: 'Extra Large', priceAdjustment: 10, inventory: 5, sku: 'XL-001', attributes: { size: 'Extra Large' } },
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

export const SKUConflictError: Story = {
  decorators: [
    (Story) => {
      const [skuError] = useState<string | null>(null);
      const [conflictingSKUs] = useState(['PROD-M-BLK', 'PROD-L-WHT']);
      
      return (
        <div className="max-w-6xl mx-auto p-6 bg-background space-y-4">
          <Card className="p-4 border-orange-200 bg-orange-50">
            <div className="flex items-center gap-2 mb-2">
              <Database className="w-4 h-4 text-orange-600" />
              <h4 className="font-medium">SKU Conflict Detection</h4>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              These SKUs are already in use by other products
            </p>
            <div className="flex flex-wrap gap-2">
              {conflictingSKUs.map(sku => (
                <Badge key={sku} variant="secondary">
                  {sku}
                </Badge>
              ))}
            </div>
          </Card>
          
          {skuError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{skuError}</AlertDescription>
            </Alert>
          )}
          
          <FormWrapper
            initialValues={{
              ...defaultValues,
              variantTypes: [
                { name: 'size', values: ['S', 'M', 'L'] },
                { name: 'color', values: ['Black', 'White'] },
              ],
              variants: [
                { label: 'S / Black', priceAdjustment: 0, inventory: 10, sku: 'PROD-S-BLK', attributes: { size: 'S', color: 'Black' } },
                { label: 'M / Black', priceAdjustment: 0, inventory: 15, sku: 'PROD-M-BLK', attributes: { size: 'M', color: 'Black' } },
                { label: 'L / White', priceAdjustment: 5, inventory: 8, sku: 'PROD-L-WHT', attributes: { size: 'L', color: 'White' } },
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
        
        setImportError('Failed to parse CSV: Invalid format on line 5 - missing required "size" attribute');
        setIsImporting(false);
        toast.error('Import failed');
      };
      
      return (
        <div className="max-w-6xl mx-auto p-6 bg-background space-y-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium mb-1">Bulk Variant Import</h4>
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
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setImportError(null)}>
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Try Again
                    </Button>
                    <Button size="sm" variant="outline">
                      <Copy className="w-3 h-3 mr-1" />
                      Download Template
                    </Button>
                  </div>
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

export const VariantLimitExceeded: Story = {
  decorators: [
    (Story) => {
      const variantCount = 6 * 7 * 3; // 126 variants
      
      return (
        <div className="max-w-6xl mx-auto p-6 bg-background space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">Variant Limit Exceeded</p>
                <p className="text-sm">
                  Your configuration would create {variantCount} variants, but the maximum allowed is 100.
                  Please reduce the number of options.
                </p>
                <div className="flex gap-2 text-xs">
                  <Badge variant="outline">6 sizes</Badge>
                  <span>×</span>
                  <Badge variant="outline">7 colors</Badge>
                  <span>×</span>
                  <Badge variant="outline">3 materials</Badge>
                  <span>=</span>
                  <Badge variant="destructive">{variantCount} variants</Badge>
                </div>
              </div>
            </AlertDescription>
          </Alert>
          
          <FormWrapper
            initialValues={{
              ...defaultValues,
              variantTypes: [
                { name: 'size', values: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] },
                { name: 'color', values: ['Black', 'White', 'Navy', 'Gray', 'Red', 'Blue', 'Green'] },
                { name: 'material', values: ['Cotton', 'Polyester', 'Wool'] },
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
        <div className="max-w-6xl mx-auto p-6 bg-background space-y-4">
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
              variantTypes: [
                { name: 'size', values: ['S', 'M', 'L'] },
              ],
              variants: [
                { label: 'S', priceAdjustment: 0, inventory: 10, sku: 'S-001', attributes: { size: 'S' } },
                { label: 'M', priceAdjustment: 0, inventory: 15, sku: 'M-001', attributes: { size: 'M' } },
                { label: 'L', priceAdjustment: 5, inventory: 8, sku: 'L-001', attributes: { size: 'L' } },
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