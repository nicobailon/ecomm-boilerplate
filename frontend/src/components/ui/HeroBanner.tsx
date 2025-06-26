import { motion } from 'framer-motion';
import { Button } from './Button';
import { OptimizedImage } from './OptimizedImage';

interface HeroBannerProps {
  title: string;
  subtitle?: string;
  imageUrl: string;
  buttonText?: string;
  buttonUrl?: string;
  height?: 'small' | 'medium' | 'large';
  overlay?: boolean;
  className?: string;
}

const heightClasses = {
  small: 'h-64 sm:h-80',
  medium: 'h-80 sm:h-96',
  large: 'h-96 sm:h-[32rem]',
};

export function HeroBanner({
  title,
  subtitle,
  imageUrl,
  buttonText,
  buttonUrl,
  height = 'medium',
  overlay = true,
  className = '',
}: HeroBannerProps) {
  const handleButtonClick = () => {
    if (buttonUrl) {
      window.location.href = buttonUrl;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className={`relative overflow-hidden rounded-lg ${heightClasses[height]} ${className}`}
    >
      <OptimizedImage
        src={imageUrl}
        alt={title}
        className="absolute inset-0 h-full w-full object-cover"
      />
      
      {overlay && (
        <div className="absolute inset-0 bg-black/40" />
      )}
      
      <div className="relative flex h-full items-center justify-center px-6 sm:px-12">
        <div className="text-center text-white max-w-3xl">
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
          >
            {title}
          </motion.h1>
          
          {subtitle && (
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-4 text-lg sm:text-xl text-gray-200 max-w-2xl mx-auto"
            >
              {subtitle}
            </motion.p>
          )}
          
          {buttonText && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="mt-8"
            >
              <Button
                onClick={handleButtonClick}
                size="lg"
                className="bg-white text-gray-900 hover:bg-gray-100 px-8 py-3 text-lg font-semibold"
              >
                {buttonText}
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}