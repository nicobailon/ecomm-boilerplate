import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface TransitionOverlayProps {
  isVisible: boolean;
  message?: string;
}

export function TransitionOverlay({ isVisible, message }: TransitionOverlayProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
        >
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
            {message && <p className="text-sm text-gray-300">{message}</p>}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}