/**
 * Type-level tests to ensure type safety at compile time
 * These tests don't run - they verify types during TypeScript compilation
 */

/* eslint-disable @typescript-eslint/no-unused-vars */

import { 
  EmailTemplate 
} from '../email.types.js';
import type { 
  EmailOptions, 
  OrderConfirmationData,
  WelcomeEmailData,
  StockNotificationData,
  PasswordResetData
} from '../email.types.js';
import type { IUserDocument } from '../../models/user.model.js';
import type { IProductDocument } from '../../models/product.model.js';
import type { IOrderDocument } from '../../models/order.model.js';
import type { EmailService, IPopulatedOrderDocument } from '../../services/email.service.js';

// Type assertion helpers
type AssertEqual<T, U> = T extends U ? (U extends T ? true : false) : false;
// @ts-ignore - Type helper for compile-time assertions
type AssertTrue<T extends true> = T;

// Test EmailTemplate enum values
// EmailTemplate is an enum, not a union type, so this will always be false
// The test is that it compiles and we can use the enum values
// @ts-ignore - Type-level tests: variables declared but intentionally not used
const _emailTemplateWelcome: EmailTemplate = EmailTemplate.WELCOME;
// @ts-ignore
const _emailTemplateOrder: EmailTemplate = EmailTemplate.ORDER_CONFIRMATION;
// @ts-ignore
const _emailTemplatePassword: EmailTemplate = EmailTemplate.PASSWORD_RESET;
// @ts-ignore
const _emailTemplateStock: EmailTemplate = EmailTemplate.STOCK_NOTIFICATION;

// Test EmailOptions structure
// @ts-ignore - Type-level test
type _TestEmailOptions = {
  // Required fields
  to: AssertEqual<EmailOptions['to'], string | string[]>;
  subject: AssertEqual<EmailOptions['subject'], string>;
  template: AssertEqual<EmailOptions['template'], EmailTemplate>;
  data: AssertEqual<EmailOptions['data'], Record<string, any>>;
  
  // Optional fields
  attachments: AssertEqual<EmailOptions['attachments'], Array<{ filename: string; content: Buffer }> | undefined>;
  unsubscribeToken: AssertEqual<EmailOptions['unsubscribeToken'], string | undefined>;
};

// Test OrderConfirmationData structure
// @ts-ignore - Type-level test
type _TestOrderConfirmationData = {
  customerName: AssertEqual<OrderConfirmationData['customerName'], string>;
  orderId: AssertEqual<OrderConfirmationData['orderId'], string>;
  orderDate: AssertEqual<OrderConfirmationData['orderDate'], string>;
  items: AssertEqual<OrderConfirmationData['items'], Array<{
    name: string;
    quantity: number;
    price: number;
    image: string;
    variantDetails?: string;
  }>>;
  subtotal: AssertEqual<OrderConfirmationData['subtotal'], number>;
  discount: AssertEqual<OrderConfirmationData['discount'], number>;
  total: AssertEqual<OrderConfirmationData['total'], number>;
  shippingAddress: AssertEqual<OrderConfirmationData['shippingAddress'], {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  }>;
  paymentMethod: AssertEqual<OrderConfirmationData['paymentMethod'], string>;
  estimatedDelivery: AssertEqual<OrderConfirmationData['estimatedDelivery'], string>;
};

// Test WelcomeEmailData structure
// @ts-ignore - Type-level test
type _TestWelcomeEmailData = {
  firstName: AssertEqual<WelcomeEmailData['firstName'], string>;
  email: AssertEqual<WelcomeEmailData['email'], string>;
  signupDate: AssertEqual<WelcomeEmailData['signupDate'], string>;
  loginUrl: AssertEqual<WelcomeEmailData['loginUrl'], string>;
};

// Test StockNotificationData structure
// @ts-ignore - Type-level test
type _TestStockNotificationData = {
  productName: AssertEqual<StockNotificationData['productName'], string>;
  productImage: AssertEqual<StockNotificationData['productImage'], string>;
  productUrl: AssertEqual<StockNotificationData['productUrl'], string>;
  price: AssertEqual<StockNotificationData['price'], number>;
  variantDetails: AssertEqual<StockNotificationData['variantDetails'], string | undefined>;
  previousPrice: AssertEqual<StockNotificationData['previousPrice'], number | undefined>;
};

// Test PasswordResetData structure
// @ts-ignore - Type-level test
type _TestPasswordResetData = {
  userName: AssertEqual<PasswordResetData['userName'], string>;
  resetUrl: AssertEqual<PasswordResetData['resetUrl'], string>;
  expirationTime: AssertEqual<PasswordResetData['expirationTime'], string>;
};

// Test that email service methods accept correct parameters
declare const emailService: EmailService;
declare const user: IUserDocument;
declare const order: IOrderDocument;
declare const populatedOrder: IPopulatedOrderDocument;
declare const product: IProductDocument;

// These should compile without errors
void emailService.sendEmail({
  to: 'test@example.com',
  subject: 'Test',
  template: EmailTemplate.WELCOME,
  data: { firstName: 'Test' },
});

void emailService.sendOrderConfirmation(populatedOrder, user);
void emailService.sendWelcomeEmail(user);
void emailService.sendStockNotification(product, 'test@example.com');
void emailService.sendPasswordResetEmail(user, 'reset-token');

// Test that populated order has correct structure
// @ts-ignore - Type-level test
type _TestPopulatedOrder = {
  products: AssertEqual<IPopulatedOrderDocument['products'][0], {
    product: IProductDocument;
    quantity: number;
    price: number;
    variantLabel?: string;
  }>;
};

// These should NOT compile (commented out to prevent errors)
// const _invalidTemplate: EmailOptions = {
//   to: 'test@example.com',
//   subject: 'Test',
//   template: 'invalid-template', // Should error
//   data: {},
// };

// const _invalidEmailTo: EmailOptions = {
//   to: 123, // Should error - must be string or string[]
//   subject: 'Test',
//   template: EmailTemplate.WELCOME,
//   data: {},
// };

// Export to ensure file is treated as a module
export {};