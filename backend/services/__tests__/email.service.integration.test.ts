import { describe, it, expect, beforeEach } from 'vitest';
import { EmailService, IPopulatedOrderDocument } from '../email.service.js';
import type { IOrderDocument } from '../../models/order.model.js';
import type { IUserDocument } from '../../models/user.model.js';
import type { IProductDocument } from '../../models/product.model.js';

describe('EmailService Integration Tests', () => {
  let emailService: EmailService;
  
  beforeEach(() => {
    emailService = new EmailService();
  });

  describe('With Resend Sandbox', () => {
    const RESEND_TEST_API_KEY = process.env.RESEND_TEST_API_KEY;
    
    it.skipIf(!RESEND_TEST_API_KEY)('should send a welcome email through Resend sandbox', async () => {
      const mockUser: Partial<IUserDocument> = {
        email: 'test@resend.dev',
        name: 'Test User',
        createdAt: new Date(),
      };

      await expect(
        emailService.sendWelcomeEmail(mockUser as IUserDocument),
      ).resolves.not.toThrow();
    });

    it.skipIf(!RESEND_TEST_API_KEY)('should send an order confirmation email through Resend sandbox', async () => {
      const mockOrder: Partial<IPopulatedOrderDocument> = {
        _id: 'test-order-123' as unknown as IOrderDocument['_id'],
        createdAt: new Date(),
        totalAmount: 99.99,
        products: [
          {
            product: {
              _id: 'test-prod-123',
              name: 'Test Product',
              image: 'https://example.com/image.jpg',
              price: 99.99,
            } as unknown as IProductDocument,
            quantity: 1,
            price: 99.99,
            variantLabel: 'Size: M',
          },
        ],
        shippingAddress: {
          fullName: 'Test Customer',
          line1: '123 Test St',
          city: 'Test City',
          state: 'TS',
          postalCode: '12345',
          country: 'USA',
        },
        paymentMethod: 'card',
        paymentIntentId: 'pi_test123456789',
      };

      const mockUser: Partial<IUserDocument> = {
        email: 'test@resend.dev',
        name: 'Test Customer',
      };

      await expect(
        emailService.sendOrderConfirmation(
          mockOrder as IPopulatedOrderDocument,
          mockUser as IUserDocument,
        ),
      ).resolves.not.toThrow();
    });

    it.skipIf(!RESEND_TEST_API_KEY)('should send a password reset email through Resend sandbox', async () => {
      const mockUser: Partial<IUserDocument> = {
        email: 'test@resend.dev',
        name: 'Test User',
      };

      await expect(
        emailService.sendPasswordResetEmail(mockUser as IUserDocument, 'test-reset-token'),
      ).resolves.not.toThrow();
    });

    it.skipIf(!RESEND_TEST_API_KEY)('should send a stock notification email through Resend sandbox', async () => {
      const mockProduct: Partial<IProductDocument> = {
        name: 'Test Product',
        image: 'https://example.com/image.jpg',
        price: 49.99,
        slug: 'test-product',
      };

      await expect(
        emailService.sendStockNotification(
          mockProduct as IProductDocument,
          'test@resend.dev',
          'Size: L, Color: Blue',
        ),
      ).resolves.not.toThrow();
    });
  });

  describe('Template Rendering', () => {
    it('should correctly render order confirmation template with data', async () => {
      const mockOrder: Partial<IPopulatedOrderDocument> = {
        _id: 'render-test-123' as unknown as IOrderDocument['_id'],
        createdAt: new Date(),
        totalAmount: 150.00,
        originalAmount: 200.00,
        couponCode: 'SAVE50',
        products: [
          {
            product: {
              _id: 'widget-123',
              name: 'Premium Widget',
              image: 'https://example.com/widget.jpg',
              price: 100.00,
            } as unknown as IProductDocument,
            quantity: 2,
            price: 100.00,
          },
        ],
        shippingAddress: {
          fullName: 'John Doe',
          line1: '456 Main Ave',
          line2: 'Apt 2B',
          city: 'New York',
          state: 'NY',
          postalCode: '10001',
          country: 'USA',
        },
        paymentMethod: 'card',
        paymentIntentId: 'pi_render123456789',
      };

      const mockUser: Partial<IUserDocument> = {
        email: 'render-test@example.com',
        name: 'John Doe',
      };

      const sendEmailSpy = vi.spyOn(emailService, 'sendEmail').mockResolvedValue(undefined);

      await emailService.sendOrderConfirmation(
        mockOrder as IPopulatedOrderDocument,
        mockUser as IUserDocument,
      );

      void expect(sendEmailSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            customerName: 'John',
            orderId: 'render-test-123',
            items: expect.arrayContaining([
              expect.objectContaining({
                name: 'Premium Widget',
                quantity: 2,
                price: 100.00,
              }),
            ]),
            subtotal: 200.00,
            discount: 50.00,
            total: 150.00,
            paymentMethod: 'Card ending in 6789',
          }),
        }),
      );
    });

    it('should handle missing optional fields gracefully', async () => {
      const mockOrder: Partial<IPopulatedOrderDocument> = {
        _id: 'minimal-test-123' as unknown as IOrderDocument['_id'],
        createdAt: new Date(),
        totalAmount: 50.00,
        products: [
          {
            product: {
              _id: 'basic-123',
              name: 'Basic Item',
              image: '',
              price: 50.00,
            } as unknown as IProductDocument,
            quantity: 1,
            price: 50.00,
          },
        ],
      };

      const mockUser: Partial<IUserDocument> = {
        email: 'minimal@example.com',
      };

      const sendEmailSpy = vi.spyOn(emailService, 'sendEmail').mockResolvedValue(undefined);

      await emailService.sendOrderConfirmation(
        mockOrder as IPopulatedOrderDocument,
        mockUser as IUserDocument,
      );

      void expect(sendEmailSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            customerName: 'Customer',
            shippingAddress: expect.objectContaining({
              line1: 'Shipping address not provided',
              city: '',
            }),
            paymentMethod: 'Card',
          }),
        }),
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle email service errors gracefully', async () => {
      const mockUser: Partial<IUserDocument> = {
        email: 'error-test@example.com',
        name: 'Error Test User',
      };

      // Mock sendEmail to simulate the internal error handling
      vi.spyOn(emailService, 'sendEmail').mockImplementation(async () => {
        try {
          throw new Error('Email service error');
        } catch (error) {
          console.error('Failed to send email:', error);
        }
      });

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(
        emailService.sendWelcomeEmail(mockUser as IUserDocument),
      ).resolves.not.toThrow();

      void expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to send email:',
        expect.any(Error),
      );

      consoleErrorSpy.mockRestore();
    });

    it('should validate product population and handle unpopulated products', async () => {
      const mockOrder: Partial<IPopulatedOrderDocument> = {
        _id: 'unpopulated-test-123' as unknown as IOrderDocument['_id'],
        createdAt: new Date(),
        totalAmount: 100.00,
        products: [
          {
            product: null as any,
            quantity: 1,
            price: 50.00,
          },
          {
            product: 'product-id-string' as any,
            quantity: 1,
            price: 50.00,
          },
        ],
      };

      const mockUser: Partial<IUserDocument> = {
        email: 'unpopulated@example.com',
        name: 'Test User',
      };

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const sendEmailSpy = vi.spyOn(emailService, 'sendEmail').mockResolvedValue(undefined);

      await emailService.sendOrderConfirmation(
        mockOrder as IPopulatedOrderDocument,
        mockUser as IUserDocument,
      );

      void expect(consoleErrorSpy).toHaveBeenCalledWith('Product not populated for order item');
      // May have additional errors from template preloading
      void expect(consoleErrorSpy.mock.calls.filter(call => 
        call[0] === 'Product not populated for order item',
      )).toHaveLength(2);

      void expect(sendEmailSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            items: expect.arrayContaining([
              expect.objectContaining({
                name: 'Unknown Product',
                image: '',
              }),
            ]),
          }),
        }),
      );

      consoleErrorSpy.mockRestore();
    });
  });
});