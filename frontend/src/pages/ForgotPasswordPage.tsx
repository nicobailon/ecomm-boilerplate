import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ForgotPasswordForm } from '@/components/forms/ForgotPasswordForm';

const ForgotPasswordPage: React.FC = () => {
  return (
    <div className='flex flex-col justify-center py-12 sm:px-6 lg:px-8'>
      <motion.div
        className='sm:mx-auto sm:w-full sm:max-w-md'
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h2 className='mt-6 text-center text-3xl font-extrabold text-primary'>
          Reset your password
        </h2>
        <p className='mt-2 text-center text-sm text-muted-foreground'>
          Enter your email address and we&apos;ll send you instructions to reset your password.
        </p>
      </motion.div>

      <motion.div
        className='mt-8 sm:mx-auto sm:w-full sm:max-w-md'
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <div className='bg-card py-8 px-4 shadow sm:rounded-lg sm:px-10'>
          <ForgotPasswordForm />

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

export default ForgotPasswordPage;