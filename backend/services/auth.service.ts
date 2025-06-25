import { User, IUserDocument } from '../models/user.model.js';
import { AppError } from '../utils/AppError.js';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { redis, isRedisHealthy } from '../lib/redis.js';
import { emailService } from './email.service.js';
import { queueEmail } from '../lib/email-queue.js';
import { logEmailVerification } from '../lib/logger.js';
import { withRedisHealth } from '../lib/redis-health.js';

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
  emailVerified?: boolean;
}

// In-memory fallback for refresh tokens when Redis is unavailable
const memoryTokenStore = new Map<string, { token: string; expires: number }>();

// Cleanup expired tokens periodically
setInterval(() => {
  const now = Date.now();
  const expiredKeys: string[] = [];
  memoryTokenStore.forEach((tokenData, userId) => {
    if (tokenData.expires <= now) {
      expiredKeys.push(userId);
    }
  });
  expiredKeys.forEach(key => memoryTokenStore.delete(key));
}, 60000); // Clean up every minute

export class AuthService {
  async signup(input: SignupInput): Promise<{ user: UserResponse; tokens: TokenPair }> {
    const { email, password, name } = input;

    const userExists = await User.findOne({ email });
    if (userExists) {
      throw new AppError('User already exists', 400);
    }
    
    const user = await User.create({ 
      name, 
      email, 
      password,
      emailVerified: false, 
    });
    
    // Generate email verification token
    const verificationToken = user.generateEmailVerificationToken();
    await user.save();
    
    // Log token generation
    logEmailVerification.tokenGenerated({
      userId: user._id.toString(),
      email: user.email,
      tokenExpiry: user.emailVerificationExpires || new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
    
    const tokens = this.generateTokens(user._id.toString());
    await this.storeRefreshToken(user._id.toString(), tokens.refreshToken);

    // Queue verification email instead of welcome email
    try {
      await queueEmail('emailVerification', { 
        user, 
        verificationToken, 
      });
    } catch (emailError) {
      // Log error but don't fail the signup process
      console.error('Failed to queue verification email:', emailError);
    }

    return {
      user: {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified,
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
        emailVerified: user.emailVerified,
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

    // Try Redis first, fallback to memory store
    let storedToken: string | null = null;

    if (isRedisHealthy()) {
      try {
        storedToken = await redis.get(`refresh_token:${decoded.userId}`);
      } catch (error) {
        console.warn('[Auth] Redis get failed, checking memory store:', error);
      }
    }

    // Fallback to memory store if Redis failed
    if (!storedToken) {
      const memoryData = memoryTokenStore.get(decoded.userId);
      if (memoryData && memoryData.expires > Date.now()) {
        storedToken = memoryData.token;
      }
    }

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

        // Clean up from both Redis and memory store
        await withRedisHealth(
          async () => {
            await redis.del(`refresh_token:${decoded.userId}`);
          },
          undefined,
          'Delete refresh token'
        );

        // Always clean up memory store
        memoryTokenStore.delete(decoded.userId);
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
    const ttl = 7 * 24 * 60 * 60; // 7 days in seconds

    // Try Redis first
    const redisResult = await withRedisHealth(
      async () => {
        await redis.set(`refresh_token:${userId}`, refreshToken, 'EX', ttl);
        return true;
      },
      undefined,
      'Store refresh token'
    );

    // Always store in memory as backup
    memoryTokenStore.set(userId, {
      token: refreshToken,
      expires: Date.now() + (ttl * 1000)
    });

    if (!redisResult) {
      console.warn('[Auth] Using memory fallback for refresh token storage');
    }
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await User.findOne({ email });
    
    if (!user) {
      // Don't reveal whether user exists
      return;
    }

    const resetToken = user.generatePasswordResetToken();
    await user.save();

    // Send password reset email
    try {
      await emailService.sendPasswordResetEmail(user, resetToken);
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      throw new AppError('Failed to send password reset email', 500);
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      throw new AppError('Invalid or expired reset token', 400);
    }

    // Update password and clear reset token fields
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
  }

  async verifyEmail(token: string): Promise<UserResponse> {
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      logEmailVerification.verificationFailed({
        token,
        reason: 'Invalid or expired token',
      });
      throw new AppError('Invalid or expired verification token', 400);
    }

    // Update user to verified and clear verification fields
    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();
    
    // Log successful verification
    logEmailVerification.verificationSuccess({
      userId: user._id.toString(),
      email: user.email,
    });

    // Queue welcome email after successful verification
    try {
      await queueEmail('welcomeEmail', { user });
    } catch (emailError) {
      console.error('Failed to queue welcome email:', emailError);
    }

    return {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
    };
  }

  async resendVerificationEmail(userId: string): Promise<void> {
    const user = await User.findById(userId);
    
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.emailVerified) {
      throw new AppError('Email is already verified', 400);
    }

    // Check rate limiting - max 3 per hour
    const rateLimitKey = `email-verification-resend:${userId}`;
    const resendCount = await redis.incr(rateLimitKey);
    
    if (resendCount === 1) {
      // Set expiry for 1 hour
      await redis.expire(rateLimitKey, 3600);
    }
    
    if (resendCount > 3) {
      logEmailVerification.rateLimitExceeded({
        userId,
        email: user.email,
        attemptNumber: resendCount,
      });
      throw new AppError('Too many verification email requests. Please try again later.', 429);
    }
    
    // Log resend attempt
    logEmailVerification.resendAttempt({
      userId,
      email: user.email,
      attemptNumber: resendCount,
      maxAttempts: 3,
    });

    // Generate new verification token
    const verificationToken = user.generateEmailVerificationToken();
    await user.save();
    
    // Log new token generation
    logEmailVerification.tokenGenerated({
      userId: user._id.toString(),
      email: user.email,
      tokenExpiry: user.emailVerificationExpires || new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    // Queue new verification email
    try {
      await queueEmail('emailVerification', { 
        user, 
        verificationToken, 
      });
    } catch (emailError) {
      console.error('Failed to queue verification email:', emailError);
      throw new AppError('Failed to send verification email', 500);
    }
  }
}

export const authService = new AuthService();