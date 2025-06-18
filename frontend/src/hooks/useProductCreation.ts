import { useState, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useCreateProduct } from './queries/useProducts';
import { ProductInput } from '@/lib/validations';
import { productEvents } from '@/lib/events';
import { useLocalStorage } from './useLocalStorage';
import { TabId, NAVIGATION_DELAY } from '@/types';

interface UseProductCreationState {
  isCreating: boolean;
  isNavigating: boolean;
  newProductId: string | null;
  sessionCount: number;
  bulkMode: boolean;
  targetTab: TabId | null;
  draftData: Partial<ProductInput> | null;
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
  const [draftData, setDraftData] = useState<Partial<ProductInput> | null>(() => {
    if (!enableDraft) return null;
    
    try {
      const draft = localStorage.getItem(DRAFT_KEY);
      return draft ? JSON.parse(draft) : null;
    } catch {
      return null;
    }
  });

  // Save draft to localStorage
  const saveDraft = useCallback((data: Partial<ProductInput>) => {
    if (!enableDraft) return;
    
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
      setDraftData(data);
      toast.success('Draft saved 💾');
    } catch (error) {
      console.error('Failed to save draft:', error);
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
        const data = JSON.parse(draft);
        setDraftData(data);
        toast.success('Draft loaded');
        return data;
      }
    } catch (error) {
      console.error('Failed to load draft:', error);
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
      timestamp: Date.now() 
    });
    
    // Show navigation feedback
    toast('Redirecting to products list...', {
      duration: navigationDelay,
      icon: '🔄'
    });
    
    // Delayed navigation
    setTimeout(() => {
      onNavigate?.('products');
      setIsNavigating(false);
      setTargetTab(null);
    }, navigationDelay);
  }, [navigationDelay, onNavigate]);

  // Create product handler
  const createProduct = useCallback(async (data: ProductInput) => {
    return new Promise<string>((resolve, reject) => {
      createProductMutation.mutate(data, {
        onSuccess: (response) => {
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
        onError: (error) => {
          toast.error('Failed to create product');
          reject(error);
        }
      });
    });
  }, [
    createProductMutation,
    bulkMode,
    enableBulkMode,
    enableDraft,
    clearDraft,
    navigateToProducts
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
    
    setBulkMode(prev => enabled !== undefined ? enabled : !prev);
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
      queryClient.invalidateQueries({ queryKey: ['products'] });
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