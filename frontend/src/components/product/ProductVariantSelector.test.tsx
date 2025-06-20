import { render, screen, fireEvent } from '@testing-library/react';
import { ProductVariantSelector } from './ProductVariantSelector';

describe('ProductVariantSelector', () => {
  const mockVariants = [
    {
      variantId: 'v1',
      size: 'S' as const,
      color: '#000000',
      price: 29.99,
      inventory: 10,
      images: [],
      sku: 'TEST-S-BLACK',
    },
    {
      variantId: 'v2',
      size: 'M' as const,
      color: '#000000',
      price: 29.99,
      inventory: 0,
      images: [],
      sku: 'TEST-M-BLACK',
    },
    {
      variantId: 'v3',
      size: 'S' as const,
      color: '#FFFFFF',
      price: 34.99,
      inventory: 5,
      images: [],
      sku: 'TEST-S-WHITE',
    },
  ];

  const mockOnSelect = vi.fn();

  beforeEach(() => {
    mockOnSelect.mockClear();
  });

  it('renders size options', () => {
    render(
      <ProductVariantSelector
        variants={mockVariants}
        selectedVariant={null}
        onVariantSelect={mockOnSelect}
        basePrice={29.99}
      />
    );

    expect(screen.getByText('Size')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Size S' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Size M (Out of stock)' })).toBeInTheDocument();
  });

  it('renders color options', () => {
    render(
      <ProductVariantSelector
        variants={mockVariants}
        selectedVariant={null}
        onVariantSelect={mockOnSelect}
        basePrice={29.99}
      />
    );

    expect(screen.getByText('Color')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Color #000000/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Color #FFFFFF/ })).toBeInTheDocument();
  });

  it('disables out of stock variants', () => {
    render(
      <ProductVariantSelector
        variants={mockVariants}
        selectedVariant={mockVariants[0]}
        onVariantSelect={mockOnSelect}
        basePrice={29.99}
      />
    );

    const outOfStockButton = screen.getByRole('button', { name: 'Size M (Out of stock)' });
    expect(outOfStockButton).toBeDisabled();
  });

  it('calls onVariantSelect when variant is clicked', () => {
    render(
      <ProductVariantSelector
        variants={mockVariants}
        selectedVariant={null}
        onVariantSelect={mockOnSelect}
        basePrice={29.99}
      />
    );

    const sizeButton = screen.getByRole('button', { name: 'Size S' });
    fireEvent.click(sizeButton);

    expect(mockOnSelect).toHaveBeenCalledWith(mockVariants[0]);
  });

  it('shows inventory status for selected variant', () => {
    render(
      <ProductVariantSelector
        variants={mockVariants}
        selectedVariant={mockVariants[2]}
        onVariantSelect={mockOnSelect}
        basePrice={29.99}
      />
    );

    expect(screen.getByText('Only 5 left in stock')).toBeInTheDocument();
    expect(screen.getByText('SKU: TEST-S-WHITE')).toBeInTheDocument();
  });

  it('shows price difference when variant price differs from base', () => {
    render(
      <ProductVariantSelector
        variants={mockVariants}
        selectedVariant={mockVariants[2]}
        onVariantSelect={mockOnSelect}
        basePrice={29.99}
      />
    );

    expect(screen.getByText('$34.99')).toBeInTheDocument();
  });

  it('marks selected variant as pressed', () => {
    render(
      <ProductVariantSelector
        variants={mockVariants}
        selectedVariant={mockVariants[0]}
        onVariantSelect={mockOnSelect}
        basePrice={29.99}
      />
    );

    const selectedSize = screen.getByRole('button', { name: 'Size S' });
    expect(selectedSize).toHaveAttribute('aria-pressed', 'true');
  });
});