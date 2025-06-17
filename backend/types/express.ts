import { Request } from 'express';
import { IUserDocument } from '../models/user.model.js';

export interface AuthRequest extends Request {
  user?: IUserDocument;
}
