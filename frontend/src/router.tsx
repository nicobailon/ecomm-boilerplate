import { createBrowserRouter } from 'react-router-dom';
import RootLayout from '@/components/layout/Layout';
import { AuthGuard } from '@/components/auth/AuthGuard';
import {
  HomePage,
  SignUpPage,
  LoginPage,
  AdminPage,
  CartPage,
  CollectionPage,
  ProductDetailPage,
  PurchaseSuccessPage,
  PurchaseCancelPage,
} from '@/pages';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      // Public routes
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'collections/:slug',
        element: <CollectionPage />,
      },
      {
        path: 'products/:slug',
        element: <ProductDetailPage />,
      },
      // Auth routes (redirect to home if already logged in)
      {
        path: 'signup',
        element: (
          <AuthGuard requireAuth={false} redirectTo="/">
            <SignUpPage />
          </AuthGuard>
        ),
      },
      {
        path: 'login',
        element: (
          <AuthGuard requireAuth={false} redirectTo="/">
            <LoginPage />
          </AuthGuard>
        ),
      },
      // Cart route (accessible to both guests and authenticated users)
      {
        path: 'cart',
        element: <CartPage />,
      },
      {
        path: 'purchase-success',
        element: (
          <AuthGuard requireAuth={true} redirectTo="/login">
            <PurchaseSuccessPage />
          </AuthGuard>
        ),
      },
      {
        path: 'purchase-cancel',
        element: (
          <AuthGuard requireAuth={true} redirectTo="/login">
            <PurchaseCancelPage />
          </AuthGuard>
        ),
      },
      {
        path: 'secret-dashboard',
        element: (
          <AuthGuard requireAuth={true} requireAdmin={true} redirectTo="/login">
            <AdminPage />
          </AuthGuard>
        ),
      },
    ],
  },
]);