import { motion } from 'framer-motion';
import { useSearchParams, Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { ResetPasswordForm } from '@/components/forms/ResetPasswordForm';

const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  if (!token) {
    return (
      <div className='flex flex-col justify-center py-12 sm:px-6 lg:px-8'>
        <motion.div
          className='sm:mx-auto sm:w-full sm:max-w-md'
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className='bg-card py-8 px-4 shadow sm:rounded-lg sm:px-10'>
            <div className='text-center'>
              <AlertCircle className='mx-auto h-12 w-12 text-red-500' />
              <h2 className='mt-4 text-xl font-semibold text-primary'>Invalid Reset Link</h2>
              <p className='mt-2 text-sm text-muted-foreground'>
                This password reset link is invalid or has expired. Please request a new one.
              </p>
              <Link
                to='/forgot-password'
                className='mt-4 inline-flex items-center text-sm font-medium text-primary hover:text-primary/80'
              >
                <ArrowLeft className='mr-2 h-4 w-4' />
                Request new reset link
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className='flex flex-col justify-center py-12 sm:px-6 lg:px-8'>
      <motion.div
        className='sm:mx-auto sm:w-full sm:max-w-md'
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h2 className='mt-6 text-center text-3xl font-extrabold text-primary'>
          Create new password
        </h2>
        <p className='mt-2 text-center text-sm text-muted-foreground'>
          Enter your new password below
        </p>
      </motion.div>

      <motion.div
        className='mt-8 sm:mx-auto sm:w-full sm:max-w-md'
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <div className='bg-card py-8 px-4 shadow sm:rounded-lg sm:px-10'>
          <ResetPasswordForm token={token} />
          
          <div className='mt-6'>
            <Link 
              to='/login' 
              className='flex items-center justify-center text-sm font-medium text-primary hover:text-primary/80'
            >
              <ArrowLeft className='mr-2 h-4 w-4' />
              Back to login
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPasswordPage;