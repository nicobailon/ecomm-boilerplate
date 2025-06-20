import mongoose, { Schema, Document } from 'mongoose';
import { IProductVariantDocument } from '../types/product.types.js';

export interface IProductDocument extends Document {
  name: string;
  description: string;
  price: number;
  image: string;
  collectionId?: mongoose.Types.ObjectId;
  isFeatured: boolean;
  slug: string;
  variants: IProductVariantDocument[];
  variantTypes?: string[];
  relatedProducts?: mongoose.Types.ObjectId[];
  isDeleted?: boolean;
  lowStockThreshold: number;
  allowBackorder: boolean;
  restockDate?: Date;
}

const variantSchema = new Schema<IProductVariantDocument>(
  {
    variantId: {
      type: String,
      required: true,
    },
    label: {
      type: String,
      required: true,
      maxlength: 50,
    },
    size: {
      type: String,
      select: false,
    },
    color: {
      type: String,
      select: false,
    },
    price: {
      type: Number,
      min: 0,
      required: true,
    },
    inventory: {
      type: Number,
      min: 0,
      max: 999999,
      required: true,
      default: 0,
      validate: {
        validator: Number.isInteger,
        message: 'Inventory must be a whole number',
      },
    },
    reservedInventory: {
      type: Number,
      min: 0,
      max: 999999,
      required: true,
      default: 0,
      validate: {
        validator: Number.isInteger,
        message: 'Reserved inventory must be a whole number',
      },
    },
    images: {
      type: [String],
      default: [],
    },
    sku: {
      type: String,
    },
    attributes: {
      type: Map,
      of: String,
      default: undefined,
    },
  },
  { _id: false },
);

const productSchema = new Schema<IProductDocument>(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      min: 0,
      required: true,
    },
    image: {
      type: String,
      required: [true, 'Image is required'],
    },
    collectionId: {
      type: Schema.Types.ObjectId,
      ref: 'Collection',
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    variants: {
      type: [variantSchema],
      default: [],
    },
    relatedProducts: {
      type: [Schema.Types.ObjectId],
      ref: 'Product',
      default: [],
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    lowStockThreshold: {
      type: Number,
      min: 0,
      max: 1000,
      default: 5,
      validate: {
        validator: Number.isInteger,
        message: 'Low stock threshold must be a whole number',
      },
    },
    allowBackorder: {
      type: Boolean,
      default: false,
    },
    restockDate: {
      type: Date,
    },
    variantTypes: {
      type: [String],
      default: undefined,
    },
  },
  { 
    timestamps: true,
    optimisticConcurrency: true,
  },
);

productSchema.index({ collectionId: 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ slug: 1, isDeleted: 1 });
productSchema.index({ 'variants.sku': 1 });
productSchema.index({ 'variants.label': 1 });
productSchema.index({ relatedProducts: 1 });
productSchema.index({ _id: 1, 'variants.variantId': 1 });
productSchema.index({ 
  _id: 1, 
  'variants.attributes.size': 1, 
  'variants.attributes.color': 1 
});

productSchema.set('toJSON', { flattenMaps: true });
productSchema.set('toObject', { flattenMaps: true });

export const Product = mongoose.model<IProductDocument>('Product', productSchema);