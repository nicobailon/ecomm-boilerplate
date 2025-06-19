import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CartService } from '../../services/cart.service.js';
import { Product } from '../../models/product.model.js';
import mongoose from 'mongoose';

vi.mock('../../models/product.model.js');

describe('CartService - calculateCartTotals', () => {
  let cartService: CartService;
  
  const createMockUser = (cartItems: Array<{ product: string; quantity: number }> = [], appliedCoupon: { code: string; discountPercentage: number } | null = null) => ({
    _id: new mongoose.Types.ObjectId(),
    email: 'test@example.com',
    cartItems,
    appliedCoupon,
    save: vi.fn()
  });

  const createMockProduct = (id: string, price: number, name = 'Test Product') => ({
    _id: id,
    name,
    price,
    image: 'test.jpg',
    description: 'Test description',
    category: 'test',
    isFeatured: false
  });

  beforeEach(() => {
    cartService = new CartService();
    vi.clearAllMocks();
  });

  describe('cart calculation without coupons', () => {
    it('should calculate empty cart correctly', async () => {
      const user = createMockUser([]);
      vi.mocked(Product.find).mockResolvedValue([]);

      const result = await cartService.calculateCartTotals(user as any);

      expect(result).toEqual({
        cartItems: [],
        subtotal: 0,
        totalAmount: 0,
        appliedCoupon: null
      });
    });

    it('should calculate single item cart correctly', async () => {
      const productId = new mongoose.Types.ObjectId().toString();
      const user = createMockUser([
        { product: productId, quantity: 2 }
      ]);

      const mockProduct = createMockProduct(productId, 19.99);
      vi.mocked(Product.find).mockResolvedValue([mockProduct]);

      const result = await cartService.calculateCartTotals(user as any);

      expect(result).toEqual({
        cartItems: [{ ...mockProduct, quantity: 2 }],
        subtotal: 39.98,
        totalAmount: 39.98,
        appliedCoupon: null
      });
    });

    it('should calculate multiple items correctly', async () => {
      const product1Id = new mongoose.Types.ObjectId().toString();
      const product2Id = new mongoose.Types.ObjectId().toString();
      
      const user = createMockUser([
        { product: product1Id, quantity: 3 },
        { product: product2Id, quantity: 1 }
      ]);

      const mockProducts = [
        createMockProduct(product1Id, 10.50, 'Product 1'),
        createMockProduct(product2Id, 25.00, 'Product 2')
      ];
      vi.mocked(Product.find).mockResolvedValue(mockProducts);

      const result = await cartService.calculateCartTotals(user as any);

      expect(result.subtotal).toBe(56.50); // (10.50 * 3) + (25.00 * 1)
      expect(result.totalAmount).toBe(56.50);
      expect(result.cartItems).toHaveLength(2);
    });

    it('should handle floating point precision correctly', async () => {
      const productId = new mongoose.Types.ObjectId().toString();
      const user = createMockUser([
        { product: productId, quantity: 3 }
      ]);

      const mockProduct = createMockProduct(productId, 0.10); // $0.10 each
      vi.mocked(Product.find).mockResolvedValue([mockProduct]);

      const result = await cartService.calculateCartTotals(user as any);

      expect(result.subtotal).toBe(0.30); // Should be 0.30, not 0.30000000000000004
      expect(result.totalAmount).toBe(0.30);
    });
  });

  describe('cart calculation with coupons', () => {
    it('should apply percentage discount correctly', async () => {
      const productId = new mongoose.Types.ObjectId().toString();
      const user = createMockUser(
        [{ product: productId, quantity: 2 }],
        { code: 'SAVE20', discountPercentage: 20 }
      );

      const mockProduct = createMockProduct(productId, 50.00);
      vi.mocked(Product.find).mockResolvedValue([mockProduct]);

      const result = await cartService.calculateCartTotals(user as any);

      expect(result.subtotal).toBe(100.00);
      expect(result.totalAmount).toBe(80.00); // 20% off
      expect(result.appliedCoupon).toEqual({
        code: 'SAVE20',
        discountPercentage: 20
      });
    });

    it('should handle 100% discount coupon', async () => {
      const productId = new mongoose.Types.ObjectId().toString();
      const user = createMockUser(
        [{ product: productId, quantity: 1 }],
        { code: 'FREE100', discountPercentage: 100 }
      );

      const mockProduct = createMockProduct(productId, 99.99);
      vi.mocked(Product.find).mockResolvedValue([mockProduct]);

      const result = await cartService.calculateCartTotals(user as any);

      expect(result.subtotal).toBe(99.99);
      expect(result.totalAmount).toBe(0);
    });

    it('should handle 0% discount coupon', async () => {
      const productId = new mongoose.Types.ObjectId().toString();
      const user = createMockUser(
        [{ product: productId, quantity: 1 }],
        { code: 'ZERO0', discountPercentage: 0 }
      );

      const mockProduct = createMockProduct(productId, 50.00);
      vi.mocked(Product.find).mockResolvedValue([mockProduct]);

      const result = await cartService.calculateCartTotals(user as any);

      expect(result.subtotal).toBe(50.00);
      expect(result.totalAmount).toBe(50.00);
    });

    it('should handle decimal percentage discounts', async () => {
      const productId = new mongoose.Types.ObjectId().toString();
      const user = createMockUser(
        [{ product: productId, quantity: 1 }],
        { code: 'PRECISE', discountPercentage: 12.5 }
      );

      const mockProduct = createMockProduct(productId, 80.00);
      vi.mocked(Product.find).mockResolvedValue([mockProduct]);

      const result = await cartService.calculateCartTotals(user as any);

      expect(result.subtotal).toBe(80.00);
      expect(result.totalAmount).toBe(70.00); // 12.5% off = $10 discount
    });

    it('should round discount calculations correctly', async () => {
      const productId = new mongoose.Types.ObjectId().toString();
      const user = createMockUser(
        [{ product: productId, quantity: 1 }],
        { code: 'THIRD', discountPercentage: 33.33 }
      );

      const mockProduct = createMockProduct(productId, 10.00);
      vi.mocked(Product.find).mockResolvedValue([mockProduct]);

      const result = await cartService.calculateCartTotals(user as any);

      expect(result.subtotal).toBe(10.00);
      expect(result.totalAmount).toBe(6.67); // 33.33% off, rounded to 2 decimals
    });
  });

  describe('edge cases and error scenarios', () => {
    it('should handle products not found in database', async () => {
      const productId = new mongoose.Types.ObjectId().toString();
      const user = createMockUser([
        { product: productId, quantity: 2 }
      ]);

      vi.mocked(Product.find).mockResolvedValue([]); // No products found

      const result = await cartService.calculateCartTotals(user as any);

      expect(result).toEqual({
        cartItems: [],
        subtotal: 0,
        totalAmount: 0,
        appliedCoupon: user.appliedCoupon
      });
    });

    it('should handle mix of found and not found products', async () => {
      const product1Id = new mongoose.Types.ObjectId().toString();
      const product2Id = new mongoose.Types.ObjectId().toString();
      
      const user = createMockUser([
        { product: product1Id, quantity: 2 },
        { product: product2Id, quantity: 1 } // This one won't be found
      ]);

      const mockProduct = createMockProduct(product1Id, 25.00);
      vi.mocked(Product.find).mockResolvedValue([mockProduct]); // Only one product found

      const result = await cartService.calculateCartTotals(user as any);

      expect(result.cartItems).toHaveLength(1);
      expect(result.subtotal).toBe(50.00);
      expect(result.totalAmount).toBe(50.00);
    });

    it('should handle very large quantities', async () => {
      const productId = new mongoose.Types.ObjectId().toString();
      const user = createMockUser([
        { product: productId, quantity: 1000000 }
      ]);

      const mockProduct = createMockProduct(productId, 0.01);
      vi.mocked(Product.find).mockResolvedValue([mockProduct]);

      const result = await cartService.calculateCartTotals(user as any);

      expect(result.subtotal).toBe(10000.00);
      expect(result.totalAmount).toBe(10000.00);
    });

    it('should handle very small prices with discounts', async () => {
      const productId = new mongoose.Types.ObjectId().toString();
      const user = createMockUser(
        [{ product: productId, quantity: 1 }],
        { code: 'HALF50', discountPercentage: 50 }
      );

      const mockProduct = createMockProduct(productId, 0.01);
      vi.mocked(Product.find).mockResolvedValue([mockProduct]);

      const result = await cartService.calculateCartTotals(user as any);

      expect(result.subtotal).toBe(0.01);
      expect(result.totalAmount).toBe(0.01); // Rounded up from 0.005
    });

    it('should maintain calculation consistency across multiple calls', async () => {
      const productId = new mongoose.Types.ObjectId().toString();
      const user = createMockUser(
        [{ product: productId, quantity: 7 }],
        { code: 'LUCKY7', discountPercentage: 7.77 }
      );

      const mockProduct = createMockProduct(productId, 13.37);
      vi.mocked(Product.find).mockResolvedValue([mockProduct]);

      // Call multiple times
      const results = await Promise.all([
        cartService.calculateCartTotals(user as any),
        cartService.calculateCartTotals(user as any),
        cartService.calculateCartTotals(user as any)
      ]);

      // All results should be identical
      results.forEach(result => {
        expect(result.subtotal).toBe(93.59);
        expect(result.totalAmount).toBe(86.32); // After 7.77% discount
      });
    });
  });

  describe('complex scenarios', () => {
    it('should handle cart with many different items and coupon', async () => {
      const productIds = Array.from({ length: 10 }, () => 
        new mongoose.Types.ObjectId().toString()
      );
      
      const cartItems = productIds.map((id, index) => ({
        product: id,
        quantity: index + 1 // quantities: 1, 2, 3, ..., 10
      }));

      const user = createMockUser(
        cartItems,
        { code: 'MEGA25', discountPercentage: 25 }
      );

      const mockProducts = productIds.map((id, index) => 
        createMockProduct(id, (index + 1) * 10) // prices: $10, $20, $30, ..., $100
      );
      vi.mocked(Product.find).mockResolvedValue(mockProducts);

      const result = await cartService.calculateCartTotals(user as any);

      // Expected subtotal: 10*1 + 20*2 + 30*3 + ... + 100*10 = 3850
      expect(result.subtotal).toBe(3850.00);
      expect(result.totalAmount).toBe(2887.50); // 25% off
      expect(result.cartItems).toHaveLength(10);
    });

    it('should handle updating quantities with applied coupon', async () => {
      const productId = new mongoose.Types.ObjectId().toString();
      const user = createMockUser(
        [{ product: productId, quantity: 5 }],
        { code: 'UPDATE15', discountPercentage: 15 }
      );

      const mockProduct = createMockProduct(productId, 20.00);
      vi.mocked(Product.find).mockResolvedValue([mockProduct]);

      // Initial calculation
      const result1 = await cartService.calculateCartTotals(user as any);
      expect(result1.subtotal).toBe(100.00);
      expect(result1.totalAmount).toBe(85.00);

      // Simulate quantity update
      user.cartItems[0].quantity = 10;
      
      // Recalculate
      const result2 = await cartService.calculateCartTotals(user as any);
      expect(result2.subtotal).toBe(200.00);
      expect(result2.totalAmount).toBe(170.00);
      
      // Coupon should still be applied
      expect(result2.appliedCoupon).toEqual({
        code: 'UPDATE15',
        discountPercentage: 15
      });
    });
  });
});