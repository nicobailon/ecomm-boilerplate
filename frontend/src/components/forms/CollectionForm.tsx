import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Switch } from '@/components/ui/Switch';
import { Label } from '@/components/ui/Label';
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
    },
  });

  const isPublic = watch('isPublic');

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
          <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
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
          <p className="text-sm text-red-500 mt-1">{errors.description.message}</p>
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