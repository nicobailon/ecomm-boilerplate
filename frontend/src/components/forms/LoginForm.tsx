import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import type { LoginInput} from '@/lib/validations';
import { loginSchema } from '@/lib/validations';
import { useLogin } from '@/hooks/auth/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export const LoginForm: React.FC = () => {
  const login = useLogin();
  const [showPassword, setShowPassword] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginInput) => {
    login.mutate(data);
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
          label="Email"
          type="email"
          placeholder="Enter your email"
          autoComplete="email"
          aria-label="Email address"
          {...register('email')}
          error={errors.email?.message}
        />
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Enter your password"
          autoComplete="current-password"
          aria-label="Password"
          {...register('password')}
          error={errors.password?.message}
          rightElement={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-muted-foreground hover:text-primary transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              <AnimatePresence mode="wait">
                {showPassword ? (
                  <motion.div
                    key="hide"
                    initial={{ opacity: 0, rotate: -90 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0, rotate: 90 }}
                    transition={{ duration: 0.15 }}
                  >
                    <EyeOff className="h-4 w-4" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="show"
                    initial={{ opacity: 0, rotate: -90 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0, rotate: 90 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Eye className="h-4 w-4" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          }
        />
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <Button
          type="submit"
          className="w-full relative overflow-hidden group"
          isLoading={isSubmitting || login.isPending}
          aria-label="Sign in to your account"
        >
          <span className="flex items-center justify-center">
            Sign In
            <LogIn className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        </Button>
      </motion.div>

      {login.error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md"
          role="alert"
          aria-live="assertive"
        >
          <p className="text-sm text-red-800 dark:text-red-200">
            {login.error.message ?? 'Invalid email or password. Please try again.'}
          </p>
        </motion.div>
      )}
    </motion.form>
  );
};