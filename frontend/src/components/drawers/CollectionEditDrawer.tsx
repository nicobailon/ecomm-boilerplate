import { useState, useEffect } from 'react';
import { type RouterOutputs } from '@/lib/trpc';
import { Drawer } from '@/components/ui/Drawer';
import { CollectionForm } from '@/components/forms/CollectionForm';
import { ProductSelector } from '@/components/product/ProductSelector';
import { Button } from '@/components/ui/Button';
import { 
  useCreateCollection, 
  useUpdateCollection, 
  useSetProductsForCollection
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
    if (collection && collection.products) {
      // Extract product IDs from the collection, handling both string IDs and populated objects
      const productIds = collection.products.map((p) => {
        if (typeof p === 'string') {
          return p;
        } else if (p && typeof p === 'object' && '_id' in p) {
          // Handle populated product objects
          return String(p._id);
        }
        console.warn('Unexpected product format:', p);
        return '';
      }).filter(Boolean) as string[];
      
      console.log('Initialized selectedProductIds:', productIds);
      setSelectedProductIds(productIds);
    } else {
      setSelectedProductIds([]);
    }
    setStep('details');
    setFormData(null);
  }, [collection, isOpen]);

  const handleDetailsSubmit = async (data: {name: string; description?: string; isPublic: boolean}) => {
    if (isEditMode) {
      // In edit mode, update the collection immediately
      updateCollection.mutate(
        { id: collection._id as string, data },
        {
          onSuccess: () => {
            onClose();
          },
        }
      );
    } else {
      // In create mode, store the data and move to product selection
      setFormData(data);
      setStep('products');
    }
  };

  const handleProductsSubmit = async () => {
    console.log('handleProductsSubmit called with selectedProductIds:', selectedProductIds);
    
    if (!isEditMode && formData) {
      // Create collection with selected products
      console.log('Creating collection with products:', selectedProductIds);
      createCollection.mutate(
        { ...formData, products: selectedProductIds },
        {
          onSuccess: () => {
            console.log('Collection created successfully');
            onClose();
          },
          onError: (error) => {
            console.error('Failed to create collection:', error);
          },
        }
      );
    } else if (isEditMode && collection) {
      // Use the new setProducts mutation to update all products at once
      const collectionId = String(collection._id);
      console.log('Updating collection products:', {
        collectionId,
        productIds: selectedProductIds,
        productCount: selectedProductIds.length
      });
      
      setProducts.mutate(
        {
          collectionId,
          productIds: selectedProductIds,
        },
        {
          onSuccess: (data) => {
            console.log('Products updated successfully:', data);
            onClose();
          },
          onError: (error) => {
            console.error('Failed to update products:', error);
          },
        }
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
              initialData={collection || undefined}
              onSubmit={handleDetailsSubmit}
              isLoading={isLoading}
            />
            {isEditMode && (
              <div className="mt-4">
                <Button
                  variant="outline"
                  onClick={() => setStep('products')}
                  className="w-full"
                  disabled={isLoading}
                >
                  Manage Products ({collection.products.length})
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
                onClick={() => setStep('details')}
                disabled={isLoading}
              >
                Back
              </Button>
              <Button
                onClick={handleProductsSubmit}
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