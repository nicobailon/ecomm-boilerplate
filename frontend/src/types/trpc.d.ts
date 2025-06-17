import type { AppRouter } from '../../../backend/trpc/routers/app.router';

declare module '@trpc/react-query' {
  interface TRPCReactQuery {
    router: AppRouter;
  }
}

// Export to make this a module
export {};