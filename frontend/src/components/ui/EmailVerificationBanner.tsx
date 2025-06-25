import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, X, RefreshCw, Mail } from 'lucide-react';
import { useCurrentUser, useResendVerification } from '@/hooks/auth/useAuth';
import { Button } from '@/components/ui/Button';

const RESEND_COOLDOWN = 60; // seconds
const DISMISS_KEY = 'email-verification-banner-dismissed';

export const EmailVerificationBanner: React.FC = () => {
  const { data: user } = useCurrentUser();
  const resendVerification = useResendVerification();
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);

  // Check if banner was previously dismissed
  useEffect(() => {
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed) {
      setIsDismissed(true);
    }
  }, []);

  // Handle cooldown timer
  useEffect(() => {
    if (cooldownRemaining > 0) {
      const timer = setInterval(() => {
        setCooldownRemaining((prev) => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [cooldownRemaining]);

  const handleResend = () => {
    resendVerification.mutate(undefined, {
      onSuccess: () => {
        setCooldownRemaining(RESEND_COOLDOWN);
      },
    });
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem(DISMISS_KEY, 'true');
  };

  // Don't show banner if:
  // - No user logged in
  // - User is already verified
  // - Banner was dismissed
  if (!user || user.emailVerified || isDismissed) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, height: 0 }}
        animate={{ 
          opacity: 1, 
          y: 0, 
          height: 'auto',
          transition: {
            height: { duration: 0.3 },
            opacity: { duration: 0.2, delay: 0.1 },
            y: { duration: 0.3 },
          },
        }}
        exit={{ 
          opacity: 0, 
          y: -20, 
          height: 0,
          transition: {
            height: { duration: 0.2, delay: 0.1 },
            opacity: { duration: 0.1 },
            y: { duration: 0.2 },
          },
        }}
        className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 overflow-hidden"
        role="alert"
        aria-live="polite"
        aria-label="Email verification required"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <motion.div 
            className="flex items-center justify-between flex-wrap gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <div className="flex items-center space-x-3 flex-1">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ 
                  type: 'spring',
                  stiffness: 200,
                  damping: 15,
                  delay: 0.3,
                }}
              >
                <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0" />
              </motion.div>
              <div className="flex-1">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Please verify your email address to access all features.
                </p>
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1 flex items-center">
                  <Mail className="h-3 w-3 mr-1" />
                  Check your inbox for the verification email
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleResend}
                disabled={cooldownRemaining > 0 || resendVerification.isPending}
                className="text-yellow-700 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-300 relative"
                aria-label={cooldownRemaining > 0 ? `Resend available in ${cooldownRemaining} seconds` : 'Resend verification email'}
              >
                <AnimatePresence mode="wait">
                  {resendVerification.isPending ? (
                    <motion.span
                      key="sending"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex items-center"
                    >
                      <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
                      Sending...
                    </motion.span>
                  ) : cooldownRemaining > 0 ? (
                    <motion.span
                      key="cooldown"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="flex items-center"
                    >
                      <span className="relative">
                        <motion.span
                          className="absolute inset-0 bg-yellow-600/20 dark:bg-yellow-400/20 rounded"
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 - (cooldownRemaining / RESEND_COOLDOWN) }}
                          style={{ originX: 0 }}
                        />
                        <span className="relative px-2">Resend in {cooldownRemaining}s</span>
                      </span>
                    </motion.span>
                  ) : (
                    <motion.span
                      key="resend"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      Resend verification email
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>
              
              <motion.button
                onClick={handleDismiss}
                className="text-yellow-600 hover:text-yellow-700 dark:text-yellow-400 dark:hover:text-yellow-300 p-1 rounded-md hover:bg-yellow-100 dark:hover:bg-yellow-800/20 transition-colors"
                aria-label="Dismiss email verification banner"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="h-4 w-4" />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};