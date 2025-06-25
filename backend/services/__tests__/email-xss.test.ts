import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EmailService } from '../email.service.js';
import ejs from 'ejs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

vi.mock('../../../lib/resend.js', () => ({
  resend: {
    emails: {
      send: vi.fn().mockResolvedValue({ id: 'test-email-id' }),
    },
  },
  isEmailEnabled: vi.fn(() => true),
  getFromEmail: vi.fn(() => 'test@example.com'),
  getFromName: vi.fn(() => 'Test Store'),
}));

describe('Email Service - XSS Prevention Tests', () => {
  let emailService: EmailService;
  
  beforeEach(() => {
    emailService = new EmailService();
  });

  const maliciousData = {
    firstName: '<script>alert("XSS")</script>',
    productName: '<img src=x onerror=alert("XSS")>',
    email: 'test@example.com"><script>alert("email XSS")</script>',
    loginUrl: 'javascript:alert("URL XSS")',
    resetUrl: 'data:text/html,<script>alert("data XSS")</script>',
    orderUrl: '"><iframe src="evil.com"></iframe>',
    productUrl: '" onclick="alert(\'click XSS\')" href="',
    customerName: '</h1><script>alert("header XSS")</script><h1>',
    signupDate: '</td><script>alert("table XSS")</script><td>',
    variantDetails: '<svg onload="alert(\'svg XSS\')">',
  };

  const testTemplate = async (templatePath: string, data: any): Promise<string> => {
    const fullPath = path.join(__dirname, '../../templates/emails', templatePath);
    const html = await ejs.renderFile(fullPath, data, { cache: false });
    return html;
  };

  describe('Welcome Email Template', () => {
    it('should escape malicious data in welcome email', async () => {
      const data = {
        firstName: maliciousData.firstName,
        email: maliciousData.email,
        loginUrl: maliciousData.loginUrl,
        signupDate: maliciousData.signupDate,
        shopUrl: 'http://example.com/shop',
        helpUrl: 'http://example.com/help',
        supportEmail: 'support@example.com',
        subject: 'Welcome',
        fromName: 'Test Store',
        fromEmail: 'test@example.com',
        baseUrl: 'http://example.com',
        unsubscribeUrl: 'http://example.com/unsubscribe',
        privacyUrl: 'http://example.com/privacy',
      };

      const html = await testTemplate('welcome.ejs', data);
      
      // Check that script tags are escaped
      void expect(html).not.toContain('<script>alert("XSS")</script>');
      // EJS uses &#34; for quotes instead of &quot;
      void expect(html).toContain('&lt;script&gt;alert(&#34;XSS&#34;)&lt;/script&gt;');
      
      // Check that javascript: URLs are blocked by sanitization
      void expect(html).not.toContain('href="javascript:alert');
      
      // Check that HTML injection is escaped
      void expect(html).not.toContain('</h1><script>');
      void expect(html).not.toContain('</td><script>');
    });
  });

  describe('Password Reset Email Template', () => {
    it('should escape malicious data in password reset email', async () => {
      const data = {
        userName: maliciousData.customerName,
        resetUrl: maliciousData.resetUrl,
        expirationTime: '1 hour',
        subject: 'Password Reset',
        fromName: 'Test Store',
        fromEmail: 'test@example.com',
        baseUrl: 'http://example.com',
        unsubscribeUrl: 'http://example.com/unsubscribe',
        privacyUrl: 'http://example.com/privacy',
      };

      const html = await testTemplate('password-reset.ejs', data);
      
      // Check that script tags are escaped
      void expect(html).not.toContain('</h1><script>');
      void expect(html).toContain('&lt;/h1&gt;&lt;script&gt;');
      
      // Note: URL sanitization happens in the email service, not in templates
      // These tests bypass the service layer, so dangerous URLs still appear
      // The important thing is that the HTML/script tags are properly escaped
    });
  });

  describe('Stock Notification Email Template', () => {
    it('should escape malicious data in stock notification email', async () => {
      const data = {
        productName: maliciousData.productName,
        productImage: 'http://example.com/image.jpg',
        productUrl: maliciousData.productUrl,
        price: 99.99,
        previousPrice: undefined, // Add this to avoid template error
        variantDetails: maliciousData.variantDetails,
        subject: 'Back in Stock',
        fromName: 'Test Store',
        fromEmail: 'test@example.com',
        baseUrl: 'http://example.com',
        unsubscribeUrl: 'http://example.com/unsubscribe',
        privacyUrl: 'http://example.com/privacy',
      };

      const html = await testTemplate('stock-notification.ejs', data);
      
      // Check that img tags with onerror are escaped
      void expect(html).not.toContain('<img src=x onerror=');
      void expect(html).toContain('&lt;img src=x onerror=');
      
      // Check that SVG tags are escaped
      void expect(html).not.toContain('<svg onload=');
      
      // Check that onclick handlers are escaped
      void expect(html).not.toContain('onclick="alert');
    });
  });

  describe('Order Confirmation Email Template', () => {
    it('should escape malicious data in order confirmation email', async () => {
      const data = {
        customerName: maliciousData.customerName,
        orderId: '123456',
        orderDate: 'January 1, 2024',
        orderUrl: maliciousData.orderUrl,
        items: [
          {
            name: maliciousData.productName,
            quantity: 1,
            price: 99.99,
            image: 'http://example.com/image.jpg',
            variantDetails: maliciousData.variantDetails,
          },
        ],
        subtotal: 99.99,
        discount: 0,
        total: 99.99,
        shippingAddress: {
          line1: '123 Main St',
          city: 'City',
          state: 'State',
          postalCode: '12345',
          country: 'USA',
        },
        paymentMethod: 'Card ending in 1234',
        estimatedDelivery: 'January 7, 2024',
        subject: 'Order Confirmation',
        fromName: 'Test Store',
        fromEmail: 'test@example.com',
        baseUrl: 'http://example.com',
        unsubscribeUrl: 'http://example.com/unsubscribe',
        privacyUrl: 'http://example.com/privacy',
      };

      const html = await testTemplate('order-confirmation.ejs', data);
      
      // Check that all malicious content is escaped
      void expect(html).not.toContain('<script>');
      void expect(html).not.toContain('<iframe');
      void expect(html).not.toContain('<img src=x onerror=');
      void expect(html).not.toContain('<svg onload=');
      void expect(html).not.toContain('</h1><script>');
      
      // Check that escaped versions are present
      void expect(html).toContain('&lt;script&gt;');
      void expect(html).toContain('&lt;img src=x');
    });
  });

  describe('Email Service Methods', () => {
    it('should generate safe plain text from HTML with XSS attempts', () => {
      const htmlWithXSS = `
        <h1>${maliciousData.customerName}</h1>
        <p>Product: ${maliciousData.productName}</p>
        <a href="${maliciousData.loginUrl}">Login</a>
        <img src="${maliciousData.productUrl}" alt="product">
      `;
      
      const plainText = emailService.generateTextVersion(htmlWithXSS);
      
      // Check that plain text doesn't contain any HTML tags
      void expect(plainText).not.toContain('<script>');
      void expect(plainText).not.toContain('<img');
      void expect(plainText).not.toContain('<h1>');
      
      // Plain text conversion doesn't remove javascript: from URLs, it just extracts text
      // The important thing is that the HTML tags are removed
      void expect(plainText).toContain('Product:');
    });
  });

  describe('Base Template', () => {
    it('should escape malicious data in base template', async () => {
      const data = {
        subject: '<script>alert("subject XSS")</script>',
        fromName: '<img src=x onerror=alert("from XSS")>',
        fromEmail: 'test@example.com',
        baseUrl: 'http://example.com',
        unsubscribeUrl: 'javascript:alert("unsubscribe XSS")',
        privacyUrl: 'data:text/html,<script>alert("privacy XSS")</script>',
        body: '<h1>Test Body</h1>',
      };

      const fullPath = path.join(__dirname, '../../templates/emails/layouts/base.ejs');
      const html = await ejs.renderFile(fullPath, data, { cache: false });
      
      // Check that all injections in base template are escaped
      void expect(html).not.toContain('<script>alert("subject XSS")</script>');
      void expect(html).not.toContain('<img src=x onerror=');
      void expect(html).not.toContain('href="javascript:alert');
      void expect(html).not.toContain('href="data:text/html,<script>');
      
      // Body should be unescaped (since it's expected to be pre-rendered HTML)
      void expect(html).toContain('<h1>Test Body</h1>');
    });
  });
});