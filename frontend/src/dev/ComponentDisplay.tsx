import { Component, ReactNode, ErrorInfo } from 'react';

// Interface for component registry integration
export interface ComponentMetadata {
  name: string;
  category: string;
  description?: string;
  props?: Record<string, any>;
  examples?: ComponentExample[];
}

export interface ComponentExample {
  title: string;
  props: Record<string, any>;
  description?: string;
}

export interface ComponentDisplayProps {
  component: React.ComponentType<any>;
  metadata: ComponentMetadata;
  currentProps: Record<string, any>;
  onPropsChange: (props: Record<string, any>) => void;
}

// Error boundary for component rendering
class ComponentErrorBoundary extends Component<
  { 
    children: ReactNode; 
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
    componentName?: string;
    onRetry?: () => void;
  },
  { 
    hasError: boolean; 
    error: Error | null;
    errorInfo: ErrorInfo | null;
    retryCount: number;
  }
> {
  constructor(props: any) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Component error:', error, errorInfo);
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState(prev => ({ 
      hasError: false, 
      error: null,
      errorInfo: null,
      retryCount: prev.retryCount + 1
    }));
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, retryCount } = this.state;
      const { componentName } = this.props;
      
      return (
        <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 text-2xl">⚠️</div>
            <div className="flex-1">
              <h3 className="text-red-800 dark:text-red-200 font-semibold mb-2">
                {componentName ? `Error in ${componentName}` : 'Component Error'}
              </h3>
              <p className="text-red-600 dark:text-red-300 text-sm mb-3">
                {error?.message || 'An unexpected error occurred while rendering this component'}
              </p>
              
              {/* Error details */}
              {errorInfo && (
                <details className="mb-3">
                  <summary className="text-sm text-red-600 dark:text-red-400 cursor-pointer hover:underline">
                    Show error details
                  </summary>
                  <pre className="mt-2 p-2 bg-red-100 dark:bg-red-900/30 rounded text-xs overflow-auto max-h-40">
                    {errorInfo.componentStack}
                  </pre>
                </details>
              )}
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={this.handleRetry}
                  className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                >
                  Try again
                </button>
                {retryCount > 0 && (
                  <span className="text-xs text-red-600 dark:text-red-400">
                    Retry attempt: {retryCount}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function ComponentDisplay({
  component: Component,
  metadata,
  currentProps,
  onPropsChange,
}: ComponentDisplayProps) {
  return (
    <div className="space-y-6">
      {/* Component info */}
      <div>
        <h2 className="text-2xl font-bold mb-2">{metadata.name}</h2>
        {metadata.description && (
          <p className="text-gray-600 dark:text-gray-400">{metadata.description}</p>
        )}
      </div>

      {/* Component preview */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 bg-white dark:bg-gray-800">
        <ComponentErrorBoundary 
          componentName={metadata.name}
          onRetry={() => onPropsChange(currentProps)}
        >
          <Component {...currentProps} />
        </ComponentErrorBoundary>
      </div>

      {/* Props display area - placeholder for Engineer 2's PropEditor */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
        <h3 className="font-semibold mb-3">Component Props</h3>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          <p>Props editor will be integrated here by Engineer 2</p>
          <pre className="mt-2 p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 overflow-auto">
            {JSON.stringify(currentProps, null, 2)}
          </pre>
        </div>
      </div>

      {/* Examples */}
      {metadata.examples && metadata.examples.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3">Examples</h3>
          <div className="space-y-3">
            {metadata.examples.map((example, index) => (
              <button
                key={index}
                onClick={() => onPropsChange(example.props)}
                className="w-full text-left p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="font-medium">{example.title}</div>
                {example.description && (
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {example.description}
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}