import type { Meta, StoryObj } from '@storybook/react-vite';
import { OptimizedImage } from './OptimizedImage';

const meta = {
  title: 'UI/Primitives/OptimizedImage',
  component: OptimizedImage,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
## OptimizedImage Component

The OptimizedImage component provides enhanced image loading with built-in lazy loading, error handling, and loading states. It ensures a smooth user experience when displaying images.

### When to use
- Product images in e-commerce
- User avatars and profile pictures
- Gallery or portfolio images
- Any image that benefits from loading states
- Images that might fail to load

### Best practices
- Always provide meaningful \`alt\` text for accessibility
- Use appropriate aspect ratios to prevent layout shift
- Provide a relevant fallback image
- Consider using smaller images for thumbnails
- Use lazy loading for below-the-fold images
- Optimize image file sizes before upload

### Accessibility notes
- Alt text is required and should be descriptive
- Decorative images should use empty alt text (\`alt=""\`)
- Loading states are announced to screen readers
- Ensure fallback images are also accessible
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    src: {
      control: 'text',
      description: 'The image source URL',
    },
    alt: {
      control: 'text',
      description: 'Alternative text for the image',
    },
    fallback: {
      control: 'text',
      description: 'Fallback image URL when main image fails',
    },
    aspectRatio: {
      control: 'number',
      description: 'Aspect ratio to maintain (e.g., 16/9)',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
  args: {
    src: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
    alt: 'Product image',
  },
} satisfies Meta<typeof OptimizedImage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    src: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
    alt: 'Modern watch on white background',
  },
};

export const WithAspectRatio: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <p className="text-sm font-medium mb-2">Square (1:1)</p>
        <OptimizedImage
          src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400"
          alt="Black over-ear headphones on yellow background"
          aspectRatio={1}
          className="rounded-lg"
        />
      </div>
      <div>
        <p className="text-sm font-medium mb-2">Landscape (16:9)</p>
        <OptimizedImage
          src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400"
          alt="Red Nike sneaker on pink background"
          aspectRatio={16/9}
          className="rounded-lg"
        />
      </div>
      <div>
        <p className="text-sm font-medium mb-2">Portrait (3:4)</p>
        <OptimizedImage
          src="https://images.unsplash.com/photo-1564466809058-bf4114d55352?w=400"
          alt="Vintage film camera with leather strap"
          aspectRatio={3/4}
          className="rounded-lg"
        />
      </div>
    </div>
  ),
};

export const LoadingState: Story = {
  render: () => {
    const [key, setKey] = React.useState(0);
    
    return (
      <div className="space-y-4">
        <button
          onClick={() => setKey(k => k + 1)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Reload Image
        </button>
        <OptimizedImage
          key={key}
          src={`https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&t=${key}`}
          alt="Gold-framed sunglasses on pastel background"
          aspectRatio={16/9}
          className="rounded-lg max-w-md"
        />
        <p className="text-sm text-muted-foreground">
          Click reload to see the loading state animation
        </p>
      </div>
    );
  },
};

export const ErrorHandling: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium mb-2">Failed image with fallback</p>
        <OptimizedImage
          src="https://invalid-url-that-will-fail.com/image.jpg"
          alt="This image will show fallback"
          fallback="https://via.placeholder.com/400x300?text=Fallback+Image"
          aspectRatio={4/3}
          className="rounded-lg max-w-md"
        />
      </div>
      <div>
        <p className="text-sm font-medium mb-2">Failed image with custom fallback</p>
        <OptimizedImage
          src="https://another-invalid-url.com/image.jpg"
          alt="Custom fallback example"
          fallback="https://images.unsplash.com/photo-1560393464-5c69a73c5770?w=400"
          aspectRatio={4/3}
          className="rounded-lg max-w-md"
        />
      </div>
    </div>
  ),
};

export const ProductGrid: Story = {
  render: () => {
    const products = [
      { id: 1, name: 'Watch', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300', alt: 'Classic analog watch with leather band' },
      { id: 2, name: 'Headphones', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300', alt: 'Wireless headphones in yellow setting' },
      { id: 3, name: 'Sneakers', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300', alt: 'Red athletic shoes on colorful background' },
      { id: 4, name: 'Camera', image: 'https://images.unsplash.com/photo-1564466809058-bf4114d55352?w=300', alt: 'Professional camera equipment setup' },
      { id: 5, name: 'Sunglasses', image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=300', alt: 'Designer sunglasses with reflective lenses' },
      { id: 6, name: 'Backpack', image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300', alt: 'Canvas backpack for everyday use' },
    ];

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {products.map(product => (
          <div key={product.id} className="border rounded-lg overflow-hidden">
            <OptimizedImage
              src={product.image}
              alt={product.alt}
              aspectRatio={1}
              className="w-full"
            />
            <div className="p-4">
              <h3 className="font-medium">{product.name}</h3>
              <p className="text-sm text-muted-foreground">$99.99</p>
            </div>
          </div>
        ))}
      </div>
    );
  },
};

export const DifferentSizes: Story = {
  render: () => (
    <div className="flex items-end gap-4">
      <div>
        <p className="text-sm font-medium mb-2">Small (w-24)</p>
        <OptimizedImage
          src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=150"
          alt="Small thumbnail of modern analog watch"
          className="w-24 h-24 rounded"
        />
      </div>
      <div>
        <p className="text-sm font-medium mb-2">Medium (w-48)</p>
        <OptimizedImage
          src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300"
          alt="Medium sized image of modern analog watch with brown leather strap"
          className="w-48 h-48 rounded"
        />
      </div>
      <div>
        <p className="text-sm font-medium mb-2">Large (w-96)</p>
        <OptimizedImage
          src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600"
          alt="Large detailed view of modern analog watch showing craftsmanship"
          className="w-96 h-96 rounded"
        />
      </div>
    </div>
  ),
};

export const ObjectFitVariants: Story = {
  render: () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div>
        <p className="text-sm font-medium mb-2">Cover (default)</p>
        <OptimizedImage
          src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300"
          alt="Watch displayed with object-fit cover"
          className="w-full h-32 rounded border"
        />
      </div>
      <div>
        <p className="text-sm font-medium mb-2">Contain</p>
        <div className="relative w-full h-32 rounded border overflow-hidden">
          <OptimizedImage
            src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300"
            alt="Watch displayed with object-fit contain"
            className="!object-contain"
          />
        </div>
      </div>
      <div>
        <p className="text-sm font-medium mb-2">Fill</p>
        <div className="relative w-full h-32 rounded border overflow-hidden">
          <OptimizedImage
            src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300"
            alt="Watch displayed with object-fit fill"
            className="!object-fill"
          />
        </div>
      </div>
      <div>
        <p className="text-sm font-medium mb-2">None</p>
        <div className="relative w-full h-32 rounded border overflow-hidden">
          <OptimizedImage
            src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300"
            alt="Watch displayed with object-fit none"
            className="!object-none"
          />
        </div>
      </div>
    </div>
  ),
};

export const Gallery: Story = {
  render: () => {
    const [selectedImage, setSelectedImage] = React.useState(0);
    const images = [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800',
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',
      'https://images.unsplash.com/photo-1564466809058-bf4114d55352?w=800',
    ];

    return (
      <div className="space-y-4">
        <div className="border rounded-lg overflow-hidden">
          <OptimizedImage
            src={images[selectedImage]}
            alt={[
              'Minimalist analog watch with brown leather strap',
              'Premium black headphones with gold accents',
              'Red athletic sneaker with white sole',
              'Professional DSLR camera body'
            ][selectedImage]}
            aspectRatio={16/9}
            className="w-full"
          />
        </div>
        <div className="grid grid-cols-4 gap-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedImage(index)}
              className={cn(
                "border-2 rounded overflow-hidden transition-colors",
                selectedImage === index ? "border-primary" : "border-transparent"
              )}
            >
              <OptimizedImage
                src={image}
                alt={[
                  'Watch thumbnail',
                  'Headphones thumbnail',
                  'Sneaker thumbnail',
                  'Camera thumbnail'
                ][index]}
                aspectRatio={1}
                className="w-full"
              />
            </button>
          ))}
        </div>
      </div>
    );
  },
};

import React from 'react';
import { cn } from '@/lib/utils';