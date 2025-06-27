import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OrderProductsList } from './OrderProductsList';
import type { RouterOutputs } from '@/lib/trpc';

type OrderItem = RouterOutputs['order']['getById']['items'][0];

describe('OrderProductsList', () => {
  const mockItems: OrderItem[] = [
    {
      productId: 'prod1',
      name: 'Test Product 1',
      price: 99.99,
      quantity: 2,
      image: 'https://example.com/image1.jpg',
    },
    {
      productId: 'prod2',
      name: 'Test Product 2',
      price: 49.99,
      quantity: 1,
      image: 'https://example.com/image2.jpg',
    },
    {
      productId: 'prod3',
      name: 'Product with Long Name That Should Be Truncated',
      price: 199.99,
      quantity: 3,
      image: null,
    },
  ];

  describe('data display', () => {
    it('should render all order items', () => {
      render(<OrderProductsList items={mockItems} />);

      expect(screen.getByText('Test Product 1')).toBeInTheDocument();
      expect(screen.getByText('Test Product 2')).toBeInTheDocument();
      expect(screen.getByText('Product with Long Name That Should Be Truncated')).toBeInTheDocument();
    });

    it('should display product images', () => {
      render(<OrderProductsList items={mockItems} />);

      const images = screen.getAllByRole('img');
      expect(images[0]).toHaveAttribute('src', 'https://example.com/image1.jpg');
      expect(images[0]).toHaveAttribute('alt', 'Test Product 1');
      expect(images[1]).toHaveAttribute('src', 'https://example.com/image2.jpg');
      expect(images[1]).toHaveAttribute('alt', 'Test Product 2');
    });

    it('should show placeholder image when image is null', () => {
      render(<OrderProductsList items={mockItems} />);

      const images = screen.getAllByRole('img');
      expect(images[2]).toHaveAttribute('src', '/placeholder-product.png');
      expect(images[2]).toHaveAttribute('alt', 'Product with Long Name That Should Be Truncated');
    });

    it('should display prices formatted correctly', () => {
      render(<OrderProductsList items={mockItems} />);

      expect(screen.getByText('$99.99')).toBeInTheDocument();
      expect(screen.getByText('$49.99')).toBeInTheDocument();
      expect(screen.getByText('$199.99')).toBeInTheDocument();
    });

    it('should display quantities', () => {
      render(<OrderProductsList items={mockItems} />);

      expect(screen.getByText('× 2')).toBeInTheDocument();
      expect(screen.getByText('× 1')).toBeInTheDocument();
      expect(screen.getByText('× 3')).toBeInTheDocument();
    });

    it('should calculate and display line totals', () => {
      render(<OrderProductsList items={mockItems} />);

      expect(screen.getByText('$199.98')).toBeInTheDocument(); // 99.99 * 2
      expect(screen.getByText('$49.99')).toBeInTheDocument(); // 49.99 * 1
      expect(screen.getByText('$599.97')).toBeInTheDocument(); // 199.99 * 3
    });

    it('should display total at the bottom', () => {
      render(<OrderProductsList items={mockItems} />);

      const total = 199.98 + 49.99 + 599.97;
      expect(screen.getByText('Total')).toBeInTheDocument();
      expect(screen.getByText(`$${total.toFixed(2)}`)).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle empty items array', () => {
      render(<OrderProductsList items={[]} />);

      expect(screen.getByText('No items in this order')).toBeInTheDocument();
    });

    it('should handle items with zero quantity', () => {
      const itemsWithZero: OrderItem[] = [
        {
          productId: 'prod1',
          name: 'Zero Quantity Product',
          price: 50,
          quantity: 0,
          image: null,
        },
      ];

      render(<OrderProductsList items={itemsWithZero} />);

      expect(screen.getByText('Zero Quantity Product')).toBeInTheDocument();
      expect(screen.getByText('× 0')).toBeInTheDocument();
      expect(screen.getByText('$0.00')).toBeInTheDocument();
    });

    it('should handle very large prices', () => {
      const expensiveItems: OrderItem[] = [
        {
          productId: 'prod1',
          name: 'Expensive Product',
          price: 999999.99,
          quantity: 2,
          image: null,
        },
      ];

      render(<OrderProductsList items={expensiveItems} />);

      expect(screen.getByText('$999,999.99')).toBeInTheDocument();
      expect(screen.getByText('$1,999,999.98')).toBeInTheDocument();
    });

    it('should handle decimal quantities', () => {
      const decimalItems: OrderItem[] = [
        {
          productId: 'prod1',
          name: 'Product sold by weight',
          price: 10.50,
          quantity: 2.5,
          image: null,
        },
      ];

      render(<OrderProductsList items={decimalItems} />);

      expect(screen.getByText('× 2.5')).toBeInTheDocument();
      expect(screen.getByText('$26.25')).toBeInTheDocument();
    });

    it('should handle missing product names gracefully', () => {
      const itemsWithoutName: OrderItem[] = [
        {
          productId: 'prod1',
          name: '',
          price: 50,
          quantity: 1,
          image: null,
        },
      ];

      render(<OrderProductsList items={itemsWithoutName} />);

      expect(screen.getByText('Unknown Product')).toBeInTheDocument();
    });

    it('should truncate very long product names', () => {
      const longNameItems: OrderItem[] = [
        {
          productId: 'prod1',
          name: 'A'.repeat(100), // 100 character name
          price: 50,
          quantity: 1,
          image: null,
        },
      ];

      render(<OrderProductsList items={longNameItems} />);

      const productName = screen.getByTestId('product-name-prod1');
      expect(productName).toHaveClass('truncate');
      expect(productName).toHaveAttribute('title', 'A'.repeat(100));
    });
  });

  describe('layout and styling', () => {
    it('should have proper structure for each item', () => {
      render(<OrderProductsList items={mockItems.slice(0, 1)} />);

      const listItem = screen.getByTestId('order-item-prod1');
      expect(listItem).toHaveClass('flex', 'items-center', 'gap-4');

      const imageContainer = screen.getByTestId('product-image-container-prod1');
      expect(imageContainer).toHaveClass('w-16', 'h-16');

      const detailsContainer = screen.getByTestId('product-details-prod1');
      expect(detailsContainer).toHaveClass('flex-1');
    });

    it('should have divider between items', () => {
      render(<OrderProductsList items={mockItems} />);

      const dividers = screen.getAllByRole('separator');
      expect(dividers).toHaveLength(mockItems.length - 1);
    });

    it('should style the total section differently', () => {
      render(<OrderProductsList items={mockItems} />);

      const totalSection = screen.getByTestId('order-total-section');
      expect(totalSection).toHaveClass('border-t', 'pt-4', 'mt-4');
      expect(totalSection.querySelector('.font-semibold')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper alt text for images', () => {
      render(<OrderProductsList items={mockItems} />);

      const images = screen.getAllByRole('img');
      images.forEach((img, index) => {
        expect(img).toHaveAttribute('alt', mockItems[index].name);
      });
    });

    it('should use semantic HTML', () => {
      render(<OrderProductsList items={mockItems} />);

      expect(screen.getByRole('list')).toBeInTheDocument();
      const listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(mockItems.length);
    });

    it('should have proper heading hierarchy', () => {
      render(<OrderProductsList items={mockItems} />);

      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent('Order Items');
    });
  });
});

// Type-level tests
type AssertEqual<T, U> = T extends U ? (U extends T ? true : false) : false;

// Test that OrderProductsList props are properly typed
type TestOrderProductsListProps = AssertEqual<
  Parameters<typeof OrderProductsList>[0],
  {
    items: OrderItem[];
  }
>;

const _testOrderProductsListProps: TestOrderProductsListProps = true;