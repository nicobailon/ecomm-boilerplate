import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest } from '../types/express.js';
import { User } from '../models/user.model.js';

interface TokenPayload {
  userId: string;
}

export const protectRoute = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    let accessToken = req.cookies.accessToken;
    
    // Check for token in Authorization header if not in cookies
    if (!accessToken) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        accessToken = authHeader.substring(7);
      }
    }

    if (!accessToken) {
      res.status(401).json({ message: "Unauthorized - No access token provided" });
      return;
    }

    try {
      const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET!) as TokenPayload;
      const user = await User.findById(decoded.userId).select("-password");

      if (!user) {
        res.status(401).json({ message: "User not found" });
        return;
      }

      req.user = user;

      next();
    } catch (error: any) {
      if (error.name === "TokenExpiredError") {
        res.status(401).json({ message: "Unauthorized - Access token expired" });
        return;
      }
      throw error;
    }
  } catch (error: any) {
    console.log("Error in protectRoute middleware", error.message);
    res.status(401).json({ message: "Unauthorized - Invalid access token" });
  }
};

export const adminRoute = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Access denied - Admin only" });
  }
};

export const getUserFromRequest = async (req: any) => {
  try {
    let accessToken = req.cookies?.accessToken;
    
    // Check for token in Authorization header if not in cookies
    if (!accessToken) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        accessToken = authHeader.substring(7);
      }
    }
    
    if (!accessToken) return null;

    const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET!) as TokenPayload;
    const user = await User.findById(decoded.userId).select("-password");
    return user;
  } catch (error) {
    return null;
  }
};