export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode = 500,
    public isOperational = true,
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class InventoryError extends AppError {
  constructor(
    message: string,
    public code: 'INSUFFICIENT_INVENTORY' | 'PRODUCT_NOT_FOUND' | 'VARIANT_NOT_FOUND' | 'INVENTORY_LOCK_FAILED',
    public details?: Array<{
      productId: string;
      productName?: string;
      variantId?: string;
      variantDetails?: string;
      requestedQuantity: number;
      availableStock: number;
    }>
  ) {
    super(message, 400);
    this.name = 'InventoryError';
  }
}

export class NotFoundError extends AppError {
  constructor(
    public resource: string,
    public resourceId?: string
  ) {
    const message = resourceId 
      ? `${resource} not found with ID: ${resourceId}`
      : `${resource} not found`;
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string,
    public errors?: Record<string, string[]>
  ) {
    super(message, 400);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(
    message = 'Authentication failed',
    public code?: 'INVALID_CREDENTIALS' | 'TOKEN_EXPIRED' | 'TOKEN_INVALID' | 'NO_TOKEN'
  ) {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(
    message = 'Access denied',
    public requiredRole?: string
  ) {
    super(message, 403);
    this.name = 'AuthorizationError';
  }
}

export class PaymentError extends AppError {
  constructor(
    message: string,
    public code?: 'PAYMENT_FAILED' | 'INVALID_PAYMENT_METHOD' | 'INSUFFICIENT_FUNDS' | 'PAYMENT_PROCESSING',
    public stripeError?: unknown
  ) {
    super(message, 402);
    this.name = 'PaymentError';
  }
}

export class ConflictError extends AppError {
  constructor(
    public resource: string,
    public conflictingField?: string
  ) {
    const message = conflictingField
      ? `${resource} already exists with the same ${conflictingField}`
      : `${resource} already exists`;
    super(message, 409);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends AppError {
  constructor(
    public retryAfter?: number
  ) {
    super('Too many requests, please try again later', 429);
    this.name = 'RateLimitError';
  }
}