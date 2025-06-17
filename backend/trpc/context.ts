import { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import { IUserDocument } from '../models/user.model.js';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';

interface TokenPayload {
  userId: string;
}

export async function createContext({ req, res }: CreateExpressContextOptions) {
  let user: IUserDocument | null = null;
  
  const token = req.cookies.accessToken;
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as TokenPayload;
      user = await User.findById(decoded.userId).select('-password');
    } catch (error) {
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