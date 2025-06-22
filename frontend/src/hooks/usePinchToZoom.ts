import { useState, useCallback, useRef } from 'react';

interface PinchToZoomOptions {
  minScale?: number;
  maxScale?: number;
  scaleFactor?: number;
}

interface PinchToZoomResult {
  scale: number;
  onPinchStart: (e: React.PointerEvent) => void;
  onPinchMove: (e: React.PointerEvent) => void;
  onPinchEnd: (e: React.PointerEvent) => void;
  resetScale: () => void;
}

export function usePinchToZoom({
  minScale = 1,
  maxScale = 3,
  scaleFactor = 0.01,
}: PinchToZoomOptions = {}): PinchToZoomResult {
  const [scale, setScale] = useState(1);
  const pointerCache = useRef<React.PointerEvent[]>([]);
  const prevDiff = useRef(-1);
  
  const onPinchStart = useCallback((e: React.PointerEvent) => {
    pointerCache.current.push(e);
  }, []);
  
  const onPinchMove = useCallback((e: React.PointerEvent) => {
    const index = pointerCache.current.findIndex(
      cachedEv => cachedEv.pointerId === e.pointerId,
    );
    if (index >= 0) {
      pointerCache.current[index] = e;
    }
    
    if (pointerCache.current.length === 2) {
      const dx = pointerCache.current[0].clientX - pointerCache.current[1].clientX;
      const dy = pointerCache.current[0].clientY - pointerCache.current[1].clientY;
      const curDiff = Math.sqrt(dx * dx + dy * dy);
      
      if (prevDiff.current > 0) {
        const delta = curDiff - prevDiff.current;
        const newScale = Math.max(
          minScale,
          Math.min(maxScale, scale + delta * scaleFactor),
        );
        setScale(newScale);
      }
      
      prevDiff.current = curDiff;
    }
  }, [scale, minScale, maxScale, scaleFactor]);
  
  const onPinchEnd = useCallback((e: React.PointerEvent) => {
    pointerCache.current = pointerCache.current.filter(
      cachedEv => cachedEv.pointerId !== e.pointerId,
    );
    
    if (pointerCache.current.length < 2) {
      prevDiff.current = -1;
    }
    
    if (pointerCache.current.length === 0 && scale < 1.2) {
      setScale(1);
    }
  }, [scale]);
  
  const resetScale = useCallback(() => {
    setScale(1);
    pointerCache.current = [];
    prevDiff.current = -1;
  }, []);
  
  return {
    scale,
    onPinchStart,
    onPinchMove,
    onPinchEnd,
    resetScale,
  };
}