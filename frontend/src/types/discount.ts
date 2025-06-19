export interface Discount {
  _id: string;
  code: string;
  discountPercentage: number;
  expirationDate: string | Date;
  isActive: boolean;
  description?: string;
  maxUses?: number;
  currentUses: number;
  minimumPurchaseAmount?: number;
  userId?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface DiscountListResponse {
  discounts: Discount[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}