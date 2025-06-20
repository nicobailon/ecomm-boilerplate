import { useState, useRef } from 'react';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';

interface ProductImageGalleryProps {
  images: string[];
  productName: string;
}

export function ProductImageGallery({ images, productName }: ProductImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const galleryRef = useRef<HTMLDivElement>(null);

  if (!images || images.length === 0) {
    return (
      <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
        <p className="text-muted-foreground">No image available</p>
      </div>
    );
  }

  const selectedImage = images[selectedIndex];

  const handleSwipeLeft = () => {
    if (selectedIndex < images.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  };

  const handleSwipeRight = () => {
    if (selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  useSwipeGesture(galleryRef, {
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
  });

  return (
    <div className="space-y-4">
      <div 
        ref={galleryRef}
        className="relative aspect-square overflow-hidden rounded-lg bg-gray-100"
      >
        <OptimizedImage
          src={selectedImage}
          alt={`${productName} - Image ${selectedIndex + 1}`}
          className="object-cover w-full h-full"
          aspectRatio={1}
        />
      </div>

      {images.length > 1 && (
        <>
          <div className="hidden sm:grid grid-cols-4 gap-2">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedIndex(index)}
                className={`relative aspect-square overflow-hidden rounded-lg border-2 transition-all ${
                  index === selectedIndex
                    ? 'border-primary ring-2 ring-primary ring-offset-2'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                aria-label={`View image ${index + 1}`}
                aria-current={index === selectedIndex}
              >
                <OptimizedImage
                  src={image}
                  alt={`${productName} thumbnail ${index + 1}`}
                  className="object-cover w-full h-full"
                  aspectRatio={1}
                />
              </button>
            ))}
          </div>

          <div className="flex sm:hidden justify-center gap-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setSelectedIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === selectedIndex
                    ? 'bg-primary w-6'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Go to image ${index + 1}`}
                aria-current={index === selectedIndex}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}