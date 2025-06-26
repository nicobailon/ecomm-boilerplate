import { useState, useCallback } from 'react';
import { UploadDropzone } from '@/lib/uploadthing';
import { Button } from './Button';
import { OptimizedImage } from './OptimizedImage';
import { Alert } from './Alert';
import { Input } from './Input';

interface ProductImageUploadProps {
  value?: string;
  onChange: (url: string | undefined) => void;
  onImagePreviewChange?: (url: string) => void;
  disabled?: boolean;
  className?: string;
  showManualInput?: boolean;
}

export const ProductImageUpload = ({
  value,
  onChange,
  onImagePreviewChange,
  disabled = false,
  className = '',
  showManualInput = true,
}: ProductImageUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleUploadComplete = useCallback((res: { url: string; ufsUrl?: string }[]) => {
    if (res?.[0]) {
      const uploadedFile = res[0];
      const imageUrl = uploadedFile.ufsUrl ?? uploadedFile.url;
      onChange(imageUrl);
      onImagePreviewChange?.(imageUrl);
      setUploadError(null);
    }
    setIsUploading(false);
  }, [onChange, onImagePreviewChange]);

  const handleUploadError = useCallback((error: Error) => {
    setUploadError(error.message);
    setIsUploading(false);
  }, []);

  const handleUploadBegin = useCallback(() => {
    setIsUploading(true);
    setUploadError(null);
  }, []);

  const handleChangeImage = useCallback(() => {
    onChange('');
    onImagePreviewChange?.('');
    setUploadError(null);
  }, [onChange, onImagePreviewChange]);

  const handleManualUrlChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const url = event.target.value;
    onChange(url);
    onImagePreviewChange?.(url);
  }, [onChange, onImagePreviewChange]);

  if (value) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="relative">
          <OptimizedImage
            src={value}
            alt="Product image preview"
            className="w-full h-48 object-cover rounded-lg border"
            width={400}
            height={200}
          />
          {!disabled && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="absolute top-2 right-2"
              onClick={handleChangeImage}
            >
              Change Image
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
            <p className="mt-2 text-sm text-gray-600">Uploading product image...</p>
          </div>
        </div>
      ) : (
        <>
          <UploadDropzone
            endpoint="productImageUploader"
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
              label: 'Choose product image or drag and drop',
              allowedContent: 'PNG, JPG, JPEG, WEBP (max 4MB)',
            }}
          />
          {showManualInput && (
            <>
              <div className="text-sm text-muted-foreground text-center">
                or
              </div>
              <Input
                value={value ?? ''}
                onChange={handleManualUrlChange}
                placeholder="Enter image URL manually"
                type="url"
                disabled={disabled}
              />
            </>
          )}
        </>
      )}
      {uploadError && (
        <Alert variant="destructive">
          {uploadError}
        </Alert>
      )}
    </div>
  );
};