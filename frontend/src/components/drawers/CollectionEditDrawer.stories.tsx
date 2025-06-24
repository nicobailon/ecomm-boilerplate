import type { Meta, StoryObj } from '@storybook/react-vite';
import { CollectionEditDrawer } from './CollectionEditDrawer';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { trpc } from '@/lib/trpc';
import { createTRPCClient } from '@/lib/trpc-client';
import { fn } from '@storybook/test';
import { within, userEvent, expect, waitFor } from '@storybook/test';
import type { RouterOutputs } from '@/lib/trpc';
import { Toaster } from 'sonner';
import { useState, useEffect, useMemo } from 'react';
import { Skeleton } from '@/components/ui/Skeleton';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader2, Package2, RefreshCw } from 'lucide-react';

type Collection = RouterOutputs['collection']['getById'];

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: Infinity },
  },
});

const mockCollection: Collection = {
  _id: '1',
  name: 'Summer Collection',
  slug: 'summer-collection',
  description: 'Bright and breezy styles perfect for warm weather.',
  isPublic: true,
  products: [
    { 
      _id: 'prod1' as any,
      name: 'Summer Dress',
      description: 'Light and airy summer dress',
      price: 59.99,
      image: 'https://example.com/dress.jpg',
      category: 'clothing',
      isFeatured: false,
      collectionId: '1',
      slug: 'summer-dress',
    },
    { 
      _id: 'prod2' as any,
      name: 'Beach Sandals',
      description: 'Comfortable beach sandals',
      price: 29.99,
      image: 'https://example.com/sandals.jpg',
      category: 'footwear',
      isFeatured: false,
      collectionId: '1',
      slug: 'beach-sandals',
    },
    { 
      _id: 'prod3' as any,
      name: 'Sun Hat',
      description: 'Wide-brimmed sun hat',
      price: 19.99,
      image: 'https://example.com/hat.jpg',
      category: 'accessories',
      isFeatured: false,
      collectionId: '1',
      slug: 'sun-hat',
    },
  ],
  owner: {
    _id: 'user1',
    name: 'Test User',
    email: 'test@example.com',
  } as any,
  createdAt: new Date(),
  updatedAt: new Date(),
} as any;

const meta = {
  title: 'Drawers/CollectionEditDrawer',
  component: CollectionEditDrawer,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <div className="min-h-screen bg-background">
            <Story />
            <Toaster position="top-right" />
          </div>
        </QueryClientProvider>
      </trpc.Provider>
    ),
  ],
  args: {
    onClose: fn(),
  },
} satisfies Meta<typeof CollectionEditDrawer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CreateMode: Story = {
  args: {
    isOpen: true,
    collection: null,
  },
};

export const EditMode: Story = {
  args: {
    isOpen: true,
    collection: mockCollection,
  },
};

export const EditModeEmpty: Story = {
  args: {
    isOpen: true,
    collection: {
      ...mockCollection,
      products: [],
    } as unknown as Collection,
  },
};

export const EditModePrivate: Story = {
  args: {
    isOpen: true,
    collection: {
      ...mockCollection,
      isPublic: false,
    } as unknown as Collection,
  },
};

export const CreateWithValidation: Story = {
  args: {
    isOpen: true,
    collection: null,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    await waitFor(() => {
      expect(canvas.getByLabelText('Name')).toBeInTheDocument();
    });
    
    // Try to submit without filling required fields
    const submitButton = canvas.getByRole('button', { name: 'Continue to Product Selection' });
    await userEvent.click(submitButton);
    
    // Check for validation error
    await waitFor(() => {
      expect(canvas.getByText('Name is required')).toBeInTheDocument();
    });
  },
};

