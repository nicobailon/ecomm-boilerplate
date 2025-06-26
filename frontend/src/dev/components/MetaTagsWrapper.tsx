import { useMetaTags } from '@/components/seo/MetaTags';

interface MetaTagsWrapperProps {
  title: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  price?: number;
  currency?: string;
  availability?: 'in stock' | 'out of stock';
}

export default function MetaTagsWrapper(props: MetaTagsWrapperProps) {
  useMetaTags(props);
  
  return (
    <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-900">
      <h3 className="font-semibold mb-2">MetaTags Applied</h3>
      <dl className="space-y-1 text-sm">
        <div>
          <dt className="inline font-medium">Title:</dt>
          <dd className="inline ml-2 text-gray-600 dark:text-gray-400">{props.title}</dd>
        </div>
        {props.description && (
          <div>
            <dt className="inline font-medium">Description:</dt>
            <dd className="inline ml-2 text-gray-600 dark:text-gray-400">{props.description}</dd>
          </div>
        )}
        {props.type && (
          <div>
            <dt className="inline font-medium">Type:</dt>
            <dd className="inline ml-2 text-gray-600 dark:text-gray-400">{props.type}</dd>
          </div>
        )}
      </dl>
      <p className="mt-3 text-xs text-gray-500">Check the browser&apos;s head element to see the meta tags</p>
    </div>
  );
}