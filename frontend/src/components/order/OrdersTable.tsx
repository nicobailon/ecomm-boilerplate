import { useState, useMemo, useRef } from 'react';
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
import { Dropdown } from '@/components/ui/Dropdown';
import LoadingSpinner from '../ui/LoadingSpinner';
import { BulkActionBar } from '@/components/table/BulkActionBar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { DateRangeFilter } from '@/components/table/DateRangeFilter';
import { OrderStatusBadge } from './OrderStatusBadge';
import debounce from 'lodash.debounce';
import { 
  useListOrders,
  useBulkUpdateOrderStatus,
  useUpdateOrderStatus,
  useExportOrders,
} from '@/hooks/queries/useOrders';
import { useOrderStatusValidation } from '@/hooks/useOrderStatusValidation';
import { toast } from 'sonner';
import type { OrderListItem, OrderStatus } from '@/types/order';

interface OrdersTableProps {
  onEditOrder?: (order: OrderListItem) => void;
  mode?: 'admin' | 'customer';
  data?: ReturnType<typeof useListOrders>['data'];
  isLoading?: boolean;
}

export function OrdersTable({ onEditOrder, mode = 'admin', data: externalData, isLoading: externalLoading }: OrdersTableProps) {
  // State management
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'createdAt', desc: true },
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [dateRange, setDateRange] = useState<{ from?: string; to?: string }>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [showColumnVisibility, setShowColumnVisibility] = useState(false);
  const [showExportConfirmation, setShowExportConfirmation] = useState(false);

  // Mutations
  const bulkUpdateStatus = useBulkUpdateOrderStatus();
  const updateStatus = useUpdateOrderStatus();
  const { validateBulkTransitions, isValidTransition } = useOrderStatusValidation();
  const { exportOrders, isExporting } = useExportOrders();

  // Fetch data - only fetch admin data if not in customer mode
  const adminQuery = useListOrders(
    mode === 'admin' && !externalData
      ? {
          page: pagination.pageIndex + 1,
          limit: pagination.pageSize,
          search: globalFilter || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          startDate: dateRange.from ? new Date(dateRange.from) : undefined,
          endDate: dateRange.to ? new Date(dateRange.to) : undefined,
          sortBy: sorting[0]?.id as 'createdAt' | 'totalAmount' | 'status' | undefined,
          sortOrder: sorting[0]?.desc ? 'desc' : 'asc',
        }
      : undefined
  );

  // Use external data if provided (customer mode), otherwise fetch admin data
  const data = externalData || adminQuery.data;
  const isLoading = externalLoading !== undefined ? externalLoading : adminQuery.isLoading;
  const error = adminQuery.error;

  // Debounced search
  const debouncedSetGlobalFilter = useMemo(
    () => debounce((value: string) => setGlobalFilter(value), 300),
    [],
  );

  // Column definitions
  const columns = useMemo<ColumnDef<OrderListItem>[]>(() => {
    const baseColumns: ColumnDef<OrderListItem>[] = [
      // Select checkbox - only show in admin mode
      ...(mode === 'admin'
        ? [
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
            } as ColumnDef<OrderListItem>,
          ]
        : []),
      {
        id: 'order',
        header: 'Order',
        cell: ({ row }) => {
          const order = row.original;
          return (
            <div className="space-y-1">
              <div className="font-medium">{order.orderNumber}</div>
              <div className="text-xs text-muted-foreground">
                ID: {String(order._id).slice(-8)}
              </div>
            </div>
          );
        },
      },
      // Customer column - only show in admin mode
      ...(mode === 'admin'
        ? [
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
            } as ColumnDef<OrderListItem>,
          ]
        : []),
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
          const [isOpen, setIsOpen] = useState(false);
          const triggerRef = useRef<HTMLButtonElement>(null);
          
          // Customer mode - only show view action
          if (mode === 'customer') {
            return (
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  aria-label="View order"
                  onClick={() => onEditOrder?.(order)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            );
          }
          
          // Admin mode - show all actions
          return (
            <div className="relative">
              <Button
                ref={triggerRef}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                aria-label="Actions"
                onClick={() => setIsOpen(!isOpen)}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
              <Dropdown isOpen={isOpen} triggerRef={triggerRef}>
                <div className="bg-popover border rounded-md shadow-md p-1 min-w-[200px]">
                  <button
                    onClick={() => {
                      onEditOrder?.(order);
                      setIsOpen(false);
                    }}
                    className="w-full text-left px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground rounded cursor-pointer flex items-center"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </button>
                  <div className="h-px bg-border my-1" />
                  <button
                    onClick={() => {
                      updateStatus.mutate({
                        orderId: String(order._id),
                        status: 'completed',
                      });
                      setIsOpen(false);
                    }}
                    disabled={!isValidTransition(order.status, 'completed')}
                    className="w-full text-left px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground rounded cursor-pointer flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Mark as Completed
                  </button>
                  <button
                    onClick={() => {
                      updateStatus.mutate({
                        orderId: String(order._id),
                        status: 'cancelled',
                      });
                      setIsOpen(false);
                    }}
                    disabled={!isValidTransition(order.status, 'cancelled')}
                    className="w-full text-left px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground rounded cursor-pointer flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Mark as Cancelled
                  </button>
                  <button
                    onClick={() => {
                      updateStatus.mutate({
                        orderId: String(order._id),
                        status: 'refunded',
                      });
                      setIsOpen(false);
                    }}
                    disabled={!isValidTransition(order.status, 'refunded')}
                    className="w-full text-left px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground rounded cursor-pointer flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Mark as Refunded
                  </button>
                </div>
              </Dropdown>
            </div>
          );
        },
        enableSorting: false,
        enableHiding: false,
      },
    ];
    
    return baseColumns;
  }, [onEditOrder, updateStatus, mode, isValidTransition]);

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
    
    // Validate transitions before making API call
    const orders = selectedRows.map(row => ({ status: row.original.status }));
    const validation = validateBulkTransitions(orders, status);
    
    if (validation.invalid.length > 0) {
      // Show warning about invalid transitions
      const firstError = validation.invalid[0].error;
      toast.error(`${validation.invalid.length} order(s) cannot be changed to ${status}. ${firstError}`);
      
      if (validation.valid.length === 0) {
        return; // No valid transitions, don't proceed
      }
    }
    
    // Only update orders with valid transitions
    const validOrderIds = selectedRows
      .filter((_, index) => validation.valid.includes(index))
      .map(row => row.original._id.toString());
    
    if (validOrderIds.length > 0) {
      await bulkUpdateStatus.mutateAsync({ orderIds: validOrderIds, status });
      setRowSelection({});
    }
  };

  const handleExport = async () => {
    const orders = data?.orders ?? [];
    const selectedIds = Object.keys(rowSelection);
    const ordersToExport = selectedIds.length > 0 
      ? orders.filter(order => selectedIds.includes(order._id))
      : orders;
    
    // Show confirmation dialog for large datasets
    if (ordersToExport.length > 100) {
      setShowExportConfirmation(true);
      return;
    }
    
    await performExport();
  };
  
  const performExport = async () => {
    const orders = data?.orders ?? [];
    const selectedIds = Object.keys(rowSelection);
    
    await exportOrders(orders, {
      selectedOnly: selectedIds.length > 0,
      selectedIds: selectedIds.length > 0 ? selectedIds : undefined,
      includeAddresses: true,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      startDate: dateRange.from ? new Date(dateRange.from) : undefined,
      endDate: dateRange.to ? new Date(dateRange.to) : undefined,
    });
    
    setShowExportConfirmation(false);
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
        {mode === 'admin' && (
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search orders..."
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => debouncedSetGlobalFilter(e.target.value)}
              className="pl-9"
            />
          </div>
        )}
        <Select
          value={statusFilter}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value as typeof statusFilter)}
          options={[
            { value: 'all', label: 'All Status' },
            { value: 'pending', label: 'Pending' },
            { value: 'pending_inventory', label: 'Pending Inventory' },
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
        {mode === 'admin' && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={!data?.orders.length || isExporting}
            aria-label="Export orders to CSV"
            title="Export filtered orders to CSV file"
          >
            {isExporting ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export
              </>
            )}
          </Button>
        )}
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
        {mode === 'admin' && (
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              aria-label="Columns"
              onClick={() => setShowColumnVisibility(!showColumnVisibility)}
            >
              Columns
            </Button>
            {showColumnVisibility && (
              <div className="absolute right-0 top-full mt-2 bg-popover border rounded-md shadow-md p-1 min-w-[150px] z-50">
              {table.getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <div
                      key={column.id}
                      className="flex items-center px-2 py-1.5 hover:bg-accent hover:text-accent-foreground rounded"
                    >
                      <Checkbox
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) => column.toggleVisibility(!!value)}
                        aria-label={`Toggle ${column.id} column`}
                      />
                      <span className="ml-2 text-sm">{column.id}</span>
                    </div>
                  );
                })}
            </div>
          )}
          </div>
        )}
      </div>

      {/* Bulk actions */}
      {mode === 'admin' && selectedRows.length > 0 && (
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
                      'hover:bg-muted/50 transition-colors cursor-pointer',
                      row.getIsSelected() && 'bg-muted/30',
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
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => table.setPageSize(Number(e.target.value))}
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
      
      {/* Export Confirmation Dialog */}
      <Dialog open={showExportConfirmation} onOpenChange={setShowExportConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Large Dataset</DialogTitle>
            <DialogDescription>
              You are about to export {
                Object.keys(rowSelection).length > 0 
                  ? Object.keys(rowSelection).length 
                  : data?.orders.length || 0
              } orders. This may create a large file and take a few moments.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowExportConfirmation(false)}
              aria-label="Cancel export"
            >
              Cancel
            </Button>
            <Button
              onClick={performExport}
              disabled={isExporting}
              aria-label={isExporting ? 'Export in progress' : 'Confirm export'}
            >
              {isExporting ? 'Exporting...' : 'Continue with Export'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}