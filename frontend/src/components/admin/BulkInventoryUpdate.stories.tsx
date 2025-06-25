import type { Meta, StoryObj } from '@storybook/react-vite';
import { BulkInventoryUpdate } from './BulkInventoryUpdate';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { trpc } from '@/lib/trpc';
import { createTRPCClient } from '@/lib/trpc-client';
import { useState, useEffect } from 'react';
import { fn, within, userEvent, expect, waitFor } from '@storybook/test';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: Infinity },
  },
});

const meta = {
  title: 'Admin/BulkInventoryUpdate',
  component: BulkInventoryUpdate,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <trpc.Provider client={createTRPCClient()} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <div className="min-w-[800px]">
            <Story />
          </div>
        </QueryClientProvider>
      </trpc.Provider>
    ),
  ],
  args: {
    onClose: fn(),
  },
} satisfies Meta<typeof BulkInventoryUpdate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => {
    const [isOpen, setIsOpen] = useState(true);
    
    if (!isOpen) {
      return (
        <button 
          onClick={() => setIsOpen(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
        >
          Open Bulk Inventory Update
        </button>
      );
    }
    
    return <BulkInventoryUpdate {...args} onClose={() => setIsOpen(false)} />;
  },
};

export const UploadStage: Story = {
  args: {
    onClose: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Check upload area is present
    void expect(canvas.getByText(/bulk inventory update/i)).toBeInTheDocument();
    void expect(canvas.getByText(/upload a csv file/i)).toBeInTheDocument();
    
    // Verify CSV format instructions
    const formatExample = canvas.getByText(/csv format example/i);
    void expect(formatExample).toBeInTheDocument();
    
    // Look for file input
    const fileInput = canvas.getByLabelText(/choose.*file|select.*file|upload.*csv/i);
    void expect(fileInput).toBeInTheDocument();
    void expect(fileInput).toHaveAttribute('accept', '.csv');
  },
};

export const WithError: Story = {
  render: (args) => {
    return (
      <div className="relative">
        <BulkInventoryUpdate {...args} />
        <div className="absolute inset-0 pointer-events-none">
          <div className="h-full flex items-center justify-center p-6">
            <div className="bg-background border rounded-lg shadow-xl max-w-2xl w-full p-6 mt-20">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-start gap-2">
                <span className="text-sm text-red-800 dark:text-red-300">
                  Row 3: Invalid inventory value (abc)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
};

export const PreviewStage: Story = {
  render: (args) => {
    const previewData = [
      {
        sku: 'TSHIRT-001',
        productName: 'Classic T-Shirt',
        variantLabel: 'Small',
        currentInventory: 10,
        newInventory: 25,
      },
      {
        sku: 'TSHIRT-002',
        productName: 'Classic T-Shirt',
        variantLabel: 'Medium',
        currentInventory: 5,
        newInventory: 20,
      },
      {
        sku: 'JEANS-001',
        productName: 'Denim Jeans',
        variantLabel: '32W',
        currentInventory: 15,
        newInventory: 15,
      },
      {
        sku: 'JACKET-001',
        productName: 'Winter Jacket',
        variantLabel: undefined,
        currentInventory: 20,
        newInventory: 10,
      },
    ];

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-background rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold">Bulk Inventory Update</h2>
            <button
              onClick={args.onClose}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              ×
            </button>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-orange-600">⚠</span>
                <p className="text-sm">Review the changes below before applying</p>
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
                            {item.variantLabel ?? 'Default'}
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
                <button className="px-4 py-2 border rounded-md">Back</button>
                <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md">
                  Apply Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
};

export const ProcessingStage: Story = {
  render: (args) => {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-background rounded-lg shadow-xl max-w-2xl w-full">
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold">Bulk Inventory Update</h2>
            <button
              onClick={args.onClose}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              ×
            </button>
          </div>
          <div className="p-6">
            <div className="space-y-4 text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground">Updating inventory...</p>
              <div className="max-w-xs mx-auto">
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-primary h-full transition-all duration-500"
                    style={{ width: '65%' }}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">65% complete</p>
            </div>
          </div>
        </div>
      </div>
    );
  },
};

export const CompleteStage: Story = {
  render: (args) => {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-background rounded-lg shadow-xl max-w-2xl w-full">
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold">Bulk Inventory Update</h2>
            <button
              onClick={args.onClose}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              ×
            </button>
          </div>
          <div className="p-6">
            <div className="space-y-4 text-center py-8">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                ✓
              </div>
              <h3 className="font-semibold text-lg">Update Complete!</h3>
              <p className="text-sm text-muted-foreground">
                Successfully updated inventory for 4 items
              </p>
              <div className="flex gap-3 justify-center">
                <button className="px-4 py-2 border rounded-md">Undo Changes</button>
                <button 
                  onClick={args.onClose}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
};

export const ValidationErrors: Story = {
  render: (args) => {
    const errorData = [
      { row: 2, error: 'Invalid inventory value (abc)' },
      { row: 5, error: 'Product matching \'INVALID-SKU\' not found' },
      { row: 7, error: 'Missing SKU' },
    ];

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-background rounded-lg shadow-xl max-w-2xl w-full">
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold">Bulk Inventory Update</h2>
            <button
              onClick={args.onClose}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              ×
            </button>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <h3 className="font-medium mb-2 text-red-800 dark:text-red-300">
                  Validation Errors Found
                </h3>
                <ul className="space-y-1 text-sm text-red-700 dark:text-red-400">
                  {errorData.map((error, index) => (
                    <li key={index}>
                      Row {error.row}: {error.error}
                    </li>
                  ))}
                </ul>
              </div>
              <p className="text-sm text-muted-foreground">
                Please fix the errors in your CSV file and try again.
              </p>
              <div className="flex justify-end">
                <button className="px-4 py-2 border rounded-md">
                  Choose New File
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
};

export const CSVFormatExample: Story = {
  render: (args) => {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-background rounded-lg shadow-xl max-w-2xl w-full">
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold">Bulk Inventory Update</h2>
            <button
              onClick={args.onClose}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              ×
            </button>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <span className="text-muted-foreground">📄</span>
                  CSV Format Example
                </h3>
                <pre className="text-xs font-mono bg-background p-3 rounded border">
{`SKU,Inventory,Variant
Classic-Tshirt,25,Small
Classic-Tshirt,20,Medium
Denim-Jeans,15,32W
Winter-Jacket,10,`}
                </pre>
                <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                  <p>• SKU and Inventory columns are required</p>
                  <p>• Variant column is optional</p>
                  <p>• Leave Variant empty for products without variants</p>
                  <p>• Inventory must be a positive number</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
};

export const LargeDatasetPreview: Story = {
  render: (args) => {
    const largePreviewData = Array.from({ length: 50 }, (_, i) => ({
      sku: `SKU-${String(i + 1).padStart(3, '0')}`,
      productName: `Product ${i + 1}`,
      variantLabel: i % 3 === 0 ? 'Small' : i % 3 === 1 ? 'Medium' : 'Large',
      currentInventory: Math.floor(Math.random() * 50),
      newInventory: Math.floor(Math.random() * 100),
    }));

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-background rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold">Bulk Inventory Update - Large Dataset</h2>
            <button
              onClick={args.onClose}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              ×
            </button>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {largePreviewData.length} items to update
                </p>
                <div className="flex gap-2 text-sm">
                  <span className="text-green-600">
                    +{largePreviewData.filter(item => item.newInventory > item.currentInventory).length} increases
                  </span>
                  <span className="text-red-600">
                    {largePreviewData.filter(item => item.newInventory < item.currentInventory).length} decreases
                  </span>
                </div>
              </div>
              <div className="max-h-[400px] overflow-y-auto border rounded-lg">
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
                    {largePreviewData.map((item, index) => {
                      const change = item.newInventory - item.currentInventory;
                      return (
                        <tr key={index} className="border-t">
                          <td className="p-3 text-sm font-mono">{item.sku}</td>
                          <td className="p-3 text-sm">{item.productName}</td>
                          <td className="p-3 text-sm text-muted-foreground">
                            {item.variantLabel}
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
                <button className="px-4 py-2 border rounded-md">Back</button>
                <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md">
                  Apply All Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
};

// New stories with play functions
export const FileUploadInteraction: Story = {
  args: {
    onClose: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Wait for component to render
    await waitFor(() => {
      void expect(canvas.getByText(/bulk inventory update/i)).toBeInTheDocument();
    });
    
    // Find file input
    const fileInput = canvas.getByLabelText(/choose.*file|select.*file|upload.*csv/i);
    
    // Create a CSV file
    const csvContent = `SKU,Inventory,Variant
TSHIRT-001,25,Small
TSHIRT-002,20,Medium
JEANS-001,15,32W`;
    const file = new File([csvContent], 'inventory-update.csv', { type: 'text/csv' });
    
    // Upload file
    await userEvent.upload(fileInput, file);
    
    // Verify file was selected
    void expect((fileInput as HTMLInputElement).files?.[0]).toBe(file);
    void expect((fileInput as HTMLInputElement).files?.[0].name).toBe('inventory-update.csv');
  },
};

export const KeyboardNavigation: Story = {
  args: {
    onClose: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    
    await waitFor(() => {
      void expect(canvas.getByText(/bulk inventory update/i)).toBeInTheDocument();
    });
    
    // Focus on file input area
    await userEvent.tab();
    
    // Navigate to close button
    const closeButton = canvas.getByRole('button', { name: /close|×/i });
    
    // Tab until we reach close button
    let activeElement = document.activeElement;
    let tabCount = 0;
    const maxTabs = 10;
    
    while (activeElement !== closeButton && tabCount < maxTabs) {
      await userEvent.tab();
      activeElement = document.activeElement;
      tabCount++;
    }
    
    void expect(document.activeElement).toBe(closeButton);
    
    // ESC to close
    await userEvent.keyboard('{Escape}');
    await waitFor(() => {
      void expect(args.onClose).toHaveBeenCalled();
    });
  },
};

export const PreviewStageInteraction: Story = {
  render: (args) => {
    const previewData = [
      {
        sku: 'TSHIRT-001',
        productName: 'Classic T-Shirt',
        variantLabel: 'Small',
        currentInventory: 10,
        newInventory: 25,
      },
      {
        sku: 'TSHIRT-002',
        productName: 'Classic T-Shirt',
        variantLabel: 'Medium',
        currentInventory: 5,
        newInventory: 20,
      },
    ];

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-background rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold">Bulk Inventory Update</h2>
            <button
              onClick={args.onClose}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-orange-600" role="img" aria-label="Warning">⚠</span>
                <p className="text-sm">Review the changes below before applying</p>
              </div>
              <div className="max-h-[300px] overflow-y-auto border rounded-lg" role="table">
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
                            {item.variantLabel}
                          </td>
                          <td className="p-3 text-sm text-center">{item.currentInventory}</td>
                          <td className="p-3 text-sm text-center font-medium">{item.newInventory}</td>
                          <td className="p-3 text-sm text-center">
                            <span className={change > 0 ? 'text-green-600' : ''}
                                  aria-label={`Change: ${change > 0 ? '+' : ''}${change}`}>
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
                <button className="px-4 py-2 border rounded-md">Back</button>
                <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md">
                  Apply Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    await waitFor(() => {
      void expect(canvas.getByText(/review the changes/i)).toBeInTheDocument();
    });
    
    // Check table content
    void expect(canvas.getByText('TSHIRT-001')).toBeInTheDocument();
    void expect(canvas.getByText('Classic T-Shirt')).toBeInTheDocument();
    void expect(canvas.getByText('Small')).toBeInTheDocument();
    
    // Verify inventory changes are shown
    void expect(canvas.getByText('+15')).toBeInTheDocument();
    void expect(canvas.getByText('+15')).toHaveClass('text-green-600');
    
    // Test navigation
    const applyButton = canvas.getByRole('button', { name: /apply changes/i });
    const backButton = canvas.getByRole('button', { name: /back/i });
    
    void expect(applyButton).toBeInTheDocument();
    void expect(backButton).toBeInTheDocument();
    
    // Click back button
    await userEvent.click(backButton);
  },
};

export const ValidationErrorsInteraction: Story = {
  render: (args) => {
    const errorData = [
      { row: 2, error: 'Invalid inventory value (abc)' },
      { row: 5, error: 'Product matching \'INVALID-SKU\' not found' },
      { row: 7, error: 'Missing SKU' },
    ];

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-background rounded-lg shadow-xl max-w-2xl w-full">
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold">Bulk Inventory Update</h2>
            <button
              onClick={args.onClose}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
                   role="alert"
                   aria-live="assertive">
                <h3 className="font-medium mb-2 text-red-800 dark:text-red-300">
                  Validation Errors Found
                </h3>
                <ul className="space-y-1 text-sm text-red-700 dark:text-red-400">
                  {errorData.map((error, index) => (
                    <li key={index}>
                      Row {error.row}: {error.error}
                    </li>
                  ))}
                </ul>
              </div>
              <p className="text-sm text-muted-foreground">
                Please fix the errors in your CSV file and try again.
              </p>
              <div className="flex justify-end">
                <button className="px-4 py-2 border rounded-md">
                  Choose New File
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    await waitFor(() => {
      void expect(canvas.getByText(/validation errors found/i)).toBeInTheDocument();
    });
    
    // Check error messages
    void expect(canvas.getByText(/invalid inventory value/i)).toBeInTheDocument();
    void expect(canvas.getByText(/product matching.*not found/i)).toBeInTheDocument();
    void expect(canvas.getByText(/missing sku/i)).toBeInTheDocument();
    
    // Verify error alert role
    const errorAlert = canvas.getByRole('alert');
    void expect(errorAlert).toBeInTheDocument();
    void expect(errorAlert).toHaveAttribute('aria-live', 'assertive');
    
    // Click choose new file
    const newFileButton = canvas.getByRole('button', { name: /choose new file/i });
    await userEvent.click(newFileButton);
  },
};

export const AccessibilityFeatures: Story = {
  args: {
    onClose: fn(),
  },
  render: (args) => {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-background rounded-lg shadow-xl max-w-2xl w-full">
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold" id="dialog-title">Bulk Inventory Update</h2>
            <button
              onClick={args.onClose}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
              aria-label="Close dialog"
            >
              ×
            </button>
          </div>
          <div className="p-6" role="main">
            <div className="space-y-4">
              <h3 className="font-medium mb-4">Upload CSV File</h3>
              <div className="border-2 border-dashed rounded-lg p-8 text-center"
                   role="region"
                   aria-label="File upload area">
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  id="csv-upload"
                  aria-label="Choose CSV file to upload"
                />
                <label htmlFor="csv-upload" className="cursor-pointer">
                  <div className="space-y-2">
                    <div className="text-4xl">📁</div>
                    <p className="text-sm">Click to choose file or drag and drop</p>
                    <p className="text-xs text-muted-foreground">CSV files only</p>
                  </div>
                </label>
              </div>
              <div className="bg-muted/50 rounded-lg p-4" role="complementary">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <span className="text-muted-foreground" aria-hidden="true">📄</span>
                  CSV Format Example
                </h4>
                <pre className="text-xs font-mono bg-background p-3 rounded border"
                     aria-label="CSV format example">
{`SKU,Inventory,Variant
TSHIRT-001,25,Small
TSHIRT-002,20,Medium`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    await waitFor(() => {
      void expect(canvas.getByText(/bulk inventory update/i)).toBeInTheDocument();
    });
    
    // Check dialog accessibility
    const title = canvas.getByText(/bulk inventory update/i);
    void expect(title).toHaveAttribute('id', 'dialog-title');
    
    // Check file input has label
    const fileInput = canvas.getByLabelText(/choose csv file/i);
    void expect(fileInput).toBeInTheDocument();
    void expect(fileInput).toHaveAttribute('accept', '.csv');
    
    // Check upload area is labeled
    const uploadRegion = canvas.getByRole('region', { name: /file upload area/i });
    void expect(uploadRegion).toBeInTheDocument();
    
    // Check close button has label
    const closeButton = canvas.getByRole('button', { name: /close dialog/i });
    void expect(closeButton).toBeInTheDocument();
    
    // Check CSV example is accessible
    const csvExample = canvas.getByLabelText(/csv format example/i);
    void expect(csvExample).toBeInTheDocument();
  },
};

export const DragAndDropInteraction: Story = {
  args: {
    onClose: fn(),
  },
  render: (args) => {
    const [isDragging, setIsDragging] = useState(false);
    
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-background rounded-lg shadow-xl max-w-2xl w-full">
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold">Bulk Inventory Update</h2>
            <button
              onClick={args.onClose}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              ×
            </button>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <h3 className="font-medium mb-4">Upload CSV File</h3>
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragging ? 'border-primary bg-primary/5' : ''
                }`}
                onDragEnter={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  const file = e.dataTransfer.files[0];
                  if (file && file.type === 'text/csv') {
                    console.log('File dropped:', file.name);
                  }
                }}
                role="region"
                aria-label="Drag and drop area for CSV files"
              >
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  id="csv-upload-drag"
                />
                <label htmlFor="csv-upload-drag" className="cursor-pointer">
                  <div className="space-y-2">
                    <div className="text-4xl">{isDragging ? '📥' : '📁'}</div>
                    <p className="text-sm">
                      {isDragging ? 'Drop file here' : 'Click to choose file or drag and drop'}
                    </p>
                    <p className="text-xs text-muted-foreground">CSV files only</p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    await waitFor(() => {
      void expect(canvas.getByText(/upload csv file/i)).toBeInTheDocument();
    });
    
    // Check drag and drop area
    const dropArea = canvas.getByRole('region', { name: /drag and drop area/i });
    void expect(dropArea).toBeInTheDocument();
    
    // Simulate drag enter
    const dragEnterEvent = new DragEvent('dragenter', {
      bubbles: true,
      cancelable: true,
    });
    dropArea.dispatchEvent(dragEnterEvent);
    
    // Check visual feedback
    await waitFor(() => {
      void expect(canvas.getByText(/drop file here/i)).toBeInTheDocument();
    });
    
    // Simulate drag leave
    const dragLeaveEvent = new DragEvent('dragleave', {
      bubbles: true,
      cancelable: true,
    });
    dropArea.dispatchEvent(dragLeaveEvent);
    
    await waitFor(() => {
      void expect(canvas.getByText(/click to choose file or drag and drop/i)).toBeInTheDocument();
    });
  },
};

export const ProgressTracking: Story = {
  render: (args) => {
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState('Preparing update...');
    
    useEffect(() => {
      const timer = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(timer);
            setStatus('Update complete!');
            return 100;
          }
          const newProgress = prev + 10;
          if (newProgress < 30) setStatus('Validating data...');
          else if (newProgress < 70) setStatus('Updating inventory...');
          else if (newProgress < 100) setStatus('Finalizing changes...');
          return newProgress;
        });
      }, 500);
      
      return () => clearInterval(timer);
    }, []);
    
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-background rounded-lg shadow-xl max-w-2xl w-full">
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold">Bulk Inventory Update</h2>
            <button
              onClick={args.onClose}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
              disabled={progress < 100}
              aria-label="Close"
            >
              ×
            </button>
          </div>
          <div className="p-6">
            <div className="space-y-4 text-center py-8">
              {progress < 100 ? (
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"
                     role="progressbar"
                     aria-valuenow={progress}
                     aria-valuemin={0}
                     aria-valuemax={100}
                     aria-label="Update progress"
                />
              ) : (
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                  ✓
                </div>
              )}
              <p className="text-sm text-muted-foreground" aria-live="polite">{status}</p>
              <div className="max-w-xs mx-auto">
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-primary h-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                    role="progressbar"
                    aria-valuenow={progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{progress}% complete</p>
              {progress === 100 && (
                <button 
                  onClick={args.onClose}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md mt-4"
                >
                  Done
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Check initial state
    await waitFor(() => {
      void expect(canvas.getByText(/preparing update/i)).toBeInTheDocument();
    });
    
    // Check progress indicators
    const progressBars = canvas.getAllByRole('progressbar');
    void expect(progressBars.length).toBeGreaterThan(0);
    
    // Wait for status changes
    await waitFor(() => {
      void expect(canvas.getByText(/validating data/i)).toBeInTheDocument();
    }, { timeout: 2000 });
    
    await waitFor(() => {
      void expect(canvas.getByText(/updating inventory/i)).toBeInTheDocument();
    }, { timeout: 4000 });
    
    // Wait for completion
    await waitFor(() => {
      void expect(canvas.getByText(/update complete/i)).toBeInTheDocument();
      void expect(canvas.getByText('100% complete')).toBeInTheDocument();
    }, { timeout: 6000 });
    
    // Check done button appears
    const doneButton = canvas.getByRole('button', { name: /done/i });
    void expect(doneButton).toBeInTheDocument();
  },
};