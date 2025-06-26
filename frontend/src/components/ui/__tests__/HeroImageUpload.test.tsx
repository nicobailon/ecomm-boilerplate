import { render, screen } from '@testing-library/react';
import { HeroImageUpload } from '../HeroImageUpload';

describe('HeroImageUpload', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('renders upload dropzone when no image is provided', () => {
    render(<HeroImageUpload onChange={mockOnChange} />);
    
    expect(screen.getByText('Choose hero image or drag and drop')).toBeInTheDocument();
    expect(screen.getByText('PNG, JPG, JPEG, WEBP (max 4MB)')).toBeInTheDocument();
  });

  it('renders image preview when image URL is provided', () => {
    const imageUrl = 'https://example.com/hero-image.jpg';
    render(<HeroImageUpload value={imageUrl} onChange={mockOnChange} />);
    
    const image = screen.getByAltText('Hero banner preview');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', imageUrl);
    
    const removeButton = screen.getByText('Remove');
    expect(removeButton).toBeInTheDocument();
  });

  it('hides remove button when disabled', () => {
    const imageUrl = 'https://example.com/hero-image.jpg';
    render(<HeroImageUpload value={imageUrl} onChange={mockOnChange} disabled />);
    
    expect(screen.queryByText('Remove')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <HeroImageUpload onChange={mockOnChange} className="custom-class" />,
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });
});