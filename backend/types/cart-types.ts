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
  slug?: string;
  quantity: number;
  variantId?: string;
  variantDetails?: {
    label?: string;
    size?: string;
    color?: string;
    price: number;
    sku?: string;
  };
}