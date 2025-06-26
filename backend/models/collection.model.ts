import mongoose, { Document, Schema } from 'mongoose';

export interface ICollection extends Document {
  name: string;
  description?: string;
  slug: string;
  owner: mongoose.Types.ObjectId;
  products: mongoose.Types.ObjectId[];
  isPublic: boolean;
  heroImage?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const collectionSchema = new Schema<ICollection>(
  {
    name: {
      type: String,
      required: [true, 'Collection name is required'],
      trim: true,
      maxlength: [100, 'Collection name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Collection description cannot exceed 500 characters'],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    products: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
    isPublic: {
      type: Boolean,
      default: false,
    },
    heroImage: {
      type: String,
      trim: true,
    },
    heroTitle: {
      type: String,
      trim: true,
      maxlength: [100, 'Hero title cannot exceed 100 characters'],
    },
    heroSubtitle: {
      type: String,
      trim: true,
      maxlength: [200, 'Hero subtitle cannot exceed 200 characters'],
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

collectionSchema.index({ owner: 1, isPublic: 1 });
collectionSchema.index({ products: 1 });
collectionSchema.index({ owner: 1, slug: 1 }, { unique: true });
collectionSchema.index({ owner: 1, name: 1 });
collectionSchema.index({ owner: 1, createdAt: -1 });
collectionSchema.index({ isPublic: 1, createdAt: -1 });
collectionSchema.index({ isFeatured: 1, isPublic: 1 });
collectionSchema.index({ slug: 'text' });

export const Collection = mongoose.model<ICollection>('Collection', collectionSchema);