export function getErrorMessage(error: unknown, fallback = 'An error occurred'): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  // TRPC errors or other error-like objects may expose message in a data field
  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  ) {
    return (error as { message: string }).message;
  }

  return fallback;
} 