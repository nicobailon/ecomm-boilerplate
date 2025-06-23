import type { Meta, StoryObj } from '@storybook/react-vite';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import FeaturedProducts from './FeaturedProducts';
import { mockProducts, mockProduct, mockProductOnSale, mockProductOutOfStock } from '@/test/mocks';
import type { Product } from '@/types';
import { userEvent, within, expect, waitFor } from '@storybook/test';
import { trpc } from '@/lib/trpc';
import { createTRPCClient } from '@/lib/trpc-client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { AlertCircle, Package } from 'lucide-react';
import { Toaster } from 'sonner';

const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const meta = {
  title: 'Product/FeaturedProducts',
  component: FeaturedProducts,
  decorators: [
    (Story) => {
      const queryClient = createQueryClient();
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              <div className="min-h-screen bg-background">
                <Story />
                <Toaster position="top-right" />
              </div>
            </BrowserRouter>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof FeaturedProducts>;

export default meta;
type Story = StoryObj<typeof meta>;

// Create more featured products for testing
const createFeaturedProducts = (count: number): Product[] => {
  const products: Product[] = [];
  for (let i = 0; i < count; i++) {
    products.push({
      ...mockProduct,
      _id: `product-${i}`,
      name: `Featured Product ${i + 1}`,
      price: 100 + i * 50,
      image: `https://images.unsplash.com/photo-${1505740420928 + i * 1000}-5e560c06d30e?w=800&h=800&fit=crop`,
      isFeatured: true,
      slug: `featured-product-${i + 1}`,
    });
  }
  return products;
};

export const Default: Story = {
  args: {
    featuredProducts: createFeaturedProducts(8),
  },
};

export const FewProducts: Story = {
  args: {
    featuredProducts: mockProducts.filter(p => p.isFeatured),
  },
};

export const SingleProduct: Story = {
  args: {
    featuredProducts: [mockProduct],
  },
};

// Enhanced empty state component
const EmptyFeaturedProducts = () => {
  return (
    <div className='py-12'>
      <div className='container mx-auto px-4'>
        <h2 className='text-center text-5xl sm:text-6xl font-bold text-primary mb-4'>Featured</h2>
        <div className='text-center py-16'>
          <div className='w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4'>
            <Package className='w-10 h-10 text-muted-foreground' />
          </div>
          <h3 className='text-xl font-semibold mb-2'>No Featured Products</h3>
          <p className='text-muted-foreground mb-6 max-w-md mx-auto'>
            There are currently no featured products available. Check back later or browse our full catalog.
          </p>
          <Button variant="outline">
            <a href="/products">Browse All Products</a>
          </Button>
        </div>
      </div>
    </div>
  );
};

export const EmptyState: Story = {
  args: {
    featuredProducts: [],
  },
  render: () => <EmptyFeaturedProducts />,
};

// Loading state component that simulates actual loading
const LoadingFeaturedProducts = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [itemsPerPage, setItemsPerPage] = useState(4);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) setItemsPerPage(1);
      else if (window.innerWidth < 1024) setItemsPerPage(2);
      else if (window.innerWidth < 1280) setItemsPerPage(3);
      else setItemsPerPage(4);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Simulate loading delay
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  if (!isLoading) {
    return <FeaturedProducts featuredProducts={createFeaturedProducts(8)} />;
  }

  return (
    <div className='py-12'>
      <div className='container mx-auto px-4'>
        <h2 className='text-center text-5xl sm:text-6xl font-bold text-primary mb-4'>Featured</h2>
        <div className='flex gap-4 overflow-hidden'>
          {Array.from({ length: itemsPerPage }).map((_, i) => (
            <div key={i} className='w-full sm:w-1/2 lg:w-1/3 xl:w-1/4 flex-shrink-0 px-2'>
              <div className='bg-white bg-opacity-10 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden h-full border border-primary/30'>
                <div className='h-48 bg-muted animate-pulse' />
                <div className='p-4 space-y-3'>
                  <div className='h-4 bg-muted animate-pulse rounded' />
                  <div className='h-4 bg-muted animate-pulse rounded w-1/2' />
                  <div className='h-10 bg-muted animate-pulse rounded' />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const LoadingState: Story = {
  args: {
    featuredProducts: [],
  },
  render: () => <LoadingFeaturedProducts />,
};

export const GuestUser: Story = {
  args: {
    featuredProducts: createFeaturedProducts(4),
  },
  decorators: [
    (Story) => {
      const queryClient = createQueryClient();
      // Don't set any user data to simulate guest state
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              <div className="min-h-screen bg-background">
                <Story />
                <Toaster position="top-right" />
              </div>
            </BrowserRouter>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    
    // Wait for products to render
    await waitFor(() => {
      expect(canvas.getByText('Featured Product 1')).toBeInTheDocument();
    });
    
    // Try to add to cart as guest
    const addToCartButtons = canvas.getAllByText('Add to Cart');
    await userEvent.click(addToCartButtons[0]);
    
    // Should show login prompt
    await waitFor(() => {
      expect(body.getByText('Please login to add products to cart')).toBeInTheDocument();
    });
  },
};

export const WithMixedProducts: Story = {
  args: {
    featuredProducts: [
      mockProduct,
      mockProductOnSale,
      mockProductOutOfStock,
      ...createFeaturedProducts(5),
    ],
  },
};

export const ProductClickInteraction: Story = {
  args: {
    featuredProducts: createFeaturedProducts(4),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Wait for products to render
    await waitFor(() => {
      expect(canvas.getByText('Featured Product 1')).toBeInTheDocument();
    });
    
    // Test clicking on product card (should navigate)
    const productCard = canvas.getByText('Featured Product 1').closest('a');
    expect(productCard).toHaveAttribute('href', '/products/featured-product-1');
    
    // Hover over product to see hover effects
    if (productCard) {
      await userEvent.hover(productCard);
    }
    
    // Test all product links are present and correct
    const allProductLinks = canvas.getAllByRole('link');
    expect(allProductLinks).toHaveLength(4);
    
    allProductLinks.forEach((link, index) => {
      expect(link).toHaveAttribute('href', `/products/featured-product-${index + 1}`);
    });
  },
};

export const AddingToCart: Story = {
  args: {
    featuredProducts: createFeaturedProducts(4),
  },
  decorators: [
    (Story) => {
      const queryClient = createQueryClient();
      // Set user data to simulate logged in state
      queryClient.setQueryData(['user'], {
        _id: '1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'customer',
      });
      
      return (
        <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              <div className="min-h-screen bg-background">
                <Story />
                <Toaster position="top-right" />
              </div>
            </BrowserRouter>
          </QueryClientProvider>
        </trpc.Provider>
      );
    },
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Wait for products to render
    await waitFor(() => {
      expect(canvas.getByText('Featured Product 1')).toBeInTheDocument();
    });
    
    // Add product to cart
    const addToCartButtons = canvas.getAllByText('Add to Cart');
    await userEvent.click(addToCartButtons[0]);
    
    // Button should show loading state
    await waitFor(() => {
      expect(addToCartButtons[0]).toHaveTextContent('Adding...');
    });
  },
};

export const CarouselNavigation: Story = {
  args: {
    featuredProducts: createFeaturedProducts(12),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Wait a bit for the component to render
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Click next button
    const nextButton = canvas.getAllByRole('button').find(btn => 
      btn.querySelector('.lucide-chevron-right')
    );
    if (nextButton) {
      await userEvent.click(nextButton);
    }
    
    // Wait and click again
    await new Promise(resolve => setTimeout(resolve, 500));
    if (nextButton && nextButton instanceof HTMLButtonElement && !nextButton.disabled) {
      await userEvent.click(nextButton);
    }
  },
};

export const MobileView: Story = {
  args: {
    featuredProducts: createFeaturedProducts(6),
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const TabletView: Story = {
  args: {
    featuredProducts: createFeaturedProducts(6),
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};

export const LargeDesktopView: Story = {
  args: {
    featuredProducts: createFeaturedProducts(12),
  },
  parameters: {
    viewport: {
      defaultViewport: 'responsive',
      viewports: {
        responsive: {
          name: 'Large Desktop',
          styles: {
            width: '1920px',
            height: '1080px',
          },
        },
      },
    },
  },
};

// Error state component with retry functionality
const ErrorFeaturedProducts = () => {
  const [error, setError] = useState(true);
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    setRetrying(true);
    // Simulate retry delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    setError(false);
    setRetrying(false);
  };

  if (!error) {
    return <FeaturedProducts featuredProducts={createFeaturedProducts(8)} />;
  }

  return (
    <div className='py-12'>
      <div className='container mx-auto px-4'>
        <h2 className='text-center text-5xl sm:text-6xl font-bold text-primary mb-4'>Featured</h2>
        <div className='text-center py-16'>
          <div className='w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4'>
            <AlertCircle className='w-10 h-10 text-destructive' />
          </div>
          <h3 className='text-xl font-semibold mb-2'>Failed to Load Products</h3>
          <p className='text-muted-foreground mb-6 max-w-md mx-auto'>
            We're having trouble loading featured products. This might be a temporary issue.
          </p>
          <Button 
            onClick={handleRetry} 
            disabled={retrying}
            data-testid="retry-button"
          >
            {retrying ? 'Retrying...' : 'Try Again'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export const ErrorState: Story = {
  args: {
    featuredProducts: [],
  },
  render: () => <ErrorFeaturedProducts />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Verify error state is shown
    await waitFor(() => {
      expect(canvas.getByText('Failed to Load Products')).toBeInTheDocument();
    });
    
    // Click retry button
    const retryButton = canvas.getByTestId('retry-button');
    await userEvent.click(retryButton);
    
    // Button should show loading state
    expect(retryButton).toHaveTextContent('Retrying...');
    expect(retryButton).toBeDisabled();
    
    // Wait for products to load
    await waitFor(() => {
      expect(canvas.getByText('Featured Product 1')).toBeInTheDocument();
    }, { timeout: 2000 });
  },
};

export const AccessibilityShowcase: Story = {
  args: {
    featuredProducts: createFeaturedProducts(4),
  },
  render: (args) => (
    <div className="space-y-4">
      <div className="container mx-auto px-4 py-4">
        <h3 className="text-lg font-semibold mb-4">Accessibility Features</h3>
        <div className="text-sm text-muted-foreground space-y-2 mb-4">
          <p>• Keyboard navigation support for carousel controls</p>
          <p>• Screen reader friendly product cards</p>
          <p>• Clear focus indicators</p>
          <p>• Responsive design for all screen sizes</p>
          <p>• Disabled state indication for navigation buttons</p>
        </div>
      </div>
      <FeaturedProducts {...args} />
    </div>
  ),
  parameters: {
    a11y: {
      config: {
        rules: [
          { id: 'color-contrast', enabled: true },
          { id: 'button-name', enabled: true },
          { id: 'link-name', enabled: true },
        ],
      },
    },
  },
};

// Story demonstrating loading to success flow
export const LoadingToSuccess: Story = {
  args: {
    featuredProducts: [],
  },
  render: () => {
    const LoadingFlow = () => {
      const [state, setState] = useState<'loading' | 'success'>('loading');
      
      useEffect(() => {
        const timer = setTimeout(() => {
          setState('success');
        }, 1500);
        return () => clearTimeout(timer);
      }, []);
      
      if (state === 'loading') {
        return (
          <div className='py-12'>
            <div className='container mx-auto px-4'>
              <h2 className='text-center text-5xl sm:text-6xl font-bold text-primary mb-4'>Featured</h2>
              <div className='flex gap-4 overflow-hidden'>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className='w-full sm:w-1/2 lg:w-1/3 xl:w-1/4 flex-shrink-0 px-2'>
                    <div className='bg-white bg-opacity-10 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden h-full border border-primary/30'>
                      <div className='h-48 bg-muted animate-pulse' />
                      <div className='p-4 space-y-3'>
                        <div className='h-4 bg-muted animate-pulse rounded' />
                        <div className='h-4 bg-muted animate-pulse rounded w-1/2' />
                        <div className='h-10 bg-muted animate-pulse rounded' />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      }
      
      return <FeaturedProducts featuredProducts={createFeaturedProducts(8)} />;
    };
    
    return <LoadingFlow />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Should show loading skeletons initially
    await waitFor(() => {
      const skeletons = canvas.getAllByText('', { selector: '.animate-pulse' });
      expect(skeletons.length).toBeGreaterThan(0);
    });
    
    // Wait for products to load
    await waitFor(() => {
      expect(canvas.getByText('Featured Product 1')).toBeInTheDocument();
    }, { timeout: 3000 });
  },
};

// Story with responsive item count
export const ResponsiveItemCount: Story = {
  args: {
    featuredProducts: createFeaturedProducts(12),
  },
  render: (args) => (
    <div className="space-y-4">
      <div className="container mx-auto px-4 py-4">
        <h3 className="text-lg font-semibold mb-4">Responsive Layout</h3>
        <div className="text-sm text-muted-foreground space-y-2 mb-4">
          <p>• Mobile: 1 product per view</p>
          <p>• Tablet: 2 products per view</p>
          <p>• Desktop: 3 products per view</p>
          <p>• Large Desktop: 4 products per view</p>
          <p className="font-medium">Resize your browser to see the layout adjust!</p>
        </div>
      </div>
      <FeaturedProducts {...args} />
    </div>
  ),
};