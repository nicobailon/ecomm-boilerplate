import { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
} from '@tanstack/react-table';
import type {
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  RowSelectionState,
  PaginationState,
} from '@tanstack/react-table';
import { motion } from 'framer-motion';
import { 
  MoreHorizontal,
  ChevronUp, 
  ChevronDown, 
  ChevronsUpDown, 
  Search,
  Eye,
  ShoppingBag,
  CheckCircle,
  XCircle,
  RefreshCw,
  Download,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/Dropdown';
import LoadingSpinner from '../ui/LoadingSpinner';
import { BulkActionBar } from '@/components/table/BulkActionBar';
import { DateRangeFilter } from '@/components/table/DateRangeFilter';
import { ExportButton } from '@/components/table/ExportButton';
import { OrderStatusBadge } from './OrderStatusBadge';
import { toast } from 'sonner';
import debounce from 'lodash.debounce';
import { 
  useListOrders,
  useBulkUpdateOrderStatus,
  useUpdateOrderStatus,
} from '@/hooks/queries/useOrders';
import type { OrderListItem, OrderStatus } from '@/types/order';

interface OrdersTableProps {
  onEditOrder?: (order: OrderListItem) => void;
}

export function OrdersTable({ onEditOrder }: OrdersTableProps) {
  // State management
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'createdAt', desc: true }
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  // Mutations
  const bulkUpdateStatus = useBulkUpdateOrderStatus();
  const updateStatus = useUpdateOrderStatus();
  // const exportOrders = useExportOrders(); // Not yet implemented

  // Fetch data
  const { data, isLoading, error } = useListOrders({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    search: globalFilter || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    startDate: dateRange.from,
    endDate: dateRange.to,
    sortBy: sorting[0]?.id as 'createdAt' | 'totalAmount' | 'status' | undefined,
    sortOrder: sorting[0]?.desc ? 'desc' : 'asc',
  });

  // Debounced search
  const debouncedSetGlobalFilter = useMemo(
    () => debounce((value: string) => setGlobalFilter(value), 300),
    [],
  );

  // Column definitions
  const columns = useMemo<ColumnDef<OrderListItem>[]>(
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
        id: 'order',
        header: 'Order',
        cell: ({ row }) => {
          const order = row.original;
          return (
            <div className="space-y-1">
              <div className="font-medium">{order.orderNumber}</div>
              <div className="text-xs text-muted-foreground">
                ID: {order._id.slice(-8)}
              </div>
            </div>
          );
        },
      },
      {
        id: 'customer',
        header: 'Customer',
        cell: ({ row }) => {
          const order = row.original;
          return (
            <div className="space-y-1">
              <div className="text-sm">{order.email}</div>
              {order.shippingAddress?.fullName && (
                <div className="text-xs text-muted-foreground">
                  {order.shippingAddress.fullName}
                </div>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'status',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-auto p-0 font-medium text-xs text-muted-foreground uppercase tracking-wider hover:text-foreground"
          >
            Status
            {column.getIsSorted() === 'asc' ? (
              <ChevronUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === 'desc' ? (
              <ChevronDown className="ml-2 h-4 w-4" />
            ) : (
              <ChevronsUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        ),
        cell: ({ row }) => <OrderStatusBadge status={row.original.status} />,
      },
      {
        accessorKey: 'createdAt',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-auto p-0 font-medium text-xs text-muted-foreground uppercase tracking-wider hover:text-foreground"
          >
            Date
            {column.getIsSorted() === 'asc' ? (
              <ChevronUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === 'desc' ? (
              <ChevronDown className="ml-2 h-4 w-4" />
            ) : (
              <ChevronsUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        ),
        cell: ({ row }) => format(new Date(row.original.createdAt), 'MMM dd, yyyy'),
      },
      {
        id: 'items',
        header: 'Items',
        cell: ({ row }) => {
          const order = row.original;
          const itemCount = order.products?.length || 0;
          return (
            <div className="text-sm">
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </div>
          );
        },
      },
      {
        accessorKey: 'totalAmount',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-auto p-0 font-medium text-xs text-muted-foreground uppercase tracking-wider hover:text-foreground"
          >
            Total
            {column.getIsSorted() === 'asc' ? (
              <ChevronUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === 'desc' ? (
              <ChevronDown className="ml-2 h-4 w-4" />
            ) : (
              <ChevronsUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        ),
        cell: ({ row }) => {
          const amount = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
          }).format(row.original.totalAmount);
          return <div className="font-medium">{amount}</div>;
        },
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => {
          const order = row.original;
          
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  aria-label="Actions"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => onEditOrder?.(order)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => updateStatus.mutate({
                    orderId: order._id.toString(),
                    status: 'completed',
                  })}
                  disabled={order.status === 'completed'}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark as Completed
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => updateStatus.mutate({
                    orderId: order._id.toString(),
                    status: 'cancelled',
                  })}
                  disabled={order.status === 'cancelled'}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Mark as Cancelled
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => updateStatus.mutate({
                    orderId: order._id.toString(),
                    status: 'refunded',
                  })}
                  disabled={order.status === 'refunded'}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Mark as Refunded
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [onEditOrder, updateStatus],
  );

  // Table instance
  const table = useReactTable<OrderListItem>({
    data: data?.orders ?? [],
    columns,
    pageCount: data?.totalPages ?? 0,
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
  
  const handleBulkStatusUpdate = async (status: OrderStatus) => {
    if (selectedRows.length === 0) return;
    
    const orderIds = selectedRows.map(row => row.original._id.toString());
    await bulkUpdateStatus.mutateAsync({ orderIds, status });
    setRowSelection({});
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export not yet implemented', {
      search: globalFilter,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      startDate: dateRange.from,
      endDate: dateRange.to,
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64" data-testid="loading-spinner">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive">Failed to load orders. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters and search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search orders..."
            onChange={(e) => debouncedSetGlobalFilter(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          options={[
            { value: 'all', label: 'All Status' },
            { value: 'pending', label: 'Pending' },
            { value: 'completed', label: 'Completed' },
            { value: 'cancelled', label: 'Cancelled' },
            { value: 'refunded', label: 'Refunded' },
          ]}
          className="w-[180px]"
          aria-label="Status"
        />
        <DateRangeFilter
          value={dateRange}
          onChange={setDateRange}
          placeholder="Order date range"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={!data?.orders.length}
          aria-label="Export"
        >
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setGlobalFilter('');
            setStatusFilter('all');
            setDateRange({});
          }}
          aria-label="Clear filters"
        >
          Clear filters
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" aria-label="Columns">
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table.getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuItem
                    key={column.id}
                    onSelect={(e) => e.preventDefault()}
                  >
                    <Checkbox
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                      aria-label={`Toggle ${column.id} column`}
                    />
                    <span className="ml-2">{column.id}</span>
                  </DropdownMenuItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Bulk actions */}
      {selectedRows.length > 0 && (
        <div data-testid="bulk-action-bar">
          <BulkActionBar
            selectedCount={selectedRows.length}
            onClearSelection={() => setRowSelection({})}
            actions={[
              {
                label: 'Mark as Completed',
                variant: 'default',
                onClick: () => handleBulkStatusUpdate('completed'),
                icon: <CheckCircle className="w-4 h-4" />,
              },
              {
                label: 'Mark as Cancelled',
                variant: 'destructive',
                onClick: () => handleBulkStatusUpdate('cancelled'),
                icon: <XCircle className="w-4 h-4" />,
              },
              {
                label: 'Mark as Refunded',
                variant: 'secondary',
                onClick: () => handleBulkStatusUpdate('refunded'),
                icon: <RefreshCw className="w-4 h-4" />,
              },
            ]}
          />
        </div>
      )}

      {/* Table */}
      <motion.div
        className="bg-card shadow-sm rounded-lg overflow-hidden border"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/50">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-6 py-3 text-left"
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
                    No orders found
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => onEditOrder?.(row.original)}
                    className={cn(
                      "hover:bg-muted/50 transition-colors cursor-pointer",
                      row.getIsSelected() && "bg-muted/30"
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
          <div className="text-sm text-muted-foreground">
            {selectedRows.length > 0 && `${selectedRows.length} selected`}
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={pagination.pageSize.toString()}
              onChange={(e) => table.setPageSize(Number(e.target.value))}
              options={[
                { value: '10', label: '10' },
                { value: '20', label: '20' },
                { value: '50', label: '50' },
                { value: '100', label: '100' },
              ]}
              className="w-[100px]"
              aria-label="Rows per page"
            />
            <div className="flex items-center gap-1">
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
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}