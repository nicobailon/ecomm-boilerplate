import type { Meta, StoryObj } from '@storybook/react-vite';
import { CheckoutCallout } from './CheckoutCallout';
import { MemoryRouter } from 'react-router-dom';
import { within, userEvent, expect } from '@storybook/test';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const meta: Meta<typeof CheckoutCallout> = {
  title: 'UI/CheckoutCallout',
  component: CheckoutCallout,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <MemoryRouter>
        <div style={{ minHeight: '200px', position: 'relative' }}>
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    autoCloseDelay: 0,
  },
};

export const AutoClose: Story = {
  args: {
    autoCloseDelay: 5000,
  },
};

export const WithCloseCallback: Story = {
  args: {
    onClose: () => console.log('Callout closed'),
    autoCloseDelay: 0,
  },
};

export const SuccessCallout: Story = {
  render: () => (
    <div className="fixed bottom-4 right-4 z-50 w-full max-w-sm bg-white rounded-lg shadow-lg border border-green-200">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">
              Order placed successfully!
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Your order #12345 is being processed.
            </p>
            
            <div className="flex gap-3 mt-3">
              <Link
                to="/orders"
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white 
                  bg-green-600 rounded-md hover:bg-green-700 transition-colors"
              >
                View Order
              </Link>
              <button
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 
                  bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          </div>
          
          <button
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  ),
};

export const WarningCallout: Story = {
  render: () => (
    <div className="fixed bottom-4 right-4 z-50 w-full max-w-sm bg-white rounded-lg shadow-lg border border-amber-200">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">
              Low stock warning
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Only 2 items left in stock. Complete your purchase soon!
            </p>
            
            <div className="flex gap-3 mt-3">
              <Link
                to="/checkout"
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white 
                  bg-amber-600 rounded-md hover:bg-amber-700 transition-colors"
              >
                Checkout Now
              </Link>
              <button
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 
                  bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
          
          <button
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  ),
};

export const InfoCallout: Story = {
  render: () => (
    <div className="fixed bottom-4 right-4 z-50 w-full max-w-sm bg-white rounded-lg shadow-lg border border-blue-200">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <Info className="w-5 h-5 text-blue-600" />
          </div>
          
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">
              Free shipping available
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Add $25 more to your cart for free shipping!
            </p>
            
            <div className="flex gap-3 mt-3">
              <Link
                to="/shop"
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white 
                  bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
              >
                Keep Shopping
              </Link>
              <button
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 
                  bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
          
          <button
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  ),
};

export const ErrorCallout: Story = {
  render: () => (
    <div className="fixed bottom-4 right-4 z-50 w-full max-w-sm bg-white rounded-lg shadow-lg border border-red-200">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>
          
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">
              Payment failed
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Your payment could not be processed. Please try again.
            </p>
            
            <div className="flex gap-3 mt-3">
              <Link
                to="/checkout/payment"
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white 
                  bg-red-600 rounded-md hover:bg-red-700 transition-colors"
              >
                Try Again
              </Link>
              <button
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 
                  bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Contact Support
              </button>
            </div>
          </div>
          
          <button
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  ),
};

export const MinimalCallout: Story = {
  render: () => (
    <div className="fixed bottom-4 right-4 z-50 w-full max-w-sm bg-white rounded-lg shadow-lg border border-gray-200">
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <p className="text-sm font-medium text-gray-900">
            Saved to wishlist
          </p>
        </div>
        
        <button
          className="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  ),
};

export const WithProgressBar: Story = {
  render: () => (
    <div className="fixed bottom-4 right-4 z-50 w-full max-w-sm bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <Info className="w-5 h-5 text-blue-600" />
          </div>
          
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">
              Processing your order...
            </p>
            <p className="text-sm text-gray-600 mt-1">
              This may take a few moments.
            </p>
          </div>
        </div>
      </div>
      
      <div className="h-1 bg-gray-200">
        <div className="h-full bg-blue-600 animate-pulse" style={{ width: '60%' }} />
      </div>
    </div>
  ),
};

export const MobileView: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  render: () => (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <div className="w-full bg-white rounded-lg shadow-lg border border-gray-200">
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                Item added to cart!
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Ready to checkout?
              </p>
              
              <div className="flex gap-3 mt-3">
                <Link
                  to="/cart"
                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white 
                    bg-primary rounded-md hover:bg-primary/90 transition-colors"
                >
                  View Cart
                </Link>
                <button
                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 
                    bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Continue
                </button>
              </div>
            </div>
            
            <button
              className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  ),
};

export const DarkMode: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
  },
  render: () => (
    <div className="dark">
      <div className="fixed bottom-4 right-4 z-50 w-full max-w-sm bg-gray-800 rounded-lg shadow-lg border border-gray-700">
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-100">
                Item added to cart!
              </p>
              <p className="text-sm text-gray-300 mt-1">
                Ready to checkout?
              </p>
              
              <div className="flex gap-3 mt-3">
                <Link
                  to="/cart"
                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white 
                    bg-primary rounded-md hover:bg-primary/90 transition-colors"
                >
                  View Cart
                </Link>
                <button
                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-300 
                    bg-gray-700 rounded-md hover:bg-gray-600 transition-colors"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
            
            <button
              className="flex-shrink-0 text-gray-500 hover:text-gray-300 transition-colors"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  ),
};

export const CloseInteraction: Story = {
  args: {
    autoCloseDelay: 0,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    const closeButton = await canvas.findByLabelText('Close notification');
    await userEvent.click(closeButton);
    
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const callout = canvas.queryByRole('alert');
    await expect(callout).not.toBeInTheDocument();
  },
};

export const StackedCallouts: Story = {
  render: () => (
    <>
      <div className="fixed bottom-4 right-4 z-50 w-full max-w-sm space-y-2">
        <div className="bg-white rounded-lg shadow-lg border border-green-200 transform transition-all duration-300">
          <div className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-sm font-medium text-gray-900">
                First item added to cart
              </p>
              <button
                className="ml-auto text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg border border-green-200 transform transition-all duration-300">
          <div className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-sm font-medium text-gray-900">
                Second item added to cart
              </p>
              <button
                className="ml-auto text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  ),
};

export const CustomActionButtons: Story = {
  render: () => (
    <div className="fixed bottom-4 right-4 z-50 w-full max-w-sm bg-white rounded-lg shadow-lg border border-gray-200">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <Info className="w-5 h-5 text-blue-600" />
          </div>
          
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">
              Sale ends soon!
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Get 20% off all items. Offer expires in 2 hours.
            </p>
            
            <div className="flex gap-2 mt-3 flex-wrap">
              <Link
                to="/sale"
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white 
                  bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
              >
                Shop Sale
              </Link>
              <button
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 
                  border border-blue-600 rounded-md hover:bg-blue-50 transition-colors"
              >
                Set Reminder
              </button>
              <button
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 
                  bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Not Interested
              </button>
            </div>
          </div>
          
          <button
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  ),
};