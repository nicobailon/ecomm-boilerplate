import { httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
import { authLink } from './trpc-auth-link';
import { trpc } from './trpc';

export function createTRPCClient() {
  return trpc.createClient({
    links: [
      authLink,
      httpBatchLink({
        url: '/api/trpc',
        transformer: superjson,
        headers() {
          return {
            'content-type': 'application/json',
          };
        },
      }),
    ],
  });
}