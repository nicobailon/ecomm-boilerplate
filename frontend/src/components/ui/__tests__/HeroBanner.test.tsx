import { render, screen } from '@testing-library/react';
import { HeroBanner } from '../HeroBanner';

describe('HeroBanner', () => {
  const mockProps = {
    title: 'Test Hero Title',
    subtitle: 'Test hero subtitle',
    imageUrl: 'https://example.com/test-image.jpg',
  };

  it('renders hero banner with title and subtitle', () => {
    render(<HeroBanner {...mockProps} />);
    
    expect(screen.getByText('Test Hero Title')).toBeInTheDocument();
    expect(screen.getByText('Test hero subtitle')).toBeInTheDocument();
  });

  it('renders with button when provided', () => {
    render(
      <HeroBanner
        {...mockProps}
        buttonText="Shop Now"
        buttonUrl="/shop"
      />,
    );
    
    const button = screen.getByText('Shop Now');
    expect(button).toBeInTheDocument();
  });

  it('renders without subtitle when not provided', () => {
    render(<HeroBanner title="Title Only" imageUrl={mockProps.imageUrl} />);
    
    expect(screen.getByText('Title Only')).toBeInTheDocument();
    expect(screen.queryByText('Test hero subtitle')).not.toBeInTheDocument();
  });

  it('applies correct height classes', () => {
    const { container } = render(
      <HeroBanner {...mockProps} height="large" />,
    );
    
    const heroElement = container.firstChild as HTMLElement;
    expect(heroElement).toHaveClass('h-96', 'sm:h-[32rem]');
  });

  it('renders image with correct alt text', () => {
    render(<HeroBanner {...mockProps} />);
    
    const image = screen.getByAltText('Test Hero Title');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', mockProps.imageUrl);
  });
});