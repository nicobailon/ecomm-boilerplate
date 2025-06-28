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
import { 
  Trash, 
  Edit, 
  ChevronUp, 
  ChevronDown, 
  ChevronsUpDown, 
  Search, 
  Globe,
  Lock,
  ExternalLink,
  FolderOpen,
  ChevronRight,
  Package,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Checkbox } from '@/components/ui/Checkbox';
import { trpc } from '@/lib/trpc';
import type { RouterOutputs } from '@/lib/trpc';
import { useDeleteCollection } from '@/hooks/collections/useCollections';
import LoadingSpinner from '../ui/LoadingSpinner';
import { toast } from 'sonner';
import debounce from 'lodash.debounce';
import { BulkActionBar } from '@/components/table/BulkActionBar';
import { ExportButton } from '@/components/table/ExportButton';

type Collection = RouterOutputs['collection']['myCollections']['collections'][0];

interface CollectionsTableProps {
  onEdit: (collection: Collection) => void;
  className?: string;
}

export function CollectionsTable({ onEdit, className }: CollectionsTableProps) {
  // State management
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'public' | 'private'>('all');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Mutations
  const deleteCollection = useDeleteCollection();
  const utils = trpc.useUtils();

  // Fetch data with tRPC
  const { data, isLoading, isError } = trpc.collection.myCollections.useQuery({
    limit: pagination.pageSize,
    page: pagination.pageIndex + 1,
    search: globalFilter || undefined,
    sortBy: sorting[0]?.id as 'name' | 'createdAt' | 'updatedAt' | 'productCount' | undefined,
    sortOrder: sorting[0]?.desc ? 'desc' : 'asc',
    isPublic: visibilityFilter === 'public' ? true : visibilityFilter === 'private' ? false : undefined,
  }, {
    placeholderData: (previousData) => previousData,
  });

  // Debounced search
  const debouncedSetGlobalFilter = useMemo(
    () => debounce((value: string) => setGlobalFilter(value), 300),
    [],
  );

  // Toggle row expansion
  const toggleRowExpansion = (collectionId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(collectionId)) {
      newExpanded.delete(collectionId);
    } else {
      newExpanded.add(collectionId);
    }
    setExpandedRows(newExpanded);
  };

  // Column definitions
  const columns = useMemo<ColumnDef<Collection>[]>(
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
        id: 'expand',
        cell: ({ row }) => {
          const collection = row.original;
          const isExpanded = expandedRows.has(collection._id as string);
          
          return collection.description ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                toggleRowExpansion(collection._id as string);
              }}
              className="h-6 w-6 p-0"
            >
              <ChevronRight 
                className={cn(
                  'h-4 w-4 transition-transform',
                  isExpanded && 'rotate-90',
                )}
              />
            </Button>
          ) : null;
        },
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
              Collection
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
          const collection = row.original;
          const isExpanded = expandedRows.has(collection._id as string);
          
          return (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
                <h4 className="font-medium">{collection.name}</h4>
              </div>
              {isExpanded && collection.description && (
                <motion.p 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="text-sm text-muted-foreground pl-6"
                >
                  {collection.description}
                </motion.p>
              )}
            </div>
          );
        },
      },
      {
        id: 'productCount',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-auto p-0 font-medium text-xs text-muted-foreground uppercase tracking-wider hover:text-foreground"
            >
              Products
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
        accessorFn: (row) => Array.isArray(row.products) ? row.products.length : 0,
        cell: ({ row }) => {
          const count = Array.isArray(row.original.products) ? row.original.products.length : 0;
          return (
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <Badge variant="secondary">
                {count} {count === 1 ? 'product' : 'products'}
              </Badge>
            </div>
          );
        },
      },
      {
        accessorKey: 'isPublic',
        header: 'Visibility',
        cell: ({ row }) => {
          const isPublic = row.original.isPublic;
          return (
            <div className="flex items-center gap-2">
              {isPublic ? (
                <>
                  <Globe className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-600">Public</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Private</span>
                </>
              )}
            </div>
          );
        },
        enableSorting: false,
      },
      {
        accessorKey: 'createdAt',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-auto p-0 font-medium text-xs text-muted-foreground uppercase tracking-wider hover:text-foreground"
            >
              Created
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
          return (
            <span className="text-sm text-muted-foreground">
              {formatDistanceToNow(new Date(row.original.createdAt), { addSuffix: true })}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const collection = row.original;
          
          return (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(collection);
                }}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm(`Delete collection "${collection.name}"?`)) {
                    deleteCollection.mutate({ id: collection._id as string });
                  }
                }}
                className="text-destructive hover:text-destructive"
              >
                <Trash className="w-4 h-4" />
              </Button>
              {collection.isPublic && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(`/collections/${collection.slug}`, '_blank');
                  }}
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              )}
            </div>
          );
        },
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [deleteCollection, onEdit, expandedRows],
  );

  // Table instance
  const table = useReactTable({
    data: data?.collections ?? [],
    columns,
    pageCount: data?.pagination ? Math.ceil(data.pagination.total / pagination.pageSize) : 1,
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
    
    if (!window.confirm(`Delete ${selectedRows.length} collections?`)) {
      return;
    }

    for (const row of selectedRows) {
      await deleteCollection.mutateAsync({ id: row.original._id as string });
    }
    
    setRowSelection({});
    toast.success(`Deleted ${selectedRows.length} collections`);
  };

  const updateCollection = trpc.collection.update.useMutation();

  const handleBulkToggleVisibility = async (makePublic: boolean) => {
    if (selectedRows.length === 0) return;

    for (const row of selectedRows) {
      await updateCollection.mutateAsync({
        id: row.original._id as string,
        data: { isPublic: makePublic },
      });
    }

    await utils.collection.myCollections.invalidate();
    setRowSelection({});
    toast.success(`Made ${selectedRows.length} collections ${makePublic ? 'public' : 'private'}`);
  };

  const handleExport = () => {
    const collections = data?.collections ?? [];
    const csv = [
      ['Name', 'Description', 'Products', 'Visibility', 'Slug', 'Created'].join(','),
      ...collections.map(c => [
        `"${c.name}"`,
        `"${c.description || ''}"`,
        Array.isArray(c.products) ? c.products.length : 0,
        c.isPublic ? 'Public' : 'Private',
        c.slug,
        new Date(c.createdAt).toLocaleDateString(),
      ].join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `collections-${new Date().toISOString().split('T')[0]}.csv`;
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
        <p className="text-destructive">Failed to load collections. Please try again.</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Filters and search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search collections..."
            onChange={(e) => debouncedSetGlobalFilter(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={visibilityFilter}
          onChange={(e) => setVisibilityFilter(e.target.value as typeof visibilityFilter)}
          options={[
            { value: 'all', label: 'All Collections' },
            { value: 'public', label: 'Public Only' },
            { value: 'private', label: 'Private Only' },
          ]}
        />
        <ExportButton
          onExport={handleExport}
          disabled={!data?.collections.length}
        />
      </div>

      {/* Bulk actions */}
      <BulkActionBar
        selectedCount={selectedRows.length}
        onClearSelection={() => setRowSelection({})}
        actions={[
          {
            label: 'Make Public',
            variant: 'default',
            onClick: () => handleBulkToggleVisibility(true),
            icon: <Globe className="w-4 h-4" />,
          },
          {
            label: 'Make Private',
            variant: 'secondary',
            onClick: () => handleBulkToggleVisibility(false),
            icon: <Lock className="w-4 h-4" />,
          },
          {
            label: 'Delete',
            variant: 'destructive',
            onClick: handleBulkDelete,
            icon: <Trash className="w-4 h-4" />,
          },
        ]}
      />

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
                    {globalFilter || visibilityFilter !== 'all'
                      ? 'No collections found matching your filters'
                      : 'No collections yet. Create your first one!'}
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => onEdit(row.original)}
                    className="hover:bg-muted/50 transition-all duration-300 cursor-pointer"
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
        {data?.pagination && (
          <div className="px-6 py-3 border-t border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Showing {((pagination.pageIndex) * pagination.pageSize) + 1} to{' '}
                {Math.min((pagination.pageIndex + 1) * pagination.pageSize, data.pagination.total)} of{' '}
                {data.pagination.total} collections
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={pagination.pageSize.toString()}
                onChange={(e) => table.setPageSize(Number(e.target.value))}
                options={[
                  { value: '10', label: '10 / page' },
                  { value: '20', label: '20 / page' },
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
        )}
      </motion.div>
    </div>
  );
}