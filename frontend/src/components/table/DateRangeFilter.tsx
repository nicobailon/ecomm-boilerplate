import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { cn } from '@/lib/utils';

interface DateRangeFilterProps {
  value?: { from?: string; to?: string };
  onChange: (value: { from?: string; to?: string }) => void;
  placeholder?: string;
  className?: string;
}

export function DateRangeFilter({
  value = {},
  onChange,
  placeholder = 'Select date range',
  className,
}: DateRangeFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  const handleApply = () => {
    onChange(localValue);
    setIsOpen(false);
  };

  const handleClear = () => {
    setLocalValue({});
    onChange({});
    setIsOpen(false);
  };

  const formatDateRange = () => {
    if (value.from && value.to) {
      return `${new Date(value.from).toLocaleDateString()} - ${new Date(value.to).toLocaleDateString()}`;
    }
    if (value.from) {
      return `From ${new Date(value.from).toLocaleDateString()}`;
    }
    if (value.to) {
      return `Until ${new Date(value.to).toLocaleDateString()}`;
    }
    return placeholder;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'justify-start text-left font-normal',
            !value.from && !value.to && 'text-muted-foreground',
            className
          )}
        >
          <Calendar className="mr-2 h-4 w-4" />
          {formatDateRange()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4" align="start">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">From</label>
            <Input
              type="date"
              value={localValue.from || ''}
              onChange={(e) => setLocalValue({ ...localValue, from: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">To</label>
            <Input
              type="date"
              value={localValue.to || ''}
              onChange={(e) => setLocalValue({ ...localValue, to: e.target.value })}
              className="mt-1"
              min={localValue.from}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={handleClear}>
              Clear
            </Button>
            <Button size="sm" onClick={handleApply}>
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}