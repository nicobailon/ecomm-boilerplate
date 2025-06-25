import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import mongoose from 'mongoose';
import { cartService } from '../cart.service.js';
import { Product } from '../../models/product.model.js';
import { IUserDocument } from '../../models/user.model.js';

// Mock mongoose and models
vi.mock('mongoose', async (importOriginal) => {
  const actual = await importOriginal<typeof import('mongoose')>();
  
  // Create a mock ObjectId class
  class MockObjectId {
    private id: string;
    
    constructor(id: string) {
      this.id = id;
    }
    
    toString() {
      return this.id;
    }
    
    equals(other: unknown) {
      if (other instanceof MockObjectId) {
        return this.id === other.id;
      }
      if (other && typeof other === 'object' && 'toString' in other) {
        return this.id === String((other as { toString(): string }).toString());
      }
      return this.id === String(other);
    }
  }
  
  return {
    ...actual,
    default: {
      ...actual.default,
      Types: {
        ObjectId: MockObjectId,
      },
      startSession: vi.fn().mockResolvedValue({
        startTransaction: vi.fn(),
        commitTransaction: vi.fn(),
        abortTransaction: vi.fn(),
        endSession: vi.fn(),
      }),
    },
  };
});

vi.mock('../../models/product.model.js');
vi.mock('../../models/user.model.js');

// Mock inventory service
vi.mock('../inventory.service.js', () => ({
  inventoryService: {
    checkAvailability: vi.fn().mockResolvedValue(true),
    getAvailableInventory: vi.fn().mockResolvedValue(10),
  },
}));

