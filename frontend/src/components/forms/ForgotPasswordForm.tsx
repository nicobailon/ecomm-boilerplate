import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useForgotPassword } from '@/hooks/auth/useAuth';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const ForgotPasswordForm: React.FC = () => {
  const forgotPassword = useForgotPassword();
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = (data: ForgotPasswordInput) => {
    forgotPassword.mutate(data);
  };

  return (
    <motion.form 
      onSubmit={(...args) => void handleSubmit(onSubmit)(...args)} 
      className="space-y-6" 
      noValidate
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <Input
          label="Email Address"
          type="email"
          placeholder="Enter your email address"
          autoComplete="email"
          aria-label="Email address for password reset"
          {...register('email')}
          error={errors.email?.message}
        />
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Button
          type="submit"
          className="w-full relative overflow-hidden"
          isLoading={isSubmitting || forgotPassword.isPending}
          disabled={forgotPassword.isSuccess}
          aria-label={forgotPassword.isSuccess ? 'Email has been sent' : 'Send password reset instructions'}
        >
          <AnimatePresence mode="wait">
            {forgotPassword.isSuccess ? (
              <motion.span
                key="success"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex items-center justify-center"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Email Sent
              </motion.span>
            ) : (
              <motion.span
                key="send"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                Send Reset Instructions
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </motion.div>

      <AnimatePresence>
        {forgotPassword.isSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
            role="alert"
            aria-live="polite"
          >
            <div className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 mr-3 flex-shrink-0" />
              <p className="text-sm text-green-800 dark:text-green-200">
                Check your email for password reset instructions. If you don&apos;t see it, please check your spam folder.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {forgotPassword.error && (
        <motion.div
          initial={{ opacity: 0, x: 0 }}
          animate={{ opacity: 1, x: [0, -10, 10, -10, 10, 0] }}
          transition={{ duration: 0.4 }}
          className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
          role="alert"
          aria-live="assertive"
        >
          <p className="text-sm text-red-800 dark:text-red-200">
            {forgotPassword.error.message ?? 'Something went wrong. Please try again.'}
          </p>
        </motion.div>
      )}
    </motion.form>
  );
};