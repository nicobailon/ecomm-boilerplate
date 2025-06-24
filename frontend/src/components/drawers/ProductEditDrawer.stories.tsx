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
import { Skeleton } from '@/components/ui/Skeleton';
import { Card } from '@/components/ui/Card';
import { Loader2, RefreshCw, Package, Upload } from 'lucide-react';

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
                Drawer won&apos;t render when product is null
              </p>
              <Story 
                isOpen={false} 
                product={null}
                onClose={() => { console.log('Close drawer'); }} 
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
      const fileInput = canvas.getByLabelText(/upload|select.*file/i);
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

export const InitialLoadingState: Story = {
  decorators: [
    () => (
      <div className="min-h-screen bg-background">
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
          <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-background border-l border-border shadow-lg">
            <div className="flex flex-col h-full">
              <div className="p-6 border-b border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <Skeleton className="h-7 w-40 mb-1" />
                    <Skeleton className="h-4 w-64" />
                  </div>
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-8">
                  {/* Basic Details Section */}
                  <div>
                    <Skeleton className="h-6 w-32 mb-4" />
                    <div className="space-y-4">
                      <div>
                        <Skeleton className="h-4 w-24 mb-2" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                      <div>
                        <Skeleton className="h-4 w-28 mb-2" />
                        <Skeleton className="h-24 w-full" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Skeleton className="h-4 w-16 mb-2" />
                          <Skeleton className="h-10 w-full" />
                        </div>
                        <div>
                          <Skeleton className="h-4 w-20 mb-2" />
                          <Skeleton className="h-10 w-full" />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Image Section */}
                  <div>
                    <Skeleton className="h-6 w-28 mb-4" />
                    <div className="grid grid-cols-4 gap-4">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="aspect-square">
                          <Skeleton className="h-full w-full rounded-lg" />
                        </div>
                      ))}
                    </div>
                    <Skeleton className="h-10 w-32 mt-4" />
                  </div>
                  
                  {/* Variants Section */}
                  <div>
                    <Skeleton className="h-6 w-24 mb-4" />
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="p-4 border rounded-lg">
                          <div className="grid grid-cols-4 gap-4">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Settings Section */}
                  <div>
                    <Skeleton className="h-6 w-20 mb-4" />
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-6 w-12" />
                      </div>
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-6 w-12" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-6 border-t border-border">
                <div className="flex gap-3">
                  <Skeleton className="h-10 flex-1" />
                  <Skeleton className="h-10 w-24" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
  ],
  args: {
    isOpen: false,
    product: null,
  },
  render: () => <div></div>,
};

