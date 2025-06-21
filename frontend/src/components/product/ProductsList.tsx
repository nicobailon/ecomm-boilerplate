import { motion } from 'framer-motion';
import { Trash, Star, AlertTriangle, Info } from 'lucide-react';
import { useProducts, useDeleteProduct, useToggleFeatured, useFeaturedProducts } from '@/hooks/product/useProducts';
import LoadingSpinner from '../ui/LoadingSpinner';
import { useEffect } from 'react';
import * as React from 'react';
import type { ProductsListProps, Product } from '@/types';
import { cn } from '@/lib/utils';
import { InventoryBadge } from '@/components/ui/InventoryBadge';
import { useProductInventory } from '@/hooks/queries/useInventory';
import { InventoryBadgeLoading } from '@/components/ui/InventorySkeleton';

const FeaturedCountBanner = () => {
	const { data: featuredProducts, isLoading } = useFeaturedProducts();
	const count = React.useMemo(() => featuredProducts?.length ?? 0, [featuredProducts]);
	
	if (isLoading || count === 0) return null;
	
	return (
		<div className="mb-4 flex items-center justify-between bg-muted/50 rounded-lg p-3">
			<div className="flex items-center gap-2">
				<Star className="h-5 w-5 text-warning fill-warning" />
				<span className="text-sm font-medium" data-testid="featured-count">
					{count} featured product{count !== 1 ? 's' : ''} in homepage carousel
				</span>
			</div>
			<a 
				href="/" 
				className="text-sm text-primary hover:underline"
				target="_blank"
				rel="noopener noreferrer"
			>
				Preview homepage →
			</a>
		</div>
	);
};

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
		<>
			<FeaturedCountBanner />
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
							Featured <span title="Featured products appear in the homepage carousel"><Info className="inline-block w-3 h-3 ml-1 cursor-help" /></span>
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
		</>
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
	const [isToggling, setIsToggling] = React.useState(false);
	
	// Calculate real inventory values
	const inventory = inventoryData?.availableStock ?? 0;
	const isLowStock = inventory > 0 && inventory <= (inventoryData?.lowStockThreshold ?? 10);
	const hasVariants = product.variants && product.variants.length > 0;
	
	const handleToggleFeatured = async (e: React.MouseEvent) => {
		e.stopPropagation();
		setIsToggling(true);
		try {
			await onToggleFeatured();
		} finally {
			setIsToggling(false);
		}
	};
	
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
					onClick={handleToggleFeatured}
					disabled={isToggling}
					data-testid="toggle-feature"
					className={cn(
						'p-1 rounded-full transition-all duration-200',
						product.isFeatured
							? 'bg-warning text-warning-foreground hover:bg-warning/80 ring-2 ring-warning/40'
							: 'bg-muted text-muted-foreground hover:bg-warning/80',
						isToggling && 'opacity-50 cursor-not-allowed animate-pulse'
					)}
					title={product.isFeatured ? 'Remove from homepage carousel' : 'Add to homepage carousel'}
				>
					<Star 
						className={cn(
							'h-5 w-5 transition-transform',
							isToggling && 'animate-spin',
							product.isFeatured && 'fill-current'
						)} 
					/>
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