import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { useVerifyEmail } from '@/hooks/auth/useAuth';
import { Button } from '@/components/ui/Button';

const VerifyEmailPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const verifyEmail = useVerifyEmail();
  
  // Support both URL patterns: /verify-email/:token and /verify-email?token=...
  const verificationToken = token ?? searchParams.get('token');

  useEffect(() => {
    if (verificationToken) {
      verifyEmail.mutate({ token: verificationToken });
    }
  }, [verificationToken, verifyEmail]);

  // Loading state
  if (verifyEmail.isPending) {
    return (
      <div className='flex flex-col justify-center items-center min-h-[60vh] py-12'>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className='text-center'
        >
          <Loader2 className='mx-auto h-16 w-16 text-primary animate-spin' />
          <h2 className='mt-4 text-xl font-semibold text-primary'>Verifying your email...</h2>
          <p className='mt-2 text-sm text-muted-foreground'>
            Please wait while we verify your email address.
          </p>
        </motion.div>
      </div>
    );
  }

  // Success state
  if (verifyEmail.isSuccess) {
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
            Your email has been successfully verified. You can now access all features of your account.
          </p>
          <Button
            onClick={() => void navigate('/')}
            className='mt-6'
          >
            Go to Dashboard
            <ArrowRight className='ml-2 h-4 w-4' />
          </Button>
        </motion.div>
      </div>
    );
  }

  // Error state or no token
  return (
    <div className='flex flex-col justify-center items-center min-h-[60vh] py-12 px-4'>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className='text-center max-w-md'
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ 
            type: 'spring',
            stiffness: 200,
            damping: 15,
            duration: 0.6,
          }}
        >
          <XCircle className='mx-auto h-16 w-16 text-red-500' />
        </motion.div>
        <motion.h2 
          className='mt-4 text-2xl sm:text-3xl font-semibold text-primary'
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          role='heading'
          aria-level={1}
        >
          Verification Failed
        </motion.h2>
        <motion.p 
          className='mt-2 text-sm sm:text-base text-muted-foreground'
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          role='alert'
        >
          {!verificationToken ? 'No verification token provided.' : (verifyEmail.error?.message ?? 'The verification link is invalid or has expired.')}
        </motion.p>
        <motion.p 
          className='mt-4 text-sm text-muted-foreground'
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          Please request a new verification email from your account settings.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Link
            to='/login'
            className='mt-6 inline-flex items-center text-sm font-medium text-primary hover:text-primary/80 transition-colors group'
            aria-label='Navigate to login page'
          >
            Go to Login
            <ArrowRight className='ml-2 h-4 w-4 transition-transform group-hover:translate-x-1' />
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default VerifyEmailPage;