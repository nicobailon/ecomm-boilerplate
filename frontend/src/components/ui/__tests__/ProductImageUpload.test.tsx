import { render, screen } from '@testing-library/react';
import { ProductImageUpload } from '../ProductImageUpload';

describe('ProductImageUpload', () => {
  const mockOnChange = vi.fn();
  const mockOnImagePreviewChange = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
    mockOnImagePreviewChange.mockClear();
  });

  it('renders upload dropzone when no image is provided', () => {
    render(<ProductImageUpload onChange={mockOnChange} />);
    
    expect(screen.getByText('Choose product image or drag and drop')).toBeInTheDocument();
    expect(screen.getByText('PNG, JPG, JPEG, WEBP (max 4MB)')).toBeInTheDocument();
    expect(screen.getByText('or')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter image URL manually')).toBeInTheDocument();
  });

  it('renders image preview when image URL is provided', () => {
    const imageUrl = 'https://example.com/product-image.jpg';
    render(<ProductImageUpload value={imageUrl} onChange={mockOnChange} />);
    
    const image = screen.getByAltText('Product image preview');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', imageUrl);
    
    const changeButton = screen.getByText('Change Image');
    expect(changeButton).toBeInTheDocument();
  });

  it('hides change button when disabled', () => {
    const imageUrl = 'https://example.com/product-image.jpg';
    render(<ProductImageUpload value={imageUrl} onChange={mockOnChange} disabled />);
    
    expect(screen.queryByText('Change Image')).not.toBeInTheDocument();
  });

  it('hides manual input when showManualInput is false', () => {
    render(<ProductImageUpload onChange={mockOnChange} showManualInput={false} />);
    
    expect(screen.queryByText('or')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText('Enter image URL manually')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <ProductImageUpload onChange={mockOnChange} className="custom-class" />,
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('shows manual input by default', () => {
    render(<ProductImageUpload onChange={mockOnChange} />);
    
    expect(screen.getByText('or')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter image URL manually')).toBeInTheDocument();
  });
});