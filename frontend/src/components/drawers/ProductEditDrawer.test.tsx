import { render, screen } from '@testing-library/react';
import { ProductEditDrawer } from './ProductEditDrawer';
import { vi } from 'vitest';
import type { Product } from '@/types';

// Mock the useProductById hook with a simple implementation
vi.mock('@/hooks/migration/use-products-migration', () => ({
  useProductById: vi.fn(() => ({
    data: null,
    isLoading: false,
    error: null,
    isError: false,
    refetch: vi.fn(),
  })),
}));

// Mock the ProductForm component
vi.mock('@/components/forms/ProductForm', () => ({
  ProductForm: ({ mode, initialData, onSuccess }: { mode: string; initialData?: { name: string; variants?: any[] }; onSuccess: () => void }) => (
    <div data-testid="product-form">
      <div>Mode: {mode}</div>
      <div>Product: {initialData?.name}</div>
      <div>Variants: {initialData?.variants?.length ?? 0}</div>
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

// Mock the LoadingSpinner component
vi.mock('@/components/ui/LoadingSpinner', () => ({
  default: () => <div data-testid="loading-spinner">Loading...</div>,
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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders when open with product', () => {
    render(<ProductEditDrawer {...defaultProps} />);
    
    void expect(screen.getByTestId('drawer')).toBeInTheDocument();
    void expect(screen.getByText('Edit Product: Test Product')).toBeInTheDocument();
    void expect(screen.getByText('Update product details and save changes')).toBeInTheDocument();
    void expect(screen.getByTestId('product-form')).toBeInTheDocument();
  });

  it('does not render when product is null', () => {
    render(<ProductEditDrawer {...defaultProps} product={null} />);
    
    void expect(screen.queryByTestId('drawer')).not.toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<ProductEditDrawer {...defaultProps} isOpen={false} />);
    
    void expect(screen.queryByTestId('drawer')).not.toBeInTheDocument();
  });

  it('passes correct props to ProductForm', () => {
    render(<ProductEditDrawer {...defaultProps} />);
    
    const productForm = screen.getByTestId('product-form');
    void expect(productForm).toBeInTheDocument();
    void expect(screen.getByText('Mode: edit')).toBeInTheDocument();
    void expect(screen.getByText('Product: Test Product')).toBeInTheDocument();
  });

  it('calls onClose when form submission is successful', () => {
    const onClose = vi.fn();
    render(<ProductEditDrawer {...defaultProps} onClose={onClose} />);
    
    const saveButton = screen.getByText('Save Product');
    saveButton.click();
    
    void expect(onClose).toHaveBeenCalledTimes(1);
  });
});