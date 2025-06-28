import { Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ExportButtonProps {
  onExport: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export function ExportButton({ 
  onExport, 
  disabled, 
  loading,
  className, 
}: ExportButtonProps) {
  return (
    <Button
      variant="outline"
      onClick={onExport}
      disabled={disabled || loading}
      className={className}
    >
      <Download className="w-4 h-4 mr-2" />
      {loading ? 'Exporting...' : 'Export'}
    </Button>
  );
}