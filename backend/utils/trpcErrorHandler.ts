import { TRPCError } from '@trpc/server';
import { AppError } from './AppError.js';

export function handleTRPCError(error: unknown): never {
  if (error instanceof AppError) {
    let code: TRPCError['code'] = 'INTERNAL_SERVER_ERROR';
    
    switch (error.statusCode) {
      case 400:
        code = 'BAD_REQUEST';
        break;
      case 401:
        code = 'UNAUTHORIZED';
        break;
      case 403:
        code = 'FORBIDDEN';
        break;
      case 404:
        code = 'NOT_FOUND';
        break;
      case 409:
        code = 'CONFLICT';
        break;
      case 429:
        code = 'TOO_MANY_REQUESTS';
        break;
    }
    
    throw new TRPCError({
      code,
      message: error.message,
    });
  }
  
  if (error instanceof TRPCError) {
    throw error;
  }
  
  if (error instanceof Error) {
    if (error.message.includes('11000') || error.message.includes('duplicate key')) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'A resource with this name already exists',
      });
    }
    
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: error.message || 'An unexpected error occurred',
    });
  }
  
  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred',
  });
}