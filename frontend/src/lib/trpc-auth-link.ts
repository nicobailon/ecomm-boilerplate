import { TRPCLink } from '@trpc/client';
import { observable } from '@trpc/server/observable';
import { apiClient } from './api-client';

let isRefreshing = false;
let refreshPromise: Promise<any> | null = null;

const refreshToken = async () => {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }
  
  isRefreshing = true;
  refreshPromise = apiClient.post('/api/auth/refresh-token')
    .finally(() => {
      isRefreshing = false;
      refreshPromise = null;
    });
    
  return refreshPromise;
};

export const authLink: TRPCLink<any> = () => {
  return ({ next, op }) => {
    return observable((observer) => {
      const unsubscribe = next(op).subscribe({
        next(value) {
          observer.next(value);
        },
        error(err) {
          // Check if error is due to unauthorized
          if (err?.data?.code === 'UNAUTHORIZED' && !op.context.skipRefresh) {
            // Attempt to refresh token
            refreshToken()
              .then(() => {
                // Retry the request with refreshed token
                const retryOp = {
                  ...op,
                  context: {
                    ...op.context,
                    skipRefresh: true, // Prevent infinite refresh loop
                  },
                };
                next(retryOp).subscribe(observer);
              })
              .catch(() => {
                // Refresh failed, pass original error
                observer.error(err);
              });
          } else {
            observer.error(err);
          }
        },
        complete() {
          observer.complete();
        },
      });
      
      return unsubscribe;
    });
  };
};