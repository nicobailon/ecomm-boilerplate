import mongoose from 'mongoose';
import { IProduct, IProductWithVariants } from '../types/index.js';
import { IProductDocument } from '../models/product.model.js';

export function toProduct(doc: IProductDocument | mongoose.FlattenMaps<IProductDocument>): IProduct {
  const obj = ('toObject' in doc ? doc.toObject() : doc) as Partial<IProductDocument> & { _id?: mongoose.Types.ObjectId; createdAt?: Date; updatedAt?: Date };
  
  return {
    _id: obj._id?.toString() ?? '',
    name: obj.name ?? '',
    description: obj.description ?? '',
    price: obj.price ?? 0,
    image: obj.image ?? '',
    collectionId: obj.collectionId?.toString(),
    isFeatured: obj.isFeatured ?? false,
    slug: obj.slug ?? '',
    createdAt: obj.createdAt ? new Date(obj.createdAt).toISOString() : undefined,
    updatedAt: obj.updatedAt ? new Date(obj.updatedAt).toISOString() : undefined,
  };
}

export function toProductWithVariants(doc: IProductDocument | mongoose.FlattenMaps<IProductDocument>): IProductWithVariants {
  const obj = ('toObject' in doc ? doc.toObject() : doc) as Partial<IProductDocument> & { _id?: mongoose.Types.ObjectId; createdAt?: Date; updatedAt?: Date };
  
  return {
    _id: obj._id?.toString() ?? '',
    name: obj.name ?? '',
    description: obj.description ?? '',
    price: obj.price ?? 0,
    image: obj.image ?? '',
    collectionId: obj.collectionId?.toString(),
    isFeatured: obj.isFeatured ?? false,
    slug: obj.slug ?? '',
    variants: obj.variants ?? [],
    relatedProducts: obj.relatedProducts?.map(id => id.toString()) ?? [],
    lowStockThreshold: obj.lowStockThreshold ?? 5,
    allowBackorder: obj.allowBackorder ?? false,
    restockDate: obj.restockDate,
    mediaGallery: obj.mediaGallery ?? [],
    createdAt: obj.createdAt ? new Date(obj.createdAt).toISOString() : undefined,
    updatedAt: obj.updatedAt ? new Date(obj.updatedAt).toISOString() : undefined,
  };
}

export function toProductArray(docs: (IProductDocument | mongoose.FlattenMaps<IProductDocument>)[]): IProduct[] {
  return docs.map(toProduct);
}

export function toProductWithVariantsArray(docs: (IProductDocument | mongoose.FlattenMaps<IProductDocument>)[]): IProductWithVariants[] {
  return docs.map(toProductWithVariants);
}