import { Types } from 'mongoose';
import type { IProductDocument } from '../models/product.model.js';

export interface ICartItem {
  product: Types.ObjectId | IProductDocument;
  quantity: number;
}

export interface IPopulatedCartItem {
  product: IProductDocument;
  quantity: number;
}

export interface CartProductWithQuantity {
  _id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  collectionId?: Types.ObjectId;
  isFeatured: boolean;
  category?: string;
  quantity: number;
}