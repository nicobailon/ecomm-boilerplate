import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../types/express.js';
import { User, IUserDocument } from '../models/user.model.js';

interface TokenPayload {
  userId: string;
}

const protectRouteAsync = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    let accessToken = req.cookies.accessToken as string | undefined;
    
    // Check for token in Authorization header if not in cookies
    if (!accessToken) {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        accessToken = authHeader.substring(7);
      }
    }

    if (!accessToken) {
      res.status(401).json({ message: 'Unauthorized - No access token provided' });
      return;
    }

    try {
      const secret = process.env.ACCESS_TOKEN_SECRET;
      if (!secret) throw new Error('ACCESS_TOKEN_SECRET not configured');
      const decoded = jwt.verify(accessToken, secret) as TokenPayload;
      const user = await User.findById(decoded.userId).select('-password');

      if (!user) {
        res.status(401).json({ message: 'User not found' });
        return;
      }

      req.user = user;

      next();
    } catch (error) {
      if (error instanceof Error && error.name === 'TokenExpiredError') {
        res.status(401).json({ message: 'Unauthorized - Access token expired' });
        return;
      }
      throw error;
    }
  } catch (error) {
    console.error('Error in protectRoute middleware', error instanceof Error ? error.message : 'Unknown error');
    res.status(401).json({ message: 'Unauthorized - Invalid access token' });
  }
};

// Wrap async middleware to handle promises properly
export const protectRoute = (req: AuthRequest, res: Response, next: NextFunction): void => {
  protectRouteAsync(req, res, next).catch(next);
};

export const adminRoute = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Access denied - Admin only' });
  }
};

export const getUserFromRequest = async (req: AuthRequest): Promise<IUserDocument | null> => {
  try {
    let accessToken = req.cookies?.accessToken as string | undefined;
    
    // Check for token in Authorization header if not in cookies
    if (!accessToken) {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        accessToken = authHeader.substring(7);
      }
    }
    
    if (!accessToken) return null;

    const secret = process.env.ACCESS_TOKEN_SECRET;
    if (!secret) throw new Error('ACCESS_TOKEN_SECRET not configured');
    const decoded = jwt.verify(accessToken, secret) as TokenPayload;
    const user = await User.findById(decoded.userId).select('-password');
    return user;
  } catch {
    return null;
  }
};