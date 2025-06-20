import winston from 'winston';
import { v4 as uuidv4 } from 'uuid';

export interface LogMetadata {
  correlationId?: string;
  userId?: string;
  productId?: string;
  variantId?: string;
  adjustment?: number;
  reason?: string;
  duration?: number;
  error?: Error;
  [key: string]: unknown;
}

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, correlationId, ...metadata }) => {
    return JSON.stringify({
      timestamp,
      level,
      message,
      correlationId: correlationId || 'no-correlation-id',
      ...metadata,
    });
  })
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

// Add file transport in production
if (process.env.NODE_ENV === 'production') {
  logger.add(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    })
  );
  logger.add(
    new winston.transports.File({
      filename: 'logs/combined.log',
    })
  );
}

export function generateCorrelationId(): string {
  return uuidv4();
}

export function createLogger(defaultMetadata?: LogMetadata) {
  return {
    info: (message: string, metadata?: LogMetadata) => {
      logger.info(message, { ...defaultMetadata, ...metadata });
    },
    error: (message: string, error?: Error | unknown, metadata?: LogMetadata) => {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      logger.error(message, {
        ...defaultMetadata,
        ...metadata,
        error: {
          message: errorObj.message,
          stack: errorObj.stack,
          name: errorObj.name,
        },
      });
    },
    warn: (message: string, metadata?: LogMetadata) => {
      logger.warn(message, { ...defaultMetadata, ...metadata });
    },
    debug: (message: string, metadata?: LogMetadata) => {
      logger.debug(message, { ...defaultMetadata, ...metadata });
    },
  };
}

export { logger as defaultLogger };