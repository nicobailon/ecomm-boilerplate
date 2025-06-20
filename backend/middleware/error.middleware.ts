import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError.js';
import mongoose from 'mongoose';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
    return;
  }

  let error: AppError;

  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = new AppError(message, 404);
  } else if (err.name === 'ValidationError' && err instanceof mongoose.Error.ValidationError) {
    const messages = Object.values(err.errors).map((val: mongoose.Error.ValidatorError | mongoose.Error.CastError) => val.message);
    error = new AppError(messages.join(', '), 400);
  } else if ('code' in err && err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = new AppError(message, 400);
  } else {
    error = new AppError('Server Error', 500);
  }

  res.status(error.statusCode).json({
    success: false,
    error: error.message,
  });
};
