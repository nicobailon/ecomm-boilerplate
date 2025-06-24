import * as React from 'react';
import { cn } from '@/lib/utils';

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onCheckedChange?: (checked: boolean) => void;
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, onCheckedChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      props.onChange?.(e);
      onCheckedChange?.(e.target.checked);
    };

    return (
      <input
        type="checkbox"
        className={cn(
          'h-4 w-4 rounded border border-input',
          'text-primary focus:ring-primary focus:ring-2 focus:ring-offset-2',
          'cursor-pointer transition-colors',
          'checked:bg-primary checked:border-primary',
          className,
        )}
        ref={ref}
        onChange={handleChange}
        {...props}
      />
    );
  },
);

Checkbox.displayName = 'Checkbox';

export { Checkbox };