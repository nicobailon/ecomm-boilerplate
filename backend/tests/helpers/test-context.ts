import { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import { Request, Response } from 'express';
import { IUserDocument } from '../../models/user.model.js';
import { createContext } from '../../trpc/context.js';
import { vi } from 'vitest';

export function createMockExpressRequest(overrides?: Partial<Request>): Request {
  return {
    cookies: {},
    headers: {},
    method: 'GET',
    url: '/',
    query: {},
    params: {},
    body: {},
    ...overrides,
  } as Request;
}

export function createMockExpressResponse(overrides?: Partial<Response>): Response {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
    setHeader: vi.fn().mockReturnThis(),
    ...overrides,
  } as unknown as Response;
}

export async function createTestContext(user?: IUserDocument | null): Promise<{
  req: CreateExpressContextOptions['req'];
  res: CreateExpressContextOptions['res'];
  user: IUserDocument | null;
}> {
  const req = createMockExpressRequest();
  const res = createMockExpressResponse();
  const info = {} as CreateExpressContextOptions['info'];

  const ctx = await createContext({ req, res, info });
  
  if (user !== undefined) {
    ctx.user = user;
  }
  
  return ctx;
}