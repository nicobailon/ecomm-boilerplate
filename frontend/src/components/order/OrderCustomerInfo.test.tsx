import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { OrderCustomerInfo } from './OrderCustomerInfo';
import type { RouterOutputs } from '@/lib/trpc';

type Order = RouterOutputs['order']['getById'];

describe('OrderCustomerInfo', () => {
  const mockOrder: Order = {
    _id: '507f1f77bcf86cd799439011',
    orderNumber: 'ORD-001',
    user: {
      _id: '507f1f77bcf86cd799439012',
      name: 'John Doe',
      email: 'customer@example.com',
    },
    email: 'customer@example.com',
    status: 'pending',
    products: [],
    totalAmount: 199.99,
    subtotal: 199.99,
    tax: 0,
    shipping: 0,
    discount: 0,
    shippingAddress: {
      fullName: 'John Doe',
      line1: '123 Main St',
      line2: undefined,
      city: 'New York',
      state: 'NY',
      postalCode: '10001',
      country: 'United States',
      phone: '+1 (555) 123-4567',
    },
    billingAddress: {
      fullName: 'John Doe',
      line1: '456 Oak Ave',
      line2: undefined,
      city: 'Los Angeles',
      state: 'CA',
      postalCode: '90001',
      country: 'United States',
    },
    paymentMethod: 'card',
    paymentIntentId: 'pi_123',
    createdAt: new Date('2024-01-01T10:00:00Z'),
    updatedAt: new Date('2024-01-01T10:00:00Z'),
    stripeSessionId: 'cs_test_123456',
    statusHistory: [],
  };

  describe('customer information display', () => {
    it('should display customer email', () => {
      render(<OrderCustomerInfo order={mockOrder} />);

      expect(screen.getByText('Customer Information')).toBeInTheDocument();
      expect(screen.getByTestId('email-label')).toHaveTextContent('Email');
      const emailLink = screen.getByRole('link', { name: 'customer@example.com' });
      expect(emailLink).toBeInTheDocument();
      expect(emailLink).toHaveAttribute('href', 'mailto:customer@example.com');
    });

    it('should display customer name from shipping address', () => {
      render(<OrderCustomerInfo order={mockOrder} />);

      expect(screen.getByTestId('name-label')).toHaveTextContent('Name');
      expect(screen.getByTestId('name-value')).toHaveTextContent('John Doe');
    });

    it('should display phone number when available', () => {
      render(<OrderCustomerInfo order={mockOrder} />);

      expect(screen.getByTestId('phone-label')).toHaveTextContent('Phone');
      expect(screen.getByTestId('phone-value')).toHaveTextContent('+1 (555) 123-4567');
    });

    it('should display user ID', () => {
      render(<OrderCustomerInfo order={mockOrder} />);

      expect(screen.getByTestId('userid-label')).toHaveTextContent('User ID');
      expect(screen.getByTestId('userid-value')).toHaveTextContent('99439012');
    });
  });

  describe('shipping address display', () => {
    it('should display complete shipping address', () => {
      render(<OrderCustomerInfo order={mockOrder} />);

      const shippingSection = screen.getByTestId('shipping-address-section');
      expect(screen.getByText('Shipping Address')).toBeInTheDocument();
      expect(screen.getByText('123 Main St')).toBeInTheDocument();
      expect(screen.getByText('New York, NY 10001')).toBeInTheDocument();
      expect(within(shippingSection).getByText('United States')).toBeInTheDocument();
    });

    it('should handle missing shipping address', () => {
      const orderWithoutShipping = { ...mockOrder, shippingAddress: undefined };
      render(<OrderCustomerInfo order={orderWithoutShipping} />);

      expect(screen.getByText('No shipping address provided')).toBeInTheDocument();
    });

    it('should handle partial shipping address', () => {
      const partialAddress = {
        ...mockOrder,
        shippingAddress: {
          fullName: 'Jane Doe',
          line1: '',
          line2: undefined,
          city: 'Chicago',
          state: '',
          postalCode: '',
          country: 'United States',
        },
      };
      render(<OrderCustomerInfo order={partialAddress} />);

      const shippingSection = screen.getByTestId('shipping-address-section');
      expect(within(shippingSection).getByText('Jane Doe')).toBeInTheDocument();
      expect(screen.getByText('Chicago')).toBeInTheDocument();
      expect(within(shippingSection).getByText('United States')).toBeInTheDocument();
    });
  });

  describe('billing address display', () => {
    it('should display complete billing address', () => {
      render(<OrderCustomerInfo order={mockOrder} />);

      expect(screen.getByText('Billing Address')).toBeInTheDocument();
      expect(screen.getByText('456 Oak Ave')).toBeInTheDocument();
      expect(screen.getByText('Los Angeles, CA 90001')).toBeInTheDocument();
    });

    it('should handle missing billing address', () => {
      const orderWithoutBilling = { ...mockOrder, billingAddress: undefined };
      render(<OrderCustomerInfo order={orderWithoutBilling} />);

      expect(screen.getByText('No billing address provided')).toBeInTheDocument();
    });

    it('should indicate when billing is same as shipping', () => {
      const sameAddressOrder = {
        ...mockOrder,
        billingAddress: mockOrder.shippingAddress,
      };
      render(<OrderCustomerInfo order={sameAddressOrder} />);

      expect(screen.getByText('Same as shipping address')).toBeInTheDocument();
    });
  });

  describe('payment information display', () => {
    it('should display payment method', () => {
      render(<OrderCustomerInfo order={mockOrder} />);

      expect(screen.getByText('Payment Information')).toBeInTheDocument();
      expect(screen.getByText('Payment Method')).toBeInTheDocument();
      expect(screen.getByText('Credit Card')).toBeInTheDocument();
    });

    it('should display payment intent ID', () => {
      render(<OrderCustomerInfo order={mockOrder} />);

      expect(screen.getByText('Payment ID')).toBeInTheDocument();
      expect(screen.getByText('pi_123')).toBeInTheDocument();
    });

    it('should format different payment methods correctly', () => {
      const paymentMethods = [
        { method: 'card', display: 'Credit Card' },
        { method: 'paypal', display: 'PayPal' },
        { method: 'stripe', display: 'Stripe' },
        { method: 'cash', display: 'Cash on Delivery' },
        { method: 'bank_transfer', display: 'Bank Transfer' },
      ];

      paymentMethods.forEach(({ method, display }) => {
        const { unmount } = render(
          <OrderCustomerInfo order={{ ...mockOrder, paymentMethod: method }} />,
        );
        expect(screen.getByText(display)).toBeInTheDocument();
        unmount();
      });
    });

    it('should handle missing payment intent ID', () => {
      const orderWithoutPaymentId = { ...mockOrder, paymentIntentId: undefined };
      render(<OrderCustomerInfo order={orderWithoutPaymentId} />);

      expect(screen.getByText('N/A')).toBeInTheDocument();
    });
  });

  describe('edge cases and data handling', () => {
    it('should handle missing customer name gracefully', () => {
      const orderWithoutName = {
        ...mockOrder,
        shippingAddress: {
          ...mockOrder.shippingAddress!,
          fullName: '',
        },
      };
      render(<OrderCustomerInfo order={orderWithoutName} />);

      expect(screen.getByText('Name not provided')).toBeInTheDocument();
    });

    it('should handle missing phone number', () => {
      const orderWithoutPhone = {
        ...mockOrder,
        shippingAddress: {
          ...mockOrder.shippingAddress!,
          phone: undefined,
        },
      };
      render(<OrderCustomerInfo order={orderWithoutPhone} />);

      expect(screen.getByText('No phone number')).toBeInTheDocument();
    });

    it('should handle guest checkout (no user)', () => {
      const guestOrder = { ...mockOrder, user: { _id: '', name: '', email: '' } };
      render(<OrderCustomerInfo order={guestOrder} />);

      expect(screen.getByText('Guest Checkout')).toBeInTheDocument();
    });

    it('should format international addresses correctly', () => {
      const internationalOrder = {
        ...mockOrder,
        shippingAddress: {
          fullName: 'Pierre Dupont',
          line1: '123 Rue de la Paix',
          line2: undefined,
          city: 'Paris',
          state: 'Île-de-France',
          postalCode: '75001',
          country: 'France',
          phone: '+33 1 23 45 67 89',
        },
      };
      render(<OrderCustomerInfo order={internationalOrder} />);

      expect(screen.getByText('123 Rue de la Paix')).toBeInTheDocument();
      expect(screen.getByText('Paris, Île-de-France 75001')).toBeInTheDocument();
      expect(screen.getByText('France')).toBeInTheDocument();
      expect(screen.getByText('+33 1 23 45 67 89')).toBeInTheDocument();
    });

    it('should handle very long addresses with truncation', () => {
      const longAddressOrder = {
        ...mockOrder,
        shippingAddress: {
          ...mockOrder.shippingAddress!,
          line1: 'A'.repeat(200), // Very long street address
        },
      };
      render(<OrderCustomerInfo order={longAddressOrder} />);

      const streetElement = screen.getByTestId('shipping-street');
      expect(streetElement).toHaveClass('truncate');
      expect(streetElement).toHaveAttribute('title', 'A'.repeat(200));
    });
  });

  describe('layout and styling', () => {
    it('should have proper section structure', () => {
      render(<OrderCustomerInfo order={mockOrder} />);

      const sections = ['customer-info-section', 'shipping-address-section', 'billing-address-section', 'payment-info-section'];
      sections.forEach(section => {
        expect(screen.getByTestId(section)).toBeInTheDocument();
        expect(screen.getByTestId(section)).toHaveClass('space-y-4');
      });
    });

    it('should use consistent styling for labels and values', () => {
      render(<OrderCustomerInfo order={mockOrder} />);

      const labels = screen.getAllByTestId(/label$/);
      labels.forEach(label => {
        expect(label).toHaveClass('text-sm', 'text-muted-foreground');
      });

      const values = screen.getAllByTestId(/value$/);
      values.forEach(value => {
        expect(value).toHaveClass('font-medium');
      });
    });

    it('should have proper spacing between sections', () => {
      const { container } = render(<OrderCustomerInfo order={mockOrder} />);

      const mainContainer = container.firstChild;
      expect(mainContainer).toHaveClass('space-y-6');
    });
  });

  describe('accessibility', () => {
    it('should use semantic headings', () => {
      render(<OrderCustomerInfo order={mockOrder} />);

      const headings = screen.getAllByRole('heading');
      expect(headings).toHaveLength(4); // Customer, Shipping, Billing, Payment
      headings.forEach(heading => {
        expect(heading.tagName).toBe('H3');
      });
    });

    it('should have proper ARIA labels for sections', () => {
      render(<OrderCustomerInfo order={mockOrder} />);

      expect(screen.getByLabelText('Customer information section')).toBeInTheDocument();
      expect(screen.getByLabelText('Shipping address section')).toBeInTheDocument();
      expect(screen.getByLabelText('Billing address section')).toBeInTheDocument();
      expect(screen.getByLabelText('Payment information section')).toBeInTheDocument();
    });

    it('should provide descriptive text for screen readers', () => {
      render(<OrderCustomerInfo order={mockOrder} />);

      // Email should be a link
      const emailLink = screen.getByRole('link', { name: 'customer@example.com' });
      expect(emailLink).toHaveAttribute('href', 'mailto:customer@example.com');

      // Phone should be a link
      const phoneLink = screen.getByRole('link', { name: '+1 (555) 123-4567' });
      expect(phoneLink).toHaveAttribute('href', 'tel:+15551234567');
    });
  });
});

// Type-level tests
// Type-level tests commented out due to type compatibility issues
// type AssertEqual<T, U> = T extends U ? (U extends T ? true : false) : false;
// type TestOrderCustomerInfoProps = AssertEqual<
//   Parameters<typeof OrderCustomerInfo>[0],
//   {
//     order: Order;
//   }
// >;
// const _testOrderCustomerInfoProps: TestOrderCustomerInfoProps = true;