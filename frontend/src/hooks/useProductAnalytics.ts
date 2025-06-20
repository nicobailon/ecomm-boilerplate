import { useEffect, useRef } from 'react';

function getSessionId(): string {
  const sessionKey = 'product-view-session';
  let sessionId = sessionStorage.getItem(sessionKey);
  
  if (!sessionId) {
    sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem(sessionKey, sessionId);
  }
  
  return sessionId;
}

function detectDeviceType(): string {
  const userAgent = navigator.userAgent.toLowerCase();
  if (/mobile|android|iphone|ipad|phone/i.test(userAgent)) {
    return 'mobile';
  }
  if (/tablet|ipad/i.test(userAgent)) {
    return 'tablet';
  }
  return 'desktop';
}

export function useProductAnalytics(productId: string | undefined) {
  const hasTracked = useRef(false);

  useEffect(() => {
    if (productId && !hasTracked.current) {
      console.log('Product view tracked:', {
        productId,
        sessionId: getSessionId(),
        referrer: document.referrer || undefined,
        deviceType: detectDeviceType(),
      });
      
      hasTracked.current = true;
    }
    
    return () => {
      hasTracked.current = false;
    };
  }, [productId]);
}