import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useEffect } from 'react';
import type { DiscountFormInput } from '@/lib/validations';
import { discountFormSchema } from '@/lib/validations';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Switch } from '@/components/ui/Switch';
import { Label } from '@/components/ui/Label';
import type { RouterOutputs } from '@/lib/trpc';

type CouponFromAPI = RouterOutputs['coupon']['listAll']['discounts'][0] & { _id: string; createdAt?: string | Date; updatedAt?: string | Date; };

interface DiscountFormProps {
  mode: 'create' | 'edit';
  initialData?: CouponFromAPI;
  onSubmit: (data: DiscountFormInput) => void | Promise<void>;
  isSubmitting?: boolean;
}

export const DiscountForm: React.FC<DiscountFormProps> = ({ 
  mode, 
  initialData, 
  onSubmit,
  isSubmitting = false, 
}) => {
  // Add styles for range slider
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .slider::-webkit-slider-thumb {
        appearance: none;
        width: 20px;
        height: 20px;
        background: hsl(var(--primary));
        cursor: pointer;
        border-radius: 50%;
      }
      
      .slider::-moz-range-thumb {
        width: 20px;
        height: 20px;
        background: hsl(var(--primary));
        cursor: pointer;
        border-radius: 50%;
        border: none;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<DiscountFormInput>({
    resolver: zodResolver(discountFormSchema),
    defaultValues: mode === 'edit' && initialData ? {
      code: initialData.code,
      discountPercentage: initialData.discountPercentage,
      expirationDate: new Date(initialData.expirationDate),
      isActive: initialData.isActive,
      description: initialData.description ?? '',
      maxUses: initialData.maxUses,
      minimumPurchaseAmount: initialData.minimumPurchaseAmount,
    } : {
      code: '',
      discountPercentage: 10,
      expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      isActive: true,
      description: '',
      maxUses: undefined,
      minimumPurchaseAmount: undefined,
    },
  });

  const watchedPercentage = watch('discountPercentage');
  const watchedIsActive = watch('isActive');
  const watchedExpirationDate = watch('expirationDate');

  const handlePercentageChange = (value: string) => {
    const numValue = parseInt(value) || 0;
    setValue('discountPercentage', Math.min(100, Math.max(0, numValue)));
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      setValue('expirationDate', new Date(e.target.value));
    }
  };

  return (
    <form onSubmit={(...args) => void handleSubmit(onSubmit)(...args)} className="space-y-6" noValidate>
      <div className="space-y-4">
        <Input
          label="Discount Code"
          {...register('code')}
          error={errors.code?.message}
          placeholder="SUMMER2024"
          onChange={(e) => {
            const upperValue = e.target.value.toUpperCase();
            e.target.value = upperValue;
            void register('code').onChange(e);
          }}
          aria-label="Discount code"
          aria-describedby="code-description"
        />
        <p id="code-description" className="text-sm text-muted-foreground mt-1">
          Customers will enter this code at checkout
        </p>

        <div>
          <Label htmlFor="percentage">Discount Percentage</Label>
          <div className="flex items-center gap-4 mt-2">
            <input
              type="range"
              id="percentage-slider"
              min="0"
              max="100"
              value={watchedPercentage}
              onChange={(e) => handlePercentageChange(e.target.value)}
              className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer slider"
              aria-label="Discount percentage slider"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={watchedPercentage}
            />
            <div className="flex items-center gap-2">
              <Input
                id="percentage"
                type="number"
                value={watchedPercentage}
                onChange={(e) => handlePercentageChange(e.target.value)}
                className="w-20 text-center"
                min="0"
                max="100"
              />
              <span className="text-muted-foreground">%</span>
            </div>
          </div>
          {errors.discountPercentage && (
            <p className="text-sm text-destructive mt-1">{errors.discountPercentage.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="expiration">Expiration Date</Label>
          <div className="relative mt-2">
            <Input
              id="expiration"
              type="datetime-local"
              value={watchedExpirationDate ? format(watchedExpirationDate, 'yyyy-MM-dd\'T\'HH:mm') : ''}
              onChange={handleDateChange}
              error={errors.expirationDate?.message}
              className="pl-10"
            />
            <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            When the discount code will expire
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="active">Active Status</Label>
            <p className="text-sm text-muted-foreground">
              {watchedIsActive ? 'Customers can use this code' : 'Code is disabled'}
            </p>
          </div>
          <Switch
            id="active"
            checked={watchedIsActive}
            onCheckedChange={(checked) => setValue('isActive', checked)}
          />
        </div>

        <Textarea
          label="Description (Optional)"
          {...register('description')}
          error={errors.description?.message}
          placeholder="Summer sale - 20% off all items"
          rows={3}
        />
        <p className="text-sm text-muted-foreground mt-1">
          Internal note about this discount
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Input
              label="Max Uses (Optional)"
              type="number"
              {...register('maxUses', { 
                setValueAs: (value: string) => value === '' ? undefined : parseInt(value), 
              })}
              error={errors.maxUses?.message}
              placeholder="Unlimited"
              min="1"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Leave empty for unlimited
            </p>
          </div>

          <div>
            <Input
              label="Min Purchase (Optional)"
              type="number"
              {...register('minimumPurchaseAmount', { 
                setValueAs: (value: string) => value === '' ? undefined : parseFloat(value), 
              })}
              error={errors.minimumPurchaseAmount?.message}
              placeholder="No minimum"
              min="0"
              step="0.01"
            />
            <p className="text-sm text-muted-foreground mt-1">
              Minimum cart value
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button
          type="submit"
          isLoading={isSubmitting}
        >
          {mode === 'create' ? 'Create Discount' : 'Update Discount'}
        </Button>
      </div>
    </form>
  );
};

