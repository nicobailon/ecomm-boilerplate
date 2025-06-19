import type { ErrorInfo, ReactNode } from 'react';
import { Component } from 'react';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };
  
  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  
  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }
  
  private reset = () => {
    this.setState({ hasError: false, error: null });
  };
  
  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error ?? new Error('Unknown error'), this.reset);
      }
      
      return (
        <div className="p-4 border border-destructive rounded-md">
          <h2 className="text-lg font-semibold text-destructive">
            Something went wrong
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            {this.state.error?.message}
          </p>
          <button
            onClick={this.reset}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md"
          >
            Try again
          </button>
        </div>
      );
    }
    
    return this.props.children;
  }
}