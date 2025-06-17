import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';
import { AppError } from '../utils/AppError.js';
import { IUser, TokenPair } from '../types/index.js';




export class AuthService {
  async signup(userData: Partial<IUser>): Promise<IUser> {
    const { email, password, name } = userData;
    
    const userExists = await User.findOne({ email });
    if (userExists) {
      throw new AppError('User already exists', 400);
    }
    
    const user = await User.create({ name, email, password });
    return user.toJSON() as unknown as IUser;
  }

  async login(email: string, password: string): Promise<{ user: IUser; tokens: TokenPair }> {
    const user = await User.findOne({ email });
    
    if (!user || !(await user.comparePassword(password))) {
      throw new AppError('Invalid email or password', 400);
    }
    
    const tokens = this.generateTokens(user._id as string);
    
    return { 
      user: user.toJSON() as unknown as IUser,
      tokens 
    };
  }

  generateTokens(userId: string): TokenPair {
    const accessToken = jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET!, {
      expiresIn: "15m",
    });

    const refreshToken = jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET!, {
      expiresIn: "7d",
    });

    return { accessToken, refreshToken };
  }
}
