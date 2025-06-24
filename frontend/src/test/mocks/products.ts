import { placeholderImages } from './placeholder-images-utils';

export const mockProducts = [
  {
    id: '1',
    name: 'Wireless Headphones',
    slug: 'wireless-headphones',
    description: 'Premium noise-cancelling wireless headphones with 30-hour battery life',
    price: 299.99,
    imageUrl: placeholderImages.product('Headphones'),
    images: [
      { url: placeholderImages.product('Headphones'), alt: 'Wireless Headphones Front View' },
      { url: placeholderImages.product('Headphones Side'), alt: 'Wireless Headphones Side View' },
    ],
    category: 'Electronics',
    stock: 50,
    featured: true,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    name: 'Organic Cotton T-Shirt',
    slug: 'organic-cotton-tshirt',
    description: 'Comfortable and sustainable organic cotton t-shirt',
    price: 29.99,
    imageUrl: placeholderImages.product('T-Shirt'),
    images: [
      { url: placeholderImages.product('T-Shirt'), alt: 'Organic Cotton T-Shirt' },
    ],
    category: 'Clothing',
    stock: 200,
    featured: false,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-10'),
  },
  {
    id: '3',
    name: 'Smart Watch Pro',
    slug: 'smart-watch-pro',
    description: 'Advanced fitness tracking and health monitoring smartwatch',
    price: 399.99,
    imageUrl: placeholderImages.product('Smart Watch'),
    images: [
      { url: placeholderImages.product('Smart Watch'), alt: 'Smart Watch Pro' },
      { url: placeholderImages.product('Watch Band'), alt: 'Smart Watch Pro with Band' },
    ],
    category: 'Electronics',
    stock: 0,
    featured: true,
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
  },
];

export const mockCategories = [
  'Electronics',
  'Clothing',
  'Home & Garden',
  'Sports & Outdoors',
  'Books',
  'Toys & Games',
];

export const mockUsers = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'customer',
    avatar: placeholderImages.avatar('JD'),
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'admin',
    avatar: placeholderImages.avatar('JS'),
  },
];

export const mockCartItems = [
  {
    id: '1',
    productId: '1',
    product: mockProducts[0],
    quantity: 2,
    price: mockProducts[0].price,
  },
  {
    id: '2',
    productId: '2',
    product: mockProducts[1],
    quantity: 1,
    price: mockProducts[1].price,
  },
];

export const mockOrders = [
  {
    id: 'order-1',
    userId: '1',
    items: mockCartItems,
    total: 629.97,
    status: 'delivered',
    createdAt: new Date('2024-01-25'),
  },
  {
    id: 'order-2',
    userId: '1',
    items: [mockCartItems[1]],
    total: 29.99,
    status: 'processing',
    createdAt: new Date('2024-01-28'),
  },
];