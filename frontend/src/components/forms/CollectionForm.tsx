import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Switch } from '@/components/ui/Switch';
import { Label } from '@/components/ui/Label';
import { HeroImageUpload } from '@/components/ui/HeroImageUpload';
import { type RouterOutputs } from '@/lib/trpc';

type Collection = RouterOutputs['collection']['getById'];

// Schema for form validation - matches the backend but without products array
const collectionFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Collection name is required')
    .max(100, 'Collection name cannot exceed 100 characters')
    .trim(),
  description: z
    .string()
    .max(500, 'Collection description cannot exceed 500 characters')
    .trim()
    .optional(),
  isPublic: z.boolean(),
  heroImage: z.string().url().optional().or(z.literal('')),
  heroTitle: z.string().max(100, 'Hero title cannot exceed 100 characters').trim().optional(),
  heroSubtitle: z.string().max(200, 'Hero subtitle cannot exceed 200 characters').trim().optional(),
  isFeatured: z.boolean(),
});

type CollectionFormData = z.infer<typeof collectionFormSchema>;

interface CollectionFormProps {
  mode: 'create' | 'edit';
  initialData?: Collection;
  onSubmit: (data: CollectionFormData) => void;
  isLoading?: boolean;
}

export const CollectionForm: React.FC<CollectionFormProps> = ({
  mode,
  initialData,
  onSubmit,
  isLoading = false,
}) => {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CollectionFormData>({
    resolver: zodResolver(collectionFormSchema),
    defaultValues: {
      name: initialData?.name ?? '',
      description: initialData?.description ?? '',
      isPublic: initialData?.isPublic ?? false,
      heroImage: String(initialData?.heroImage ?? ''),
      heroTitle: String(initialData?.heroTitle ?? ''),
      heroSubtitle: String(initialData?.heroSubtitle ?? ''),
      isFeatured: Boolean(initialData?.isFeatured),
    },
  });

  const isPublic = watch('isPublic');
  const isFeatured = watch('isFeatured');
  const heroImage = watch('heroImage');

  const handleFormSubmit = (data: CollectionFormData) => {
    onSubmit(data);
  };

  return (
    <form onSubmit={(...args) => void handleSubmit(handleFormSubmit)(...args)} className="space-y-4">
      <div>
        <Label htmlFor="name">Collection Name</Label>
        <Input
          id="name"
          {...register('name')}
          placeholder="Enter collection name"
          disabled={isLoading || isSubmitting}
        />
        {errors.name && (
          <p className="text-sm text-red-500 mt-1">{String(errors.name.message)}</p>
        )}
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          {...register('description')}
          placeholder="Enter collection description (optional)"
          rows={4}
          disabled={isLoading || isSubmitting}
        />
        {errors.description && (
          <p className="text-sm text-red-500 mt-1">{String(errors.description.message)}</p>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="isPublic"
          checked={isPublic}
          onCheckedChange={(checked) => setValue('isPublic', checked)}
          disabled={isLoading || isSubmitting}
        />
        <Label htmlFor="isPublic" className="cursor-pointer">
          Make this collection public
        </Label>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="isFeatured"
          checked={isFeatured}
          onCheckedChange={(checked) => setValue('isFeatured', checked)}
          disabled={isLoading || isSubmitting}
        />
        <Label htmlFor="isFeatured" className="cursor-pointer">
          Feature this collection (show on homepage)
        </Label>
      </div>

      {/* Hero Content Section */}
      <div className="border-t pt-4 space-y-4">
        <h3 className="text-lg font-semibold">Hero Banner (Optional)</h3>
        
        <div>
          <Label htmlFor="heroImage">Hero Image</Label>
          <HeroImageUpload
            value={heroImage ?? undefined}
            onChange={(url) => setValue('heroImage', url ?? '')}
            disabled={isLoading || isSubmitting}
          />
          {errors.heroImage && (
            <p className="text-sm text-red-500 mt-1">{String(errors.heroImage.message)}</p>
          )}
        </div>

        <div>
          <Label htmlFor="heroTitle">Hero Title</Label>
          <Input
            id="heroTitle"
            {...register('heroTitle')}
            placeholder="Enter hero banner title (optional)"
            disabled={isLoading || isSubmitting}
          />
          {errors.heroTitle && (
            <p className="text-sm text-red-500 mt-1">{String(errors.heroTitle.message)}</p>
          )}
        </div>

        <div>
          <Label htmlFor="heroSubtitle">Hero Subtitle</Label>
          <Textarea
            id="heroSubtitle"
            {...register('heroSubtitle')}
            placeholder="Enter hero banner subtitle (optional)"
            rows={2}
            disabled={isLoading || isSubmitting}
          />
          {errors.heroSubtitle && (
            <p className="text-sm text-red-500 mt-1">{String(errors.heroSubtitle.message)}</p>
          )}
        </div>
      </div>

      <Button
        type="submit"
        disabled={isLoading || isSubmitting}
        className="w-full"
      >
        {isLoading || isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Collection' : 'Update Collection'}
      </Button>
    </form>
  );
};