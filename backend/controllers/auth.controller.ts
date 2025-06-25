import { Request, Response } from 'express';
import { AuthRequest } from '../types/express.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { authService } from '../services/auth.service.js';

const setCookies = (res: Response, accessToken: string, refreshToken: string): void => {
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000,
  });
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export const signup = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, name } = req.body as { email: string; password: string; name: string };

  const { user, tokens } = await authService.signup({ email, password, name });
  
  setCookies(res, tokens.accessToken, tokens.refreshToken);

  res.status(201).json(user);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string };
  
  const { user, tokens } = await authService.login({ email, password });
  
  setCookies(res, tokens.accessToken, tokens.refreshToken);

  res.json(user);
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken as string;
  
  await authService.logout(refreshToken);

  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out successfully' });
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken as string;

  const accessToken = await authService.refreshAccessToken(refreshToken);

  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000,
  });

  res.json({ message: 'Token refreshed successfully' });
});

export const getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  await Promise.resolve();
  res.json(req.user);
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body as { email: string };
  
  await authService.forgotPassword(email);
  
  res.json({ message: 'Password reset email sent' });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token, newPassword } = req.body as { token: string; newPassword: string };
  
  await authService.resetPassword(token, newPassword);
  
  res.json({ message: 'Password reset successfully' });
});
