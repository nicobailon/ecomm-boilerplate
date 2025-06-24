import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useUnifiedCart, useApplyCoupon, useRemoveCoupon } from '@/hooks/cart/useUnifiedCart';
import { Loader } from 'lucide-react';
import { Link } from 'react-router-dom';

const GiftCouponCard = () => {
	const [userInputCode, setUserInputCode] = useState('');
	const { data: cart, source } = useUnifiedCart();
	const applyCoupon = useApplyCoupon();
	const removeCoupon = useRemoveCoupon();

	const coupon = cart?.appliedCoupon;
	const isGuest = source === 'guest';

	const handleApplyCoupon = () => {
		if (!userInputCode.trim()) return;
		applyCoupon.mutate(userInputCode);
	};

	const handleRemoveCoupon = () => {
		removeCoupon.mutate();
		setUserInputCode('');
	};

	// Clear input on successful coupon application
	useEffect(() => {
		if (applyCoupon.isSuccess && coupon) {
			setUserInputCode('');
		}
	}, [applyCoupon.isSuccess, coupon]);

	if (isGuest) {
		return (
			<motion.div
				className='space-y-4 rounded-lg border border-border bg-card p-4 shadow-sm sm:p-6'
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, delay: 0.2 }}
			>
				<div className='text-center space-y-3'>
					<h3 className='text-lg font-medium text-foreground'>Vouchers & Gift Cards</h3>
					<p className='text-sm text-muted-foreground'>
						Sign in to your account to apply discount codes and save on your order.
					</p>
					<Link 
						to="/login" 
						className="inline-flex items-center justify-center rounded-lg bg-primary border border-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/80 focus:outline-none focus:ring-4 focus:ring-ring"
					>
						Sign in to use vouchers
					</Link>
				</div>
			</motion.div>
		);
	}

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
						disabled={applyCoupon.isPending || removeCoupon.isPending || !!coupon}
						required
					/>
				</div>

				{!coupon && (
					<motion.button
						type='button'
						className='flex w-full items-center justify-center rounded-lg bg-primary border border-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/80 focus:outline-none focus:ring-4 focus:ring-ring disabled:opacity-50'
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
						onClick={handleApplyCoupon}
						disabled={applyCoupon.isPending || !userInputCode.trim()}
					>
						{applyCoupon.isPending ? (
							<>
								<Loader className="animate-spin mr-2 h-4 w-4" />
								Applying...
							</>
						) : (
							'Apply Code'
						)}
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
						className='mt-2 flex w-full items-center justify-center rounded-lg bg-destructive border border-destructive
            px-5 py-2.5 text-sm font-medium text-destructive-foreground hover:bg-destructive/80 focus:outline-none
             focus:ring-4 focus:ring-ring disabled:opacity-50'
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
						onClick={handleRemoveCoupon}
						disabled={removeCoupon.isPending}
					>
						{removeCoupon.isPending ? (
							<>
								<Loader className="animate-spin mr-2 h-4 w-4" />
								Removing...
							</>
						) : (
							'Remove Coupon'
						)}
					</motion.button>
				</div>
			)}
		</motion.div>
	);
};

export default GiftCouponCard;