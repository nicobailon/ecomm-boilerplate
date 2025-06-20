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
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
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
        vi.mocked(Product.findById).mockResolvedValue(mockProduct);

        const result = await productService.updateVariantInventory(
          mockProductId,
          undefined,
          'increment',
          5,
          3,
          'Small - Blue'
        );

        expect(result.inventory).toBe(15);
        expect(mockProduct.save).toHaveBeenCalledTimes(1);
      });

      it('should map size to label when only variantId provided', async () => {
        vi.mocked(Product.findById).mockResolvedValue(mockProduct);

        const result = await productService.updateVariantInventory(
          mockProductId,
          'S',
          'increment',
          5,
          3,
          undefined
        );

        expect(result.inventory).toBe(15);
        expect(mockProduct.save).toHaveBeenCalledTimes(1);
      });

      it('should prefer label over variantId when both provided', async () => {
        vi.mocked(Product.findById).mockResolvedValue(mockProduct);

        const result = await productService.updateVariantInventory(
          mockProductId,
          'variant-999',
          'increment',
          5,
          3,
          'Medium - Blue'
        );

        expect(result.inventory).toBe(20);
        expect(mockProduct.save).toHaveBeenCalledTimes(1);
      });

      it('should handle variant not found error', async () => {
        vi.mocked(Product.findById).mockResolvedValue(mockProduct);

        await expect(
          productService.updateVariantInventory(
            mockProductId,
            undefined,
            'increment',
            5,
            3,
            'Large - Blue'
          )
        ).rejects.toThrow(AppError);
      });
    });

    describe('with USE_VARIANT_LABEL = false', () => {
      beforeEach(() => {
        vi.spyOn(featureFlags, 'USE_VARIANT_LABEL', 'get').mockReturnValue(false);
      });

      it('should update inventory using variantId (legacy mode)', async () => {
        vi.mocked(Product.findById).mockResolvedValue(mockProduct);

        const result = await productService.updateVariantInventory(
          mockProductId,
          'variant-1',
          'increment',
          5,
          3,
          undefined
        );

        expect(result.inventory).toBe(15);
        expect(mockProduct.save).toHaveBeenCalledTimes(1);
      });

      it('should ignore label in legacy mode', async () => {
        vi.mocked(Product.findById).mockResolvedValue(mockProduct);

        const result = await productService.updateVariantInventory(
          mockProductId,
          'variant-2',
          'set',
          20,
          3,
          'Small - Blue'
        );

        expect(result.inventory).toBe(20);
        expect(result.variantId).toBe('variant-2');
        expect(mockProduct.save).toHaveBeenCalledTimes(1);
      });

      it('should handle size lookup in legacy mode', async () => {
        vi.mocked(Product.findById).mockResolvedValue(mockProduct);

        const result = await productService.updateVariantInventory(
          mockProductId,
          'M',
          'decrement',
          5,
          3,
          undefined
        );

        expect(result.inventory).toBe(10);
        expect(mockProduct.save).toHaveBeenCalledTimes(1);
      });
    });

    describe('concurrent update handling', () => {
      it('should retry on VersionError', async () => {
        const versionError = new Error('VersionError');
        versionError.name = 'VersionError';

        vi.mocked(Product.findById).mockResolvedValue(mockProduct);
        mockProduct.save
          .mockRejectedValueOnce(versionError)
          .mockResolvedValueOnce(true);

        const result = await productService.updateVariantInventory(
          mockProductId,
          'variant-1',
          'increment',
          5,
          3
        );

        expect(result.inventory).toBe(15);
        expect(mockProduct.save).toHaveBeenCalledTimes(2);
      });

      it('should throw after max retries', async () => {
        const versionError = new Error('VersionError');
        versionError.name = 'VersionError';

        vi.mocked(Product.findById).mockResolvedValue(mockProduct);
        mockProduct.save.mockRejectedValue(versionError);

        await expect(
          productService.updateVariantInventory(
            mockProductId,
            'variant-1',
            'increment',
            5,
            3
          )
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
          variants: [
            {
              variantId: 'new-variant-1',
              label: 'Small',
              price: 49.99,
              inventory: 20,
              images: [],
            },
          ],
        };

        const createdProduct = {
          ...productData,
          _id: mockObjectId('new-product-id'),
          slug: 'new-product',
          save: vi.fn(),
        };

        vi.mocked(Product.prototype.save).mockResolvedValue(createdProduct);

        const result = await productService.createProduct(productData);

        expect(result.variants[0].label).toBe('Small');
      });
    });
  });
});