describe('CartService', () => {
  let mockUser: IUserDocument;
  let mockSession: {
    startTransaction: ReturnType<typeof vi.fn>;
    commitTransaction: ReturnType<typeof vi.fn>;
    abortTransaction: ReturnType<typeof vi.fn>;
    endSession: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockSession = {
      startTransaction: vi.fn(),
      commitTransaction: vi.fn(),
      abortTransaction: vi.fn(),
      endSession: vi.fn(),
    };
    
    vi.spyOn(mongoose, 'startSession').mockResolvedValue(mockSession as unknown as mongoose.ClientSession);

    mockUser = {
      _id: new mongoose.Types.ObjectId('user123'),
      name: 'Test User',
      email: 'test@example.com',
      password: 'hashedpassword',
      role: 'customer',
      cartItems: [],
      appliedCoupon: null,
      save: vi.fn().mockResolvedValue(true),
      comparePassword: vi.fn().mockResolvedValue(true),
    } as unknown as IUserDocument;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('addToCart', () => {
    it('should handle adding same product with different variants', async () => {
      const productId = 'product123';
      const product = {
        _id: new mongoose.Types.ObjectId(productId),
        name: 'T-Shirt',
        price: 20,
        variants: [
          { variantId: 'var1', size: 'M', color: 'Blue', price: 22, inventory: 5, sku: 'TSH-M-BLU' },
          { variantId: 'var2', size: 'L', color: 'Blue', price: 24, inventory: 3, sku: 'TSH-L-BLU' },
        ],
      };

      const mockFindById = vi.spyOn(Product, 'findById');
      mockFindById.mockImplementation(() => ({
        session: vi.fn().mockResolvedValue(product),
      }) as unknown as ReturnType<typeof Product.findById>);

      const mockFindOneAndUpdate = vi.spyOn(Product, 'findOneAndUpdate');
      mockFindOneAndUpdate.mockResolvedValue(product);

      // Add first variant
      await cartService.addToCart(mockUser, productId, 'var1');
      void expect(mockUser.cartItems).toHaveLength(1);
      void expect(mockUser.cartItems[0]).toMatchObject({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        product: expect.objectContaining({}),
        quantity: 1,
        variantId: 'var1',
        variantDetails: {
          size: 'M',
          color: 'Blue',
          price: 22,
          sku: 'TSH-M-BLU',
        },
      });

      // Add second variant of same product
      await cartService.addToCart(mockUser, productId, 'var2');
      void expect(mockUser.cartItems).toHaveLength(2);
      void expect(mockUser.cartItems[1]).toMatchObject({
        variantId: 'var2',
        variantDetails: {
          size: 'L',
          color: 'Blue',
          price: 24,
          sku: 'TSH-L-BLU',
        },
      });
    });

    it('should validate variant inventory before adding', async () => {
      const productId = 'product123';
      const product = {
        _id: new mongoose.Types.ObjectId(productId),
        variants: [
          { variantId: 'var1', size: 'M', color: 'Red', price: 25, inventory: 0 },
        ],
      };

      const mockFindById2 = vi.spyOn(Product, 'findById');
      mockFindById2.mockImplementation(() => ({
        session: vi.fn().mockResolvedValue(product),
      }) as unknown as ReturnType<typeof Product.findById>);

      // Mock inventory check to return false for out of stock
      const { inventoryService } = await import('../inventory.service.js');
      vi.spyOn(inventoryService, 'checkAvailability').mockResolvedValueOnce(false);
      vi.spyOn(inventoryService, 'getAvailableInventory').mockResolvedValueOnce(0);
      
      await expect(
        cartService.addToCart(mockUser, productId, 'var1'),
      ).rejects.toThrow('Variant var1 is out of stock');
    });

    it('should use variant price in calculations', async () => {
      const productId = 'product123';
      const product = {
        _id: new mongoose.Types.ObjectId(productId),
        name: 'Jacket',
        price: 100, // Base price
        description: 'Winter jacket',
        image: 'jacket.jpg',
        isFeatured: false,
        variants: [
          { variantId: 'var1', size: 'XL', price: 120, inventory: 5 }, // Variant has different price
        ],
      };

      mockUser.cartItems = [{
        product: new mongoose.Types.ObjectId(productId),
        quantity: 2,
        variantId: 'var1',
        variantDetails: {
          size: 'XL',
          price: 120,
        },
      }];

      const mockFind = vi.spyOn(Product, 'find');
      mockFind.mockImplementation(() => ({
        lean: vi.fn().mockResolvedValue([product]),
      }) as unknown as ReturnType<typeof Product.find>);

      const result = await cartService.calculateCartTotals(mockUser);
      
      void expect(result.subtotal).toBe(240); // 2 * 120 (variant price), not 2 * 100
      void expect(result.totalAmount).toBe(240);
    });

    it('should handle products without variants', async () => {
      const productId = 'product123';
      const product = {
        _id: new mongoose.Types.ObjectId(productId),
        name: 'Simple Product',
        price: 50,
        description: 'A simple product',
        image: 'simple.jpg',
        isFeatured: false,
        variants: [], // Empty variants array
      };

      const mockFindById3 = vi.spyOn(Product, 'findById');
      mockFindById3.mockImplementation(() => ({
        session: vi.fn().mockResolvedValue(product),
      }) as unknown as ReturnType<typeof Product.findById>);
      
      // Mock inventory check for product without variants
      const { inventoryService } = await import('../inventory.service.js');
      vi.spyOn(inventoryService, 'checkAvailability').mockResolvedValue(true);
      // No need to mock reserveInventory - inventory is checked but not reserved

      await cartService.addToCart(mockUser, productId);
      
      void expect(mockUser.cartItems).toHaveLength(1);
      void expect(mockUser.cartItems[0]).toMatchObject({
        quantity: 1,
        variantId: undefined,
        variantDetails: undefined,
      });
    });

    it('should prevent adding more items than available inventory', async () => {
      const productId = 'product123';
      const product = {
        _id: new mongoose.Types.ObjectId(productId),
        variants: [
          { variantId: 'var1', size: 'S', inventory: 2 },
        ],
      };

      mockUser.cartItems = [{
        product: new mongoose.Types.ObjectId(productId),
        quantity: 2,
        variantId: 'var1',
      }];

      const mockFindById4 = vi.spyOn(Product, 'findById');
      mockFindById4.mockImplementation(() => ({
        session: vi.fn().mockResolvedValue(product),
      }) as unknown as ReturnType<typeof Product.findById>);

      // Mock the atomic update to succeed (validates but doesn't decrement)
      const mockFindOneAndUpdate2 = vi.spyOn(Product, 'findOneAndUpdate');
      mockFindOneAndUpdate2.mockResolvedValue(product);

      // Mock inventory check to fail
      const { inventoryService } = await import('../inventory.service.js');
      vi.spyOn(inventoryService, 'checkAvailability').mockResolvedValueOnce(false);
      vi.spyOn(inventoryService, 'getAvailableInventory').mockResolvedValueOnce(2);
      
      await expect(
        cartService.addToCart(mockUser, productId, 'var1'),
      ).rejects.toThrow('Cannot add more items. Only 2 available in stock');
    });
  });

  describe('updateQuantity', () => {
    it('should validate variant inventory when updating quantity', async () => {
      const productId = 'product123';
      const product = {
        _id: new mongoose.Types.ObjectId(productId),
        variants: [
          { variantId: 'var1', inventory: 3 },
        ],
      };

      mockUser.cartItems = [{
        product: new mongoose.Types.ObjectId(productId),
        quantity: 1,
        variantId: 'var1',
      }];

      const mockFindOneAndUpdate3 = vi.spyOn(Product, 'findOneAndUpdate');
      mockFindOneAndUpdate3.mockResolvedValue(null); // Simulate not enough inventory
      const mockFindById5 = vi.spyOn(Product, 'findById');
      mockFindById5.mockImplementation(() => ({
        session: vi.fn().mockResolvedValue(product),
      }) as unknown as ReturnType<typeof Product.findById>);

      // Mock inventory check to fail for quantity update
      const { inventoryService } = await import('../inventory.service.js');
      vi.spyOn(inventoryService, 'checkAvailability').mockResolvedValueOnce(false);
      vi.spyOn(inventoryService, 'getAvailableInventory').mockResolvedValueOnce(3);
      
      await expect(
        cartService.updateQuantity(mockUser, productId, 5, 'var1'),
      ).rejects.toThrow('Cannot update quantity. Only 3 available in stock');
    });

    it('should remove item when quantity is set to 0', async () => {
      const productId = 'product123';
      const productObjectId = new mongoose.Types.ObjectId(productId);
      
      mockUser.cartItems = [{
        product: productObjectId,
        quantity: 2,
        variantId: 'var1',
      }];

      await cartService.updateQuantity(mockUser, productId, 0, 'var1');
      
      void expect(mockUser.cartItems).toHaveLength(0);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      void expect(mockUser.save).toHaveBeenCalled();
    });
  });

  describe('removeFromCart', () => {
    it('should remove only specific variant combination', async () => {
      const productId = 'product123';
      const productObjectId = new mongoose.Types.ObjectId(productId);
      
      mockUser.cartItems = [
        {
          product: productObjectId,
          quantity: 1,
          variantId: 'var1',
        },
        {
          product: productObjectId,
          quantity: 1,
          variantId: 'var2',
        },
      ];

      await cartService.removeFromCart(mockUser, productId, 'var1');
      
      void expect(mockUser.cartItems).toHaveLength(1);
      void expect(mockUser.cartItems[0].variantId).toBe('var2');
    });

    it('should handle backward compatibility for items without variantId', async () => {
      const productId = 'product123';
      const productObjectId = new mongoose.Types.ObjectId(productId);
      
      mockUser.cartItems = [
        {
          product: productObjectId,
          quantity: 1,
          // No variantId
        },
        {
          product: productObjectId,
          quantity: 1,
          variantId: 'var1',
        },
      ];

      await cartService.removeFromCart(mockUser, productId);
      
      void expect(mockUser.cartItems).toHaveLength(1);
      void expect(mockUser.cartItems[0].variantId).toBe('var1');
    });
  });

  describe('getCartProducts', () => {
    it('should fetch variant details when not cached', async () => {
      const productId = 'product123';
      const product = {
        _id: new mongoose.Types.ObjectId(productId),
        name: 'Product',
        price: 50,
        description: 'Test product',
        image: 'test.jpg',
        isFeatured: false,
        variants: [
          { variantId: 'var1', size: 'M', color: 'Red', price: 55, sku: 'SKU-M-RED' },
        ],
      };

      mockUser.cartItems = [{
        product: new mongoose.Types.ObjectId(productId),
        quantity: 1,
        variantId: 'var1',
        // No variantDetails cached
      }];

      const mockFind2 = vi.spyOn(Product, 'find');
      mockFind2.mockImplementation(() => ({
        lean: vi.fn().mockResolvedValue([product]),
      } as unknown as ReturnType<typeof Product.find>));

      const result = await cartService.getCartProducts(mockUser);
      
      void expect(result[0]).toMatchObject({
        price: 55, // Variant price
        variantDetails: {
          size: 'M',
          color: 'Red',
          price: 55,
          sku: 'SKU-M-RED',
        },
      });
    });

    it('should handle products with multiple variant combinations in cart', async () => {
      const productId = 'product123';
      const product = {
        _id: new mongoose.Types.ObjectId(productId),
        name: 'Multi-variant Product',
        price: 40,
        description: 'Test product',
        image: 'test.jpg',
        isFeatured: false,
        variants: [
          { variantId: 'var1', size: 'S', color: 'Blue', price: 42 },
          { variantId: 'var2', size: 'M', color: 'Blue', price: 44 },
        ],
      };

      mockUser.cartItems = [
        {
          product: new mongoose.Types.ObjectId(productId),
          quantity: 2,
          variantId: 'var1',
          variantDetails: { size: 'S', color: 'Blue', price: 42 },
        },
        {
          product: new mongoose.Types.ObjectId(productId),
          quantity: 1,
          variantId: 'var2',
          variantDetails: { size: 'M', color: 'Blue', price: 44 },
        },
      ];

      const mockFind3 = vi.spyOn(Product, 'find');
      mockFind3.mockImplementation(() => ({
        lean: vi.fn().mockResolvedValue([product]),
      } as unknown as ReturnType<typeof Product.find>));

      const result = await cartService.getCartProducts(mockUser);
      
      void expect(result).toHaveLength(2);
      void expect(result[0].variantId).toBe('var1');
      void expect(result[0].price).toBe(42);
      void expect(result[1].variantId).toBe('var2');
      void expect(result[1].price).toBe(44);
    });
  });
});