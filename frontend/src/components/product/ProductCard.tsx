import { ShoppingCart } from "lucide-react";
import { useUnifiedAddToCart } from "@/hooks/cart/useUnifiedCart";
import { Product } from "@/types";
import { OptimizedImage } from "@/components/ui/OptimizedImage";

interface ProductCardProps {
	product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
	const addToCart = useUnifiedAddToCart();

	const handleAddToCart = () => {
		addToCart.mutate(product);
	};

	return (
		<article 
			className='flex w-full relative flex-col overflow-hidden rounded-lg border border-border shadow-lg'
			role="group"
			aria-labelledby={`product-${product._id}-name`}
		>
			<div className='relative mx-3 mt-3 flex h-60 overflow-hidden rounded-xl'>
				<OptimizedImage 
					className='object-cover w-full' 
					src={product.image} 
					alt={`${product.name} product image`}
					aspectRatio={1}
				/>
				<div className='absolute inset-0 bg-black/20' />
			</div>

			<div className='mt-4 px-5 pb-5'>
				<h3 
					id={`product-${product._id}-name`}
					className='text-xl font-semibold tracking-tight text-foreground'
				>
					{product.name}
				</h3>
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
					className='flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-center text-sm font-medium
					 text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-4 focus:ring-primary/50 disabled:opacity-50'
					onClick={handleAddToCart}
					disabled={addToCart.isPending}
					aria-label={`Add ${product.name} to cart, price $${product.price.toFixed(2)}`}
					aria-describedby={addToCart.isPending ? `product-${product._id}-status` : undefined}
				>
					<ShoppingCart size={22} className='mr-2' aria-hidden="true" />
					<span>{addToCart.isPending ? 'Adding...' : 'Add to cart'}</span>
					{addToCart.isPending && (
						<span 
							id={`product-${product._id}-status`}
							className="sr-only"
							aria-live="polite"
						>
							Adding {product.name} to cart
						</span>
					)}
				</button>
			</div>
		</article>
	);
};

export default ProductCard;