import { useState, useMemo, useRef } from 'react';
import { ChevronDown, ChevronRight, Edit2, Plus, Minus, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { InventoryBadge } from '@/components/ui/InventoryBadge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { getRestockUrgency } from '@/utils/inventory';
import { trpc, type RouterOutputs } from '@/lib/trpc';
import { useWindowSize } from '@/hooks/useWindowSize';
import { VirtualizedInventoryTable } from './VirtualizedInventoryTable';
import { InventoryTableLoading, InventoryStatsLoading } from '@/components/ui/InventorySkeleton';
import { useInventoryMetrics, useProductInventory, useUpdateInventory } from '@/hooks/queries/useInventory';
import { getVariantDisplayText } from '@/components/forms/VariantEditor';

interface InventoryManagementProps {
  searchQuery?: string;
}

export function InventoryManagement({ searchQuery = '' }: InventoryManagementProps) {
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [tempValues, setTempValues] = useState<Record<string, number>>({});
  const [updateMessage, setUpdateMessage] = useState<string>('');
  
  const containerRef = useRef<HTMLDivElement>(null);
  const windowSize = useWindowSize();
  
  // Fetch real products data with variants for inventory management
  const { data: productsResponse, isLoading: productsLoading } = trpc.product.list.useQuery({
    includeVariants: true,
  });
  const { data: metrics, isLoading: metricsLoading } = useInventoryMetrics();
  
  // Filter products based on search query
  const filteredProducts = useMemo(() => {
    const productList = productsResponse?.products ?? [];
    if (!searchQuery) return productList;
    
    const query = searchQuery.toLowerCase();
    return productList.filter((product) => 
      product.name.toLowerCase().includes(query) ||
      (product.description?.toLowerCase().includes(query) ?? false),
    );
  }, [productsResponse, searchQuery]);
  
  // Calculate if we should use virtual scrolling
  const shouldVirtualize = filteredProducts.length > 50;
  const tableHeight = windowSize.height ? windowSize.height - 500 : 400;
  
  const toggleRow = (productId: string) => {
    const newExpanded = new Set(expandedProducts);
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId);
    } else {
      newExpanded.add(productId);
    }
    setExpandedProducts(newExpanded);
  };

  const startEdit = (key: string, currentValue: number) => {
    setEditingCell(key);
    setTempValues({ ...tempValues, [key]: currentValue });
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setTempValues({});
  };
  
  if (productsLoading || metricsLoading) {
    return (
      <div className="space-y-4">
        <InventoryStatsLoading />
        <InventoryTableLoading />
      </div>
    );
  }
  
  if (!productsResponse || productsResponse.products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No products found.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6" ref={containerRef}>
      {/* Inventory Statistics */}
      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-card rounded-lg p-4 border">
            <p className="text-sm font-medium text-muted-foreground">Total Products</p>
            <p className="text-2xl font-bold">{metrics.totalProducts}</p>
          </div>
          <div className="bg-card rounded-lg p-4 border">
            <p className="text-sm font-medium text-muted-foreground">Total Stock Value</p>
            <p className="text-2xl font-bold">${metrics.totalValue?.toFixed(2) ?? '0.00'}</p>
          </div>
          <div className="bg-card rounded-lg p-4 border">
            <p className="text-sm font-medium text-muted-foreground">Low Stock Items</p>
            <p className="text-2xl font-bold text-orange-600">{metrics.lowStockCount ?? 0}</p>
          </div>
          <div className="bg-card rounded-lg p-4 border">
            <p className="text-sm font-medium text-muted-foreground">Out of Stock</p>
            <p className="text-2xl font-bold text-red-600">{metrics.outOfStockCount ?? 0}</p>
          </div>
        </div>
      )}
      
      {/* Bulk Actions */}
      {selectedProducts.size > 0 && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 flex items-center justify-between">
          <p className="text-sm font-medium">
            {selectedProducts.size} product{selectedProducts.size > 1 ? 's' : ''} selected
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary">
              Bulk Update
            </Button>
            <Button 
              size="sm" 
              variant="ghost"
              onClick={() => setSelectedProducts(new Set())}
            >
              Clear Selection
            </Button>
          </div>
        </div>
      )}
      
      {/* Product Table or Virtual Table */}
      {shouldVirtualize ? (
        <VirtualizedInventoryTable
          products={filteredProducts}
          height={tableHeight}
          onProductSelect={(product) => {
            const newSelected = new Set(selectedProducts);
            const productId = product._id ?? '';
            if (newSelected.has(productId)) {
              newSelected.delete(productId);
            } else {
              newSelected.add(productId);
            }
            setSelectedProducts(newSelected);
          }}
        />
      ) : (
        <RegularInventoryTable
          products={filteredProducts}
          expandedProducts={expandedProducts}
          selectedProducts={selectedProducts}
          editingCell={editingCell}
          tempValues={tempValues}
          updateMessage={updateMessage}
          onToggleRow={toggleRow}
          onSelectProduct={(productId) => {
            const newSelected = new Set(selectedProducts);
            if (newSelected.has(productId)) {
              newSelected.delete(productId);
            } else {
              newSelected.add(productId);
            }
            setSelectedProducts(newSelected);
          }}
          onStartEdit={startEdit}
          onSaveEdit={(_, value, productName) => {
            // Update message for screen readers
            setUpdateMessage(`${productName} inventory updated to ${value} units`);
            setTimeout(() => setUpdateMessage(''), 1000);
            setEditingCell(null);
          }}
          onCancelEdit={cancelEdit}
        />
      )}
      
      {/* Mobile Card Layout */}
      <div className="block md:hidden space-y-4">
        {filteredProducts.map((product) => {
          const productId = product._id ?? '';
          return (
            <ProductInventoryCard
              key={productId}
              product={product}
              isSelected={selectedProducts.has(productId)}
              onToggleSelect={() => {
                const newSelected = new Set(selectedProducts);
                if (newSelected.has(productId)) {
                  newSelected.delete(productId);
                } else {
                  newSelected.add(productId);
                }
                setSelectedProducts(newSelected);
              }}
            />
          );
        })}
      </div>
      
      {/* Live region for screen reader announcements */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {updateMessage}
      </div>
    </div>
  );
}

