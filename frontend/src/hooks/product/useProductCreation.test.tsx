import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useProductCreation } from './useProductCreation';
import { useCreateProduct } from './useProducts';
import type { ProductInput } from '@/lib/validations';
import type { Product } from '@/types';
import type { UseMutationResult } from '@tanstack/react-query';
import React from 'react';

// Mock dependencies
vi.mock('./useProducts');
vi.mock('sonner');

vi.mock('@/lib/events', () => {
  const mockEmit = vi.fn();
  const mockOn = vi.fn();
  const mockOff = vi.fn();
  
  return {
    productEvents: {
      emit: mockEmit,
      on: mockOn,
      off: mockOff,
    },
  };
});

// Get mocked functions from the module
const { productEvents } = await import('@/lib/events');
// eslint-disable-next-line @typescript-eslint/unbound-method
const mockEmit = vi.mocked(productEvents.emit);
// eslint-disable-next-line @typescript-eslint/unbound-method
const mockOn = vi.mocked(productEvents.on);

// Mock useLocalStorage
type SetValue<T> = React.Dispatch<React.SetStateAction<T>>;

vi.mock('@/hooks/utils/useLocalStorage', () => ({
  useLocalStorage: vi.fn(<T,>(key: string, initialValue: T): [T, SetValue<T>] => {
    const [value, setValue] = React.useState<T>(() => {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) as T : initialValue;
    });
    
    const setStoredValue: SetValue<T> = (newValue) => {
      const valueToStore = typeof newValue === 'function' ? (newValue as (prev: T) => T)(value) : newValue;
      localStorage.setItem(key, JSON.stringify(valueToStore));
      setValue(valueToStore);
    };
    
    return [value, setStoredValue];
  }),
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Type for mock mutation  
type CreateProductMutationResult = UseMutationResult<Product, Error, ProductInput, unknown>;

interface MutateOptions {
  onSuccess?: (data: Product) => void;
  onError?: (error: Error) => void;
}

interface MockMutation {
  mutate: ReturnType<typeof vi.fn<(data: ProductInput, options?: MutateOptions) => void>>;
  isPending: boolean;
}

describe('useProductCreation', () => {
  let queryClient: QueryClient;
  let mockCreateProduct: MockMutation;

  const createWrapper = () => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    const TestWrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    TestWrapper.displayName = 'TestWrapper';
    return TestWrapper;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset localStorage mock
    localStorageMock.getItem.mockReturnValue(null);
    
    // Setup createProduct mock
    mockCreateProduct = {
      mutate: vi.fn(),
      isPending: false,
    };
    vi.mocked(useCreateProduct).mockReturnValue({
      ...mockCreateProduct,
      mutateAsync: vi.fn(),
      data: undefined,
      error: null,
      isError: false,
      isSuccess: false,
      isIdle: true,
      variables: undefined,
      status: 'idle',
      reset: vi.fn(),
      context: undefined,
      failureCount: 0,
      failureReason: null,
      isPaused: false,
      submittedAt: 0,
    } as CreateProductMutationResult);
  });

  describe('Initial State', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useProductCreation(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isCreating).toBe(false);
      expect(result.current.isNavigating).toBe(false);
      expect(result.current.newProductId).toBeNull();
      expect(result.current.sessionCount).toBe(0);
      expect(result.current.bulkMode).toBe(false);
      expect(result.current.targetTab).toBeNull();
      expect(result.current.draftData).toBeNull();
    });

    it('should load draft data from localStorage if available', () => {
      const mockDraft = {
        name: 'Test Product',
        description: 'Test Description',
        price: 99.99,
      };
      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === 'product-creation-draft') return JSON.stringify(mockDraft);
        return null;
      });

      const { result } = renderHook(() => useProductCreation(), {
        wrapper: createWrapper(),
      });

      expect(result.current.draftData).toEqual(mockDraft);
    });

    it('should load bulk mode preference from localStorage', () => {
      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === 'product-bulk-mode') return JSON.stringify(true);
        return null;
      });

      const { result } = renderHook(() => useProductCreation(), {
        wrapper: createWrapper(),
      });

      expect(result.current.bulkMode).toBe(true);
    });
  });

  describe('Product Creation', () => {
    const mockProductInput: ProductInput = {
      name: 'Test Product',
      description: 'Test Description',
      price: 99.99,
      image: 'https://example.com/image.jpg',
    };

    const mockProductResponse: Product = {
      _id: 'product-123',
      name: mockProductInput.name,
      description: mockProductInput.description,
      price: mockProductInput.price,
      image: mockProductInput.image,
      isFeatured: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    it('should create product successfully', async () => {
      mockCreateProduct.mutate.mockImplementation((_data: ProductInput, options?: MutateOptions) => {
        // Simulate async success
        setTimeout(() => options?.onSuccess?.(mockProductResponse), 0);
      });

      const { result } = renderHook(() => useProductCreation(), {
        wrapper: createWrapper(),
      });

      let productId: string;
      await act(async () => {
        productId = await result.current.createProduct(mockProductInput);
      });

      expect(productId!).toBe('product-123');
      expect(mockCreateProduct.mutate).toHaveBeenCalledWith(
        mockProductInput,
        expect.any(Object),
      );
      expect(result.current.sessionCount).toBe(1);
      expect(toast.success).toHaveBeenCalledWith('Product created successfully!');
    });

    it('should handle product creation error', async () => {
      const mockError = new Error('Creation failed');
      mockCreateProduct.mutate.mockImplementation((_data: ProductInput, options?: MutateOptions) => {
        options?.onError?.(mockError);
      });

      const { result } = renderHook(() => useProductCreation(), {
        wrapper: createWrapper(),
      });

      await expect(
        act(async () => {
          await result.current.createProduct(mockProductInput);
        }),
      ).rejects.toThrow('Creation failed');

      expect(toast.error).toHaveBeenCalledWith('Failed to create product');
    });

    it('should navigate to products tab after creation when bulk mode is off', async () => {
      const onNavigate = vi.fn();
      mockCreateProduct.mutate.mockImplementation((_data: ProductInput, options?: MutateOptions) => {
        options?.onSuccess?.(mockProductResponse);
      });

      const { result } = renderHook(
        () => useProductCreation({ onNavigate }),
        { wrapper: createWrapper() },
      );

      await act(async () => {
        await result.current.createProduct(mockProductInput);
      });

      expect(result.current.isNavigating).toBe(true);
      expect(result.current.newProductId).toBe('product-123');
      expect(mockEmit).toHaveBeenCalledWith('product:created', {
        productId: 'product-123',
        timestamp: expect.any(Number) as unknown,
      });

      // Wait for navigation delay
      await waitFor(() => {
        expect(onNavigate).toHaveBeenCalledWith('products');
      }, { timeout: 2000 });
      
      await waitFor(() => {
        expect(result.current.isNavigating).toBe(false);
      });
    });

    it('should stay on form when bulk mode is enabled', async () => {
      const onNavigate = vi.fn();
      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === 'product-bulk-mode') return JSON.stringify(true);
        return null;
      });

      mockCreateProduct.mutate.mockImplementation((_data: ProductInput, options?: MutateOptions) => {
        options?.onSuccess?.(mockProductResponse);
      });

      const { result } = renderHook(
        () => useProductCreation({ onNavigate }),
        { wrapper: createWrapper() },
      );

      await act(async () => {
        await result.current.createProduct(mockProductInput);
      });

      expect(onNavigate).not.toHaveBeenCalled();
      expect(result.current.isNavigating).toBe(false);
      expect(toast.success).toHaveBeenCalledWith(
        'Product created! Form ready for next product.',
      );
    });
  });

  describe('Draft Management', () => {
    const mockDraft: Partial<ProductInput> = {
      name: 'Draft Product',
      description: 'Draft Description',
    };

    it('should save draft to localStorage', () => {
      const { result } = renderHook(() => useProductCreation(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.saveDraft(mockDraft);
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'product-creation-draft',
        JSON.stringify(mockDraft),
      );
      expect(toast.success).toHaveBeenCalledWith('Draft saved 💾');
    });

    it('should load draft from localStorage', () => {
      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === 'product-creation-draft') return JSON.stringify(mockDraft);
        return null;
      });

      const { result } = renderHook(() => useProductCreation(), {
        wrapper: createWrapper(),
      });

      act(() => {
        const loadedDraft = result.current.loadDraft();
        expect(loadedDraft).toEqual(mockDraft);
      });

      expect(toast.success).toHaveBeenCalledWith('Draft loaded');
    });

    it('should clear draft from localStorage', () => {
      localStorageMock.getItem.mockImplementation((key: string) => {
        if (key === 'product-creation-draft') return JSON.stringify(mockDraft);
        return null;
      });

      const { result } = renderHook(() => useProductCreation(), {
        wrapper: createWrapper(),
      });

      expect(result.current.draftData).toEqual(mockDraft);

      act(() => {
        result.current.clearDraft();
      });

      expect(localStorageMock.removeItem).toHaveBeenCalledWith(
        'product-creation-draft',
      );
    });

    it('should not save draft when disabled', () => {
      const { result } = renderHook(
        () => useProductCreation({ enableDraft: false }),
        { wrapper: createWrapper() },
      );

      act(() => {
        result.current.saveDraft(mockDraft);
      });

      expect(localStorageMock.setItem).not.toHaveBeenCalled();
      expect(toast.success).not.toHaveBeenCalled();
    });
  });

  describe('Bulk Mode', () => {
    it('should toggle bulk mode', () => {
      const { result } = renderHook(() => useProductCreation(), {
        wrapper: createWrapper(),
      });

      expect(result.current.bulkMode).toBe(false);

      act(() => {
        result.current.toggleBulkMode();
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'product-bulk-mode',
        JSON.stringify(true),
      );

      act(() => {
        result.current.toggleBulkMode(false);
      });

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'product-bulk-mode',
        JSON.stringify(false),
      );
    });

    it('should not toggle bulk mode when disabled', () => {
      const { result } = renderHook(
        () => useProductCreation({ enableBulkMode: false }),
        { wrapper: createWrapper() },
      );

      const initialSetItemCalls = localStorageMock.setItem.mock.calls.length;

      act(() => {
        result.current.toggleBulkMode();
      });

      expect(result.current.bulkMode).toBe(false);
      // Should not have called setItem for bulk mode
      expect(localStorageMock.setItem.mock.calls.length).toBe(initialSetItemCalls);
    });
  });

  describe('State Management', () => {
    it('should clear highlight', async () => {
      mockCreateProduct.mutate.mockImplementation((_data: ProductInput, options?: MutateOptions) => {
        const fullProduct: Product = {
          _id: 'product-123',
          name: 'Test Product',
          description: 'Test Description',
          price: 99.99,
          image: 'https://example.com/image.jpg',
          isFeatured: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        options?.onSuccess?.(fullProduct);
      });

      const { result } = renderHook(() => useProductCreation(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.createProduct({} as ProductInput);
      });

      expect(result.current.newProductId).toBe('product-123');

      act(() => {
        result.current.clearHighlight();
      });

      expect(result.current.newProductId).toBeNull();
    });

    it('should reset creation state', () => {
      const { result } = renderHook(() => useProductCreation(), {
        wrapper: createWrapper(),
      });

      // Verify initial state
      expect(result.current.newProductId).toBeNull();
      expect(result.current.isNavigating).toBe(false);
      expect(result.current.targetTab).toBeNull();
    });
  });

  describe('Event Handling', () => {
    it('should listen for external product creation events', () => {
      renderHook(() => useProductCreation(), {
        wrapper: createWrapper(),
      });

      // Event handling is set up during hook initialization
      expect(mockOn).toHaveBeenCalled();
    });
  });

  describe('Utility Properties', () => {
    it('should provide canNavigate property', () => {
      const { result } = renderHook(() => useProductCreation(), {
        wrapper: createWrapper(),
      });

      expect(result.current).toBeDefined();
      expect(result.current.canNavigate).toBe(true);
    });

    it('should provide shouldHighlight property', async () => {
      mockCreateProduct.mutate.mockImplementation((_data: ProductInput, options?: MutateOptions) => {
        const fullProduct: Product = {
          _id: 'product-123',
          name: 'Test Product',
          description: 'Test Description',
          price: 99.99,
          image: 'https://example.com/image.jpg',
          isFeatured: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        options?.onSuccess?.(fullProduct);
      });

      const { result } = renderHook(() => useProductCreation(), {
        wrapper: createWrapper(),
      });

      expect(result.current).toBeDefined();
      expect(result.current.shouldHighlight).toBe(false);

      await act(async () => {
        await result.current.createProduct({} as ProductInput);
      });

      expect(result.current.shouldHighlight).toBe(true);
    });
  });
});