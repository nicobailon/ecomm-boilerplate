import { useState, useEffect } from 'react';

interface WindowSize {
  width: number;
  height: number;
}

export function useWindowSize(): WindowSize {
  const [windowSize, setWindowSize] = useState<WindowSize>({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // Set initial size
    handleResize();

    // Add event listener with debouncing
    let timeoutId: NodeJS.Timeout;
    const debouncedHandleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 150);
    };

    window.addEventListener('resize', debouncedHandleResize);

    // Cleanup
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', debouncedHandleResize);
    };
  }, []);

  return windowSize;
}