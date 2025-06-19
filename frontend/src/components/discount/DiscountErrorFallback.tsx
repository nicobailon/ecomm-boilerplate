import { AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';

interface DiscountErrorFallbackProps {
  error: Error;
  reset: () => void;
}

export const DiscountErrorFallback: React.FC<DiscountErrorFallbackProps> = ({ error, reset }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-card rounded-lg">
      <AlertCircle className="w-12 h-12 text-destructive mb-4" />
      <h2 className="text-xl font-semibold mb-2">Unable to Load Discounts</h2>
      <p className="text-muted-foreground text-center mb-6 max-w-md">
        {error.message || 'An error occurred while loading the discount management system.'}
      </p>
      <div className="flex gap-4">
        <Button onClick={reset} variant="default">
          Try Again
        </Button>
        <Button onClick={() => window.location.reload()} variant="outline">
          Refresh Page
        </Button>
      </div>
    </div>
  );
};