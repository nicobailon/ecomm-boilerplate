import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { describe, it, expect } from 'vitest';
import { VariantAttributesEditor } from '../VariantAttributesEditor';
import { productSchema, type ProductFormInput } from '@/lib/validations';

// Test wrapper component that provides form context
function TestWrapper({ children, defaultValues = {} }: { children: React.ReactNode; defaultValues?: Partial<ProductFormInput> }) {
  const methods = useForm<ProductFormInput>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: 'Test Product',
      description: 'Test Description',
      price: 100,
      image: 'https://example.com/image.jpg',
      variantTypes: [],
      variants: [],
      ...defaultValues,
    },
  });

  return (
    <FormProvider {...methods}>
      <form>{children}</form>
    </FormProvider>
  );
}

describe('VariantAttributesEditor', () => {
  describe('Component Rendering', () => {
    it('should render the variant types section', () => {
      render(
        <TestWrapper>
          <VariantAttributesEditor />
        </TestWrapper>,
      );

      expect(screen.getByText('Variant Types')).toBeInTheDocument();
      expect(screen.getByText('Define attributes like Size, Color, Material')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Type name (e.g., Size)')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Values (comma-separated, e.g., S, M, L, XL)')).toBeInTheDocument();
    });

    it('should render empty state when no variants exist', () => {
      render(
        <TestWrapper>
          <VariantAttributesEditor />
        </TestWrapper>,
      );

      expect(screen.getByText('No variants created yet')).toBeInTheDocument();
      expect(screen.getByText('Define variant types above or add variants manually')).toBeInTheDocument();
    });
  });

  describe('Adding Variant Types', () => {
    it('should add a new variant type when Add Type button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <VariantAttributesEditor />
        </TestWrapper>,
      );

      const typeNameInput = screen.getByPlaceholderText('Type name (e.g., Size)');
      const typeValuesInput = screen.getByPlaceholderText('Values (comma-separated, e.g., S, M, L, XL)');
      const addButton = screen.getByRole('button', { name: /add type/i });

      await user.type(typeNameInput, 'Size');
      await user.type(typeValuesInput, 'Small, Medium, Large');
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Size')).toBeInTheDocument();
        expect(screen.getByText('Small')).toBeInTheDocument();
        expect(screen.getByText('Medium')).toBeInTheDocument();
        expect(screen.getByText('Large')).toBeInTheDocument();
      });
    });

    it('should disable Add Type button when inputs are empty', () => {
      render(
        <TestWrapper>
          <VariantAttributesEditor />
        </TestWrapper>,
      );

      const addButton = screen.getByRole('button', { name: /add type/i });
      expect(addButton).toBeDisabled();
    });

    it('should clear inputs after adding a type', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <VariantAttributesEditor />
        </TestWrapper>,
      );

      const typeNameInput = screen.getByPlaceholderText('Type name (e.g., Size)');
      const typeValuesInput = screen.getByPlaceholderText('Values (comma-separated, e.g., S, M, L, XL)');
      const addButton = screen.getByRole('button', { name: /add type/i });

      await user.type(typeNameInput, 'Size');
      await user.type(typeValuesInput, 'S, M, L');
      await user.click(addButton);

      await waitFor(() => {
        expect(typeNameInput).toHaveValue('');
        expect(typeValuesInput).toHaveValue('');
      });
    });
  });

  describe('Generating Variants', () => {
    it('should show Generate Variants button when types exist', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <VariantAttributesEditor />
        </TestWrapper>,
      );

      const typeNameInput = screen.getByPlaceholderText('Type name (e.g., Size)');
      const typeValuesInput = screen.getByPlaceholderText('Values (comma-separated, e.g., S, M, L, XL)');
      const addButton = screen.getByRole('button', { name: /add type/i });

      await user.type(typeNameInput, 'Size');
      await user.type(typeValuesInput, 'S, M');
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /generate variants/i })).toBeInTheDocument();
      });
    });

    it('should generate all combinations when Generate Variants is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <VariantAttributesEditor />
        </TestWrapper>,
      );

      // Add Size type
      await user.type(screen.getByPlaceholderText('Type name (e.g., Size)'), 'Size');
      await user.type(screen.getByPlaceholderText('Values (comma-separated, e.g., S, M, L, XL)'), 'S, M');
      await user.click(screen.getByRole('button', { name: /add type/i }));

      // Add Color type
      await user.type(screen.getByPlaceholderText('Type name (e.g., Size)'), 'Color');
      await user.type(screen.getByPlaceholderText('Values (comma-separated, e.g., S, M, L, XL)'), 'Red, Blue');
      await user.click(screen.getByRole('button', { name: /add type/i }));

      // Generate variants
      const generateButton = screen.getByRole('button', { name: /generate variants/i });
      await user.click(generateButton);

      await waitFor(() => {
        // Should create 2x2 = 4 variants
        const variantRows = screen.getAllByRole('row');
        // +1 for header row
        expect(variantRows).toHaveLength(5);
      });
    });
  });

  describe('Variant Table', () => {
    it('should display variant table with dynamic columns based on types', async () => {
      const defaultValues = {
        variantTypes: [
          { name: 'Size', values: ['S', 'M', 'L'] },
          { name: 'Color', values: ['Red', 'Blue'] },
        ],
        variants: [
          {
            label: 'S / Red',
            color: '',
            priceAdjustment: 0,
            inventory: 10,
            sku: '',
            attributes: { Size: 'S', Color: 'Red' },
          },
        ],
      };

      render(
        <TestWrapper defaultValues={defaultValues}>
          <VariantAttributesEditor />
        </TestWrapper>,
      );

      // Check table headers - use getAllByText for duplicate texts
      expect(screen.getByText('Variant')).toBeInTheDocument();
      const sizeElements = screen.getAllByText('Size');
      expect(sizeElements.length).toBeGreaterThan(0); // At least one Size header
      const colorElements = screen.getAllByText('Color');
      expect(colorElements.length).toBeGreaterThan(0); // At least one Color header
      expect(screen.getByText('Price Adj.')).toBeInTheDocument();
      expect(screen.getByText('Final Price')).toBeInTheDocument();
      expect(screen.getByText('Inventory')).toBeInTheDocument();
      expect(screen.getByText('SKU')).toBeInTheDocument();
    });

    it('should auto-generate variant labels from attributes', () => {
      const defaultValues = {
        variantTypes: [
          { name: 'Size', values: ['Small', 'Medium'] },
          { name: 'Color', values: ['Red'] },
        ],
        variants: [
          {
            label: 'Small / Red',
            color: '',
            priceAdjustment: 5,
            inventory: 10,
            sku: '',
            attributes: { Size: 'Small', Color: 'Red' },
          },
        ],
        price: 100,
      };

      render(
        <TestWrapper defaultValues={defaultValues}>
          <VariantAttributesEditor />
        </TestWrapper>,
      );

      // Check auto-generated label
      const labelInput = screen.getByDisplayValue('Small / Red');
      expect(labelInput).toBeInTheDocument();
      expect(labelInput).toHaveAttribute('readonly');

      // Check final price calculation
      expect(screen.getByText('$105.00')).toBeInTheDocument();
    });

    it('should highlight duplicate attribute combinations', () => {
      const defaultValues = {
        variantTypes: [
          { name: 'Size', values: ['S', 'M'] },
        ],
        variants: [
          {
            label: 'S',
            color: '',
            priceAdjustment: 0,
            inventory: 10,
            sku: '',
            attributes: { Size: 'S' },
          },
          {
            label: 'S',
            color: '',
            priceAdjustment: 0,
            inventory: 5,
            sku: '',
            attributes: { Size: 'S' },
          },
        ],
      };

      render(
        <TestWrapper defaultValues={defaultValues}>
          <VariantAttributesEditor />
        </TestWrapper>,
      );

      // Should show duplicate badge
      expect(screen.getAllByText('Duplicate')).toHaveLength(1);
    });
  });

  describe('Manual Variant Addition', () => {
    it('should show manual add button when no types are defined', () => {
      render(
        <TestWrapper>
          <VariantAttributesEditor />
        </TestWrapper>,
      );

      expect(screen.getByRole('button', { name: /add variant manually/i })).toBeInTheDocument();
    });

    it('should not show manual add button when types are defined', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <VariantAttributesEditor />
        </TestWrapper>,
      );

      await user.type(screen.getByPlaceholderText('Type name (e.g., Size)'), 'Size');
      await user.type(screen.getByPlaceholderText('Values (comma-separated, e.g., S, M, L, XL)'), 'S, M');
      await user.click(screen.getByRole('button', { name: /add type/i }));

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /add variant manually/i })).not.toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('should render skeleton when loading', () => {
      render(
        <TestWrapper>
          <VariantAttributesEditor isLoading />
        </TestWrapper>,
      );

      // Check for skeleton elements by their class
      const skeletonElements = document.querySelectorAll('.animate-pulse');
      expect(skeletonElements.length).toBeGreaterThan(0);
    });
  });

  describe('Tips Section', () => {
    it('should show tips when variants exist', () => {
      const defaultValues = {
        variants: [
          {
            label: 'Test',
            color: '',
            priceAdjustment: 0,
            inventory: 10,
            sku: '',
          },
        ],
      };

      render(
        <TestWrapper defaultValues={defaultValues}>
          <VariantAttributesEditor />
        </TestWrapper>,
      );

      expect(screen.getByText('Tips:')).toBeInTheDocument();
      expect(screen.getByText(/Define variant types/)).toBeInTheDocument();
      expect(screen.getByText(/Click "Generate Variants"/)).toBeInTheDocument();
    });
  });
});