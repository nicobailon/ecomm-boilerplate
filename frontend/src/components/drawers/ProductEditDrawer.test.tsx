import { render, screen } from '@testing-library/react';
import { ProductEditDrawer } from './ProductEditDrawer';
import { vi } from 'vitest';
import type { Product } from '@/types';

// Mock the ProductForm component
vi.mock('@/components/forms/ProductForm', () => ({
  ProductForm: ({ mode, initialData, onSuccess }: any) => (
    <div data-testid="product-form">
      <div>Mode: {mode}</div>
      <div>Product: {initialData?.name}</div>
      <button onClick={onSuccess}>Save Product</button>
    </div>
  ),
}));

// Mock the Drawer component to simplify testing
vi.mock('@/components/ui/Drawer', () => ({
  Drawer: ({ isOpen, children, title, description }: any) => 
    isOpen ? (
      <div data-testid="drawer">
        <h2>{title}</h2>
        <p>{description}</p>
        {children}
      </div>
    ) : null,
}));

describe('ProductEditDrawer', () => {
  const mockProduct: Product = {
    _id: '123',
    name: 'Test Product',
    description: 'Test description',
    price: 99.99,
    image: 'test.jpg',
    isFeatured: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const defaultProps = {
    isOpen: true,
    product: mockProduct,
    onClose: vi.fn(),
  };

  it('renders when open with product', () => {
    render(<ProductEditDrawer {...defaultProps} />);
    
    expect(screen.getByTestId('drawer')).toBeInTheDocument();
    expect(screen.getByText('Edit Product: Test Product')).toBeInTheDocument();
    expect(screen.getByText('Update product details and save changes')).toBeInTheDocument();
  });

  it('does not render when product is null', () => {
    render(<ProductEditDrawer {...defaultProps} product={null} />);
    
    expect(screen.queryByTestId('drawer')).not.toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<ProductEditDrawer {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByTestId('drawer')).not.toBeInTheDocument();
  });

  it('passes correct props to ProductForm', () => {
    render(<ProductEditDrawer {...defaultProps} />);
    
    const productForm = screen.getByTestId('product-form');
    expect(productForm).toBeInTheDocument();
    expect(screen.getByText('Mode: edit')).toBeInTheDocument();
    expect(screen.getByText('Product: Test Product')).toBeInTheDocument();
  });

  it('calls onClose when form submission is successful', async () => {
    const onClose = vi.fn();
    render(<ProductEditDrawer {...defaultProps} onClose={onClose} />);
    
    const saveButton = screen.getByText('Save Product');
    saveButton.click();
    
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});