import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import ProductCard from '@/components/product/ProductCard';
import type { Product, Collection } from '@/types';

interface RelatedProductsProps {
  products: Product[];
  collection?: Collection;
}

export function RelatedProducts({ products, collection }: RelatedProductsProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  if (!products || products.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <p className="text-muted-foreground mb-4">No related products found</p>
        {collection && (
          <Link
            to={`/collections/${collection.slug}`}
            className="inline-flex items-center gap-2 text-primary hover:underline"
          >
            Browse {collection.name} collection
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Related Products</h2>
        {collection && (
          <Link
            to={`/collections/${collection.slug}`}
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            View all {collection.name}
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      <div className="relative">
        <button
          onClick={scrollLeft}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-lg 
            hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary hidden md:block"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          onClick={scrollRight}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white rounded-full p-2 shadow-lg 
            hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary hidden md:block"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {products.map((product) => (
            <div key={product._id} className="flex-none w-72">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center gap-2 mt-4 md:hidden">
        {Array.from({ length: Math.ceil(products.length / 1.5) }).map((_, index) => (
          <div
            key={index}
            className="w-2 h-2 rounded-full bg-gray-300"
            aria-hidden="true"
          />
        ))}
      </div>
    </div>
  );
}