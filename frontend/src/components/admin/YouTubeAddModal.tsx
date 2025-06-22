import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Youtube, Play } from 'lucide-react';
import { parseYouTubeUrl, getYouTubeThumbnailUrl } from '@/utils/youtube';

const youtubeSchema = z.object({
  url: z.string().url('Please enter a valid URL').refine(
    (url) => {
      const result = parseYouTubeUrl(url);
      return result.isValid;
    },
    'Please enter a valid YouTube URL',
  ),
  title: z.string().min(1, 'Title is required').max(200),
});

type YouTubeFormData = z.infer<typeof youtubeSchema>;

interface YouTubeAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (url: string, title: string) => Promise<void>;
}

export function YouTubeAddModal({ isOpen, onClose, onAdd }: YouTubeAddModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<YouTubeFormData>({
    resolver: zodResolver(youtubeSchema),
  });
  
  const urlValue = watch('url');
  
  useEffect(() => {
    if (urlValue) {
      const result = parseYouTubeUrl(urlValue);
      if (result.isValid && result.videoId) {
        setPreview(getYouTubeThumbnailUrl(result.videoId));
      } else {
        setPreview(null);
      }
    } else {
      setPreview(null);
    }
  }, [urlValue]);
  
  const onSubmit = async (data: YouTubeFormData) => {
    setIsSubmitting(true);
    try {
      await onAdd(data.url, data.title);
      reset();
      onClose();
    } catch {
      // Error handling is done in the parent component
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleClose = () => {
    reset();
    setPreview(null);
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Youtube className="w-5 h-5 text-red-600" />
            Add YouTube Video
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={(e) => { void handleSubmit(onSubmit)(e); }} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">YouTube URL</Label>
            <Input
              id="url"
              placeholder="https://www.youtube.com/watch?v=..."
              {...register('url')}
              disabled={isSubmitting}
            />
            {errors.url && (
              <p className="text-sm text-red-600">{errors.url.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="title">Video Title</Label>
            <Input
              id="title"
              placeholder="Enter a descriptive title"
              {...register('title')}
              disabled={isSubmitting}
            />
            {errors.title && (
              <p className="text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>
          
          {preview && (
            <div className="space-y-2">
              <Label>Preview</Label>
              <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={preview}
                  alt="Video preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-red-600 rounded-full p-3">
                    <Play className="w-8 h-8 text-white ml-1" />
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-700">
              Supported formats: youtube.com/watch?v=..., youtu.be/..., youtube.com/embed/...
            </p>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add Video'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}