// Regular table component for smaller datasets
interface RegularInventoryTableProps {
  products: NonNullable<RouterOutputs['product']['list']>['products'];
  expandedProducts: Set<string>;
  selectedProducts: Set<string>;
  editingCell: string | null;
  tempValues: Record<string, number>;
  updateMessage: string;
  onToggleRow: (productId: string) => void;
  onSelectProduct: (productId: string) => void;
  onStartEdit: (key: string, currentValue: number) => void;
  onSaveEdit: (key: string, value: number, productName: string) => void;
  onCancelEdit: () => void;
}

function RegularInventoryTable({
  products,
  expandedProducts,
  selectedProducts,
  editingCell,
  tempValues,
  onToggleRow,
  onSelectProduct,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
}: RegularInventoryTableProps) {
  return (
    <div className="hidden md:block border rounded-lg overflow-hidden">
      <table className="w-full">
        <thead className="bg-muted">
          <tr>
            <th className="p-4 text-left">Product</th>
            <th className="p-4 text-center">Stock Status</th>
            <th className="p-4 text-center">Available</th>
            <th className="p-4 text-center">Quick Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <ProductInventoryRow
              key={product._id ?? ''}
              product={product}
              isExpanded={expandedProducts.has(product._id ?? '')}
              isSelected={selectedProducts.has(product._id ?? '')}
              editingCell={editingCell}
              tempValues={tempValues}
              onToggle={() => onToggleRow(product._id ?? '')}
              onSelect={() => onSelectProduct(product._id ?? '')}
              onStartEdit={onStartEdit}
              onSaveEdit={onSaveEdit}
              onCancelEdit={onCancelEdit}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Individual product row component
interface ProductInventoryRowProps {
  product: NonNullable<RouterOutputs['product']['list']>['products'][0];
  isExpanded: boolean;
  isSelected: boolean;
  editingCell: string | null;
  tempValues: Record<string, number>;
  onToggle: () => void;
  onSelect: () => void;
  onStartEdit: (key: string, currentValue: number) => void;
  onSaveEdit: (key: string, value: number, productName: string) => void;
  onCancelEdit: () => void;
}

function ProductInventoryRow({
  product,
  isExpanded,
  isSelected,
  editingCell,
  tempValues,
  onToggle,
  onSelect,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
}: ProductInventoryRowProps) {
  const { data: inventoryData, isLoading } = useProductInventory(product._id ?? '');
  const updateInventory = useUpdateInventory();
  
  const inventory = inventoryData?.availableStock ?? 0;
  const urgency = getRestockUrgency(inventory);
  const hasVariants = 'variants' in product && product.variants && product.variants.length > 0;
  
  // Calculate total inventory from all variants if available
  const totalVariantInventory = hasVariants ? product.variants?.reduce((sum, variant) => sum + (variant.inventory ?? 0), 0) ?? 0
    : inventory;
  
  const handleQuickAdjust = (adjustment: number) => {
    updateInventory.mutate({
      productId: product._id ?? '',
      adjustment,
      reason: adjustment > 0 ? 'restock' : 'adjustment',
    });
  };
  
  const cellKey = `product-${product._id ?? ''}`;
  const isEditing = editingCell === cellKey;
  
  return (
    <>
      <tr className="border-t hover:bg-muted/30 transition-colors group">
        <td className="p-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onSelect}
              className="rounded border-gray-300"
            />
            {hasVariants && (
              <button
                onClick={onToggle}
                className="p-1 hover:bg-muted rounded"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            )}
            <div>
              <p className="font-medium">{product.name}</p>
              {/* SKU field not available in product list response */}
              {/* Variants not included in list response */}
            </div>
          </div>
        </td>
        <td className="p-4 text-center">
          {isLoading ? (
            <div className="animate-pulse bg-muted h-6 w-20 mx-auto rounded" />
          ) : (
            <>
              <InventoryBadge inventory={inventory} variant="admin" />
              {urgency !== 'none' && (
                <AlertCircle className={cn(
                  'w-4 h-4 inline-block ml-2',
                  urgency === 'critical' && 'text-red-600',
                  urgency === 'urgent' && 'text-orange-600',
                  urgency === 'normal' && 'text-yellow-600',
                )} />
              )}
            </>
          )}
        </td>
        <td className="p-4 text-center">
          {hasVariants ? (
            <div className="flex items-center justify-center gap-2">
              <span className="font-semibold text-lg">{totalVariantInventory}</span>
              <span className="text-xs text-muted-foreground">(Total)</span>
            </div>
          ) : isEditing ? (
            <div className="flex items-center justify-center gap-2">
              <Input
                type="number"
                value={tempValues[cellKey] ?? inventory}
                onChange={(e) => {
                  const newValue = parseInt(e.target.value) || 0;
                  onStartEdit(cellKey, newValue);
                }}
                className="w-20 h-8 text-center"
                min={0}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const newValue = tempValues[cellKey] ?? inventory;
                    const adjustment = newValue - inventory;
                    updateInventory.mutate({
                      productId: product._id ?? '',
                      adjustment,
                      reason: adjustment > 0 ? 'restock' : 'adjustment',
                    });
                    onSaveEdit(cellKey, newValue, product.name);
                  }
                  if (e.key === 'Escape') onCancelEdit();
                }}
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  const newValue = tempValues[cellKey] ?? inventory;
                  const adjustment = newValue - inventory;
                  updateInventory.mutate({
                    productId: product._id ?? '',
                    adjustment,
                    reason: adjustment > 0 ? 'restock' : 'adjustment',
                  });
                  onSaveEdit(cellKey, newValue, product.name);
                }}
              >
                ✓
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={onCancelEdit}
              >
                ✗
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <span className="font-semibold text-lg">{inventory}</span>
              <button
                onClick={() => onStartEdit(cellKey, inventory)}
                className="p-1 hover:bg-muted rounded opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Edit2 className="w-3 h-3" />
              </button>
            </div>
          )}
        </td>
        <td className="p-4">
          <div className="flex items-center justify-center gap-1">
            {hasVariants ? (
              <span className="text-sm text-muted-foreground">
                {isExpanded ? 'Expanded' : 'Click to expand'}
              </span>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleQuickAdjust(-1)}
                  disabled={updateInventory.isPending || inventory === 0 || isLoading}
                  title={updateInventory.isPending ? 'Updating...' : 'Decrease by 1'}
                >
                  {updateInventory.isPending ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Minus className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleQuickAdjust(1)}
                  disabled={updateInventory.isPending || isLoading}
                  title={updateInventory.isPending ? 'Updating...' : 'Increase by 1'}
                >
                  {updateInventory.isPending ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                </Button>
              </>
            )}
          </div>
        </td>
      </tr>
      {/* Variant rows */}
      {hasVariants && isExpanded && product.variants && product.variants.map((variant) => (
        <VariantInventoryRow
          key={`${product._id}-${variant.variantId}`}
          productId={product._id ?? ''}
          variant={variant}
          editingCell={editingCell}
          tempValues={tempValues}
          onStartEdit={onStartEdit}
          onSaveEdit={onSaveEdit}
          onCancelEdit={onCancelEdit}
        />
      ))}
    </>
  );
}

