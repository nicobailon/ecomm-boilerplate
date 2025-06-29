import { useState, useMemo } from 'react';
import type {
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  RowSelectionState,
  PaginationState} from '@tanstack/react-table';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
} from '@tanstack/react-table';
import { motion } from 'framer-motion';
import { Trash, Star, AlertTriangle, ChevronUp, ChevronDown, ChevronsUpDown, Search, Download, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { InventoryBadge } from '@/components/ui/InventoryBadge';
import { useDeleteProduct, useToggleFeatured, useFeaturedProducts } from '@/hooks/migration/use-products-migration';
import { trpc } from '@/lib/trpc';
import type { RouterOutputs } from '@/lib/trpc';
import type { Product as LegacyProduct } from '@/types';

type Product = RouterOutputs['product']['list']['products'][0];
interface CollectionRef { _id: string; name: string; slug: string }

// Type guard for collection reference
function isCollectionRef(obj: unknown): obj is CollectionRef {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'name' in obj &&
    typeof (obj as Record<string, unknown>).name === 'string'
  );
}
import { useProductInventory } from '@/hooks/queries/useInventory';
import { InventoryBadgeLoading } from '@/components/ui/InventorySkeleton';
import LoadingSpinner from '../ui/LoadingSpinner';
import { toast } from 'sonner';
import debounce from 'lodash.debounce';
import { FEATURE_FLAGS } from '@/lib/feature-flags';

// Separate component for featured toggle to avoid hooks in non-component functions
function FeaturedToggleCell({ product }: { product: Product }) {
  const [isToggling, setIsToggling] = useState(false);
  const toggleFeatured = useToggleFeatured();

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsToggling(true);
    try {
      if (product._id) await toggleFeatured.mutateAsync(product._id);
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isToggling}
      data-testid="toggle-feature"
      className={cn(
        'p-1 rounded-full transition-all duration-200',
        product.isFeatured
          ? 'bg-warning text-warning-foreground hover:bg-warning/80 ring-2 ring-warning/40'
          : 'bg-muted text-muted-foreground hover:bg-warning/80',
        isToggling && 'opacity-50 cursor-not-allowed animate-pulse',
      )}
      title={product.isFeatured ? 'Remove from homepage carousel' : 'Add to homepage carousel'}
    >
      <Star 
        className={cn(
          'h-5 w-5 transition-transform',
          isToggling && 'animate-spin',
          product.isFeatured && 'fill-current',
        )} 
      />
    </button>
  );
}

interface ProductsTableProps {
  highlightProductId?: string | null;
  onHighlightComplete?: () => void;
  onEditProduct?: (product: LegacyProduct) => void;
}

// Inventory cell component
function InventoryCell({ productId }: { productId: string }) {
  const { data: inventoryData, isLoading } = useProductInventory(productId);
  
  if (isLoading) return <InventoryBadgeLoading />;
  
  const inventory = inventoryData?.availableStock ?? 0;
  const isLowStock = inventory > 0 && inventory <= (inventoryData?.lowStockThreshold ?? 10);
  
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={(e) => {
          e.stopPropagation();
          window.location.hash = '#inventory';
        }}
        className="hover:scale-105 transition-transform"
      >
        <InventoryBadge 
          inventory={inventory} 
          variant="admin"
          showCount
        />
      </button>
      {isLowStock && (
        <AlertTriangle className="w-4 h-4 text-orange-600" aria-label="Low stock" />
      )}
    </div>
  );
}

const FeaturedCountBanner = () => {
  const { data: featuredProducts, isLoading } = useFeaturedProducts();
  const count = useMemo(() => featuredProducts?.length ?? 0, [featuredProducts]);
  
  if (isLoading || count === 0) return null;
  
  return (
    <div className="mb-4 flex items-center justify-between bg-muted/50 rounded-lg p-3">
      <div className="flex items-center gap-2">
        <Star className="h-5 w-5 text-warning fill-warning" />
        <span className="text-sm font-medium" data-testid="featured-count">
          {count} featured product{count !== 1 ? 's' : ''} in homepage carousel
        </span>
      </div>
      <a 
        href="/" 
        className="text-sm text-primary hover:underline"
        target="_blank"
        rel="noopener noreferrer"
      >
        Preview homepage →
      </a>
    </div>
  );
};