export const CreateFlow: Story = {
  args: {
    isOpen: true,
    collection: null,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    await waitFor(() => {
      expect(canvas.getByLabelText('Name')).toBeInTheDocument();
    });
    
    // Fill in collection details
    const nameInput = canvas.getByLabelText('Name');
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'New Test Collection');
    
    const descInput = canvas.getByLabelText('Description');
    await userEvent.clear(descInput);
    await userEvent.type(descInput, 'This is a test collection description');
    
    // Continue to product selection
    const continueButton = canvas.getByRole('button', { name: 'Continue to Product Selection' });
    await userEvent.click(continueButton);
    
    // Should show product selection step
    await waitFor(() => {
      expect(canvas.getByText('Select products to include in this collection')).toBeInTheDocument();
    });
  },
};

export const EditFlow: Story = {
  args: {
    isOpen: true,
    collection: mockCollection,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    await waitFor(() => {
      expect(canvas.getByLabelText('Name')).toBeInTheDocument();
    });
    
    // Check that form is pre-filled
    const nameInput = canvas.getByLabelText('Name');
    expect((nameInput as HTMLInputElement).value).toBe('Summer Collection');
    
    // Click manage products button
    const manageButton = canvas.getByRole('button', { name: /Manage Products/ });
    await userEvent.click(manageButton);
    
    // Should show product selection step
    await waitFor(() => {
      expect(canvas.getByText('Select products to include in this collection')).toBeInTheDocument();
    });
  },
};

export const NavigationFlow: Story = {
  args: {
    isOpen: true,
    collection: null,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    await waitFor(() => {
      expect(canvas.getByLabelText('Name')).toBeInTheDocument();
    });
    
    // Fill form and continue
    const nameInput = canvas.getByLabelText('Name');
    await userEvent.type(nameInput, 'Test Collection');
    
    const continueButton = canvas.getByRole('button', { name: 'Continue to Product Selection' });
    await userEvent.click(continueButton);
    
    // Wait for product selection
    await waitFor(() => {
      expect(canvas.getByText('Select products to include in this collection')).toBeInTheDocument();
    });
    
    // Go back to details
    const backButton = canvas.getByRole('button', { name: 'Back' });
    await userEvent.click(backButton);
    
    // Should be back at details
    await waitFor(() => {
      expect(canvas.getByLabelText('Name')).toBeInTheDocument();
    });
  },
};

export const LoadingState: Story = {
  args: {
    isOpen: true,
    collection: null,
  },
  decorators: [
    (Story) => {
      const slowQueryClient = new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: Infinity,
            retry: false,
          },
          mutations: {
            retry: false,
          },
        },
      });
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={slowQueryClient}>
          <QueryClientProvider client={slowQueryClient}>
            <div className="min-h-screen bg-background">
              <Story />
              <Toaster position="top-right" />
            </div>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    await waitFor(() => {
      expect(canvas.getByLabelText('Name')).toBeInTheDocument();
    });
    
    // Fill form
    const nameInput = canvas.getByLabelText('Name');
    await userEvent.type(nameInput, 'Test Collection');
    
    const continueButton = canvas.getByRole('button', { name: 'Continue to Product Selection' });
    await userEvent.click(continueButton);
    
    // Move to products and try to save
    await waitFor(() => {
      expect(canvas.getByText('Create Collection')).toBeInTheDocument();
    });
    
    const createButton = canvas.getByRole('button', { name: 'Create Collection' });
    await userEvent.click(createButton);
    
    // Should show loading state
    await waitFor(() => {
      expect(canvas.getByText('Saving...')).toBeInTheDocument();
    });
  },
};

