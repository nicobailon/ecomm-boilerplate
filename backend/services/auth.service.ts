import { User, IUserDocument } from '../models/user.model.js';
import { AppError } from '../utils/AppError.js';
import jwt from 'jsonwebtoken';
import { redis } from '../lib/redis.js';

interface LoginInput {
  email: string;
  password: string;
}

interface SignupInput extends LoginInput {
  name: string;
}

interface TokenPayload {
  userId: string;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface UserResponse {
  _id: string;
  name: string;
  email: string;
  role: string;
}

export class AuthService {
  async signup(input: SignupInput): Promise<{ user: UserResponse; tokens: TokenPair }> {
    const { email, password, name } = input;

    const userExists = await User.findOne({ email });
    if (userExists) {
      throw new AppError('User already exists', 400);
    }
    
    const user = await User.create({ name, email, password });
    const tokens = this.generateTokens(user._id.toString());
    await this.storeRefreshToken(user._id.toString(), tokens.refreshToken);

    return {
      user: {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
      tokens,
    };
  }

  async login(input: LoginInput): Promise<{ user: UserResponse; tokens: TokenPair }> {
    const { email, password } = input;
    const user = await User.findOne({ email });

    if (!user || !(await user.comparePassword(password))) {
      throw new AppError('Invalid email or password', 400);
    }

    const tokens = this.generateTokens(user._id.toString());
    await this.storeRefreshToken(user._id.toString(), tokens.refreshToken);

    return {
      user: {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
      tokens,
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<string> {
    if (!refreshToken) {
      throw new AppError('No refresh token provided', 401);
    }

    const refreshSecret = process.env.REFRESH_TOKEN_SECRET;
    const accessSecret = process.env.ACCESS_TOKEN_SECRET;
    if (!refreshSecret || !accessSecret) {
      throw new AppError('JWT secrets not configured', 500);
    }
    
    const decoded = jwt.verify(refreshToken, refreshSecret) as TokenPayload;
    const storedToken = await redis.get(`refresh_token:${decoded.userId}`);

    if (storedToken !== refreshToken) {
      throw new AppError('Invalid refresh token', 401);
    }

    const accessToken = jwt.sign({ userId: decoded.userId }, accessSecret, { 
      expiresIn: '15m', 
    });

    return accessToken;
  }

  async logout(refreshToken: string | undefined): Promise<void> {
    if (refreshToken) {
      try {
        const refreshSecret = process.env.REFRESH_TOKEN_SECRET;
        if (!refreshSecret) throw new AppError('REFRESH_TOKEN_SECRET not configured', 500);
        const decoded = jwt.verify(refreshToken, refreshSecret) as TokenPayload;
        await redis.del(`refresh_token:${decoded.userId}`);
      } catch {
        // Silent fail - token might be invalid or expired
      }
    }
  }

  async getProfile(userId: string): Promise<IUserDocument> {
    const user = await User.findById(userId).select('-password');
    if (!user) {
      throw new AppError('User not found', 404);
    }
    return user;
  }

  private generateTokens(userId: string): TokenPair {
    const accessSecret = process.env.ACCESS_TOKEN_SECRET;
    const refreshSecret = process.env.REFRESH_TOKEN_SECRET;
    
    if (!accessSecret || !refreshSecret) {
      throw new AppError('JWT secrets not configured', 500);
    }
    
    const accessToken = jwt.sign({ userId }, accessSecret, {
      expiresIn: '15m',
    });

    const refreshToken = jwt.sign({ userId }, refreshSecret, {
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }

  private async storeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    await redis.set(`refresh_token:${userId}`, refreshToken, 'EX', 7 * 24 * 60 * 60);
  }
}

export const authService = new AuthService();