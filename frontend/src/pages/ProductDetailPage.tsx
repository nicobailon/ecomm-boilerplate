import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Skeleton } from '@/components/ui/Skeleton';
import { AlertCircle } from 'lucide-react';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { ProductImageGallery } from '@/components/product/ProductImageGallery';
import { ProductVariantSelector } from '@/components/product/ProductVariantSelector';
import { ProductInfo } from '@/components/product/ProductInfo';
import { RelatedProducts } from '@/components/product/RelatedProducts';
import { CheckoutCallout } from '@/components/ui/CheckoutCallout';
import { useProduct } from '@/hooks/queries/useProduct';
import { useRelatedProducts } from '@/hooks/queries/useRelatedProducts';
import { useProductAnalytics } from '@/hooks/useProductAnalytics';
import { useMetaTags } from '@/components/seo/MetaTags';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import type { Product, Collection } from '@/types';

interface IProductVariant {
  variantId: string;
  size?: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';
  color?: string;
  price: number;
  inventory: number;
  images: string[];
  sku?: string;
}

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [selectedVariant, setSelectedVariant] = useState<IProductVariant | null>(null);
  const [showCheckoutCallout, setShowCheckoutCallout] = useState(false);
  
  const { data, isLoading, error } = useProduct(slug || '');
  const product = data?.product;
  
  useProductAnalytics(product?._id);
  
  const { data: relatedProducts } = useRelatedProducts(product?._id);

  // Calculate display values for meta tags (before null check)
  const tempDisplayImages = selectedVariant?.images?.length 
    ? selectedVariant.images 
    : (product?.image ? [product.image] : []);
  
  const displayPrice = selectedVariant?.price ?? product?.price ?? 0;
  const displayInventory = selectedVariant?.inventory ?? 0;
  const availability = displayInventory > 0 ? 'in stock' : 'out of stock';
  
  // Must call hooks before any conditional returns
  useMetaTags({
    title: product ? `${product.name} - Shop` : 'Product - Shop',
    description: product?.description ?? '',
    image: tempDisplayImages[0] ?? '',
    url: `/products/${product?.slug ?? slug ?? ''}`,
    type: 'product',
    price: displayPrice,
    availability,
  });

  // Early return for loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          <div>
            <Skeleton className="aspect-square w-full" />
            <div className="mt-4 flex gap-2">
              <Skeleton className="w-20 h-20" />
              <Skeleton className="w-20 h-20" />
              <Skeleton className="w-20 h-20" />
              <Skeleton className="w-20 h-20" />
            </div>
          </div>
          <div className="space-y-4">
            <Skeleton className="h-8 w-full max-w-md" />
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-20 w-full" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-10 w-20" />
            </div>
            <Skeleton className="h-12 w-full max-w-xs" />
          </div>
        </div>
      </div>
    );
  }

  // Early return for error state
  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Product Not Found</h2>
          <p className="text-muted-foreground">The product you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }
  
  // At this point, TypeScript knows product is defined
  const currentProduct = product;
  
  // Recalculate display values now that we have currentProduct
  const displayImages = selectedVariant?.images?.length 
    ? selectedVariant.images 
    : [currentProduct.image];
    
  const handleAddToCartSuccess = () => {
    setShowCheckoutCallout(true);
  };
  
  const handleVariantSelect = (variant: IProductVariant) => {
    setSelectedVariant(variant);
    console.log('Variant selected:', {
      productId: currentProduct._id,
      variantId: variant.variantId,
      size: variant.size,
      color: variant.color,
      price: variant.price,
    });
  };

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    ...(currentProduct.collectionId && typeof currentProduct.collectionId === 'object' && 'name' in currentProduct.collectionId
      ? [{
          label: (currentProduct.collectionId as Collection).name,
          href: `/collections/${(currentProduct.collectionId as Collection).slug}`,
        }]
      : []),
    { label: currentProduct.name },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb items={breadcrumbItems} className="mb-6" />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        <ErrorBoundary>
          <ProductImageGallery 
            images={displayImages}
            productName={currentProduct.name}
          />
        </ErrorBoundary>
        
        <div>
          <ErrorBoundary>
            <ProductInfo
              product={{
                _id: currentProduct._id || '',
                name: currentProduct.name,
                description: currentProduct.description,
                price: currentProduct.price,
                image: currentProduct.image,
                collectionId: currentProduct.collectionId,
                isFeatured: currentProduct.isFeatured,
                createdAt: currentProduct.createdAt || '',
                updatedAt: currentProduct.updatedAt || ''
              }}
              selectedVariant={selectedVariant}
              onAddToCartSuccess={handleAddToCartSuccess}
            />
          </ErrorBoundary>
          
          {'variants' in currentProduct && currentProduct.variants && currentProduct.variants.length > 0 && (
            <div className="mt-8">
              <ErrorBoundary>
                <ProductVariantSelector
                  variants={currentProduct.variants}
                  selectedVariant={selectedVariant}
                  onVariantSelect={handleVariantSelect}
                  basePrice={currentProduct.price}
                />
              </ErrorBoundary>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-12">
        <ErrorBoundary>
          <RelatedProducts 
            products={(relatedProducts || []).map(p => ({
              ...p,
              _id: p._id || '',
              createdAt: p.createdAt || '',
              updatedAt: p.updatedAt || ''
            } as Product))} 
            collection={typeof currentProduct.collectionId === 'object' && 'name' in currentProduct.collectionId ? currentProduct.collectionId as Collection : undefined}
          />
        </ErrorBoundary>
      </div>
      
      {showCheckoutCallout && (
        <CheckoutCallout
          onClose={() => setShowCheckoutCallout(false)}
        />
      )}
    </div>
  );
}