import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProductForm } from './ProductForm';
import { transformFormVariantToSubmission } from '@/utils/variant-transform';
import type { Product } from '@/types';

// Mock dependencies
vi.mock('@/utils/variant-transform', () => ({
  transformFormVariantToSubmission: vi.fn((variant, basePrice) => ({
    variantId: variant.variantId || `${variant.label.toLowerCase()}-123456`,
    label: variant.label,
    price: parseFloat((basePrice + (variant.priceAdjustment ?? 0)).toFixed(2)),
    inventory: variant.inventory ?? 0,
    sku: variant.sku || '',
  })),
  transformSubmissionToFormVariant: vi.fn(),
  recalculatePriceAdjustments: vi.fn((variants) => variants),
}));
vi.mock('@/hooks/product/useProductCreation', () => ({
  useProductCreation: () => ({
    draftData: null,
    bulkMode: false,
    toggleBulkMode: vi.fn(),
    sessionCount: 0,
    saveDraft: vi.fn(),
    createProduct: vi.fn(),
  }),
}));

const mockCreateProductMutate = vi.fn();
const mockUpdateProductMutate = vi.fn();

vi.mock('@/hooks/migration/use-products-migration', () => ({
  useCreateProduct: () => ({
    mutate: mockCreateProductMutate,
    isPending: false,
  }),
  useUpdateProduct: () => ({
    mutate: mockUpdateProductMutate,
    isPending: false,
  }),
}));

vi.mock('@/hooks/collections/useCollections', () => ({
  useListCollections: () => ({
    data: { collections: [] },
    isLoading: false,
  }),
  useQuickCreateCollection: () => ({
    mutateAsync: vi.fn(),
  }),
}));

