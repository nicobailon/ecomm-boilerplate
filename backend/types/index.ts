export interface IUser {
  _id?: string;
  name: string;
  email: string;
  password: string;
  role: 'customer' | 'admin';
  cartItems: ICartItem[];
  createdAt?: Date;
  updatedAt?: Date;
  save?: () => Promise<IUser>;
}

export interface ICartItem {
  product: string;
  quantity: number;
}

export interface IProduct {
  _id?: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  isFeatured: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IOrder {
  _id?: string;
  user: string;
  products: Array<{
    product: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  stripeSessionId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICoupon {
  _id?: string;
  code: string;
  discountPercentage: number;
  expirationDate: Date;
  isActive: boolean;
  userId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}
