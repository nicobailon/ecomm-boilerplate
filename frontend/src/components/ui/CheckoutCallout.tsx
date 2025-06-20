import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, X } from 'lucide-react';

interface CheckoutCalloutProps {
  onClose?: () => void;
  autoCloseDelay?: number;
}

export function CheckoutCallout({ onClose, autoCloseDelay = 5000 }: CheckoutCalloutProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (autoCloseDelay > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [autoCloseDelay]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose?.();
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 w-full max-w-sm bg-white rounded-lg shadow-lg border border-gray-200 
        transform transition-all duration-300 ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
        }`}
      role="alert"
      aria-live="polite"
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <CheckCircle className="w-5 h-5 text-green-600" aria-hidden="true" />
          </div>
          
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">
              Item added to cart!
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Ready to checkout?
            </p>
            
            <div className="flex gap-3 mt-3">
              <Link
                to="/cart"
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white 
                  bg-primary rounded-md hover:bg-primary/90 transition-colors"
              >
                View Cart
              </Link>
              <button
                onClick={handleClose}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 
                  bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          </div>
          
          <button
            onClick={handleClose}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}