import { memo, useEffect, useState } from 'react';
import { ShoppingCart, Heart, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Product } from '@/types';
import { cn } from '@/lib/utils';
import { RealtimeStockBadge } from '@/components/ui/RealtimeStockBadge';
import { useProductInventory } from '@/hooks/queries/useInventory';
import { useUnifiedAddToCart } from '@/hooks/cart/useUnifiedCart';
import { toast } from 'sonner';

interface ProductCardProps {
  product: Product;
  className?: string;
  enableRealtime?: boolean;
}

export const ProductCardRealtime = memo(function ProductCardRealtime({ 
  product, 
  className,
  enableRealtime = true, 
}: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [lastStockUpdate, setLastStockUpdate] = useState<Date | null>(null);
  const addToCart = useUnifiedAddToCart();
  
  // Get real-time inventory data
  const { data: inventoryData } = useProductInventory(product._id);
  const currentStock = inventoryData?.availableStock ?? 0;
  const isOutOfStock = currentStock === 0;
  const isLowStock = currentStock > 0 && currentStock <= 5;

  // Track stock changes
  useEffect(() => {
    if (inventoryData) {
      setLastStockUpdate(new Date());
    }
  }, [inventoryData?.availableStock]);

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (isOutOfStock) {
      toast.error('Product is out of stock');
      return;
    }

    // For products with variants, redirect to product page
    if (product.variants && product.variants.length > 0) {
      toast.info('Please select options on the product page');
      return;
    }

    try {
      await addToCart.mutateAsync({ product });
      toast.success('Added to cart!');
    } catch (error: unknown) {
      if (error instanceof Error && error.message.includes('stock')) {
        toast.error('Product no longer available');
      }
    }
  };

  return (
    <article 
      className={cn(
        'group relative rounded-lg border bg-card overflow-hidden transition-all duration-300',
        'hover:shadow-lg hover:border-primary/20',
        isOutOfStock && 'opacity-75',
        className,
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link to={`/products/${product.slug}`} className="block">
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-muted">
          <img
            src={product.image}
            alt={product.name}
            className={cn(
              'h-full w-full object-cover transition-transform duration-300',
              isHovered && 'scale-105',
            )}
            loading="lazy"
          />
          
          {/* Out of Stock Overlay */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white font-semibold text-lg">Out of Stock</span>
            </div>
          )}

          {/* Low Stock Warning */}
          {isLowStock && !isOutOfStock && (
            <div className="absolute top-2 left-2 bg-amber-500 text-white px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Low Stock
            </div>
          )}

          {/* Quick Actions */}
          <div className={cn(
            'absolute top-2 right-2 flex flex-col gap-2 transition-opacity duration-200',
            isHovered ? 'opacity-100' : 'opacity-0',
          )}>
            <button
              className="p-2 rounded-full bg-white/90 hover:bg-white shadow-sm transition-colors"
              onClick={(e) => {
                e.preventDefault();
                toast.info('Wishlist feature coming soon!');
              }}
              aria-label="Add to wishlist"
            >
              <Heart className="w-4 h-4" />
            </button>
          </div>

          {/* Featured Badge */}
          {product.isFeatured && (
            <div className="absolute top-2 left-2 bg-primary text-primary-foreground px-2 py-1 rounded-md text-xs font-semibold">
              Featured
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-4 space-y-2">
          <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          
          <p className="text-sm text-muted-foreground line-clamp-2">
            {product.description}
          </p>

          <div className="flex items-center justify-between">
            <p className="text-lg font-bold text-primary">
              ${product.price.toFixed(2)}
            </p>
            
            {enableRealtime ? (
              <RealtimeStockBadge
                inventory={currentStock}
                productId={product._id}
                showCount={currentStock <= 10}
                size="xs"
              />
            ) : (
              <span className="text-xs text-muted-foreground">
                {isOutOfStock ? 'Out of stock' : 'In stock'}
              </span>
            )}
          </div>

          {/* Last Update Indicator */}
          {enableRealtime && lastStockUpdate && (
            <p className="text-xs text-muted-foreground">
              Updated {lastStockUpdate.toLocaleTimeString()}
            </p>
          )}
        </div>
      </Link>

      {/* Quick Add Button */}
      <div className="p-4 pt-0">
        <button
          onClick={() => { void handleQuickAdd(); }}
          disabled={isOutOfStock || addToCart.isPending}
          className={cn(
            'w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md font-medium transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
            isOutOfStock
              ? 'bg-muted text-muted-foreground cursor-not-allowed'
              : 'bg-primary text-primary-foreground hover:bg-primary/90',
          )}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>
            {addToCart.isPending 
              ? 'Adding...' 
              : isOutOfStock 
              ? 'Out of Stock' 
              : product.variants?.length 
              ? 'Select Options' 
              : 'Add to Cart'}
          </span>
        </button>
      </div>
    </article>
  );
});