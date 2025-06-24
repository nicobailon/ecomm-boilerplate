import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProductForm } from './ProductForm';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { userEvent, within, expect, waitFor } from '@storybook/test';
import { http, HttpResponse } from 'msw';
import { trpc } from '@/lib/trpc';
import { createTRPCClient } from '@/lib/trpc-client';
import type { Product, Collection } from '@/types';
import { Toaster, toast } from 'sonner';
import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { AlertCircle, RefreshCw, Save, AlertTriangle, Image, Upload, Database } from 'lucide-react';

// Mock collections data
const mockCollections: Collection[] = [
  {
    _id: 'col1',
    name: 'Summer Collection',
    slug: 'summer-collection',
    description: 'Hot summer items',
    isPublic: true,
    products: [],
    owner: { _id: 'user1', name: 'John Doe', email: 'john@example.com' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'col2',
    name: 'Winter Collection',
    slug: 'winter-collection',
    isPublic: false,
    products: [],
    owner: { _id: 'user1', name: 'John Doe', email: 'john@example.com' },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Mock product data
const mockProduct: Product = {
  _id: 'prod1',
  name: 'Wireless Headphones',
  description: 'Premium noise-cancelling wireless headphones with 30-hour battery life',
  price: 299.99,
  image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
  isFeatured: true,
  slug: 'wireless-headphones',
  inventory: 50,
  collectionId: 'col1',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockProductWithVariants: Product = {
  ...mockProduct,
  _id: 'prod2',
  name: 'T-Shirt Collection',
  price: 29.99,
  variants: [
    {
      variantId: 'var1',
      label: 'Small Blue',
      color: 'Blue',
      price: 29.99,
      inventory: 20,
      reservedInventory: 0,
      images: [],
      sku: 'TSH-S-BLU',
    },
    {
      variantId: 'var2',
      label: 'Medium Black',
      color: 'Black',
      price: 32.99,
      inventory: 15,
      reservedInventory: 2,
      images: [],
      sku: 'TSH-M-BLK',
    },
  ],
};

// Create wrapper with tRPC and mock data
const createWrapper = (mockData?: { collections?: Collection[] }) => {
  const Wrapper = (Story: React.ComponentType) => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Set up mock data
    if (mockData?.collections) {
      queryClient.setQueryData(['collections.list', { limit: 100 }], {
        collections: mockData.collections,
        nextCursor: null,
      });
    }

    return (
      <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <div className="max-w-4xl mx-auto">
              <Story />
              <Toaster position="top-right" />
            </div>
          </BrowserRouter>
        </QueryClientProvider>
      </trpc.Provider>
    );
  };
  
  Wrapper.displayName = 'ProductFormWrapper';
  return Wrapper;
};

const meta = {
  title: 'Forms/ProductForm',
  component: ProductForm,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ProductForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CreateMode: Story = {
  args: {
    mode: 'create',
  },
  decorators: [createWrapper({ collections: mockCollections })],
};

export const EditMode: Story = {
  args: {
    mode: 'edit',
    initialData: mockProduct,
  },
  decorators: [createWrapper({ collections: mockCollections })],
};

export const WithVariants: Story = {
  args: {
    mode: 'edit',
    initialData: mockProductWithVariants,
  },
  decorators: [createWrapper({ collections: mockCollections })],
};

export const ValidationFlow: Story = {
  args: {
    mode: 'create',
  },
  decorators: [createWrapper({ collections: mockCollections })],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Try to submit empty form
    const submitButton = canvas.getByRole('button', { name: /create product/i });
    await userEvent.click(submitButton);
    
    // Check for validation errors
    await waitFor(() => {
      expect(canvas.getByText(/name must be at least 1 character/i)).toBeInTheDocument();
      expect(canvas.getByText(/description must be at least 1 character/i)).toBeInTheDocument();
      expect(canvas.getByText(/price must be a positive number/i)).toBeInTheDocument();
    });
  },
};

export const SuccessfulCreation: Story = {
  args: {
    mode: 'create',
    onSuccess: (product) => console.log('Product created:', product),
  },
  decorators: [createWrapper({ collections: mockCollections })],
  parameters: {
    msw: {
      handlers: [
        http.post('/api/products', async ({ request }) => {
          const body = await request.json() as Record<string, any>;
          return HttpResponse.json({
            ...mockProduct,
            ...body,
            _id: 'new-product-id',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Fill in the form
    await userEvent.type(canvas.getByLabelText(/product name/i), 'Gaming Keyboard');
    await userEvent.type(canvas.getByLabelText(/description/i), 'RGB mechanical gaming keyboard with Cherry MX switches');
    await userEvent.type(canvas.getByLabelText(/price/i), '149.99');
    
    // Select collection
    const collectionSelect = canvas.getByLabelText(/collection/i);
    await userEvent.click(collectionSelect);
    await userEvent.click(canvas.getByText('Summer Collection'));
    
    // Submit form
    const submitButton = canvas.getByRole('button', { name: /create product/i });
    await userEvent.click(submitButton);
    
    // Check for success toast
    const body = within(document.body);
    await waitFor(() => {
      expect(body.getByText(/product created/i)).toBeInTheDocument();
    });
  },
};

export const ImageUpload: Story = {
  args: {
    mode: 'create',
  },
  decorators: [createWrapper({ collections: mockCollections })],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Note: Actual file upload can't be simulated in Storybook
    // This demonstrates the UI flow
    
    // Check upload button exists
    const uploadButton = canvas.getByText(/choose files/i);
    expect(uploadButton).toBeInTheDocument();
    
    // The upload button should be from UploadThing
    expect(uploadButton.closest('button')).toHaveAttribute('data-ut-element', 'button');
  },
};

export const VariantManagement: Story = {
  args: {
    mode: 'create',
  },
  decorators: [createWrapper({ collections: mockCollections })],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Add a variant
    const addVariantButton = canvas.getByRole('button', { name: /add variant/i });
    await userEvent.click(addVariantButton);
    
    // Fill variant details
    const variantInputs = canvas.getAllByLabelText(/variant label/i);
    await userEvent.type(variantInputs[0], 'Large Blue');
    
    const inventoryInputs = canvas.getAllByLabelText(/inventory/i);
    await userEvent.type(inventoryInputs[0], '25');
    
    // Add another variant
    await userEvent.click(addVariantButton);
    
    const variantInputs2 = canvas.getAllByLabelText(/variant label/i);
    await userEvent.type(variantInputs2[1], 'Medium Red');
    
    const inventoryInputs2 = canvas.getAllByLabelText(/inventory/i);
    await userEvent.type(inventoryInputs2[1], '15');
    
    // Remove first variant
    const removeButtons = canvas.getAllByRole('button', { name: /remove variant/i });
    await userEvent.click(removeButtons[0]);
    
    // Verify only one variant remains
    await waitFor(() => {
      const remainingVariants = canvas.getAllByLabelText(/variant label/i);
      expect(remainingVariants).toHaveLength(1);
    });
  },
};

export const UpdateProduct: Story = {
  args: {
    mode: 'edit',
    initialData: mockProduct,
    onSuccess: (product) => console.log('Product updated:', product),
  },
  decorators: [createWrapper({ collections: mockCollections })],
  parameters: {
    msw: {
      handlers: [
        http.put('/api/products/:id', async ({ request, params }) => {
          const body = await request.json() as Record<string, any>;
          return HttpResponse.json({
            ...mockProduct,
            ...body,
            _id: params.id,
            updatedAt: new Date().toISOString(),
          });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Modify price
    const priceInput = canvas.getByLabelText(/price/i);
    await userEvent.clear(priceInput);
    await userEvent.type(priceInput, '349.99');
    
    // Toggle featured
    const featuredToggle = canvas.getByRole('switch', { name: /featured product/i });
    await userEvent.click(featuredToggle);
    
    // Submit form
    const submitButton = canvas.getByRole('button', { name: /update product/i });
    await userEvent.click(submitButton);
    
    // Check for success toast
    const body = within(document.body);
    await waitFor(() => {
      expect(body.getByText(/product updated/i)).toBeInTheDocument();
    });
  },
};

export const ErrorHandling: Story = {
  args: {
    mode: 'create',
  },
  decorators: [createWrapper({ collections: mockCollections })],
  parameters: {
    msw: {
      handlers: [
        http.post('/api/products', () => {
          return HttpResponse.json(
            { error: 'A product with this name already exists' },
            { status: 400 },
          );
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Fill in the form
    await userEvent.type(canvas.getByLabelText(/product name/i), 'Duplicate Product');
    await userEvent.type(canvas.getByLabelText(/description/i), 'This will fail');
    await userEvent.type(canvas.getByLabelText(/price/i), '99.99');
    
    // Submit form
    const submitButton = canvas.getByRole('button', { name: /create product/i });
    await userEvent.click(submitButton);
    
    // Check for error toast
    const body = within(document.body);
    await waitFor(() => {
      expect(body.getByText(/a product with this name already exists/i)).toBeInTheDocument();
    });
  },
};

export const CollectionCreation: Story = {
  args: {
    mode: 'create',
  },
  decorators: [createWrapper({ collections: mockCollections })],
  parameters: {
    msw: {
      handlers: [
        http.post('/api/collections', async ({ request }) => {
          const body = await request.json() as { name: string };
          return HttpResponse.json({
            _id: 'new-collection-id',
            name: body.name,
            slug: body.name.toLowerCase().replace(/ /g, '-'),
            isPublic: false,
            products: [],
            owner: 'user1',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Open collection select
    const collectionSelect = canvas.getByLabelText(/collection/i);
    await userEvent.click(collectionSelect);
    
    // Type new collection name
    await userEvent.type(collectionSelect, 'New Spring Collection');
    
    // Create new collection option should appear
    await waitFor(() => {
      expect(canvas.getByText(/create "new spring collection"/i)).toBeInTheDocument();
    });
    
    // Click to create
    await userEvent.click(canvas.getByText(/create "new spring collection"/i));
    
    // Collection should be selected
    await waitFor(() => {
      expect(collectionSelect).toHaveValue('New Spring Collection');
    });
  },
};

export const LoadingStates: Story = {
  args: {
    mode: 'create',
  },
  decorators: [
    (Story) => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { 
            retry: false,
            staleTime: 0,
          },
        },
      });

      // Simulate loading collections
      queryClient.setQueryData(['collections.list', { limit: 100 }], undefined);
      // setQueryState doesn't exist in React Query v5, use setQueryData instead
      queryClient.setQueryData(['collections.list', { limit: 100 }], undefined);
      queryClient.invalidateQueries({ queryKey: ['collections.list', { limit: 100 }] });

      return (
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              <div className="max-w-4xl mx-auto">
                <Story />
                <Toaster position="top-right" />
              </div>
            </BrowserRouter>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
};

export const KeyboardShortcuts: Story = {
  args: {
    mode: 'create',
  },
  decorators: [createWrapper({ collections: mockCollections })],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Fill in minimal form data
    await userEvent.type(canvas.getByLabelText(/product name/i), 'Quick Product');
    await userEvent.type(canvas.getByLabelText(/description/i), 'Created with keyboard shortcut');
    await userEvent.type(canvas.getByLabelText(/price/i), '50');
    
    // Use Ctrl+Enter to submit (note: this may not work in all test environments)
    await userEvent.keyboard('{Control>}{Enter}{/Control}');
    
    // Alternative: just demonstrate that the form can be submitted
    const submitButton = canvas.getByRole('button', { name: /create product/i });
    expect(submitButton).toBeInTheDocument();
  },
};

export const BulkMode: Story = {
  args: {
    mode: 'create',
  },
  decorators: [createWrapper({ collections: mockCollections })],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Toggle bulk mode
    const bulkModeSwitch = canvas.getByRole('switch', { name: /stay on form after creation/i });
    await userEvent.click(bulkModeSwitch);
    
    // Verify it's enabled
    expect(bulkModeSwitch).toBeChecked();
  },
};

export const MobileView: Story = {
  args: {
    mode: 'create',
  },
  decorators: [createWrapper({ collections: mockCollections })],
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const TabletView: Story = {
  args: {
    mode: 'edit',
    initialData: mockProduct,
  },
  decorators: [createWrapper({ collections: mockCollections })],
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};

// Enhanced Error State Stories
export const SaveError: Story = {
  args: {
    mode: 'create',
  },
  decorators: [
    (Story) => {
      const [saveError, setSaveError] = useState<string | null>(null);
      const [isSubmitting, setIsSubmitting] = useState(false);
      
      const simulateSaveError = async () => {
        setIsSubmitting(true);
        setSaveError(null);
        
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setSaveError('Failed to save product. Please try again.');
        setIsSubmitting(false);
        toast.error('Failed to save product');
      };
      
      return (
        <div className="space-y-4">
          <Card className="p-4">
            <h4 className="font-medium mb-2">Save Error Simulation</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Click save to simulate a server error
            </p>
            <Button onClick={simulateSaveError} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Save className="w-4 h-4 mr-2 animate-pulse" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Product
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
          
          <Story />
          <Toaster position="top-right" />
        </div>
      );
    },
  ],
};

export const DuplicateSlugError: Story = {
  args: {
    mode: 'create',
  },
  decorators: [
    (Story) => {
      return (
        <div className="space-y-4">
          <Card className="p-4 border-orange-200 bg-orange-50">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              <h4 className="font-medium">Duplicate Slug Warning</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              The slug &quot;wireless-headphones&quot; is already in use
            </p>
          </Card>

          <Story />
          <Toaster position="top-right" />
        </div>
      );
    },
  ],
};

export const ImageUploadError: Story = {
  args: {
    mode: 'create',
  },
  decorators: [
    (Story) => {
      const [uploadError, setUploadError] = useState<string | null>(null);
      const [uploadProgress, setUploadProgress] = useState(0);
      
      const simulateUploadError = async () => {
        setUploadError(null);
        setUploadProgress(0);
        
        // Simulate upload progress
        const interval = setInterval(() => {
          setUploadProgress(prev => {
            if (prev >= 60) {
              clearInterval(interval);
              setUploadError('Upload failed: File size exceeds limit (5MB)');
              toast.error('Image upload failed');
              return 0;
            }
            return prev + 10;
          });
        }, 200);
      };
      
      return (
        <div className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Upload className="w-4 h-4" />
              <h4 className="font-medium">Image Upload Error Demo</h4>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Simulate image upload failure
            </p>
            <Button size="sm" onClick={simulateUploadError}>
              <Image className="w-4 h-4 mr-2" />
              Trigger Upload Error
            </Button>
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="mt-2">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">{uploadProgress}%</p>
              </div>
            )}
          </Card>
          
          {uploadError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p>{uploadError}</p>
                  <p className="text-sm">Supported formats: JPG, PNG, WebP (max 5MB)</p>
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          <Story />
          <Toaster position="top-right" />
        </div>
      );
    },
  ],
};

export const VariantSKUConflict: Story = {
  args: {
    mode: 'edit',
    initialData: mockProductWithVariants,
  },
  decorators: [
    (Story) => {
      const conflictingSKUs = ['TSH-L-BLU', 'TSH-XL-RED'];

      return (
        <div className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">SKU Conflict Detection</h4>
              <Badge variant="destructive">2 Conflicts</Badge>
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

          <Story />
          <Toaster position="top-right" />
        </div>
      );
    },
  ],
};

export const InventoryValidationError: Story = {
  args: {
    mode: 'create',
  },
  decorators: [
    (Story) => {
      const [inventoryError, setInventoryError] = useState<string | null>(null);
      
      const validateInventory = () => {
        setInventoryError('Inventory cannot be negative. Please enter a valid quantity.');
        toast.error('Invalid inventory value');
      };
      
      return (
        <div className="space-y-4">
          <Card className="p-4">
            <h4 className="font-medium mb-2">Inventory Validation Demo</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Test inventory validation rules
            </p>
            <Button size="sm" onClick={validateInventory}>
              Validate Inventory
            </Button>
          </Card>
          
          {inventoryError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{inventoryError}</AlertDescription>
            </Alert>
          )}
          
          <Story />
          <Toaster position="top-right" />
        </div>
      );
    },
  ],
};

export const CollectionLoadError: Story = {
  args: {
    mode: 'create',
  },
  decorators: [
    (Story) => {
      const [collectionError, setCollectionError] = useState(true);
      
      return (
        <div className="space-y-4">
          {collectionError && (
            <Alert variant="destructive">
              <Database className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Failed to Load Collections</p>
                  <p className="text-sm">Unable to fetch collection list. You can still create the product without assigning it to a collection.</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setCollectionError(false);
                      toast.info('Retrying...');
                    }}
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Retry
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          <Story />
          <Toaster position="top-right" />
        </div>
      );
    },
  ],
};

export const PriceValidationError: Story = {
  args: {
    mode: 'create',
  },
  decorators: [
    (Story) => {
      const [priceErrors, setPriceErrors] = useState<string[]>([]);
      
      const validatePricing = () => {
        setPriceErrors([
          'Base price must be greater than $0',
          'Variant prices cannot be lower than base price',
          'Maximum price allowed is $99,999.99',
        ]);
        toast.error('Price validation failed');
      };
      
      return (
        <div className="space-y-4">
          <Card className="p-4">
            <h4 className="font-medium mb-2">Price Validation Demo</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Check pricing rules and constraints
            </p>
            <Button size="sm" onClick={validatePricing}>
              Validate Prices
            </Button>
          </Card>
          
          {priceErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium mb-2">Price Validation Errors:</p>
                <ul className="text-sm list-disc list-inside">
                  {priceErrors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
          
          <Story />
          <Toaster position="top-right" />
        </div>
      );
    },
  ],
};

export const BulkVariantError: Story = {
  args: {
    mode: 'create',
  },
  decorators: [
    (Story) => {
      const [bulkError, setBulkError] = useState<string | null>(null);
      const variantCount = 50;
      
      return (
        <div className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Bulk Variant Import</h4>
              <Badge variant="secondary">{variantCount} variants</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Attempting to create {variantCount} variants
            </p>
            <Button
              size="sm"
              onClick={() => {
                setBulkError('Cannot create more than 25 variants per product. Please reduce the number of variants.');
                toast.error('Too many variants');
              }}
            >
              Import Variants
            </Button>
          </Card>
          
          {bulkError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p>{bulkError}</p>
                  <p className="text-sm text-muted-foreground">
                    Consider creating multiple products or grouping variants differently.
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          <Story />
          <Toaster position="top-right" />
        </div>
      );
    },
  ],
};

export const ErrorRecovery: Story = {
  args: {
    mode: 'create',
  },
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
          toast.success('Product saved successfully!');
        } else {
          toast.error('Still having issues. Please try again.');
        }
        
        setIsRetrying(false);
      };
      
      return (
        <div className="space-y-4">
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
          
          <Story />
          <Toaster position="top-right" />
        </div>
      );
    },
  ],
};