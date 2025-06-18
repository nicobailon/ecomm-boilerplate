import { useState, useCallback } from 'react';
import { Product } from '@/types';

interface UseProductEditorReturn {
  selectedProduct: Product | null;
  isEditDrawerOpen: boolean;
  openEditor: (product: Product) => void;
  closeEditor: () => void;
}

export function useProductEditor(): UseProductEditorReturn {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);

  const openEditor = useCallback((product: Product) => {
    setSelectedProduct(product);
    setIsEditDrawerOpen(true);
  }, []);

  const closeEditor = useCallback(() => {
    setIsEditDrawerOpen(false);
    // Delay clearing the product to prevent UI jank during closing animation
    setTimeout(() => {
      setSelectedProduct(null);
    }, 300);
  }, []);

  return {
    selectedProduct,
    isEditDrawerOpen,
    openEditor,
    closeEditor,
  };
}