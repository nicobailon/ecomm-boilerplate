import { motion } from 'framer-motion';
import { Users, Package, ShoppingCart, DollarSign } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAnalytics } from '@/hooks/analytics/useAnalytics';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import type { LucideIcon } from 'lucide-react';

const AnalyticsTab = () => {
	const { data, isLoading } = useAnalytics();

	if (isLoading) {
		return <LoadingSpinner />;
	}

	const analyticsData = data?.analyticsData ?? {
		users: 0,
		products: 0,
		totalSales: 0,
		totalRevenue: 0,
	};

	const dailySalesData = data?.dailySalesData ?? [];

	return (
		<div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
			<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
				<AnalyticsCard
					title='Total Users'
					value={analyticsData.users.toLocaleString()}
					icon={Users}
					color='bg-gradient-primary'
				/>
				<AnalyticsCard
					title='Total Products'
					value={analyticsData.products.toLocaleString()}
					icon={Package}
					color='bg-gradient-accent'
				/>
				<AnalyticsCard
					title='Total Sales'
					value={analyticsData.totalSales.toLocaleString()}
					icon={ShoppingCart}
					color='bg-gradient-primary'
				/>
				<AnalyticsCard
					title='Total Revenue'
					value={`$${analyticsData.totalRevenue.toLocaleString()}`}
					icon={DollarSign}
					color='bg-gradient-accent'
				/>
			</div>
			<motion.div
				className='bg-card/60 rounded-lg p-6 shadow-lg'
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, delay: 0.25 }}
			>
				<ResponsiveContainer width='100%' height={400}>
					<LineChart data={dailySalesData}>
						<CartesianGrid strokeDasharray='3 3' />
						<XAxis dataKey='name' stroke='#D1D5DB' />
						<YAxis yAxisId='left' stroke='#D1D5DB' />
						<YAxis yAxisId='right' orientation='right' stroke='#D1D5DB' />
						<Tooltip />
						<Legend />
						<Line
							yAxisId='left'
							type='monotone'
							dataKey='sales'
							stroke='#10B981'
							activeDot={{ r: 8 }}
							name='Sales'
						/>
						<Line
							yAxisId='right'
							type='monotone'
							dataKey='revenue'
							stroke='#3B82F6'
							activeDot={{ r: 8 }}
							name='Revenue'
						/>
					</LineChart>
				</ResponsiveContainer>
			</motion.div>
		</div>
	);
};

interface AnalyticsCardProps {
	title: string;
	value: string;
	icon: LucideIcon;
	color: string;
}

const AnalyticsCard = ({ title, value, icon: Icon, color }: AnalyticsCardProps) => (
	<motion.div
		className={'bg-card rounded-lg p-6 shadow-lg overflow-hidden relative'}
		initial={{ opacity: 0, y: 20 }}
		animate={{ opacity: 1, y: 0 }}
		transition={{ duration: 0.5 }}
	>
		<div className='flex justify-between items-center'>
			<div className='z-10'>
				<p className='text-primary text-sm mb-1 font-semibold'>{title}</p>
				<h3 className='text-white text-3xl font-bold'>{value}</h3>
			</div>
		</div>
		<div className={`absolute inset-0 ${color} opacity-30`} />
		<div className='absolute -bottom-4 -right-4 text-primary/20'>
			<Icon className='h-32 w-32' />
		</div>
	</motion.div>
);

export default AnalyticsTab;