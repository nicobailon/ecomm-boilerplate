import { Minus, Plus, Trash } from 'lucide-react';
import { useUnifiedUpdateQuantity, useUnifiedRemoveFromCart } from '@/hooks/cart/useUnifiedCart';
import type { CartItem as CartItemType, Product } from '@/types';

interface CartItemProps {
	item: CartItemType & { product: Product };
}

const CartItem: React.FC<CartItemProps> = ({ item }) => {
	const updateQuantity = useUnifiedUpdateQuantity();
	const removeFromCart = useUnifiedRemoveFromCart();

	const handleUpdateQuantity = (newQuantity: number) => {
		if (newQuantity < 1) {
			removeFromCart.mutate(item.product._id);
		} else {
			updateQuantity.mutate({ productId: item.product._id, quantity: newQuantity });
		}
	};

	return (
		<article 
			className='rounded-lg border p-4 shadow-sm border-border bg-card md:p-6'
			aria-labelledby={`cart-item-${item.product._id}`}
		>
			<div className='space-y-4 md:flex md:items-center md:justify-between md:gap-6 md:space-y-0'>
				<div className='shrink-0 md:order-1'>
					<img 
						className='h-20 md:h-32 rounded object-cover' 
						src={item.product.image} 
						alt={`${item.product.name} product image`}
					/>
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
							disabled={updateQuantity.isPending || removeFromCart.isPending}
							aria-label={`Increase quantity of ${item.product.name}`}
						>
							<Plus className='text-muted-foreground' aria-hidden="true" />
						</button>
					</div>

					<div className='text-end md:order-4 md:w-32'>
						<p 
							className='text-base font-bold text-primary'
							aria-label={`Total price: $${(item.product.price * item.quantity).toFixed(2)}`}
						>
							${(item.product.price * item.quantity).toFixed(2)}
						</p>
					</div>
				</div>

				<div className='w-full min-w-0 flex-1 space-y-4 md:order-2 md:max-w-md'>
					<h3 
						id={`cart-item-${item.product._id}`}
						className='text-base font-medium text-foreground hover:text-primary hover:underline'
					>
						{item.product.name}
					</h3>
					<p className='text-sm text-muted-foreground'>{item.product.description}</p>

					<div className='flex items-center gap-4'>
						<button
							className='inline-flex items-center text-sm font-medium text-destructive
							 hover:text-destructive/80 hover:underline disabled:opacity-50'
							onClick={() => removeFromCart.mutate(item.product._id)}
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