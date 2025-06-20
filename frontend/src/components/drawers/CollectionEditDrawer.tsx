import { useState, useEffect } from 'react';
import { type RouterOutputs } from '@/lib/trpc';
import { Drawer } from '@/components/ui/Drawer';
import { CollectionForm } from '@/components/forms/CollectionForm';
import { ProductSelector } from '@/components/product/ProductSelector';
import { Button } from '@/components/ui/Button';
import { 
  useCreateCollection, 
  useUpdateCollection, 
  useSetProductsForCollection,
} from '@/hooks/collections/useCollections';

type Collection = RouterOutputs['collection']['getById'];

interface CollectionEditDrawerProps {
  isOpen: boolean;
  collection: Collection | null;
  onClose: () => void;
}

export const CollectionEditDrawer = ({ isOpen, collection, onClose }: CollectionEditDrawerProps) => {
  const [step, setStep] = useState<'details' | 'products'>('details');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [formData, setFormData] = useState<{name: string; description?: string; isPublic: boolean} | null>(null);
  
  const createCollection = useCreateCollection();
  const updateCollection = useUpdateCollection();
  const setProducts = useSetProductsForCollection();

  const isEditMode = !!collection;

  useEffect(() => {
    if (collection?.products) {
      // Extract product IDs from the collection, handling both string IDs and populated objects
      const productIds = collection.products.map((p) => {
        if (typeof p === 'string') {
          return p;
        } else if (p && typeof p === 'object' && '_id' in p) {
          // Handle populated product objects
          return String(p._id);
        }
        return '';
      }).filter(Boolean);
      
      setSelectedProductIds(productIds);
    } else {
      setSelectedProductIds([]);
    }
    setStep('details');
    setFormData(null);
  }, [collection, isOpen]);

  const handleDetailsSubmit = (data: {name: string; description?: string; isPublic: boolean}) => {
    if (isEditMode) {
      // In edit mode, update the collection immediately
      updateCollection.mutate(
        { id: collection._id as string, data },
        {
          onSuccess: () => {
            onClose();
          },
        },
      );
    } else {
      // In create mode, store the data and move to product selection
      setFormData(data);
      setStep('products');
    }
  };

  const handleProductsSubmit = () => {
    if (!isEditMode && formData) {
      // Create collection with selected products
      createCollection.mutate(
        { ...formData, products: selectedProductIds },
        {
          onSuccess: () => {
            onClose();
          },
          onError: (_error) => {
            // Error is already handled by mutation hook
          },
        },
      );
    } else if (isEditMode && collection) {
      // Use the new setProducts mutation to update all products at once
      const collectionId = String(collection._id);
      
      setProducts.mutate(
        {
          collectionId,
          productIds: selectedProductIds,
        },
        {
          onSuccess: (_data) => {
            onClose();
          },
          onError: (_error) => {
            // Error is already handled by mutation hook
          },
        },
      );
    }
  };

  const isLoading = createCollection.isPending || 
    updateCollection.isPending || 
    setProducts.isPending;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? `Edit Collection: ${collection.name}` : 'Create New Collection'}
      description={
        step === 'details' 
          ? 'Set up your collection details' 
          : 'Select products to include in this collection'
      }
      className="sm:max-w-2xl"
    >
      <div className="mt-6">
        {step === 'details' ? (
          <>
            <CollectionForm
              mode={isEditMode ? 'edit' : 'create'}
              initialData={collection ?? undefined}
              onSubmit={handleDetailsSubmit}
              isLoading={isLoading}
            />
            {isEditMode && (
              <div className="mt-4">
                <Button
                  variant="outline"
                  onClick={() => void setStep('products')}
                  className="w-full"
                  disabled={isLoading}
                >
                  Manage Products ({collection.products?.length ?? 0})
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-4">
            <ProductSelector
              selectedProductIds={selectedProductIds}
              onSelectionChange={setSelectedProductIds}
              showApplyButton={false}
            />
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => void setStep('details')}
                disabled={isLoading}
              >
                Back
              </Button>
              <Button
                onClick={() => void handleProductsSubmit()}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? 'Saving...' : isEditMode ? 'Update Products' : 'Create Collection'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Drawer>
  );
};