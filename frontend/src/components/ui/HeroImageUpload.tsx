import { useState, useCallback } from 'react';
import { UploadDropzone } from '@/lib/uploadthing';
import { Button } from './Button';
import { OptimizedImage } from './OptimizedImage';
import { Alert } from './Alert';

interface HeroImageUploadProps {
  value?: string;
  onChange: (url: string | undefined) => void;
  disabled?: boolean;
  className?: string;
}

export const HeroImageUpload = ({
  value,
  onChange,
  disabled = false,
  className = '',
}: HeroImageUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleUploadComplete = useCallback((res: { url: string }[]) => {
    if (res?.[0]?.url) {
      onChange(res[0].url);
      setUploadError(null);
    }
    setIsUploading(false);
  }, [onChange]);

  const handleUploadError = useCallback((error: Error) => {
    setUploadError(error.message);
    setIsUploading(false);
  }, []);

  const handleUploadBegin = useCallback(() => {
    setIsUploading(true);
    setUploadError(null);
  }, []);

  const handleRemoveImage = useCallback(() => {
    onChange(undefined);
    setUploadError(null);
  }, [onChange]);

  if (value) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="relative">
          <OptimizedImage
            src={value}
            alt="Hero banner preview"
            className="w-full h-48 object-cover rounded-lg border"
            width={400}
            height={200}
          />
          {!disabled && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2"
              onClick={handleRemoveImage}
            >
              Remove
            </Button>
          )}
        </div>
        {uploadError && (
          <Alert variant="destructive">
            {uploadError}
          </Alert>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {isUploading ? (
        <div className="flex items-center justify-center h-48 border-2 border-dashed border-gray-300 rounded-lg">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="mt-2 text-sm text-gray-600">Uploading hero image...</p>
          </div>
        </div>
      ) : (
        <UploadDropzone
          endpoint="heroImageUploader"
          onClientUploadComplete={handleUploadComplete}
          onUploadError={handleUploadError}
          onUploadBegin={handleUploadBegin}
          disabled={disabled}
          appearance={{
            container: 'border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-gray-400 transition-colors',
            uploadIcon: 'text-gray-400',
            label: 'text-gray-600 font-medium',
            allowedContent: 'text-gray-500 text-sm',
          }}
          content={{
            label: 'Choose hero image or drag and drop',
            allowedContent: 'PNG, JPG, JPEG, WEBP (max 4MB)',
          }}
        />
      )}
      {uploadError && (
        <Alert variant="destructive">
          {uploadError}
        </Alert>
      )}
    </div>
  );
};