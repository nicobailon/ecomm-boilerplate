import { Link } from "react-router-dom";

interface Category {
	href: string;
	name: string;
	imageUrl: string;
}

interface CategoryItemProps {
	category: Category;
}

const CategoryItem: React.FC<CategoryItemProps> = ({ category }) => {
	return (
		<div className='relative overflow-hidden h-96 w-full rounded-lg group bg-card'>
			<Link to={"/category" + category.href}>
				<div className='w-full h-full cursor-pointer'>
					<div className='absolute inset-0 bg-gradient-to-b from-transparent to-background opacity-50 z-10' />
					<img
						src={category.imageUrl}
						alt={category.name}
						className='w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110'
						loading='lazy'
					/>
					<div className='absolute bottom-0 left-0 right-0 p-4 z-20'>
						<h3 className='text-foreground text-2xl font-bold mb-2'>{category.name}</h3>
						<p className='text-muted-foreground text-sm'>Explore {category.name}</p>
					</div>
				</div>
			</Link>
		</div>
	);
};

export default CategoryItem;