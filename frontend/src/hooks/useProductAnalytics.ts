import { useEffect, useRef } from 'react';

export function useProductAnalytics(productId: string | undefined) {
  const hasTracked = useRef(false);

  useEffect(() => {
    if (productId && !hasTracked.current) {
      // Track product view
      // In production, this would send to analytics service
      hasTracked.current = true;
    }
    
    return () => {
      hasTracked.current = false;
    };
  }, [productId]);
}