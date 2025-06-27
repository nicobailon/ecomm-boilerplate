import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { DiscountsTable } from '../../components/discount/DiscountsTable';
import { DiscountEditDrawer } from '../../components/drawers/DiscountEditDrawer';
import type { Discount } from '@/types/discount';

const DiscountsTab = () => {
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit' | null>(null);
  const [selectedDiscount, setSelectedDiscount] = useState<Discount | null>(null);
  
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
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Discount Codes</h2>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Create Discount
        </Button>
      </div>
      
      <DiscountsTable onEditDiscount={handleEdit} />
      
      
      {drawerMode && (
        <DiscountEditDrawer
          isOpen={drawerMode !== null}
          onClose={handleCloseDrawer}
          mode={drawerMode}
          discount={selectedDiscount ?? undefined}
        />
      )}
    </div>
  );
};

export default DiscountsTab;