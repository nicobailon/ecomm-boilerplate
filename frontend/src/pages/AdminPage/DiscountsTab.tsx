import { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { DiscountsTableSkeleton } from '@/components/ui/DiscountsSkeleton';
import { useListDiscounts, useDeleteDiscount } from '../../hooks/queries/useDiscounts';
import { DiscountEditDrawer } from '../../components/drawers/DiscountEditDrawer';
import { ConfirmDialog } from '../../components/ui/AlertDialog';
import type { Discount } from '@/types/discount';

const DiscountsTab = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'expired'>('all');
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit' | null>(null);
  const [selectedDiscount, setSelectedDiscount] = useState<Discount | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [discountToDelete, setDiscountToDelete] = useState<Discount | null>(null);
  
  const { data, isLoading, isRefetching } = useListDiscounts({});
  const deleteDiscount = useDeleteDiscount();
  
  const filteredDiscounts = useMemo(() => {
    if (!data?.discounts) return [];
    
    let filtered = data.discounts as Discount[];
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(discount => 
        discount.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        discount.description?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }
    
    // Apply status filter
    const now = new Date();
    if (statusFilter !== 'all') {
      filtered = filtered.filter(discount => {
        const isExpired = new Date(discount.expirationDate) < now;
        if (statusFilter === 'expired') return isExpired;
        if (statusFilter === 'active') return discount.isActive && !isExpired;
        if (statusFilter === 'inactive') return !discount.isActive;
        return true;
      });
    }
    
    return filtered;
  }, [data?.discounts, searchQuery, statusFilter]);
  
  const handleEdit = (discount: Discount) => {
    setSelectedDiscount(discount);
    setDrawerMode('edit');
  };
  
  const handleCreate = () => {
    setSelectedDiscount(null);
    setDrawerMode('create');
  };
  
  const handleCloseDrawer = () => {
    setDrawerMode(null);
    setSelectedDiscount(null);
  };
  
  const handleDeleteClick = (discount: Discount) => {
    setDiscountToDelete(discount);
    setDeleteConfirmOpen(true);
  };
  
  const handleConfirmDelete = async () => {
    if (discountToDelete) {
      await deleteDiscount.mutateAsync({ id: discountToDelete._id });
      setDeleteConfirmOpen(false);
      setDiscountToDelete(null);
    }
  };
  
  const getStatusBadge = (discount: Discount) => {
    const now = new Date();
    const isExpired = new Date(discount.expirationDate) < now;
    
    if (isExpired) {
      return <Badge variant="secondary">Expired</Badge>;
    }
    
    return discount.isActive ? (
      <Badge variant="success">Active</Badge>
    ) : (
      <Badge variant="secondary">Inactive</Badge>
    );
  };
  
  if (isLoading) return <DiscountsTableSkeleton />;
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold">Discount Codes</h2>
          {isRefetching && !isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span>Refreshing...</span>
            </div>
          )}
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Create Discount
        </Button>
      </div>
      
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search by code or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            aria-label="Search discount codes"
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive' | 'expired')}
          options={[
            { value: 'all', label: 'All Status' },
            { value: 'active', label: 'Active' },
            { value: 'inactive', label: 'Inactive' },
            { value: 'expired', label: 'Expired' },
          ]}
        />
      </div>
      
      {filteredDiscounts.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-lg">
          <p className="text-muted-foreground">
            {searchQuery || statusFilter !== 'all' 
              ? 'No discount codes found matching your filters.'
              : 'No discount codes yet. Create your first one!'}
          </p>
        </div>
      ) : (
        <motion.div
          className="bg-card shadow-lg rounded-lg overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Discount %
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Usage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Expiration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {filteredDiscounts.map((discount) => (
                <tr key={discount._id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium">{discount.code}</div>
                      {discount.description && (
                        <div className="text-xs text-muted-foreground">{discount.description}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {discount.discountPercentage}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(discount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div>
                      <span className="text-foreground">{discount.currentUses}</span>
                      {discount.maxUses && (
                        <span className="text-muted-foreground"> / {discount.maxUses}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {format(new Date(discount.expirationDate), 'MMM dd, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(discount)}
                        aria-label={`Edit discount code ${discount.code}`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(discount)}
                        disabled={deleteDiscount.isPending}
                        aria-label={`Delete discount code ${discount.code}`}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}
      
      {drawerMode && (
        <DiscountEditDrawer
          isOpen={drawerMode !== null}
          onClose={handleCloseDrawer}
          mode={drawerMode}
          discount={selectedDiscount ?? undefined}
        />
      )}
      
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Discount Code"
        description={discountToDelete ? `Are you sure you want to delete "${discountToDelete.code}"? ${discountToDelete.currentUses > 0 ? `This code has been used ${discountToDelete.currentUses} time${discountToDelete.currentUses === 1 ? '' : 's'}.` : 'This action cannot be undone.'}` : ''}
        confirmText="Delete"
        onConfirm={() => void handleConfirmDelete()}
        variant="destructive"
        isLoading={deleteDiscount.isPending}
      />
    </div>
  );
};

export default DiscountsTab;