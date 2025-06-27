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
  Trash2, 
  Edit2, 
  ChevronUp, 
  ChevronDown, 
  ChevronsUpDown, 
  Search, 
  Copy,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Checkbox } from '@/components/ui/Checkbox';
import { Progress } from '@/components/ui/Progress';
import { trpc } from '@/lib/trpc';
import type { RouterOutputs } from '@/lib/trpc';
import { useDeleteDiscount } from '@/hooks/queries/useDiscounts';
import LoadingSpinner from '../ui/LoadingSpinner';
import { toast } from 'sonner';
import debounce from 'lodash.debounce';
import { BulkActionBar } from '@/components/table/BulkActionBar';
import { DateRangeFilter } from '@/components/table/DateRangeFilter';
import { ExportButton } from '@/components/table/ExportButton';

type CouponFromAPI = RouterOutputs['coupon']['listAll']['discounts'][0] & { _id: string; createdAt?: string | Date; updatedAt?: string | Date; };

interface DiscountsTableProps {
  onEditDiscount?: (discount: CouponFromAPI) => void;
}

// Status helper functions
function getDiscountStatus(discount: CouponFromAPI): 'active' | 'inactive' | 'expired' {
  const now = new Date();
  const expirationDate = new Date(discount.expirationDate);
  
  if (expirationDate < now) return 'expired';
  if (!discount.isActive) return 'inactive';
  return 'active';
}

function getStatusBadge(discount: CouponFromAPI) {
  const status = getDiscountStatus(discount);
  
  switch (status) {
    case 'active':
      return <Badge variant="success"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
    case 'inactive':
      return <Badge variant="secondary"><XCircle className="w-3 h-3 mr-1" />Inactive</Badge>;
    case 'expired':
      return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Expired</Badge>;
  }
}

function getUsageStatus(discount: CouponFromAPI): 'never' | 'low' | 'high' | 'maxed' {
  if (discount.currentUses === 0) return 'never';
  if (discount.maxUses && discount.currentUses >= discount.maxUses) return 'maxed';
  if (discount.currentUses <= 10) return 'low';
  return 'high';
}

