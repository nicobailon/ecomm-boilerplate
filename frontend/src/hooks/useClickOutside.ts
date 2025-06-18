import { useEffect, useRef } from 'react';

export function useClickOutside<T extends HTMLElement>(
  handler: () => void,
  isActive = true,
  portalId?: string
) {
  const ref = useRef<T>(null);
  
  useEffect(() => {
    if (!isActive) return;
    
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      
      // Check if click is inside the main ref
      if (ref.current && ref.current.contains(target)) {
        return;
      }
      
      // Check if click is inside a portal with matching ID
      if (portalId) {
        const portalElements = document.querySelectorAll(`[data-portal-id="${portalId}"]`);
        for (const element of portalElements) {
          if (element.contains(target)) {
            return;
          }
        }
      }
      
      handler();
    };
    
    // Use click event instead of mousedown to allow clicks to register
    document.addEventListener('click', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [handler, isActive, portalId]);
  
  return ref;
}