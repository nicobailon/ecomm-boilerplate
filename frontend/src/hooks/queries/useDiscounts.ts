import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

interface ListDiscountsParams {
  page?: number;
  limit?: number;
  isActive?: boolean;
}

export function useListDiscounts(params: ListDiscountsParams = {}) {
  return trpc.coupon.listAll.useQuery(params);
}

export function useCreateDiscount() {
  const utils = trpc.useContext();
  
  return trpc.coupon.create.useMutation({
    onSuccess: async () => {
      // Invalidate and immediately refetch
      await utils.coupon.listAll.invalidate();
      toast.success('Discount code created successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create discount code');
    },
  });
}

export function useUpdateDiscount() {
  const utils = trpc.useContext();
  
  return trpc.coupon.update.useMutation({
    onSuccess: async () => {
      // Invalidate and immediately refetch
      await utils.coupon.listAll.invalidate();
      toast.success('Discount code updated successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update discount code');
    },
  });
}

export function useDeleteDiscount() {
  const utils = trpc.useContext();
  
  return trpc.coupon.delete.useMutation({
    onSuccess: async () => {
      // Invalidate and immediately refetch
      await utils.coupon.listAll.invalidate();
      toast.success('Discount code deleted successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete discount code');
    },
  });
}