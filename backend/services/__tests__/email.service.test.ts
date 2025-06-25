import { describe, it, expect, beforeEach, vi, afterEach, MockedFunction } from 'vitest';
import { EmailService, IPopulatedOrderDocument } from '../email.service.js';
import { EmailTemplate } from '../../types/email.types.js';
import type { IOrderDocument } from '../../models/order.model.js';
import type { IUserDocument } from '../../models/user.model.js';
import type { IProductDocument } from '../../models/product.model.js';
import ejs from 'ejs';
import fs from 'fs/promises';
import type { Resend } from 'resend';

vi.mock('../../lib/resend', () => {
  const mockResend: { emails: { send: MockedFunction<Resend['emails']['send']> } } = {
    emails: {
      send: vi.fn(),
    },
  };
  
  return {
    resend: mockResend,
    isEmailEnabled: vi.fn(() => false),
    getFromEmail: vi.fn(() => 'noreply@example.com'),
    getFromName: vi.fn(() => 'MERN E-commerce'),
  };
});

vi.mock('ejs');
vi.mock('fs/promises');

describe('EmailService', () => {
  let emailService: EmailService;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let mockResend: { emails: { send: MockedFunction<Resend['emails']['send']> } };
  let mockIsEmailEnabled: ReturnType<typeof vi.fn>;
  let mockGetFromEmail: ReturnType<typeof vi.fn>;
  let mockGetFromName: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    const resendModule = await import('../../lib/resend.js');
    mockResend = resendModule.resend as unknown as { emails: { send: MockedFunction<Resend['emails']['send']> } };
    mockIsEmailEnabled = resendModule.isEmailEnabled as ReturnType<typeof vi.fn>;
    mockGetFromEmail = resendModule.getFromEmail as ReturnType<typeof vi.fn>;
    mockGetFromName = resendModule.getFromName as ReturnType<typeof vi.fn>;
    
    emailService = new EmailService();
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.clearAllMocks();
    mockIsEmailEnabled.mockReturnValue(false);
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('sendEmail', () => {
    const mockEmailOptions = {
      to: 'test@example.com',
      subject: 'Test Subject',
      template: EmailTemplate.WELCOME,
      data: { firstName: 'John' },
    };

    it('should send email successfully when resend client is available', async () => {
      mockResend.emails.send.mockResolvedValue({ data: { id: 'email-123' }, error: null });
      mockIsEmailEnabled.mockReturnValue(true);
      
      const mockHtml = '<html>Welcome John!</html>';
      const mockText = 'Welcome John!';
      vi.mocked(ejs.renderFile).mockResolvedValue(mockHtml);
      
      const generateTextVersionSpy = vi.spyOn(emailService, 'generateTextVersion').mockReturnValue(mockText);

      await emailService.sendEmail(mockEmailOptions);

      void expect(mockResend.emails.send).toHaveBeenCalledWith({
        from: 'MERN E-commerce <noreply@example.com>',
        to: 'test@example.com',
        subject: 'Test Subject',
        html: mockHtml,
        text: mockText,
        attachments: undefined,
      });

      generateTextVersionSpy.mockRestore();
    });

    it('should handle multiple recipients', async () => {
      mockResend.emails.send.mockResolvedValue({ data: { id: 'email-123' }, error: null });
      mockIsEmailEnabled.mockReturnValue(true);
      vi.mocked(ejs.renderFile).mockResolvedValue('<html>Content</html>');

      await emailService.sendEmail({
        ...mockEmailOptions,
        to: ['user1@example.com', 'user2@example.com'],
      });

      void expect(mockResend.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: ['user1@example.com', 'user2@example.com'],
        }),
      );
    });

    it('should log to console when resend is not configured', async () => {
      mockIsEmailEnabled.mockReturnValue(false);
      vi.mocked(ejs.renderFile).mockResolvedValue('<html>Content</html>');

      await emailService.sendEmail(mockEmailOptions);

      void expect(consoleLogSpy).toHaveBeenCalledWith(
        'Email service not configured. Would send email:',
        expect.objectContaining({
          to: 'test@example.com',
          subject: 'Test Subject',
        }),
      );
      void expect(mockResend.emails.send).not.toHaveBeenCalled();
    });

    it('should handle template rendering errors gracefully', async () => {
      mockIsEmailEnabled.mockReturnValue(true);
      vi.mocked(ejs.renderFile).mockRejectedValue(new Error('Template error'));
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(emailService.sendEmail(mockEmailOptions)).resolves.not.toThrow();
      void expect(mockResend.emails.send).not.toHaveBeenCalled();
      void expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[EmailService] Failed to send'),
        expect.objectContaining({ error: expect.any(String) }),
      );
      
      consoleErrorSpy.mockRestore();
    });

    it('should handle email sending errors gracefully', async () => {
      mockResend.emails.send.mockRejectedValue(new Error('Network error'));
      mockIsEmailEnabled.mockReturnValue(true);
      vi.mocked(ejs.renderFile).mockResolvedValue('<html>Content</html>');
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(emailService.sendEmail(mockEmailOptions)).resolves.not.toThrow();
      void expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[EmailService] Failed to send'),
        expect.objectContaining({ error: expect.any(String) }),
      );
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('sendOrderConfirmation', () => {
    const mockOrder: Partial<IPopulatedOrderDocument> = {
      _id: 'order-123' as unknown as IOrderDocument['_id'],
      createdAt: new Date('2024-01-01'),
      totalAmount: 150.00,
      products: [
        {
          product: { _id: 'prod1', name: 'Product 1', image: 'image1.jpg' } as unknown as IProductDocument,
          quantity: 2,
          price: 50.00,
          variantLabel: 'Size: M, Color: Blue',
        },
        {
          product: { _id: 'prod2', name: 'Product 2', image: 'image2.jpg' } as unknown as IProductDocument,
          quantity: 1,
          price: 50.00,
        },
      ],
      shippingAddress: {
        line1: '123 Main St',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'USA',
      } as IOrderDocument['shippingAddress'],
      paymentMethod: 'card',
      paymentIntentId: 'pi_123456789',
    };

    const mockUser: Partial<IUserDocument> = {
      email: 'customer@example.com',
      name: 'John Doe',
    };

    it('should send order confirmation email with correct data', async () => {
      const sendEmailSpy = vi.spyOn(emailService, 'sendEmail').mockResolvedValue(undefined);

      await emailService.sendOrderConfirmation(mockOrder as IPopulatedOrderDocument, mockUser as IUserDocument);

      void expect(sendEmailSpy).toHaveBeenCalledWith({
        to: 'customer@example.com',
        subject: 'Order Confirmation - #order-123',
        template: EmailTemplate.ORDER_CONFIRMATION,
        data: expect.objectContaining({
          customerName: 'John',
          orderId: 'order-123',
          items: expect.arrayContaining([
            expect.objectContaining({
              name: 'Product 1',
              quantity: 2,
              price: 50.00,
              variantDetails: 'Size: M, Color: Blue',
            }),
          ]),
          total: 150.00,
          paymentMethod: 'Card ending in 6789',
        }),
      });
    });

    it('should handle missing payment intent ID', async () => {
      const sendEmailSpy = vi.spyOn(emailService, 'sendEmail').mockResolvedValue(undefined);
      const orderWithoutPaymentIntent = {
        ...mockOrder,
        paymentIntentId: undefined,
      };

      await emailService.sendOrderConfirmation(orderWithoutPaymentIntent as IPopulatedOrderDocument, mockUser as IUserDocument);

      void expect(sendEmailSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            paymentMethod: 'Card',
          }),
        }),
      );
    });

    it('should calculate discount correctly when order has coupon', async () => {
      const sendEmailSpy = vi.spyOn(emailService, 'sendEmail').mockResolvedValue(undefined);
      const orderWithDiscount = {
        ...mockOrder,
        couponCode: 'SAVE20',
        originalAmount: 200.00,
        totalAmount: 150.00,
      };

      await emailService.sendOrderConfirmation(orderWithDiscount as IPopulatedOrderDocument, mockUser as IUserDocument);

      void expect(sendEmailSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            subtotal: 200.00,
            discount: 50.00,
            total: 150.00,
          }),
        }),
      );
    });
  });

  describe('sendWelcomeEmail', () => {
    const mockUser: Partial<IUserDocument> = {
      email: 'newuser@example.com',
      name: 'Jane Smith',
      createdAt: new Date('2024-01-01'),
    };

    it('should send welcome email with correct data', async () => {
      const sendEmailSpy = vi.spyOn(emailService, 'sendEmail').mockResolvedValue(undefined);

      await emailService.sendWelcomeEmail(mockUser as IUserDocument);

      void expect(sendEmailSpy).toHaveBeenCalledWith({
        to: 'newuser@example.com',
        subject: 'Welcome to MERN E-commerce!',
        template: EmailTemplate.WELCOME,
        data: expect.objectContaining({
          firstName: 'Jane',
          email: 'newuser@example.com',
          signupDate: expect.any(String),
          shopUrl: expect.stringContaining('/products'),
          helpUrl: expect.stringContaining('/help'),
        }),
      });
    });

    it('should handle users without a name', async () => {
      const sendEmailSpy = vi.spyOn(emailService, 'sendEmail').mockResolvedValue(undefined);
      const userWithoutName = {
        ...mockUser,
        name: undefined as unknown as string,
      };

      await emailService.sendWelcomeEmail(userWithoutName as IUserDocument);

      void expect(sendEmailSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            firstName: 'there',
          }),
        }),
      );
    });
  });

  describe('sendStockNotification', () => {
    const mockProduct: Partial<IProductDocument> = {
      _id: 'prod-123' as unknown,
      name: 'Awesome T-Shirt',
      price: 29.99,
      image: 'https://example.com/image.jpg',
      slug: 'awesome-t-shirt',
    };

    it('should send stock notification email with correct data', async () => {
      const sendEmailSpy = vi.spyOn(emailService, 'sendEmail').mockResolvedValue(undefined);

      await emailService.sendStockNotification(mockProduct as IProductDocument, 'subscriber@example.com');

      void expect(sendEmailSpy).toHaveBeenCalledWith({
        to: 'subscriber@example.com',
        subject: 'Back in Stock: Awesome T-Shirt',
        template: EmailTemplate.STOCK_NOTIFICATION,
        data: expect.objectContaining({
          productName: 'Awesome T-Shirt',
          productImage: 'https://example.com/image.jpg',
          productUrl: expect.stringContaining('/products/awesome-t-shirt'),
          price: 29.99,
        }),
      });
    });

    it('should handle variant details if provided', async () => {
      const sendEmailSpy = vi.spyOn(emailService, 'sendEmail').mockResolvedValue(undefined);

      await emailService.sendStockNotification(
        mockProduct as IProductDocument,
        'subscriber@example.com',
        'Size: L, Color: Black',
      );

      void expect(sendEmailSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            variantDetails: 'Size: L, Color: Black',
          }),
        }),
      );
    });

    it('should handle products without images', async () => {
      const sendEmailSpy = vi.spyOn(emailService, 'sendEmail').mockResolvedValue(undefined);
      const productWithoutImage = {
        ...mockProduct,
        image: undefined as unknown as string,
      };

      await emailService.sendStockNotification(productWithoutImage as IProductDocument, 'subscriber@example.com');

      void expect(sendEmailSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            productImage: undefined,
          }),
        }),
      );
    });
  });

  describe('sendPasswordResetEmail', () => {
    const mockUser: Partial<IUserDocument> = {
      email: 'user@example.com',
      name: 'John Doe',
    };

    it('should send password reset email with correct data', async () => {
      const sendEmailSpy = vi.spyOn(emailService, 'sendEmail').mockResolvedValue(undefined);
      const resetToken = 'reset-token-123';

      await emailService.sendPasswordResetEmail(mockUser as IUserDocument, resetToken);

      void expect(sendEmailSpy).toHaveBeenCalledWith({
        to: 'user@example.com',
        subject: 'Password Reset Request',
        template: EmailTemplate.PASSWORD_RESET,
        data: expect.objectContaining({
          userName: 'John',
          resetUrl: expect.stringContaining(`/reset-password?token=${resetToken}`),
          expirationTime: '1 hour',
        }),
      });
    });

    it('should handle users without a name in password reset', async () => {
      const sendEmailSpy = vi.spyOn(emailService, 'sendEmail').mockResolvedValue(undefined);
      const userWithoutName = {
        ...mockUser,
        name: undefined as unknown as string,
      };

      await emailService.sendPasswordResetEmail(userWithoutName as IUserDocument, 'token-123');

      void expect(sendEmailSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userName: 'there',
          }),
        }),
      );
    });
  });

  describe('template rendering', () => {
    it('should render template with base layout', async () => {
      mockResend.emails.send.mockResolvedValue({ data: { id: 'email-123' }, error: null });
      mockIsEmailEnabled.mockReturnValue(true);
      
      // const templatePath = path.join(__dirname, '../../templates/emails/welcome.ejs');
      // const basePath = path.join(__dirname, '../../templates/emails/layouts/base.ejs');
      
      vi.mocked(fs.readFile).mockImplementation(async (filePath) => {
        const basePath = '/templates/emails/layouts/base.ejs';
        if (filePath === basePath) {
          return Buffer.from('<html><%- body %></html>');
        }
        return Buffer.from('<p>Welcome <%= firstName %>!</p>');
      });

      vi.mocked(ejs.renderFile).mockImplementation(async () => {
        return '<html><p>Welcome John!</p></html>';
      });

      await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        template: EmailTemplate.WELCOME,
        data: { firstName: 'John' },
      });

      void expect(ejs.renderFile).toHaveBeenCalledWith(
        expect.stringContaining('welcome.ejs'),
        expect.objectContaining({
          firstName: 'John',
          fromName: 'MERN E-commerce',
        }),
        expect.objectContaining({
          cache: true,
        }),
      );
    });
  });

  describe('generateTextVersion', () => {
    it('should convert HTML to plain text', () => {
      const html = '<html><body><h1>Hello</h1><p>This is a <strong>test</strong> email.</p></body></html>';
      const text = emailService.generateTextVersion(html);

      void expect(text).toContain('Hello');
      void expect(text).toContain('This is a test email.');
      void expect(text).not.toContain('<');
      void expect(text).not.toContain('>');
    });

    it('should handle links in HTML', () => {
      const html = '<a href="https://example.com">Click here</a>';
      const text = emailService.generateTextVersion(html);

      void expect(text).toContain('Click here');
    });

    it('should handle empty HTML', () => {
      const text = emailService.generateTextVersion('');
      void expect(text).toBe('');
    });
  });

  describe('environment configuration', () => {
    it('should use environment variables for from email and name', async () => {
      const originalFromEmail = process.env.RESEND_FROM_EMAIL;
      const originalFromName = process.env.RESEND_FROM_NAME;

      process.env.RESEND_FROM_EMAIL = 'custom@example.com';
      process.env.RESEND_FROM_NAME = 'Custom Store';

      mockResend.emails.send.mockResolvedValue({ data: { id: 'email-123' }, error: null });
      mockIsEmailEnabled.mockReturnValue(true);
      mockGetFromEmail.mockReturnValue('custom@example.com');
      mockGetFromName.mockReturnValue('Custom Store');
      vi.mocked(ejs.renderFile).mockResolvedValue('<html>Content</html>');

      const service = new EmailService();
      await service.sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        template: EmailTemplate.WELCOME,
        data: {},
      });

      void expect(mockResend.emails.send).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'Custom Store <custom@example.com>',
        }),
      );

      process.env.RESEND_FROM_EMAIL = originalFromEmail;
      process.env.RESEND_FROM_NAME = originalFromName;
    });
  });

  describe('error handling and logging', () => {
    it('should log errors when email sending fails', async () => {
      const mockError = new Error('Network error');
      mockResend.emails.send.mockRejectedValue(mockError);
      mockIsEmailEnabled.mockReturnValue(true);
      vi.mocked(ejs.renderFile).mockResolvedValue('<html>Content</html>');

      await expect(emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        template: EmailTemplate.WELCOME,
        data: {},
      })).resolves.not.toThrow();

      void expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[EmailService] Failed to send'),
        expect.objectContaining({ error: mockError.message }),
      );
    });

    it('should handle missing template gracefully', async () => {
      const mockError = new Error('Template not found');
      vi.mocked(ejs.renderFile).mockRejectedValue(mockError);

      await expect(emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test',
        template: 'invalid-template' as EmailTemplate,
        data: {},
      })).resolves.not.toThrow();
      
      void expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[EmailService] Failed to send'),
        expect.objectContaining({ error: mockError.message }),
      );
    });
  });
});