// Variant row component
interface VariantInventoryRowProps {
  productId: string;
  variant: {
    variantId: string;
    size?: string;
    color?: string;
    label?: string;
    price: number;
    inventory: number;
    sku?: string;
  };
  editingCell: string | null;
  tempValues: Record<string, number>;
  onStartEdit: (key: string, currentValue: number) => void;
  onSaveEdit: (key: string, value: number, productName: string) => void;
  onCancelEdit: () => void;
}

function VariantInventoryRow({
  productId,
  variant,
  editingCell,
  tempValues,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
}: VariantInventoryRowProps) {
  const updateInventory = useUpdateInventory();
  
  const handleQuickAdjust = (adjustment: number) => {
    updateInventory.mutate({
      productId,
      variantId: variant.variantId,
      adjustment,
      reason: adjustment > 0 ? 'restock' : 'adjustment',
    });
  };
  
  const cellKey = `variant-${productId}-${variant.variantId}`;
  const isEditing = editingCell === cellKey;
  
  const variantDisplayName = getVariantDisplayText(variant);
  
  return (
    <tr className="border-t bg-muted/20 hover:bg-muted/40 transition-colors group">
      <td className="p-4 pl-12">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">↳</span>
          <div>
            <p className="text-sm font-medium">{variantDisplayName}</p>
            {variant.sku && (
              <p className="text-xs text-muted-foreground">SKU: {variant.sku}</p>
            )}
            {variant.price && (
              <p className="text-xs text-muted-foreground">${variant.price.toFixed(2)}</p>
            )}
          </div>
        </div>
      </td>
      <td className="p-4 text-center">
        <InventoryBadge inventory={variant.inventory} variant="admin" />
      </td>
      <td className="p-4 text-center">
        {isEditing ? (
          <div className="flex items-center justify-center gap-2">
            <Input
              type="number"
              value={tempValues[cellKey] ?? variant.inventory}
              onChange={(e) => {
                const newValue = parseInt(e.target.value) || 0;
                onStartEdit(cellKey, newValue);
              }}
              className="w-20 h-8 text-center"
              min={0}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const newValue = tempValues[cellKey] ?? variant.inventory;
                  const adjustment = newValue - variant.inventory;
                  updateInventory.mutate({
                    productId,
                    variantId: variant.variantId,
                    adjustment,
                    reason: adjustment > 0 ? 'restock' : 'adjustment',
                  });
                  onSaveEdit(cellKey, newValue, variantDisplayName);
                }
                if (e.key === 'Escape') onCancelEdit();
              }}
            />
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                const newValue = tempValues[cellKey] ?? variant.inventory;
                const adjustment = newValue - variant.inventory;
                updateInventory.mutate({
                  productId,
                  variantId: variant.variantId,
                  adjustment,
                  reason: adjustment > 0 ? 'restock' : 'adjustment',
                });
                onSaveEdit(cellKey, newValue, variantDisplayName);
              }}
            >
              ✓
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onCancelEdit}
            >
              ✗
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <span className="font-semibold">{variant.inventory}</span>
            <button
              onClick={() => onStartEdit(cellKey, variant.inventory)}
              className="p-1 hover:bg-muted rounded opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Edit2 className="w-3 h-3" />
            </button>
          </div>
        )}
      </td>
      <td className="p-4">
        <div className="flex items-center justify-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleQuickAdjust(-1)}
            disabled={updateInventory.isPending || variant.inventory === 0}
            title={updateInventory.isPending ? 'Updating...' : 'Decrease by 1'}
          >
            {updateInventory.isPending ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Minus className="w-4 h-4" />
            )}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleQuickAdjust(1)}
            disabled={updateInventory.isPending}
            title={updateInventory.isPending ? 'Updating...' : 'Increase by 1'}
          >
            {updateInventory.isPending ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
          </Button>
        </div>
      </td>
    </tr>
  );
}

