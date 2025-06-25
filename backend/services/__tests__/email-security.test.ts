import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EmailService } from '../email.service.js';
import { EmailTemplate } from '../../types/email.types.js';
import type { IUserDocument } from '../../models/user.model.js';
import type { IProductDocument } from '../../models/product.model.js';

vi.mock('../../lib/resend.js', () => ({
  resend: {
    emails: {
      send: vi.fn().mockResolvedValue({ id: 'test-email-id' }),
    },
  },
  isEmailEnabled: vi.fn(() => false), // Disabled so we can check the preview
  getFromEmail: vi.fn(() => 'test@example.com'),
  getFromName: vi.fn(() => 'Test Store'),
}));

describe('Email Service - Security Integration Tests', () => {
  let emailService: EmailService;
  let consoleSpy: any;
  
  beforeEach(() => {
    emailService = new EmailService();
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  describe('URL Sanitization', () => {
    it('should sanitize dangerous URLs in welcome emails', async () => {
      const user: Partial<IUserDocument> = {
        _id: '123' as any,
        email: 'test@example.com',
        name: '<script>alert("XSS")</script>',
        createdAt: new Date(),
        unsubscribeToken: 'token123',
      };

      // Override baseUrl to test URL sanitization
      (emailService as any).baseUrl = 'javascript:alert("XSS")';
      
      await emailService.sendWelcomeEmail(user as IUserDocument);
      
      // Check that the console.log was called (since email is disabled)
      void expect(consoleSpy).toHaveBeenCalled();
      const logCall = consoleSpy.mock.calls[0][1];
      
      // The template should have the dangerous name escaped
      void expect(logCall.preview).toContain('&lt;script&gt;alert');
      void expect(logCall.preview).not.toContain('<script>alert');
      
      // URLs should be sanitized to # since javascript: is dangerous
      void expect(logCall.preview).toContain('href="#"');
      void expect(logCall.preview).not.toContain('href="javascript:');
    });

    it('should sanitize dangerous URLs in password reset emails', async () => {
      const user: Partial<IUserDocument> = {
        _id: '123' as any,
        email: 'test@example.com',
        name: 'Test User',
        unsubscribeToken: 'token123',
      };

      // Override baseUrl to create dangerous reset URL
      (emailService as any).baseUrl = 'data:text/html,<script>alert("XSS")</script>';
      
      await emailService.sendPasswordResetEmail(user as IUserDocument, 'reset-token');
      
      const logCall = consoleSpy.mock.calls[0][1];
      
      // The dangerous data: URL should be sanitized to #
      void expect(logCall.preview).toContain('href="#"');
      void expect(logCall.preview).not.toContain('href="data:text/html');
    });

    it('should allow safe URLs', async () => {
      const user: Partial<IUserDocument> = {
        _id: '123' as any,
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date(),
        unsubscribeToken: 'token123',
      };

      // Use safe URLs
      (emailService as any).baseUrl = 'https://example.com';
      
      await emailService.sendWelcomeEmail(user as IUserDocument);
      
      const logCall = consoleSpy.mock.calls[0][1];
      
      // Safe URLs should be preserved
      void expect(logCall.preview).toContain('https://example.com');
    });

    it('should sanitize URLs passed in template data', async () => {
      const data = {
        loginUrl: 'javascript:alert("XSS")',
        resetUrl: 'vbscript:msgbox("XSS")',
        productUrl: 'file:///etc/passwd',
        orderUrl: 'about:blank',
        shopUrl: 'https://safe-url.com', // This one is safe
        helpUrl: '/relative/path', // This one is safe
      };

      await emailService.sendEmail({
        to: 'test@example.com',
        subject: 'Test Email',
        template: EmailTemplate.WELCOME,
        data,
      });

      const logCall = consoleSpy.mock.calls[0][1];
      
      // Dangerous URLs should be sanitized
      void expect(logCall.preview).not.toContain('javascript:');
      void expect(logCall.preview).not.toContain('vbscript:');
      void expect(logCall.preview).not.toContain('file:');
      void expect(logCall.preview).not.toContain('about:');
      
      // Safe URLs should be preserved
      void expect(logCall.preview).toContain('https://safe-url.com');
      void expect(logCall.preview).toContain('/relative/path');
    });
  });

  describe('HTML Escaping', () => {
    it('should escape HTML in all user-provided data', async () => {
      const product: Partial<IProductDocument> = {
        _id: '123' as any,
        name: '<img src=x onerror=alert("XSS")>',
        slug: 'test-product',
        image: 'http://example.com/image.jpg',
        price: 99.99,
      };

      await emailService.sendStockNotification(
        product as IProductDocument,
        'test@example.com',
        '<svg onload=alert("variant XSS")>',
        'unsubscribe-token',
      );

      const logCall = consoleSpy.mock.calls[0][1];
      
      // HTML should be escaped
      void expect(logCall.preview).toContain('&lt;img src=x');
      void expect(logCall.preview).toContain('&lt;svg onload=');
      void expect(logCall.preview).not.toContain('<img src=x onerror=');
      void expect(logCall.preview).not.toContain('<svg onload=');
    });
  });
});