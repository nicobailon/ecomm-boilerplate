import { BarChart, PlusCircle, ShoppingBasket, FolderOpen, Tag, Package, ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';

import AnalyticsTab from './AnalyticsTab';
import { CollectionsTab } from './CollectionsTab';
import DiscountsTab from './DiscountsTab';
import { InventoryTab } from './InventoryTab';
import { OrdersTab } from './OrdersTab';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DiscountErrorFallback } from '@/components/discount/DiscountErrorFallback';
import { ProductForm } from '@/components/forms/ProductForm';
import { ProductsTable } from '@/components/product/ProductsTable';
import { TransitionOverlay } from '@/components/ui/transition-overlay';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import type { TabId } from '@/types';
import { useProductCreation } from '@/hooks/product/useProductCreation';
import { useProductEditor } from '@/hooks/product/useProductEditor';
import { ProductEditDrawer } from '@/components/drawers/ProductEditDrawer';

const AdminPage = () => {
	const [activeTab, setActiveTab] = useState<TabId>('create');
	
	// Use the product creation hook
	const {
		isNavigating,
		newProductId,
		clearHighlight,
	} = useProductCreation({
		onNavigate: (tab) => setActiveTab(tab),
	});
	
	// Use the product editor hook
	const {
		selectedProduct,
		isEditDrawerOpen,
		openEditor,
		closeEditor,
	} = useProductEditor();

	// Enhanced tab switching
	const handleTabChange = (value: string) => {
		if (isNavigating) return; // Prevent manual navigation during auto-nav
		
		setActiveTab(value as TabId);
	};

	return (
		<div className='min-h-screen relative overflow-hidden'>
			<div className='relative z-10 container mx-auto px-4 py-16'>
				<motion.h1
					className='text-4xl font-bold mb-8 text-primary text-center'
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8 }}
				>
					Admin Dashboard
				</motion.h1>

				<Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
					<TabsList className="grid w-full max-w-4xl mx-auto grid-cols-7 mb-8">
						<TabsTrigger value="create" disabled={isNavigating} className={isNavigating && activeTab === 'create' ? 'animate-pulse' : ''}>
							<PlusCircle className="mr-2 h-5 w-5" />
							Create Product
						</TabsTrigger>
						<TabsTrigger value="products" disabled={isNavigating} className={isNavigating && activeTab === 'products' ? 'animate-pulse' : ''}>
							<ShoppingBasket className="mr-2 h-5 w-5" />
							Products
						</TabsTrigger>
						<TabsTrigger value="collections" disabled={isNavigating} className={isNavigating && activeTab === 'collections' ? 'animate-pulse' : ''}>
							<FolderOpen className="mr-2 h-5 w-5" />
							Collections
						</TabsTrigger>
						<TabsTrigger value="analytics" disabled={isNavigating} className={isNavigating && activeTab === 'analytics' ? 'animate-pulse' : ''}>
							<BarChart className="mr-2 h-5 w-5" />
							Analytics
						</TabsTrigger>
						<TabsTrigger value="discounts" disabled={isNavigating} className={isNavigating && activeTab === 'discounts' ? 'animate-pulse' : ''}>
							<Tag className="mr-2 h-5 w-5" />
							Discounts
						</TabsTrigger>
						<TabsTrigger value="inventory" disabled={isNavigating} className={isNavigating && activeTab === 'inventory' ? 'animate-pulse' : ''}>
							<Package className="mr-2 h-5 w-5" />
							Inventory
						</TabsTrigger>
						<TabsTrigger value="orders" id="orders-tab" disabled={isNavigating} className={isNavigating && activeTab === 'orders' ? 'animate-pulse' : ''}>
							<ShoppingCart className="mr-2 h-5 w-5" />
							Orders
						</TabsTrigger>
					</TabsList>

					<div className="relative">
						<TransitionOverlay 
							isVisible={isNavigating}
							message="Navigating to products list..."
						/>
						
						<TabsContent value="create">
							<motion.div
								initial={{ opacity: 0, x: 20 }}
								animate={{ opacity: 1, x: 0 }}
								exit={{ opacity: 0, x: -20 }}
								transition={{ duration: 0.2 }}
							>
								<ProductForm mode="create" />
							</motion.div>
						</TabsContent>
						
						<TabsContent value="products">
							<motion.div
								initial={{ opacity: 0, x: 20 }}
								animate={{ opacity: 1, x: 0 }}
								exit={{ opacity: 0, x: -20 }}
								transition={{ duration: 0.2 }}
							>
								<ProductsTable 
									onEditProduct={openEditor}
									highlightProductId={newProductId}
									onHighlightComplete={clearHighlight}
								/>
							</motion.div>
						</TabsContent>
						
						<TabsContent value="collections">
							<motion.div
								initial={{ opacity: 0, x: 20 }}
								animate={{ opacity: 1, x: 0 }}
								exit={{ opacity: 0, x: -20 }}
								transition={{ duration: 0.2 }}
							>
								<CollectionsTab />
							</motion.div>
						</TabsContent>
						
						<TabsContent value="analytics">
							<motion.div
								initial={{ opacity: 0, x: 20 }}
								animate={{ opacity: 1, x: 0 }}
								exit={{ opacity: 0, x: -20 }}
								transition={{ duration: 0.2 }}
							>
								<AnalyticsTab />
							</motion.div>
						</TabsContent>
						
						<TabsContent value="discounts">
							<motion.div
								initial={{ opacity: 0, x: 20 }}
								animate={{ opacity: 1, x: 0 }}
								exit={{ opacity: 0, x: -20 }}
								transition={{ duration: 0.2 }}
							>
								<ErrorBoundary
									fallback={(error, reset) => (
										<DiscountErrorFallback error={error} reset={reset} />
									)}
								>
									<DiscountsTab />
								</ErrorBoundary>
							</motion.div>
						</TabsContent>
						
						<TabsContent value="inventory">
							<motion.div
								initial={{ opacity: 0, x: 20 }}
								animate={{ opacity: 1, x: 0 }}
								exit={{ opacity: 0, x: -20 }}
								transition={{ duration: 0.2 }}
							>
								<InventoryTab />
							</motion.div>
						</TabsContent>
						
						<TabsContent value="orders">
							<motion.div
								initial={{ opacity: 0, x: 20 }}
								animate={{ opacity: 1, x: 0 }}
								exit={{ opacity: 0, x: -20 }}
								transition={{ duration: 0.2 }}
							>
								<OrdersTab />
							</motion.div>
						</TabsContent>
					</div>
				</Tabs>
			</div>

			<ProductEditDrawer
				isOpen={isEditDrawerOpen}
				product={selectedProduct}
				onClose={closeEditor}
			/>
		</div>
	);
};

export default AdminPage;