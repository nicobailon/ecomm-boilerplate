import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { ProductFormInput, ProductInput } from '@/lib/validations';
import type { FormVariant, VariantSubmission } from '@/types';
import { productSchema } from '@/lib/validations';
import { useProductCreation } from '@/hooks/product/useProductCreation';
import { useCreateProduct, useUpdateProduct } from '@/hooks/migration/use-products-migration';
import { useListCollections, useQuickCreateCollection } from '@/hooks/collections/useCollections';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { CreatableCollectionSelect, CreatableCollectionSelectSkeleton } from '@/components/ui/CreatableCollectionSelect';
import { ProductImageUpload } from '@/components/ui/ProductImageUpload';
import { toast } from 'sonner';
import { useState, useEffect, useCallback } from 'react';
import { Switch } from '@/components/ui/Switch';
import { Label } from '@/components/ui/Label';
import { Progress } from '@/components/ui/Progress';
import { cn } from '@/lib/utils';
import { CheckIcon } from 'lucide-react';
import type { ProductFormProps, Product } from '@/types';
import type { ProductWithVariantTypes, ProductVariantWithAttributes } from '@/types/variant';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { VariantEditor } from './VariantEditor';
import { VariantAttributesEditor } from './VariantAttributesEditor';
import { useFeatureFlag } from '@/hooks/useFeatureFlags';
import { transformFormVariantToSubmission, recalculatePriceAdjustments } from '@/utils/variant-transform';
import { roundToCents } from '@/utils/price-utils';
import { MediaGalleryManager } from '@/components/admin/MediaGalleryManager';
import type { MediaItem } from '@/types/media';

