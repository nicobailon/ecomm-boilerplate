import { Link } from 'react-router-dom';
import { type RouterOutputs } from '@/lib/trpc';
import { OptimizedImage } from '@/components/ui/OptimizedImage';

type Collection = RouterOutputs['collection']['list']['collections'][0];

interface CollectionCardProps {
  collection: Collection;
}

export const CollectionCard = ({ collection }: CollectionCardProps) => {
  const firstProduct = Array.isArray(collection.products) && collection.products.length > 0
    ? collection.products[0]
    : null;

  const imageUrl = typeof firstProduct === 'object' && 
    firstProduct !== null && 
    'image' in firstProduct && 
    typeof firstProduct.image === 'string'
    ? firstProduct.image 
    : null;

  return (
    <Link to={`/collections/${collection.slug}`} className="group block">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-muted">
        {imageUrl ? (
          <OptimizedImage
            src={imageUrl}
            alt={collection.name}
            className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-200">
            <span className="text-gray-500">No Image</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
      </div>
      <h3 className="mt-4 text-xl font-bold text-foreground">{collection.name}</h3>
      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
        {collection.description ?? 'Explore this curated collection.'}
      </p>
    </Link>
  );
};