import type { Meta, StoryObj } from '@storybook/react-vite';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { userEvent, within, expect } from '@storybook/test';
import { http, HttpResponse } from 'msw';
import OrderSummary from './OrderSummary';
import { trpc } from '@/lib/trpc';
import { createTRPCClient } from '@/lib/trpc-client';
import type { Product, Cart } from '@/types';
import { Toaster } from 'sonner';

// Mock Stripe
const mockStripe = {
  redirectToCheckout: async (params: { sessionId: string }) => {
    // Mock Stripe redirectToCheckout called using params.sessionId
    console.log('Redirecting to checkout with session:', params.sessionId);
    return { error: null };
  },
};

// Replace the Stripe import in the component with our mock
(window as any).Stripe = mockStripe;

// Mock product data
const mockProducts: Product[] = [
  {
    _id: 'prod1',
    name: 'Premium Wireless Headphones',
    description: 'High-quality noise-cancelling wireless headphones',
    price: 299.99,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500',
    isFeatured: true,
    slug: 'premium-wireless-headphones',
    inventory: 50,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'prod2',
    name: 'Organic Cotton T-Shirt',
    description: 'Comfortable and sustainable organic cotton t-shirt',
    price: 29.99,
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500',
    isFeatured: false,
    slug: 'organic-cotton-tshirt',
    inventory: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    _id: 'prod3',
    name: 'Smart Watch Ultra',
    description: 'Advanced fitness tracking smartwatch with GPS',
    price: 449.99,
    image: 'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=500',
    isFeatured: true,
    slug: 'smart-watch-ultra',
    inventory: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Helper to create cart data
const createCartData = (items: { product: Product; quantity: number; variantId?: string; variantDetails?: any }[], coupon?: { code: string; discountPercentage: number }): Cart => {
  const subtotal = items.reduce((sum, item) => {
    const price = item.variantDetails?.price ?? item.product.price;
    return sum + (price * item.quantity);
  }, 0);
  
  const discountAmount = coupon ? (subtotal * coupon.discountPercentage / 100) : 0;
  const totalAmount = subtotal - discountAmount;
  
  return {
    cartItems: items.map(item => ({
      product: item.product,
      quantity: item.quantity,
      variantId: item.variantId,
      variantDetails: item.variantDetails,
    })),
    subtotal,
    totalAmount,
    appliedCoupon: coupon || null,
  };
};

// Mock authentication states
const mockAuthUser = { _id: 'user1', name: 'John Doe', email: 'john@example.com', role: 'customer' as const, cartItems: [] };

// Create tRPC mock wrapper
const createMockTRPCWrapper = (cartData: Cart | null, isAuthenticated = true, isLoading = false) => {
  const MockTRPCWrapper = (Story: React.ComponentType) => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Set up query data
    if (!isLoading) {
      queryClient.setQueryData(['user'], isAuthenticated ? mockAuthUser : null);
      queryClient.setQueryData(['cart'], cartData);
      queryClient.setQueryData(['guestCart'], !isAuthenticated ? cartData : null);
    }

    return (
      <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <div className="max-w-md mx-auto p-4">
              <Story />
              <Toaster position="top-right" />
            </div>
          </BrowserRouter>
        </QueryClientProvider>
      </trpc.Provider>
    );
  };
  MockTRPCWrapper.displayName = 'MockTRPCWrapper';
  return MockTRPCWrapper;
};

const meta = {
  title: 'Cart/OrderSummary',
  component: OrderSummary,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof OrderSummary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const EmptyCart: Story = {
  decorators: [
    createMockTRPCWrapper(createCartData([]), true),
  ],
};

export const SingleItem: Story = {
  decorators: [
    createMockTRPCWrapper(
      createCartData([
        { product: mockProducts[0], quantity: 1 },
      ]),
      true,
    ),
  ],
};

export const MultipleItems: Story = {
  decorators: [
    createMockTRPCWrapper(
      createCartData([
        { product: mockProducts[0], quantity: 2 },
        { product: mockProducts[1], quantity: 3 },
      ]),
      true,
    ),
  ],
};

export const WithVariants: Story = {
  decorators: [
    createMockTRPCWrapper(
      createCartData([
        { 
          product: mockProducts[1], 
          quantity: 2,
          variantId: 'var1',
          variantDetails: {
            label: 'Size: Large, Color: Blue',
            size: 'Large',
            color: 'Blue',
            price: 34.99,
            sku: 'TSH-L-BLU',
          },
        },
        { 
          product: mockProducts[1], 
          quantity: 1,
          variantId: 'var2',
          variantDetails: {
            label: 'Size: Medium, Color: Black',
            size: 'Medium',
            color: 'Black',
            price: 32.99,
            sku: 'TSH-M-BLK',
          },
        },
      ]),
      true,
    ),
  ],
};

export const WithDiscount: Story = {
  decorators: [
    createMockTRPCWrapper(
      createCartData(
        [
          { product: mockProducts[0], quantity: 1 },
          { product: mockProducts[1], quantity: 2 },
        ],
        { code: 'SAVE20', discountPercentage: 20 },
      ),
      true,
    ),
  ],
};

export const LargeDiscount: Story = {
  decorators: [
    createMockTRPCWrapper(
      createCartData(
        [
          { product: mockProducts[0], quantity: 3 },
          { product: mockProducts[2], quantity: 1 },
        ],
        { code: 'HALFOFF', discountPercentage: 50 },
      ),
      true,
    ),
  ],
};

export const GuestUser: Story = {
  decorators: [
    createMockTRPCWrapper(
      createCartData([
        { product: mockProducts[0], quantity: 1 },
        { product: mockProducts[1], quantity: 2 },
      ]),
      false, // Guest user
    ),
  ],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Click checkout button
    const checkoutButton = canvas.getByRole('button', { name: /proceed to checkout/i });
    await userEvent.click(checkoutButton);
    
    // Toast notifications appear in document body, not canvas
    const body = within(document.body);
    await expect(body.getByText(/please login to proceed/i)).toBeInTheDocument();
  },
};

export const ProcessingState: Story = {
  decorators: [
    createMockTRPCWrapper(
      createCartData([
        { product: mockProducts[0], quantity: 1 },
      ]),
      true,
    ),
  ],
  parameters: {
    msw: {
      handlers: [
        http.post('/api/payments/create-checkout-session', async () => {
          // Simulate processing delay
          await new Promise(resolve => setTimeout(resolve, 2000));
          return HttpResponse.json({
            id: 'cs_test_123',
            adjustments: [],
          });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    const checkoutButton = canvas.getByRole('button', { name: /proceed to checkout/i });
    await userEvent.click(checkoutButton);
    
    // Should show loading state
    await expect(canvas.getByText(/processing/i)).toBeInTheDocument();
  },
};

export const InventoryAdjustment: Story = {
  decorators: [
    createMockTRPCWrapper(
      createCartData([
        { product: mockProducts[1], quantity: 10 }, // Requesting 10 but only 5 available
        { product: mockProducts[0], quantity: 2 },
      ]),
      true,
    ),
  ],
  parameters: {
    msw: {
      handlers: [
        http.post('/api/payments/create-checkout-session', () => {
          return HttpResponse.json({
            id: 'cs_test_adjusted',
            adjustments: [
              {
                productId: 'prod2',
                productName: 'Organic Cotton T-Shirt',
                requestedQuantity: 10,
                adjustedQuantity: 5,
                availableStock: 5,
              },
            ],
          });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    const checkoutButton = canvas.getByRole('button', { name: /proceed to checkout/i });
    await userEvent.click(checkoutButton);
    
    // Should show adjustment warning
    await expect(canvas.getByText(/cart adjusted for available inventory/i)).toBeInTheDocument();
    await expect(canvas.getByText(/quantity changed from 10 to 5/i)).toBeInTheDocument();
  },
};

export const VariantInventoryAdjustment: Story = {
  decorators: [
    createMockTRPCWrapper(
      createCartData([
        { 
          product: mockProducts[1], 
          quantity: 8,
          variantId: 'var1',
          variantDetails: {
            label: 'Size: Large, Color: Blue',
            size: 'Large',
            color: 'Blue',
            price: 34.99,
            sku: 'TSH-L-BLU',
          },
        },
      ]),
      true,
    ),
  ],
  parameters: {
    msw: {
      handlers: [
        http.post('/api/payments/create-checkout-session', () => {
          return HttpResponse.json({
            id: 'cs_test_variant_adjusted',
            adjustments: [
              {
                productId: 'prod2',
                productName: 'Organic Cotton T-Shirt',
                variantDetails: 'Size: Large, Color: Blue',
                requestedQuantity: 8,
                adjustedQuantity: 3,
                availableStock: 3,
              },
            ],
          });
        }),
      ],
    },
  },
};

export const PaymentError: Story = {
  decorators: [
    createMockTRPCWrapper(
      createCartData([
        { product: mockProducts[0], quantity: 1 },
      ]),
      true,
    ),
  ],
  parameters: {
    msw: {
      handlers: [
        http.post('/api/payments/create-checkout-session', () => {
          return HttpResponse.json(
            { 
              error: 'Payment processing failed. Please check your payment details and try again.', 
            },
            { status: 400 },
          );
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    const checkoutButton = canvas.getByRole('button', { name: /proceed to checkout/i });
    await userEvent.click(checkoutButton);
    
    // Toast notifications appear in document body
    const body = within(document.body);
    await expect(body.getByText(/payment processing failed/i)).toBeInTheDocument();
  },
};

export const ValidationError: Story = {
  decorators: [
    createMockTRPCWrapper(
      createCartData([
        { product: mockProducts[2], quantity: 1 }, // Out of stock item
      ]),
      true,
    ),
  ],
  parameters: {
    msw: {
      handlers: [
        http.post('/api/payments/create-checkout-session', () => {
          return HttpResponse.json(
            { 
              errors: [
                { field: 'products[0]', message: 'Product "Smart Watch Ultra" is out of stock' },
              ],
            },
            { status: 400 },
          );
        }),
      ],
    },
  },
};

export const StripeError: Story = {
  decorators: [
    createMockTRPCWrapper(
      createCartData([
        { product: mockProducts[0], quantity: 1 },
      ]),
      true,
    ),
  ],
  beforeEach: () => {
    // Override Stripe mock to return an error
    (window as any).Stripe = {
      redirectToCheckout: async () => ({
        error: { message: 'Your card was declined. Please use a different payment method.' },
      }),
    };
  },
};

export const LoadingState: Story = {
  decorators: [
    createMockTRPCWrapper(null, true, true), // Loading state
  ],
};

export const HighValueOrder: Story = {
  decorators: [
    createMockTRPCWrapper(
      createCartData([
        { product: mockProducts[0], quantity: 5 },
        { product: mockProducts[2], quantity: 3 },
      ]),
      true,
    ),
  ],
};

export const MobileView: Story = {
  decorators: [
    createMockTRPCWrapper(
      createCartData([
        { product: mockProducts[0], quantity: 1 },
        { product: mockProducts[1], quantity: 2 },
      ], { code: 'MOBILE10', discountPercentage: 10 }),
      true,
    ),
  ],
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

export const TabletView: Story = {
  decorators: [
    createMockTRPCWrapper(
      createCartData([
        { product: mockProducts[0], quantity: 2 },
      ]),
      true,
    ),
  ],
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};