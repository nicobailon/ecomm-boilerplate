import { resend, isEmailEnabled, getFromEmail, getFromName } from '../lib/resend.js';
import { EmailOptions, EmailTemplate, OrderConfirmationData, WelcomeEmailData, StockNotificationData, PasswordResetData, EmailVerificationData } from '../types/email.types.js';
import type { IOrderDocument } from '../models/order.model.js';
import type { IUserDocument } from '../models/user.model.js';
import type { IProductDocument } from '../models/product.model.js';
import ejs from 'ejs';
import path from 'path';
import { fileURLToPath } from 'url';
import { htmlToText } from 'html-to-text';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface IPopulatedOrderDocument extends Omit<IOrderDocument, 'products'> {
  products: {
    product: IProductDocument;
    quantity: number;
    price: number;
    variantId?: string;
    variantDetails?: {
      size?: string;
      color?: string;
      sku?: string;
    };
    variantLabel?: string;
  }[];
}

export class EmailService {
  private readonly templateDir: string;
  private readonly baseUrl: string;

  constructor() {
    this.templateDir = path.join(__dirname, '../templates/emails');
    this.baseUrl = process.env.CLIENT_URL ?? 'http://localhost:5173';
    // Enable EJS template caching globally
    // EJS.cache is a LRU cache but the type definition is incomplete
    // We'll skip setting it directly and rely on the cache option in renderFile
    // Preload templates to warm up the cache
    if (process.env.NODE_ENV === 'production') {
      void this.preloadTemplates().catch(error => {
        console.error('Failed to preload email templates:', error);
      });
    }
  }

  private isPopulatedProduct(product: any): product is IProductDocument {
    return product && typeof product === 'object' && 'name' in product && 'image' in product && '_id' in product;
  }

  private validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private sanitizeUrl(url: string): string {
    // Only allow http, https, and relative URLs
    // Block javascript:, data:, vbscript:, and other dangerous protocols
    if (!url) return '#';
    
    const trimmedUrl = url.trim();
    const lowerUrl = trimmedUrl.toLowerCase();
    
    // Check for dangerous protocols
    const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:', 'about:'];
    for (const protocol of dangerousProtocols) {
      if (lowerUrl.startsWith(protocol)) {
        console.warn('[EmailService] Blocked dangerous URL protocol in email template:', {
        protocol,
        url,
        sanitized: '#',
      });
        return '#';
      }
    }
    
    // Allow relative URLs and http/https URLs
    if (trimmedUrl.startsWith('/') || 
        trimmedUrl.startsWith('http://') || 
        trimmedUrl.startsWith('https://')) {
      return trimmedUrl;
    }
    
    // Default to # for any other cases
    return '#';
  }

