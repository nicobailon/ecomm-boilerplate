import type { ButtonHTMLAttributes } from 'react';
import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] border cursor-pointer',
  {
    variants: {
      variant: {
        default: 'border-primary bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 dark:hover:bg-primary/80',
        destructive: 'border-destructive bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 dark:hover:bg-destructive/80',
        outline: 'border-input bg-background hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
        secondary: 'border-secondary bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 dark:hover:bg-secondary/70',
        ghost: 'border-transparent hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
        link: 'border-transparent text-primary underline-offset-4 hover:underline dark:text-primary',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-12 px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled ?? isLoading}
        {...props}
      >
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              className="flex items-center"
            >
              <Loader2 className="h-4 w-4 animate-spin" />
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              className="flex items-center justify-center"
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    );
  },
);

Button.displayName = 'Button';