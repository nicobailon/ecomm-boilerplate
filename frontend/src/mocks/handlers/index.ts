import {
  createMockUser,
  createMockProduct,
  createMockCollection,
  createMockCartItem,
  createMockCoupon,
  createMockAnalyticsData,
  createMockMediaItem,
} from '../factories';
import { trpcQuery, trpcMutation } from '../utils/trpc-mock';
import type { HttpHandler } from 'msw';
import type { LoginInput, SignupInput } from '@/lib/validations';
import type { Product, User, Collection, Coupon, AnalyticsData, MediaItem } from '@/types';

// Type definitions for handler parameters
interface ProductQueryParams {
  limit?: number;
  page?: number;
}

interface ProductByIdParams {
  id: string;
}

interface ProductBySlugParams {
  slug: string;
}

interface CartAddParams {
  productId: string;
  quantity: number;
}

interface CartUpdateParams {
  productId: string;
  quantity: number;
}

interface CollectionBySlugParams {
  slug: string;
}

interface CouponValidateParams {
  code: string;
}

interface InventoryUpdateParams {
  productId: string;
  inventory: number;
}

interface BulkInventoryUpdate {
  productId: string;
  inventory: number;
}

interface BulkInventoryUpdateParams {
  updates: BulkInventoryUpdate[];
}

interface PaymentCheckoutParams {
  couponCode?: string;
}

export const handlers: HttpHandler[] = [
  // Auth handlers
  trpcMutation('auth.login', ({ email }: LoginInput) => {
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

  trpcMutation('auth.signup', ({ email, name }: SignupInput) => {
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

  trpcQuery('auth.me', (): User => {
    return createMockUser();
  }),

  // Product handlers
  trpcQuery('product.getAll', (params: ProductQueryParams = {}) => {
    const products = Array.from({ length: params.limit ?? 10 }, (_, i) =>
      createMockProduct({
        name: `Product ${i + 1}`,
        price: Math.floor(Math.random() * 200) + 20,
        inventory: Math.floor(Math.random() * 100),
        isFeatured: i < 3,
      }),
    );

    return {
      products,
      totalProducts: 100,
      currentPage: params.page ?? 1,
      totalPages: 10,
    };
  }, { delay: 300 }),

  trpcQuery('product.getById', ({ id }: ProductByIdParams): Product => {
    if (id === 'not-found') {
      throw new Error('Product not found');
    }

    return createMockProduct({ _id: id });
  }),

  trpcQuery('product.getBySlug', ({ slug }: ProductBySlugParams): Product => {
    return createMockProduct({ slug });
  }),

  trpcMutation('product.create', (input: Partial<Product>): Product => {
    return createMockProduct(input);
  }),

  trpcMutation('product.update', ({ id, ...updates }: { id: string } & Partial<Product>): Product => {
    return createMockProduct({ _id: id, ...updates });
  }),

  // Cart handlers
  trpcQuery('cart.get', () => {
    const items = Array.from({ length: 3 }, () => createMockCartItem());
    return { items };
  }),

  trpcMutation('cart.add', ({ productId, quantity }: CartAddParams) => {
    const cartItem = createMockCartItem({
      product: createMockProduct({ _id: productId }),
      quantity,
    });

    return { items: [cartItem] };
  }),

  trpcMutation('cart.update', ({ productId, quantity }: CartUpdateParams) => {
    if (quantity > 100) {
      throw new Error('Quantity exceeds available inventory');
    }

    const cartItem = createMockCartItem({
      product: createMockProduct({ _id: productId }),
      quantity,
    });

    return { items: [cartItem] };
  }),

  trpcMutation('cart.remove', () => {
    return { items: [] };
  }),

  // Collection handlers
  trpcQuery('collection.getAll', (): Collection[] => {
    const collections = Array.from({ length: 6 }, (_, i) =>
      createMockCollection({
        name: `Collection ${i + 1}`,
        isPublic: true,
      }),
    );

    return collections;
  }),

  trpcQuery('collection.getBySlug', ({ slug }: CollectionBySlugParams): Collection => {
    const collection = createMockCollection({
      slug,
      products: Array.from({ length: 5 }, () => createMockProduct()),
    });

    return collection;
  }),

  // Coupon handlers
  trpcMutation('coupon.validate', ({ code }: CouponValidateParams): Coupon => {
    if (code === 'EXPIRED') {
      throw new Error('Coupon has expired');
    }

    if (code === 'INVALID') {
      throw new Error('Invalid coupon code');
    }

    return createMockCoupon({ code });
  }),

  // Analytics handlers
  trpcQuery('analytics.getDashboard', (): AnalyticsData => {
    return createMockAnalyticsData();
  }),

  // Inventory handlers
  trpcQuery('inventory.getAll', (): Product[] => {
    return Array.from({ length: 20 }, () => createMockProduct());
  }),

  trpcMutation('inventory.update', ({ productId, inventory }: InventoryUpdateParams) => {
    if (inventory < 0) {
      throw new Error('Inventory cannot be negative');
    }

    return { productId, inventory };
  }),

  trpcMutation('inventory.bulkUpdate', ({ updates }: BulkInventoryUpdateParams) => {
    const results = updates.map((update: BulkInventoryUpdate) => ({
      productId: update.productId,
      inventory: update.inventory,
      success: update.inventory >= 0,
      error: update.inventory < 0 ? 'Inventory cannot be negative' : null,
    }));

    return results;
  }),

  // Media handlers
  trpcQuery('media.getAll', (): MediaItem[] => {
    return Array.from({ length: 10 }, (_, i) =>
      createMockMediaItem({
        url: `https://via.placeholder.com/800?text=Media+${i + 1}`,
        type: i % 3 === 0 ? 'video' : 'image',
      }),
    );
  }),

  trpcMutation('media.delete', () => {
    return { success: true };
  }),

  // Payment handlers
  trpcMutation('payment.createCheckoutSession', (input: PaymentCheckoutParams) => {
    if (input?.couponCode === 'ERROR') {
      throw new Error('Payment processing failed');
    }

    return {
      sessionId: 'mock-session-id',
      url: 'https://checkout.stripe.com/mock',
    };
  }),

  // Status handler
  trpcQuery('status.check', () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
];