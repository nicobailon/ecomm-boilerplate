import { useEffect } from 'react';

interface MetaTagsProps {
  title: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product';
  price?: number;
  currency?: string;
  availability?: 'in stock' | 'out of stock';
}

export function useMetaTags({
  title,
  description,
  image,
  url,
  type = 'website',
  price,
  currency = 'USD',
  availability,
}: MetaTagsProps) {
  useEffect(() => {
    const siteUrl = (import.meta.env.VITE_SITE_URL as string | undefined) ?? 'https://example.com';
    const fullUrl: string = url ? `${siteUrl}${url}` : siteUrl;
    const defaultImage = `${siteUrl}/og-image.jpg`;
    const ogImage = image ?? defaultImage;

    document.title = title;

    const setMetaTag = (name: string, content: string, isProperty = false) => {
      const attribute = isProperty ? 'property' : 'name';
      let element = document.querySelector(`meta[${attribute}="${name}"]`);
      
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      
      element.setAttribute('content', content);
    };

    if (description) {
      setMetaTag('description', description);
    }

    setMetaTag('og:title', title, true);
    setMetaTag('og:type', type, true);
    setMetaTag('og:url', fullUrl, true);
    if (description) {
      setMetaTag('og:description', description, true);
    }
    setMetaTag('og:image', ogImage, true);

    setMetaTag('twitter:card', 'summary_large_image');
    setMetaTag('twitter:title', title);
    if (description) {
      setMetaTag('twitter:description', description);
    }
    setMetaTag('twitter:image', ogImage);

    if (type === 'product' && price) {
      setMetaTag('product:price:amount', price.toString(), true);
      setMetaTag('product:price:currency', currency, true);
      if (availability) {
        setMetaTag('product:availability', availability, true);
      }
    }
  }, [title, description, image, url, type, price, currency, availability]);
}