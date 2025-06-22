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
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'warn';
};

// Define different formats for different environments
const developmentFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

const productionFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
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
  inputData?: Record<string, any>;
}) => {
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
}) => {
  logger.error('Transaction failed', {
    service: 'DatabaseService',
    operation: data.operation,
    status: 'transaction_error',
    userId: data.userId,
    error: data.error,
    stack: data.stack,
    timestamp: new Date().toISOString(),
  });
};

// Helper functions for authentication/authorization
export const logAuthError = (data: {
  operation: string;
  userId?: string;
  reason: string;
  ip?: string;
}) => {
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

export default logger;