export function DiscountsTable({ onEditDiscount }: DiscountsTableProps) {
  // State management
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [globalFilter, setGlobalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'expired'>('all');
  const [usageFilter, setUsageFilter] = useState<'all' | 'never' | 'low' | 'high'>('all');
  const [dateRange, setDateRange] = useState<{ from?: string; to?: string }>({});
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });

  // Mutations
  const deleteDiscount = useDeleteDiscount();
  const utils = trpc.useUtils();

  // Fetch data with tRPC
  const { data, isLoading, isError } = trpc.coupon.listAll.useQuery({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    search: globalFilter || undefined,
    sortBy: sorting[0]?.id as 'code' | 'discountPercentage' | 'expirationDate' | 'createdAt' | 'updatedAt' | 'currentUses' | undefined,
    sortOrder: sorting[0]?.desc ? 'desc' : 'asc',
    status: statusFilter !== 'all' ? statusFilter : undefined,
    usageStatus: usageFilter !== 'all' ? usageFilter : undefined,
    expirationDateFrom: dateRange.from,
    expirationDateTo: dateRange.to,
  }, {
    placeholderData: (previousData) => previousData,
  });

  // Debounced search
  const debouncedSetGlobalFilter = useMemo(
    () => debounce((value: string) => setGlobalFilter(value), 300),
    [],
  );

  // Column definitions
  const columns = useMemo<ColumnDef<CouponFromAPI>[]>(
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
        accessorKey: 'code',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-auto p-0 font-medium text-xs text-muted-foreground uppercase tracking-wider hover:text-foreground"
            >
              Code
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
          const discount = row.original;
          const CopyButton = () => {
            const [copied, setCopied] = useState(false);

            const handleCopy = async (e: React.MouseEvent) => {
              e.stopPropagation();
              await navigator.clipboard.writeText(discount.code);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            };

            return (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => void handleCopy(e)}
                className="h-6 w-6 p-0"
              >
                {copied ? (
                  <CheckCircle className="h-3 w-3 text-green-600" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            );
          };

          return (
            <div className="flex items-center gap-2">
              <div>
                <div className="font-medium">{discount.code}</div>
                {discount.description && (
                  <div className="text-xs text-muted-foreground">{discount.description}</div>
                )}
              </div>
              <CopyButton />
            </div>
          );
        },
      },
      {
        accessorKey: 'discountPercentage',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-auto p-0 font-medium text-xs text-muted-foreground uppercase tracking-wider hover:text-foreground"
            >
              Discount %
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
          return <div className="text-sm font-medium">{row.original.discountPercentage}%</div>;
        },
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) => getStatusBadge(row.original),
        enableSorting: false,
      },
      {
        id: 'usage',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-auto p-0 font-medium text-xs text-muted-foreground uppercase tracking-wider hover:text-foreground"
            >
              Usage
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
        accessorFn: (row) => row.currentUses,
        cell: ({ row }) => {
          const discount = row.original;
          const usagePercent = discount.maxUses 
            ? (discount.currentUses / discount.maxUses) * 100 
            : 0;
          const status = getUsageStatus(discount);

          return (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{discount.currentUses}</span>
                {discount.maxUses && (
                  <>
                    <span className="text-sm text-muted-foreground">/ {discount.maxUses}</span>
                    {status === 'maxed' && (
                      <AlertCircle className="w-3 h-3 text-orange-600" />
                    )}
                  </>
                )}
              </div>
              {discount.maxUses && (
                <Progress value={usagePercent} className="h-1.5" />
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'expirationDate',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-auto p-0 font-medium text-xs text-muted-foreground uppercase tracking-wider hover:text-foreground"
            >
              Expiration
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
          const date = new Date(row.original.expirationDate);
          const now = new Date();
          const daysUntilExpiry = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          const isExpired = daysUntilExpiry < 0;
          const isExpiringSoon = daysUntilExpiry >= 0 && daysUntilExpiry <= 7;

          return (
            <div className={cn(
              'text-sm',
              isExpired && 'text-destructive',
              isExpiringSoon && 'text-orange-600',
            )}>
              <div>{format(date, 'MMM dd, yyyy')}</div>
              <div className="text-xs">
                {isExpired 
                  ? `Expired ${Math.abs(daysUntilExpiry)} days ago`
                  : daysUntilExpiry === 0 
                  ? 'Expires today'
                  : `${daysUntilExpiry} days left`}
              </div>
            </div>
          );
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const discount = row.original;
          
          return (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditDiscount?.(discount);
                }}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm(`Delete discount code "${discount.code}"?`)) {
                    deleteDiscount.mutate({ id: discount._id });
                  }
                }}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          );
        },
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [deleteDiscount, onEditDiscount],
  );

  // Table instance
  const table = useReactTable<CouponFromAPI>({
    data: (data?.discounts ?? []) as CouponFromAPI[],
    columns,
    pageCount: Math.ceil((data?.total ?? 0) / pagination.pageSize),
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
    
    if (!window.confirm(`Delete ${selectedRows.length} discount codes?`)) {
      return;
    }

    for (const row of selectedRows) {
      await deleteDiscount.mutateAsync({ id: row.original._id });
    }
    
    setRowSelection({});
    toast.success(`Deleted ${selectedRows.length} discount codes`);
  };

  const updateCoupon = trpc.coupon.update.useMutation();

  const handleBulkToggleStatus = async (activate: boolean) => {
    if (selectedRows.length === 0) return;

    for (const row of selectedRows) {
      await updateCoupon.mutateAsync({
        id: row.original._id,
        data: { isActive: activate },
      });
    }

    await utils.coupon.listAll.invalidate();
    setRowSelection({});
    toast.success(`${activate ? 'Activated' : 'Deactivated'} ${selectedRows.length} discount codes`);
  };

  const handleExport = () => {
    const discounts = (data?.discounts ?? []) as CouponFromAPI[];
    const csv = [
      ['Code', 'Description', 'Discount %', 'Status', 'Current Uses', 'Max Uses', 'Expiration Date', 'Created At'].join(','),
      ...discounts.map(d => [
        `"${d.code}"`,
        `"${d.description ?? ''}"`,
        d.discountPercentage,
        getDiscountStatus(d),
        d.currentUses,
        d.maxUses ?? 'Unlimited',
        format(new Date(d.expirationDate), 'yyyy-MM-dd'),
        d.createdAt ? format(new Date(d.createdAt), 'yyyy-MM-dd') : '',
      ].join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `discounts-${new Date().toISOString().split('T')[0]}.csv`;
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
        <p className="text-destructive">Failed to load discounts. Please try again.</p>
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
            placeholder="Search by code or description..."
            onChange={(e) => debouncedSetGlobalFilter(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          options={[
            { value: 'all', label: 'All Status' },
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
            { value: 'expired', label: 'Expired' },
          ]}
        />
        <Select
          value={usageFilter}
          onChange={(e) => setUsageFilter(e.target.value as typeof usageFilter)}
          options={[
            { value: 'all', label: 'All Usage' },
            { value: 'never', label: 'Never Used' },
            { value: 'low', label: 'Low Usage' },
            { value: 'high', label: 'High Usage' },
          ]}
        />
        <DateRangeFilter
          value={dateRange}
          onChange={setDateRange}
          placeholder="Expiration date range"
        />
        <ExportButton
          onExport={handleExport}
          disabled={!data?.discounts.length}
        />
      </div>

      {/* Bulk actions */}
      <BulkActionBar
        selectedCount={selectedRows.length}
        onClearSelection={() => setRowSelection({})}
        actions={[
          {
            label: 'Activate',
            variant: 'default',
            onClick: () => handleBulkToggleStatus(true),
            icon: <CheckCircle className="w-4 h-4" />,
          },
          {
            label: 'Deactivate',
            variant: 'secondary',
            onClick: () => handleBulkToggleStatus(false),
            icon: <XCircle className="w-4 h-4" />,
          },
          {
            label: 'Delete',
            variant: 'destructive',
            onClick: handleBulkDelete,
            icon: <Trash2 className="w-4 h-4" />,
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
                    No discount codes found
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => onEditDiscount?.(row.original)}
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
        <div className="px-6 py-3 border-t border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Showing {((pagination.pageIndex) * pagination.pageSize) + 1} to{' '}
              {Math.min((pagination.pageIndex + 1) * pagination.pageSize, data?.total ?? 0)} of{' '}
              {data?.total ?? 0} discounts
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
      </motion.div>
    </div>
  );
}