export const LazyDataLoading: Story = {
  args: {
    isOpen: true,
    product: mockProductWithVariants,
  },
  decorators: [
    (Story) => {
      const queryClient = createQueryClient();
      const [isOpen, setIsOpen] = useState(true);
      const [isLoading, setIsLoading] = useState(true);
      
      useState(() => {
        setTimeout(() => setIsLoading(false), 2500);
      });
      
      if (isLoading) {
        return (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
            <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-background border-l">
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-4">
                  <Package className="w-16 h-16 mx-auto text-muted-foreground" />
                  <div>
                    <h3 className="text-lg font-medium mb-2">Loading Product Details</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Fetching product information and variants...
                    </p>
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      }
      
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

export const ProgressiveDataLoading: Story = {
  args: {
    isOpen: true,
    product: mockProductWithMedia,
  },
  decorators: [
    () => {
      const queryClient = createQueryClient();
      const [loadedSections, setLoadedSections] = useState(0);
      const totalSections = 5;
      
      useState(() => {
        const interval = setInterval(() => {
          setLoadedSections(prev => {
            if (prev >= totalSections) {
              clearInterval(interval);
              return totalSections;
            }
            return prev + 1;
          });
        }, 600);
        
        return () => clearInterval(interval);
      });
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
              <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-background border-l">
                <div className="flex flex-col h-full">
                  <div className="p-6 border-b">
                    <h2 className="text-lg font-semibold">Edit Product</h2>
                    <div className="mt-2 text-xs text-muted-foreground">
                      Loading sections: {loadedSections}/{totalSections}
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-6">
                    <div className="space-y-8">
                      {/* Basic Details */}
                      <div className={loadedSections >= 1 ? 'opacity-100' : 'opacity-30'}>
                        <h3 className="text-base font-medium mb-4">Basic Details</h3>
                        {loadedSections >= 1 ? (
                          <div className="space-y-4">
                            <input className="w-full p-2 border rounded" defaultValue="Leather Jacket" />
                            <textarea className="w-full p-2 border rounded" rows={3} defaultValue="Premium leather jacket" />
                            <div className="grid grid-cols-2 gap-4">
                              <input className="p-2 border rounded" defaultValue="299.99" />
                              <select className="p-2 border rounded">
                                <option>Select Collection</option>
                              </select>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-24 w-full" />
                            <div className="grid grid-cols-2 gap-4">
                              <Skeleton className="h-10 w-full" />
                              <Skeleton className="h-10 w-full" />
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Images */}
                      <div className={loadedSections >= 2 ? 'opacity-100' : 'opacity-30'}>
                        <h3 className="text-base font-medium mb-4">Product Images</h3>
                        {loadedSections >= 2 ? (
                          <div className="grid grid-cols-3 gap-4">
                            {[1, 2, 3].map((i) => (
                              <div key={i} className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                                <Upload className="w-8 h-8 text-muted-foreground" />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="grid grid-cols-3 gap-4">
                            {[1, 2, 3].map((i) => (
                              <Skeleton key={i} className="aspect-square w-full" />
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {/* Variants */}
                      <div className={loadedSections >= 3 ? 'opacity-100' : 'opacity-30'}>
                        <h3 className="text-base font-medium mb-4">Product Variants</h3>
                        {loadedSections >= 3 ? (
                          <div className="space-y-4">
                            {['Small / Black', 'Medium / Black'].map((variant, i) => (
                              <div key={i} className="p-4 border rounded-lg">
                                <div className="grid grid-cols-4 gap-4">
                                  <input className="p-2 border rounded" defaultValue={variant} />
                                  <input className="p-2 border rounded" defaultValue="79.99" />
                                  <input className="p-2 border rounded" defaultValue="15" />
                                  <input className="p-2 border rounded" defaultValue="PROD-VAR" />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {[1, 2].map((i) => (
                              <Skeleton key={i} className="h-20 w-full" />
                            ))}
                          </div>
                        )}
                      </div>
                      
                      {/* Inventory */}
                      <div className={loadedSections >= 4 ? 'opacity-100' : 'opacity-30'}>
                        <h3 className="text-base font-medium mb-4">Inventory & Stock</h3>
                        {loadedSections >= 4 ? (
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium">Total Inventory</label>
                              <input className="w-full mt-1 p-2 border rounded" defaultValue="100" />
                            </div>
                            <div>
                              <label className="text-sm font-medium">Low Stock Alert</label>
                              <input className="w-full mt-1 p-2 border rounded" defaultValue="10" />
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-4">
                            <Skeleton className="h-16 w-full" />
                            <Skeleton className="h-16 w-full" />
                          </div>
                        )}
                      </div>
                      
                      {/* Settings */}
                      <div className={loadedSections >= 5 ? 'opacity-100' : 'opacity-30'}>
                        <h3 className="text-base font-medium mb-4">Settings</h3>
                        {loadedSections >= 5 ? (
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <label className="text-sm font-medium">Featured Product</label>
                              <div className="w-12 h-6 bg-primary rounded-full relative">
                                <div className="absolute top-1 right-1 w-4 h-4 bg-white rounded-full" />
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <label className="text-sm font-medium">Visible in Store</label>
                              <div className="w-12 h-6 bg-primary rounded-full relative">
                                <div className="absolute top-1 right-1 w-4 h-4 bg-white rounded-full" />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <Skeleton className="h-8 w-full" />
                            <Skeleton className="h-8 w-full" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6 border-t">
                    <div className="flex gap-3">
                      <button className="flex-1 px-4 py-2 bg-muted text-muted-foreground rounded disabled">Cancel</button>
                      <button className="px-6 py-2 bg-primary text-primary-foreground rounded disabled">Save Changes</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <Toaster position="top-right" />
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
  render: () => <div></div>,
};

export const SavingProgressState: Story = {
  args: {
    isOpen: true,
    product: mockProductSimple,
  },
  decorators: [
    (Story) => {
      const queryClient = createQueryClient();
      const [isOpen, setIsOpen] = useState(true);
      const [isSaving, setIsSaving] = useState(false);
      const [progress, setProgress] = useState(0);
      const [currentStep, setCurrentStep] = useState('');
      
      const saveProduct = () => {
        setIsSaving(true);
        setProgress(0);
        setCurrentStep('Validating product data...');
        
        const steps = [
          { text: 'Validating product data...', duration: 800 },
          { text: 'Processing images...', duration: 1200 },
          { text: 'Updating inventory...', duration: 600 },
          { text: 'Saving to database...', duration: 1000 },
          { text: 'Finalizing changes...', duration: 400 },
        ];
        
        let totalProgress = 0;
        steps.forEach((step, index) => {
          setTimeout(() => {
            setCurrentStep(step.text);
            totalProgress = ((index + 1) / steps.length) * 100;
            setProgress(totalProgress);
            
            if (index === steps.length - 1) {
              setTimeout(() => {
                setIsSaving(false);
                setIsOpen(false);
              }, 500);
            }
          }, steps.slice(0, index).reduce((acc, s) => acc + s.duration, 0));
        });
      };
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <div className="space-y-4">
              <Card className="p-4">
                <h4 className="font-medium mb-2">Save Progress Demo</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Click &quot;Save Product&quot; to see detailed save progress
                </p>
                <Button onClick={saveProduct} disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Product'}
                </Button>
                {isSaving && (
                  <div className="mt-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>{currentStep}</span>
                        <span>{Math.round(progress)}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  </div>
                )}
              </Card>
              
              {isSaving && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
                  <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-background border-l">
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center space-y-6 max-w-sm">
                        <div className="relative">
                          <div className="w-20 h-20 mx-auto">
                            <Loader2 className="w-full h-full animate-spin text-primary" />
                          </div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-sm font-medium">{Math.round(progress)}%</span>
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="text-lg font-medium mb-2">Saving Product</h3>
                          <p className="text-sm text-muted-foreground mb-4">{currentStep}</p>
                          
                          <div className="w-64 mx-auto">
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
                            </div>
                          </div>
                        </div>
                        
                        <p className="text-xs text-muted-foreground">
                          Please don&apos;t close this window while saving...
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <Story 
                isOpen={isOpen && !isSaving} 
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

export const RefreshableProductData: Story = {
  args: {
    isOpen: true,
    product: mockProductWithVariants,
  },
  decorators: [
    (Story) => {
      const queryClient = createQueryClient();
      const [isOpen, setIsOpen] = useState(true);
      const [isRefreshing, setIsRefreshing] = useState(false);
      const [lastUpdated, setLastUpdated] = useState(new Date());
      const [product, setProduct] = useState(mockProductWithVariants);
      
      const refreshProduct = async () => {
        setIsRefreshing(true);
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Simulate getting updated product data
        const updatedProduct = {
          ...product,
          name: product.name + ' (Updated)',
          price: product.price + 10,
          updatedAt: new Date().toISOString(),
        };
        
        setProduct(updatedProduct);
        setLastUpdated(new Date());
        setIsRefreshing(false);
      };
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <div className="space-y-4">
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Product Data</h4>
                    <p className="text-xs text-muted-foreground">
                      Last updated: {lastUpdated.toLocaleTimeString()}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={refreshProduct}
                    disabled={isRefreshing}
                  >
                    {isRefreshing ? (
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
              
              <div className={isRefreshing ? 'opacity-50 pointer-events-none' : ''}>
                <Story 
                  isOpen={isOpen} 
                  product={product}
                  onClose={() => setIsOpen(false)} 
                />
              </div>
              
              {isRefreshing && (
                <div className="fixed top-4 right-4 z-40">
                  <Card className="p-3">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">Refreshing product data...</span>
                    </div>
                  </Card>
                </div>
              )}
            </div>
            <Toaster position="top-right" />
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
};

export const ShimmerLoadingEffect: Story = {
  decorators: [
    () => (
      <div className="min-h-screen bg-background">
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
          <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-background border-l">
            <div className="flex flex-col h-full">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="h-7 w-40 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer rounded mb-1" />
                    <div className="h-4 w-64 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer rounded" />
                  </div>
                  <div className="h-8 w-8 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer rounded-full" />
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-8">
                  {/* Basic Details Section */}
                  <div>
                    <div className="h-6 w-32 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer rounded mb-4" />
                    <div className="space-y-4">
                      <div>
                        <div className="h-4 w-24 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer rounded mb-2" />
                        <div className="h-10 w-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer rounded" />
                      </div>
                      <div>
                        <div className="h-4 w-28 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer rounded mb-2" />
                        <div className="h-24 w-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer rounded" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="h-4 w-16 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer rounded mb-2" />
                          <div className="h-10 w-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer rounded" />
                        </div>
                        <div>
                          <div className="h-4 w-20 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer rounded mb-2" />
                          <div className="h-10 w-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer rounded" />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Image Gallery Section */}
                  <div>
                    <div className="h-6 w-28 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer rounded mb-4" />
                    <div className="grid grid-cols-4 gap-4">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="aspect-square bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer rounded-lg" />
                      ))}
                    </div>
                    <div className="h-10 w-32 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer rounded mt-4" />
                  </div>
                  
                  {/* Variants Section */}
                  <div>
                    <div className="h-6 w-24 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer rounded mb-4" />
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="p-4 border rounded-lg">
                          <div className="grid grid-cols-4 gap-4">
                            <div className="h-10 w-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer rounded" />
                            <div className="h-10 w-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer rounded" />
                            <div className="h-10 w-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer rounded" />
                            <div className="h-10 w-full bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer rounded" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Settings Section */}
                  <div>
                    <div className="h-6 w-20 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer rounded mb-4" />
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="h-4 w-24 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer rounded" />
                        <div className="h-6 w-12 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer rounded" />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="h-4 w-32 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer rounded" />
                        <div className="h-6 w-12 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer rounded" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-6 border-t">
                <div className="flex gap-3">
                  <div className="h-10 flex-1 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer rounded" />
                  <div className="h-10 w-24 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-shimmer rounded" />
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
  args: {
    isOpen: false,
    product: null,
  },
  render: () => <div></div>,
};

export const ImageUploadLoadingState: Story = {
  args: {
    isOpen: true,
    product: mockProductSimple,
  },
  decorators: [
    (Story) => {
      const queryClient = createQueryClient();
      const [isOpen, setIsOpen] = useState(true);
      const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
      const [uploadingFiles, setUploadingFiles] = useState<string[]>([]);
      
      const simulateUpload = (fileName: string) => {
        setUploadingFiles(prev => [...prev, fileName]);
        setUploadProgress(prev => ({ ...prev, [fileName]: 0 }));
        
        const interval = setInterval(() => {
          setUploadProgress(prev => {
            const currentProgress = prev[fileName] || 0;
            if (currentProgress >= 100) {
              clearInterval(interval);
              setUploadingFiles(current => current.filter(f => f !== fileName));
              return { ...prev, [fileName]: 100 };
            }
            return { ...prev, [fileName]: currentProgress + 10 };
          });
        }, 200);
      };
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <div className="space-y-4">
              <Card className="p-4">
                <h4 className="font-medium mb-2">Image Upload Demo</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Simulate image upload with progress indicators
                </p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => simulateUpload('image1.jpg')}>
                    Upload Image 1
                  </Button>
                  <Button size="sm" onClick={() => simulateUpload('image2.jpg')}>
                    Upload Image 2
                  </Button>
                </div>
                
                {uploadingFiles.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {uploadingFiles.map(fileName => (
                      <div key={fileName} className="flex items-center gap-3">
                        <Upload className="w-4 h-4" />
                        <div className="flex-1">
                          <div className="flex justify-between text-sm mb-1">
                            <span>{fileName}</span>
                            <span>{uploadProgress[fileName] || 0}%</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary transition-all duration-200" style={{ width: `${uploadProgress[fileName] || 0}%` }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
              
              <div className={uploadingFiles.length > 0 ? 'opacity-70 pointer-events-none' : ''}>
                <Story 
                  isOpen={isOpen} 
                  product={mockProductSimple}
                  onClose={() => setIsOpen(false)} 
                />
              </div>
              
              {uploadingFiles.length > 0 && (
                <div className="fixed bottom-4 right-4 z-50">
                  <Card className="p-3">
                    <div className="flex items-center gap-2">
                      <Upload className="w-4 h-4 animate-pulse" />
                      <span className="text-sm">Uploading {uploadingFiles.length} image(s)...</span>
                    </div>
                  </Card>
                </div>
              )}
            </div>
            <Toaster position="top-right" />
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
};

export const VariantBatchLoadingState: Story = {
  args: {
    isOpen: true,
    product: mockProductWithVariants,
  },
  decorators: [
    (Story) => {
      const queryClient = createQueryClient();
      const [isOpen, setIsOpen] = useState(true);
      const [isLoadingVariants, setIsLoadingVariants] = useState(false);
      const [variantProgress, setVariantProgress] = useState(0);
      
      const loadVariants = () => {
        setIsLoadingVariants(true);
        setVariantProgress(0);
        
        const interval = setInterval(() => {
          setVariantProgress(prev => {
            if (prev >= 100) {
              clearInterval(interval);
              setIsLoadingVariants(false);
              return 100;
            }
            return prev + 5;
          });
        }, 100);
      };
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <div className="space-y-4">
              <Card className="p-4">
                <h4 className="font-medium mb-2">Variant Batch Loading</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Simulate loading product variants with inventory data
                </p>
                <Button onClick={loadVariants} disabled={isLoadingVariants}>
                  {isLoadingVariants ? 'Loading Variants...' : 'Load Variants'}
                </Button>
                
                {isLoadingVariants && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span>Loading variant data...</span>
                      <span>{variantProgress}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary transition-all duration-100" style={{ width: `${variantProgress}%` }} />
                    </div>
                  </div>
                )}
              </Card>
              
              <div className={isLoadingVariants ? 'opacity-50 pointer-events-none' : ''}>
                <Story 
                  isOpen={isOpen} 
                  product={mockProductWithVariants}
                  onClose={() => setIsOpen(false)} 
                />
              </div>
              
              {isLoadingVariants && (
                <div className="fixed inset-0 bg-background/20 z-40">
                  <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <Card className="p-6">
                      <div className="text-center space-y-4">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto" />
                        <div>
                          <h4 className="font-medium">Loading Product Variants</h4>
                          <p className="text-sm text-muted-foreground">
                            Fetching inventory and pricing data...
                          </p>
                        </div>
                        <div className="w-48">
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary transition-all duration-100" style={{ width: `${variantProgress}%` }} />
                          </div>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              )}
            </div>
            <Toaster position="top-right" />
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
};