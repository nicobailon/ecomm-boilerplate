import { useState, useCallback } from 'react';
import { useProducts } from '@/hooks/migration/use-products-migration';
import { Product } from '@/types';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Checkbox } from '@/components/ui/Checkbox';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import debounce from 'lodash.debounce';

interface ProductSelectorProps {
  selectedProductIds: string[];
  onSelectionChange: (productIds: string[]) => void;
  className?: string;
  showApplyButton?: boolean;
}

export const ProductSelector: React.FC<ProductSelectorProps> = ({
  selectedProductIds,
  onSelectionChange,
  className,
  showApplyButton = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [localSelection, setLocalSelection] = useState<string[]>(selectedProductIds);
  
  const { data, isLoading } = useProducts(page, 20, debouncedSearchQuery || undefined);
  
  // Handle both REST and tRPC response formats
  const products: Product[] = data 
    ? 'products' in data 
      ? (data.products as unknown as Product[])
      : (data as {data?: Product[]}).data || []
    : [];
  
  const pagination = data?.pagination;
  const totalPages = pagination?.pages || 1;

  const handleToggleProduct = (productId: string) => {
    if (showApplyButton) {
      if (localSelection.includes(productId)) {
        setLocalSelection(localSelection.filter((id) => id !== productId));
      } else {
        setLocalSelection([...localSelection, productId]);
      }
    } else {
      if (selectedProductIds.includes(productId)) {
        onSelectionChange(selectedProductIds.filter((id) => id !== productId));
      } else {
        onSelectionChange([...selectedProductIds, productId]);
      }
    }
  };

  const handleSelectAll = () => {
    const currentPageProductIds = products.map((p) => p._id);
    const currentSelection = showApplyButton ? localSelection : selectedProductIds;
    const newSelection = new Set(currentSelection);
    
    if (products.every((p) => currentSelection.includes(p._id))){
      // All current page products are selected, deselect them
      currentPageProductIds.forEach((id: string) => newSelection.delete(id));
    } else {
      // Select all current page products
      currentPageProductIds.forEach((id: string) => newSelection.add(id));
    }
    
    if (showApplyButton) {
      setLocalSelection(Array.from(newSelection));
    } else {
      onSelectionChange(Array.from(newSelection));
    }
  };

  const handleClearSelection = () => {
    if (showApplyButton) {
      setLocalSelection([]);
    } else {
      onSelectionChange([]);
    }
  };

  const handleApplySelection = () => {
    onSelectionChange(localSelection);
  };

  const displayedSelection = showApplyButton ? localSelection : selectedProductIds;
  const hasChanges = showApplyButton && 
    (localSelection.length !== selectedProductIds.length ||
     !localSelection.every(id => selectedProductIds.includes(id)));

  const debouncedSearch = useCallback(
    debounce((value: string) => {
      setDebouncedSearchQuery(value);
      setPage(1); // Reset to first page on search
    }, 300),
    []
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    debouncedSearch(value);
  };

  const allCurrentPageSelected = products.length > 0 && 
    products.every((p) => displayedSelection.includes(p._id));

  if (isLoading) {
    return (
      <div className={cn("flex justify-center items-center h-64", className)}>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search and Controls */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            type="text"
            placeholder="Search products by name, description, or category..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-10"
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
            >
              {allCurrentPageSelected ? 'Deselect Page' : 'Select Page'}
            </Button>
            {displayedSelection.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearSelection}
              >
                Clear All ({displayedSelection.length})
              </Button>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {displayedSelection.length} product{displayedSelection.length !== 1 ? 's' : ''} selected
            </span>
            {showApplyButton && hasChanges && (
              <Button
                size="sm"
                onClick={handleApplySelection}
              >
                Apply Changes
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Products List */}
      <div className="border rounded-lg overflow-hidden">
        <div className="max-h-96 overflow-y-auto">
          {products.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              {searchQuery ? 'No products found matching your search.' : 'No products available.'}
            </div>
          ) : (
            <div className="divide-y">
              {products.map((product) => (
                <label
                  key={product._id}
                  className="flex items-center p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <Checkbox
                    checked={displayedSelection.includes(product._id)}
                    onCheckedChange={() => handleToggleProduct(product._id)}
                    className="mr-4"
                  />
                  
                  <div className="flex-1 flex items-center gap-4">
                    <OptimizedImage
                      src={product.image}
                      alt={product.name}
                      width={48}
                      height={48}
                      className="rounded-md object-cover"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{product.name}</h4>
                      <p className="text-sm text-muted-foreground truncate">
                        ${product.price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          
          <span className="text-sm">
            Page {page} of {totalPages}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};