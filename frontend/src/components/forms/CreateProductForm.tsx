import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ProductInput, productSchema } from '@/lib/validations';
import { useCreateProduct } from '@/hooks/queries/useProducts';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { UploadButton } from '@/lib/uploadthing';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Switch } from '@/components/ui/Switch';
import { Label } from '@/components/ui/Label';
import { Progress } from '@/components/ui/Progress';
import { cn } from '@/lib/utils';
import { CheckIcon } from 'lucide-react';
import { CreateProductFormProps } from '@/types';

const DRAFT_KEY = 'product-creation-draft';

export const CreateProductForm: React.FC<CreateProductFormProps> = ({ onProductCreated }) => {
  const createProduct = useCreateProduct();
  const [imagePreview, setImagePreview] = useState<string>('');
  const [bulkMode, setBulkMode] = useLocalStorage('product-bulk-mode', false);
  const [sessionCount, setSessionCount] = useState(0);
  
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
    defaultValues: {
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
  
  // Save draft to localStorage
  const saveDraft = (data: Partial<ProductInput>) => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
  };
  
  // Load draft from localStorage
  const loadDraft = () => {
    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft) {
      try {
        const data = JSON.parse(draft);
        Object.entries(data).forEach(([key, value]) => {
          setValue(key as keyof ProductInput, value as any);
        });
        if (data.image) {
          setImagePreview(data.image);
        }
        toast.success('Draft loaded');
      } catch (error) {
        // Silently fail if draft loading fails
      }
    }
  };
  
  // Clear draft from localStorage
  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
  };
  
  // Load draft on mount
  useEffect(() => {
    const draft = localStorage.getItem(DRAFT_KEY);
    if (draft) {
      loadDraft();
    }
  }, []);
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Enter to submit
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSubmit(onSubmit)();
      }
      // Ctrl/Cmd + S to save draft
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveDraft(getValues());
        toast.success('Draft saved 💾');
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleSubmit]);

  const onSubmit = (data: ProductInput) => {
    createProduct.mutate(data, {
      onSuccess: (response) => {
        // Reset all form fields
        reset();
        
        // Clear image preview
        setImagePreview('');
        
        // Clear saved draft
        clearDraft();
        
        // Increment session counter
        setSessionCount(prev => prev + 1);
        
        // Handle navigation based on bulk mode
        if (!bulkMode) {
          // Only trigger navigation if not in bulk mode
          if (onProductCreated && response?._id) {
            onProductCreated(response._id);
          }
          toast.success('Product created successfully!');
        } else {
          // Show different toast for bulk mode
          toast.success('Product created! Form ready for next product.');
        }
      },
      onError: () => {
        toast.error('Failed to create product');
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Bulk Mode Toggle */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Create Product</h2>
        <div className="flex items-center gap-2">
          <Switch
            id="bulk-mode"
            checked={bulkMode}
            onCheckedChange={setBulkMode}
          />
          <Label htmlFor="bulk-mode" className="cursor-pointer">
            Stay on form after creation
          </Label>
        </div>
      </div>
      
      {/* Session Counter */}
      {bulkMode && sessionCount > 0 && (
        <div className="text-sm text-gray-500 -mt-2">
          Products created this session: {sessionCount}
        </div>
      )}
      
      {/* Form Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Form completion</span>
          <span>{Math.round(progress)}%</span>
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
              isNameValid && 'border-green-500 focus-visible:ring-green-500'
            )}
          />
          {isNameValid && (
            <CheckIcon className="absolute right-3 top-8 h-4 w-4 text-green-500" />
          )}
        </div>
      
      <div className="relative">
        <Textarea
          label="Description"
          {...register('description')}
          placeholder="Enter product description..."
          error={errors.description?.message}
          className={cn(
            isDescriptionValid && 'border-green-500 focus-visible:ring-green-500'
          )}
        />
        {isDescriptionValid && (
          <CheckIcon className="absolute right-3 top-8 h-4 w-4 text-green-500" />
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
            isPriceValid && 'border-green-500 focus-visible:ring-green-500'
          )}
        />
        {isPriceValid && (
          <CheckIcon className="absolute right-3 top-8 h-4 w-4 text-green-500" />
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
        <label className="text-sm font-medium text-gray-700">
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
      
      {/* Keyboard shortcuts hint */}
      <p className="text-xs text-gray-500 text-center mt-2">
        Tip: Press Ctrl+Enter (⌘+Enter on Mac) to submit • Ctrl+S (⌘+S on Mac) to save draft
      </p>
    </form>
    </div>
  );
};