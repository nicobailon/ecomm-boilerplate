import { vi } from 'vitest';
import type { Request, Response } from 'express';
import type { IUserDocument } from '../../models/user.model.js';

export interface TestContext {
  req: Request;
  res: Response;
  user: IUserDocument | null;
}

export function createTestContext(overrides?: Partial<TestContext>): TestContext {
  const defaultReq = {
    headers: {},
    cookies: {},
    ip: '127.0.0.1',
  } as unknown as Request;
  
  const defaultRes = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    cookie: vi.fn().mockReturnThis(),
  } as unknown as Response;
  
  return {
    req: defaultReq,
    res: defaultRes,
    user: null,
    ...overrides,
  };
}