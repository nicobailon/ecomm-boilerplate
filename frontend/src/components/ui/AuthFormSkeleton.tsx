import { motion } from 'framer-motion';

interface AuthFormSkeletonProps {
  fields?: number;
  showPasswordStrength?: boolean;
}

export const AuthFormSkeleton: React.FC<AuthFormSkeletonProps> = ({ 
  fields = 2,
  showPasswordStrength = false,
}) => {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      exit="hidden"
      className="space-y-6"
    >
      {Array.from({ length: fields }, (_, i) => (
        <motion.div key={i} variants={item} className="space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse" />
          <div className="relative">
            <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            {i >= fields - 2 && (
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <div className="h-4 w-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
              </div>
            )}
          </div>
          {showPasswordStrength && i === fields - 2 && (
            <div className="mt-3 space-y-2">
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse" />
              <div className="space-y-1">
                {[1, 2, 3, 4].map((j) => (
                  <div key={j} className="flex items-center space-x-1">
                    <div className="h-3 w-3 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      ))}
      
      <motion.div variants={item}>
        <div className="h-10 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
      </motion.div>
      
      <motion.div variants={item} className="flex justify-center">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse" />
      </motion.div>
    </motion.div>
  );
};