import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '../../../backend/trpc/routers/app.router';

export const trpc = createTRPCReact<AppRouter>();