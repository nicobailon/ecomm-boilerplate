import { Minus, Plus, Trash, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUnifiedUpdateQuantity, useUnifiedRemoveFromCart } from '@/hooks/cart/useUnifiedCart';
import type { CartItem as CartItemType, Product } from '@/types';
import { getVariantDisplayText } from '@/utils/variant-helpers';
import { useProductInventory } from '@/hooks/queries/useInventory';
import { motion, AnimatePresence } from 'framer-motion';

interface CartItemProps {
	item: CartItemType & { product: Product };
}

const CartItem: React.FC<CartItemProps> = ({ item }) => {
	const updateQuantity = useUnifiedUpdateQuantity();
	const removeFromCart = useUnifiedRemoveFromCart();
	
	// Fetch real-time inventory data
	const { data: inventoryData, isLoading: inventoryLoading } = useProductInventory(
		item.product._id,
		item.variantId,
		item.variantDetails?.label,
	);
	
	// Determine inventory warning status
	const availableStock = inventoryData?.availableStock ?? 0;
	const isLowStock = availableStock > 0 && availableStock <= 5;
	const isInsufficientStock = availableStock > 0 && availableStock < item.quantity;
	const isOutOfStock = availableStock === 0;

	const handleUpdateQuantity = (newQuantity: number) => {
		if (newQuantity < 1) {
			removeFromCart.mutate({ 
				productId: item.product._id, 
				variantId: item.variantId,
				variantLabel: item.variantDetails?.label,
			});
		} else {
			updateQuantity.mutate({ 
				productId: item.product._id, 
				quantity: newQuantity,
				variantId: item.variantId,
				variantLabel: item.variantDetails?.label,
			});
		}
	};
	
	// Use variant price if available, otherwise use product price
	const displayPrice = item.variantDetails?.price ?? item.product.price;

	return (
		<article 
			className='rounded-lg border p-4 shadow-sm border-border bg-card md:p-6'
			aria-labelledby={`cart-item-${item.product._id}`}
		>
			<div className='space-y-4 md:flex md:items-center md:justify-between md:gap-6 md:space-y-0'>
				<div className='shrink-0 md:order-1'>
					<Link to={`/products/${item.product.slug}`}>
						<img 
							className='h-20 md:h-32 rounded object-cover transition-opacity hover:opacity-80' 
							src={item.product.image} 
							alt={`${item.product.name} product image`}
						/>
					</Link>
				</div>

				<div className='flex items-center justify-between md:order-3 md:justify-end'>
					<div className='flex items-center gap-2' role="group" aria-label={`Quantity controls for ${item.product.name}`}>
						<button
							className='inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border
							 border-border bg-muted hover:bg-muted/80 focus:outline-none focus:ring-2
							  focus:ring-primary disabled:opacity-50'
							onClick={() => handleUpdateQuantity(item.quantity - 1)}
							disabled={updateQuantity.isPending || removeFromCart.isPending}
							aria-label={`Decrease quantity of ${item.product.name}`}
						>
							<Minus className='text-muted-foreground' aria-hidden="true" />
						</button>
						<span 
							className="min-w-[2rem] text-center"
							aria-label={`Current quantity: ${item.quantity}`}
						>
							{item.quantity}
						</span>
						<button
							className='inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border
							 border-border bg-muted hover:bg-muted/80 focus:outline-none 
						focus:ring-2 focus:ring-primary disabled:opacity-50'
							onClick={() => handleUpdateQuantity(item.quantity + 1)}
							disabled={updateQuantity.isPending || removeFromCart.isPending || (!inventoryLoading && availableStock > 0 && item.quantity >= availableStock)}
							aria-label={`Increase quantity of ${item.product.name}`}
							title={(!inventoryLoading && availableStock > 0 && item.quantity >= availableStock) ? 'Maximum available quantity reached' : undefined}
						>
							<Plus className='text-muted-foreground' aria-hidden="true" />
						</button>
					</div>

					<div className='text-end md:order-4 md:w-32'>
						<p 
							className='text-base font-bold text-primary'
							aria-label={`Total price: $${(displayPrice * item.quantity).toFixed(2)}`}
						>
							${(displayPrice * item.quantity).toFixed(2)}
						</p>
					</div>
				</div>

				<div className='w-full min-w-0 flex-1 space-y-4 md:order-2 md:max-w-md'>
					<div>
						<Link to={`/products/${item.product.slug}`}>
							<h3 
								id={`cart-item-${item.product._id}`}
								className='text-base font-medium text-foreground hover:text-primary hover:underline'
							>
								{item.product.name}
							</h3>
						</Link>
						{item.variantDetails && (
							<div className='flex items-center gap-2 mt-1 text-sm text-muted-foreground'>
								<span>{getVariantDisplayText(item.variantDetails)}</span>
								{item.variantDetails.sku && (
									<>
										<span>•</span>
										<span className="text-xs">SKU: {item.variantDetails.sku}</span>
									</>
								)}
							</div>
						)}
					</div>
					<p className='text-sm text-muted-foreground'>{item.product.description}</p>

					<AnimatePresence>
						{!inventoryLoading && (isLowStock || isInsufficientStock || isOutOfStock) && (
							<motion.div
								initial={{ opacity: 0, height: 0 }}
								animate={{ opacity: 1, height: 'auto' }}
								exit={{ opacity: 0, height: 0 }}
								transition={{ duration: 0.2 }}
								className={`flex items-center gap-2 text-sm p-2 rounded-md ${
									isOutOfStock 
										? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400' 
										: isInsufficientStock
										? 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400'
										: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
								}`}
							>
								<AlertTriangle className="w-4 h-4 flex-shrink-0" />
								<span>
									{isOutOfStock
										? 'Out of stock - will be removed at checkout'
										: isInsufficientStock
										? `Only ${availableStock} available - quantity will be adjusted at checkout`
										: `Low stock - only ${availableStock} left`}
								</span>
							</motion.div>
						)}
					</AnimatePresence>

					<div className='flex items-center gap-4'>
						<button
							className='inline-flex items-center text-sm font-medium text-destructive
							 hover:text-destructive/80 hover:underline disabled:opacity-50'
							onClick={() => removeFromCart.mutate({ productId: item.product._id, variantId: item.variantId, variantLabel: item.variantDetails?.label })}
							disabled={removeFromCart.isPending}
							aria-label={`Remove ${item.product.name} from cart`}
						>
							<Trash aria-hidden="true" />
							<span className="sr-only">Remove from cart</span>
						</button>
					</div>
				</div>
			</div>
		</article>
	);
};

export default CartItem;