export const ProductForm: React.FC<ProductFormProps> = ({ mode, initialData, onSuccess }) => {
  // Detect if we're inside a modal/drawer by checking for Radix dialog context
  const inModal = mode === 'edit';
  const useVariantAttributes = useFeatureFlag('USE_VARIANT_ATTRIBUTES');
  const useMediaGallery = useFeatureFlag('USE_MEDIA_GALLERY');
  const productCreation = useProductCreation();
  const productCreationData = mode === 'create' ? productCreation : null;
  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();
  const { data: collectionsData, isLoading: isLoadingCollections } = useListCollections({ limit: 100 });
  const { mutateAsync: quickCreateCollection } = useQuickCreateCollection();

  const [imagePreview, setImagePreview] = useState<string>('');  
  const [mediaGallery, setMediaGallery] = useState<MediaItem[]>([]);
  
  const collections = collectionsData?.collections ?? [];
  
  const formMethods = useForm<ProductFormInput>({
    resolver: zodResolver(productSchema),
    defaultValues: mode === 'edit' && initialData ? {
      name: initialData.name,
      description: initialData.description,
      price: initialData.price,
      collectionId: typeof initialData.collectionId === 'string' 
        ? initialData.collectionId 
        : initialData.collectionId?._id,
      image: initialData.image,
      variantTypes: 'variantTypes' in initialData ? (initialData as ProductWithVariantTypes).variantTypes : undefined,
      variants: initialData.variants?.map(v => ({
        variantId: v.variantId,
        label: v.label ?? '',
        color: v.color ?? '',
        priceAdjustment: roundToCents(v.price - initialData.price),
        inventory: v.inventory,
        reservedInventory: v.reservedInventory ?? 0, // NEW: Keep existing reservedInventory value
        images: v.images ?? [], // NEW: Keep existing images
        sku: v.sku ?? '',
        attributes: 'attributes' in v ? (v as ProductVariantWithAttributes).attributes : undefined,
      })),
    } : productCreation?.draftData ?? {
      name: '',
      description: '',
      price: 0,
      collectionId: '',
      image: '',
    },
  });
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    getValues,
    formState: { errors, isSubmitting },
  } = formMethods;
  
  const handleCreateCollection = useCallback(async (name: string) => {
    const newCollection = await quickCreateCollection({ 
      name,
      isPublic: false,
    });
    
    setValue('collectionId', newCollection._id);
    
    return newCollection._id;
  }, [quickCreateCollection, setValue]);

  const watchedImage = watch('image');
  const watchedFields = watch();
  const watchedPrice = watch('price');
  const watchedVariants = watch('variants');
  
  // Track previous price for recalculation
  const [previousPrice, setPreviousPrice] = useState<number>(initialData?.price ?? 0);
  
  // Recalculate price adjustments when base price changes
  useEffect(() => {
    if (watchedPrice && watchedPrice !== previousPrice && watchedVariants && watchedVariants.length > 0) {
      const recalculatedVariants = recalculatePriceAdjustments(
        watchedVariants as (FormVariant & { variantId?: string })[],
        previousPrice,
        watchedPrice,
      );
      setValue('variants', recalculatedVariants);
      setPreviousPrice(watchedPrice);
    }
  }, [watchedPrice, previousPrice, watchedVariants, setValue]);
  
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
    watchedFields.image ?? imagePreview,
  ].filter(Boolean).length;
  const totalFields = 4;
  const progress = (completedFields / totalFields) * 100;
  
  // Load initial data for edit mode or draft for create mode
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      reset({
        name: initialData.name,
        description: initialData.description,
        price: initialData.price,
        collectionId: typeof initialData.collectionId === 'string' 
          ? initialData.collectionId 
          : initialData.collectionId?._id,
        image: initialData.image,
        variants: initialData.variants?.map(v => ({
          variantId: v.variantId,
          label: v.label ?? '',
          color: v.color ?? '',
          priceAdjustment: roundToCents(v.price - initialData.price),
          inventory: v.inventory,
          reservedInventory: v.reservedInventory ?? 0, // NEW: Keep existing reservedInventory value
          images: v.images ?? [], // NEW: Keep existing images
          sku: v.sku ?? '',
          attributes: 'attributes' in v ? (v as ProductVariantWithAttributes).attributes : undefined,
        })),
      });
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
  
  const onSubmit = useCallback((data: ProductFormInput) => {
    // Transform variants with proper variantId and absolute price
    const transformedVariants: VariantSubmission[] | undefined = data.variants?.map(variant => {
      const formVariant = variant as FormVariant & { variantId?: string };
      const submission = transformFormVariantToSubmission(formVariant, data.price);
      
      // Add attributes if feature flag is enabled
      if (useVariantAttributes && variant.attributes) {
        return { ...submission, attributes: variant.attributes };
      }
      
      return submission;
    });

    // Transform data for submission

    // Create properly typed data for the API with required variant fields
    const apiData: ProductInput = {
      name: data.name,
      description: data.description,
      price: data.price,
      image: data.image,
      collectionId: data.collectionId && data.collectionId.trim() !== '' ? data.collectionId : undefined,
      variantTypes: useVariantAttributes ? data.variantTypes : undefined,
      variants: transformedVariants as ProductInput['variants'],
      mediaGallery: mediaGallery || [], // Include mediaGallery field (required by backend schema)
    };
    
    if (mode === 'create') {
      // Use productCreation hook if available - it handles navigation and bulk mode
      if (productCreationData?.createProduct) {
        productCreationData.createProduct(apiData)
          .then(() => {
            reset();
            setImagePreview('');
            setMediaGallery([]);
            // No need to call onSuccess - productCreation handles navigation
          })
          .catch(() => {
            // Error handling is done by productCreation hook
          });
      } else {
        // Fallback to direct mutation if not in admin context
        createProductMutation.mutate(apiData, {
          onSuccess: (result: Product) => {
            let product: Product;
            if ('product' in result && result.product) {
              product = result.product as Product;
              if ('created' in result && result.created && typeof result.created === 'object' && 'collection' in result.created) {
                toast.success('Created product in new collection');
              }
            } else {
              product = result;
            }
            
            reset();
            setImagePreview('');
            setMediaGallery([]);
            onSuccess?.(product);
          },
        });
      }
    } else {
      updateProductMutation.mutate({ id: initialData?._id ?? '', data: apiData }, {
        onSuccess: (updatedProduct: Product) => {
          toast.success('Product updated!');
          onSuccess?.(updatedProduct);
        },
      });
    }
  }, [mode, createProductMutation, updateProductMutation, initialData, reset, onSuccess, productCreationData, useVariantAttributes, mediaGallery]);
  
  // Keyboard shortcuts
  useEffect(() => {
    // Only add listener if form is mounted
    if (!handleSubmit) return;
    
    const handleKeyPress = (e: KeyboardEvent) => {
      // Prevent default browser shortcuts
      if ((e.ctrlKey || e.metaKey) && (e.key === 'Enter' || e.key === 's')) {
        e.preventDefault();
        
        if (e.key === 'Enter') {
          void handleSubmit(onSubmit)();
        } else if (e.key === 's' && mode === 'create' && productCreationData) {
          productCreationData.saveDraft(getValues());
        }
      }
    };
    
    // Use capture phase to ensure we get the event first
    window.addEventListener('keydown', handleKeyPress, { capture: true });
    
    // Cleanup function
    return () => {
      window.removeEventListener('keydown', handleKeyPress, { capture: true });
    };
  }, [handleSubmit, mode, productCreationData, getValues, onSubmit]);

  return (
    <FormProvider {...formMethods}>
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
      
      <form onSubmit={(...args) => void handleSubmit(onSubmit)(...args)} className="space-y-6">
        <div className="relative">
          <Input
            label="Product Name"
            type="text"
            {...register('name')}
            error={errors.name?.message}
            className={cn(
              isNameValid && 'border-success focus-visible:ring-success',
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
            isDescriptionValid && 'border-success focus-visible:ring-success',
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
            isPriceValid && 'border-success focus-visible:ring-success',
          )}
        />
        {isPriceValid && (
          <CheckIcon className="absolute right-3 top-8 h-4 w-4 text-success" />
        )}
      </div>
      
      {isLoadingCollections ? (
        <CreatableCollectionSelectSkeleton />
      ) : (
        <ErrorBoundary
          fallback={(_error, reset) => (
            <div className="text-sm text-destructive">
              Failed to load collections. 
              <button onClick={reset} className="underline ml-1">
                Try again
              </button>
            </div>
          )}
        >
          <CreatableCollectionSelect
            value={watch('collectionId')}
            onChange={(value) => setValue('collectionId', value)}
            onCreateCollection={handleCreateCollection}
            collections={collections.map(c => ({ 
              _id: c._id as string, 
              name: c.name, 
              slug: c.slug, 
            }))}
            isLoading={isLoadingCollections}
            label="Collection (Optional)"
            placeholder="Select collection..."
            error={errors.collectionId?.message}
            disabled={isSubmitting}
            inModal={inModal}
          />
        </ErrorBoundary>
      )}
      
      <div className="space-y-1">
        <label className="text-sm font-medium text-foreground">
          Product Image
        </label>
        <ProductImageUpload
          value={watchedImage ?? imagePreview}
          onChange={(url) => {
            setValue('image', url ?? '', { shouldValidate: true });
            setImagePreview(url ?? '');
            if (url) {
              toast.success('Image uploaded successfully!');
            }
          }}
          onImagePreviewChange={setImagePreview}
          disabled={isSubmitting}
        />
        {errors.image && (
          <p className="text-sm text-destructive">{errors.image.message}</p>
        )}
      </div>
      
      {/* Media Gallery */}
      {useMediaGallery && (
        <div className="space-y-2">
          <MediaGalleryManager
            productId={mode === 'edit' ? initialData?._id : undefined}
            initialMedia={mediaGallery}
            onChange={setMediaGallery}
          />
        </div>
      )}
      
      {/* Variant Editor */}
      {useVariantAttributes ? (
        <VariantAttributesEditor isLoading={isSubmitting || (mode === 'create' ? createProductMutation.isPending : updateProductMutation.isPending)} />
      ) : (
        <VariantEditor isLoading={isSubmitting || (mode === 'create' ? createProductMutation.isPending : updateProductMutation.isPending)} />
      )}
      
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
    </FormProvider>
  );
};