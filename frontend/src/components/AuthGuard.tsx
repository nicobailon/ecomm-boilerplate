import { Navigate } from 'react-router-dom';
import { useCurrentUser } from '@/hooks/queries/useAuth';
import LoadingSpinner from './LoadingSpinner';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  redirectTo?: string;
}

export function AuthGuard({ 
  children, 
  requireAuth = true, 
  requireAdmin = false,
  redirectTo = '/login' 
}: AuthGuardProps) {
  const { data: user, isLoading } = useCurrentUser();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Check if user should NOT be authenticated (for login/signup pages)
  if (!requireAuth && user) {
    return <Navigate to={redirectTo} replace />;
  }

  // Check if user SHOULD be authenticated
  if (requireAuth && !user) {
    return <Navigate to={redirectTo} replace />;
  }

  // Check admin requirements
  if (requireAdmin && user?.role !== 'admin') {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}