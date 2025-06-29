import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OrderProductsList } from './OrderProductsList';
import type { RouterOutputs } from '@/lib/trpc';

type OrderProduct = RouterOutputs['order']['getById']['products'][0];

describe('OrderProductsList', () => {
  const mockProducts: OrderProduct[] = [
    {
      product: {
        _id: 'prod1' ,
        name: 'Test Product 1',
        image: 'https://example.com/image1.jpg',
      },
      price: 99.99,
      quantity: 2,
      variantId: undefined,
      variantDetails: undefined,
      variantLabel: undefined,
    },
    {
      product: {
        _id: 'prod2' ,
        name: 'Test Product 2',
        image: 'https://example.com/image2.jpg',
      },
      price: 49.99,
      quantity: 1,
      variantId: undefined,
      variantDetails: undefined,
      variantLabel: undefined,
    },
    {
      product: {
        _id: 'prod3' ,
        name: 'Product with Long Name That Should Be Truncated',
        image: '' ,
      },
      price: 199.99,
      quantity: 3,
      variantId: undefined,
      variantDetails: undefined,
      variantLabel: undefined,
    },
  ];

  describe('data display', () => {
    it('should render all order items', () => {
      render(<OrderProductsList products={mockProducts} />);

      expect(screen.getByText('Test Product 1')).toBeInTheDocument();
      expect(screen.getByText('Test Product 2')).toBeInTheDocument();
      expect(screen.getByText('Product with Long Name That Should Be Truncated')).toBeInTheDocument();
    });

    it('should display product images', () => {
      render(<OrderProductsList products={mockProducts} />);

      const images = screen.getAllByRole('img');
      expect(images[0]).toHaveAttribute('src', 'https://example.com/image1.jpg');
      expect(images[0]).toHaveAttribute('alt', 'Test Product 1');
      expect(images[1]).toHaveAttribute('src', 'https://example.com/image2.jpg');
      expect(images[1]).toHaveAttribute('alt', 'Test Product 2');
    });

    it('should show placeholder image when image is null', () => {
      render(<OrderProductsList products={mockProducts} />);

      const images = screen.getAllByRole('img');
      expect(images[2]).toHaveAttribute('src', '/placeholder-product.png');
      expect(images[2]).toHaveAttribute('alt', 'Product with Long Name That Should Be Truncated');
    });

    it('should display prices formatted correctly', () => {
      render(<OrderProductsList products={mockProducts} />);

      expect(screen.getByText('$99.99 × 2')).toBeInTheDocument();
      expect(screen.getByText('$49.99 × 1')).toBeInTheDocument();
      expect(screen.getByText('$199.99 × 3')).toBeInTheDocument();
    });

    it('should display quantities', () => {
      render(<OrderProductsList products={mockProducts} />);

      expect(screen.getByText('$99.99 × 2')).toBeInTheDocument();
      expect(screen.getByText('$49.99 × 1')).toBeInTheDocument();
      expect(screen.getByText('$199.99 × 3')).toBeInTheDocument();
    });

    it('should calculate and display line totals', () => {
      render(<OrderProductsList products={mockProducts} />);

      expect(screen.getByText('$199.98')).toBeInTheDocument(); // 99.99 * 2
      expect(screen.getByText('$49.99')).toBeInTheDocument(); // 49.99 * 1
      expect(screen.getByText('$599.97')).toBeInTheDocument(); // 199.99 * 3
    });

    it('should display total at the bottom', () => {
      render(<OrderProductsList products={mockProducts} />);

      const total = 199.98 + 49.99 + 599.97;
      expect(screen.getByText('Total')).toBeInTheDocument();
      expect(screen.getByText(`$${total.toFixed(2)}`)).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle empty items array', () => {
      render(<OrderProductsList products={[]} />);

      expect(screen.getByText('No items in this order')).toBeInTheDocument();
    });

    it('should handle items with zero quantity', () => {
      const productsWithZero: OrderProduct[] = [
        {
          product: {
            _id: 'prod1' ,
            name: 'Zero Quantity Product',
            image: '' ,
          },
          price: 50,
          quantity: 0,
          variantId: undefined,
          variantDetails: undefined,
          variantLabel: undefined,
        },
      ];

      render(<OrderProductsList products={productsWithZero} />);

      expect(screen.getByText('Zero Quantity Product')).toBeInTheDocument();
      expect(screen.getByText('$50.00 × 0')).toBeInTheDocument();
      // Check both line total and order total
      const zeroDollarElements = screen.getAllByText('$0.00');
      expect(zeroDollarElements).toHaveLength(2); // One for line total, one for order total
    });

    it('should handle very large prices', () => {
      const expensiveProducts: OrderProduct[] = [
        {
          product: {
            _id: 'prod1' ,
            name: 'Expensive Product',
            image: '' ,
          },
          price: 999999.99,
          quantity: 2,
          variantId: undefined,
          variantDetails: undefined,
          variantLabel: undefined,
        },
      ];

      render(<OrderProductsList products={expensiveProducts} />);

      expect(screen.getByText('$999,999.99 × 2')).toBeInTheDocument();
      // Check both line total and order total
      const largeAmountElements = screen.getAllByText('$1,999,999.98');
      expect(largeAmountElements).toHaveLength(2); // One for line total, one for order total
    });

    it('should handle decimal quantities', () => {
      const decimalProducts: OrderProduct[] = [
        {
          product: {
            _id: 'prod1' ,
            name: 'Product sold by weight',
            image: '' ,
          },
          price: 10.50,
          quantity: 2.5,
          variantId: undefined,
          variantDetails: undefined,
          variantLabel: undefined,
        },
      ];

      render(<OrderProductsList products={decimalProducts} />);

      expect(screen.getByText('$10.50 × 2.5')).toBeInTheDocument();
      const totalSection = screen.getByTestId('order-total-section');
      expect(totalSection).toHaveTextContent('$26.25');
    });

    it('should handle missing product names gracefully', () => {
      const productsWithoutName: OrderProduct[] = [
        {
          product: {
            _id: 'prod1' ,
            name: '',
            image: '' ,
          },
          price: 50,
          quantity: 1,
          variantId: undefined,
          variantDetails: undefined,
          variantLabel: undefined,
        },
      ];

      render(<OrderProductsList products={productsWithoutName} />);

      expect(screen.getByText('Unknown Product')).toBeInTheDocument();
    });

    it('should truncate very long product names', () => {
      const longNameProducts: OrderProduct[] = [
        {
          product: {
            _id: 'prod1' ,
            name: 'A'.repeat(100), // 100 character name
            image: '' ,
          },
          price: 50,
          quantity: 1,
          variantId: undefined,
          variantDetails: undefined,
          variantLabel: undefined,
        },
      ];

      render(<OrderProductsList products={longNameProducts} />);

      const productName = screen.getByTestId('product-name-prod1');
      expect(productName).toHaveClass('truncate');
      expect(productName).toHaveAttribute('title', 'A'.repeat(100));
    });
  });

  describe('layout and styling', () => {
    it('should have proper structure for each item', () => {
      render(<OrderProductsList products={mockProducts.slice(0, 1)} />);

      const listItem = screen.getByTestId('order-item-prod1');
      expect(listItem).toHaveClass('flex', 'items-center', 'gap-4');

      const imageContainer = screen.getByTestId('product-image-container-prod1');
      expect(imageContainer).toHaveClass('w-16', 'h-16');

      const detailsContainer = screen.getByTestId('product-details-prod1');
      expect(detailsContainer).toHaveClass('flex-1');
    });

    it('should have divider between items', () => {
      render(<OrderProductsList products={mockProducts} />);

      const dividers = screen.getAllByRole('separator');
      expect(dividers).toHaveLength(mockProducts.length - 1);
    });

    it('should style the total section differently', () => {
      render(<OrderProductsList products={mockProducts} />);

      const totalSection = screen.getByTestId('order-total-section');
      expect(totalSection).toHaveClass('border-t', 'pt-4', 'mt-4', 'font-semibold');
      expect(screen.getByText('Total')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper alt text for images', () => {
      render(<OrderProductsList products={mockProducts} />);

      const images = screen.getAllByRole('img');
      images.forEach((img, index) => {
        expect(img).toHaveAttribute('alt', mockProducts[index].product.name);
      });
    });

    it('should use semantic HTML', () => {
      render(<OrderProductsList products={mockProducts} />);

      expect(screen.getByRole('list')).toBeInTheDocument();
      const listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(mockProducts.length);
    });

    it('should have proper heading hierarchy', () => {
      render(<OrderProductsList products={mockProducts} />);

      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent('Order Items');
    });
  });
});

