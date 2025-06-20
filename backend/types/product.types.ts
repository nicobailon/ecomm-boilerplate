import { IProduct } from './index.js';

export interface IProductVariant {
  variantId: string;
  label: string;
  size?: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';
  color?: string;
  price: number;
  inventory: number;
  reservedInventory: number;
  images: string[];
  sku?: string;
}

export type LegacyProductVariant = Omit<IProductVariant, 'label'> & {
  size: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';
};

export interface IProductWithVariants extends IProduct {
  slug: string;
  variants: IProductVariant[];
  relatedProducts?: string[] | IProduct[];
  lowStockThreshold: number;
  allowBackorder: boolean;
  restockDate?: Date;
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