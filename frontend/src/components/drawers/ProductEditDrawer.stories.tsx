import type { Meta, StoryObj } from '@storybook/react-vite';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProductEditDrawer } from './ProductEditDrawer';
import { trpc } from '@/lib/trpc';
import { createTRPCClient } from '@/lib/trpc-client';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { within, userEvent, expect, waitFor } from '@storybook/test';
import { fn } from '@storybook/test';
import type { Product } from '@/types';
import { Toaster } from 'sonner';

const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const mockProductSimple: Product = {
  _id: 'prod1',
  name: 'Classic T-Shirt',
  description: 'A comfortable cotton t-shirt perfect for everyday wear',
  price: 29.99,
  image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500',
  collectionId: { _id: 'col1', name: 'Summer Collection', slug: 'summer-collection' },
  isFeatured: true,
  slug: 'classic-t-shirt',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockProductWithVariants: Product = {
  _id: 'prod2',
  name: 'Premium Hoodie',
  description: 'Warm and cozy hoodie with premium quality fabric',
  price: 79.99,
  image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500',
  collectionId: 'col2',
  isFeatured: false,
  slug: 'premium-hoodie',
  variants: [
    {
      variantId: 'var1',
      label: 'Small / Black',
      color: '#000000',
      price: 79.99,
      inventory: 10,
      reservedInventory: 2,
      images: ['https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500'],
      sku: 'HOOD-S-BLK',
    },
    {
      variantId: 'var2',
      label: 'Medium / Black',
      color: '#000000',
      price: 79.99,
      inventory: 15,
      reservedInventory: 0,
      images: ['https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500'],
      sku: 'HOOD-M-BLK',
    },
    {
      variantId: 'var3',
      label: 'Large / Gray',
      color: '#808080',
      price: 84.99,
      inventory: 8,
      reservedInventory: 1,
      images: ['https://images.unsplash.com/photo-1620799140188-3b2a02fd9a77?w=500'],
      sku: 'HOOD-L-GRY',
    },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockProductWithMedia: Product = {
  _id: 'prod3',
  name: 'Leather Jacket',
  description: 'Premium leather jacket with multiple detail shots',
  price: 299.99,
  image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500',
  collectionId: 'col3',
  isFeatured: true,
  slug: 'leather-jacket',
  mediaGallery: [
    {
      id: 'media1',
      url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500',
      type: 'image',
      title: 'Front view',
      order: 0,
      createdAt: new Date(),
    },
    {
      id: 'media2',
      url: 'https://images.unsplash.com/photo-1521223890158-f9f7c3d5d504?w=500',
      type: 'image',
      title: 'Back view',
      order: 1,
      createdAt: new Date(),
    },
    {
      id: 'media3',
      url: 'https://images.unsplash.com/photo-1611312449412-6cefac5dc3e4?w=500',
      type: 'image',
      title: 'Detail shot',
      order: 2,
      createdAt: new Date(),
    },
    {
      id: 'media4',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      type: 'video',
      title: 'Product video',
      order: 3,
      createdAt: new Date(),
    },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockProductOutOfStock: Product = {
  _id: 'prod4',
  name: 'Limited Edition Sneakers',
  description: 'Exclusive sneakers - currently out of stock',
  price: 199.99,
  image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500',
  isFeatured: false,
  slug: 'limited-sneakers',
  inventory: 0,
  lowStockThreshold: 5,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const meta = {
  title: 'Drawers/ProductEditDrawer',
  component: ProductEditDrawer,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => {
      const queryClient = createQueryClient();
      const [isOpen, setIsOpen] = useState(false);
      const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <div className="p-4">
              <Button onClick={() => {
                setSelectedProduct(mockProductSimple);
                setIsOpen(true);
              }}>
                Open Product Drawer
              </Button>
              <Story 
                isOpen={isOpen} 
                product={selectedProduct}
                onClose={() => setIsOpen(false)} 
              />
              <Toaster position="top-right" />
            </div>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
  args: {
    onClose: fn(),
  },
} satisfies Meta<typeof ProductEditDrawer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SimpleProduct: Story = {
  args: {
    isOpen: true,
    product: mockProductSimple,
  },
  decorators: [
    (Story) => {
      const queryClient = createQueryClient();
      const [isOpen, setIsOpen] = useState(true);
      
      // Mock the product query
      queryClient.setQueryData(['product.byId', mockProductSimple._id], mockProductSimple);
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <Story 
              isOpen={isOpen} 
              product={mockProductSimple}
              onClose={() => setIsOpen(false)} 
            />
            <Toaster position="top-right" />
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
};

export const ProductWithVariants: Story = {
  args: {
    isOpen: true,
    product: mockProductWithVariants,
  },
  decorators: [
    (Story) => {
      const queryClient = createQueryClient();
      const [isOpen, setIsOpen] = useState(true);
      
      // Mock the product query with full variant data
      queryClient.setQueryData(['product.byId', mockProductWithVariants._id], mockProductWithVariants);
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <Story 
              isOpen={isOpen} 
              product={mockProductWithVariants}
              onClose={() => setIsOpen(false)} 
            />
            <Toaster position="top-right" />
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
};

export const ProductWithMediaGallery: Story = {
  args: {
    isOpen: true,
    product: mockProductWithMedia,
  },
  decorators: [
    (Story) => {
      const queryClient = createQueryClient();
      const [isOpen, setIsOpen] = useState(true);
      
      // Mock the product query with media gallery
      queryClient.setQueryData(['product.byId', mockProductWithMedia._id], mockProductWithMedia);
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <Story 
              isOpen={isOpen} 
              product={mockProductWithMedia}
              onClose={() => setIsOpen(false)} 
            />
            <Toaster position="top-right" />
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
};

export const LoadingState: Story = {
  args: {
    isOpen: true,
    product: mockProductSimple,
  },
  decorators: [
    (Story) => {
      const queryClient = createQueryClient();
      const [isOpen, setIsOpen] = useState(true);
      
      // Don't set query data to simulate loading
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <Story 
              isOpen={isOpen} 
              product={mockProductSimple}
              onClose={() => setIsOpen(false)} 
            />
            <Toaster position="top-right" />
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
};

export const QuickEditFlow: Story = {
  args: {
    isOpen: true,
    product: mockProductSimple,
  },
  decorators: [
    (Story) => {
      const queryClient = createQueryClient();
      const [isOpen, setIsOpen] = useState(true);
      
      queryClient.setQueryData(['product.byId', mockProductSimple._id], mockProductSimple);
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <Story 
              isOpen={isOpen} 
              product={mockProductSimple}
              onClose={() => setIsOpen(false)} 
            />
            <Toaster position="top-right" />
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    await waitFor(() => {
      expect(canvas.getByDisplayValue('Classic T-Shirt')).toBeInTheDocument();
    });
    
    // Quick edit: change price
    const priceInput = canvas.getByLabelText(/price/i);
    await userEvent.clear(priceInput);
    await userEvent.type(priceInput, '34.99');
    
    // Quick edit: toggle featured
    const featuredSwitch = canvas.getByRole('switch', { name: /featured/i });
    await userEvent.click(featuredSwitch);
  },
};

export const VariantManagement: Story = {
  args: {
    isOpen: true,
    product: mockProductWithVariants,
  },
  decorators: [
    (Story) => {
      const queryClient = createQueryClient();
      const [isOpen, setIsOpen] = useState(true);
      
      queryClient.setQueryData(['product.byId', mockProductWithVariants._id], mockProductWithVariants);
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <Story 
              isOpen={isOpen} 
              product={mockProductWithVariants}
              onClose={() => setIsOpen(false)} 
            />
            <Toaster position="top-right" />
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    await waitFor(() => {
      expect(canvas.getByText('Small / Black')).toBeInTheDocument();
    });
    
    // Check variant details are displayed
    expect(canvas.getByText('Medium / Black')).toBeInTheDocument();
    expect(canvas.getByText('Large / Gray')).toBeInTheDocument();
    
    // Look for variant management section
    const variantSection = canvas.getByText(/variants/i);
    expect(variantSection).toBeInTheDocument();
  },
};

export const ImageUploadInteraction: Story = {
  args: {
    isOpen: true,
    product: mockProductSimple,
  },
  decorators: [
    (Story) => {
      const queryClient = createQueryClient();
      const [isOpen, setIsOpen] = useState(true);
      
      queryClient.setQueryData(['product.byId', mockProductSimple._id], mockProductSimple);
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <div className="p-4">
              <div className="mb-4 p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">Image Upload Feature</h3>
                <p className="text-sm text-muted-foreground">
                  Click the upload button to add a new product image.
                  Note: Actual upload requires backend integration.
                </p>
              </div>
              <Story 
                isOpen={isOpen} 
                product={mockProductSimple}
                onClose={() => setIsOpen(false)} 
              />
            </div>
            <Toaster position="top-right" />
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
};

export const ValidationErrors: Story = {
  args: {
    isOpen: true,
    product: mockProductSimple,
  },
  decorators: [
    (Story) => {
      const queryClient = createQueryClient();
      const [isOpen, setIsOpen] = useState(true);
      
      queryClient.setQueryData(['product.byId', mockProductSimple._id], mockProductSimple);
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <Story 
              isOpen={isOpen} 
              product={mockProductSimple}
              onClose={() => setIsOpen(false)} 
            />
            <Toaster position="top-right" />
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    await waitFor(() => {
      expect(canvas.getByDisplayValue('Classic T-Shirt')).toBeInTheDocument();
    });
    
    // Clear required fields to trigger validation
    const nameInput = canvas.getByLabelText(/name/i);
    await userEvent.clear(nameInput);
    
    const priceInput = canvas.getByLabelText(/price/i);
    await userEvent.clear(priceInput);
    await userEvent.type(priceInput, '-10'); // Invalid price
    
    // Try to submit
    const submitButton = canvas.getByRole('button', { name: /save|update/i });
    await userEvent.click(submitButton);
    
    // Check for validation messages
    await waitFor(() => {
      expect(canvas.getByText(/required/i)).toBeInTheDocument();
    });
  },
};

export const SaveConfirmation: Story = {
  args: {
    isOpen: true,
    product: mockProductSimple,
  },
  decorators: [
    (Story) => {
      const queryClient = createQueryClient();
      const [isOpen, setIsOpen] = useState(true);
      const [showSuccess, setShowSuccess] = useState(false);
      
      queryClient.setQueryData(['product.byId', mockProductSimple._id], mockProductSimple);
      
      const handleClose = () => {
        setShowSuccess(true);
        setIsOpen(false);
        setTimeout(() => setShowSuccess(false), 3000);
      };
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <div className="p-4">
              {showSuccess && (
                <div className="mb-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <h3 className="font-semibold mb-2 text-green-700">Success!</h3>
                  <p className="text-sm text-green-600">
                    Product updated successfully
                  </p>
                </div>
              )}
              <Story 
                isOpen={isOpen} 
                product={mockProductSimple}
                onClose={handleClose} 
              />
            </div>
            <Toaster position="top-right" />
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
};

export const MobileView: Story = {
  args: {
    isOpen: true,
    product: mockProductSimple,
  },
  decorators: [
    (Story) => {
      const queryClient = createQueryClient();
      const [isOpen, setIsOpen] = useState(true);
      
      queryClient.setQueryData(['product.byId', mockProductSimple._id], mockProductSimple);
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <Story 
              isOpen={isOpen} 
              product={mockProductSimple}
              onClose={() => setIsOpen(false)} 
            />
            <Toaster position="top-right" />
          </QueryClientProvider>
        </trpc.Provider>
      );
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
    isOpen: true,
    product: mockProductWithVariants,
  },
  decorators: [
    (Story) => {
      const queryClient = createQueryClient();
      const [isOpen, setIsOpen] = useState(true);
      
      queryClient.setQueryData(['product.byId', mockProductWithVariants._id], mockProductWithVariants);
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <Story 
              isOpen={isOpen} 
              product={mockProductWithVariants}
              onClose={() => setIsOpen(false)} 
            />
            <Toaster position="top-right" />
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};

export const FullEditMode: Story = {
  args: {
    isOpen: true,
    product: mockProductWithMedia,
  },
  decorators: [
    (Story) => {
      const queryClient = createQueryClient();
      const [isOpen, setIsOpen] = useState(true);
      
      queryClient.setQueryData(['product.byId', mockProductWithMedia._id], mockProductWithMedia);
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <div className="p-4">
              <div className="mb-4 p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">Full Edit Mode</h3>
                <p className="text-sm text-muted-foreground">
                  This mode includes all features: media gallery, variants, SEO fields, and more.
                </p>
              </div>
              <Story 
                isOpen={isOpen} 
                product={mockProductWithMedia}
                onClose={() => setIsOpen(false)} 
              />
            </div>
            <Toaster position="top-right" />
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
};

export const OutOfStockProduct: Story = {
  args: {
    isOpen: true,
    product: mockProductOutOfStock,
  },
  decorators: [
    (Story) => {
      const queryClient = createQueryClient();
      const [isOpen, setIsOpen] = useState(true);
      
      queryClient.setQueryData(['product.byId', mockProductOutOfStock._id], mockProductOutOfStock);
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <div className="p-4">
              <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <h3 className="font-semibold mb-2 text-destructive">Out of Stock</h3>
                <p className="text-sm text-destructive">
                  This product is currently out of stock
                </p>
              </div>
              <Story 
                isOpen={isOpen} 
                product={mockProductOutOfStock}
                onClose={() => setIsOpen(false)} 
              />
            </div>
            <Toaster position="top-right" />
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
};

export const NoProduct: Story = {
  args: {
    isOpen: false,
    product: null,
  },
  decorators: [
    (Story) => {
      const queryClient = createQueryClient();
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <div className="p-4">
              <p className="text-sm text-muted-foreground">
                Drawer won't render when product is null
              </p>
              <Story 
                isOpen={false} 
                product={null}
                onClose={() => {}} 
              />
            </div>
            <Toaster position="top-right" />
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
};

export const KeyboardShortcuts: Story = {
  args: {
    isOpen: true,
    product: mockProductSimple,
  },
  decorators: [
    (Story) => {
      const queryClient = createQueryClient();
      const [isOpen, setIsOpen] = useState(true);
      
      queryClient.setQueryData(['product.byId', mockProductSimple._id], mockProductSimple);
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <div className="p-4">
              <div className="mb-4 p-4 bg-muted rounded-lg">
                <h3 className="font-semibold mb-2">Keyboard Shortcuts</h3>
                <p className="text-sm text-muted-foreground">
                  <kbd>Ctrl/Cmd + Enter</kbd> - Save changes<br />
                  <kbd>Esc</kbd> - Close drawer
                </p>
              </div>
              <Story 
                isOpen={isOpen} 
                product={mockProductSimple}
                onClose={() => setIsOpen(false)} 
              />
            </div>
            <Toaster position="top-right" />
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
};

export const CompleteEditWorkflow: Story = {
  args: {
    isOpen: true,
    product: mockProductWithVariants,
  },
  decorators: [
    (Story) => {
      const queryClient = createQueryClient();
      const [isOpen, setIsOpen] = useState(true);
      
      queryClient.setQueryData(['product.byId', mockProductWithVariants._id], mockProductWithVariants);
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <Story 
              isOpen={isOpen} 
              product={mockProductWithVariants}
              onClose={() => setIsOpen(false)} 
            />
            <Toaster position="top-right" />
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Wait for drawer to load
    await waitFor(() => {
      expect(canvas.getByDisplayValue('Premium Hoodie')).toBeInTheDocument();
    });
    
    // Edit basic details
    const nameInput = canvas.getByLabelText(/name/i);
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Premium Hoodie - Limited Edition');
    
    const descInput = canvas.getByLabelText(/description/i);
    await userEvent.clear(descInput);
    await userEvent.type(descInput, 'Limited edition premium hoodie with exclusive design');
    
    // Update price
    const priceInput = canvas.getByLabelText(/price/i);
    await userEvent.clear(priceInput);
    await userEvent.type(priceInput, '89.99');
    
    // Toggle featured
    const featuredSwitch = canvas.getByRole('switch', { name: /featured/i });
    await userEvent.click(featuredSwitch);
    
    // Check variants section exists
    expect(canvas.getByText(/variants/i)).toBeInTheDocument();
    
    // Save changes
    const saveButton = canvas.getByRole('button', { name: /save|update/i });
    await userEvent.click(saveButton);
  },
};

export const ImageUploadWorkflow: Story = {
  args: {
    isOpen: true,
    product: mockProductWithMedia,
  },
  decorators: [
    (Story) => {
      const queryClient = createQueryClient();
      const [isOpen, setIsOpen] = useState(true);
      
      queryClient.setQueryData(['product.byId', mockProductWithMedia._id], mockProductWithMedia);
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <Story 
              isOpen={isOpen} 
              product={mockProductWithMedia}
              onClose={() => setIsOpen(false)} 
            />
            <Toaster position="top-right" />
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    await waitFor(() => {
      expect(canvas.getByDisplayValue('Leather Jacket')).toBeInTheDocument();
    });
    
    // Check media gallery section
    expect(canvas.getByText(/media|gallery|images/i)).toBeInTheDocument();
    
    // Look for upload button
    const uploadButton = canvas.queryByRole('button', { name: /upload|add.*image/i });
    if (uploadButton) {
      await userEvent.click(uploadButton);
      
      // Simulate file selection
      const fileInput = canvas.getByLabelText(/upload|select.*file/i) as HTMLInputElement;
      const file = new File(['test'], 'new-product-image.jpg', { type: 'image/jpeg' });
      await userEvent.upload(fileInput, file);
    }
    
    // Check existing media items
    const mediaItems = canvas.getAllByRole('img');
    expect(mediaItems.length).toBeGreaterThan(0);
  },
};

export const VariantManagementWorkflow: Story = {
  args: {
    isOpen: true,
    product: mockProductWithVariants,
  },
  decorators: [
    (Story) => {
      const queryClient = createQueryClient();
      const [isOpen, setIsOpen] = useState(true);
      
      queryClient.setQueryData(['product.byId', mockProductWithVariants._id], mockProductWithVariants);
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <Story 
              isOpen={isOpen} 
              product={mockProductWithVariants}
              onClose={() => setIsOpen(false)} 
            />
            <Toaster position="top-right" />
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    await waitFor(() => {
      expect(canvas.getByText('Small / Black')).toBeInTheDocument();
    });
    
    // Check all variants are displayed
    expect(canvas.getByText('Medium / Black')).toBeInTheDocument();
    expect(canvas.getByText('Large / Gray')).toBeInTheDocument();
    
    // Look for variant inventory info
    const inventoryInputs = canvas.getAllByRole('spinbutton', { name: /inventory|stock/i });
    expect(inventoryInputs.length).toBeGreaterThan(0);
    
    // Edit first variant's inventory
    if (inventoryInputs[0]) {
      await userEvent.clear(inventoryInputs[0]);
      await userEvent.type(inventoryInputs[0], '25');
    }
    
    // Look for add variant button
    const addVariantButton = canvas.queryByRole('button', { name: /add.*variant/i });
    if (addVariantButton) {
      await userEvent.click(addVariantButton);
    }
  },
};

export const KeyboardNavigation: Story = {
  args: {
    isOpen: true,
    product: mockProductSimple,
  },
  decorators: [
    (Story) => {
      const queryClient = createQueryClient();
      const [isOpen, setIsOpen] = useState(true);
      
      queryClient.setQueryData(['product.byId', mockProductSimple._id], mockProductSimple);
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <Story 
              isOpen={isOpen} 
              product={mockProductSimple}
              onClose={() => setIsOpen(false)} 
            />
            <Toaster position="top-right" />
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    await waitFor(() => {
      expect(canvas.getByDisplayValue('Classic T-Shirt')).toBeInTheDocument();
    });
    
    // Focus on name field
    const nameInput = canvas.getByLabelText(/name/i);
    await userEvent.click(nameInput);
    expect(document.activeElement).toBe(nameInput);
    
    // Tab through fields
    await userEvent.tab(); // To description
    const descInput = canvas.getByLabelText(/description/i);
    expect(document.activeElement).toBe(descInput);
    
    await userEvent.tab(); // To price
    const priceInput = canvas.getByLabelText(/price/i);
    expect(document.activeElement).toBe(priceInput);
    
    await userEvent.tab(); // To collection select
    await userEvent.tab(); // To featured switch
    
    const featuredSwitch = canvas.getByRole('switch', { name: /featured/i });
    expect(document.activeElement).toBe(featuredSwitch);
    
    // Space to toggle
    await userEvent.keyboard(' ');
    
    // Escape to close
    await userEvent.keyboard('{Escape}');
  },
};

export const AccessibilityFeatures: Story = {
  args: {
    isOpen: true,
    product: mockProductSimple,
  },
  decorators: [
    (Story) => {
      const queryClient = createQueryClient();
      const [isOpen, setIsOpen] = useState(true);
      
      queryClient.setQueryData(['product.byId', mockProductSimple._id], mockProductSimple);
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <Story 
              isOpen={isOpen} 
              product={mockProductSimple}
              onClose={() => setIsOpen(false)} 
            />
            <Toaster position="top-right" />
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    await waitFor(() => {
      expect(canvas.getByRole('dialog')).toBeInTheDocument();
    });
    
    // Check dialog has proper attributes
    const dialog = canvas.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    
    // Check all inputs have labels
    const nameInput = canvas.getByLabelText(/name/i);
    expect(nameInput).toBeInTheDocument();
    
    const priceInput = canvas.getByLabelText(/price/i);
    expect(priceInput).toBeInTheDocument();
    
    // Check featured switch has label
    const featuredSwitch = canvas.getByRole('switch', { name: /featured/i });
    expect(featuredSwitch).toHaveAccessibleName();
    
    // Test form validation announcements
    await userEvent.clear(nameInput);
    
    const saveButton = canvas.getByRole('button', { name: /save|update/i });
    await userEvent.click(saveButton);
    
    // Error should be announced
    await waitFor(() => {
      const errorMessage = canvas.getByText(/required/i);
      expect(errorMessage).toBeInTheDocument();
    });
  },
};