interface MockUser {
  _id: string;
  name: string;
  email: string;
  role: 'customer' | 'admin';
  emailVerified: boolean;
  cartItems: unknown[];
}

export const createMockCustomer = (): MockUser => ({
  _id: '1',
  name: 'Test Customer',
  email: 'customer@example.com',
  role: 'customer',
  emailVerified: true,
  cartItems: [],
});

export const createMockAdmin = (): MockUser => ({
  _id: '2',
  name: 'Test Admin',
  email: 'admin@example.com',
  role: 'admin',
  emailVerified: true,
  cartItems: [],
});