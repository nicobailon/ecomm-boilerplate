export enum EmailTemplate {
  ORDER_CONFIRMATION = 'order-confirmation',
  WELCOME = 'welcome',
  STOCK_NOTIFICATION = 'stock-notification',
  PASSWORD_RESET = 'password-reset',
  EMAIL_VERIFICATION = 'email-verification',
}

export interface EmailOptions<T = any> {
  to: string | string[];
  subject: string;
  template: EmailTemplate;
  data: T;
  attachments?: EmailAttachment[];
  unsubscribeToken?: string;
}

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

export interface OrderConfirmationData {
  customerName: string;
  orderId: string;
  orderDate: string;
  items: {
    name: string;
    quantity: number;
    price: number;
    image?: string;
    variantDetails?: string;
  }[];
  subtotal: number;
  discount?: number;
  total: number;
  shippingAddress: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  paymentMethod: string;
  estimatedDelivery?: string;
}

export interface WelcomeEmailData {
  firstName: string;
  loginUrl: string;
  email?: string;
  signupDate?: string;
}

export interface StockNotificationData {
  productName: string;
  productImage?: string;
  productUrl: string;
  price: number;
  previousPrice?: number;
  variantDetails?: string;
}

export interface PasswordResetData {
  userName: string;
  resetUrl: string;
  expirationTime: string;
}

export interface EmailVerificationData {
  userName: string;
  verificationUrl: string;
  expirationTime: string;
  supportEmail?: string;
}