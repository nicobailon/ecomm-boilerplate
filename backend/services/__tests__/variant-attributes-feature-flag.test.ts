import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Variant Attributes Feature Flag', () => {
  let originalEnv: string | undefined;
  
  beforeEach(() => {
    originalEnv = process.env.USE_VARIANT_ATTRIBUTES;
    vi.resetModules();
  });
  
  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.USE_VARIANT_ATTRIBUTES = originalEnv;
    } else {
      delete process.env.USE_VARIANT_ATTRIBUTES;
    }
    vi.resetModules();
  });
  
  describe('Product Variant Schema', () => {
    it('should enforce enum constraint when feature flag is disabled', async () => {
      process.env.USE_VARIANT_ATTRIBUTES = 'false';
      
      const { productVariantSchema } = await import('../../validations/product.validation.js');
      
      const validVariant = {
        variantId: 'v1',
        label: 'Medium Black',
        size: 'M',
        color: '#000000',
        price: 99.99,
        inventory: 10,
      };
      
      const invalidVariant = {
        variantId: 'v2',
        label: 'Custom Size',
        size: 'XXXL',
        color: '#FF0000',
        price: 99.99,
        inventory: 5,
      };
      
      expect(() => productVariantSchema.parse(validVariant)).not.toThrow();
      expect(() => productVariantSchema.parse(invalidVariant)).toThrow();
    });
    
    it('should allow free-form size when feature flag is enabled', async () => {
      process.env.USE_VARIANT_ATTRIBUTES = 'true';
      
      const { productVariantSchema } = await import('../../validations/product.validation.js');
      
      const customVariant = {
        variantId: 'v1',
        label: 'Custom Size',
        size: 'XXXL-Tall',
        color: '#000000',
        attributes: {
          size: 'XXXL-Tall',
          color: '#000000',
          material: 'Cotton Blend',
        },
        price: 129.99,
        inventory: 3,
      };
      
      expect(() => productVariantSchema.parse(customVariant)).not.toThrow();
      
      const parsed = productVariantSchema.parse(customVariant);
      expect(parsed.size).toBe('XXXL-Tall');
      expect(parsed.attributes).toEqual({
        size: 'XXXL-Tall',
        color: '#000000',
        material: 'Cotton Blend',
      });
    });
    
    it('should validate attributes as optional record of strings', async () => {
      process.env.USE_VARIANT_ATTRIBUTES = 'true';
      
      const { productVariantSchema } = await import('../../validations/product.validation.js');
      
      const variantWithAttributes = {
        variantId: 'v1',
        label: 'Premium Variant',
        attributes: {
          size: 'L',
          color: 'Navy',
          material: 'Silk',
          style: 'Premium',
          fit: 'Slim',
        },
        price: 199.99,
        inventory: 5,
      };
      
      const result = productVariantSchema.parse(variantWithAttributes);
      expect(result.attributes).toBeDefined();
      expect(Object.keys(result.attributes!).length).toBe(5);
    });
  });
  
  describe('Variant Helper', () => {
    it('should use attributes matching when feature flag is enabled', async () => {
      process.env.USE_VARIANT_ATTRIBUTES = 'true';
      
      const { getVariantOrDefault } = await import('../../services/helpers/variant.helper.js');
      
      const variants = [
        {
          variantId: 'v1',
          label: 'Small Red',
          attributes: { size: 'S', color: 'Red' },
          price: 99.99,
          inventory: 10,
          reservedInventory: 0,
          images: [],
        },
        {
          variantId: 'v2',
          label: 'Medium Blue',
          attributes: { size: 'M', color: 'Blue' },
          price: 109.99,
          inventory: 5,
          reservedInventory: 0,
          images: [],
        },
      ];
      
      const result = getVariantOrDefault(
        variants,
        undefined,
        undefined,
        { size: 'M', color: 'Blue' }
      );
      
      expect(result.variant?.variantId).toBe('v2');
      expect(result.isVirtualDefault).toBe(false);
    });
    
    it('should fallback to legacy matching when feature flag is disabled', async () => {
      process.env.USE_VARIANT_ATTRIBUTES = 'false';
      
      const { getVariantOrDefault } = await import('../../services/helpers/variant.helper.js');
      
      const variants = [
        {
          variantId: 'v1',
          label: 'Small',
          size: 'S',
          price: 99.99,
          inventory: 10,
          reservedInventory: 0,
          images: [],
        },
        {
          variantId: 'v2',
          label: 'Medium',
          size: 'M',
          price: 109.99,
          inventory: 5,
          reservedInventory: 0,
          images: [],
        },
      ];
      
      const result = getVariantOrDefault(
        variants,
        undefined,
        'M',
        { size: 'M', color: 'Any' }
      );
      
      expect(result.variant?.variantId).toBe('v2');
      expect(result.isVirtualDefault).toBe(false);
    });
  });
});