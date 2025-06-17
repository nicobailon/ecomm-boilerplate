import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ProductInput, productSchema } from '@/lib/validations';
import { useCreateProduct } from '@/hooks/queries/useProducts';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { UploadButton } from '@/lib/uploadthing';
import toast from 'react-hot-toast';

export const CreateProductForm: React.FC = () => {
  const createProduct = useCreateProduct();
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
  });

  const watchedImage = watch('image');

  const onSubmit = (data: ProductInput) => {
    createProduct.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Input
        label="Product Name"
        type="text"
        {...register('name')}
        error={errors.name?.message}
      />
      
      <Textarea
        label="Description"
        {...register('description')}
        placeholder="Enter product description..."
        error={errors.description?.message}
      />
      
      <Input
        label="Price"
        type="number"
        step="0.01"
        {...register('price', { valueAsNumber: true })}
        error={errors.price?.message}
      />
      
      <Select
        label="Category"
        {...register('category')}
        placeholder="Select a category"
        options={[
          { value: 'jeans', label: 'Jeans' },
          { value: 't-shirts', label: 'T-Shirts' },
          { value: 'shoes', label: 'Shoes' },
          { value: 'glasses', label: 'Glasses' },
          { value: 'jackets', label: 'Jackets' },
          { value: 'suits', label: 'Suits' },
          { value: 'bags', label: 'Bags' },
        ]}
        error={errors.category?.message}
      />
      
      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">
          Product Image
        </label>
        {watchedImage ? (
          <div className="space-y-2">
            <img
              src={watchedImage}
              alt="Preview"
              className="w-32 h-32 object-cover rounded-md border"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setValue('image', '', { shouldValidate: true })}
            >
              Change Image
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <UploadButton
              endpoint="productImageUploader"
              onClientUploadComplete={(res: any) => {
                if (res && res.length > 0) {
                  setValue("image", res[0].url, { shouldValidate: true });
                  toast.success("Image uploaded successfully!");
                }
              }}
              onUploadError={(error: Error) => {
                toast.error(`Upload Failed: ${error.message}`);
              }}
            />
            <div className="text-sm text-gray-500">
              or
            </div>
            <Input
              {...register('image')}
              placeholder="Enter image URL manually"
              type="url"
            />
          </div>
        )}
        {errors.image && (
          <p className="text-sm text-red-600">{errors.image.message}</p>
        )}
      </div>
      
      <Button
        type="submit"
        className="w-full"
        isLoading={isSubmitting || createProduct.isPending}
      >
        Create Product
      </Button>
    </form>
  );
};