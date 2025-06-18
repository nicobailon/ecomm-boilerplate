import { lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import RootLayout from '@/components/layout/Layout';
import { AuthGuard } from '@/components/auth/AuthGuard';

// Lazy load pages for code splitting
const HomePage = lazy(() => import('@/pages/HomePage'));
const SignUpPage = lazy(() => import('@/pages/SignUpPage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const AdminPage = lazy(() => import('@/pages/AdminPage'));
const CartPage = lazy(() => import('@/pages/CartPage'));
const PurchaseSuccessPage = lazy(() => import('@/pages/PurchaseSuccessPage'));
const PurchaseCancelPage = lazy(() => import('@/pages/PurchaseCancelPage'));
const CollectionPage = lazy(() => import('@/pages/CollectionPage'));

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