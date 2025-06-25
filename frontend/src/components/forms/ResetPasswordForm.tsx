import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useResetPassword } from '@/hooks/auth/useAuth';

const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords don\'t match',
  path: ['confirmPassword'],
});

type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

interface ResetPasswordFormProps {
  token: string;
}

export const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({ token }) => {
  const resetPassword = useResetPassword();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const password = watch('password') ?? '';
  
  const getPasswordStrength = (password: string): { strength: string; color: string; percentage: number } => {
    if (!password) return { strength: '', color: '', percentage: 0 };
    if (password.length < 6) return { strength: 'Too short', color: 'text-red-500', percentage: 25 };
    if (password.length < 8) return { strength: 'Weak', color: 'text-orange-500', percentage: 50 };
    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) return { strength: 'Fair', color: 'text-yellow-500', percentage: 75 };
    return { strength: 'Strong', color: 'text-green-500', percentage: 100 };
  };

  const passwordRequirements = [
    { met: password.length >= 6, text: 'At least 6 characters' },
    { met: password.length >= 8, text: '8+ characters recommended' },
    { met: /[A-Z]/.test(password), text: 'One uppercase letter' },
    { met: /[0-9]/.test(password), text: 'One number' },
  ];

  const { strength, color, percentage } = getPasswordStrength(password);

  const onSubmit = (data: ResetPasswordInput) => {
    resetPassword.mutate({ token, password: data.password });
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
          label="New Password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          aria-label="New password"
          aria-describedby="password-requirements"
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
        
        <AnimatePresence>
          {password && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-3 space-y-2"
            >
              <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className={`absolute left-0 top-0 h-full ${color.replace('text-', 'bg-')}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                />
              </div>
              <p className={`text-sm ${color} font-medium`}>
                Password strength: {strength}
              </p>
              <div id="password-requirements" className="space-y-1">
                {passwordRequirements.map((req, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    className={`flex items-center text-xs ${
                      req.met ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {req.met ? (
                      <Check className="h-3 w-3 mr-1" />
                    ) : (
                      <X className="h-3 w-3 mr-1" />
                    )}
                    {req.text}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <Input
          label="Confirm Password"
          type={showConfirmPassword ? 'text' : 'password'}
          autoComplete="new-password"
          aria-label="Confirm new password"
          {...register('confirmPassword')}
          error={errors.confirmPassword?.message}
          rightElement={
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="text-muted-foreground hover:text-primary transition-colors"
              aria-label={showConfirmPassword ? 'Hide password confirmation' : 'Show password confirmation'}
            >
              <AnimatePresence mode="wait">
                {showConfirmPassword ? (
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
          className="w-full"
          isLoading={isSubmitting || resetPassword.isPending}
          aria-label="Reset password with new password"
        >
          Reset Password
        </Button>
      </motion.div>
    </motion.form>
  );
};