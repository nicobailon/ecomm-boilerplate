import { Request, Response, NextFunction } from 'express';
import { AppError, InventoryError, ValidationError, NotFoundError, AuthenticationError, AuthorizationError, PaymentError, ConflictError, RateLimitError } from '../utils/AppError.js';
import mongoose from 'mongoose';
import { defaultLogger as logger } from '../utils/logger.js';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  // Build response object
  const response: Record<string, unknown> = {
    success: false,
    error: err.message,
  };

  // Handle AppError and its subclasses
  if (err instanceof AppError) {
    // Add specific properties based on error type
    if (err instanceof InventoryError) {
      response.code = err.code;
      if (err.details) {
        response.details = err.details;
      }
    } else if (err instanceof ValidationError) {
      if (err.errors) {
        response.errors = err.errors;
      }
    } else if (err instanceof NotFoundError) {
      response.resource = err.resource;
      if (err.resourceId) {
        response.resourceId = err.resourceId;
      }
    } else if (err instanceof AuthenticationError) {
      if (err.code) {
        response.code = err.code;
      }
    } else if (err instanceof AuthorizationError) {
      if (err.requiredRole) {
        response.requiredRole = err.requiredRole;
      }
    } else if (err instanceof PaymentError) {
      if (err.code) {
        response.code = err.code;
      }
      // Don't expose internal Stripe error details to client
    } else if (err instanceof ConflictError) {
      response.resource = err.resource;
      if (err.conflictingField) {
        response.conflictingField = err.conflictingField;
      }
    } else if (err instanceof RateLimitError) {
      if (err.retryAfter) {
        response.retryAfter = err.retryAfter;
        res.setHeader('Retry-After', err.retryAfter.toString());
      }
    }

    res.status(err.statusCode).json(response);
    
    // Log 500 errors for debugging
    if (err.statusCode >= 500) {
      logger.error('Server error:', {
        error: err.message,
        stack: err.stack,
        statusCode: err.statusCode,
      });
    }
    
    return;
  }

  // Handle non-AppError errors
  let error: AppError;

  if (err.name === 'CastError') {
    error = new NotFoundError('Resource');
  } else if (err.name === 'ValidationError' && err instanceof mongoose.Error.ValidationError) {
    const messages = Object.values(err.errors).map((val: mongoose.Error.ValidatorError | mongoose.Error.CastError) => val.message);
    error = new ValidationError(messages.join(', '));
  } else if ('code' in err && err.code === 11000) {
    error = new ConflictError('Resource');
  } else {
    // Log unknown errors
    logger.error('Unhandled error:', {
      error: err.message,
      stack: err.stack,
      name: err.name,
    });
    error = new AppError('Server Error', 500);
  }

  res.status(error.statusCode).json({
    success: false,
    error: error.message,
  });
};
