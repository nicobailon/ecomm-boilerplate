import { IProduct } from './index.js';
import { VariantAttributes } from '../../shared/types/variant-attributes.js';
import { IMediaItem } from './media.types.js';

export interface IProductVariant {
  variantId: string;
  label: string;
  /** @deprecated Use attributes.size instead */
  size?: string;
  /** @deprecated Use attributes.color instead */
  color?: string;
  attributes?: VariantAttributes;
  price: number;
  inventory: number;
  images: string[];
  sku?: string;
}

export type LegacyProductVariant = Omit<IProductVariant, 'label'> & {
  size: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';
};

export interface IProductWithVariants extends IProduct {
  slug: string;
  variants: IProductVariant[];
  variantTypes?: string[];
  relatedProducts?: string[] | IProduct[];
  lowStockThreshold: number;
  allowBackorder: boolean;
  restockDate?: Date;
  mediaGallery: IMediaItem[];
}

export interface IProductWithMediaGallery extends IProductWithVariants {
  mediaGallery: IMediaItem[];
}

// Use IProductVariant for document type as well since they're identical
export type IProductVariantDocument = IProductVariant;

export interface IProductAnalyticsEvent {
  productId: string;
  userId?: string;
  sessionId: string;
  timestamp: Date;
  referrer?: string;
  deviceType?: string;
}

export interface IProductViewResponse {
  success: boolean;
}

export interface IProductBySlugResponse {
  product: IProductWithVariants & {
    collectionId?: {
      _id: string;
      name: string;
      slug: string;
    };
  };
}

export type { IMediaItem };
export { MEDIA_LIMITS } from './media.types.js';