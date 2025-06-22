import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Play, Edit, Trash, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MediaItem } from '@/types/media';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface MediaItemCardProps {
  item: MediaItem;
  index: number;
  onDelete: () => void;
  onEdit: () => void;
  isDragging?: boolean;
}

export function MediaItemCard({ 
  item, 
  index, 
  onDelete, 
  onEdit,
  isDragging,
}: MediaItemCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative aspect-square rounded-lg border-2 border-dashed overflow-hidden group',
        index === 0 ? 'border-primary border-solid' : 'border-gray-300',
        isDragging && 'opacity-50',
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className="absolute top-2 left-2 z-10 cursor-grab active:cursor-grabbing"
      >
        <div className="bg-white/80 backdrop-blur-sm rounded p-1 shadow-sm">
          <GripVertical className="w-4 h-4 text-gray-600" />
        </div>
      </div>
      
      {item.type === 'image' ? (
        <img
          src={item.url}
          alt={item.title ?? `Media ${index + 1}`}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="relative w-full h-full">
          <img
            src={item.thumbnail ?? '/placeholder-video.jpg'}
            alt={item.title ?? `Video ${index + 1}`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
            <Play className="w-12 h-12 text-white" />
          </div>
        </div>
      )}
      
      <div className="absolute top-2 right-2">
        <Badge variant="secondary" className="text-xs">
          {index + 1}
        </Badge>
      </div>
      
      <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          size="sm"
          variant="ghost"
          onClick={onEdit}
          className="h-7 w-7 p-0 bg-white/80 backdrop-blur-sm"
        >
          <Edit className="w-3 h-3" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onDelete}
          className="h-7 w-7 p-0 bg-white/80 backdrop-blur-sm text-red-600 hover:text-red-700"
        >
          <Trash className="w-3 h-3" />
        </Button>
      </div>
      
      {index === 0 && (
        <div className="absolute bottom-2 left-2">
          <Badge className="text-xs">Main</Badge>
        </div>
      )}
      
      {item.metadata?.size && (
        <div className="absolute top-10 left-2">
          <Badge variant="outline" className="text-xs bg-white/80">
            {(item.metadata.size / 1024 / 1024).toFixed(1)}MB
          </Badge>
        </div>
      )}
    </div>
  );
}