  private async preloadTemplates(): Promise<void> {
    const templates = [
      EmailTemplate.WELCOME,
      EmailTemplate.ORDER_CONFIRMATION,
      EmailTemplate.PASSWORD_RESET,
      EmailTemplate.STOCK_NOTIFICATION,
      EmailTemplate.EMAIL_VERIFICATION,
    ];
    
    // Preload templates to warm up EJS's internal cache
    for (const template of templates) {
      const templatePath = path.join(this.templateDir, `${template}.ejs`);
      try {
        // Render with minimal data to cache the compiled template
        await ejs.renderFile(templatePath, {
          subject: '',
          fromName: '',
          fromEmail: '',
          baseUrl: '',
          unsubscribeUrl: '',
          privacyUrl: '',
        }, { cache: true });
      } catch (error) {
        console.error(`[EmailService] Failed to preload template ${template}:`, {
          template,
          templatePath,
          error: error instanceof Error ? error.message : error,
        });
      }
    }
    
    // Also preload base layout
    const basePath = path.join(this.templateDir, 'layouts/base.ejs');
    try {
      await ejs.renderFile(basePath, {
        subject: '',
        fromName: '',
        body: '',
      }, { cache: true });
    } catch (error) {
      console.error('[EmailService] Failed to preload base layout:', {
        basePath,
        error: error instanceof Error ? error.message : error,
      });
    }
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const { to, subject, template, data, attachments, unsubscribeToken } = options;

      // Validate email addresses
      const emails = Array.isArray(to) ? to : [to];
      const invalidEmails = emails.filter(email => !this.validateEmail(email));
      
      if (invalidEmails.length > 0) {
        console.error(`[EmailService] Invalid email addresses detected in ${template} template:`, invalidEmails);
        throw new Error(`Invalid email address(es): ${invalidEmails.join(', ')}`);
      }

      const templatePath = path.join(this.templateDir, `${template}.ejs`);
      
      // Generate unsubscribe URL with token if provided
      const unsubscribeUrl = unsubscribeToken 
        ? `${this.baseUrl}/api/unsubscribe?token=${unsubscribeToken}` 
        : `${this.baseUrl}/unsubscribe`;
      
      // Sanitize any URLs in the data object
      const sanitizedData = { ...data };
      if ('loginUrl' in sanitizedData && typeof sanitizedData.loginUrl === 'string') {
        sanitizedData.loginUrl = this.sanitizeUrl(sanitizedData.loginUrl);
      }
      if ('resetUrl' in sanitizedData && typeof sanitizedData.resetUrl === 'string') {
        sanitizedData.resetUrl = this.sanitizeUrl(sanitizedData.resetUrl);
      }
      if ('productUrl' in sanitizedData && typeof sanitizedData.productUrl === 'string') {
        sanitizedData.productUrl = this.sanitizeUrl(sanitizedData.productUrl);
      }
      if ('orderUrl' in sanitizedData && typeof sanitizedData.orderUrl === 'string') {
        sanitizedData.orderUrl = this.sanitizeUrl(sanitizedData.orderUrl);
      }
      if ('shopUrl' in sanitizedData && typeof sanitizedData.shopUrl === 'string') {
        sanitizedData.shopUrl = this.sanitizeUrl(sanitizedData.shopUrl);
      }
      if ('helpUrl' in sanitizedData && typeof sanitizedData.helpUrl === 'string') {
        sanitizedData.helpUrl = this.sanitizeUrl(sanitizedData.helpUrl);
      }
      
      const templateData = {
        ...sanitizedData,
        subject,
        fromName: getFromName(),
        fromEmail: getFromEmail(),
        baseUrl: this.baseUrl,
        unsubscribeUrl: this.sanitizeUrl(unsubscribeUrl),
        privacyUrl: this.sanitizeUrl(`${this.baseUrl}/privacy`),
      };

      const html = await ejs.renderFile(templatePath, templateData, { cache: true });
      
      const basePath = path.join(this.templateDir, 'layouts/base.ejs');
      const fullHtml = await ejs.renderFile(basePath, {
        ...templateData,
        body: html,
      }, { cache: true });

      const text = this.generateTextVersion(fullHtml);

      if (!resend || !isEmailEnabled()) {
        console.warn('Email service not configured. Would send email:', {
          to,
          subject,
          template,
          preview: text.substring(0, 100) + '...',
        });
        return;
      }

      console.info(`[EmailService] Attempting to send ${template} email to ${to}`);
      
      const result = await resend.emails.send({
        from: `${getFromName()} <${getFromEmail()}>`,
        to,
        subject,
        html: fullHtml,
        text,
        attachments,
      });
      
      console.info(`[EmailService] Email sent successfully:`, {
        id: result.data?.id,
        to,
        subject,
        template,
        from: `${getFromName()} <${getFromEmail()}>`,
        response: result,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[EmailService] Failed to send ${options.template} email to ${options.to}:`, {
        error: errorMessage,
        template: options.template,
        to: options.to,
        subject: options.subject,
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
  }

  async sendOrderConfirmation(order: IPopulatedOrderDocument, user: IUserDocument): Promise<void> {
    const items = order.products.map(item => {
      if (!this.isPopulatedProduct(item.product)) {
        console.error('[EmailService] Product not populated for order confirmation email:', {
          orderId: order._id,
          productId: item.product,
          itemIndex: order.products.indexOf(item),
        });
        return {
          name: 'Unknown Product',
          quantity: item.quantity,
          price: item.price,
          image: '',
          variantDetails: item.variantLabel,
        };
      }
      return {
        name: item.product.name,
        quantity: item.quantity,
        price: item.price,
        image: item.product.image,
        variantDetails: item.variantLabel,
      };
    });

    const subtotal = order.originalAmount ?? order.totalAmount;
    const discount = order.couponCode ? subtotal - order.totalAmount : 0;

    const paymentMethod = this.formatPaymentMethod(order.paymentMethod ?? 'card', order.paymentIntentId);

    const data: OrderConfirmationData = {
      customerName: user.name?.split(' ')[0] ?? 'Customer',
      orderId: order._id.toString(),
      orderDate: new Date(order.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      items,
      subtotal,
      discount,
      total: order.totalAmount,
      shippingAddress: order.shippingAddress ?? {
        line1: 'Shipping address not provided',
        city: '',
        state: '',
        postalCode: '',
        country: '',
      },
      paymentMethod,
      estimatedDelivery: this.calculateEstimatedDelivery(),
    };

    await this.sendEmail({
      to: user.email,
      subject: `Order Confirmation - #${order._id}`,
      template: EmailTemplate.ORDER_CONFIRMATION,
      data: {
        ...data,
        orderUrl: `${this.baseUrl}/orders/${order._id}`,
      },
      unsubscribeToken: user.unsubscribeToken,
    });
  }

