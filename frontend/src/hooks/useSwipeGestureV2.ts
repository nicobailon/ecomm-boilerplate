import { useRef } from 'react';

interface SwipeGestureOptions {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  threshold?: number;
}

interface SwipeGestureResult {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
}

export function useSwipeGesture({
  onSwipeLeft,
  onSwipeRight,
  threshold = 50,
}: SwipeGestureOptions): SwipeGestureResult {
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    // Prevent scrolling if we're in a horizontal swipe
    if (touchStartX.current !== null && touchStartY.current !== null) {
      const touch = e.touches[0];
      const deltaX = Math.abs(touch.clientX - touchStartX.current);
      const deltaY = Math.abs(touch.clientY - touchStartY.current);
      
      // If horizontal movement is greater than vertical, prevent default
      if (deltaX > deltaY) {
        e.preventDefault();
      }
    }
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) {
      return;
    }

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartX.current;
    const deltaY = touch.clientY - touchStartY.current;
    
    // Only trigger swipe if horizontal movement is greater than vertical
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    
    if (absX > absY && absX > threshold) {
      if (deltaX > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (deltaX < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };
}