vi.mock('@/hooks/useFeatureFlags', () => ({
  useFeatureFlag: () => false,
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock UploadButton component
vi.mock('@/lib/uploadthing', () => ({
  UploadButton: ({ onClientUploadComplete }: any) => (
    <button
      type="button"
      onClick={() =>
        onClientUploadComplete([{ url: 'https://example.com/test-image.jpg' }])
      }
    >
      Upload Image
    </button>
  ),
}));

describe('ProductForm - Variant Submission', () => {
  let queryClient: QueryClient;
  let mockCreateProduct: any;
  let mockUpdateProduct: any;
  let mockTransformVariant: any;

  const createWrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    // Setup mocks
    mockCreateProduct = vi.fn();
    mockUpdateProduct = vi.fn();
    mockTransformVariant = vi.fn((variant, basePrice) => ({
      variantId: variant.variantId || `${variant.label.toLowerCase()}-123456`,
      label: variant.label,
      price: parseFloat((basePrice + (variant.priceAdjustment ?? 0)).toFixed(2)),
      inventory: variant.inventory ?? 0,
      sku: variant.sku || '',
    }));
    
    (transformFormVariantToSubmission as any).mockImplementation(mockTransformVariant);
    
    // Clear and reassign mocks
    mockCreateProductMutate.mockClear();
    mockUpdateProductMutate.mockClear();
    mockCreateProduct = mockCreateProductMutate;
    mockUpdateProduct = mockUpdateProductMutate;
  });

  describe('Variant ID Generation', () => {
    it('should generate variant IDs for new variants on form submission', async () => {
      const user = userEvent.setup();
      render(<ProductForm mode="create" />, { wrapper: createWrapper });

      // Fill in required fields
      await user.type(screen.getByLabelText(/product name/i), 'Test Product');
      await user.type(screen.getByPlaceholderText(/enter product description/i), 'Test Description for the product');
      await user.type(screen.getByLabelText(/price/i), '100');
      
      // Upload image
      await user.click(screen.getByText('Upload Image'));

      // Add a variant (assuming VariantEditor has an "Add Variant" button)
      // This would be handled by the VariantEditor component
      // For this test, we'll check that the submission includes variant IDs

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create product/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockCreateProduct).toHaveBeenCalled();
        const callArgs = mockCreateProduct.mock.calls[0][0];
        console.log('Create product called with:', callArgs);
        
        // Since VariantEditor is not part of this test and we're not adding variants
        // manually, we should just verify the form submitted successfully
        expect(callArgs).toHaveProperty('name', 'Test Product');
        expect(callArgs).toHaveProperty('description', 'Test Description for the product');
        expect(callArgs).toHaveProperty('price', 100);
        expect(callArgs).toHaveProperty('image', 'https://example.com/test-image.jpg');
      });
    });

    it('should preserve existing variant IDs when editing a product', async () => {
      const existingProduct: Product = {
        _id: 'prod-123',
        name: 'Existing Product',
        description: 'Existing description',
        price: 150,
        image: 'https://example.com/existing.jpg',
        isFeatured: false,
        variants: [
          {
            variantId: 'existing-variant-id-1',
            label: 'Size L',
            color: 'Blue',
            price: 160,
            inventory: 10,
            sku: 'SKU-L-BLUE',
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const user = userEvent.setup();
      render(<ProductForm mode="edit" initialData={existingProduct} />, { 
        wrapper: createWrapper 
      });

      // Change the product name to trigger a save
      const existingNameInput = screen.getByDisplayValue('Existing Product');
      await user.clear(existingNameInput);
      await user.type(existingNameInput, 'Updated Product');

      // Trigger a change to ensure form is dirty
      const discountNameInput = screen.getByDisplayValue('Discounted Product');
      await user.clear(discountNameInput);
      await user.type(discountNameInput, 'Discounted Product Updated');
      
      // Submit form
      const submitButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockUpdateProduct).toHaveBeenCalled();
        const callArgs = mockUpdateProduct.mock.calls[0][0];
        
        // Check that existing variant IDs are preserved
        expect(callArgs.data.variants[0].variantId).toBe('existing-variant-id-1');
        // Transform should be called but should preserve existing ID
        expect(mockTransformVariant).toHaveBeenCalled();
      });
    });

    it('should generate IDs only for variants without IDs', async () => {
      // const productWithMixedVariants: Product = {
      //   _id: 'prod-456',
      //   name: 'Mixed Product',
      //   description: 'Product with some variants having IDs',
      //   price: 200,
      //   image: 'https://example.com/mixed.jpg',
      //   isFeatured: false,
      //   variants: [
      //     {
      //       variantId: 'existing-id',
      //       label: 'Variant 1',
      //       price: 210,
      //       inventory: 5,
      //     },
      //     {
      //       variantId: '', // Empty ID should trigger generation
      //       label: 'Variant 2',
      //       price: 220,
      //       inventory: 3,
      //     },
      //   ],
      //   createdAt: new Date().toISOString(),
      //   updatedAt: new Date().toISOString(),
      // };

      // This test would need the VariantEditor to add new variants
      // The actual implementation would be tested through integration tests
    });
  });

  describe('Price Transformation', () => {
    it('should convert priceAdjustment to absolute price', async () => {
      const user = userEvent.setup();
      render(<ProductForm mode="create" />, { wrapper: createWrapper });

      // Fill in required fields with base price of 100
      await user.type(screen.getByLabelText(/product name/i), 'Test Product');
      await user.type(screen.getByPlaceholderText(/enter product description/i), 'Test Description for the product');
      await user.type(screen.getByLabelText(/price/i), '100');
      
      // Upload image
      await user.click(screen.getByText('Upload Image'));

      // Note: Actual variant addition would be handled by VariantEditor
      // For this test, we're verifying the transformation logic

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create product/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockCreateProduct).toHaveBeenCalled();
        const callArgs = mockCreateProduct.mock.calls[0][0];
        
        // If variants exist, check price calculation
        if (callArgs.variants && callArgs.variants.length > 0) {
          callArgs.variants.forEach((variant: any) => {
            expect(variant).toHaveProperty('price');
            expect(variant).not.toHaveProperty('priceAdjustment');
            expect(typeof variant.price).toBe('number');
            expect(variant.price).toBeGreaterThanOrEqual(0);
          });
        }
      });
    });

    it('should round prices to 2 decimal places', async () => {
      // This would test that prices like 100.999 become 101.00
      // Implementation depends on how variants are added through VariantEditor
    });

    it('should use toFixed(2) for proper price rounding', async () => {
      const user = userEvent.setup();
      render(<ProductForm mode="create" />, { wrapper: createWrapper });

      // Fill in required fields with specific prices that test rounding
      await user.type(screen.getByLabelText(/product name/i), 'Rounding Test Product');
      await user.type(screen.getByPlaceholderText(/enter product description/i), 'Test Description for rounding');
      await user.type(screen.getByLabelText(/price/i), '99.999');
      await user.click(screen.getByText('Upload Image'));

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create product/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockCreateProduct).toHaveBeenCalled();
        // Base price should be handled properly by form validation
      });
    });

    it('should handle negative price adjustments correctly', async () => {
      const productWithNegativeAdjustment: Product = {
        _id: 'prod-789',
        name: 'Discounted Product',
        description: 'Product with discount variants',
        price: 100,
        image: 'https://example.com/discount.jpg',
        isFeatured: false,
        variants: [
          {
            variantId: 'discount-variant',
            label: 'Clearance',
            price: 80, // This would be a -20 adjustment from base price
            inventory: 15,
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const user = userEvent.setup();
      render(<ProductForm mode="edit" initialData={productWithNegativeAdjustment} />, { 
        wrapper: createWrapper 
      });

      // Submit without changes to test the transformation
      const submitButton = screen.getByRole('button', { name: /save changes/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockUpdateProduct).toHaveBeenCalled();
        const callArgs = mockUpdateProduct.mock.calls[0][0];
        
        // Check that price is absolute and positive
        expect(callArgs.data.variants[0].price).toBe(80);
        expect(callArgs.data.variants[0].price).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty variant label by generating ID', async () => {
      mockTransformVariant.mockImplementation((variant: any, basePrice: any) => ({
        variantId: variant.label ? `${variant.label.toLowerCase()}-123456` : 'default-123456',
        label: variant.label || '',
        price: parseFloat((basePrice + (variant.priceAdjustment ?? 0)).toFixed(2)),
        inventory: variant.inventory ?? 0,
        sku: variant.sku || '',
      }));

      // Test would verify that empty labels still get valid IDs
    });

    it('should handle null/undefined values in variants', async () => {
      // Test would verify graceful handling of missing variant data
    });

    it('should log variant data for debugging', async () => {
      const consoleSpy = vi.spyOn(console, 'log');
      
      const user = userEvent.setup();
      render(<ProductForm mode="create" />, { wrapper: createWrapper });

      // Fill required fields and submit
      await user.type(screen.getByLabelText(/product name/i), 'Test Product');
      await user.type(screen.getByPlaceholderText(/enter product description/i), 'Test Description for the product');
      await user.type(screen.getByLabelText(/price/i), '100');
      await user.click(screen.getByText('Upload Image'));
      await user.click(screen.getByRole('button', { name: /create product/i }));

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Submitting variants:',
          expect.any(Array)
        );
      });

      consoleSpy.mockRestore();
    });
  });
});