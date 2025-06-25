import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CartService } from '../../services/cart.service.js';
import { Product } from '../../models/product.model.js';
import mongoose from 'mongoose';
import { TypedMockUtils } from '../helpers/typed-mock-utils.js';
import { mockObjectId, createMockSession } from '../helpers/mongoose-mocks.js';
import { inventoryService } from '../../services/inventory.service.js';
import type { IUserDocument } from '../../models/user.model.js';
import type { IProductDocument } from '../../models/product.model.js';
import type { IProductVariantDocument } from '../../types/product.types.js';

vi.mock('../../models/product.model.js');
vi.mock('../../services/inventory.service.js');

describe('CartService - calculateCartTotals', () => {
  let cartService: CartService;
  
  // Helper to create expected cart item from mock product
  const createExpectedCartItem = (mockProduct: any, quantity: number, variantId?: string, variantDetails?: any) => ({
    _id: String(mockProduct._id),
    name: mockProduct.name,
    description: mockProduct.description,
    price: mockProduct.price,
    image: mockProduct.image,
    collectionId: mockProduct.collectionId,
    isFeatured: mockProduct.isFeatured,
    slug: mockProduct.slug,
    quantity,
    variantId: variantId ?? undefined,
    variantDetails: variantDetails ?? undefined,
  });
  
  const createMockUser = (cartItems: { 
    product: string; 
    quantity: number;
    variantId?: string;
    variantDetails?: {
      label?: string;
      size?: string;
      color?: string;
      price: number;
      sku?: string;
    };
  }[] = [], appliedCoupon: { code: string; discountPercentage: number } | null = null): Partial<IUserDocument> => ({
    _id: new mongoose.Types.ObjectId(),
    email: 'test@example.com',
    cartItems: cartItems.map(item => ({ 
      ...item, 
      product: mockObjectId(item.product), 
    })) as IUserDocument['cartItems'],
    appliedCoupon,
    save: vi.fn(),
  });

  const createMockProduct = (id: string, price: number, name = 'Test Product', variants: Partial<IProductVariantDocument>[] = []): Partial<IProductDocument> => ({
    _id: id,
    name,
    price,
    image: 'test.jpg',
    description: 'Test description',
    isFeatured: false,
    variants: variants as IProductVariantDocument[],
  });

  beforeEach(() => {
    cartService = new CartService();
    vi.clearAllMocks();
    
    // Mock inventory service by default to return high availability
    vi.mocked(inventoryService.getAvailableInventory).mockResolvedValue(100);
    vi.mocked(inventoryService.checkAvailability).mockResolvedValue(true);
    
    // Mock mongoose startSession to return a mock session
    const mockSession = createMockSession();
    vi.spyOn(mongoose, 'startSession').mockResolvedValue(mockSession);
  });

  describe('cart calculation without coupons', () => {
    it('should calculate empty cart correctly', async () => {
      const user = createMockUser([]);
      const mockProductFind = TypedMockUtils.createProductFindMock([]);
      TypedMockUtils.bindMockToModel(Product, 'find', mockProductFind);

      const result = await cartService.calculateCartTotals(user as IUserDocument);

      void expect(result).toEqual({
        cartItems: [],
        subtotal: 0,
        totalAmount: 0,
        appliedCoupon: null,
      });
    });

    it('should calculate single item cart correctly', async () => {
      const productId = new mongoose.Types.ObjectId().toString();
      const user = createMockUser([
        { product: productId, quantity: 2 },
      ]);

      const mockProduct = createMockProduct(productId, 19.99);
      const mockProductFind = TypedMockUtils.createProductFindMock([mockProduct]);
      TypedMockUtils.bindMockToModel(Product, 'find', mockProductFind);

      const result = await cartService.calculateCartTotals(user as IUserDocument);

      void expect(result).toEqual({
        cartItems: [createExpectedCartItem(mockProduct, 2)],
        subtotal: 39.98,
        totalAmount: 39.98,
        appliedCoupon: null,
      });
    });

    it('should calculate multiple items correctly', async () => {
      const product1Id = new mongoose.Types.ObjectId().toString();
      const product2Id = new mongoose.Types.ObjectId().toString();
      
      const user = createMockUser([
        { product: product1Id, quantity: 3 },
        { product: product2Id, quantity: 1 },
      ]);

      const mockProducts = [
        createMockProduct(product1Id, 10.50, 'Product 1'),
        createMockProduct(product2Id, 25.00, 'Product 2'),
      ];
      const mockProductFind = TypedMockUtils.createProductFindMock(mockProducts);
      TypedMockUtils.bindMockToModel(Product, 'find', mockProductFind);

      const result = await cartService.calculateCartTotals(user as IUserDocument);

      void expect(result.subtotal).toBe(56.50); // (10.50 * 3) + (25.00 * 1)
      void expect(result.totalAmount).toBe(56.50);
      void expect(result.cartItems).toHaveLength(2);
    });

    it('should handle floating point precision correctly', async () => {
      const productId = new mongoose.Types.ObjectId().toString();
      const user = createMockUser([
        { product: productId, quantity: 3 },
      ]);

      const mockProduct = createMockProduct(productId, 0.10); // $0.10 each
      const mockProductFind = TypedMockUtils.createProductFindMock([mockProduct]);
      TypedMockUtils.bindMockToModel(Product, 'find', mockProductFind);

      const result = await cartService.calculateCartTotals(user as IUserDocument);

      void expect(result.subtotal).toBe(0.30); // Should be 0.30, not 0.30000000000000004
      void expect(result.totalAmount).toBe(0.30);
    });
  });

  describe('cart calculation with coupons', () => {
    it('should apply percentage discount correctly', async () => {
      const productId = new mongoose.Types.ObjectId().toString();
      const user = createMockUser(
        [{ product: productId, quantity: 2 }],
        { code: 'SAVE20', discountPercentage: 20 },
      );

      const mockProduct = createMockProduct(productId, 50.00);
      const mockProductFind = TypedMockUtils.createProductFindMock([mockProduct]);
      TypedMockUtils.bindMockToModel(Product, 'find', mockProductFind);

      const result = await cartService.calculateCartTotals(user as IUserDocument);

      void expect(result.subtotal).toBe(100.00);
      void expect(result.totalAmount).toBe(80.00); // 20% off
      void expect(result.appliedCoupon).toEqual({
        code: 'SAVE20',
        discountPercentage: 20,
      });
    });

    it('should handle 100% discount coupon', async () => {
      const productId = new mongoose.Types.ObjectId().toString();
      const user = createMockUser(
        [{ product: productId, quantity: 1 }],
        { code: 'FREE100', discountPercentage: 100 },
      );

      const mockProduct = createMockProduct(productId, 99.99);
      const mockProductFind = TypedMockUtils.createProductFindMock([mockProduct]);
      TypedMockUtils.bindMockToModel(Product, 'find', mockProductFind);

      const result = await cartService.calculateCartTotals(user as IUserDocument);

      void expect(result.subtotal).toBe(99.99);
      void expect(result.totalAmount).toBe(0);
    });

    it('should handle 0% discount coupon', async () => {
      const productId = new mongoose.Types.ObjectId().toString();
      const user = createMockUser(
        [{ product: productId, quantity: 1 }],
        { code: 'ZERO0', discountPercentage: 0 },
      );

      const mockProduct = createMockProduct(productId, 50.00);
      const mockProductFind = TypedMockUtils.createProductFindMock([mockProduct]);
      TypedMockUtils.bindMockToModel(Product, 'find', mockProductFind);

      const result = await cartService.calculateCartTotals(user as IUserDocument);

      void expect(result.subtotal).toBe(50.00);
      void expect(result.totalAmount).toBe(50.00);
    });

    it('should handle decimal percentage discounts', async () => {
      const productId = new mongoose.Types.ObjectId().toString();
      const user = createMockUser(
        [{ product: productId, quantity: 1 }],
        { code: 'PRECISE', discountPercentage: 12.5 },
      );

      const mockProduct = createMockProduct(productId, 80.00);
      const mockProductFind = TypedMockUtils.createProductFindMock([mockProduct]);
      TypedMockUtils.bindMockToModel(Product, 'find', mockProductFind);

      const result = await cartService.calculateCartTotals(user as IUserDocument);

      void expect(result.subtotal).toBe(80.00);
      void expect(result.totalAmount).toBe(70.00); // 12.5% off = $10 discount
    });

    it('should round discount calculations correctly', async () => {
      const productId = new mongoose.Types.ObjectId().toString();
      const user = createMockUser(
        [{ product: productId, quantity: 1 }],
        { code: 'THIRD', discountPercentage: 33.33 },
      );

      const mockProduct = createMockProduct(productId, 10.00);
      const mockProductFind = TypedMockUtils.createProductFindMock([mockProduct]);
      TypedMockUtils.bindMockToModel(Product, 'find', mockProductFind);

      const result = await cartService.calculateCartTotals(user as IUserDocument);

      void expect(result.subtotal).toBe(10.00);
      void expect(result.totalAmount).toBe(6.67); // 33.33% off, rounded to 2 decimals
    });
  });

  describe('edge cases and error scenarios', () => {
    it('should handle products not found in database', async () => {
      const productId = new mongoose.Types.ObjectId().toString();
      const user = createMockUser([
        { product: productId, quantity: 2 },
      ]);

      const mockProductFind = TypedMockUtils.createProductFindMock([]); // No products found
      TypedMockUtils.bindMockToModel(Product, 'find', mockProductFind);

      const result = await cartService.calculateCartTotals(user as IUserDocument);

      void expect(result).toEqual({
        cartItems: [],
        subtotal: 0,
        totalAmount: 0,
        appliedCoupon: user.appliedCoupon,
      });
    });

    it('should handle mix of found and not found products', async () => {
      const product1Id = new mongoose.Types.ObjectId().toString();
      const product2Id = new mongoose.Types.ObjectId().toString();
      
      const user = createMockUser([
        { product: product1Id, quantity: 2 },
        { product: product2Id, quantity: 1 }, // This one won't be found
      ]);

      const mockProduct = createMockProduct(product1Id, 25.00);
      const mockProductFind = TypedMockUtils.createProductFindMock([mockProduct]); // Only one product found
      TypedMockUtils.bindMockToModel(Product, 'find', mockProductFind);

      const result = await cartService.calculateCartTotals(user as IUserDocument);

      void expect(result.cartItems).toHaveLength(1);
      void expect(result.subtotal).toBe(50.00);
      void expect(result.totalAmount).toBe(50.00);
    });

    it('should handle very large quantities', async () => {
      const productId = new mongoose.Types.ObjectId().toString();
      const user = createMockUser([
        { product: productId, quantity: 1000000 },
      ]);

      const mockProduct = createMockProduct(productId, 0.01);
      const mockProductFind = TypedMockUtils.createProductFindMock([mockProduct]);
      TypedMockUtils.bindMockToModel(Product, 'find', mockProductFind);

      const result = await cartService.calculateCartTotals(user as IUserDocument);

      void expect(result.subtotal).toBe(10000.00);
      void expect(result.totalAmount).toBe(10000.00);
    });

    it('should handle very small prices with discounts', async () => {
      const productId = new mongoose.Types.ObjectId().toString();
      const user = createMockUser(
        [{ product: productId, quantity: 1 }],
        { code: 'HALF50', discountPercentage: 50 },
      );

      const mockProduct = createMockProduct(productId, 0.01);
      const mockProductFind = TypedMockUtils.createProductFindMock([mockProduct]);
      TypedMockUtils.bindMockToModel(Product, 'find', mockProductFind);

      const result = await cartService.calculateCartTotals(user as IUserDocument);

      void expect(result.subtotal).toBe(0.01);
      void expect(result.totalAmount).toBe(0.01); // Rounded up from 0.005
    });

    it('should maintain calculation consistency across multiple calls', async () => {
      const productId = new mongoose.Types.ObjectId().toString();
      const user = createMockUser(
        [{ product: productId, quantity: 7 }],
        { code: 'LUCKY7', discountPercentage: 7.77 },
      );

      const mockProduct = createMockProduct(productId, 13.37);
      const mockProductFind = TypedMockUtils.createProductFindMock([mockProduct]);
      TypedMockUtils.bindMockToModel(Product, 'find', mockProductFind);

      // Call multiple times
      const results = await Promise.all([
        cartService.calculateCartTotals(user as IUserDocument),
        cartService.calculateCartTotals(user as IUserDocument),
        cartService.calculateCartTotals(user as IUserDocument),
      ]);

      // All results should be identical
      results.forEach(result => {
        void expect(result.subtotal).toBe(93.59);
        void expect(result.totalAmount).toBe(86.32); // After 7.77% discount
      });
    });
  });

  describe('complex scenarios', () => {
    it('should handle cart with many different items and coupon', async () => {
      const productIds = Array.from({ length: 10 }, () => 
        new mongoose.Types.ObjectId().toString(),
      );
      
      const cartItems = productIds.map((id, index) => ({
        product: id,
        quantity: index + 1, // quantities: 1, 2, 3, ..., 10
      }));

      const user = createMockUser(
        cartItems,
        { code: 'MEGA25', discountPercentage: 25 },
      );

      const mockProducts = productIds.map((id, index) => 
        createMockProduct(id, (index + 1) * 10), // prices: $10, $20, $30, ..., $100
      );
      const mockProductFind = TypedMockUtils.createProductFindMock(mockProducts);
      TypedMockUtils.bindMockToModel(Product, 'find', mockProductFind);

      const result = await cartService.calculateCartTotals(user as IUserDocument);

      // Expected subtotal: 10*1 + 20*2 + 30*3 + ... + 100*10 = 3850
      void expect(result.subtotal).toBe(3850.00);
      void expect(result.totalAmount).toBe(2887.50); // 25% off
      void expect(result.cartItems).toHaveLength(10);
    });

    it('should handle updating quantities with applied coupon', async () => {
      const productId = new mongoose.Types.ObjectId().toString();
      const user = createMockUser(
        [{ product: productId, quantity: 5 }],
        { code: 'UPDATE15', discountPercentage: 15 },
      );

      const mockProduct = createMockProduct(productId, 20.00);
      const mockProductFind = TypedMockUtils.createProductFindMock([mockProduct]);
      TypedMockUtils.bindMockToModel(Product, 'find', mockProductFind);

      // Initial calculation
      const result1 = await cartService.calculateCartTotals(user as IUserDocument);
      void expect(result1.subtotal).toBe(100.00);
      void expect(result1.totalAmount).toBe(85.00);

      // Simulate quantity update
      if (user.cartItems?.[0]) {
        user.cartItems[0].quantity = 10;
      }
      
      // Recalculate
      const result2 = await cartService.calculateCartTotals(user as IUserDocument);
      void expect(result2.subtotal).toBe(200.00);
      void expect(result2.totalAmount).toBe(170.00);
      
      // Coupon should still be applied
      void expect(result2.appliedCoupon).toEqual({
        code: 'UPDATE15',
        discountPercentage: 15,
      });
    });
  });

  describe('variant support', () => {
    it('should calculate cart with variant items correctly', async () => {
      const productId = new mongoose.Types.ObjectId().toString();
      const user = createMockUser([
        { 
          product: productId, 
          quantity: 2,
          variantId: 'var-1',
          variantDetails: {
            size: 'M',
            color: 'Blue',
            price: 29.99,
            sku: 'SHIRT-M-BLUE',
          },
        },
      ]);

      const mockProduct = createMockProduct(productId, 19.99, 'T-Shirt', [
        { variantId: 'var-1', size: 'M', color: 'Blue', price: 29.99, inventory: 10, sku: 'SHIRT-M-BLUE' },
      ]);
      const mockProductFind = TypedMockUtils.createProductFindMock([mockProduct]);
      TypedMockUtils.bindMockToModel(Product, 'find', mockProductFind);

      const result = await cartService.calculateCartTotals(user as IUserDocument);

      void expect(result.cartItems[0].price).toBe(29.99); // Should use variant price
      void expect(result.cartItems[0].variantId).toBe('var-1');
      void expect(result.cartItems[0].variantDetails).toEqual({
        size: 'M',
        color: 'Blue',
        price: 29.99,
        sku: 'SHIRT-M-BLUE',
      });
      void expect(result.subtotal).toBe(59.98); // 29.99 * 2
    });

    it('should handle mixed cart with variants and non-variants', async () => {
      const product1Id = new mongoose.Types.ObjectId().toString();
      const product2Id = new mongoose.Types.ObjectId().toString();
      
      const user = createMockUser([
        { 
          product: product1Id, 
          quantity: 1,
          variantId: 'var-xl',
          variantDetails: {
            size: 'XL',
            price: 35.00,
          },
        },
        { 
          product: product2Id, 
          quantity: 3,
        },
      ]);

      const mockProducts = [
        createMockProduct(product1Id, 30.00, 'Hoodie', [
          { variantId: 'var-xl', size: 'XL', price: 35.00, inventory: 5 },
        ]),
        createMockProduct(product2Id, 15.00, 'Basic Item'),
      ];
      const mockProductFind = TypedMockUtils.createProductFindMock(mockProducts);
      TypedMockUtils.bindMockToModel(Product, 'find', mockProductFind);

      const result = await cartService.calculateCartTotals(user as IUserDocument);

      void expect(result.subtotal).toBe(80.00); // (35.00 * 1) + (15.00 * 3)
      void expect(result.cartItems).toHaveLength(2);
      void expect(result.cartItems[0].price).toBe(35.00); // Variant price
      void expect(result.cartItems[1].price).toBe(15.00); // Base price
    });

    it('should fetch variant details if not cached', async () => {
      const productId = new mongoose.Types.ObjectId().toString();
      const user = createMockUser([
        { 
          product: productId, 
          quantity: 1,
          variantId: 'var-red-s', // No variantDetails cached
        },
      ]);

      const mockProduct = createMockProduct(productId, 20.00, 'Polo Shirt', [
        { variantId: 'var-red-s', size: 'S', color: 'Red', price: 22.50, inventory: 8, sku: 'POLO-S-RED' },
      ]);
      const mockProductFind = TypedMockUtils.createProductFindMock([mockProduct]);
      TypedMockUtils.bindMockToModel(Product, 'find', mockProductFind);

      const result = await cartService.calculateCartTotals(user as IUserDocument);

      void expect(result.cartItems[0].price).toBe(22.50);
      void expect(result.cartItems[0].variantDetails).toEqual({
        size: 'S',
        color: 'Red',
        price: 22.50,
        sku: 'POLO-S-RED',
      });
    });

    it('should handle same product with different variants', async () => {
      const productId = new mongoose.Types.ObjectId().toString();
      const user = createMockUser([
        { 
          product: productId, 
          quantity: 2,
          variantId: 'var-black-m',
          variantDetails: { color: 'Black', size: 'M', price: 25.00 },
        },
        { 
          product: productId, 
          quantity: 1,
          variantId: 'var-white-l',
          variantDetails: { color: 'White', size: 'L', price: 27.00 },
        },
      ]);

      const mockProduct = createMockProduct(productId, 20.00, 'Shirt', [
        { variantId: 'var-black-m', size: 'M', color: 'Black', price: 25.00, inventory: 5 },
        { variantId: 'var-white-l', size: 'L', color: 'White', price: 27.00, inventory: 3 },
      ]);
      const mockProductFind = TypedMockUtils.createProductFindMock([mockProduct]);
      TypedMockUtils.bindMockToModel(Product, 'find', mockProductFind);

      const result = await cartService.calculateCartTotals(user as IUserDocument);

      void expect(result.cartItems).toHaveLength(2);
      void expect(result.subtotal).toBe(77.00); // (25.00 * 2) + (27.00 * 1)
    });

    it('should apply coupon discount to variant prices', async () => {
      const productId = new mongoose.Types.ObjectId().toString();
      const user = createMockUser(
        [
          { 
            product: productId, 
            quantity: 2,
            variantId: 'premium-var',
            variantDetails: { price: 100.00, sku: 'PREMIUM-001' },
          },
        ],
        { code: 'SAVE30', discountPercentage: 30 },
      );

      const mockProduct = createMockProduct(productId, 80.00, 'Premium Item', [
        { variantId: 'premium-var', price: 100.00, inventory: 10, sku: 'PREMIUM-001' },
      ]);
      const mockProductFind = TypedMockUtils.createProductFindMock([mockProduct]);
      TypedMockUtils.bindMockToModel(Product, 'find', mockProductFind);

      const result = await cartService.calculateCartTotals(user as IUserDocument);

      void expect(result.subtotal).toBe(200.00); // 100.00 * 2
      void expect(result.totalAmount).toBe(140.00); // 30% off
    });
  });

  describe('addToCart with variants', () => {
    it('should add item with variant successfully', async () => {
      const productId = new mongoose.Types.ObjectId().toString();
      const mockProduct = createMockProduct(productId, 20.00, 'T-Shirt', [
        { variantId: 'var-1', size: 'M', color: 'Blue', price: 25.00, inventory: 5, sku: 'SHIRT-M-BLUE' },
      ]);
      
      const mockProductFindById = TypedMockUtils.createProductFindByIdMock(mockProduct);
      TypedMockUtils.bindMockToModel(Product, 'findById', mockProductFindById);

      const user = createMockUser([]);
      await cartService.addToCart(user as IUserDocument, productId, 'var-1');

      void expect(user.save).toHaveBeenCalled();
      void expect(user.cartItems).toHaveLength(1);
      void expect(user.cartItems?.[0]?.variantId).toBe('var-1');
      void expect(user.cartItems?.[0]?.variantDetails).toEqual({
        size: 'M',
        color: 'Blue',
        price: 25.00,
        sku: 'SHIRT-M-BLUE',
      });
    });

    it('should reject adding out of stock variant', async () => {
      const productId = new mongoose.Types.ObjectId().toString();
      const mockProduct = createMockProduct(productId, 20.00, 'T-Shirt', [
        { variantId: 'var-1', size: 'M', color: 'Blue', price: 25.00, inventory: 0, sku: 'SHIRT-M-BLUE' },
      ]);
      
      const mockProductFindById = TypedMockUtils.createProductFindByIdMock(mockProduct);
      TypedMockUtils.bindMockToModel(Product, 'findById', mockProductFindById);
      
      // Mock inventory service to return 0 for this specific variant
      vi.mocked(inventoryService.getAvailableInventory).mockResolvedValue(0);

      const user = createMockUser([]);
      
      await expect(cartService.addToCart(user as IUserDocument, productId, 'var-1'))
        .rejects.toThrow('out of stock');
    });

    it('should reject adding non-existent variant', async () => {
      const productId = new mongoose.Types.ObjectId().toString();
      const mockProduct = createMockProduct(productId, 20.00, 'T-Shirt', [
        { variantId: 'var-1', size: 'M', color: 'Blue', price: 25.00, inventory: 5 },
      ]);
      
      const mockProductFindById = TypedMockUtils.createProductFindByIdMock(mockProduct);
      TypedMockUtils.bindMockToModel(Product, 'findById', mockProductFindById);

      const user = createMockUser([]);
      
      await expect(cartService.addToCart(user as IUserDocument, productId, 'non-existent'))
        .rejects.toThrow('Variant with ID non-existent not found');
    });

    it('should increment quantity for existing variant item', async () => {
      const productId = new mongoose.Types.ObjectId().toString();
      const mockProduct = createMockProduct(productId, 20.00, 'T-Shirt', [
        { variantId: 'var-1', size: 'M', color: 'Blue', price: 25.00, inventory: 10 },
      ]);
      
      const mockProductFindById = TypedMockUtils.createProductFindByIdMock(mockProduct);
      TypedMockUtils.bindMockToModel(Product, 'findById', mockProductFindById);

      const user = createMockUser([
        { 
          product: productId, 
          quantity: 1,
          variantId: 'var-1',
          variantDetails: { size: 'M', color: 'Blue', price: 25.00 },
        },
      ]);

      await cartService.addToCart(user as IUserDocument, productId, 'var-1');

      void expect(user.cartItems).toHaveLength(1);
      void expect(user.cartItems?.[0]?.quantity).toBe(2);
    });

    it('should check inventory limits when adding to existing', async () => {
      const productId = new mongoose.Types.ObjectId().toString();
      const mockProduct = createMockProduct(productId, 20.00, 'T-Shirt', [
        { variantId: 'var-1', size: 'M', color: 'Blue', price: 25.00, inventory: 2 },
      ]);
      
      const mockProductFindById = TypedMockUtils.createProductFindByIdMock(mockProduct);
      TypedMockUtils.bindMockToModel(Product, 'findById', mockProductFindById);
      
      // Mock inventory service to return only 2 available
      vi.mocked(inventoryService.getAvailableInventory).mockResolvedValue(2);

      const user = createMockUser([
        { 
          product: productId, 
          quantity: 2,
          variantId: 'var-1',
        },
      ]);

      await expect(cartService.addToCart(user as IUserDocument, productId, 'var-1'))
        .rejects.toThrow('Cannot add more items. Only 2 available in stock');
    });
  });

  describe('updateQuantity with variants', () => {
    it('should update variant item quantity', async () => {
      const productId = new mongoose.Types.ObjectId().toString();
      const user = createMockUser([
        { 
          product: productId, 
          quantity: 2,
          variantId: 'var-1',
        },
      ]);

      await cartService.updateQuantity(user as IUserDocument, productId, 5, 'var-1');

      void expect(user.cartItems?.[0]?.quantity).toBe(5);
      void expect(user.save).toHaveBeenCalled();
    });

    it('should check inventory when updating variant quantity', async () => {
      const productId = new mongoose.Types.ObjectId().toString();
      const mockProduct = createMockProduct(productId, 20.00, 'T-Shirt', [
        { variantId: 'var-1', size: 'M', color: 'Blue', price: 25.00, inventory: 3 },
      ]);
      
      const mockProductFindById = TypedMockUtils.createProductFindByIdMock(mockProduct);
      TypedMockUtils.bindMockToModel(Product, 'findById', mockProductFindById);
      
      // Mock inventory service to return only 3 available
      vi.mocked(inventoryService.getAvailableInventory).mockResolvedValue(3);

      const user = createMockUser([
        { 
          product: productId, 
          quantity: 1,
          variantId: 'var-1',
        },
      ]);

      await expect(cartService.updateQuantity(user as IUserDocument, productId, 5, 'var-1'))
        .rejects.toThrow('Cannot update quantity. Only 3 available in stock');
    });

    it('should remove variant item when quantity is 0', async () => {
      const productId = new mongoose.Types.ObjectId().toString();
      const user = createMockUser([
        { 
          product: productId, 
          quantity: 2,
          variantId: 'var-1',
        },
      ]);

      await cartService.updateQuantity(user as IUserDocument, productId, 0, 'var-1');

      void expect(user.cartItems).toHaveLength(0);
    });
  });

  describe('removeFromCart with variants', () => {
    it('should remove specific variant item', async () => {
      const productId = new mongoose.Types.ObjectId().toString();
      const user = createMockUser([
        { product: productId, quantity: 1, variantId: 'var-1' },
        { product: productId, quantity: 2, variantId: 'var-2' },
        { product: productId, quantity: 1 }, // No variant
      ]);

      await cartService.removeFromCart(user as IUserDocument, productId, 'var-1');

      void expect(user.cartItems).toHaveLength(2);
      void expect(user.cartItems?.find(item => item.variantId === 'var-1')).toBeUndefined();
    });

    it('should remove non-variant item when variantId is not specified', async () => {
      const productId = new mongoose.Types.ObjectId().toString();
      const user = createMockUser([
        { product: productId, quantity: 1, variantId: 'var-1' },
        { product: productId, quantity: 1 }, // No variant
      ]);

      await cartService.removeFromCart(user as IUserDocument, productId);

      void expect(user.cartItems).toHaveLength(1);
      void expect(user.cartItems?.[0]?.variantId).toBe('var-1');
    });
  });
});