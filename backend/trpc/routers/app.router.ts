import { router } from '../index.js';
import { authRouter } from './auth.router.js';
import { productRouter } from './product.router.js';
import { cartRouter } from './cart.router.js';
import { couponRouter } from './coupon.router.js';
import { analyticsRouter } from './analytics.router.js';
import { paymentRouter } from './payment.router.js';
import { collectionRouter } from './collection.router.js';
import { inventoryRouter } from './inventory.router.js';
import { statusRouter } from './status.router.js';

export const appRouter = router({
  auth: authRouter,
  product: productRouter,
  cart: cartRouter,
  coupon: couponRouter,
  analytics: analyticsRouter,
  payment: paymentRouter,
  collection: collectionRouter,
  inventory: inventoryRouter,
  status: statusRouter,
});

export type AppRouter = typeof appRouter;