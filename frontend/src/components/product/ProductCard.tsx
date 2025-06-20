import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUnifiedAddToCart } from '@/hooks/cart/useUnifiedCart';
import type { Product } from '@/types';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { InventoryBadge } from '@/components/ui/InventoryBadge';
import { cn } from '@/lib/utils';
import { useProductInventory } from '@/hooks/queries/useInventory';
import { InventoryBadgeLoading } from '@/components/ui/InventorySkeleton';

interface ProductCardProps {
	product: Product;
}

const ProductCard = React.memo<ProductCardProps>(({ product }) => {
	const addToCart = useUnifiedAddToCart();
	const { data: inventoryData, isLoading: inventoryLoading } = useProductInventory(product._id);

	// Use real inventory data when available, fallback to 0 while loading
	const totalInventory = inventoryData?.availableStock ?? 0;
	const isOutOfStock = !inventoryLoading && totalInventory === 0;

	const handleAddToCart = () => {
		if (!isOutOfStock) {
			addToCart.mutate({ product });
		}
	};

	return (
		<article 
			className='flex w-full relative flex-col overflow-hidden rounded-lg border border-border shadow-lg'
			role="group"
			aria-labelledby={`product-${product._id}-name`}
		>
			<Link 
				to={`/products/${product.slug ?? product._id}`}
				className='relative mx-3 mt-3 flex h-60 overflow-hidden rounded-xl'
				aria-label={`View details for ${product.name}`}
			>
				<OptimizedImage 
					className='object-cover w-full' 
					src={product.image} 
					alt={`${product.name} product image`}
					aspectRatio={1}
				/>
				<div className={cn(
					'absolute inset-0',
					isOutOfStock ? 'bg-black/40' : 'bg-black/20',
				)} />
				{/* Inventory Badge */}
				<div className='absolute top-2 right-2'>
					{inventoryLoading ? (
						<InventoryBadgeLoading />
					) : (
						<InventoryBadge 
							inventory={totalInventory}
							variant='collection'
						/>
					)}
				</div>
			</Link>

			<div className='mt-4 px-5 pb-5'>
				<Link 
					to={`/products/${product.slug ?? product._id}`}
					className='hover:underline'
				>
					<h3 
						id={`product-${product._id}-name`}
						className='text-xl font-semibold tracking-tight text-foreground'
					>
						{product.name}
					</h3>
				</Link>
				<div className='mt-2 mb-5 flex items-center justify-between'>
					<p>
						<span 
							className='text-3xl font-bold text-primary'
							aria-label={`Price: $${product.price.toFixed(2)}`}
						>
							${product.price}
						</span>
					</p>
				</div>
				<button
					className={cn(
						'flex items-center justify-center rounded-lg px-5 py-2.5 text-center text-sm font-medium',
						'focus:outline-none focus:ring-4 focus:ring-primary/50 disabled:opacity-50',
						isOutOfStock 
							? 'bg-muted text-muted-foreground cursor-not-allowed'
							: 'bg-primary text-primary-foreground hover:bg-primary/90',
					)}
					onClick={handleAddToCart}
					disabled={addToCart.isPending || isOutOfStock || inventoryLoading}
					aria-label={isOutOfStock ? `${product.name} is out of stock` : inventoryLoading ? `Loading inventory for ${product.name}` : `Add ${product.name} to cart, price $${product.price.toFixed(2)}`}
					aria-describedby={addToCart.isPending ? `product-${product._id}-status` : undefined}
					data-in-stock={!isOutOfStock}
				>
					<ShoppingCart size={22} className='mr-2' aria-hidden="true" />
					<span>{inventoryLoading ? 'Checking...' : isOutOfStock ? 'Out of Stock' : addToCart.isPending ? 'Adding...' : 'Add to cart'}</span>
					{addToCart.isPending && (
						<span 
							id={`product-${product._id}-status`}
							className="sr-only"
							aria-live="polite"
						>
							Adding {product.name} to cart
						</span>
					)}
					{/* Live region for inventory status */}
					<div className="sr-only" aria-live="polite" aria-atomic="true">
						{!inventoryLoading && (
							<>
								{product.name} has {totalInventory} items in stock.
								{isOutOfStock && 'This item is currently out of stock.'}
							</>
						)}
					</div>
				</button>
			</div>
		</article>
	);
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;