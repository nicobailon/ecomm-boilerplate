export interface AppErrorType extends Error {
  statusCode?: number;
  code?: string;
  isOperational?: boolean;
}

export function isAppError(error: unknown): error is AppErrorType {
  return error instanceof Error && 'statusCode' in error;
}