import React from 'react';
import { FixedSizeList as List } from 'react-window';
import { InventoryBadge } from '@/components/ui/InventoryBadge';
import { Button } from '@/components/ui/Button';
import { Plus, Minus } from 'lucide-react';
import type { RouterOutputs } from '@/lib/trpc';
import { useProductInventory, useUpdateInventory } from '@/hooks/queries/useInventory';
import { InventoryBadgeLoading } from '@/components/ui/InventorySkeleton';

type TRPCProduct = NonNullable<RouterOutputs['product']['list']>['products'][0];

interface VirtualizedInventoryTableProps {
  products: TRPCProduct[];
  height: number;
  onProductSelect?: (product: TRPCProduct) => void;
}

const ROW_HEIGHT = 80;

// Row component for virtual list
const Row = React.memo(({ 
  index, 
  style, 
  data, 
}: {
  index: number;
  style: React.CSSProperties;
  data: { 
    products: TRPCProduct[]; 
    onProductSelect?: (product: TRPCProduct) => void;
  };
}) => {
  const { products, onProductSelect } = data;
  const product = products[index];
  const { data: inventoryData, isLoading } = useProductInventory(product._id ?? '');
  const updateInventory = useUpdateInventory();
  
  const handleAdjustment = (adjustment: number) => {
    if (inventoryData) {
      updateInventory.mutate({
        productId: product._id ?? '',
        adjustment,
        reason: adjustment > 0 ? 'restock' : 'adjustment',
      });
    }
  };
  
  return (
    <div 
      style={style} 
      className="flex items-center px-6 border-b border-border hover:bg-muted/50 transition-colors"
    >
      <div className="flex-1 flex items-center gap-3">
        <input
          type="checkbox"
          className="rounded border-gray-300"
          onChange={(e) => {
            if (e.target.checked && onProductSelect) {
              onProductSelect(product);
            }
          }}
        />
        <div>
          <div className="font-medium text-sm">{product.name}</div>
          <div className="text-xs text-muted-foreground">Product ID: {product._id}</div>
        </div>
      </div>
      
      <div className="w-32 text-center">
        {isLoading ? (
          <InventoryBadgeLoading />
        ) : (
          <InventoryBadge 
            inventory={inventoryData?.availableStock ?? 0}
            variant="admin"
            showCount
          />
        )}
      </div>
      
      <div className="w-24 text-center text-sm">
        {inventoryData?.lowStockThreshold ?? 10}
      </div>
      
      <div className="w-40 flex items-center justify-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleAdjustment(-1)}
          disabled={updateInventory.isPending || !inventoryData || inventoryData.availableStock === 0}
        >
          <Minus className="h-4 w-4" />
        </Button>
        
        <span className="w-16 text-center font-mono text-sm">
          {inventoryData?.availableStock ?? 0}
        </span>
        
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleAdjustment(1)}
          disabled={updateInventory.isPending}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
});

Row.displayName = 'Row';

export function VirtualizedInventoryTable({ 
  products, 
  height,
  onProductSelect, 
}: VirtualizedInventoryTableProps) {
  const itemData = React.useMemo(
    () => ({ products, onProductSelect }),
    [products, onProductSelect],
  );
  
  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Table Header */}
      <div className="bg-muted px-6 py-3 flex items-center text-sm font-medium text-muted-foreground">
        <div className="flex-1">Product</div>
        <div className="w-32 text-center">Stock Status</div>
        <div className="w-24 text-center">Alert At</div>
        <div className="w-40 text-center">Quick Adjust</div>
      </div>
      
      {/* Virtual List */}
      <List
        height={height}
        itemCount={products.length}
        itemSize={ROW_HEIGHT}
        width="100%"
        itemData={itemData}
        className="scrollbar-thin scrollbar-thumb-primary scrollbar-track-muted"
      >
        {Row}
      </List>
    </div>
  );
}