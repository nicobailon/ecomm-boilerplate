import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import mongoose from 'mongoose';
import { cartService } from '../cart.service.js';
import { Product } from '../../models/product.model.js';
import { IUserDocument } from '../../models/user.model.js';

// Mock mongoose and models
vi.mock('mongoose', async (importOriginal) => {
  const actual = await importOriginal() as any;
  
  // Create a mock ObjectId class
  class MockObjectId {
    private id: string;
    
    constructor(id: string) {
      this.id = id;
    }
    
    toString() {
      return this.id;
    }
    
    equals(other: any) {
      return this.id === (other?.toString ? other.toString() : other);
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
    reserveInventory: vi.fn().mockResolvedValue({
      success: true,
      reservationId: 'reservation123',
      reservedQuantity: 1,
    }),
    releaseReservation: vi.fn().mockResolvedValue(true),
    releaseSessionReservations: vi.fn().mockResolvedValue(true),
  },
}));

describe('CartService', () => {
  let mockUser: IUserDocument;
  let mockSession: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockSession = {
      startTransaction: vi.fn(),
      commitTransaction: vi.fn(),
      abortTransaction: vi.fn(),
      endSession: vi.fn(),
    };
    
    vi.spyOn(mongoose, 'startSession').mockResolvedValue(mockSession);
    
    mockUser = {
      _id: new mongoose.Types.ObjectId('user123'),
      cartItems: [],
      save: vi.fn().mockResolvedValue(true),
    } as any;
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

      vi.mocked(Product.findById).mockImplementation(() => ({
        session: vi.fn().mockResolvedValue(product),
      } as any));

      vi.mocked(Product.findOneAndUpdate).mockResolvedValue(product);

      // Add first variant
      await cartService.addToCart(mockUser, productId, 'var1');
      expect(mockUser.cartItems).toHaveLength(1);
      expect(mockUser.cartItems[0]).toMatchObject({
        product: expect.objectContaining({ toString: expect.any(Function) }),
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
      expect(mockUser.cartItems).toHaveLength(2);
      expect(mockUser.cartItems[1]).toMatchObject({
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

      vi.mocked(Product.findById).mockImplementation(() => ({
        session: vi.fn().mockResolvedValue(product),
      } as any));

      // Mock inventory check to return false for out of stock
      const { inventoryService } = await import('../inventory.service.js');
      vi.mocked(inventoryService.checkAvailability).mockResolvedValueOnce(false);
      vi.mocked(inventoryService.getAvailableInventory).mockResolvedValueOnce(0);
      vi.mocked(inventoryService.reserveInventory).mockResolvedValueOnce({
        success: false,
        message: 'Variant var1 is out of stock',
      } as any);
      
      await expect(
        cartService.addToCart(mockUser, productId, 'var1')
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

      vi.mocked(Product.find).mockImplementation(() => ({
        lean: vi.fn().mockResolvedValue([product]),
      } as any));

      const result = await cartService.calculateCartTotals(mockUser);
      
      expect(result.subtotal).toBe(240); // 2 * 120 (variant price), not 2 * 100
      expect(result.totalAmount).toBe(240);
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

      vi.mocked(Product.findById).mockImplementation(() => ({
        session: vi.fn().mockResolvedValue(product),
      } as any));
      
      // Mock inventory check for product without variants
      const { inventoryService } = await import('../inventory.service.js');
      vi.mocked(inventoryService.checkAvailability).mockResolvedValue(true);
      vi.mocked(inventoryService.reserveInventory).mockResolvedValue({
        success: true,
        reservationId: 'reservation123',
        reservedQuantity: 1,
      });

      await cartService.addToCart(mockUser, productId);
      
      expect(mockUser.cartItems).toHaveLength(1);
      expect(mockUser.cartItems[0]).toMatchObject({
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

      vi.mocked(Product.findById).mockImplementation(() => ({
        session: vi.fn().mockResolvedValue(product),
      } as any));
      
      // Mock the atomic update to succeed (validates but doesn't decrement)
      vi.mocked(Product.findOneAndUpdate).mockResolvedValue(product);

      // Mock inventory check to fail
      const { inventoryService } = await import('../inventory.service.js');
      vi.mocked(inventoryService.checkAvailability).mockResolvedValueOnce(false);
      vi.mocked(inventoryService.getAvailableInventory).mockResolvedValueOnce(2);
      
      await expect(
        cartService.addToCart(mockUser, productId, 'var1')
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

      vi.mocked(Product.findOneAndUpdate).mockResolvedValue(null); // Simulate not enough inventory
      vi.mocked(Product.findById).mockImplementation(() => ({
        session: vi.fn().mockResolvedValue(product),
      } as any));

      // Mock inventory check to fail for quantity update
      const { inventoryService } = await import('../inventory.service.js');
      vi.mocked(inventoryService.checkAvailability).mockResolvedValueOnce(false);
      vi.mocked(inventoryService.getAvailableInventory).mockResolvedValueOnce(3);
      
      await expect(
        cartService.updateQuantity(mockUser, productId, 5, 'var1')
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
      
      expect(mockUser.cartItems).toHaveLength(0);
      expect(mockUser.save).toHaveBeenCalled();
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
      
      expect(mockUser.cartItems).toHaveLength(1);
      expect(mockUser.cartItems[0].variantId).toBe('var2');
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
      
      expect(mockUser.cartItems).toHaveLength(1);
      expect(mockUser.cartItems[0].variantId).toBe('var1');
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

      vi.mocked(Product.find).mockImplementation(() => ({
        lean: vi.fn().mockResolvedValue([product]),
      } as any));

      const result = await cartService.getCartProducts(mockUser);
      
      expect(result[0]).toMatchObject({
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

      vi.mocked(Product.find).mockImplementation(() => ({
        lean: vi.fn().mockResolvedValue([product]),
      } as any));

      const result = await cartService.getCartProducts(mockUser);
      
      expect(result).toHaveLength(2);
      expect(result[0].variantId).toBe('var1');
      expect(result[0].price).toBe(42);
      expect(result[1].variantId).toBe('var2');
      expect(result[1].price).toBe(44);
    });
  });
});