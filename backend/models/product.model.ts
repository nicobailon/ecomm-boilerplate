import mongoose, { Schema, Document } from 'mongoose';
import { nanoid } from 'nanoid';
import { IProductVariantDocument } from '../types/product.types.js';
import { IMediaItem } from '../types/media.types.js';

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
  mediaGallery: IMediaItem[];
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

const mediaItemSchema = new Schema({
  id: {
    type: String,
    required: true,
    default: () => nanoid(6),
  },
  type: {
    type: String,
    enum: ['image', 'video'],
    required: true,
  },
  url: {
    type: String,
    required: true,
    maxlength: 2048,
  },
  thumbnail: {
    type: String,
    maxlength: 2048,
  },
  title: {
    type: String,
    maxlength: 200,
  },
  order: {
    type: Number,
    required: true,
    min: 0,
    max: 5,
  },
  variantId: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  metadata: {
    size: Number,
    duration: {
      type: Number,
      max: 300,
    },
    dimensions: {
      width: {
        type: Number,
        min: 100,
        max: 4096,
      },
      height: {
        type: Number,
        min: 100,
        max: 4096,
      },
    },
  },
}, { _id: false });

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
    mediaGallery: {
      type: [mediaItemSchema],
      default: [],
      validate: {
        validator: function(gallery: IMediaItem[]) {
          return gallery.length <= 6;
        },
        message: 'Media gallery cannot exceed 6 items',
      },
    },
  },
  { 
    timestamps: true,
    optimisticConcurrency: true,
  },
);

// Core performance indexes
// Note: slug field already has unique: true in schema definition
productSchema.index({ slug: 1, isDeleted: 1 }); // Slug lookup with soft delete filtering
productSchema.index({ createdAt: -1 }); // Default sorting for product lists
productSchema.index({ isFeatured: 1, createdAt: -1 }); // Featured products with fallback sort

// Collection and relationship indexes
productSchema.index({ collectionId: 1, createdAt: -1 }); // Products by collection with sort
productSchema.index({ relatedProducts: 1 }); // Related product lookups

// Search and text indexes
productSchema.index({ name: 'text', description: 'text' }); // Full-text search

// Variant-specific indexes
productSchema.index({ 'variants.sku': 1 }, { sparse: true }); // SKU uniqueness (sparse for optional field)
productSchema.index({ 'variants.label': 1 }); // Variant label searches
productSchema.index({ _id: 1, 'variants.variantId': 1 }); // Product-variant compound lookups
productSchema.index({
  _id: 1,
  'variants.attributes.size': 1,
  'variants.attributes.color': 1,
}); // Variant attribute filtering

// Media gallery indexes
productSchema.index({ 'mediaGallery.order': 1 }); // Media ordering
productSchema.index({ 'mediaGallery.type': 1 }); // Media type filtering
productSchema.index({ 'mediaGallery.createdAt': 1 }); // Media chronological sorting

productSchema.set('toJSON', { flattenMaps: true });
productSchema.set('toObject', { flattenMaps: true });

productSchema.virtual('mainImage').get(function() {
  const firstImage = this.mediaGallery?.find((item) => item.type === 'image');
  return firstImage?.url ?? this.image;
});

export const Product = mongoose.model<IProductDocument>('Product', productSchema);