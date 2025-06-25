import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ArrowRight, CheckCircle, RefreshCw, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { useResendVerification } from '@/hooks/auth/useAuth';
import { useState, useEffect } from 'react';

const RESEND_COOLDOWN = 60; // seconds

const EmailVerificationSentPage: React.FC = () => {
  const resendVerification = useResendVerification();
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);

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
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      },
    });
  };

  return (
    <div className='flex flex-col justify-center items-center min-h-[60vh] py-12 px-4'>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className='text-center max-w-md w-full'
      >
        <motion.div 
          className='mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 relative'
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ 
            type: 'spring',
            stiffness: 200,
            damping: 15,
            delay: 0.2 
          }}
        >
          <motion.div
            animate={{ 
              y: [0, -8, 0],
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          >
            <Mail className='h-10 w-10 text-primary' />
          </motion.div>
          <motion.div
            className='absolute inset-0 rounded-full bg-primary/20'
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.5, 0, 0.5]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        </motion.div>
        
        <motion.h2 
          className='text-2xl sm:text-3xl font-semibold text-primary mb-4'
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          Check your email
        </motion.h2>
        
        <motion.p 
          className='text-muted-foreground mb-6'
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          We&apos;ve sent a verification email to your registered email address. 
          Please check your inbox and click the verification link to activate your account.
        </motion.p>

        <motion.p 
          className='text-sm text-muted-foreground mb-8'
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          Didn&apos;t receive the email? Check your spam folder or request a new one.
        </motion.p>

        <motion.div 
          className='space-y-4'
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <div className='relative'>
            <Button
              onClick={handleResend}
              disabled={cooldownRemaining > 0 || resendVerification.isPending}
              variant="outline"
              className='w-full relative overflow-hidden'
              aria-label={cooldownRemaining > 0 ? `Resend available in ${cooldownRemaining} seconds` : 'Resend verification email'}
            >
              <AnimatePresence mode="wait">
                {resendVerification.isPending ? (
                  <motion.span
                    key="sending"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center justify-center"
                  >
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </motion.span>
                ) : cooldownRemaining > 0 ? (
                  <motion.span
                    key="cooldown"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center justify-center"
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    Resend in {cooldownRemaining}s
                  </motion.span>
                ) : (
                  <motion.span
                    key="resend"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center justify-center"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Resend verification email
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
            
            {cooldownRemaining > 0 && (
              <motion.div
                className="absolute bottom-0 left-0 h-1 bg-primary/20 rounded-full"
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: cooldownRemaining, ease: 'linear' }}
              />
            )}
          </div>

          <AnimatePresence>
            {showSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md"
                role="alert"
                aria-live="polite"
              >
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 mr-2" />
                  <p className="text-sm text-green-800 dark:text-green-200">
                    Verification email sent successfully!
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Link to='/' className='block'>
            <Button className='w-full group'>
              Continue to Homepage
              <ArrowRight className='ml-2 h-4 w-4 transition-transform group-hover:translate-x-1' />
            </Button>
          </Link>
        </motion.div>

        <motion.p 
          className='mt-8 text-xs text-muted-foreground'
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          Having trouble? <Link to='/login' className='text-primary hover:underline transition-colors'>Go to login</Link>
        </motion.p>
      </motion.div>
    </div>
  );
};

export default EmailVerificationSentPage;