// Mobile card component
interface ProductInventoryCardProps {
  product: NonNullable<RouterOutputs['product']['list']>['products'][0];
  isSelected: boolean;
  onToggleSelect: () => void;
}

function ProductInventoryCard({ product, isSelected, onToggleSelect }: ProductInventoryCardProps) {
  const { data: inventoryData, isLoading } = useProductInventory(product._id ?? '');
  const updateInventory = useUpdateInventory();
  
  const inventory = inventoryData?.availableStock ?? 0;
  const urgency = getRestockUrgency(inventory);
  const hasVariants = 'variants' in product && product.variants && product.variants.length > 0;
  
  // Calculate total inventory from all variants if available
  const totalVariantInventory = hasVariants ? product.variants?.reduce((sum, variant) => sum + (variant.inventory ?? 0), 0) ?? 0
    : inventory;
  
  const displayInventory = hasVariants ? totalVariantInventory : inventory;
  
  return (
    <div className="bg-card border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelect}
            className="mt-1 rounded border-gray-300"
          />
          <div>
            <p className="font-medium">{product.name}</p>
            <p className="text-sm text-muted-foreground">ID: {product._id}</p>
          </div>
        </div>
        <button className="p-2 hover:bg-muted rounded">
          <Edit2 className="w-4 h-4" />
        </button>
      </div>
      
      <div className="flex items-center justify-between">
        {isLoading ? (
          <div className="animate-pulse bg-muted h-6 w-20 rounded" />
        ) : (
          <>
            <InventoryBadge inventory={displayInventory} variant="admin" />
            {urgency !== 'none' && (
              <AlertCircle className={cn(
                'w-4 h-4',
                urgency === 'critical' && 'text-red-600',
                urgency === 'urgent' && 'text-orange-600',
                urgency === 'normal' && 'text-yellow-600',
              )} />
            )}
          </>
        )}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Stock:</span>
          <span className="font-semibold">{displayInventory}</span>
          {hasVariants && <span className="text-xs text-muted-foreground">(Total)</span>}
        </div>
      </div>
      
      <div className="flex gap-2 pt-2 border-t">
        {hasVariants ? (
          <div className="text-center text-sm text-muted-foreground py-2 flex-1">
            Product has variants - expand on desktop to manage individual variant inventory
          </div>
        ) : (
          <>
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => updateInventory.mutate({
                productId: product._id ?? '',
                adjustment: -1,
                reason: 'adjustment',
              })}
              disabled={updateInventory.isPending || inventory === 0 || isLoading}
            >
              {updateInventory.isPending ? (
                <div className="w-4 h-4 mr-1 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Minus className="w-4 h-4 mr-1" />
              )}
              Decrease
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => updateInventory.mutate({
                productId: product._id ?? '',
                adjustment: 1,
                reason: 'restock',
              })}
              disabled={updateInventory.isPending || isLoading}
            >
              {updateInventory.isPending ? (
                <div className="w-4 h-4 mr-1 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-1" />
              )}
              Increase
            </Button>
          </>
        )}
      </div>
    </div>
  );
}