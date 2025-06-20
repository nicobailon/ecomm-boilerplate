import { motion } from 'framer-motion';
import { Trash, Star, AlertTriangle } from 'lucide-react';
import { useProducts, useDeleteProduct, useToggleFeatured } from '@/hooks/product/useProducts';
import LoadingSpinner from '../ui/LoadingSpinner';
import { useEffect } from 'react';
import type { ProductsListProps, Product } from '@/types';
import { cn } from '@/lib/utils';
import { InventoryBadge } from '@/components/ui/InventoryBadge';
import { useProductInventory } from '@/hooks/queries/useInventory';
import { InventoryBadgeLoading } from '@/components/ui/InventorySkeleton';

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

	const products = data?.data ?? [];

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
							Stock
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
						<ProductRow 
							key={product._id} 
							product={product}
							highlightProductId={highlightProductId ?? undefined}
							onEditProduct={onEditProduct}
							onDelete={() => deleteProduct.mutate(product._id)}
							onToggleFeatured={() => toggleFeatured.mutate(product._id)}
						/>
					))}
				</tbody>
			</table>
		</motion.div>
	);
};

// Separate component to handle inventory data fetching
interface ProductRowProps {
	product: Product;
	highlightProductId?: string;
	onEditProduct?: (product: Product) => void;
	onDelete: () => void;
	onToggleFeatured: () => void;
}

function ProductRow({ product, highlightProductId, onEditProduct, onDelete, onToggleFeatured }: ProductRowProps) {
	const { data: inventoryData, isLoading: inventoryLoading } = useProductInventory(product._id);
	
	// Calculate real inventory values
	const inventory = inventoryData?.availableStock ?? 0;
	const isLowStock = inventory > 0 && inventory <= (inventoryData?.lowStockThreshold ?? 10);
	const hasVariants = product.variants && product.variants.length > 0;
	
	return (
		<tr 
			id={`product-${product._id}`}
			onClick={() => onEditProduct?.(product)}
			className={cn(
				'hover:bg-muted/50 transition-all duration-300 cursor-pointer',
				highlightProductId === product._id && 'ring-2 ring-primary bg-primary/10 animate-highlight',
			)}
		>
			<td className='px-6 py-4 whitespace-nowrap'>
				<div className='flex items-center'>
					<div className='flex-shrink-0 h-10 w-10'>
						<img
							className='h-10 w-10 rounded-full object-cover'
							src={product.image || ''}
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
				<div className='flex items-center gap-2'>
					<button
						onClick={(e) => {
							e.stopPropagation();
							// Navigate to inventory tab with product filter
							window.location.hash = '#inventory';
						}}
						className='hover:scale-105 transition-transform'
					>
						{inventoryLoading ? (
							<InventoryBadgeLoading />
						) : (
							<InventoryBadge 
								inventory={inventory} 
								variant='admin'
								showCount
							/>
						)}
					</button>
					{!inventoryLoading && isLowStock && (
						<AlertTriangle className='w-4 h-4 text-orange-600' aria-label='Low stock' />
					)}
					{hasVariants && (
						<span className='text-xs text-muted-foreground'>
							(multi-variant)
						</span>
					)}
				</div>
			</td>
			<td className='px-6 py-4 whitespace-nowrap'>
				<button
					onClick={(e) => {
						e.stopPropagation();
						onToggleFeatured();
					}}
					className={`p-1 rounded-full ${
						product.isFeatured
							? 'bg-warning text-warning-foreground'
							: 'bg-muted text-muted-foreground'
					} hover:bg-warning/80 transition-colors duration-200`}
				>
					<Star className='h-5 w-5' />
				</button>
			</td>
			<td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
				<button
					onClick={(e) => {
						e.stopPropagation();
						onDelete();
					}}
					className='text-destructive hover:text-destructive/80'
				>
					<Trash className='h-5 w-5' />
				</button>
			</td>
		</tr>
	);
}

export default ProductsList;