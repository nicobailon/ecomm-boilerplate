import { 
  createMockUser, 
  createMockProduct, 
  createMockCollection,
  createMockCartItem,
  createMockCoupon,
  createMockAnalyticsData,
  createMockMediaItem
} from '../factories';
import { trpcQuery, trpcMutation } from '../utils/trpc-mock';
import type { HttpHandler } from 'msw';

export const handlers: HttpHandler[] = [
  // Auth handlers
  trpcMutation('auth.login', async ({ email }: any) => {
    if (email === 'error@example.com') {
      throw new Error('Invalid credentials');
    }
    
    const user = createMockUser({ email, role: email === 'admin@example.com' ? 'admin' : 'customer' });
    return {
      user,
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    };
  }, { delay: 300 }),

  trpcMutation('auth.signup', async ({ email, name }: any) => {
    if (email === 'existing@example.com') {
      throw new Error('User already exists');
    }
    
    const user = createMockUser({ email, name });
    return {
      user,
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    };
  }, { delay: 300 }),

  trpcQuery('auth.me', async () => {
    return createMockUser();
  }),

  // Product handlers
  trpcQuery('product.getAll', async (params: any = {}) => {
    const products = Array.from({ length: params.limit || 10 }, (_, i) => 
      createMockProduct({ 
        name: `Product ${i + 1}`,
        price: Math.floor(Math.random() * 200) + 20,
        inventory: Math.floor(Math.random() * 100),
        isFeatured: i < 3,
      })
    );
    
    return {
      products,
      totalProducts: 100,
      currentPage: params.page || 1,
      totalPages: 10,
    };
  }, { delay: 300 }),

  trpcQuery('product.getById', async ({ id }: any) => {
    if (id === 'not-found') {
      throw new Error('Product not found');
    }
    
    return createMockProduct({ _id: id });
  }),

  trpcQuery('product.getBySlug', async ({ slug }: any) => {
    return createMockProduct({ slug });
  }),

  trpcMutation('product.create', async (input: any) => {
    return createMockProduct(input);
  }),

  trpcMutation('product.update', async ({ id, ...updates }: any) => {
    return createMockProduct({ _id: id, ...updates });
  }),

  // Cart handlers
  trpcQuery('cart.get', async () => {
    const items = Array.from({ length: 3 }, () => createMockCartItem());
    return { items };
  }),

  trpcMutation('cart.add', async ({ productId, quantity }: any) => {
    const cartItem = createMockCartItem({ 
      product: createMockProduct({ _id: productId }),
      quantity 
    });
    
    return { items: [cartItem] };
  }),

  trpcMutation('cart.update', async ({ productId, quantity }: any) => {
    if (quantity > 100) {
      throw new Error('Quantity exceeds available inventory');
    }
    
    const cartItem = createMockCartItem({ 
      product: createMockProduct({ _id: productId }),
      quantity 
    });
    
    return { items: [cartItem] };
  }),

  trpcMutation('cart.remove', async () => {
    return { items: [] };
  }),

  // Collection handlers
  trpcQuery('collection.getAll', async () => {
    const collections = Array.from({ length: 6 }, (_, i) => 
      createMockCollection({ 
        name: `Collection ${i + 1}`,
        isPublic: true,
      })
    );
    
    return collections;
  }),

  trpcQuery('collection.getBySlug', async ({ slug }: any) => {
    const collection = createMockCollection({ 
      slug,
      products: Array.from({ length: 5 }, () => createMockProduct()),
    });
    
    return collection;
  }),

  // Coupon handlers
  trpcMutation('coupon.validate', async ({ code }: any) => {
    if (code === 'EXPIRED') {
      throw new Error('Coupon has expired');
    }
    
    if (code === 'INVALID') {
      throw new Error('Invalid coupon code');
    }
    
    return createMockCoupon({ code });
  }),

  // Analytics handlers
  trpcQuery('analytics.getDashboard', async () => {
    return createMockAnalyticsData();
  }),

  // Inventory handlers
  trpcQuery('inventory.getAll', async () => {
    return Array.from({ length: 20 }, () => createMockProduct());
  }),

  trpcMutation('inventory.update', async ({ productId, inventory }: any) => {
    if (inventory < 0) {
      throw new Error('Inventory cannot be negative');
    }
    
    return { productId, inventory };
  }),

  trpcMutation('inventory.bulkUpdate', async ({ updates }: any) => {
    const results = updates.map((update: any) => ({
      productId: update.productId,
      inventory: update.inventory,
      success: update.inventory >= 0,
      error: update.inventory < 0 ? 'Inventory cannot be negative' : null,
    }));
    
    return results;
  }),

  // Media handlers
  trpcQuery('media.getAll', async () => {
    return Array.from({ length: 10 }, (_, i) => 
      createMockMediaItem({
        url: `https://via.placeholder.com/800?text=Media+${i + 1}`,
        type: i % 3 === 0 ? 'video' : 'image',
      })
    );
  }),

  trpcMutation('media.delete', async () => {
    return { success: true };
  }),

  // Payment handlers
  trpcMutation('payment.createCheckoutSession', async (input: any) => {
    if (input?.couponCode === 'ERROR') {
      throw new Error('Payment processing failed');
    }
    
    return {
      sessionId: 'mock-session-id',
      url: 'https://checkout.stripe.com/mock',
    };
  }),

  // Status handler
  trpcQuery('status.check', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
];