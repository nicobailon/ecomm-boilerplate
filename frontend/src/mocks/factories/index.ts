import { nanoid } from 'nanoid';
import type { Product, User, Collection, CartItem, Coupon, MediaItem } from '@/types';

export const createMockUser = (overrides?: Partial<User>): User => ({
  _id: nanoid(),
  name: 'Test User',
  email: 'test@example.com',
  role: 'customer',
  cartItems: [],
  ...overrides,
});

export const createMockProduct = (overrides?: Partial<Product>): Product => ({
  _id: nanoid(),
  name: 'Test Product',
  slug: 'test-product',
  description: 'A test product description',
  price: 99.99,
  image: 'https://via.placeholder.com/400',
  inventory: 50,
  sku: `SKU-${nanoid(8)}`,
  isFeatured: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const createMockCollection = (overrides?: Partial<Collection>): Collection => ({
  _id: nanoid(),
  name: 'Test Collection',
  slug: 'test-collection',
  description: 'A test collection',
  owner: nanoid(),
  products: [],
  isPublic: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const createMockCartItem = (overrides?: Partial<CartItem>): CartItem => {
  const product = createMockProduct();
  return {
    product: product._id,
    quantity: 1,
    ...overrides,
  };
};

export const createMockCoupon = (overrides?: Partial<Coupon>): Coupon => ({
  code: 'TESTCODE',
  discountPercentage: 10,
  expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  isActive: true,
  ...overrides,
});

export const createMockMediaItem = (overrides?: Partial<MediaItem>): MediaItem => ({
  id: nanoid(),
  url: 'https://via.placeholder.com/800',
  type: 'image',
  order: 0,
  createdAt: new Date(),
  ...overrides,
});

export const createMockInventoryUpdate = (productId: string, inventory: number) => ({
  productId,
  inventory,
  timestamp: new Date().toISOString(),
});

export const createMockAnalyticsData = () => ({
  totalRevenue: 15420.50,
  totalOrders: 127,
  totalCustomers: 89,
  averageOrderValue: 121.42,
  topProducts: [
    { product: createMockProduct({ name: 'Wireless Headphones' }), sales: 45 },
    { product: createMockProduct({ name: 'Smart Watch' }), sales: 32 },
    { product: createMockProduct({ name: 'Laptop Stand' }), sales: 28 },
  ],
  revenueByDay: Array.from({ length: 7 }, (_, i) => ({
    date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString(),
    revenue: Math.floor(Math.random() * 3000) + 1000,
  })),
});