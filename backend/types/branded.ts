import mongoose from 'mongoose';
import { AppError } from '../utils/AppError.js';

export type UserId = string & { readonly __brand: 'UserId' };
export type CollectionId = string & { readonly __brand: 'CollectionId' };
export type ProductId = string & { readonly __brand: 'ProductId' };

export const toUserId = (id: string): UserId => id as UserId;
export const toCollectionId = (id: string): CollectionId => id as CollectionId;
export const toProductId = (id: string): ProductId => id as ProductId;

export const isValidObjectId = (id: string): boolean => {
  return mongoose.Types.ObjectId.isValid(id);
};

export const validateUserId = (id: string): UserId => {
  if (!isValidObjectId(id)) {
    throw new AppError('Invalid user ID', 400);
  }
  return toUserId(id);
};

export const validateCollectionId = (id: string): CollectionId => {
  if (!isValidObjectId(id)) {
    throw new AppError('Invalid collection ID', 400);
  }
  return toCollectionId(id);
};

export const validateProductId = (id: string): ProductId => {
  if (!isValidObjectId(id)) {
    throw new AppError('Invalid product ID', 400);
  }
  return toProductId(id);
};