import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ProductInput, productSchema } from '@/lib/validations';
import { useProductCreation } from '@/hooks/useProductCreation';
import { useCreateProduct, useUpdateProduct } from '@/hooks/queries/useProducts';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { UploadButton } from '@/lib/uploadthing';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/Switch';
import { Label } from '@/components/ui/Label';
import { Progress } from '@/components/ui/Progress';
import { cn } from '@/lib/utils';
import { CheckIcon } from 'lucide-react';
import { ProductFormProps } from '@/types';

export const ProductForm: React.FC<ProductFormProps> = ({ mode, initialData, onSuccess }) => {
  const productCreation = mode === 'create' ? useProductCreation() : null;
  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();

  const [imagePreview, setImagePreview] = useState<string>('');
  
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: mode === 'edit' && initialData ? {
      name: initialData.name,
      description: initialData.description,
      price: initialData.price,
      category: initialData.category,
      image: initialData.image
    } : productCreation?.draftData || {
      name: '',
      description: '',
      price: 0,
      category: 'jeans',
      image: ''
    }
  });

  const watchedImage = watch('image');
  const watchedFields = watch();
  
  // Check if fields are valid
  const nameError = errors.name;
  const isNameValid = watchedFields.name && !nameError;
  const isDescriptionValid = watchedFields.description && !errors.description;
  const isPriceValid = watchedFields.price > 0 && !errors.price;
  
  // Calculate form completion progress
  const completedFields = [
    watchedFields.name,
    watchedFields.description,
    watchedFields.price > 0,
    watchedFields.category,
    watchedFields.image || imagePreview
  ].filter(Boolean).length;
  const totalFields = 5;
  const progress = (completedFields / totalFields) * 100;
  
  // Load initial data for edit mode or draft for create mode
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      reset(initialData);
      if (initialData.image) {
        setImagePreview(initialData.image);
      }
    } else if (mode === 'create' && productCreation?.draftData) {
      // Draft is already loaded in form defaults, just set image preview if needed
      if (productCreation.draftData.image) {
        setImagePreview(productCreation.draftData.image);
      }
    }
  }, [mode, initialData, reset, productCreation?.draftData]);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Enter to submit
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSubmit(onSubmit)();
      }
      // Ctrl/Cmd + S to save draft (only in create mode)
      if ((e.ctrlKey || e.metaKey) && e.key === 's' && mode === 'create' && productCreation) {
        e.preventDefault();
        productCreation.saveDraft(getValues());
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleSubmit, mode, productCreation, getValues]);

  const onSubmit = async (data: ProductInput) => {
    if (mode === 'create') {
      createProductMutation.mutate(data, {
        onSuccess: (newProduct) => {
          // Reset form after successful creation
          reset();
          setImagePreview('');
          onSuccess?.(newProduct);
          
          // Handle navigation and other logic via the productCreation hook if available
          if (productCreation && !productCreation.bulkMode) {
            // The hook will handle navigation
          }
        },
      });
    } else {
      // Edit mode
      updateProductMutation.mutate({ id: initialData!._id, data }, {
        onSuccess: (updatedProduct) => {
          toast.success('Product updated!');
          onSuccess?.(updatedProduct);
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Bulk Mode Toggle */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{mode === 'create' ? 'Create New Product' : 'Edit Product'}</h2>
        {mode === 'create' && productCreation && (
          <div className="flex items-center gap-2">
            <Switch
              id="bulk-mode"
              checked={productCreation.bulkMode}
              onCheckedChange={productCreation.toggleBulkMode}
            />
            <Label htmlFor="bulk-mode" className="cursor-pointer">
              Stay on form after creation
            </Label>
          </div>
        )}
      </div>
      
      {/* Session Counter */}
      {mode === 'create' && productCreation?.bulkMode && productCreation.sessionCount > 0 && (
        <div className="text-sm -mt-2 text-muted-foreground">
          Products created this session: {productCreation.sessionCount}
        </div>
      )}
      
      {/* Form Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Form completion</span>
          <span className="text-muted-foreground">{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="relative">
          <Input
            label="Product Name"
            type="text"
            {...register('name')}
            error={errors.name?.message}
            className={cn(
              isNameValid && 'border-success focus-visible:ring-success'
            )}
          />
          {isNameValid && (
            <CheckIcon className="absolute right-3 top-8 h-4 w-4 text-success" />
          )}
        </div>
      
      <div className="relative">
        <Textarea
          label="Description"
          {...register('description')}
          placeholder="Enter product description..."
          error={errors.description?.message}
          className={cn(
            isDescriptionValid && 'border-success focus-visible:ring-success'
          )}
        />
        {isDescriptionValid && (
          <CheckIcon className="absolute right-3 top-8 h-4 w-4 text-success" />
        )}
      </div>
      
      <div className="relative">
        <Input
          label="Price"
          type="number"
          step="0.01"
          {...register('price', { valueAsNumber: true })}
          error={errors.price?.message}
          className={cn(
            isPriceValid && 'border-success focus-visible:ring-success'
          )}
        />
        {isPriceValid && (
          <CheckIcon className="absolute right-3 top-8 h-4 w-4 text-success" />
        )}
      </div>
      
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
        <label className="text-sm font-medium text-foreground">
          Product Image
        </label>
        {watchedImage || imagePreview ? (
          <div className="space-y-2">
            <img
              src={watchedImage || imagePreview}
              alt="Preview"
              className="w-32 h-32 object-cover rounded-md border"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setValue('image', '', { shouldValidate: true });
                setImagePreview('');
              }}
            >
              Change Image
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            <UploadButton
              endpoint="productImageUploader"
              onClientUploadComplete={(res) => {
                if (res && res.length > 0) {
                  const uploadedFile = res[0];
                  setValue("image", uploadedFile.url, { shouldValidate: true });
                  setImagePreview(uploadedFile.url);
                  toast.success("Image uploaded successfully!");
                }
              }}
              onUploadError={(error: Error) => {
                toast.error(`Upload Failed: ${error.message}`);
              }}
              onUploadProgress={() => {}}
              onUploadBegin={() => {}}
            />
            <div className="text-sm text-muted-foreground">
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
          <p className="text-sm text-destructive">{errors.image.message}</p>
        )}
      </div>
      
      <Button
        type="submit"
        className="w-full"
        isLoading={isSubmitting || (mode === 'create' ? createProductMutation.isPending : updateProductMutation.isPending)}
      >
        {isSubmitting || (mode === 'create' ? createProductMutation.isPending : updateProductMutation.isPending)
          ? (mode === 'create' ? 'Creating...' : 'Saving...')
          : (mode === 'create' ? 'Create Product' : 'Save Changes')}
      </Button>
      
      {/* Keyboard shortcuts hint */}
      <p className="text-xs text-center mt-2 text-muted-foreground">
        Tip: Press Ctrl+Enter (⌘+Enter on Mac) to submit
        {mode === 'create' && ' • Ctrl+S (⌘+S on Mac) to save draft'}
      </p>
    </form>
    </div>
  );
};