import React, { lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import RootLayout from '@/components/layout/Layout';
import { AuthGuard } from '@/components/auth/AuthGuard';
import {
  HomePage,
  SignUpPage,
  LoginPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  VerifyEmailPage,
  EmailVerificationSentPage,
  AdminPage,
  CartPage,
  CollectionPage,
  ProductDetailPage,
  PurchaseSuccessPage,
  PurchaseCancelPage,
} from '@/pages';
import NotFoundPage from '@/pages/NotFoundPage';
import AccountOrdersPage from '@/pages/AccountOrdersPage';

export const router = createBrowserRouter([
  {
    id: 'root',
    path: '/',
    element: <RootLayout />,
    children: [
      // Public routes
      {
        id: 'home',
        index: true,
        element: <HomePage />,
      },
      {
        id: 'collection-detail',
        path: 'collections/:slug',
        element: <CollectionPage />,
      },
      {
        id: 'product-detail',
        path: 'products/:slug',
        element: <ProductDetailPage />,
      },
      // Auth routes (redirect to home if already logged in)
      {
        id: 'signup',
        path: 'signup',
        element: (
          <AuthGuard requireAuth={false} redirectTo="/">
            <SignUpPage />
          </AuthGuard>
        ),
      },
      {
        id: 'login',
        path: 'login',
        element: (
          <AuthGuard requireAuth={false} redirectTo="/">
            <LoginPage />
          </AuthGuard>
        ),
      },
      {
        id: 'forgot-password',
        path: 'forgot-password',
        element: (
          <AuthGuard requireAuth={false} redirectTo="/">
            <ForgotPasswordPage />
          </AuthGuard>
        ),
      },
      {
        id: 'reset-password',
        path: 'reset-password',
        element: (
          <AuthGuard requireAuth={false} redirectTo="/">
            <ResetPasswordPage />
          </AuthGuard>
        ),
      },
      {
        id: 'verify-email-query',
        path: 'verify-email',
        element: <VerifyEmailPage />,
      },
      {
        id: 'verify-email',
        path: 'verify-email/:token',
        element: <VerifyEmailPage />,
      },
      {
        id: 'email-verification-sent',
        path: 'email-verification-sent',
        element: (
          <AuthGuard requireAuth={true} redirectTo="/login">
            <EmailVerificationSentPage />
          </AuthGuard>
        ),
      },
      // Cart route (accessible to both guests and authenticated users)
      {
        id: 'cart',
        path: 'cart',
        element: <CartPage />,
      },
      {
        id: 'purchase-success',
        path: 'purchase-success',
        element: (
          <AuthGuard requireAuth={true} redirectTo="/login">
            <PurchaseSuccessPage />
          </AuthGuard>
        ),
      },
      {
        id: 'purchase-cancel',
        path: 'purchase-cancel',
        element: (
          <AuthGuard requireAuth={true} redirectTo="/login">
            <PurchaseCancelPage />
          </AuthGuard>
        ),
      },
      {
        id: 'account-orders',
        path: '/account/orders',
        element: (
          <AuthGuard requireAuth={true} redirectTo="/login">
            <AccountOrdersPage />
          </AuthGuard>
        ),
      },
      {
        id: 'admin-dashboard',
        path: 'secret-dashboard',
        element: (
          <AuthGuard requireAuth={true} requireAdmin={true} redirectTo="/login">
            <AdminPage />
          </AuthGuard>
        ),
      },
      {
        id: 'not-found',
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]);

// Conditionally add dev route in development
if (import.meta.env.DEV) {
  const DevUIPage = lazy(() => import('@/dev/DevUIPage'));
  const devRoute = {
    id: 'dev-ui',
    path: 'dev',
    element: (
      <React.Suspense fallback={<div>Loading Dev UI...</div>}>
        <AuthGuard requireAuth={true} requireAdmin={true} redirectTo="/login">
          <DevUIPage />
        </AuthGuard>
      </React.Suspense>
    ),
  };
  
  // Add dev route to the router children
  const rootRoute = router.routes[0];
  if (rootRoute && rootRoute.children) {
    rootRoute.children.push(devRoute);
  }
  
  // Add email verification dev routes
  const DevEmailVerifiedCustomerPage = lazy(() => import('@/dev/pages/DevEmailVerifiedCustomerPage'));
  const DevEmailVerifiedAdminPage = lazy(() => import('@/dev/pages/DevEmailVerifiedAdminPage'));
  
  const devEmailRoutes = [
    {
      id: 'dev-email-verified-customer',
      path: 'dev/email-verified/customer',
      element: (
        <React.Suspense fallback={<div>Loading...</div>}>
          <AuthGuard requireAuth={true} requireAdmin={false} redirectTo="/login">
            <DevEmailVerifiedCustomerPage />
          </AuthGuard>
        </React.Suspense>
      ),
    },
    {
      id: 'dev-email-verified-admin',
      path: 'dev/email-verified/admin',
      element: (
        <React.Suspense fallback={<div>Loading...</div>}>
          <AuthGuard requireAuth={true} requireAdmin={false} redirectTo="/login">
            <DevEmailVerifiedAdminPage />
          </AuthGuard>
        </React.Suspense>
      ),
    },
  ];
  
  // Add email verification routes to router children
  if (rootRoute && rootRoute.children) {
    rootRoute.children.push(...devEmailRoutes);
  }
}