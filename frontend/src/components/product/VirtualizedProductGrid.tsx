import React from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import { motion } from 'framer-motion';
import ProductCard from './ProductCard';
import type { Product } from '@/types';

interface VirtualizedProductGridProps {
  products: Product[];
  columnCount: number;
  height: number;
  width: number;
}

const ITEM_HEIGHT = 380; // Approximate height of a ProductCard
const ITEM_WIDTH = 280; // Approximate width of a ProductCard
const GAP = 24; // Gap between items

// Cell renderer for the virtual grid
const Cell = React.memo(({ 
  columnIndex, 
  rowIndex, 
  style, 
  data 
}: {
  columnIndex: number;
  rowIndex: number;
  style: React.CSSProperties;
  data: { products: Product[]; columnCount: number };
}) => {
  const { products, columnCount } = data;
  const index = rowIndex * columnCount + columnIndex;
  
  if (index >= products.length) {
    return null;
  }
  
  const product = products[index];
  
  return (
    <div 
      style={{
        ...style,
        left: (style.left as number) + GAP / 2,
        top: (style.top as number) + GAP / 2,
        width: (style.width as number) - GAP,
        height: (style.height as number) - GAP,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: (index % 8) * 0.05 }}
        className="h-full"
      >
        <ProductCard product={product} />
      </motion.div>
    </div>
  );
});

Cell.displayName = 'Cell';

export function VirtualizedProductGrid({ 
  products, 
  columnCount, 
  height, 
  width 
}: VirtualizedProductGridProps) {
  const rowCount = Math.ceil(products.length / columnCount);
  
  const itemData = React.useMemo(
    () => ({ products, columnCount }),
    [products, columnCount]
  );
  
  return (
    <Grid
      columnCount={columnCount}
      columnWidth={ITEM_WIDTH + GAP}
      height={height}
      rowCount={rowCount}
      rowHeight={ITEM_HEIGHT + GAP}
      width={width}
      itemData={itemData}
      className="scrollbar-thin scrollbar-thumb-primary scrollbar-track-muted"
    >
      {Cell}
    </Grid>
  );
}

// Hook to calculate optimal column count based on container width
export function useOptimalColumnCount(containerWidth: number): number {
  return React.useMemo(() => {
    if (!containerWidth) return 1;
    
    // Calculate how many columns can fit
    const availableWidth = containerWidth - GAP; // Account for container padding
    const columnWidth = ITEM_WIDTH + GAP;
    const columns = Math.floor(availableWidth / columnWidth);
    
    // Return at least 1 column, max based on screen size
    return Math.max(1, Math.min(columns, 4)); // Cap at 4 columns max
  }, [containerWidth]);
}