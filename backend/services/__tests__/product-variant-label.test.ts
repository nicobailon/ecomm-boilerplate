import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { productService } from '../product.service.js';
import { Product } from '../../models/product.model.js';
import * as featureFlags from '../../utils/featureFlags.js';
import { AppError } from '../../utils/AppError.js';
import { mockObjectId } from '../../test/helpers/mongoose-mocks.js';

vi.mock('../../models/product.model');
vi.mock('../../lib/redis', () => ({
  redis: {
    del: vi.fn(),
    scan: vi.fn().mockResolvedValue([0, []]),
  },
}));

describe('ProductService - Variant Label Feature', () => {
  const mockProductId = mockObjectId('507f1f77bcf86cd799439011');
  const mockProduct = {
    _id: mockProductId,
    name: 'Test Product',
    slug: 'test-product',
    variants: [
      {
        variantId: 'variant-1',
        label: 'Small - Blue',
        size: 'S',
        color: '#0000FF',
        inventory: 10,
        price: 29.99,
        images: [],
      },
      {
        variantId: 'variant-2',
        label: 'Medium - Blue',
        size: 'M',
        color: '#0000FF',
        inventory: 15,
        price: 29.99,
        images: [],
      },
    ],
    save: vi.fn().mockResolvedValue(true),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('updateVariantInventory', () => {
    describe('with USE_VARIANT_LABEL = true', () => {
      beforeEach(() => {
        vi.spyOn(featureFlags, 'USE_VARIANT_LABEL', 'get').mockReturnValue(true);
      });

      it('should update inventory using variant label', async () => {
        vi.spyOn(Product, 'findById').mockResolvedValue(mockProduct);

        const result = await productService.updateVariantInventory(
          mockProductId.toString(),
          undefined,
          5,
          'increment',
          3,
          'Small - Blue',
        );

        expect(result.inventory).toBe(15);
        expect(mockProduct.save).toHaveBeenCalledTimes(1);
      });

      it('should map size to label when only variantId provided', async () => {
        vi.spyOn(Product, 'findById').mockResolvedValue(mockProduct);

        const result = await productService.updateVariantInventory(
          mockProductId.toString(),
          'S',
          5,
          'increment',
          3,
          undefined,
        );

        expect(result.inventory).toBe(15);
        expect(mockProduct.save).toHaveBeenCalledTimes(1);
      });

      it('should prefer label over variantId when both provided', async () => {
        vi.spyOn(Product, 'findById').mockResolvedValue(mockProduct);

        const result = await productService.updateVariantInventory(
          mockProductId.toString(),
          'variant-999',
          5,
          'increment',
          3,
          'Medium - Blue',
        );

        expect(result.inventory).toBe(20);
        expect(mockProduct.save).toHaveBeenCalledTimes(1);
      });

      it('should handle variant not found error', async () => {
        vi.spyOn(Product, 'findById').mockResolvedValue(mockProduct);

        await expect(
          productService.updateVariantInventory(
            mockProductId.toString(),
            undefined,
            5,
            'increment',
            3,
            'Large - Blue',
          ),
        ).rejects.toThrow(AppError);
      });
    });

    describe('with USE_VARIANT_LABEL = false', () => {
      beforeEach(() => {
        vi.spyOn(featureFlags, 'USE_VARIANT_LABEL', 'get').mockReturnValue(false);
      });

      it('should update inventory using variantId (legacy mode)', async () => {
        vi.spyOn(Product, 'findById').mockResolvedValue(mockProduct);

        const result = await productService.updateVariantInventory(
          mockProductId.toString(),
          'variant-1',
          5,
          'increment',
          3,
          undefined,
        );

        expect(result.inventory).toBe(15);
        expect(mockProduct.save).toHaveBeenCalledTimes(1);
      });

      it('should ignore label in legacy mode', async () => {
        vi.spyOn(Product, 'findById').mockResolvedValue(mockProduct);

        const result = await productService.updateVariantInventory(
          mockProductId.toString(),
          'variant-2',
          20,
          'set',
          3,
          'Small - Blue',
        );

        expect(result.inventory).toBe(20);
        expect(result.variantId).toBe('variant-2');
        expect(mockProduct.save).toHaveBeenCalledTimes(1);
      });

      it('should handle size lookup in legacy mode', async () => {
        vi.spyOn(Product, 'findById').mockResolvedValue(mockProduct);

        const result = await productService.updateVariantInventory(
          mockProductId.toString(),
          'M',
          5,
          'decrement',
          3,
          undefined,
        );

        expect(result.inventory).toBe(10);
        expect(mockProduct.save).toHaveBeenCalledTimes(1);
      });
    });

    describe('concurrent update handling', () => {
      it('should retry on VersionError', async () => {
        const versionError = new Error('VersionError');
        versionError.name = 'VersionError';

        vi.spyOn(Product, 'findById').mockResolvedValue(mockProduct);
        mockProduct.save
          .mockRejectedValueOnce(versionError)
          .mockResolvedValueOnce(true);

        const result = await productService.updateVariantInventory(
          mockProductId.toString(),
          'variant-1',
          5,
          'increment',
          3,
        );

        expect(result.inventory).toBe(15);
        expect(mockProduct.save).toHaveBeenCalledTimes(2);
      });

      it('should throw after max retries', async () => {
        const versionError = new Error('VersionError');
        versionError.name = 'VersionError';

        vi.spyOn(Product, 'findById').mockResolvedValue(mockProduct);
        mockProduct.save.mockRejectedValue(versionError);

        await expect(
          productService.updateVariantInventory(
            mockProductId.toString(),
            'variant-1',
            5,
            'increment',
            3,
          ),
        ).rejects.toThrow('Failed to update inventory for variant after 3 retries');
      });
    });
  });

  describe('createProduct', () => {
    describe('with USE_VARIANT_LABEL = true', () => {
      beforeEach(() => {
        vi.spyOn(featureFlags, 'USE_VARIANT_LABEL', 'get').mockReturnValue(true);
      });

      it('should create product with label-based variants', async () => {
        const productData = {
          name: 'New Product',
          description: 'Test description',
          price: 49.99,
          image: 'https://example.com/image.jpg',
          isFeatured: false,
          variants: [
            {
              variantId: 'new-variant-1',
              label: 'Small',
              price: 49.99,
              inventory: 20,
              images: [],
            },
          ],
          relatedProducts: [],
          mediaGallery: [],
        };

        const createdProduct = {
          ...productData,
          _id: mockObjectId('new-product-id'),
          slug: 'new-product',
          save: vi.fn(),
        };

        vi.spyOn(Product.prototype, 'save').mockResolvedValue(createdProduct);

        const result = await productService.createProduct(productData);

        expect(result).toBeDefined();
        // Since the mock returns the product data directly, we can verify the call was made
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect(Product.prototype.save).toHaveBeenCalledTimes(1);
      });
    });
  });
});