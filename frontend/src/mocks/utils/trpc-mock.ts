import { http, HttpResponse, delay } from 'msw';
import type { DefaultBodyType } from 'msw';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface TRPCMockOptions {
  delay?: number;
  status?: number;
}

export interface TRPCErrorResponse {
  message: string;
  code?: string;
}

// Helper to create tRPC endpoint URL
export const trpcUrl = (path: string) => `${API_URL}/trpc/${path}`;

// Helper to create tRPC response
export const trpcResponse = <T>(data: T, options: TRPCMockOptions = {}) => {
  const { delay: delayMs = 0, status = 200 } = options;
  
  return async () => {
    if (delayMs > 0) {
      await delay(delayMs);
    }
    
    return HttpResponse.json(
      { result: { data } },
      { status }
    );
  };
};

// Helper to create tRPC error response
export const trpcError = (error: TRPCErrorResponse, options: TRPCMockOptions = {}) => {
  const { delay: delayMs = 0, status = 400 } = options;
  
  return async () => {
    if (delayMs > 0) {
      await delay(delayMs);
    }
    
    return HttpResponse.json(
      { 
        error: {
          message: error.message,
          code: error.code || 'BAD_REQUEST',
          data: {
            code: error.code || 'BAD_REQUEST',
            httpStatus: status,
          }
        }
      },
      { status }
    );
  };
};

// Helper to create tRPC query handler
export const trpcQuery = <T>(
  procedure: string,
  responseFactory: (input: any) => T | Promise<T>,
  options: TRPCMockOptions = {}
) => {
  return http.get(trpcUrl(procedure), async ({ request }) => {
    const url = new URL(request.url);
    const input = url.searchParams.get('input');
    const parsedInput = input ? JSON.parse(input) : undefined;
    
    try {
      const data = await responseFactory(parsedInput);
      return trpcResponse(data, options)();
    } catch (error: any) {
      return trpcError({ message: error.message }, options)();
    }
  });
};

// Helper to create tRPC mutation handler
export const trpcMutation = <TInput = DefaultBodyType, TOutput = any>(
  procedure: string,
  responseFactory: (input: TInput) => TOutput | Promise<TOutput>,
  options: TRPCMockOptions = {}
) => {
  return http.post(trpcUrl(procedure), async ({ request }) => {
    const body = await request.json() as { input?: TInput };
    const input = body.input;
    
    try {
      const data = await responseFactory(input as TInput);
      return trpcResponse(data, options)();
    } catch (error: any) {
      return trpcError({ message: error.message }, options)();
    }
  });
};

// Helper to create loading state handler
export const trpcLoading = (procedure: string, delayMs = 3000) => {
  return http.all(trpcUrl(procedure), async () => {
    await delay(delayMs);
    return new HttpResponse(null, { status: 408 }); // Request Timeout
  });
};

// Helper to create network error handler
export const trpcNetworkError = (procedure: string) => {
  return http.all(trpcUrl(procedure), () => {
    return HttpResponse.error();
  });
};

// Pre-defined scenarios
export const trpcScenarios = {
  success: <T>(procedure: string, data: T, options?: TRPCMockOptions) => 
    http.all(trpcUrl(procedure), trpcResponse(data, options)),
    
  error: (procedure: string, error: TRPCErrorResponse, options?: TRPCMockOptions) =>
    http.all(trpcUrl(procedure), trpcError(error, options)),
    
  loading: (procedure: string, delayMs?: number) =>
    trpcLoading(procedure, delayMs),
    
  networkError: (procedure: string) =>
    trpcNetworkError(procedure),
};