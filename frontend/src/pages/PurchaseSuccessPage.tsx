import { ArrowRight, CheckCircle, HandHeart } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiClient } from "@/lib/api-client";
import Confetti from "react-confetti";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import LoadingSpinner from "../components/LoadingSpinner";

const PurchaseSuccessPage = () => {
	const [error, setError] = useState<string | null>(null);
	const queryClient = useQueryClient();

	const checkoutSuccessMutation = useMutation({
		mutationFn: async (sessionId: string) => {
			const response = await apiClient.post("/payments/checkout-success", {
				sessionId,
			});
			return response.data;
		},
		onSuccess: () => {
			// Clear cart cache
			queryClient.invalidateQueries({ queryKey: ['cart'] });
			queryClient.setQueryData(['cart'], { cartItems: [], totalAmount: 0, subtotal: 0, coupon: null });
		},
		onError: (error: any) => {
			console.error(error);
			setError(error.response?.data?.message || "Something went wrong");
		},
	});

	useEffect(() => {
		const sessionId = new URLSearchParams(window.location.search).get("session_id");
		if (sessionId) {
			checkoutSuccessMutation.mutate(sessionId);
		} else {
			setError("No session ID found in the URL");
		}
	}, []);

	if (checkoutSuccessMutation.isPending) {
		return <LoadingSpinner />;
	}

	if (error) {
		return (
			<div className='h-screen flex items-center justify-center px-4'>
				<div className='max-w-md w-full bg-gray-800 rounded-lg shadow-xl p-8'>
					<h1 className='text-2xl font-bold text-red-500 mb-4'>Error</h1>
					<p className='text-gray-300'>{error}</p>
					<Link
						to={"/"}
						className='mt-4 inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4 rounded-lg transition duration-300'
					>
						Go Home
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className='h-screen flex items-center justify-center px-4'>
			<Confetti
				width={window.innerWidth}
				height={window.innerHeight}
				gravity={0.1}
				style={{ zIndex: 99 }}
				numberOfPieces={700}
				recycle={false}
			/>

			<div className='max-w-md w-full bg-gray-800 rounded-lg shadow-xl overflow-hidden relative z-10'>
				<div className='p-6 sm:p-8'>
					<div className='flex justify-center'>
						<CheckCircle className='text-emerald-400 w-16 h-16 mb-4' />
					</div>
					<h1 className='text-2xl sm:text-3xl font-bold text-center text-emerald-400 mb-2'>
						Purchase Successful!
					</h1>

					<p className='text-gray-300 text-center mb-2'>
						Thank you for your order. {"We're"} processing it now.
					</p>
					<p className='text-emerald-400 text-center text-sm mb-6'>
						Check your email for order details and updates.
					</p>
					<div className='bg-gray-700 rounded-lg p-4 mb-6'>
						<div className='flex items-center justify-between mb-2'>
							<span className='text-sm text-gray-400'>Order number</span>
							<span className='text-sm font-semibold text-emerald-400'>#12345</span>
						</div>
						<div className='flex items-center justify-between'>
							<span className='text-sm text-gray-400'>Estimated delivery</span>
							<span className='text-sm font-semibold text-emerald-400'>3-5 business days</span>
						</div>
					</div>

					<div className='space-y-4'>
						<button
							className='w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4
             rounded-lg transition duration-300 flex items-center justify-center'
						>
							<HandHeart className='mr-2' size={18} />
							Thanks for trusting us!
						</button>
						<Link
							to={"/"}
							className='w-full bg-gray-700 hover:bg-gray-600 text-emerald-400 font-bold py-2 px-4 
            rounded-lg transition duration-300 flex items-center justify-center'
						>
							Continue Shopping
							<ArrowRight className='ml-2' size={18} />
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
};

export default PurchaseSuccessPage;