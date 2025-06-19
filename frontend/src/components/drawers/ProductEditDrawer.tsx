import type { ProductEditDrawerProps } from '@/types';
import { Drawer } from '@/components/ui/Drawer';
import { ProductForm } from '@/components/forms/ProductForm';

export const ProductEditDrawer = ({ isOpen, product, onClose }: ProductEditDrawerProps) => {
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
      <div className="mt-6">
        <ProductForm
          mode="edit"
          initialData={product}
          onSuccess={() => {
            onClose();
          }}
        />
      </div>
    </Drawer>
  );
};