import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError.js';


export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
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
  } else if (err.name === 'ValidationError') {
    const message = Object.values((err as any).errors).map((val: any) => val.message);
    error = new AppError(message.join(', '), 400);
  } else if ((err as any).code === 11000) {
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
