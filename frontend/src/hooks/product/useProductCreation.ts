import { useState, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useCreateProduct } from './useProducts';
import type { ProductInput, ProductFormInput } from '@/lib/validations';
import { productEvents } from '@/lib/events';
import { useLocalStorage } from '@/hooks/utils/useLocalStorage';
import type { TabId, Product } from '@/types';
import { NAVIGATION_DELAY } from '@/types';

interface UseProductCreationState {
  isCreating: boolean;
  isNavigating: boolean;
  newProductId: string | null;
  sessionCount: number;
  bulkMode: boolean;
  targetTab: TabId | null;
  draftData: Partial<ProductFormInput> | null;
}

interface UseProductCreationOptions {
  onNavigate?: (tab: TabId) => void;
  navigationDelay?: number;
  enableDraft?: boolean;
  enableBulkMode?: boolean;
}

const DRAFT_KEY = 'product-creation-draft';

export function useProductCreation(options: UseProductCreationOptions = {}) {
  const {
    onNavigate,
    navigationDelay = NAVIGATION_DELAY,
    enableDraft = true,
    enableBulkMode = true,
  } = options;

  const queryClient = useQueryClient();
  const createProductMutation = useCreateProduct();
  
  // State management
  const [isNavigating, setIsNavigating] = useState(false);
  const [newProductId, setNewProductId] = useState<string | null>(null);
  const [sessionCount, setSessionCount] = useState(0);
  const [targetTab, setTargetTab] = useState<TabId | null>(null);
  const [bulkMode, setBulkMode] = useLocalStorage('product-bulk-mode', false);
  
  // Draft management
  const [draftData, setDraftData] = useState<Partial<ProductFormInput> | null>(() => {
    if (!enableDraft) return null;
    
    try {
      const draft = localStorage.getItem(DRAFT_KEY);
      return draft ? (JSON.parse(draft) as Partial<ProductFormInput>) : null;
    } catch {
      return null;
    }
  });

  // Save draft to localStorage
  const saveDraft = useCallback((data: Partial<ProductFormInput>) => {
    if (!enableDraft) return;
    
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
      setDraftData(data);
      toast.success('Draft saved 💾');
    } catch {
      // Handle error silently - localStorage may be unavailable
    }
  }, [enableDraft]);

  // Clear draft
  const clearDraft = useCallback(() => {
    localStorage.removeItem(DRAFT_KEY);
    setDraftData(null);
  }, []);

  // Load draft
  const loadDraft = useCallback(() => {
    if (!enableDraft) return null;
    
    try {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) {
        const data = JSON.parse(draft) as Partial<ProductFormInput>;
        setDraftData(data);
        toast.success('Draft loaded');
        return data;
      }
    } catch {
      // Handle error silently - localStorage may be unavailable
    }
    return null;
  }, [enableDraft]);

  // Handle navigation after product creation
  const navigateToProducts = useCallback((productId: string) => {
    setNewProductId(productId);
    setIsNavigating(true);
    setTargetTab('products');
    
    // Emit event for extensibility
    productEvents.emit('product:created', { 
      productId, 
      timestamp: Date.now(), 
    });
    
    // Show navigation feedback
    toast('Redirecting to products list...', {
      duration: navigationDelay,
      icon: '🔄',
    });
    
    // Delayed navigation
    setTimeout(() => {
      onNavigate?.('products');
      setIsNavigating(false);
      setTargetTab(null);
    }, navigationDelay);
  }, [navigationDelay, onNavigate]);

  // Create product handler
  const createProduct = useCallback(async (data: ProductFormInput | ProductInput) => {
    return new Promise<string>((resolve, reject) => {
      // Ensure all required fields are present for ProductInput
      const productData: ProductInput = {
        name: data.name,
        description: data.description,
        price: data.price,
        image: data.image,
        collectionId: data.collectionId,
        variants: data.variants?.map(v => ({
          label: v.label,
          color: v.color,
          priceAdjustment: 'priceAdjustment' in v && typeof v.priceAdjustment === 'number' ? v.priceAdjustment : 0,
          inventory: 'inventory' in v && typeof v.inventory === 'number' ? v.inventory : 0,
          sku: v.sku,
        })),
      };
      
      createProductMutation.mutate(productData, {
        onSuccess: (response: Product) => {
          // Clear draft on successful creation
          if (enableDraft) {
            clearDraft();
          }
          
          // Increment session counter
          setSessionCount(prev => prev + 1);
          
          // Handle navigation based on bulk mode
          if (!bulkMode && enableBulkMode) {
            navigateToProducts(response._id);
            toast.success('Product created successfully!');
          } else {
            toast.success('Product created! Form ready for next product.');
          }
          
          resolve(response._id);
        },
        onError: (error: Error) => {
          toast.error('Failed to create product');
          reject(error);
        },
      });
    });
  }, [
    createProductMutation,
    bulkMode,
    enableBulkMode,
    enableDraft,
    clearDraft,
    navigateToProducts,
  ]);

  // Reset creation state
  const resetCreationState = useCallback(() => {
    setNewProductId(null);
    setIsNavigating(false);
    setTargetTab(null);
  }, []);

  // Handle bulk mode toggle
  const toggleBulkMode = useCallback((enabled?: boolean) => {
    if (!enableBulkMode) return;
    
    setBulkMode((prev: boolean) => enabled ?? !prev);
  }, [enableBulkMode, setBulkMode]);

  // Clear highlighted product
  const clearHighlight = useCallback(() => {
    setNewProductId(null);
  }, []);

  // Listen for external product creation events
  useEffect(() => {
    const handleExternalCreation = () => {
      // If this creation didn't come from this hook, we might still want to react
      // This allows for multiple product creation sources to work together
      void queryClient.invalidateQueries({ queryKey: ['products'] });
    };

    productEvents.on('product:created', handleExternalCreation);
    
    return () => {
      productEvents.off('product:created', handleExternalCreation);
    };
  }, [queryClient]);

  const state: UseProductCreationState = {
    isCreating: createProductMutation.isPending,
    isNavigating,
    newProductId,
    sessionCount,
    bulkMode: enableBulkMode ? bulkMode : false,
    targetTab,
    draftData,
  };

  return {
    // State
    ...state,
    
    // Actions
    createProduct,
    saveDraft,
    loadDraft,
    clearDraft,
    toggleBulkMode,
    clearHighlight,
    resetCreationState,
    
    // Utilities
    canNavigate: !isNavigating,
    shouldHighlight: !!newProductId,
  };
}