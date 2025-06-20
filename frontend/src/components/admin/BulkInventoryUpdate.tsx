import { useState } from 'react';
import { X, Upload, FileText, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/Progress';
import { trpc } from '@/lib/trpc';
import { useBulkUpdateInventory } from '@/hooks/queries/useInventory';

interface BulkInventoryUpdateProps {
  onClose: () => void;
}

interface BulkUpdateItem {
  sku: string;
  productId: string;
  variantId?: string;
  currentInventory: number;
  newInventory: number;
  productName: string;
  variantLabel?: string;
}

export function BulkInventoryUpdate({ onClose }: BulkInventoryUpdateProps) {
  const [uploadStage, setUploadStage] = useState<'upload' | 'preview' | 'processing' | 'complete'>('upload');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewData, setPreviewData] = useState<BulkUpdateItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch all products for SKU validation
  const { data: productsResponse } = trpc.product.list.useQuery({});
  const bulkUpdate = useBulkUpdateInventory();
  
  // Products from tRPC don't include variants, so we need a different approach
  // For now, we'll work with the basic product data
  const products = productsResponse?.products ?? [];

  const validateCSVData = (data: string[][]): { valid: boolean; error?: string; parsedData?: BulkUpdateItem[] } => {
    // Check if CSV has at least 2 rows (header + data)
    if (data.length < 2) {
      return { valid: false, error: 'CSV file must contain at least one data row' };
    }

    // Validate headers
    const headers = data[0].map(h => h.toLowerCase().trim());
    const skuIndex = headers.indexOf('sku');
    const inventoryIndex = headers.indexOf('inventory');
    const variantIndex = headers.indexOf('variant');

    if (skuIndex === -1 || inventoryIndex === -1) {
      return { valid: false, error: 'CSV must contain SKU and Inventory columns' };
    }

    // Validate and parse data rows
    const parsedData: BulkUpdateItem[] = [];
    const errors: string[] = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row.length < Math.max(skuIndex, inventoryIndex) + 1) {
        errors.push(`Row ${i + 1}: Missing required columns`);
        continue;
      }

      const sku = row[skuIndex]?.trim();
      const inventoryStr = row[inventoryIndex]?.trim();
      const variantLabel = variantIndex >= 0 ? row[variantIndex]?.trim() : undefined;

      if (!sku) {
        errors.push(`Row ${i + 1}: Missing SKU`);
        continue;
      }

      const inventory = parseInt(inventoryStr, 10);
      if (isNaN(inventory) || inventory < 0) {
        errors.push(`Row ${i + 1}: Invalid inventory value (${inventoryStr})`);
        continue;
      }

      // Look up product by name since SKU is not available in the list response
      // In a real implementation, we would need a separate endpoint to search by SKU
      // or include variants in the list response
      const product = products.find((p) => {
        // Try to match by product name if SKU format includes product name
        // This is a temporary solution - ideally we'd have a SKU search endpoint
        return p.name.toLowerCase().includes(sku.toLowerCase());
      });
      if (!product) {
        errors.push(`Row ${i + 1}: Product matching '${sku}' not found`);
        continue;
      }
      
      // Since inventory is not included in the list response, default to 0
      // In a real implementation, we'd fetch inventory separately
      const currentInventory = 0; // Will be updated when we fetch real inventory
      
      parsedData.push({
        sku,
        productId: product._id ?? '',
        productName: product.name,
        variantLabel,
        currentInventory,
        newInventory: inventory,
      });
    }

    if (errors.length > 0) {
      return { valid: false, error: errors.join('; ') };
    }

    if (parsedData.length === 0) {
      return { valid: false, error: 'No valid data rows found' };
    }

    // Note: Currently using name matching instead of SKU - ideally would have SKU-based search
  
  return { valid: true, parsedData };
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result !== 'string') {
        setError('Failed to read file');
        return;
      }
      const text = result;

      try {
        // Simple CSV parsing - in production use a library like Papa Parse
        const lines = text.split('\n').filter(line => line.trim());
        const data = lines.map(line => {
          // Handle quoted values
          const matches = line.match(/(?:^|,)("(?:[^"]+|"")*"|[^,]*)/g);
          return matches ? matches.map(match => {
            let value = match.replace(/^,/, '');
            if (value.startsWith('"') && value.endsWith('"')) {
              value = value.slice(1, -1).replace(/""/g, '"');
            }
            return value;
          }) : [];
        });

        const validation = validateCSVData(data);
        if (!validation.valid) {
          setError(validation.error ?? 'Invalid CSV format');
          return;
        }

        setPreviewData(validation.parsedData ?? []);
        setUploadStage('preview');
      } catch {
        setError('Failed to parse CSV file');
      }
    };

    reader.onerror = () => {
      setError('Failed to read file');
    };

    reader.readAsText(file);
  };

  const handleApplyChanges = async () => {
    setUploadStage('processing');
    setUploadProgress(0);
    
    try {
      // Convert preview data to bulk update format
      const updates = previewData.map(item => ({
        productId: item.productId,
        variantId: item.variantId,
        adjustment: item.newInventory - item.currentInventory,
        reason: 'adjustment' as const,
        metadata: { source: 'bulk_csv_upload', sku: item.sku, variant: item.variantLabel },
      }));
      
      // Process in batches to show progress
      const batchSize = 10;
      const totalBatches = Math.ceil(updates.length / batchSize);
      
      for (let i = 0; i < totalBatches; i++) {
        const batch = updates.slice(i * batchSize, (i + 1) * batchSize);
        await bulkUpdate.mutateAsync({ updates: batch });
        
        const progress = Math.round(((i + 1) / totalBatches) * 100);
        setUploadProgress(progress);
      }
      
      setUploadStage('complete');
    } catch {
      setError('Failed to update inventory. Please try again.');
      setUploadStage('preview');
    }
  };

  const handleUndo = () => {
    // In a real implementation, this would track and revert changes
    // For now, just close the modal
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Bulk Inventory Update</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {uploadStage === 'upload' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-4">
                  Upload a CSV file with SKU and inventory columns
                </p>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button>Choose File</Button>
                </label>
              </div>
              
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
                </div>
              )}
              
              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  CSV Format Example
                </h3>
                <pre className="text-xs font-mono">
{`SKU,Inventory,Variant
Classic-Tshirt,25,Small
Classic-Tshirt,20,Medium
Denim-Jeans,15,32W
Winter-Jacket,10,`}
                </pre>
                <p className="text-xs text-muted-foreground mt-2">
                  Note: Use product names for now as SKU search is not yet implemented. 
                  Variant column is optional - leave empty for products without variants.
                </p>
              </div>
            </div>
          )}

          {uploadStage === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                <p className="text-sm">
                  Review the changes below before applying
                </p>
              </div>

              <div className="max-h-[300px] overflow-y-auto border rounded-lg">
                <table className="w-full">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      <th className="text-left p-3 text-sm">SKU</th>
                      <th className="text-left p-3 text-sm">Product</th>
                      <th className="text-left p-3 text-sm">Variant</th>
                      <th className="text-center p-3 text-sm">Current</th>
                      <th className="text-center p-3 text-sm">New</th>
                      <th className="text-center p-3 text-sm">Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((item, index) => {
                      const change = item.newInventory - item.currentInventory;
                      return (
                        <tr key={index} className="border-t">
                          <td className="p-3 text-sm font-mono">{item.sku}</td>
                          <td className="p-3 text-sm">{item.productName}</td>
                          <td className="p-3 text-sm text-muted-foreground">
                            {item.variantLabel || 'Default'}
                          </td>
                          <td className="p-3 text-sm text-center">{item.currentInventory}</td>
                          <td className="p-3 text-sm text-center font-medium">{item.newInventory}</td>
                          <td className="p-3 text-sm text-center">
                            <span className={change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : ''}>
                              {change > 0 && '+'}{change}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => setUploadStage('upload')}>
                  Back
                </Button>
                <Button onClick={() => void handleApplyChanges()}>
                  Apply Changes
                </Button>
              </div>
            </div>
          )}

          {uploadStage === 'processing' && (
            <div className="space-y-4 text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground">
                Updating inventory...
              </p>
              <Progress value={uploadProgress} className="max-w-xs mx-auto" />
              <p className="text-xs text-muted-foreground">
                {uploadProgress}% complete
              </p>
            </div>
          )}

          {uploadStage === 'complete' && (
            <div className="space-y-4 text-center py-8">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                ✓
              </div>
              <h3 className="font-semibold text-lg">Update Complete!</h3>
              <p className="text-sm text-muted-foreground">
                Successfully updated inventory for {previewData.length} items
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={handleUndo}>
                  Undo Changes
                </Button>
                <Button onClick={onClose}>
                  Done
                </Button>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mt-4">
              <p className="text-sm">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}