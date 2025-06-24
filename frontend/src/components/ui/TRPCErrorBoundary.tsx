import type { ReactNode } from 'react';
import { Component } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class TRPCErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch() {
    // tRPC error boundary handles errors silently to prevent app crashes
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? <div>Something went wrong with the API connection.</div>;
    }

    return this.props.children;
  }
}