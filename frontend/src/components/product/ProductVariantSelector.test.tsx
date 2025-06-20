import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductVariantSelector } from './ProductVariantSelector';

describe('ProductVariantSelector', () => {
  const mockVariants = [
    {
      variantId: 'v1',
      label: 'Small Black',
      color: '#000000',
      price: 29.99,
      inventory: 10,
      images: [],
      sku: 'TEST-S-BLACK',
    },
    {
      variantId: 'v2',
      label: 'Medium Black',
      color: '#000000',
      price: 29.99,
      inventory: 0,
      images: [],
      sku: 'TEST-M-BLACK',
    },
    {
      variantId: 'v3',
      label: 'Small White',
      color: '#FFFFFF',
      price: 34.99,
      inventory: 5,
      images: [],
      sku: 'TEST-S-WHITE',
    },
    {
      variantId: 'v4',
      label: 'Large',
      price: 29.99,
      inventory: 15,
      images: [],
    },
  ];

  const mockOnSelect = vi.fn();

  beforeEach(() => {
    mockOnSelect.mockClear();
  });

  it('renders variant options', () => {
    render(
      <ProductVariantSelector
        variants={mockVariants}
        selectedVariant={null}
        onVariantSelect={mockOnSelect}
        basePrice={29.99}
      />,
    );

    expect(screen.getByText('Variants')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Small Black/ })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Medium Black.*Out of stock/ })).toBeInTheDocument();
  });

  it('shows color swatches for variants with colors', () => {
    render(
      <ProductVariantSelector
        variants={mockVariants}
        selectedVariant={null}
        onVariantSelect={mockOnSelect}
        basePrice={29.99}
      />,
    );

    // Color swatches should be rendered for variants with color property
    const colorSwatches = screen.getAllByTitle(/Color:/);
    expect(colorSwatches).toHaveLength(3); // Only 3 variants have colors
  });

  it('disables out of stock variants', () => {
    render(
      <ProductVariantSelector
        variants={mockVariants}
        selectedVariant={mockVariants[0]}
        onVariantSelect={mockOnSelect}
        basePrice={29.99}
      />,
    );

    const outOfStockButton = screen.getByRole('radio', { name: /Medium Black.*Out of stock/ });
    expect(outOfStockButton).toBeDisabled();
  });

  it('calls onVariantSelect when variant is clicked', async () => {
    render(
      <ProductVariantSelector
        variants={mockVariants}
        selectedVariant={null}
        onVariantSelect={mockOnSelect}
        basePrice={29.99}
      />,
    );

    const variantButton = screen.getByRole('radio', { name: /Small Black/ });
    fireEvent.click(variantButton);

    // Wait for the simulated loading to complete
    await waitFor(() => {
      expect(mockOnSelect).toHaveBeenCalledWith(mockVariants[0]);
    });
  });

  it('shows inventory status for selected variant', () => {
    render(
      <ProductVariantSelector
        variants={mockVariants}
        selectedVariant={mockVariants[2]}
        onVariantSelect={mockOnSelect}
        basePrice={29.99}
      />,
    );

    expect(screen.getByText('Only 5 left!')).toBeInTheDocument();
    expect(screen.getByText('SKU: TEST-S-WHITE')).toBeInTheDocument();
  });

  it('shows price difference when variant price differs from base', () => {
    render(
      <ProductVariantSelector
        variants={mockVariants}
        selectedVariant={mockVariants[2]}
        onVariantSelect={mockOnSelect}
        basePrice={29.99}
      />,
    );

    expect(screen.getByText('$34.99')).toBeInTheDocument();
  });

  it('marks selected variant as checked', () => {
    render(
      <ProductVariantSelector
        variants={mockVariants}
        selectedVariant={mockVariants[0]}
        onVariantSelect={mockOnSelect}
        basePrice={29.99}
      />,
    );

    const selectedVariant = screen.getByRole('radio', { name: /Small Black/ });
    expect(selectedVariant).toHaveAttribute('aria-checked', 'true');
  });

  it('shows screen reader information about available variants', () => {
    render(
      <ProductVariantSelector
        variants={mockVariants}
        selectedVariant={null}
        onVariantSelect={mockOnSelect}
        basePrice={29.99}
      />,
    );

    // Check for screen reader only text
    expect(screen.getByText(/4 options available.*3 in stock/)).toBeInTheDocument();
  });

  it('handles focus and shows tooltips', () => {
    render(
      <ProductVariantSelector
        variants={mockVariants}
        selectedVariant={null}
        onVariantSelect={mockOnSelect}
        basePrice={29.99}
      />,
    );

    const variantButton = screen.getByRole('radio', { name: /Small Black/ });
    fireEvent.focus(variantButton);

    // Should show tooltip with inventory info
    expect(screen.getByRole('tooltip')).toHaveTextContent('10 in stock');
  });

  it('auto-selects first available variant on mount', () => {
    render(
      <ProductVariantSelector
        variants={mockVariants}
        selectedVariant={null}
        onVariantSelect={mockOnSelect}
        basePrice={29.99}
      />,
    );

    // Should auto-select the first in-stock variant (v1)
    expect(mockOnSelect).toHaveBeenCalledWith(mockVariants[0]);
  });

  describe('Keyboard Navigation', () => {
    it('supports arrow key navigation between variants', async () => {
      const user = userEvent.setup();
      
      render(
        <ProductVariantSelector
          variants={mockVariants}
          selectedVariant={mockVariants[0]}
          onVariantSelect={mockOnSelect}
          basePrice={29.99}
        />,
      );

      const firstVariant = screen.getByRole('radio', { name: /Small Black/ });
      const thirdVariant = screen.getByRole('radio', { name: /Small White/ });
      const lastVariant = screen.getByRole('radio', { name: /Large/ });

      // Focus first variant
      firstVariant.focus();
      expect(document.activeElement).toBe(firstVariant);

      // Tab to next variant
      await user.tab();
      // Skip out of stock variant
      await user.tab();
      expect(document.activeElement).toBe(thirdVariant);

      // Tab to last variant
      await user.tab();
      expect(document.activeElement).toBe(lastVariant);
    });

    it('allows selection via Enter key', async () => {
      const user = userEvent.setup();
      
      render(
        <ProductVariantSelector
          variants={mockVariants}
          selectedVariant={mockVariants[0]}
          onVariantSelect={mockOnSelect}
          basePrice={29.99}
        />,
      );

      const thirdVariant = screen.getByRole('radio', { name: /Small White/ });
      
      // Focus and select with Enter
      thirdVariant.focus();
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(mockOnSelect).toHaveBeenCalledWith(mockVariants[2]);
      });
    });

    it('allows selection via Space key', async () => {
      const user = userEvent.setup();
      
      render(
        <ProductVariantSelector
          variants={mockVariants}
          selectedVariant={mockVariants[0]}
          onVariantSelect={mockOnSelect}
          basePrice={29.99}
        />,
      );

      const lastVariant = screen.getByRole('radio', { name: /Large/ });
      
      // Focus and select with Space
      lastVariant.focus();
      await user.keyboard(' ');

      await waitFor(() => {
        expect(mockOnSelect).toHaveBeenCalledWith(mockVariants[3]);
      });
    });

    it('prevents selection of disabled variants via keyboard', async () => {
      const user = userEvent.setup();
      
      render(
        <ProductVariantSelector
          variants={mockVariants}
          selectedVariant={mockVariants[0]}
          onVariantSelect={mockOnSelect}
          basePrice={29.99}
        />,
      );

      const outOfStockVariant = screen.getByRole('radio', { name: /Medium Black.*Out of stock/ });
      
      // Try to select out of stock variant
      outOfStockVariant.focus();
      await user.keyboard('{Enter}');

      // Should not call onSelect for disabled variant
      expect(mockOnSelect).not.toHaveBeenCalledWith(mockVariants[1]);
    });

    it('maintains focus ring visibility', () => {
      render(
        <ProductVariantSelector
          variants={mockVariants}
          selectedVariant={mockVariants[0]}
          onVariantSelect={mockOnSelect}
          basePrice={29.99}
        />,
      );

      const firstVariant = screen.getByRole('radio', { name: /Small Black/ });
      
      // Simulate keyboard focus
      fireEvent.focus(firstVariant);
      
      // Check for focus ring classes
      expect(firstVariant).toHaveClass('focus:outline-none', 'focus:ring-2', 'focus:ring-primary');
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      render(
        <ProductVariantSelector
          variants={mockVariants}
          selectedVariant={mockVariants[0]}
          onVariantSelect={mockOnSelect}
          basePrice={29.99}
        />,
      );

      // Check radiogroup
      expect(screen.getByRole('radiogroup')).toBeInTheDocument();
      
      // Check individual radio buttons
      const radios = screen.getAllByRole('radio');
      expect(radios).toHaveLength(4);
      
      // Check aria-checked state
      expect(radios[0]).toHaveAttribute('aria-checked', 'true');
      expect(radios[2]).toHaveAttribute('aria-checked', 'false');
    });

    it('provides accessible color information', () => {
      render(
        <ProductVariantSelector
          variants={mockVariants}
          selectedVariant={null}
          onVariantSelect={mockOnSelect}
          basePrice={29.99}
        />,
      );

      // Check aria-label includes color information
      const blackVariant = screen.getByRole('radio', { name: /Small Black, color #000000/ });
      expect(blackVariant).toBeInTheDocument();
    });

    it('announces inventory status changes', () => {
      const { rerender } = render(
        <ProductVariantSelector
          variants={mockVariants}
          selectedVariant={mockVariants[0]}
          onVariantSelect={mockOnSelect}
          basePrice={29.99}
        />,
      );

      // Change selection to low stock variant
      rerender(
        <ProductVariantSelector
          variants={mockVariants}
          selectedVariant={mockVariants[2]}
          onVariantSelect={mockOnSelect}
          basePrice={29.99}
        />,
      );

      // Check for alert role on low stock message
      const lowStockAlert = screen.getByRole('alert');
      expect(lowStockAlert).toHaveTextContent('Only 5 left!');
    });

    it('provides tooltip descriptions for focused elements', () => {
      render(
        <ProductVariantSelector
          variants={mockVariants}
          selectedVariant={null}
          onVariantSelect={mockOnSelect}
          basePrice={29.99}
        />,
      );

      const variantButton = screen.getByRole('radio', { name: /Small Black/ });
      fireEvent.focus(variantButton);

      // Check aria-describedby is set
      const tooltipId = variantButton.getAttribute('aria-describedby');
      expect(tooltipId).toBeTruthy();
      
      // Check tooltip exists with proper role
      const tooltip = screen.getByRole('tooltip');
      expect(tooltip).toHaveAttribute('id', tooltipId);
      expect(tooltip).toHaveAttribute('aria-live', 'polite');
    });

    it('has minimum touch target size', () => {
      render(
        <ProductVariantSelector
          variants={mockVariants}
          selectedVariant={null}
          onVariantSelect={mockOnSelect}
          basePrice={29.99}
        />,
      );

      const variantButtons = screen.getAllByRole('radio');
      variantButtons.forEach(button => {
        expect(button).toHaveClass('min-w-[44px]', 'min-h-[44px]');
      });
    });
  });
});