export function ProductsTable({ 
  highlightProductId, 
  onHighlightComplete: _onHighlightComplete, 
  onEditProduct, 
}: ProductsTableProps) {
  // State management
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'inStock' | 'lowStock' | 'outOfStock'>('all');
  const [featuredFilter, setFeaturedFilter] = useState<'all' | 'featured' | 'notFeatured'>('all');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 25,
  });

  // Mutations
  const deleteProduct = useDeleteProduct();
  const toggleFeatured = useToggleFeatured();

  // Fetch data with tRPC
  const { data, isLoading, isError } = trpc.product.list.useQuery({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    search: globalFilter || undefined,
    sortBy: sorting[0]?.id as 'name' | 'price' | 'createdAt' | 'updatedAt' | undefined,
    sortOrder: sorting[0]?.desc ? 'desc' : 'asc',
    stockStatus: stockFilter !== 'all' ? stockFilter : undefined,
    isFeatured: featuredFilter === 'featured' ? true : featuredFilter === 'notFeatured' ? false : undefined,
    includeVariants: false,
  }, {
    enabled: FEATURE_FLAGS.USE_TRPC_PRODUCTS,
    placeholderData: (previousData) => previousData,
  });

  // Debounced search
  const debouncedSetGlobalFilter = useMemo(
    () => debounce((value: string) => setGlobalFilter(value), 300),
    [],
  );

  // Column definitions
  const columns = useMemo<ColumnDef<Product>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: 'name',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-auto p-0 font-medium text-xs text-muted-foreground uppercase tracking-wider hover:text-foreground"
            >
              Product
              {column.getIsSorted() === 'asc' ? (
                <ChevronUp className="ml-2 h-4 w-4" />
              ) : column.getIsSorted() === 'desc' ? (
                <ChevronDown className="ml-2 h-4 w-4" />
              ) : (
                <ChevronsUpDown className="ml-2 h-4 w-4" />
              )}
            </Button>
          );
        },
        cell: ({ row }) => {
          const product = row.original;
          return (
            <div className="flex items-center">
              <div className="flex-shrink-0 h-10 w-10">
                <img
                  className="h-10 w-10 rounded-full object-cover"
                  src={product.image || ''}
                  alt={product.name}
                />
              </div>
              <div className="ml-4">
                <div className="text-sm font-medium">{product.name}</div>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'price',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-auto p-0 font-medium text-xs text-muted-foreground uppercase tracking-wider hover:text-foreground"
            >
              Price
              {column.getIsSorted() === 'asc' ? (
                <ChevronUp className="ml-2 h-4 w-4" />
              ) : column.getIsSorted() === 'desc' ? (
                <ChevronDown className="ml-2 h-4 w-4" />
              ) : (
                <ChevronsUpDown className="ml-2 h-4 w-4" />
              )}
            </Button>
          );
        },
        cell: ({ row }) => {
          return <div className="text-sm text-muted-foreground">${row.original.price.toFixed(2)}</div>;
        },
      },
      {
        accessorKey: 'collectionId',
        header: 'Collection',
        cell: ({ row }) => {
          const collection = row.original.collectionId;
          return (
            <div className="text-sm text-muted-foreground">
              {isCollectionRef(collection)
                ? collection.name 
                : 'No collection'}
            </div>
          );
        },
        enableSorting: false,
      },
      {
        id: 'stock',
        header: 'Stock',
        cell: ({ row }) => row.original._id ? <InventoryCell productId={row.original._id} /> : null,
        enableSorting: false,
      },
      {
        accessorKey: 'isFeatured',
        header: ({ column }) => {
          return (
            <div className="flex items-center">
              <span className="font-medium text-xs text-muted-foreground uppercase tracking-wider">Featured</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => column.toggleVisibility(false)}
                className="ml-2 p-0 h-auto"
                title="Hide column"
              >
                <EyeOff className="h-3 w-3" />
              </Button>
            </div>
          );
        },
        cell: ({ row }) => <FeaturedToggleCell product={row.original} />,
        enableSorting: false,
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const product = row.original;
          
          return (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (product._id) deleteProduct.mutate(product._id);
              }}
              className="text-destructive hover:text-destructive/80"
            >
              <Trash className="h-5 w-5" />
            </button>
          );
        },
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [deleteProduct, toggleFeatured],
  );

  // Table instance
  const table = useReactTable({
    data: data?.products ?? [],
    columns,
    pageCount: data?.pagination.pages ?? 0,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
  });

  // Handle bulk actions
  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const handleBulkDelete = async () => {
    if (selectedRows.length === 0) return;
    
    if (!window.confirm(`Are you sure you want to delete ${selectedRows.length} products?`)) {
      return;
    }

    for (const row of selectedRows) {
      if (row.original._id) {
        await deleteProduct.mutateAsync(row.original._id);
      }
    }
    
    setRowSelection({});
    toast.success(`Deleted ${selectedRows.length} products`);
  };

  const handleExport = () => {
    const products = data?.products ?? [];
    const csv = [
      ['Name', 'Price', 'Collection', 'Featured', 'Created At'].join(','),
      ...products.map(p => [
        `"${p.name}"`,
        p.price,
        isCollectionRef(p.collectionId) ? p.collectionId.name : 'No collection',
        p.isFeatured ? 'Yes' : 'No',
        p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '',
      ].join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `products-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load products. Please try again.</p>
      </div>
    );
  }

  return (
    <>
      <FeaturedCountBanner />
      <div className="space-y-4">
        {/* Filters and search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search products..."
            onChange={(e) => debouncedSetGlobalFilter(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value as typeof stockFilter)}
          options={[
            { value: 'all', label: 'All Stock' },
            { value: 'inStock', label: 'In Stock' },
            { value: 'lowStock', label: 'Low Stock' },
            { value: 'outOfStock', label: 'Out of Stock' },
          ]}
        />
        <Select
          value={featuredFilter}
          onChange={(e) => setFeaturedFilter(e.target.value as typeof featuredFilter)}
          options={[
            { value: 'all', label: 'All Products' },
            { value: 'featured', label: 'Featured' },
            { value: 'notFeatured', label: 'Not Featured' },
          ]}
        />
        <Button
          variant="outline"
          onClick={handleExport}
          disabled={!data?.products.length}
        >
          <Download className="w-4 h-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Bulk actions */}
      {selectedRows.length > 0 && (
        <div className="bg-muted/50 rounded-lg p-3 flex items-center justify-between">
          <span className="text-sm">
            {selectedRows.length} product{selectedRows.length > 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => void handleBulkDelete()}
            >
              Delete Selected
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRowSelection({})}
            >
              Clear Selection
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <motion.div
        className="bg-card shadow-lg rounded-lg overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-6 py-12 text-center text-muted-foreground"
                  >
                    No products found
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => {
                      if (onEditProduct && row.original._id) {
                        // Convert to legacy Product type
                        const legacyProduct: LegacyProduct = {
                          ...row.original,
                          _id: row.original._id,
                          name: row.original.name ?? '',
                          description: row.original.description ?? '',
                          price: row.original.price ?? 0,
                          image: row.original.image ?? '',
                          isFeatured: row.original.isFeatured ?? false,
                          createdAt: row.original.createdAt ?? '',
                          updatedAt: row.original.updatedAt ?? '',
                        };
                        onEditProduct(legacyProduct);
                      }
                    }}
                    className={cn(
                      'hover:bg-muted/50 transition-all duration-300 cursor-pointer',
                      highlightProductId && row.original._id && highlightProductId === row.original._id && 
                        'ring-2 ring-primary bg-primary/10 animate-highlight',
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-3 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Showing {((pagination.pageIndex) * pagination.pageSize) + 1} to{' '}
              {Math.min((pagination.pageIndex + 1) * pagination.pageSize, data?.pagination.total ?? 0)} of{' '}
              {data?.pagination.total ?? 0} products
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={pagination.pageSize.toString()}
              onChange={(e) => table.setPageSize(Number(e.target.value))}
              options={[
                { value: '10', label: '10 / page' },
                { value: '25', label: '25 / page' },
                { value: '50', label: '50 / page' },
                { value: '100', label: '100 / page' },
              ]}
              className="w-32"
            />
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                First
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Previous
              </Button>
              <span className="text-sm px-2">
                Page {pagination.pageIndex + 1} of {table.getPageCount()}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Next
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                Last
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
      </div>
    </>
  );
}