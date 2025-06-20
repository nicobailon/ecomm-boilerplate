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

interface CellData {
  products: Product[];
  columnCount: number;
}

interface CellProps {
  columnIndex: number;
  rowIndex: number;
  style: React.CSSProperties;
  data: CellData;
}

// Cell renderer for the virtual grid
const Cell = React.memo(({
  columnIndex,
  rowIndex,
  style,
  data,
}: CellProps) => {
  const { products, columnCount } = data;
  const index = rowIndex * columnCount + columnIndex;
  
  if (index >= products.length) {
    return null;
  }
  
  const product = products[index];
  
  const leftValue = typeof style.left === 'number' ? style.left : 0;
  const topValue = typeof style.top === 'number' ? style.top : 0;
  const widthValue = typeof style.width === 'number' ? style.width : 0;
  const heightValue = typeof style.height === 'number' ? style.height : 0;

  return (
    <div 
      style={{
        ...style,
        left: leftValue + GAP / 2,
        top: topValue + GAP / 2,
        width: widthValue - GAP,
        height: heightValue - GAP,
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
  width, 
}: VirtualizedProductGridProps) {
  const rowCount = Math.ceil(products.length / columnCount);
  
  const itemData: CellData = React.useMemo(
    () => ({ products, columnCount }),
    [products, columnCount],
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

