import type { Meta, StoryObj } from '@storybook/react-vite';
import { CollectionForm } from './CollectionForm';
import { within, userEvent, expect, waitFor, fn } from '@storybook/test';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ProductSelector } from '@/components/product/ProductSelector';
import type { Product } from '@/types';
import { toast } from 'sonner';
import { Toaster } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { AlertCircle, CheckCircle, Info, RefreshCw, Save, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';

const mockProducts: Product[] = [
  {
    _id: 'prod1',
    name: 'Premium Headphones',
    description: 'Noise-cancelling wireless headphones',
    price: 299.99,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
    isFeatured: true,
    slug: 'premium-headphones',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'prod2',
    name: 'Leather Wallet',
    description: 'Genuine leather bifold wallet',
    price: 79.99,
    image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=500',
    isFeatured: false,
    slug: 'leather-wallet',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'prod3',
    name: 'Smart Watch',
    description: 'Fitness tracking smartwatch',
    price: 199.99,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500',
    isFeatured: true,
    slug: 'smart-watch',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const mockCollection = {
  _id: 'col1',
  name: 'Summer Collection 2024',
  description: 'Our curated selection of summer essentials',
  slug: 'summer-collection-2024',
  isPublic: true,
  products: [mockProducts[0]._id, mockProducts[2]._id],
  owner: 'user1',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Extended form with product selection and SEO
const ExtendedCollectionForm = ({ 
  mode, 
  initialData,
}: { 
  mode: 'create' | 'edit';
  initialData?: any;
}) => {
  const [selectedProducts, setSelectedProducts] = useState<string[]>(
    initialData?.products as string[] || [],
  );
  const [seoTitle, setSeoTitle] = useState(initialData?.name || '');
  const [seoDescription, setSeoDescription] = useState(initialData?.description || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const fullData = {
      ...data,
      products: selectedProducts,
      seoTitle,
      seoDescription,
      slug: slug || data.name.toLowerCase().replace(/\s+/g, '-'),
    };
    
    console.log('Submitting collection:', fullData);
    toast.success(mode === 'create' ? 'Collection created!' : 'Collection updated!');
    setIsSubmitting(false);
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="space-y-4">
          <CollectionForm
            mode={mode}
            initialData={initialData}
            onSubmit={handleSubmit}
            isLoading={isSubmitting}
          />
        </TabsContent>
        
        <TabsContent value="products" className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-4">Select Products</h3>
            <ProductSelector
              selectedProductIds={selectedProducts}
              onSelectionChange={setSelectedProducts}
            />
            <p className="text-sm text-muted-foreground mt-2">
              {selectedProducts.length} products selected
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="seo" className="space-y-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="seo-title">SEO Title</Label>
              <Input
                id="seo-title"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                placeholder="Enter SEO title (defaults to collection name)"
                maxLength={60}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {seoTitle.length}/60 characters
              </p>
            </div>
            
            <div>
              <Label htmlFor="seo-description">Meta Description</Label>
              <textarea
                id="seo-description"
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                placeholder="Enter meta description for search engines"
                className="w-full p-2 border rounded-md"
                rows={3}
                maxLength={160}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {seoDescription.length}/160 characters
              </p>
            </div>
            
            <div>
              <Label htmlFor="slug">URL Slug</Label>
              <div className="flex gap-2">
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="collection-url-slug"
                  pattern="[a-z0-9-]+"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSlug(generateSlug(String(seoTitle) || 'new-collection'))}
                >
                  Generate
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Preview: /collections/{slug || 'collection-url'}
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      <Toaster position="top-right" />
    </div>
  );
};

const meta = {
  title: 'Forms/CollectionForm',
  component: CollectionForm,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  args: {
    onSubmit: fn(),
  },
} satisfies Meta<typeof CollectionForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CreateMode: Story = {
  args: {
    mode: 'create',
  },
};

export const EditMode: Story = {
  args: {
    mode: 'edit',
    initialData: mockCollection as any,
  },
};

export const WithValidation: Story = {
  args: {
    mode: 'create',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Try to submit empty form
    const submitButton = canvas.getByRole('button', { name: /create collection/i });
    await userEvent.click(submitButton);
    
    // Should show validation error
    await waitFor(() => {
      expect(canvas.getByText('Collection name is required')).toBeInTheDocument();
    });
    
    // Fill in name
    const nameInput = canvas.getByPlaceholderText('Enter collection name');
    await userEvent.type(nameInput, 'My New Collection');
    
    // Error should disappear
    await waitFor(() => {
      expect(canvas.queryByText('Collection name is required')).not.toBeInTheDocument();
    });
  },
};

export const LongDescription: Story = {
  args: {
    mode: 'create',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    const descriptionTextarea = canvas.getByPlaceholderText(/enter collection description/i);
    const longText = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(20);
    
    await userEvent.type(descriptionTextarea, longText);
    
    // Should show validation error for exceeding max length
    await waitFor(() => {
      expect(canvas.getByText(/cannot exceed 500 characters/i)).toBeInTheDocument();
    });
  },
};

export const PublicToggle: Story = {
  args: {
    mode: 'create',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Toggle public switch
    const publicSwitch = canvas.getByRole('switch');
    await userEvent.click(publicSwitch);
    
    // Should be checked
    expect(publicSwitch).toHaveAttribute('aria-checked', 'true');
    
    // Toggle again
    await userEvent.click(publicSwitch);
    
    // Should be unchecked
    expect(publicSwitch).toHaveAttribute('aria-checked', 'false');
  },
};

export const LoadingState: Story = {
  args: {
    mode: 'create',
    isLoading: true,
  },
};

export const WithProductSelection: Story = {
  args: {
    mode: 'create',
  },
  decorators: [
    () => <ExtendedCollectionForm mode="create" />,
  ],
};

export const EditWithProducts: Story = {
  args: {
    mode: 'edit',
  },
  decorators: [
    () => <ExtendedCollectionForm mode="edit" initialData={mockCollection} />,
  ],
};

export const SEOFields: Story = {
  args: {
    mode: 'create',
  },
  decorators: [
    () => {
      return (
        <ExtendedCollectionForm mode="create" />
      );
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Click SEO tab
    const seoTab = canvas.getByRole('tab', { name: /seo/i });
    await userEvent.click(seoTab);
    
    // Fill SEO fields
    const seoTitle = canvas.getByLabelText(/seo title/i);
    await userEvent.type(seoTitle, 'Amazing Summer Collection - Best Deals 2024');
    
    const metaDescription = canvas.getByLabelText(/meta description/i);
    await userEvent.type(metaDescription, 'Discover our curated summer collection featuring the best products for the season. Free shipping on orders over $50.');
    
    // Generate slug
    const generateButton = canvas.getByRole('button', { name: /generate/i });
    await userEvent.click(generateButton);
    
    // Check slug was generated
    const slugInput = canvas.getByLabelText(/url slug/i);
    expect((slugInput as HTMLInputElement).value).toBe('amazing-summer-collection-best-deals-2024');
  },
};

export const ProductSelectionWorkflow: Story = {
  args: {
    mode: 'create',
  },
  decorators: [
    () => <ExtendedCollectionForm mode="create" />,
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Start on details tab and fill basic info
    const nameInput = canvas.getByPlaceholderText('Enter collection name');
    await userEvent.type(nameInput, 'Featured Products');
    
    const descriptionTextarea = canvas.getByPlaceholderText(/enter collection description/i);
    await userEvent.type(descriptionTextarea, 'Our hand-picked selection of best-selling items');
    
    // Switch to products tab
    const productsTab = canvas.getByRole('tab', { name: /products/i });
    await userEvent.click(productsTab);
    
    // Wait for products to load
    await waitFor(() => {
      expect(canvas.getByText('Premium Headphones')).toBeInTheDocument();
    });
    
    // Select products by clicking checkboxes
    const productCheckboxes = canvas.getAllByRole('checkbox');
    await userEvent.click(productCheckboxes[0]); // Select first product
    await userEvent.click(productCheckboxes[2]); // Select third product
    
    // Verify selection count updated
    await waitFor(() => {
      expect(canvas.getByText('2 products selected')).toBeInTheDocument();
    });
    
    // Go back to details tab
    const detailsTab = canvas.getByRole('tab', { name: /details/i });
    await userEvent.click(detailsTab);
    
    // Toggle public switch
    const publicSwitch = canvas.getByRole('switch');
    await userEvent.click(publicSwitch);
    expect(publicSwitch).toHaveAttribute('aria-checked', 'true');
  },
};

export const CompleteCollectionCreation: Story = {
  args: {
    mode: 'create',
  },
  decorators: [
    () => <ExtendedCollectionForm mode="create" />,
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Fill details
    const nameInput = canvas.getByPlaceholderText('Enter collection name');
    await userEvent.type(nameInput, 'Winter Essentials 2024');
    
    const descriptionTextarea = canvas.getByPlaceholderText(/enter collection description/i);
    await userEvent.type(descriptionTextarea, 'Stay warm and stylish with our winter collection');
    
    // Make it public
    const publicSwitch = canvas.getByRole('switch');
    await userEvent.click(publicSwitch);
    
    // Go to products tab
    const productsTab = canvas.getByRole('tab', { name: /products/i });
    await userEvent.click(productsTab);
    
    // Select all products
    await waitFor(() => {
      const selectAllCheckbox = canvas.getByRole('checkbox', { name: /select all/i });
      expect(selectAllCheckbox).toBeInTheDocument();
    });
    
    const selectAllCheckbox = canvas.getByRole('checkbox', { name: /select all/i });
    await userEvent.click(selectAllCheckbox);
    
    // Go to SEO tab
    const seoTab = canvas.getByRole('tab', { name: /seo/i });
    await userEvent.click(seoTab);
    
    // Fill SEO
    const seoTitle = canvas.getByLabelText(/seo title/i);
    await userEvent.type(seoTitle, 'Winter Essentials 2024 - Warm & Stylish Collection');
    
    const metaDescription = canvas.getByLabelText(/meta description/i);
    await userEvent.type(metaDescription, 'Shop our winter essentials collection. Premium quality winter wear.');
    
    // Generate slug
    const generateButton = canvas.getByRole('button', { name: /generate/i });
    await userEvent.click(generateButton);
    
    // Submit form
    const submitButton = canvas.getByRole('button', { name: /create collection/i });
    await userEvent.click(submitButton);
  },
};

export const KeyboardNavigation: Story = {
  args: {
    mode: 'create',
  },
  decorators: [
    () => <ExtendedCollectionForm mode="create" />,
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Start with name field
    const nameInput = canvas.getByPlaceholderText('Enter collection name');
    await userEvent.click(nameInput);
    
    // Tab through form fields
    await userEvent.tab(); // To description
    expect(document.activeElement).toBe(canvas.getByPlaceholderText(/enter collection description/i));
    
    await userEvent.tab(); // To public switch
    const publicSwitch = canvas.getByRole('switch');
    expect(document.activeElement).toBe(publicSwitch);
    
    // Space to toggle switch
    await userEvent.keyboard(' ');
    expect(publicSwitch).toHaveAttribute('aria-checked', 'true');
    
    // Tab to submit button
    await userEvent.tab();
    const submitButton = canvas.getByRole('button', { name: /create collection/i });
    expect(document.activeElement).toBe(submitButton);
    
    // Use arrow keys to navigate tabs
    const detailsTab = canvas.getByRole('tab', { name: /details/i });
    await userEvent.click(detailsTab);
    
    await userEvent.keyboard('{ArrowRight}'); // Move to products tab
    await waitFor(() => {
      const productsTab = canvas.getByRole('tab', { name: /products/i });
      expect(productsTab).toHaveAttribute('aria-selected', 'true');
    });
  },
};

export const FormInModal: Story = {
  args: {
    mode: 'create',
  },
  decorators: [
    () => {
      const [isOpen, setIsOpen] = useState(false);
      
      return (
        <div>
          <Button onClick={() => setIsOpen(true)}>
            Open Collection Form
          </Button>
          
          {isOpen && (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
              <div className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Create Collection</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                  >
                    ✕
                  </Button>
                </div>
                <CollectionForm
                  mode="create"
                  onSubmit={(data) => {
                    console.log('Submitted:', data);
                    toast.success('Collection created!');
                    setIsOpen(false);
                  }}
                />
              </div>
            </div>
          )}
          <Toaster position="top-right" />
        </div>
      );
    },
  ],
};

export const WithHelperText: Story = {
  args: {
    mode: 'create',
  },
  decorators: [
    () => {
      return (
        <div className="space-y-4">
          <Card className="p-4 bg-info/10 border-info/20">
            <div className="flex gap-2">
              <Info className="w-5 h-5 text-info flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold mb-1">About Collections</p>
                <p className="text-muted-foreground">
                  Collections help organize your products into categories that make sense for your customers.
                  Public collections are visible on your storefront.
                </p>
              </div>
            </div>
          </Card>
          <CollectionForm mode="create" onSubmit={fn()} />
        </div>
      );
    },
  ],
};

export const SuccessState: Story = {
  args: {
    mode: 'create',
  },
  decorators: [
    () => {
      const [submitted, setSubmitted] = useState(false);
      
      if (submitted) {
        return (
          <Card className="p-6 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Collection Created!</h3>
            <p className="text-muted-foreground mb-4">
              Your collection has been successfully created.
            </p>
            <Button onClick={() => setSubmitted(false)}>
              Create Another
            </Button>
          </Card>
        );
      }
      
      return (
        <CollectionForm
          mode="create"
          onSubmit={(data) => {
            console.log('Submitted:', data);
            setSubmitted(true);
          }}
        />
      );
    },
  ],
};

export const ErrorState: Story = {
  args: {
    mode: 'create',
  },
  decorators: [
    () => {
      const [error, setError] = useState<string | null>(null);
      
      return (
        <div className="space-y-4">
          {error && (
            <Card className="p-4 bg-destructive/10 border-destructive/20">
              <div className="flex gap-2">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold">Error</p>
                  <p className="text-muted-foreground">{error}</p>
                </div>
              </div>
            </Card>
          )}
          <CollectionForm
            mode="create"
            onSubmit={async () => {
              setError(null);
              // Simulate API error
              await new Promise(resolve => setTimeout(resolve, 1000));
              setError('A collection with this name already exists');
            }}
          />
        </div>
      );
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Fill form
    const nameInput = canvas.getByPlaceholderText('Enter collection name');
    await userEvent.type(nameInput, 'Existing Collection');
    
    // Submit
    const submitButton = canvas.getByRole('button', { name: /create collection/i });
    await userEvent.click(submitButton);
    
    // Wait for error
    await waitFor(() => {
      expect(canvas.getByText('A collection with this name already exists')).toBeInTheDocument();
    }, { timeout: 2000 });
  },
};

export const MobileView: Story = {
  args: {
    mode: 'create',
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const TabletView: Story = {
  args: {
    mode: 'create',
  },
  decorators: [
    () => <ExtendedCollectionForm mode="create" />,
  ],
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};

export const RTLSupport: Story = {
  args: {
    mode: 'create',
  },
  decorators: [
    (Story) => (
      <div dir="rtl" className="text-right">
        <Story />
      </div>
    ),
  ],
};

export const AccessibilityEnhanced: Story = {
  args: {
    mode: 'create',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Check all form fields have labels
    const nameInput = canvas.getByLabelText(/collection name/i);
    expect(nameInput).toBeInTheDocument();
    
    const descriptionTextarea = canvas.getByLabelText(/description/i);
    expect(descriptionTextarea).toBeInTheDocument();
    
    // Check switch has accessible label
    const publicSwitch = canvas.getByRole('switch');
    expect(publicSwitch).toHaveAccessibleName();
    
    // Submit empty form to trigger errors
    const submitButton = canvas.getByRole('button', { name: /create collection/i });
    await userEvent.click(submitButton);
    
    // Check error messages are announced
    await waitFor(() => {
      const errorMessage = canvas.getByText('Collection name is required');
      expect(errorMessage.closest('[role="alert"]')).toBeInTheDocument();
    });
  },
};

export const HighContrastMode: Story = {
  args: {
    mode: 'create',
  },
  decorators: [
    () => (
      <div className="space-y-8">
        <div>
          <h3 className="text-lg font-semibold mb-4">Normal Mode</h3>
          <ExtendedCollectionForm mode="create" />
        </div>
        <div style={{ filter: 'contrast(2) saturate(0)' }}>
          <h3 className="text-lg font-semibold mb-4">High Contrast Mode</h3>
          <ExtendedCollectionForm mode="create" />
        </div>
      </div>
    ),
  ],
};

export const ScreenReaderSupport: Story = {
  args: {
    mode: 'create',
  },
  decorators: [
    () => <ExtendedCollectionForm mode="create" />,
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Navigate to products tab
    const productsTab = canvas.getByRole('tab', { name: /products/i });
    await userEvent.click(productsTab);
    
    // Check product selection has proper ARIA labels
    await waitFor(() => {
      const productCheckboxes = canvas.getAllByRole('checkbox');
      productCheckboxes.forEach(checkbox => {
        expect(checkbox).toHaveAccessibleName();
      });
    });
    
    // Check tab panel associations
    const tabPanel = canvas.getByRole('tabpanel');
    expect(tabPanel).toHaveAttribute('aria-labelledby');
  },
};

// Enhanced Error State Stories
export const SaveError: Story = {
  args: {
    mode: 'create',
  },
  decorators: [
    () => {
      const [saveError, setSaveError] = useState<string | null>(null);
      const [isSubmitting, setIsSubmitting] = useState(false);
      
      const simulateSaveError = async () => {
        setIsSubmitting(true);
        setSaveError(null);
        
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setSaveError('Failed to save collection. Please try again.');
        setIsSubmitting(false);
        toast.error('Failed to save collection');
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
                  Save Collection
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
          
          <CollectionForm mode="create" onSubmit={fn()} />
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
    () => {
      const [_slugError, _setSlugError] = useState<string | null>(null);
      
      return (
        <div className="space-y-4">
          <Card className="p-4 border-orange-200 bg-orange-50">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              <h4 className="font-medium">Duplicate Slug Warning</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              The slug &quot;summer-collection-2024&quot; is already in use
            </p>
          </Card>
          
          <ExtendedCollectionForm 
            mode="create" 
            initialData={{ 
              name: 'Summer Collection 2024',
              slug: 'summer-collection-2024', 
            }}
          />
          <Toaster position="top-right" />
        </div>
      );
    },
  ],
};

export const ProductSelectionError: Story = {
  args: {
    mode: 'create',
  },
  decorators: [
    () => {
      const [productError, setProductError] = useState(false);
      
      return (
        <div className="space-y-4">
          <Card className="p-4">
            <h4 className="font-medium mb-2">Product Selection Error Demo</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Some products are no longer available
            </p>
            <Button
              size="sm"
              onClick={() => {
                setProductError(true);
                toast.error('Invalid product selection');
              }}
            >
              Validate Products
            </Button>
          </Card>
          
          {productError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p>2 selected products have issues:</p>
                  <ul className="text-sm list-disc list-inside">
                    <li>Product &quot;Premium Headphones&quot; - Out of stock</li>
                    <li>Product &quot;Smart Watch&quot; - Discontinued</li>
                  </ul>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setProductError(false)}
                  >
                    Remove Invalid Products
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          <ExtendedCollectionForm mode="create" />
          <Toaster position="top-right" />
        </div>
      );
    },
  ],
};

export const NameConflictError: Story = {
  args: {
    mode: 'create',
  },
  decorators: [
    () => {
      const [nameError, setNameError] = useState<string | null>(null);
      
      const checkNameAvailability = async (name: string) => {
        if (name.toLowerCase().includes('summer')) {
          setNameError('A collection with a similar name already exists: "Summer Sale 2024"');
          toast.error('Collection name conflict');
        } else {
          setNameError(null);
        }
      };
      
      return (
        <div className="space-y-4">
          {nameError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <span>{nameError}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setNameError(null)}
                  >
                    Dismiss
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          <CollectionForm 
            mode="create"
            onSubmit={async (data) => {
              await checkNameAvailability(data.name);
            }}
          />
          <Toaster position="top-right" />
        </div>
      );
    },
  ],
};

export const PublishError: Story = {
  args: {
    mode: 'create',
  },
  decorators: [
    () => {
      const [publishError, setPublishError] = useState(false);
      
      return (
        <div className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Collection Status</h4>
              <Badge variant="secondary">Draft</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              This collection cannot be published without products
            </p>
            <Button
              size="sm"
              onClick={() => {
                setPublishError(true);
                toast.error('Cannot publish empty collection');
              }}
            >
              Try to Publish
            </Button>
          </Card>
          
          {publishError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">Cannot Publish Collection</p>
                  <p className="text-sm">Please fix the following issues:</p>
                  <ul className="text-sm list-disc list-inside">
                    <li>Collection must have at least one product</li>
                    <li>Collection must have a description</li>
                    <li>SEO fields must be completed</li>
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          <CollectionForm 
            mode="edit"
            initialData={{
              name: 'Empty Collection',
              products: [],
              isPublic: false,
            } as any}
            onSubmit={fn()}
          />
          <Toaster position="top-right" />
        </div>
      );
    },
  ],
};

export const SEOValidationError: Story = {
  args: {
    mode: 'create',
  },
  decorators: [
    () => {
      const [seoErrors, setSeoErrors] = useState<string[]>([]);
      
      const validateSEO = () => {
        setSeoErrors([
          'SEO title is too long (max 60 characters)',
          'Meta description contains duplicate keywords',
          'URL slug contains invalid characters',
        ]);
        toast.error('SEO validation failed');
      };
      
      return (
        <div className="space-y-4">
          <Card className="p-4">
            <h4 className="font-medium mb-2">SEO Validation Demo</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Check SEO fields for issues
            </p>
            <Button size="sm" onClick={validateSEO}>
              Validate SEO
            </Button>
          </Card>
          
          {seoErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <p className="font-medium mb-2">SEO Issues Found:</p>
                <ul className="text-sm list-disc list-inside">
                  {seoErrors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
          
          <ExtendedCollectionForm mode="create" />
          <Toaster position="top-right" />
        </div>
      );
    },
  ],
};

export const BulkOperationError: Story = {
  args: {
    mode: 'create',
  },
  decorators: [
    () => {
      const [bulkError, setBulkError] = useState<string | null>(null);
      const [selectedCount] = useState(15);
      
      return (
        <div className="space-y-4">
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Bulk Product Assignment</h4>
              <Badge>{selectedCount} selected</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Attempting to add {selectedCount} products to collection
            </p>
            <Button
              size="sm"
              onClick={() => {
                setBulkError('Failed to add products: Some items are already in another exclusive collection');
                toast.error('Bulk operation failed');
              }}
            >
              Add All Products
            </Button>
          </Card>
          
          {bulkError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p>{bulkError}</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setBulkError(null)}>
                      Cancel
                    </Button>
                    <Button size="sm" variant="outline">
                      Add Available Only (12)
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          <ExtendedCollectionForm mode="create" />
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
    () => {
      const [error, setError] = useState<string | null>('Connection lost. Changes not saved.');
      const [isRetrying, setIsRetrying] = useState(false);
      const [retryCount, setRetryCount] = useState(0);
      
      const retry = async () => {
        setIsRetrying(true);
        setRetryCount(prev => prev + 1);
        
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        if (retryCount >= 1) {
          setError(null);
          toast.success('Collection saved successfully!');
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
          
          <CollectionForm 
            mode="create" 
            initialData={{
              name: 'My Collection',
              description: 'A test collection with error recovery',
            } as any}
            onSubmit={fn()} 
          />
          <Toaster position="top-right" />
        </div>
      );
    },
  ],
};