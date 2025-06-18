import ProductCard from "./ProductCard";
import LoadingSpinner from "../ui/LoadingSpinner";
import { useProductRecommendations } from "@/hooks/product/useProducts";

const PeopleAlsoBought = () => {
	const { data: recommendations, isLoading } = useProductRecommendations();

	if (isLoading) return <LoadingSpinner />;

	if (!recommendations || recommendations.length === 0) {
		return null;
	}

	return (
		<div className='mt-8'>
			<h3 className='text-2xl font-semibold text-primary'>People also bought</h3>
			<div className='mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
				{recommendations.map((product) => (
					<ProductCard key={product._id} product={product} />
				))}
			</div>
		</div>
	);
};

export default PeopleAlsoBought;