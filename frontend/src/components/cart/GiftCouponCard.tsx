import { motion } from "framer-motion";
import { useState } from "react";
import { useCart, useApplyCoupon, useRemoveCoupon } from "@/hooks/cart/useCart";

const GiftCouponCard = () => {
	const [userInputCode, setUserInputCode] = useState("");
	const { data: cart } = useCart();
	const applyCoupon = useApplyCoupon();
	const removeCoupon = useRemoveCoupon();

	const coupon = cart?.coupon;

	const handleApplyCoupon = () => {
		if (!userInputCode.trim()) return;
		applyCoupon.mutate(userInputCode);
	};

	const handleRemoveCoupon = () => {
		removeCoupon.mutate();
		setUserInputCode("");
	};

	return (
		<motion.div
			className='space-y-4 rounded-lg border border-border bg-card p-4 shadow-sm sm:p-6'
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5, delay: 0.2 }}
		>
			<div className='space-y-4'>
				<div>
					<label htmlFor='voucher' className='mb-2 block text-sm font-medium text-muted-foreground'>
						Do you have a voucher or gift card?
					</label>
					<input
						type='text'
						id='voucher'
						className='block w-full rounded-lg border border-border bg-muted 
            p-2.5 text-sm text-foreground placeholder-muted-foreground focus:border-primary 
            focus:ring-primary'
						placeholder='Enter code here'
						value={userInputCode}
						onChange={(e) => setUserInputCode(e.target.value)}
						disabled={applyCoupon.isPending || !!coupon}
						required
					/>
				</div>

				{!coupon && (
					<motion.button
						type='button'
						className='flex w-full items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/80 focus:outline-none focus:ring-4 focus:ring-ring disabled:opacity-50'
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
						onClick={handleApplyCoupon}
						disabled={applyCoupon.isPending || !userInputCode.trim()}
					>
						{applyCoupon.isPending ? 'Applying...' : 'Apply Code'}
					</motion.button>
				)}
			</div>
			
			{coupon && (
				<div className='mt-4'>
					<h3 className='text-lg font-medium text-foreground'>Applied Coupon</h3>

					<p className='mt-2 text-sm text-muted-foreground'>
						{coupon.code} - {coupon.discountPercentage}% off
					</p>

					<motion.button
						type='button'
						className='mt-2 flex w-full items-center justify-center rounded-lg bg-destructive 
            px-5 py-2.5 text-sm font-medium text-destructive-foreground hover:bg-destructive/80 focus:outline-none
             focus:ring-4 focus:ring-ring disabled:opacity-50'
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
						onClick={handleRemoveCoupon}
						disabled={removeCoupon.isPending}
					>
						{removeCoupon.isPending ? 'Removing...' : 'Remove Coupon'}
					</motion.button>
				</div>
			)}
		</motion.div>
	);
};

export default GiftCouponCard;