import { useMemo } from 'react';

const ITEM_WIDTH = 280; // Approximate width of a ProductCard
const GAP = 24; // Gap between items

export function useOptimalColumnCount(containerWidth: number): number {
  return useMemo(() => {
    if (!containerWidth) return 1;
    
    const availableWidth = containerWidth - GAP;
    const columnWidth = ITEM_WIDTH + GAP;
    const columns = Math.floor(availableWidth / columnWidth);
    
    return Math.max(1, Math.min(columns, 4));
  }, [containerWidth]);
}