import { Minus, Plus, Trash } from "lucide-react";
import { useUpdateQuantity, useRemoveFromCart } from "@/hooks/queries/useCart";
import { CartItem as CartItemType, Product } from "@/types";

interface CartItemProps {
	item: CartItemType & { product: Product };
}

const CartItem: React.FC<CartItemProps> = ({ item }) => {
	const updateQuantity = useUpdateQuantity();
	const removeFromCart = useRemoveFromCart();

	const handleUpdateQuantity = (newQuantity: number) => {
		if (newQuantity < 1) {
			removeFromCart.mutate(item.product._id);
		} else {
			updateQuantity.mutate({ productId: item.product._id, quantity: newQuantity });
		}
	};

	return (
		<article 
			className='rounded-lg border p-4 shadow-sm border-gray-700 bg-gray-800 md:p-6'
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
							 border-gray-600 bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2
							  focus:ring-emerald-500 disabled:opacity-50'
							onClick={() => handleUpdateQuantity(item.quantity - 1)}
							disabled={updateQuantity.isPending || removeFromCart.isPending}
							aria-label={`Decrease quantity of ${item.product.name}`}
						>
							<Minus className='text-gray-300' aria-hidden="true" />
						</button>
						<span 
							className="min-w-[2rem] text-center"
							aria-label={`Current quantity: ${item.quantity}`}
						>
							{item.quantity}
						</span>
						<button
							className='inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border
							 border-gray-600 bg-gray-700 hover:bg-gray-600 focus:outline-none 
						focus:ring-2 focus:ring-emerald-500 disabled:opacity-50'
							onClick={() => handleUpdateQuantity(item.quantity + 1)}
							disabled={updateQuantity.isPending || removeFromCart.isPending}
							aria-label={`Increase quantity of ${item.product.name}`}
						>
							<Plus className='text-gray-300' aria-hidden="true" />
						</button>
					</div>

					<div className='text-end md:order-4 md:w-32'>
						<p 
							className='text-base font-bold text-emerald-400'
							aria-label={`Total price: $${(item.product.price * item.quantity).toFixed(2)}`}
						>
							${(item.product.price * item.quantity).toFixed(2)}
						</p>
					</div>
				</div>

				<div className='w-full min-w-0 flex-1 space-y-4 md:order-2 md:max-w-md'>
					<h3 
						id={`cart-item-${item.product._id}`}
						className='text-base font-medium text-white hover:text-emerald-400 hover:underline'
					>
						{item.product.name}
					</h3>
					<p className='text-sm text-gray-400'>{item.product.description}</p>

					<div className='flex items-center gap-4'>
						<button
							className='inline-flex items-center text-sm font-medium text-red-400
							 hover:text-red-300 hover:underline disabled:opacity-50'
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