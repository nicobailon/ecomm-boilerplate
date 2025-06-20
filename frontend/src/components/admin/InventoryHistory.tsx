import { useState, useMemo } from 'react';
import { Calendar, Download, Package, ShoppingCart, Edit, Upload, TrendingDown, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Label } from '@/components/ui/Label';

import { useInventoryHistory } from '@/hooks/queries/useInventory';
import { trpc } from '@/lib/trpc';
import type { InventoryHistoryItem } from '@/types/inventory';
import { InventoryTableLoading } from '@/components/ui/InventorySkeleton';
import type { RouterOutputs } from '@/lib/trpc';

type HistoryResponse = RouterOutputs['inventory']['getInventoryHistory'];
type HistoryItem = NonNullable<HistoryResponse>['history'][0];
type ProductItem = NonNullable<RouterOutputs['product']['list']>['products'][0];

interface InventoryHistoryProps {
  productId?: string;
}

// Extended interface for frontend use with additional fields
interface ExtendedInventoryHistoryItem extends InventoryHistoryItem {
  productId: string;
  variantId?: string;
}

export function InventoryHistory({ productId }: InventoryHistoryProps = {}) {
  const [filterType, setFilterType] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('week');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string>(productId ?? '');
  
  // Fetch products for selection
  const { data: productsData } = trpc.product.list.useQuery({});
  const products = useMemo(() => productsData?.products ?? [], [productsData?.products]);
  
  // Fetch inventory history
  const { data: historyData, isLoading } = useInventoryHistory(selectedProductId ?? '', {
    limit: 50,
    offset: 0,
  });

  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case 'sale':
        return <ShoppingCart className="w-4 h-4" />;
      case 'restock':
        return <Package className="w-4 h-4" />;
      case 'adjustment':
        return <Edit className="w-4 h-4" />;
      case 'return':
        return <Upload className="w-4 h-4" />;
      case 'damage':
        return <TrendingDown className="w-4 h-4" />;
    }
  };

  const getChangeBadgeVariant = (changeType: string) => {
    switch (changeType) {
      case 'sale':
        return 'secondary';
      case 'restock':
        return 'default';
      case 'adjustment':
        return 'outline';
      case 'return':
        return 'secondary';
      case 'damage':
        return 'destructive';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const handleExport = () => {
    if (!historyData || !filteredHistory.length) return;
    
    // Generate CSV content
    const headers = ['Product Name', 'Variant', 'Change Type', 'Previous Qty', 'New Qty', 'Change Amount', 'User', 'Timestamp', 'Reason', 'Order ID'];
    const csvContent = [
      headers.join(','),
      ...filteredHistory.map(item => [
        `"${item.productName}"`,
        `"${item.variantId ?? 'N/A'}"`,
        item.changeType,
        item.previousQuantity,
        item.newQuantity,
        item.changeAmount,
        `"${item.userName}"`,
        new Date(item.timestamp).toISOString(),
        `"${item.reason ?? 'N/A'}"`,
        `"${item.orderId ?? 'N/A'}"`,
      ].join(',')),
    ].join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `inventory-history-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Filter history based on criteria
  const filteredHistory = useMemo((): ExtendedInventoryHistoryItem[] => {
    if (!historyData) return [];
    const items = historyData.history ?? [];
    // Map backend data structure to frontend expected structure
    return items
      .filter((item: HistoryItem) => {
        if (filterType !== 'all' && item.reason !== filterType) return false;
        // Note: productName filtering not available with raw data
        return true;
      })
      .map((item: HistoryItem): ExtendedInventoryHistoryItem => {
        const itemIdRaw = item._id ?? item.id ?? '';
        const idString = itemIdRaw ? (typeof itemIdRaw === 'string' ? itemIdRaw : (itemIdRaw as { toString(): string }).toString()) : '';
        const metadata = item.metadata as Record<string, unknown> | undefined;
        const userName = typeof metadata?.userName === 'string' ? metadata.userName : undefined;
        const reason = typeof metadata?.reason === 'string' ? metadata.reason : undefined;
        const orderId = typeof metadata?.orderId === 'string' ? metadata.orderId : undefined;
        
        return {
          id: idString,
          productId: String(item.productId),
          variantId: item.variantId && typeof item.variantId === 'string' ? item.variantId : undefined,
          productName: products.find((p: ProductItem) => p._id === String(item.productId))?.name ?? `Product ${String(item.productId)}`,
          previousQuantity: Number(item.previousQuantity),
          newQuantity: Number(item.newQuantity),
          changeAmount: Number(item.adjustment),
          changeType: String(item.reason) as InventoryHistoryItem['changeType'],
          timestamp: String(item.timestamp),
          userId: String(item.userId),
          userName: userName ?? `User ${String(item.userId)}`,
          reason: reason,
          orderId: orderId,
        };
      });
  }, [historyData, filterType, products]);

  if (!selectedProductId) {
    return (
      <div className="space-y-6">
        <div className="bg-muted/50 rounded-lg p-6 text-center">
          <Package className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <h3 className="font-medium mb-2">Select a Product</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Choose a product to view its inventory history
          </p>
          <Select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="max-w-xs mx-auto"
            options={[
              { value: '', label: 'Select a product...' },
              ...products.map((p: ProductItem) => ({
                value: p._id ?? '',
                label: p.name,
              })),
            ]}
          />
        </div>
      </div>
    );
  }
  
  if (isLoading) {
    return <InventoryTableLoading />;
  }
  
  return (
    <div className="space-y-6">
      {/* Product Selector */}
      <div className="flex items-center gap-4">
        <Label>Product:</Label>
        <Select
          value={selectedProductId}
          onChange={(e) => setSelectedProductId(e.target.value)}
          className="w-64"
          options={[
            { value: '', label: 'Select a product...' },
            ...products.map((p: ProductItem) => ({
              value: p._id ?? '',
              label: p.name,
            })),
          ]}
        />
      </div>
      
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search by product name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-40"
            options={[
              { value: 'all', label: 'All Changes' },
              { value: 'sale', label: 'Sales' },
              { value: 'restock', label: 'Restocks' },
              { value: 'adjustment', label: 'Adjustments' },
              { value: 'return', label: 'Returns' },
              { value: 'damage', label: 'Damage' },
            ]}
          />

          <Select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as typeof dateRange)}
            className="w-32"
            options={[
              { value: 'today', label: 'Today' },
              { value: 'week', label: 'This Week' },
              { value: 'month', label: 'This Month' },
              { value: 'all', label: 'All Time' },
            ]}
          />

          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* History Timeline */}
      <div className="space-y-4">
        {filteredHistory.map((change: ExtendedInventoryHistoryItem, index) => (
          <div key={change.id} className="relative">
            {/* Timeline connector */}
            {index < filteredHistory.length - 1 && (
              <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-border" />
            )}

            <div className="flex gap-4">
              {/* Timeline dot */}
              <div className={`
                w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0
                ${change.changeAmount > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}
              `}>
                {getChangeIcon(change.changeType)}
              </div>

              {/* Content */}
              <div className="flex-1 bg-card border rounded-lg p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm sm:text-base">
                      {change.productName}
                      {change.variantId && (
                        <span className="text-muted-foreground ml-2 text-xs sm:text-sm">
                          (Variant: {change.variantId})
                        </span>
                      )}
                    </h4>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                      {formatTimestamp(change.timestamp)} • by {change.userName}
                    </p>
                  </div>
                  
                  <Badge variant={getChangeBadgeVariant(change.changeType)} className="self-start">
                    {change.changeType}
                  </Badge>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm text-muted-foreground">Stock:</span>
                    <span className="font-mono text-sm">{change.previousQuantity}</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="font-mono font-medium text-sm">{change.newQuantity}</span>
                  </div>

                  <div className={`
                    flex items-center gap-1 font-medium text-xs sm:text-sm
                    ${change.changeAmount > 0 ? 'text-green-600' : 'text-red-600'}
                  `}>
                    {change.changeAmount > 0 ? (
                      <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                    ) : (
                      <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4" />
                    )}
                    {change.changeAmount > 0 && '+'}
                    {change.changeAmount}
                  </div>
                </div>

                {(change.reason ?? change.orderId) && (
                  <div className="mt-3 pt-3 border-t text-xs sm:text-sm text-muted-foreground">
                    {change.reason && <p className="break-words">Reason: {change.reason}</p>}
                    {change.orderId && (
                      <p>
                        Order:{' '}
                        <a href="#" className="text-primary hover:underline">
                          {change.orderId}
                        </a>
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredHistory.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">
              No inventory changes found for the selected filters
            </p>
          </div>
        )}
      </div>
    </div>
  );
}