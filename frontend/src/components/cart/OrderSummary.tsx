import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { MoveRight, Loader, AlertCircle } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { useUnifiedCart } from '@/hooks/cart/useUnifiedCart';
import { apiClient } from '@/lib/api-client';
import { useState } from 'react';
import { toast } from 'sonner';
import { isAxiosError } from 'axios';

interface CheckoutProduct {
	_id: string;
	quantity: number;
	variantId?: string;
	variantLabel?: string;
}

interface CheckoutRequest {
	products: CheckoutProduct[];
	couponCode?: string;
}

interface ValidationError {
	field: string;
	message: string;
}

interface ErrorResponse {
	errors?: ValidationError[];
	error?: string;
	message?: string;
}

interface InventoryAdjustment {
	productId: string;
	productName: string;
	variantDetails?: string;
	requestedQuantity: number;
	adjustedQuantity: number;
	availableStock: number;
}

interface CheckoutSessionResponse {
	id: string;
	adjustments?: InventoryAdjustment[];
}

const stripePromise = loadStripe(
	(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined) ?? 'pk_test_51KZYccCoOZF2UhtOwdXQl3vcizup20zqKqT9hVUIsVzsdBrhqbUI2fE0ZdEVLdZfeHjeyFXtqaNsyCJCmZWnjNZa00PzMAjlcL',
);

