import { useState } from 'react';
import { Search, Package, Download } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { InventoryManagement } from '@/components/admin/InventoryManagement';
import { BulkInventoryUpdate } from '@/components/admin/BulkInventoryUpdate';
import { Button } from '@/components/ui/Button';
import { InventoryErrorBoundary } from '@/components/ui/InventoryErrorBoundary';
import { useDebounce } from '@/hooks/useDebounce';
import { InventoryTableLoading, InventoryStatsLoading } from '@/components/ui/InventorySkeleton';

export function InventoryTab() {
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [showBulkUpdate, setShowBulkUpdate] = useState(false);

  // Mock loading state for demonstration
  const [isLoading] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header with search and actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search products by name or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowBulkUpdate(true)}
          >
            <Package className="w-4 h-4 mr-2" />
            Bulk Update
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              // Mock export functionality
              alert('Inventory export started. You will receive an email when ready.');
            }}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Inventory Overview */}
      <InventoryErrorBoundary>
        {isLoading ? (
          <div className="space-y-4">
            <InventoryStatsLoading />
            <InventoryTableLoading />
          </div>
        ) : (
          <InventoryManagement searchQuery={debouncedSearchQuery} />
        )}
      </InventoryErrorBoundary>

      {/* Bulk Update Modal */}
      {showBulkUpdate && (
        <BulkInventoryUpdate onClose={() => setShowBulkUpdate(false)} />
      )}
    </div>
  );
}