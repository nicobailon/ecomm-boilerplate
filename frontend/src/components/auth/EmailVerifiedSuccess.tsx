import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface EmailVerifiedSuccessProps {
  role: 'customer' | 'admin';
  onCountdownFinish?: () => void;
  showCountdown?: boolean;
  countdownSeconds?: number;
}

/**
 * Displays email verification success state with role-specific messaging.
 * When showCountdown is true but no onCountdownFinish is provided,
 * falls back to direct navigation using window.location.href.
 */

const EmailVerifiedSuccess: React.FC<EmailVerifiedSuccessProps> = ({
  role,
  onCountdownFinish,
  showCountdown = true,
  countdownSeconds = 3,
}) => {
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(
    showCountdown ? countdownSeconds : null,
  );

  const isAdmin = role === 'admin';
  const buttonText = isAdmin ? 'Go to Dashboard' : 'Start Shopping';
  const description = isAdmin
    ? 'Your email has been successfully verified. You can now access all admin features.'
    : 'Your email has been successfully verified. You can now enjoy the full shopping experience.';
  const redirectPath = isAdmin ? '/secret-dashboard' : '/';

  // Handle countdown timer
  useEffect(() => {
    if (redirectCountdown !== null && redirectCountdown > 0) {
      const timer = setTimeout(() => {
        setRedirectCountdown(redirectCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (redirectCountdown === 0 && onCountdownFinish) {
      onCountdownFinish();
    }
  }, [redirectCountdown, onCountdownFinish]);

  const handleButtonClick = () => {
    if (onCountdownFinish) {
      onCountdownFinish();
    } else {
      // Dev fallback: direct navigation when no callback provided
      // Using window.location for simplicity in dev-only scenarios
      window.location.href = redirectPath;
    }
  };

  return (
    <div className='flex flex-col justify-center items-center min-h-[60vh] py-12'>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className='text-center max-w-md'
      >
        <CheckCircle className='mx-auto h-16 w-16 text-green-500' />
        <h2 className='mt-4 text-2xl font-semibold text-primary'>Email Verified!</h2>
        <p className='mt-2 text-sm text-muted-foreground'>
          {description}
        </p>
        {redirectCountdown !== null && (
          <p className='mt-2 text-sm text-muted-foreground'>
            Redirecting in {redirectCountdown} second{redirectCountdown !== 1 ? 's' : ''}...
          </p>
        )}
        <Button
          onClick={handleButtonClick}
          className='mt-6'
        >
          {buttonText}
          <ArrowRight className='ml-2 h-4 w-4' />
        </Button>
      </motion.div>
    </div>
  );
};

export default EmailVerifiedSuccess;