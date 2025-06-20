import { render, screen, fireEvent } from '@testing-library/react';
import { ProductImageGallery } from './ProductImageGallery';

describe('ProductImageGallery', () => {
  const mockImages = [
    'https://example.com/image1.jpg',
    'https://example.com/image2.jpg',
    'https://example.com/image3.jpg',
  ];

  it('renders single image when only one provided', () => {
    render(
      <ProductImageGallery 
        images={['https://example.com/single.jpg']} 
        productName="Test Product" 
      />,
    );

    expect(screen.getByAltText('Test Product - Image 1')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /View image/ })).not.toBeInTheDocument();
  });

  it('renders multiple images with thumbnails', () => {
    render(
      <ProductImageGallery 
        images={mockImages} 
        productName="Test Product" 
      />,
    );

    expect(screen.getByAltText('Test Product - Image 1')).toBeInTheDocument();
    
    const thumbnails = screen.getAllByRole('button', { name: /View image/ });
    expect(thumbnails).toHaveLength(3);
  });

  it('changes main image when thumbnail is clicked', () => {
    render(
      <ProductImageGallery 
        images={mockImages} 
        productName="Test Product" 
      />,
    );

    const secondThumbnail = screen.getByRole('button', { name: 'View image 2' });
    fireEvent.click(secondThumbnail);

    expect(screen.getByAltText('Test Product - Image 2')).toBeInTheDocument();
    expect(secondThumbnail).toHaveAttribute('aria-current', 'true');
  });

  it('shows placeholder when no images provided', () => {
    render(
      <ProductImageGallery 
        images={[]} 
        productName="Test Product" 
      />,
    );

    expect(screen.getByText('No image available')).toBeInTheDocument();
  });

  it('renders mobile dots indicator on small screens', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    render(
      <ProductImageGallery 
        images={mockImages} 
        productName="Test Product" 
      />,
    );

    const dots = screen.getAllByRole('button', { name: /Go to image/ });
    expect(dots).toHaveLength(3);
  });
});