const OrderSummary = () => {
	const { data: cart, source } = useUnifiedCart();
	const [isProcessing, setIsProcessing] = useState(false);
	const [adjustments, setAdjustments] = useState<InventoryAdjustment[]>([]);
	const navigate = useNavigate();

	const subtotal = cart?.subtotal ?? 0;
	const total = cart?.totalAmount ?? 0;
	const coupon = cart?.appliedCoupon;
	const cartItems = cart?.cartItems ?? [];

	const savings = subtotal - total;
	const formattedSubtotal = subtotal.toFixed(2);
	const formattedTotal = total.toFixed(2);
	const formattedSavings = savings.toFixed(2);

	const handlePayment = async () => {
		if (cartItems.length === 0) {
			toast.error('Your cart is empty');
			return;
		}

		if (source === 'guest') {
			toast.error('Please login to proceed with checkout');
			void navigate('/login');
			return;
		}

		try {
			setIsProcessing(true);
			const stripe = await stripePromise;
			
			if (!stripe) {
				throw new Error('Stripe failed to load');
			}

			const checkoutData: CheckoutRequest = {
				products: cartItems.map(item => ({
					_id: item.product._id,
					quantity: item.quantity,
					variantId: item.variantId,
					variantLabel: item.variantDetails?.label,
				})),
			};

			// Only include couponCode if we have a coupon
			if (coupon?.code) {
				checkoutData.couponCode = coupon.code;
			}

			const res = await apiClient.post('/payments/create-checkout-session', checkoutData);

			const session = res.data as CheckoutSessionResponse;
			
			// Handle inventory adjustments if any
			if (session.adjustments && session.adjustments.length > 0) {
				setAdjustments(session.adjustments);
				
				// Show toast notification for adjustments
				const adjustmentMessage = session.adjustments.map(adj => {
					const variantInfo = adj.variantDetails ? ` (${adj.variantDetails})` : '';
					return `${adj.productName}${variantInfo}: quantity adjusted from ${adj.requestedQuantity} to ${adj.adjustedQuantity}`;
				}).join('\n');
				
				toast.info(`Cart adjusted due to inventory changes:\n${adjustmentMessage}`, {
					duration: 5000,
				});
				
				// Wait a moment for user to see the adjustment message
				await new Promise(resolve => setTimeout(resolve, 2000));
			}
			
			const result = await stripe.redirectToCheckout({
				sessionId: session.id,
			});

			if (result.error) {
				throw new Error(result.error.message);
			}
		} catch (error) {
			let errorMessage = 'Payment failed. Please try again.';
			
			// Handle validation errors with details
			if (isAxiosError<ErrorResponse>(error)) {
				const data = error.response?.data;
				if (data?.errors && Array.isArray(data.errors)) {
					const validationErrors = data.errors
						.map((err) => `${err.field}: ${err.message}`)
						.join(', ');
					errorMessage = `Validation error: ${validationErrors}`;
				} else if (data?.error) {
					errorMessage = data.error;
				} else if (data?.message) {
					errorMessage = data.message;
				}
				console.error('Checkout error:', data);
			} else if (error instanceof Error) {
				errorMessage = error.message;
				console.error('Checkout error:', error);
			}
			
			toast.error(errorMessage);
		} finally {
			setIsProcessing(false);
		}
	};

	return (
		<motion.div
			className='space-y-4 rounded-lg border border-border bg-card p-4 shadow-sm sm:p-6'
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5 }}
		>
			<p className='text-xl font-semibold text-primary'>Order summary</p>

			<AnimatePresence>
				{adjustments.length > 0 && (
					<motion.div
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: 'auto' }}
						exit={{ opacity: 0, height: 0 }}
						className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4"
					>
						<div className="flex items-start gap-3">
							<AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
							<div className="flex-1">
								<h4 className="text-sm font-medium text-orange-800 dark:text-orange-200 mb-1">
									Cart Adjusted for Available Inventory
								</h4>
								<ul className="text-sm text-orange-700 dark:text-orange-300 space-y-1">
									{adjustments.map((adj, index) => {
										const variantInfo = adj.variantDetails ? ` (${adj.variantDetails})` : '';
										return (
											<li key={index}>
												<span className="font-medium">{adj.productName}{variantInfo}:</span>{' '}
												quantity changed from {adj.requestedQuantity} to {adj.adjustedQuantity}
											</li>
										);
									})}
								</ul>
							</div>
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			<div className='space-y-4'>
				<div className='space-y-2'>
					<dl className='flex items-center justify-between gap-4'>
						<dt className='text-base font-normal text-muted-foreground'>Original price</dt>
						<dd className='text-base font-medium text-white'>${formattedSubtotal}</dd>
					</dl>

					{savings > 0 && (
						<dl className='flex items-center justify-between gap-4'>
							<dt className='text-base font-normal text-muted-foreground'>Savings</dt>
							<dd className='text-base font-medium text-primary'>-${formattedSavings}</dd>
						</dl>
					)}

					{coupon && (
						<dl className='flex items-center justify-between gap-4'>
							<dt className='text-base font-normal text-muted-foreground'>Coupon ({coupon.code})</dt>
							<dd className='text-base font-medium text-primary'>-{coupon.discountPercentage}%</dd>
						</dl>
					)}
					<dl className='flex items-center justify-between gap-4 border-t border-border pt-2'>
						<dt className='text-base font-bold text-white'>Total</dt>
						<dd className='text-base font-bold text-primary'>${formattedTotal}</dd>
					</dl>
				</div>

				<motion.button
					className='flex w-full items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/80 focus:outline-none focus:ring-4 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed'
					whileHover={{ scale: 1.05 }}
					whileTap={{ scale: 0.95 }}
					onClick={() => void handlePayment()}
					disabled={isProcessing || cartItems.length === 0}
				>
					{isProcessing ? (
						<>
							<Loader className="animate-spin mr-2 h-4 w-4" />
							Processing...
						</>
					) : (
						'Proceed to Checkout'
					)}
				</motion.button>

				<div className='flex items-center justify-center gap-2'>
					<span className='text-sm font-normal text-muted-foreground'>or</span>
					<Link
						to='/'
						className='inline-flex items-center gap-2 text-sm font-medium text-primary underline hover:text-primary/80 hover:no-underline'
					>
						Continue Shopping
						<MoveRight size={16} />
					</Link>
				</div>
			</div>
		</motion.div>
	);
};

export default OrderSummary;