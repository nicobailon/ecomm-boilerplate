import winston from 'winston';
import path from 'path';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Tell winston that you want to link the colors
winston.addColors(colors);

// Define which level to log based on environment
const level = (): string => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'warn';
};

// Define different formats for different environments
const developmentFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${String(info.timestamp)} ${String(info.level)}: ${String(info.message)}`,
  ),
);

// Custom format to handle circular references and non-serializable objects
const safeJsonFormat = winston.format.printf((info) => {
  const seen = new Set();
  const replacer = (_key: string, value: unknown) => {
    if (value && typeof value === 'object') {
      if (seen.has(value)) {
        return '[Circular]';
      }
      seen.add(value);
      
      // Filter out Mongoose/MongoDB specific objects that cause serialization issues
      if (value.constructor && value.constructor.name === 'ClientSession') {
        return '[MongoDB Session]';
      }
      if (value.constructor && (value.constructor.name === 'Query' || value.constructor.name === 'Document')) {
        return '[MongoDB Object]';
      }
    }
    return value;
  };
  
  try {
    return JSON.stringify(info, replacer);
  } catch (err) {
    // Fallback to a simple string representation
    return JSON.stringify({
      level: info.level,
      message: String(info.message),
      timestamp: info.timestamp,
      error: 'Failed to serialize log entry',
    });
  }
});

const productionFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  safeJsonFormat,
);

// Define transports
const transports = [];

// Console transport for all environments
if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      format: developmentFormat,
    }),
  );
} else {
  transports.push(
    new winston.transports.Console({
      format: productionFormat,
    }),
  );
}

// File transports for production
if (process.env.NODE_ENV === 'production') {
  transports.push(
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'error.log'),
      level: 'error',
      format: productionFormat,
    }),
    new winston.transports.File({
      filename: path.join(process.cwd(), 'logs', 'combined.log'),
      format: productionFormat,
    }),
  );
}

// Create the logger
const logger = winston.createLogger({
  level: level(),
  levels,
  format: productionFormat,
  transports,
  // Don't exit on handled exceptions
  exitOnError: false,
});

// Create a stream object for Morgan HTTP logging
export const morganStream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};

// Helper functions for structured logging
export const logProductCreation = {
  start: (data: {
    userId: string;
    inputKeys: string[];
    hasMediaGallery: boolean;
    mediaGalleryLength: number;
  }) => {
    logger.info('Product creation request received', {
      service: 'ProductService',
      operation: 'create',
      userId: data.userId,
      inputKeys: data.inputKeys,
      hasMediaGallery: data.hasMediaGallery,
      mediaGalleryLength: data.mediaGalleryLength,
      timestamp: new Date().toISOString(),
    });
  },

  success: (data: {
    productId: string;
    productName: string;
    collectionCreated: boolean;
    userId: string;
  }) => {
    logger.info('Product created successfully', {
      service: 'ProductService',
      operation: 'create',
      status: 'success',
      productId: data.productId,
      productName: data.productName,
      collectionCreated: data.collectionCreated,
      userId: data.userId,
      timestamp: new Date().toISOString(),
    });
  },

  error: (data: {
    userId: string;
    error: string;
    stack?: string;
    inputData: {
      name: string;
      hasImage: boolean;
      hasMediaGallery: boolean;
      mediaGalleryLength: number;
      variantsCount: number;
    };
  }) => {
    logger.error('Product creation failed', {
      service: 'ProductService',
      operation: 'create',
      status: 'error',
      userId: data.userId,
      error: data.error,
      stack: data.stack,
      inputData: data.inputData,
      timestamp: new Date().toISOString(),
    });
  },
};

// Helper functions for validation errors
export const logValidationError = (data: {
  operation: string;
  userId?: string;
  validationErrors: string[];
  inputData?: Record<string, unknown>;
}): void => {
  logger.warn('Validation error occurred', {
    service: 'ValidationService',
    operation: data.operation,
    status: 'validation_error',
    userId: data.userId,
    validationErrors: data.validationErrors,
    inputData: data.inputData,
    timestamp: new Date().toISOString(),
  });
};

// Helper functions for transaction errors
export const logTransactionError = (data: {
  operation: string;
  userId: string;
  error: string;
  stack?: string;
}): void => {
  // Ensure all data is serializable
  const sanitizedData = {
    service: 'DatabaseService',
    operation: String(data.operation),
    status: 'transaction_error',
    userId: String(data.userId),
    error: String(data.error),
    stack: data.stack ? String(data.stack) : undefined,
    timestamp: new Date().toISOString(),
  };
  
  logger.error('Transaction failed', sanitizedData);
};

// Helper functions for authentication/authorization
export const logAuthError = (data: {
  operation: string;
  userId?: string;
  reason: string;
  ip?: string;
}): void => {
  logger.warn('Authentication/Authorization error', {
    service: 'AuthService',
    operation: data.operation,
    status: 'auth_error',
    userId: data.userId,
    reason: data.reason,
    ip: data.ip,
    timestamp: new Date().toISOString(),
  });
};

// Helper functions for email verification
export const logEmailVerification = {
  tokenGenerated: (data: {
    userId: string;
    email: string;
    tokenExpiry: Date;
  }) => {
    logger.info('Email verification token generated', {
      service: 'AuthService',
      operation: 'generateEmailVerificationToken',
      status: 'success',
      userId: data.userId,
      email: data.email,
      tokenExpiry: data.tokenExpiry.toISOString(),
      timestamp: new Date().toISOString(),
    });
  },

  verificationSuccess: (data: {
    userId: string;
    email: string;
  }) => {
    logger.info('Email verified successfully', {
      service: 'AuthService',
      operation: 'verifyEmail',
      status: 'success',
      userId: data.userId,
      email: data.email,
      timestamp: new Date().toISOString(),
    });
  },

  verificationFailed: (data: {
    token: string;
    reason: string;
  }) => {
    logger.warn('Email verification failed', {
      service: 'AuthService',
      operation: 'verifyEmail',
      status: 'failed',
      tokenHash: data.token.substring(0, 8) + '...', // Log only partial token for security
      reason: data.reason,
      timestamp: new Date().toISOString(),
    });
  },

  resendAttempt: (data: {
    userId: string;
    email: string;
    attemptNumber: number;
    maxAttempts: number;
  }) => {
    logger.info('Email verification resend requested', {
      service: 'AuthService',
      operation: 'resendVerificationEmail',
      status: 'attempt',
      userId: data.userId,
      email: data.email,
      attemptNumber: data.attemptNumber,
      maxAttempts: data.maxAttempts,
      timestamp: new Date().toISOString(),
    });
  },

  rateLimitExceeded: (data: {
    userId: string;
    email: string;
    attemptNumber: number;
  }) => {
    logger.warn('Email verification rate limit exceeded', {
      service: 'AuthService',
      operation: 'resendVerificationEmail',
      status: 'rate_limited',
      userId: data.userId,
      email: data.email,
      attemptNumber: data.attemptNumber,
      timestamp: new Date().toISOString(),
    });
  },
};

export default logger;
