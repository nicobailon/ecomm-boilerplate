import { useEffect, useState } from 'react';
import { ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAddToCart } from '@/hooks/cart/useCart';
import { useCurrentUser } from '@/hooks/auth/useAuth';
import { FeaturedBadge } from '@/components/ui/FeaturedBadge';
import type { Product } from '@/types';
import { toast } from 'sonner';

interface FeaturedProductsProps {
	featuredProducts: Product[];
}

const FeaturedProducts: React.FC<FeaturedProductsProps> = ({ featuredProducts }) => {
	const [currentIndex, setCurrentIndex] = useState(0);
	const [itemsPerPage, setItemsPerPage] = useState(4);
	const { data: user } = useCurrentUser();
	const addToCart = useAddToCart();

	useEffect(() => {
		const handleResize = () => {
			if (window.innerWidth < 640) setItemsPerPage(1);
			else if (window.innerWidth < 1024) setItemsPerPage(2);
			else if (window.innerWidth < 1280) setItemsPerPage(3);
			else setItemsPerPage(4);
		};

		handleResize();
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	const nextSlide = () => {
		setCurrentIndex((prevIndex) => prevIndex + itemsPerPage);
	};

	const prevSlide = () => {
		setCurrentIndex((prevIndex) => prevIndex - itemsPerPage);
	};

	const handleAddToCart = (e: React.MouseEvent, product: Product) => {
		e.preventDefault(); // Prevent navigation when clicking add to cart
		if (!user) {
			toast.error('Please login to add products to cart');
			return;
		}
		addToCart.mutate(product);
	};

	const isStartDisabled = currentIndex === 0;
	const isEndDisabled = currentIndex >= featuredProducts.length - itemsPerPage;

	return (
		<div className='py-12'>
			<div className='container mx-auto px-4'>
				<h2 className='text-center text-5xl sm:text-6xl font-bold text-primary mb-4'>Featured</h2>
				<div className='relative'>
					<div className='overflow-hidden'>
						<div
							className='flex transition-transform duration-300 ease-in-out'
							style={{ transform: `translateX(-${currentIndex * (100 / itemsPerPage)}%)` }}
						>
							{featuredProducts?.map((product) => (
								<div key={product._id} className='w-full sm:w-1/2 lg:w-1/3 xl:w-1/4 flex-shrink-0 px-2'>
									<Link 
										to={`/products/${product.slug ?? product._id}`}
										className='block bg-white bg-opacity-10 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden h-full transition-all duration-300 hover:shadow-xl hover:scale-[1.02] border border-primary/30 cursor-pointer'
									>
										<div className='overflow-hidden relative'>
											<img
												src={product.image}
												alt={product.name}
												className='w-full h-48 object-cover transition-transform duration-300 ease-in-out hover:scale-110'
											/>
											<div className='absolute top-2 left-2'>
												<FeaturedBadge size='sm' showText={false} />
											</div>
										</div>
										<div className='p-4'>
											<h3 className='text-lg font-semibold mb-2 text-white hover:text-primary transition-colors'>{product.name}</h3>
											<p className='text-primary font-medium mb-4'>
												${product.price.toFixed(2)}
											</p>
											<button
												onClick={(e) => handleAddToCart(e, product)}
												disabled={addToCart.isPending}
												className='w-full bg-primary hover:bg-primary/80 text-primary-foreground font-semibold py-2 px-4 rounded transition-colors duration-300 
												flex items-center justify-center disabled:opacity-50'
											>
												<ShoppingCart className='w-5 h-5 mr-2' />
												{addToCart.isPending ? 'Adding...' : 'Add to Cart'}
											</button>
										</div>
									</Link>
								</div>
							))}
						</div>
					</div>
					<button
						onClick={prevSlide}
						disabled={isStartDisabled}
						className={`absolute top-1/2 -left-4 transform -translate-y-1/2 p-2 rounded-full transition-colors duration-300 ${
							isStartDisabled ? 'bg-muted cursor-not-allowed' : 'bg-primary hover:bg-primary/80'
						}`}
					>
						<ChevronLeft className='w-6 h-6' />
					</button>

					<button
						onClick={nextSlide}
						disabled={isEndDisabled}
						className={`absolute top-1/2 -right-4 transform -translate-y-1/2 p-2 rounded-full transition-colors duration-300 ${
							isEndDisabled ? 'bg-muted cursor-not-allowed' : 'bg-primary hover:bg-primary/80'
						}`}
					>
						<ChevronRight className='w-6 h-6' />
					</button>
				</div>
			</div>
		</div>
	);
};

export default FeaturedProducts;