export const MobileView: Story = {
  args: {
    isOpen: true,
    collection: mockCollection,
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const TabletView: Story = {
  args: {
    isOpen: true,
    collection: mockCollection,
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};

export const LongContent: Story = {
  args: {
    isOpen: true,
    collection: {
      ...mockCollection,
      name: 'This Is A Very Long Collection Name That Might Need Special Handling In The UI',
      description: 'This is an extremely long description that goes on and on and on. It contains many details about the collection and its purpose, including information about the types of products it contains, the target audience, seasonal considerations, and much more. This helps test how the drawer handles lengthy content and whether it provides appropriate scrolling behavior.',
      products: Array.from({ length: 20 }, (_, i) => ({
        _id: `prod${i}`,
        name: `Product ${i + 1}`,
        description: `Description for product ${i + 1}`,
        price: Math.floor(Math.random() * 100) + 10,
        image: `https://example.com/product${i}.jpg`,
        category: 'general',
        isFeatured: false,
        collectionId: '1',
        slug: `product-${i + 1}`,
      })) as unknown as Collection['products'],
    } as unknown as Collection,
  },
};

export const WithStringProductIds: Story = {
  args: {
    isOpen: true,
    collection: {
      ...mockCollection,
      products: ['prod1', 'prod2', 'prod3'] as unknown as Collection['products'],
    } as Collection,
  },
};

export const Closed: Story = {
  args: {
    isOpen: false,
    collection: null,
  },
};

export const PublicToggle: Story = {
  args: {
    isOpen: true,
    collection: mockCollection,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    await waitFor(() => {
      expect(canvas.getByLabelText('Make this collection public')).toBeInTheDocument();
    });
    
    // Toggle public checkbox
    const publicCheckbox = canvas.getByLabelText('Make this collection public');
    await userEvent.click(publicCheckbox);
    
    // Verify it's unchecked
    expect(publicCheckbox).not.toBeChecked();
    
    // Toggle back
    await userEvent.click(publicCheckbox);
    
    // Verify it's checked again
    expect(publicCheckbox).toBeChecked();
  },
};

export const CompleteCreateWorkflow: Story = {
  args: {
    isOpen: true,
    collection: null,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Step 1: Fill in collection details
    await waitFor(() => {
      expect(canvas.getByLabelText('Name')).toBeInTheDocument();
    });
    
    const nameInput = canvas.getByLabelText('Name');
    await userEvent.type(nameInput, 'Spring Fashion Collection');
    
    const descInput = canvas.getByLabelText('Description');
    await userEvent.type(descInput, 'Fresh styles for the new season featuring vibrant colors and comfortable fabrics');
    
    // Make it public
    const publicCheckbox = canvas.getByLabelText('Make this collection public');
    await userEvent.click(publicCheckbox);
    expect(publicCheckbox).toBeChecked();
    
    // Continue to product selection
    const continueButton = canvas.getByRole('button', { name: 'Continue to Product Selection' });
    await userEvent.click(continueButton);
    
    // Step 2: Select products
    await waitFor(() => {
      expect(canvas.getByText('Select products to include in this collection')).toBeInTheDocument();
    });
    
    // Search for products
    const searchInput = canvas.getByPlaceholderText(/search products/i);
    await userEvent.type(searchInput, 'dress');
    
    // Select some products (simulate)
    await waitFor(() => {
      const checkboxes = canvas.getAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThan(0);
    });
    
    // Step 3: Save collection
    const createButton = canvas.getByRole('button', { name: 'Create Collection' });
    await userEvent.click(createButton);
    
    // Should show saving state
    await waitFor(() => {
      expect(canvas.getByText('Saving...')).toBeInTheDocument();
    });
  },
};

export const CompleteEditWorkflow: Story = {
  args: {
    isOpen: true,
    collection: mockCollection,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Step 1: Edit collection details
    await waitFor(() => {
      const nameInput = canvas.getByLabelText('Name');
      expect((nameInput as HTMLInputElement).value).toBe('Summer Collection');
    });
    
    // Update name
    const nameInput = canvas.getByLabelText('Name');
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Summer Sale Collection');
    
    // Update description
    const descInput = canvas.getByLabelText('Description');
    await userEvent.clear(descInput);
    await userEvent.type(descInput, 'Amazing summer deals on all your favorite items!');
    
    // Step 2: Manage products
    const manageButton = canvas.getByRole('button', { name: /Manage Products/ });
    await userEvent.click(manageButton);
    
    await waitFor(() => {
      expect(canvas.getByText('Select products to include in this collection')).toBeInTheDocument();
    });
    
    // Remove a product
    const checkboxes = canvas.getAllByRole('checkbox');
    if (checkboxes.length > 1) {
      await userEvent.click(checkboxes[1]); // Uncheck first product
    }
    
    // Step 3: Save changes
    const saveButton = canvas.getByRole('button', { name: 'Save Changes' });
    await userEvent.click(saveButton);
    
    // Should show saving state
    await waitFor(() => {
      expect(canvas.getByText('Saving...')).toBeInTheDocument();
    });
  },
};

export const KeyboardNavigation: Story = {
  args: {
    isOpen: true,
    collection: null,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    await waitFor(() => {
      expect(canvas.getByLabelText('Name')).toBeInTheDocument();
    });
    
    // Focus should be on first input
    const nameInput = canvas.getByLabelText('Name');
    await userEvent.click(nameInput);
    expect(document.activeElement).toBe(nameInput);
    
    // Tab to description
    await userEvent.tab();
    const descInput = canvas.getByLabelText('Description');
    expect(document.activeElement).toBe(descInput);
    
    // Tab to public checkbox
    await userEvent.tab();
    const publicCheckbox = canvas.getByLabelText('Make this collection public');
    expect(document.activeElement).toBe(publicCheckbox);
    
    // Space to toggle
    await userEvent.keyboard(' ');
    expect(publicCheckbox).toBeChecked();
    
    // Tab to continue button
    await userEvent.tab();
    const continueButton = canvas.getByRole('button', { name: 'Continue to Product Selection' });
    expect(document.activeElement).toBe(continueButton);
    
    // Escape to close drawer
    await userEvent.keyboard('{Escape}');
  },
};

export const FocusManagement: Story = {
  args: {
    isOpen: true,
    collection: mockCollection,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Wait for drawer to open
    await waitFor(() => {
      expect(canvas.getByRole('dialog')).toBeInTheDocument();
    });
    
    // Focus should be trapped within drawer
    const drawer = canvas.getByRole('dialog');
    expect(drawer).toBeInTheDocument();
    
    // Close button should be focusable
    const closeButton = canvas.getByRole('button', { name: /close/i });
    expect(closeButton).toBeInTheDocument();
    
    // Tab through all focusable elements
    const focusableElements = drawer.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    expect(focusableElements.length).toBeGreaterThan(0);
  },
};

export const AccessibilityAnnouncements: Story = {
  args: {
    isOpen: true,
    collection: null,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Submit empty form
    await waitFor(() => {
      expect(canvas.getByRole('button', { name: 'Continue to Product Selection' })).toBeInTheDocument();
    });
    
    const continueButton = canvas.getByRole('button', { name: 'Continue to Product Selection' });
    await userEvent.click(continueButton);
    
    // Error should be announced
    await waitFor(() => {
      const errorMessage = canvas.getByText('Name is required');
      expect(errorMessage).toBeInTheDocument();
      // Check if error has proper ARIA attributes
      const errorContainer = errorMessage.closest('[role="alert"]');
      expect(errorContainer).toBeInTheDocument();
    });
    
    // Fill name and continue
    const nameInput = canvas.getByLabelText('Name');
    await userEvent.type(nameInput, 'Test Collection');
    await userEvent.click(continueButton);
    
    // Step change should be announced
    await waitFor(() => {
      expect(canvas.getByText('Select products to include in this collection')).toBeInTheDocument();
    });
  },
};

// Enhanced Loading State Stories
export const InitialLoadingState: Story = {
  args: {
    isOpen: true,
    collection: null,
  },
  decorators: [
    () => (
      <div className="min-h-screen bg-background">
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
          <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-background shadow-xl z-50">
            <div className="flex h-full flex-col">
              {/* Header Skeleton */}
              <div className="flex items-center justify-between border-b px-6 py-4">
                <Skeleton className="h-7 w-48" />
                <Skeleton className="h-10 w-10 rounded-md" />
              </div>
              
              {/* Form Loading Skeleton */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                  {/* Name Field */}
                  <div>
                    <Skeleton className="h-4 w-12 mb-2" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  
                  {/* Description Field */}
                  <div>
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                  
                  {/* Public Toggle */}
                  <div className="flex items-center space-x-3">
                    <Skeleton className="h-6 w-6 rounded" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                  
                  {/* Products Section Skeleton */}
                  <div className="pt-4">
                    <Skeleton className="h-5 w-32 mb-4" />
                    <div className="grid grid-cols-2 gap-3">
                      {[1, 2, 3, 4].map(i => (
                        <Skeleton key={i} className="h-24 rounded-lg" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Footer Skeleton */}
              <div className="border-t px-6 py-4">
                <div className="flex justify-end gap-3">
                  <Skeleton className="h-10 w-20" />
                  <Skeleton className="h-10 w-32" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
  ],
  render: () => <div />,
};

export const LazyLoadingContent: Story = {
  args: {
    isOpen: true,
    collection: null,
  },
  render: () => {
    const [loadingSteps, setLoadingSteps] = useState({
      drawer: true,
      form: true,
      products: true,
    });
    
    useEffect(() => {
      // Simulate drawer opening
      setTimeout(() => {
        setLoadingSteps(prev => ({ ...prev, drawer: false }));
      }, 500);
      
      // Simulate form loading
      setTimeout(() => {
        setLoadingSteps(prev => ({ ...prev, form: false }));
      }, 1200);
      
      // Simulate products loading
      setTimeout(() => {
        setLoadingSteps(prev => ({ ...prev, products: false }));
      }, 2000);
    }, []);
    
    if (loadingSteps.drawer) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Opening drawer...</span>
            </div>
          </Card>
        </div>
      );
    }
    
    return (
      <div className="min-h-screen bg-background">
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
          <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-background shadow-xl z-50 animate-in slide-in-from-right duration-300">
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b px-6 py-4">
                <h2 className="text-xl font-semibold">Create Collection</h2>
                <Button variant="ghost" size="icon">
                  <span className="sr-only">Close</span>
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                {loadingSteps.form ? (
                  <div className="space-y-6">
                    <Card className="p-4">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm text-muted-foreground">Loading form...</span>
                      </div>
                    </Card>
                    <div className="space-y-4">
                      {[1, 2, 3].map(i => (
                        <Skeleton key={i} className="h-16 w-full" />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <label className="text-sm font-medium">Name</label>
                      <input className="mt-1 w-full rounded-md border px-3 py-2" placeholder="Collection name" />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Description</label>
                      <textarea className="mt-1 w-full rounded-md border px-3 py-2" rows={4} placeholder="Collection description" />
                    </div>
                    
                    {loadingSteps.products ? (
                      <div>
                        <h3 className="text-sm font-medium mb-3">Products</h3>
                        <Card className="p-4">
                          <div className="flex items-center gap-2">
                            <Package2 className="w-4 h-4 animate-pulse" />
                            <span className="text-sm text-muted-foreground">Loading products...</span>
                          </div>
                        </Card>
                      </div>
                    ) : (
                      <div>
                        <h3 className="text-sm font-medium mb-3">Products</h3>
                        <p className="text-sm text-muted-foreground">No products selected yet.</p>
                        <Button variant="outline" className="mt-2">
                          Select Products
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
};

export const ProductsLoadingState: Story = {
  args: {
    isOpen: true,
    collection: mockCollection,
  },
  render: () => {
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [products, setProducts] = useState<typeof mockCollection.products>([]);
    
    useEffect(() => {
      // Simulate products loading
      const timer = setTimeout(() => {
        setProducts(mockCollection.products);
        setLoadingProducts(false);
      }, 2000);
      
      return () => clearTimeout(timer);
    }, []);
    
    return (
      <CollectionEditDrawer
        isOpen={true}
        collection={{
          ...mockCollection,
          products: loadingProducts ? [] : products,
        } as Collection}
        onClose={() => { console.log('Close drawer'); }}
      />
    );
  },
  decorators: [
    (Story) => {
      const [showProductsLoading, setShowProductsLoading] = useState(false);
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <div className="min-h-screen bg-background">
              <Card className="mb-4 p-4">
                <h4 className="font-medium mb-2">Products Loading Demo</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Click &quot;Manage Products&quot; to see loading state
                </p>
                <Button
                  size="sm"
                  onClick={() => setShowProductsLoading(true)}
                  disabled={showProductsLoading}
                >
                  {showProductsLoading ? 'Loading products...' : 'Trigger Loading'}
                </Button>
              </Card>
              <Story />
              <Toaster position="top-right" />
            </div>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
};

export const ProgressiveFormLoading: Story = {
  args: {
    isOpen: true,
    collection: null,
  },
  render: () => {
    const [loadedFields, setLoadedFields] = useState<string[]>([]);
    const fields = useMemo(() => ['name', 'description', 'public', 'products'], []);
    
    useEffect(() => {
      fields.forEach((field, index) => {
        setTimeout(() => {
          setLoadedFields(prev => [...prev, field]);
        }, 500 + index * 400);
      });
    }, [fields]);
    
    const isLoaded = (field: string) => loadedFields.includes(field);
    
    return (
      <div className="min-h-screen bg-background">
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
          <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-background shadow-xl z-50">
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b px-6 py-4">
                <h2 className="text-xl font-semibold">Create Collection</h2>
                <Button variant="ghost" size="icon">
                  <span className="sr-only">Close</span>
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                  {/* Name Field */}
                  <div className={`transition-opacity duration-500 ${isLoaded('name') ? 'opacity-100' : 'opacity-0'}`}>
                    {isLoaded('name') ? (
                      <div>
                        <label className="text-sm font-medium">Name</label>
                        <input className="mt-1 w-full rounded-md border px-3 py-2" placeholder="Collection name" />
                      </div>
                    ) : (
                      <div>
                        <Skeleton className="h-4 w-12 mb-2" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    )}
                  </div>
                  
                  {/* Description Field */}
                  <div className={`transition-opacity duration-500 ${isLoaded('description') ? 'opacity-100' : 'opacity-0'}`}>
                    {isLoaded('description') ? (
                      <div>
                        <label className="text-sm font-medium">Description</label>
                        <textarea className="mt-1 w-full rounded-md border px-3 py-2" rows={4} placeholder="Collection description" />
                      </div>
                    ) : (
                      <div>
                        <Skeleton className="h-4 w-20 mb-2" />
                        <Skeleton className="h-24 w-full" />
                      </div>
                    )}
                  </div>
                  
                  {/* Public Toggle */}
                  <div className={`transition-opacity duration-500 ${isLoaded('public') ? 'opacity-100' : 'opacity-0'}`}>
                    {isLoaded('public') ? (
                      <div className="flex items-center space-x-3">
                        <input type="checkbox" className="h-4 w-4" />
                        <label className="text-sm">Make this collection public</label>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-3">
                        <Skeleton className="h-4 w-4 rounded" />
                        <Skeleton className="h-4 w-40" />
                      </div>
                    )}
                  </div>
                  
                  {/* Products Preview */}
                  <div className={`transition-opacity duration-500 ${isLoaded('products') ? 'opacity-100' : 'opacity-0'}`}>
                    {isLoaded('products') ? (
                      <div>
                        <h3 className="text-sm font-medium mb-3">Products</h3>
                        <p className="text-sm text-muted-foreground">No products selected yet.</p>
                        <Button variant="outline" className="mt-2">Select Products</Button>
                      </div>
                    ) : (
                      <div>
                        <Skeleton className="h-5 w-20 mb-3" />
                        <Skeleton className="h-16 w-full" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="border-t px-6 py-4">
                <div className="flex justify-end gap-3">
                  <Button variant="outline">Cancel</Button>
                  <Button disabled={loadedFields.length < fields.length}>
                    {loadedFields.length < fields.length ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      'Continue to Product Selection'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
};

export const SavingState: Story = {
  args: {
    isOpen: true,
    collection: mockCollection,
  },
  render: () => {
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    
    const handleSave = async () => {
      setSaving(true);
      
      // Simulate save operation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSaving(false);
      setSaved(true);
      
      // Reset after showing success
      setTimeout(() => setSaved(false), 2000);
    };
    
    return (
      <div className="min-h-screen bg-background">
        <Card className="mb-4 p-4">
          <h4 className="font-medium mb-2">Save State Demo</h4>
          <p className="text-sm text-muted-foreground mb-3">
            Click save to see the saving animation
          </p>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : saved ? (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Saved!
              </>
            ) : (
              'Save Collection'
            )}
          </Button>
        </Card>
        
        <CollectionEditDrawer
          isOpen={true}
          collection={mockCollection}
          onClose={() => { console.log('Close drawer'); }}
        />
      </div>
    );
  },
};

export const RefreshableData: Story = {
  args: {
    isOpen: true,
    collection: mockCollection,
  },
  render: () => {
    const [refreshing, setRefreshing] = useState(false);
    const [data, setData] = useState(mockCollection);
    const [lastRefreshed, setLastRefreshed] = useState(new Date());
    
    const refresh = async () => {
      setRefreshing(true);
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate updated data
      setData({
        ...data,
        products: [
          ...data.products,
          {
            _id: `prod${Date.now()}`,
            name: `New Product ${data.products.length + 1}`,
            description: 'Newly added product',
            price: Math.floor(Math.random() * 100) + 10,
            image: 'https://example.com/new.jpg',
            category: 'general',
            isFeatured: false,
            collectionId: '1',
            slug: `new-product-${data.products.length + 1}`,
          } as any,
        ],
      } as Collection);
      
      setLastRefreshed(new Date());
      setRefreshing(false);
    };
    
    return (
      <div className="min-h-screen bg-background">
        <Card className="mb-4 p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="font-medium">Collection Data</h4>
              <p className="text-xs text-muted-foreground">
                Last updated: {lastRefreshed.toLocaleTimeString()}
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={refresh}
              disabled={refreshing}
            >
              {refreshing ? (
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
          <p className="text-sm text-muted-foreground">
            {data.products.length} products in collection
          </p>
        </Card>
        
        <div className={refreshing ? 'opacity-50 pointer-events-none' : ''}>
          <CollectionEditDrawer
            isOpen={true}
            collection={data}
            onClose={() => { console.log('Close drawer'); }}
          />
        </div>
      </div>
    );
  },
};

export const ShimmerLoadingEffect: Story = {
  args: {
    isOpen: true,
    collection: null,
  },
  decorators: [
    () => (
      <div className="min-h-screen bg-background">
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
          <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-background shadow-xl z-50">
            <div className="flex h-full flex-col">
              {/* Header */}
              <div className="flex items-center justify-between border-b px-6 py-4">
                <h2 className="text-xl font-semibold">Create Collection</h2>
                <Button variant="ghost" size="icon">
                  <span className="sr-only">Close</span>
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>
              
              {/* Content with shimmer */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-6">
                  <div>
                    <div className="h-4 w-12 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer rounded mb-2" />
                    <div className="h-10 w-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer rounded" />
                  </div>
                  
                  <div>
                    <div className="h-4 w-20 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer rounded mb-2" />
                    <div className="h-24 w-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer rounded" />
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="h-6 w-6 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer rounded" />
                    <div className="h-4 w-40 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer rounded" />
                  </div>
                  
                  <div>
                    <div className="h-5 w-24 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer rounded mb-3" />
                    <div className="grid grid-cols-2 gap-3">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-24 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer rounded" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Footer */}
              <div className="border-t px-6 py-4">
                <div className="flex justify-end gap-3">
                  <div className="h-10 w-20 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer rounded" />
                  <div className="h-10 w-32 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer rounded" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <style>{`
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          .animate-shimmer {
            background-size: 200% 100%;
            animation: shimmer 1.5s infinite;
          }
        `}</style>
      </div>
    ),
  ],
  render: () => <div />,
};