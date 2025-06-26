import { useListCollections } from '@/hooks/collections/useCollections';
import { CollectionCard } from '@/components/collections/CollectionCard';
import FeaturedProducts from '@/components/product/FeaturedProducts';
import { useFeaturedProducts } from '@/hooks/product/useProducts';
import { Skeleton } from '@/components/ui/Skeleton';
import { HeroBanner } from '@/components/ui/HeroBanner';
import { useFeaturedCollections } from '@/hooks/queries/useHeroBanners';

const HomePage = () => {
	const { data: featuredProducts, isLoading: isLoadingFeatured } = useFeaturedProducts();
	const { data: collectionsData, isLoading: isLoadingCollections } = useListCollections({
		isPublic: true,
		limit: 6,
	});
	const { data: featuredCollections, isLoading: isLoadingFeaturedCollections } = useFeaturedCollections();

	const collections = collectionsData?.collections;
	const heroCollection = featuredCollections?.[0];

	return (
		<div className='relative min-h-screen text-foreground overflow-hidden'>
			<div className='relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16'>
				{/* Hero Banner Section */}
				{!isLoadingFeaturedCollections && heroCollection?.heroImage && (
					<div className="mb-16">
						<HeroBanner
							title={heroCollection.heroTitle ?? heroCollection.name}
							subtitle={heroCollection.heroSubtitle ?? heroCollection.description}
							imageUrl={heroCollection.heroImage}
							buttonText="Shop Collection"
							buttonUrl={`/collections/${heroCollection.slug}`}
							height="large"
						/>
					</div>
				)}

				<h1 className='text-center text-5xl sm:text-6xl font-bold text-primary mb-4'>
					Explore Our Collections
				</h1>
				<p className='text-center text-xl text-muted-foreground mb-12'>
					Discover the latest trends in eco-friendly fashion
				</p>

				<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8'>
					{isLoadingCollections &&
						Array.from({ length: 6 }).map((_, i) => (
							<div key={i} className="space-y-3">
								<Skeleton className="aspect-[4/3] w-full" />
								<Skeleton className="h-5 w-3/4" />
								<Skeleton className="h-4 w-1/2" />
							</div>
						))}
					
					{!isLoadingCollections && collections && collections.length > 0 && 
						collections.map((collection) => (
							<CollectionCard collection={collection} key={collection.slug} />
						))
					}
					
					{!isLoadingCollections && (!collections || collections.length === 0) && (
						<div className="col-span-full text-center py-12">
							<p className="text-muted-foreground text-lg">No collections available yet.</p>
							<p className="text-muted-foreground mt-2">Check back later for curated collections!</p>
						</div>
					)}
				</div>

				{!isLoadingFeatured && featuredProducts && featuredProducts.length > 0 && (
					<FeaturedProducts featuredProducts={featuredProducts} />
				)}
			</div>
		</div>
	);
};

export default HomePage;