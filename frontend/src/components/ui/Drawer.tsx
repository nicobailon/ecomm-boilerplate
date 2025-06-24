import * as React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  description?: string;
  side?: 'left' | 'right';
  className?: string;
}

const slideVariants = {
  left: {
    hidden: { x: '-100%' },
    visible: { x: 0 },
    exit: { x: '-100%' },
  },
  right: {
    hidden: { x: '100%' },
    visible: { x: 0 },
    exit: { x: '100%' },
  },
};

export const Drawer = React.forwardRef<HTMLDivElement, DrawerProps>(
  ({ isOpen, onClose, children, title, description, side = 'right', className }, ref) => {
    return (
      <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <AnimatePresence>
          {isOpen && (
            <Dialog.Portal forceMount>
              <Dialog.Overlay asChild>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                />
              </Dialog.Overlay>
              <Dialog.Content asChild>
                <motion.div
                  ref={ref}
                  variants={slideVariants[side]}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  transition={{
                    type: 'spring',
                    damping: 30,
                    stiffness: 300,
                  }}
                  className={cn(
                    'fixed z-50 gap-4 p-6 shadow-lg',
                    'h-full w-full sm:max-w-lg',
                    'focus:outline-none',
                    'bg-white dark:bg-gray-900', // Explicit background colors for light/dark mode
                    'border-l border-border', // Add border for better definition
                    side === 'right' ? 'right-0 top-0' : 'left-0 top-0',
                    className,
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <Dialog.Title className={cn(
                        'text-lg font-semibold text-foreground',
                        !title && 'sr-only',
                      )}>
                        {title ?? 'Dialog'}
                      </Dialog.Title>
                      {description && (
                        <Dialog.Description className="text-sm text-muted-foreground">
                          {description}
                        </Dialog.Description>
                      )}
                    </div>
                    <Dialog.Close asChild>
                      <button
                        className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 hover:bg-accent p-1 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
                        aria-label="Close"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </Dialog.Close>
                  </div>
                  <div className="mt-4 flex-1 overflow-y-auto">
                    {children}
                  </div>
                </motion.div>
              </Dialog.Content>
            </Dialog.Portal>
          )}
        </AnimatePresence>
      </Dialog.Root>
    );
  },
);

Drawer.displayName = 'Drawer';