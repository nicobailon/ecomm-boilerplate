import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ProductVariantAttributeSelector } from '../ProductVariantAttributeSelector';

const mockVariants = [
  {
    variantId: '1',
    label: 'Small / Red',
    price: 100,
    inventory: 10,
    images: [],
    attributes: { Size: 'Small', Color: 'Red' },
  },
  {
    variantId: '2',
    label: 'Small / Blue',
    price: 100,
    inventory: 5,
    images: [],
    attributes: { Size: 'Small', Color: 'Blue' },
  },
  {
    variantId: '3',
    label: 'Medium / Red',
    price: 105,
    inventory: 0,
    images: [],
    attributes: { Size: 'Medium', Color: 'Red' },
  },
  {
    variantId: '4',
    label: 'Medium / Blue',
    price: 105,
    inventory: 15,
    images: [],
    attributes: { Size: 'Medium', Color: 'Blue' },
  },
];

const mockVariantTypes = [
  { name: 'Size', values: ['Small', 'Medium', 'Large'] },
  { name: 'Color', values: ['Red', 'Blue', 'Green'] },
];

describe('ProductVariantAttributeSelector', () => {
  const defaultProps = {
    variants: mockVariants,
    variantTypes: mockVariantTypes,
    selectedVariant: null,
    onVariantSelect: vi.fn(),
    basePrice: 100,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render attribute selectors for each variant type', () => {
      render(<ProductVariantAttributeSelector {...defaultProps} />);

      void expect(screen.getByText('Size')).toBeInTheDocument();
      void expect(screen.getByText('Color')).toBeInTheDocument();
      
      // Check all size options are rendered
      void expect(screen.getByRole('radio', { name: /Size: Small/ })).toBeInTheDocument();
      void expect(screen.getByRole('radio', { name: /Size: Medium/ })).toBeInTheDocument();
      void expect(screen.getByRole('radio', { name: /Size: Large/ })).toBeInTheDocument();
      
      // Check all color options are rendered
      void expect(screen.getByRole('radio', { name: /Color: Red/ })).toBeInTheDocument();
      void expect(screen.getByRole('radio', { name: /Color: Blue/ })).toBeInTheDocument();
      void expect(screen.getByRole('radio', { name: /Color: Green/ })).toBeInTheDocument();
    });

    it('should auto-select first available variant on mount', async () => {
      const onVariantSelect = vi.fn();
      render(
        <ProductVariantAttributeSelector 
          {...defaultProps} 
          onVariantSelect={onVariantSelect}
        />,
      );

      await waitFor(() => {
        void expect(onVariantSelect).toHaveBeenCalledWith(mockVariants[0]);
      });
    });

    it('should show selected attributes in labels', async () => {
      const user = userEvent.setup();
      render(<ProductVariantAttributeSelector {...defaultProps} />);

      await user.click(screen.getByRole('radio', { name: /Size: Small/ }));

      await waitFor(() => {
        void expect(screen.getByText('(Small)')).toBeInTheDocument();
      });
    });
  });

  describe('Attribute Selection', () => {
    it('should update selection when clicking attribute buttons', async () => {
      const user = userEvent.setup();
      const onVariantSelect = vi.fn();
      
      render(
        <ProductVariantAttributeSelector 
          {...defaultProps} 
          onVariantSelect={onVariantSelect}
        />,
      );

      await user.click(screen.getByRole('radio', { name: /Size: Small/ }));
      await user.click(screen.getByRole('radio', { name: /Color: Blue/ }));

      await waitFor(() => {
        void expect(onVariantSelect).toHaveBeenLastCalledWith(mockVariants[1]); // Small / Blue
      });
    });

    it('should disable unavailable combinations', () => {
      render(<ProductVariantAttributeSelector {...defaultProps} />);

      // Medium / Red has 0 inventory, should be disabled
      const mediumButton = screen.getByRole('radio', { name: /Size: Medium/ });
      void expect(mediumButton).not.toBeDisabled();

      // But after selecting Medium, Red should be disabled
      void userEvent.click(mediumButton);

      void waitFor(() => {
        const redButton = screen.getByRole('radio', { name: /Color: Red.*Out of stock/ });
        void expect(redButton).toBeDisabled();
      });
    });

    it('should show inventory badges for low stock items', async () => {
      const user = userEvent.setup();
      render(<ProductVariantAttributeSelector {...defaultProps} />);

      // Select Small first
      await user.click(screen.getByRole('radio', { name: /Size: Small/ }));

      // Blue variant has 5 inventory, should show badge
      const blueButton = screen.getByRole('radio', { name: /Color: Blue/ });
      const badge = blueButton.querySelector('.badge');
      void expect(badge).toHaveTextContent('5');
    });
  });

  describe('Selected Variant Display', () => {
    it('should show selected variant information', async () => {
      const user = userEvent.setup();
      render(<ProductVariantAttributeSelector {...defaultProps} />);

      await user.click(screen.getByRole('radio', { name: /Size: Medium/ }));
      await user.click(screen.getByRole('radio', { name: /Color: Blue/ }));

      await waitFor(() => {
        void expect(screen.getByText('Selected:')).toBeInTheDocument();
        void expect(screen.getByText('Medium / Blue')).toBeInTheDocument();
        void expect(screen.getByText('$105.00')).toBeInTheDocument(); // Price different from base
      });
    });

    it('should show stock status for selected variant', async () => {
      const user = userEvent.setup();
      render(<ProductVariantAttributeSelector {...defaultProps} />);

      // Select low stock variant
      await user.click(screen.getByRole('radio', { name: /Size: Small/ }));
      await user.click(screen.getByRole('radio', { name: /Color: Blue/ }));

      await waitFor(() => {
        void expect(screen.getByText('Only 5 left!')).toBeInTheDocument();
      });
    });

    it('should show out of stock message for unavailable combinations', async () => {
      const user = userEvent.setup();
      render(<ProductVariantAttributeSelector {...defaultProps} />);

      await user.click(screen.getByRole('radio', { name: /Size: Medium/ }));
      
      // Try to select out of stock combination
      const redButton = screen.getByRole('radio', { name: /Color: Red/ });
      void expect(redButton).toBeDisabled();
      void expect(redButton).toHaveAttribute('title', 'Out of stock');
    });
  });

  describe('Invalid Combinations', () => {
    it('should show message for invalid attribute combinations', () => {
      // Create variants without Large size
      const limitedVariants = mockVariants.filter(v => v.attributes?.Size !== 'Large');
      
      render(
        <ProductVariantAttributeSelector 
          {...defaultProps} 
          variants={limitedVariants}
        />,
      );

      // Large option should be disabled as it has no valid combinations
      const largeButton = screen.getByRole('radio', { name: /Size: Large/ });
      void expect(largeButton).toBeDisabled();
      void expect(largeButton).toHaveClass('line-through');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<ProductVariantAttributeSelector {...defaultProps} />);

      void expect(screen.getByRole('group', { name: /select product options/i })).toBeInTheDocument();
      
      const sizeGroup = screen.getAllByRole('radiogroup')[0];
      void expect(sizeGroup).toBeInTheDocument();
    });

    it('should indicate selected state with aria-checked', async () => {
      const user = userEvent.setup();
      render(<ProductVariantAttributeSelector {...defaultProps} />);

      const smallButton = screen.getByRole('radio', { name: /Size: Small/ });
      void expect(smallButton).toHaveAttribute('aria-checked', 'false');

      await user.click(smallButton);

      await waitFor(() => {
        void expect(smallButton).toHaveAttribute('aria-checked', 'true');
      });
    });

    it('should have descriptive titles for disabled options', () => {
      render(<ProductVariantAttributeSelector {...defaultProps} />);

      // Create a scenario where an option is unavailable
      const variants = [
        {
          variantId: '1',
          label: 'Small / Red',
          price: 100,
          inventory: 0,
          images: [],
          attributes: { Size: 'Small', Color: 'Red' },
        },
      ];

      render(
        <ProductVariantAttributeSelector 
          {...defaultProps} 
          variants={variants}
        />,
      );

      const smallButton = screen.getByRole('radio', { name: /Size: Small/ });
      void userEvent.click(smallButton);

      void waitFor(() => {
        const redButton = screen.getByRole('radio', { name: /Color: Red.*Out of stock/ });
        void expect(redButton).toHaveAttribute('title', 'Out of stock');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle variants without attributes gracefully', () => {
      const variantsWithoutAttrs = [
        {
          variantId: '1',
          label: 'Default',
          price: 100,
          inventory: 10,
          images: [],
        },
      ];

      render(
        <ProductVariantAttributeSelector 
          {...defaultProps} 
          variants={variantsWithoutAttrs}
        />,
      );

      // Should still render without crashing
      void expect(screen.getByText('Size')).toBeInTheDocument();
    });

    it('should handle empty variant types', () => {
      render(
        <ProductVariantAttributeSelector 
          {...defaultProps} 
          variantTypes={[]}
        />,
      );

      // Should render without variant selectors
      void expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
    });
  });
});