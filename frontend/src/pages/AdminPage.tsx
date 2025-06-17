import { BarChart, PlusCircle, ShoppingBasket } from "lucide-react";
import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";

import AnalyticsTab from "../components/AnalyticsTab";
import { CreateProductForm } from "../components/forms/CreateProductForm";
import ProductsList from "../components/ProductsList";
import { TransitionOverlay } from "../components/ui/transition-overlay";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import { TabId, NAVIGATION_DELAY } from "../types";
import { productEvents } from "../lib/events";

const AdminPage = () => {
	const [activeTab, setActiveTab] = useState<TabId>("create");
	const [newProductId, setNewProductId] = useState<string | null>(null);
	const [isNavigating, setIsNavigating] = useState(false);


	// Create callback for product creation
	const handleProductCreated = useCallback((productId: string) => {
		setNewProductId(productId);
		setIsNavigating(true);
		
		// Emit event for extensibility
		productEvents.emit('product:created', { productId, timestamp: Date.now() });
		
		// Show navigation feedback
		toast('Redirecting to products list...', {
			duration: 1500,
			icon: '🔄'
		});
		
		// Delayed navigation
		setTimeout(() => {
			setActiveTab('products');
			setIsNavigating(false);
		}, NAVIGATION_DELAY);
	}, []);

	// Enhanced tab switching
	const handleTabChange = (value: string) => {
		if (isNavigating) return; // Prevent manual navigation during auto-nav
		
		setActiveTab(value as TabId);
	};

	return (
		<div className='min-h-screen relative overflow-hidden'>
			<div className='relative z-10 container mx-auto px-4 py-16'>
				<motion.h1
					className='text-4xl font-bold mb-8 text-emerald-400 text-center'
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8 }}
				>
					Admin Dashboard
				</motion.h1>

				<Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
					<TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-8">
						<TabsTrigger value="create" disabled={isNavigating} className={isNavigating && activeTab === "create" ? "animate-pulse" : ""}>
							<PlusCircle className="mr-2 h-5 w-5" />
							Create Product
						</TabsTrigger>
						<TabsTrigger value="products" disabled={isNavigating} className={isNavigating && activeTab === "products" ? "animate-pulse" : ""}>
							<ShoppingBasket className="mr-2 h-5 w-5" />
							Products
						</TabsTrigger>
						<TabsTrigger value="analytics" disabled={isNavigating} className={isNavigating && activeTab === "analytics" ? "animate-pulse" : ""}>
							<BarChart className="mr-2 h-5 w-5" />
							Analytics
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
								<CreateProductForm onProductCreated={handleProductCreated} />
							</motion.div>
						</TabsContent>
						
						<TabsContent value="products">
							<motion.div
								initial={{ opacity: 0, x: 20 }}
								animate={{ opacity: 1, x: 0 }}
								exit={{ opacity: 0, x: -20 }}
								transition={{ duration: 0.2 }}
							>
								<ProductsList 
									highlightProductId={newProductId}
									onHighlightComplete={() => setNewProductId(null)}
								/>
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
					</div>
				</Tabs>
			</div>
		</div>
	);
};

export default AdminPage;