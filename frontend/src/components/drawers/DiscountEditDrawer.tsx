import { Drawer } from '../ui/Drawer';
import { DiscountForm } from '../forms/DiscountForm';
import { useCreateDiscount, useUpdateDiscount } from '../../hooks/queries/useDiscounts';
import type { DiscountFormInput } from '@/lib/validations';
import type { Discount } from '@/types/discount';

interface DiscountEditDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  discount?: Discount;
}

export const DiscountEditDrawer: React.FC<DiscountEditDrawerProps> = ({
  isOpen,
  onClose,
  mode,
  discount,
}) => {
  const createDiscount = useCreateDiscount();
  const updateDiscount = useUpdateDiscount();
  
  const handleSubmit = async (data: DiscountFormInput) => {
    try {
      if (mode === 'create') {
        await createDiscount.mutateAsync({
          ...data,
          expirationDate: data.expirationDate.toISOString(),
        });
      } else if (discount) {
        await updateDiscount.mutateAsync({ 
          id: discount._id,
          data: {
            discountPercentage: data.discountPercentage,
            expirationDate: data.expirationDate.toISOString(),
            isActive: data.isActive,
            description: data.description ?? undefined,
            maxUses: data.maxUses,
            minimumPurchaseAmount: data.minimumPurchaseAmount,
          },
        });
      }
      onClose();
    } catch {
      // Error is already handled by the mutation hooks with toast
    }
  };

  const title = mode === 'create' 
    ? 'Create Discount Code' 
    : `Edit Discount: ${discount?.code ?? ''}`;
    
  const description = mode === 'create'
    ? 'Create a new discount code for customers to use at checkout'
    : 'Update discount details and save changes';

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      className="sm:max-w-2xl"
    >
      <div className="mt-6">
        <DiscountForm
          mode={mode}
          initialData={discount}
          onSubmit={handleSubmit}
          isSubmitting={createDiscount.isPending || updateDiscount.isPending}
        />
      </div>
    </Drawer>
  );
};