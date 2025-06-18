import { motion } from "framer-motion";
import { Trash, Star } from "lucide-react";
import { useProducts, useDeleteProduct, useToggleFeatured } from "@/hooks/product/useProducts";
import LoadingSpinner from "../ui/LoadingSpinner";
import { useEffect } from "react";
import { ProductsListProps } from "@/types";
import { cn } from "@/lib/utils";

const ProductsList = ({ highlightProductId, onHighlightComplete, onEditProduct }: ProductsListProps = {}) => {
	const { data, isLoading } = useProducts();
	const deleteProduct = useDeleteProduct();
	const toggleFeatured = useToggleFeatured();

	useEffect(() => {
		if (highlightProductId && !isLoading) {
			// Scroll to product
			const element = document.getElementById(`product-${highlightProductId}`);
			element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
			
			// Clear highlight after animation
			const timer = setTimeout(() => {
				onHighlightComplete?.();
			}, 3000);
			
			return () => clearTimeout(timer);
		}
	}, [highlightProductId, onHighlightComplete, isLoading]);

	if (isLoading) return <LoadingSpinner />;

	const products = data?.data || [];

	return (
		<motion.div
			className='bg-card shadow-lg rounded-lg overflow-hidden max-w-4xl mx-auto'
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.8 }}
		>
			<table className=' min-w-full divide-y divide-border'>
				<thead className='bg-muted'>
					<tr>
						<th
							scope='col'
							className='px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider'
						>
							Product
						</th>
						<th
							scope='col'
							className='px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider'
						>
							Price
						</th>
						<th
							scope='col'
							className='px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider'
						>
							Collection
						</th>

						<th
							scope='col'
							className='px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider'
						>
							Featured
						</th>
						<th
							scope='col'
							className='px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider'
						>
							Actions
						</th>
					</tr>
				</thead>

				<tbody className='bg-card divide-y divide-border'>
					{products?.map((product) => (
						<tr 
							key={product._id} 
							id={`product-${product._id}`}
							onClick={() => onEditProduct?.(product)}
							className={cn(
								'hover:bg-muted/50 transition-all duration-300 cursor-pointer',
								highlightProductId === product._id && 'ring-2 ring-primary bg-primary/10 animate-highlight'
							)}
						>
							<td className='px-6 py-4 whitespace-nowrap'>
								<div className='flex items-center'>
									<div className='flex-shrink-0 h-10 w-10'>
										<img
											className='h-10 w-10 rounded-full object-cover'
											src={product.image}
											alt={product.name}
										/>
									</div>
									<div className='ml-4'>
										<div className='text-sm font-medium text-white'>{product.name}</div>
									</div>
								</div>
							</td>
							<td className='px-6 py-4 whitespace-nowrap'>
								<div className='text-sm text-muted-foreground'>${product.price.toFixed(2)}</div>
							</td>
							<td className='px-6 py-4 whitespace-nowrap'>
								<div className='text-sm text-muted-foreground'>
									{product.collectionId && typeof product.collectionId === 'object' 
										? product.collectionId.name 
										: 'No collection'}
								</div>
							</td>
							<td className='px-6 py-4 whitespace-nowrap'>
								<button
									onClick={(e) => {
										e.stopPropagation();
										toggleFeatured.mutate(product._id);
									}}
									disabled={toggleFeatured.isPending}
									className={`p-1 rounded-full ${
										product.isFeatured
											? "bg-warning text-warning-foreground"
											: "bg-muted text-muted-foreground"
									} hover:bg-warning/80 transition-colors duration-200 disabled:opacity-50`}
								>
									<Star className='h-5 w-5' />
								</button>
							</td>
							<td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
								<button
									onClick={(e) => {
										e.stopPropagation();
										deleteProduct.mutate(product._id);
									}}
									disabled={deleteProduct.isPending}
									className='text-destructive hover:text-destructive/80 disabled:opacity-50'
								>
									<Trash className='h-5 w-5' />
								</button>
							</td>
						</tr>
					))}
				</tbody>
			</table>
		</motion.div>
	);
};

export default ProductsList;