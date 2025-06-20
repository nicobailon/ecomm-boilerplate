import { useState, useMemo } from 'react';
import { Calendar, Download, Package, ShoppingCart, Edit, Upload, TrendingDown, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { useDebounce } from '@/hooks/useDebounce';

interface InventoryChange {
  id: string;
  timestamp: string;
  productName: string;
  variantInfo?: string;
  previousQuantity: number;
  newQuantity: number;
  changeType: 'sale' | 'restock' | 'adjustment' | 'return' | 'damage';
  changeAmount: number;
  userId: string;
  userName: string;
  reason?: string;
  orderId?: string;
}

// Mock data
const mockHistory: InventoryChange[] = [
  {
    id: '1',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    productName: 'Classic T-Shirt',
    variantInfo: 'Size: M',
    previousQuantity: 5,
    newQuantity: 3,
    changeType: 'sale',
    changeAmount: -2,
    userId: 'user123',
    userName: 'John Doe',
    orderId: 'ORD-12345'
  },
  {
    id: '2',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    productName: 'Classic T-Shirt',
    variantInfo: 'Size: L',
    previousQuantity: 0,
    newQuantity: 20,
    changeType: 'restock',
    changeAmount: 20,
    userId: 'admin456',
    userName: 'Admin User',
    reason: 'Regular inventory replenishment'
  },
  {
    id: '3',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    productName: 'Denim Jeans',
    previousQuantity: 30,
    newQuantity: 28,
    changeType: 'sale',
    changeAmount: -2,
    userId: 'user789',
    userName: 'Jane Smith',
    orderId: 'ORD-12344'
  },
  {
    id: '4',
    timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    productName: 'Winter Jacket',
    previousQuantity: 15,
    newQuantity: 14,
    changeType: 'damage',
    changeAmount: -1,
    userId: 'admin456',
    userName: 'Admin User',
    reason: 'Item damaged during shipping'
  },
];

export function InventoryHistory() {
  const [filterType, setFilterType] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('week');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const getChangeIcon = (changeType: InventoryChange['changeType']) => {
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

  const getChangeBadgeVariant = (changeType: InventoryChange['changeType']) => {
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
    // Mock export functionality
    alert('Exporting inventory history to CSV...');
  };

  // Filter history based on criteria
  const filteredHistory = useMemo(() => {
    return mockHistory.filter(item => {
      if (filterType !== 'all' && item.changeType !== filterType) return false;
      if (debouncedSearchQuery && !item.productName.toLowerCase().includes(debouncedSearchQuery.toLowerCase())) return false;
      // Additional date filtering would go here
      return true;
    });
  }, [filterType, debouncedSearchQuery]);

  return (
    <div className="space-y-6">
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
        {filteredHistory.map((change, index) => (
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
                      {change.variantInfo && (
                        <span className="text-muted-foreground ml-2 text-xs sm:text-sm">
                          ({change.variantInfo})
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

                {(change.reason || change.orderId) && (
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