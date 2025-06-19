import { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import { IUserDocument } from '../models/user.model.js';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';

interface TokenPayload {
  userId: string;
}

export async function createContext({ req, res }: CreateExpressContextOptions): Promise<{
  req: CreateExpressContextOptions['req'];
  res: CreateExpressContextOptions['res'];
  user: IUserDocument | null;
}> {
  let user: IUserDocument | null = null;
  
  const token = req.cookies.accessToken as string | undefined;
  if (token) {
    try {
      const secret = process.env.ACCESS_TOKEN_SECRET;
      if (!secret) throw new Error('ACCESS_TOKEN_SECRET not configured');
      const decoded = jwt.verify(token, secret) as TokenPayload;
      user = await User.findById(decoded.userId).select('-password');
    } catch {
      // Invalid token, user remains null
    }
  }

  return {
    req,
    res,
    user,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;