  async sendWelcomeEmail(user: IUserDocument): Promise<void> {
    const data: WelcomeEmailData = {
      firstName: user.name?.split(' ')[0] ?? 'there',
      loginUrl: `${this.baseUrl}/login`,
      email: user.email,
      signupDate: new Date(user.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    };

    await this.sendEmail({
      to: user.email,
      subject: 'Welcome to MERN E-commerce!',
      template: EmailTemplate.WELCOME,
      data: {
        ...data,
        shopUrl: `${this.baseUrl}/products`,
        helpUrl: `${this.baseUrl}/help`,
        supportEmail: process.env.SUPPORT_EMAIL ?? 'support@example.com',
      },
      unsubscribeToken: user.unsubscribeToken,
    });
  }

  async sendStockNotification(product: IProductDocument, email: string, variantDetails?: string, unsubscribeToken?: string): Promise<void> {
    const data: StockNotificationData = {
      productName: product.name,
      productImage: product.image,
      productUrl: `${this.baseUrl}/products/${product.slug}`,
      price: product.price,
      variantDetails,
    };

    await this.sendEmail({
      to: email,
      subject: `Back in Stock: ${product.name}`,
      template: EmailTemplate.STOCK_NOTIFICATION,
      data,
      unsubscribeToken,
    });
  }

  async sendPasswordResetEmail(user: IUserDocument, resetToken: string): Promise<void> {
    const data: PasswordResetData = {
      userName: user.name?.split(' ')[0] ?? 'there',
      resetUrl: `${this.baseUrl}/reset-password?token=${resetToken}`,
      expirationTime: '1 hour',
    };

    await this.sendEmail({
      to: user.email,
      subject: 'Password Reset Request',
      template: EmailTemplate.PASSWORD_RESET,
      data,
      unsubscribeToken: user.unsubscribeToken,
    });
  }

  async sendEmailVerification(user: IUserDocument, verificationToken: string): Promise<void> {
    const data: EmailVerificationData = {
      userName: user.name?.split(' ')[0] ?? 'there',
      verificationUrl: `${this.baseUrl}/verify-email/${verificationToken}`,
      expirationTime: '24 hours',
      supportEmail: process.env.SUPPORT_EMAIL ?? 'support@example.com',
    };

    await this.sendEmail({
      to: user.email,
      subject: 'Verify Your Email Address',
      template: EmailTemplate.EMAIL_VERIFICATION,
      data: {
        ...data,
        fromName: getFromName(),
      },
      unsubscribeToken: user.unsubscribeToken,
    });
  }

  generateTextVersion(html: string): string {
    return htmlToText(html, {
      wordwrap: 130,
      selectors: [
        { selector: 'a', options: { baseUrl: this.baseUrl } },
        { selector: 'img', format: 'skip' },
        { selector: 'h1', options: { uppercase: false } },
        { selector: 'h2', options: { uppercase: false } },
        { selector: 'h3', options: { uppercase: false } },
      ],
      preserveNewlines: true,
    })
      .trim();
  }

  private formatPaymentMethod(method: string, paymentIntentId?: string): string {
    if (!paymentIntentId) {
      return method.charAt(0).toUpperCase() + method.slice(1);
    }

    const last4 = paymentIntentId.slice(-4);
    return `${method.charAt(0).toUpperCase() + method.slice(1)} ending in ${last4}`;
  }

  private calculateEstimatedDelivery(): string {
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 5);
    
    return deliveryDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
}

export const emailService = new EmailService();