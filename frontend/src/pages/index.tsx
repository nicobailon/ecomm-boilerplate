import { lazy } from 'react';

export const HomePage = lazy(() => import('./HomePage'));
export const SignUpPage = lazy(() => import('./SignUpPage'));
export const LoginPage = lazy(() => import('./LoginPage'));
export const AdminPage = lazy(() => import('./AdminPage'));
export const CartPage = lazy(() => import('./CartPage'));
export const CollectionPage = lazy(() => import('./CollectionPage'));
export const ProductDetailPage = lazy(() => import('./ProductDetailPage'));
export const PurchaseSuccessPage = lazy(() => import('./PurchaseSuccessPage'));
export const PurchaseCancelPage = lazy(() => import('./PurchaseCancelPage'));