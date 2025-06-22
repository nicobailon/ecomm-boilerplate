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
    default: () => nanoid(6)
  },
  type: {
    type: String,
    enum: ['image', 'video'],
    required: true
  },
  url: {
    type: String,
    required: true,
    maxlength: 2048
  },
  thumbnail: {
    type: String,
    maxlength: 2048
  },
  title: {
    type: String,
    maxlength: 200
  },
  order: {
    type: Number,
    required: true,
    min: 0,
    max: 5
  },
  variantId: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  metadata: {
    size: Number,
    duration: {
      type: Number,
      max: 300
    },
    dimensions: {
      width: {
        type: Number,
        min: 100,
        max: 4096
      },
      height: {
        type: Number,
        min: 100,
        max: 4096
      }
    }
  }
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
        validator: function(gallery: any[]) {
          return gallery.length <= 6;
        },
        message: 'Media gallery cannot exceed 6 items'
      }
    },
  },
  { 
    timestamps: true,
    optimisticConcurrency: true,
  },
);

productSchema.index({ collectionId: 1 });
productSchema.index({ 'mediaGallery.order': 1 });
productSchema.index({ 'mediaGallery.type': 1 });
productSchema.index({ 'mediaGallery.createdAt': 1 });
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

productSchema.virtual('mainImage').get(function() {
  const firstImage = this.mediaGallery?.find((item: any) => item.type === 'image');
  return firstImage?.url || this.image;
});

export const Product = mongoose.model<IProductDocument>('Product', productSchema);