import type { Product, User, CartItem } from '@/types';

export const mockProduct: Product = {
  _id: '1',
  name: 'Premium Wireless Headphones',
  description: 'Experience crystal-clear sound with our latest noise-cancelling technology. These premium headphones offer up to 30 hours of battery life and superior comfort for all-day listening.',
  image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop',
  price: 299,
  inventory: 50,
  isFeatured: true,
  sku: 'WH-PREMIUM-001',
  slug: 'premium-wireless-headphones',
  createdAt: new Date('2024-01-01').toISOString(),
  updatedAt: new Date('2024-01-15').toISOString(),
  variants: [],
};

export const mockProductOnSale: Product = {
  ...mockProduct,
  _id: '2',
  name: 'Smart Watch Pro',
  description: 'Track your fitness goals and stay connected with our advanced smartwatch. Features heart rate monitoring, GPS, and water resistance.',
  image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=800&fit=crop',
  price: 199,
  inventory: 25,
  sku: 'SW-PRO-001',
  slug: 'smart-watch-pro',
  variants: [
    {
      variantId: 'sw-black',
      label: 'Black',
      color: '#000000',
      price: 199,
      inventory: 15,
    },
    {
      variantId: 'sw-silver',
      label: 'Silver',
      color: '#C0C0C0',
      price: 199,
      inventory: 10,
    },
  ],
};

export const mockProductOutOfStock: Product = {
  ...mockProduct,
  _id: '3',
  name: 'Vintage Camera',
  description: 'Capture timeless moments with this classic vintage camera. Perfect for photography enthusiasts and collectors.',
  image: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&h=800&fit=crop',
  price: 599,
  inventory: 0,
  sku: 'CAM-VINTAGE-001',
  slug: 'vintage-camera',
};

export const mockProducts: Product[] = [
  mockProduct,
  mockProductOnSale,
  mockProductOutOfStock,
];

export const mockCartItem: CartItem = {
  product: mockProduct,
  quantity: 2,
};

export const mockUser: User = {
  _id: 'user1',
  name: 'John Doe',
  email: 'john@example.com',
  role: 'customer',
  cartItems: [mockCartItem],
};

export const mockOrder = {
  _id: 'order1',
  user: mockUser,
  items: [
    {
      product: mockProduct,
      quantity: 1,
      price: mockProduct.price,
    },
  ],
  totalAmount: 299,
  status: 'pending' as const,
  shippingAddress: {
    fullName: 'John Doe',
    address: '123 Main St',
    city: 'New York',
    state: 'NY',
    postalCode: '10001',
    country: 'USA',
  },
  paymentStatus: 'pending' as const,
  createdAt: new Date('2024-01-20').toISOString(),
  updatedAt: new Date('2024-01-20').toISOString(),
};

export const mockCollection = {
  _id: 'col1',
  name: 'Electronics',
  slug: 'electronics',
  description: 'Latest electronic gadgets and accessories',
  image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=800&h=400&fit=crop',
};