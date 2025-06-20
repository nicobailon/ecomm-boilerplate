import React from 'react';
import { InventoryErrorBoundary } from './InventoryErrorBoundary';

/**
 * Higher-order component that wraps a component with an inventory error boundary
 */
export function withInventoryErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  customFallback?: (error: Error, reset: () => void) => React.ReactNode
) {
  const WrappedComponent = React.forwardRef<any, P>((props, ref) => {
    return (
      <InventoryErrorBoundary fallback={customFallback}>
        <Component {...(props as P)} ref={ref} />
      </InventoryErrorBoundary>
    );
  });

  WrappedComponent.displayName = `withInventoryErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}