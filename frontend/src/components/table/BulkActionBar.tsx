import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface BulkActionBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  actions?: {
    label: string;
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost';
    onClick: () => void | Promise<void>;
    icon?: React.ReactNode;
    disabled?: boolean;
  }[];
  className?: string;
}

export function BulkActionBar({
  selectedCount,
  onClearSelection,
  actions = [],
  className,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div
      className={cn(
        'bg-muted/50 rounded-lg p-3 flex items-center justify-between animate-in slide-in-from-top-2',
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">
          {selectedCount} {selectedCount === 1 ? 'item' : 'items'} selected
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          className="h-7 px-2"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex items-center gap-2">
        {actions.map((action, index) => (
          <Button
            key={index}
            variant={action.variant || 'outline'}
            size="sm"
            onClick={action.onClick}
            disabled={action.disabled}
          >
            {action.icon && <span className="mr-2">{action.icon}</span>}
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  );
}