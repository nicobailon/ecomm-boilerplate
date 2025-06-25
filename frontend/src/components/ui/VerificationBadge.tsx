import { CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VerificationBadgeProps {
  verified: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const VerificationBadge: React.FC<VerificationBadgeProps> = ({
  verified,
  size = 'md',
  showLabel = false,
  className,
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const Icon = verified ? CheckCircle2 : AlertCircle;
  const colorClass = verified ? 'text-green-500' : 'text-yellow-500';
  const label = verified ? 'Verified' : 'Unverified';

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <Icon 
        className={cn(sizeClasses[size], colorClass)} 
        aria-label={`Email ${label}`}
      />
      {showLabel && (
        <span className={cn('text-sm', colorClass)}>
          {label}
        </span>
      )}
    </div>
  );
};