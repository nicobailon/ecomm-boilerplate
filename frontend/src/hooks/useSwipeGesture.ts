import { useEffect, useRef } from 'react';

interface SwipeOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  minSwipeDistance?: number;
}

export function useSwipeGesture(
  elementRef: React.RefObject<HTMLElement>,
  { onSwipeLeft, onSwipeRight, minSwipeDistance = 50 }: SwipeOptions,
) {
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e: TouchEvent) => {
      touchEndX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = () => {
      if (touchStartX.current === null || touchEndX.current === null) return;

      const swipeDistance = touchEndX.current - touchStartX.current;
      const absDistance = Math.abs(swipeDistance);

      if (absDistance >= minSwipeDistance) {
        if (swipeDistance > 0 && onSwipeRight) {
          onSwipeRight();
        } else if (swipeDistance < 0 && onSwipeLeft) {
          onSwipeLeft();
        }
      }

      touchStartX.current = null;
      touchEndX.current = null;
    };

    element.addEventListener('touchstart', handleTouchStart);
    element.addEventListener('touchmove', handleTouchMove);
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [elementRef, onSwipeLeft, onSwipeRight, minSwipeDistance]);
}