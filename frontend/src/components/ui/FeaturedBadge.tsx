import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeaturedBadgeProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const FeaturedBadge = ({ className, size = 'md', showText = true }: FeaturedBadgeProps) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  return (
    <div 
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-warning text-warning-foreground font-medium',
        sizeClasses[size],
        className,
      )}
    >
      <Star className={cn(iconSizes[size], 'fill-current')} />
      {showText && <span>Featured</span>}
    </div>
  );
};