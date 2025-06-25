import { vi } from 'vitest';
import type { UseQueryResult, UseMutationResult, QueryObserverResult, RefetchOptions, RefetchQueryFilters } from '@tanstack/react-query';

/**
 * Creates a complete mock for UseQueryResult with all required properties
 */
export function createMockQueryResult<TData, TError = Error>(
  overrides: Partial<UseQueryResult<TData, TError>>,
): UseQueryResult<TData, TError> {
  const mockRefetch = vi.fn<
    (options?: RefetchOptions & RefetchQueryFilters) => Promise<QueryObserverResult<TData, TError>>
  >().mockResolvedValue({} as QueryObserverResult<TData, TError>);

  const baseResult: UseQueryResult<TData, TError> = {
    // Data properties
    data: undefined,
    error: null,
    
    // Status booleans
    isLoading: false,
    isPending: false,
    isError: false,
    isSuccess: false,
    isLoadingError: false,
    isRefetchError: false,
    isRefetching: false,
    isStale: false,
    isFetched: false,
    isFetchedAfterMount: false,
    isPlaceholderData: false,
    isPaused: false,
    
    // Status strings
    status: 'idle',
    fetchStatus: 'idle',
    
    // Timestamps
    dataUpdatedAt: 0,
    errorUpdatedAt: 0,
    
    // Failure tracking
    failureCount: 0,
    failureReason: null,
    errorUpdateCount: 0,
    
    // Functions
    refetch: mockRefetch,
    
    // React Query promise for suspense
    promise: Promise.resolve(undefined as TData | undefined),
    
    // Apply overrides
    ...overrides,
  } as UseQueryResult<TData, TError>;
  
  // Ensure consistency between status flags
  if (baseResult.data !== undefined) {
    baseResult.isSuccess = true;
    baseResult.status = 'success';
  }
  
  if (baseResult.error !== null) {
    baseResult.isError = true;
    baseResult.status = 'error';
  }
  
  if (baseResult.isLoading || baseResult.isPending) {
    baseResult.status = 'pending';
    baseResult.fetchStatus = 'fetching';
  }
  
  return baseResult;
}

/**
 * Creates a complete mock for UseMutationResult with all required properties
 */
export function createMockMutationResult<TData, TError = Error, TVariables = unknown, TContext = unknown>(
  overrides: Partial<UseMutationResult<TData, TError, TVariables, TContext>>,
): UseMutationResult<TData, TError, TVariables, TContext> {
  const mockMutate = vi.fn<(variables: TVariables, options?: {
    onSuccess?: (data: TData, variables: TVariables, context: TContext) => void;
    onError?: (error: TError, variables: TVariables, context: TContext | undefined) => void;
    onSettled?: (data: TData | undefined, error: TError | null, variables: TVariables, context: TContext | undefined) => void;
  }) => void>();
  
  const mockMutateAsync = vi.fn<(variables: TVariables, options?: {
    onSuccess?: (data: TData, variables: TVariables, context: TContext) => void;
    onError?: (error: TError, variables: TVariables, context: TContext | undefined) => void;
    onSettled?: (data: TData | undefined, error: TError | null, variables: TVariables, context: TContext | undefined) => void;
  }) => Promise<TData>>().mockImplementation(() => Promise.resolve(undefined as TData));
  
  const mockReset = vi.fn<() => void>();

  return {
    // Data properties
    data: undefined,
    error: null,
    variables: undefined,
    context: undefined,
    
    // Status booleans
    isPending: false,
    isError: false,
    isSuccess: false,
    isIdle: true,
    isPaused: false,
    
    // Status string
    status: 'idle',
    
    // Functions
    mutate: mockMutate,
    mutateAsync: mockMutateAsync,
    reset: mockReset,
    
    // Failure tracking
    failureCount: 0,
    failureReason: null,
    
    // Timestamp
    submittedAt: 0,
    
    // Apply overrides
    ...overrides,
  } as UseMutationResult<TData, TError, TVariables, TContext>;
}

/**
 * Creates a complete mock for tRPC query results
 */
export function createMockTRPCQueryResult<TData>(
  overrides: Partial<UseQueryResult<TData, Error>>,
): UseQueryResult<TData, Error> & { trpc: { path: string } } {
  const queryResult = createMockQueryResult<TData, Error>(overrides);
  
  return {
    ...queryResult,
    trpc: {
      path: '',
    },
  };
}