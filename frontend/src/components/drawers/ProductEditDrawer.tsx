import React from 'react';
import type { ProductEditDrawerProps, Product } from '@/types';
import { Drawer } from '@/components/ui/Drawer';
import { ProductForm } from '@/components/forms/ProductForm';
import { useProductById } from '@/hooks/migration/use-products-migration';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export const ProductEditDrawer = ({ isOpen, product, onClose }: ProductEditDrawerProps) => {
  // Fetch full product data with variants when drawer is open
  const { data: fullProduct, isLoading, refetch } = useProductById(product?._id ?? '');

  // Refetch data when drawer opens to ensure we have the latest data
  React.useEffect(() => {
    if (isOpen && product?._id) {
      void refetch();
    }
  }, [isOpen, product?._id, refetch]);

  if (!product) {
    return null;
  }

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Product: ${product.name}`}
      description="Update product details and save changes"
      className="sm:max-w-2xl"
    >
      <div className="mt-6 overflow-y-auto max-h-[calc(100vh-180px)] pr-1">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : (
          <ProductForm
            mode="edit"
            initialData={(fullProduct as Product) ?? product}
            onSuccess={() => {
              onClose();
            }}
          />
        )}
      </div>
    </Drawer>
  );
};
