import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { MoveRight, Loader } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { useCart } from "@/hooks/queries/useCart";
import { apiClient } from "@/lib/api-client";
import { useState } from "react";
import toast from "react-hot-toast";

const stripePromise = loadStripe(
	"pk_test_51KZYccCoOZF2UhtOwdXQl3vcizup20zqKqT9hVUIsVzsdBrhqbUI2fE0ZdEVLdZfeHjeyFXtqaNsyCJCmZWnjNZa00PzMAjlcL"
);

const OrderSummary = () => {
	const { data: cart } = useCart();
	const [isProcessing, setIsProcessing] = useState(false);

	const subtotal = cart?.subtotal || 0;
	const total = cart?.totalAmount || 0;
	const coupon = cart?.coupon;
	const cartItems = cart?.cartItems || [];

	const savings = subtotal - total;
	const formattedSubtotal = subtotal.toFixed(2);
	const formattedTotal = total.toFixed(2);
	const formattedSavings = savings.toFixed(2);

	const handlePayment = async () => {
		if (cartItems.length === 0) {
			toast.error("Your cart is empty");
			return;
		}

		try {
			setIsProcessing(true);
			const stripe = await stripePromise;
			
			if (!stripe) {
				throw new Error("Stripe failed to load");
			}

			const res = await apiClient.post("/payments/create-checkout-session", {
				products: cartItems.map(item => ({
					_id: item.product._id,
					quantity: item.quantity,
					price: item.product.price
				})),
				couponCode: coupon?.code || null,
			});

			const session = res.data as { id: string };
			const result = await stripe.redirectToCheckout({
				sessionId: session.id,
			});

			if (result.error) {
				throw new Error(result.error.message);
			}
		} catch (error: any) {
			toast.error(error.message || "Payment failed. Please try again.");
			console.error("Payment error:", error);
		} finally {
			setIsProcessing(false);
		}
	};

	return (
		<motion.div
			className='space-y-4 rounded-lg border border-gray-700 bg-gray-800 p-4 shadow-sm sm:p-6'
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5 }}
		>
			<p className='text-xl font-semibold text-emerald-400'>Order summary</p>

			<div className='space-y-4'>
				<div className='space-y-2'>
					<dl className='flex items-center justify-between gap-4'>
						<dt className='text-base font-normal text-gray-300'>Original price</dt>
						<dd className='text-base font-medium text-white'>${formattedSubtotal}</dd>
					</dl>

					{savings > 0 && (
						<dl className='flex items-center justify-between gap-4'>
							<dt className='text-base font-normal text-gray-300'>Savings</dt>
							<dd className='text-base font-medium text-emerald-400'>-${formattedSavings}</dd>
						</dl>
					)}

					{coupon && (
						<dl className='flex items-center justify-between gap-4'>
							<dt className='text-base font-normal text-gray-300'>Coupon ({coupon.code})</dt>
							<dd className='text-base font-medium text-emerald-400'>-{coupon.discountPercentage}%</dd>
						</dl>
					)}
					<dl className='flex items-center justify-between gap-4 border-t border-gray-600 pt-2'>
						<dt className='text-base font-bold text-white'>Total</dt>
						<dd className='text-base font-bold text-emerald-400'>${formattedTotal}</dd>
					</dl>
				</div>

				<motion.button
					className='flex w-full items-center justify-center rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-300 disabled:opacity-50 disabled:cursor-not-allowed'
					whileHover={{ scale: 1.05 }}
					whileTap={{ scale: 0.95 }}
					onClick={handlePayment}
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
					<span className='text-sm font-normal text-gray-400'>or</span>
					<Link
						to='/'
						className='inline-flex items-center gap-2 text-sm font-medium text-emerald-400 underline hover:text-emerald-300 hover:no-underline'
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