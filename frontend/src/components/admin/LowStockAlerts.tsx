import { useState } from 'react';
import { AlertTriangle, Settings, Mail, ShoppingCart, Package } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import { Label } from '@/components/ui/Label';
import { InventoryBadge } from '@/components/ui/InventoryBadge';
import { getRestockUrgency } from '@/utils/inventory';
import { useLowStockProducts } from '@/hooks/queries/useInventory';
import { InventoryTableLoading } from '@/components/ui/InventorySkeleton';
import type { LowStockItem } from '@/types/inventory';

interface AlertConfig {
  productId: string;
  productName: string;
  threshold: number;
  enabled: boolean;
}

interface ReorderListItem {
  productId: string;
  variantId?: string;
  productName: string;
  variantName?: string;
  threshold: number;
  suggestedQuantity?: number;
  addedAt?: string;
}

export function LowStockAlerts() {
  const [showSettings, setShowSettings] = useState(false);
  const [globalThreshold, setGlobalThreshold] = useState(5);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [alertConfigs, setAlertConfigs] = useState<AlertConfig[]>([]);
  const [page, setPage] = useState(1);
  
  // Fetch low stock products with real data
  const { data, isLoading } = useLowStockProducts(globalThreshold, page, 20);
  const lowStockItems = data?.alerts ?? [];
  const totalPages = data?.totalPages ?? 1;

  const handleQuickRestock = (productId: string) => {
    // Navigate to inventory management with the product selected
    // In a real app, this would open a modal or navigate to a restock form
    window.location.href = `/admin/inventory?productId=${productId}&action=restock`;
  };

  const handlePreviewEmail = () => {
    // Generate email preview content
    const emailSubject = `Low Stock Alert - ${data?.total ?? 0} items need attention`;
    const emailBody = `
Dear Admin,

The following items are running low on stock:

${lowStockItems.slice(0, 5).map(item => 
  `• ${item.productName}${item.variantName ? ` (${item.variantName})` : ''}: ${item.currentStock} units remaining (threshold: ${item.threshold})`,
).join('\n')}
${lowStockItems.length > 5 ? `\n...and ${lowStockItems.length - 5} more items` : ''}

Please review and restock as necessary.

Best regards,
Inventory Management System`;
    
    // Open email preview in a new window
    const previewWindow = window.open('', 'emailPreview', 'width=600,height=400');
    if (previewWindow) {
      previewWindow.document.write(`
        <html>
          <head>
            <title>Email Preview</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              pre { white-space: pre-wrap; }
            </style>
          </head>
          <body>
            <h3>Subject: ${emailSubject}</h3>
            <hr>
            <pre>${emailBody}</pre>
            <hr>
            <button onclick="window.close()">Close Preview</button>
          </body>
        </html>
      `);
    }
  };

  const updateThreshold = (productId: string, newThreshold: number) => {
    setAlertConfigs(configs => 
      configs.map(config => 
        config.productId === productId 
          ? { ...config, threshold: newThreshold }
          : config,
      ),
    );
  };

  const toggleAlert = (productId: string) => {
    setAlertConfigs(configs => 
      configs.map(config => 
        config.productId === productId 
          ? { ...config, enabled: !config.enabled }
          : config,
      ),
    );
  };

  if (isLoading) {
    return <InventoryTableLoading />;
  }
  
  return (
    <div className="space-y-6">
      {/* Alert Summary */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-medium text-orange-900">
              {data?.total ?? 0} items are running low on stock
            </h3>
            <p className="text-sm text-orange-700 mt-1">
              Immediate action recommended for items with critical stock levels
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings className="w-4 h-4 mr-2" />
            Configure
          </Button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-muted/50 rounded-lg p-6 space-y-4">
          <h3 className="font-medium mb-4">Alert Settings</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="global-threshold">Default Low Stock Threshold</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="global-threshold"
                  type="number"
                  value={globalThreshold}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    setGlobalThreshold(isNaN(value) ? 0 : value);
                  }}
                  className="w-24"
                  min={1}
                />
                <span className="text-sm text-muted-foreground">units</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="email-notifications"
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
                <Label htmlFor="email-notifications" className="cursor-pointer">
                  Send email notifications
                </Label>
              </div>
              {emailNotifications && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handlePreviewEmail}
                  className="mt-2"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Preview Email
                </Button>
              )}
            </div>
          </div>

          {/* Per-Product Settings */}
          <div className="mt-6">
            <h4 className="text-sm font-medium mb-3">Product-Specific Thresholds</h4>
            <div className="space-y-2">
              {alertConfigs.map((config) => (
                <div key={config.productId} className="flex items-center gap-4 p-3 bg-background rounded-lg">
                  <Switch
                    checked={config.enabled}
                    onCheckedChange={() => toggleAlert(config.productId)}
                  />
                  <span className="flex-1 text-sm">{config.productName}</span>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={config.threshold}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        updateThreshold(config.productId, isNaN(value) ? 0 : value);
                      }}
                      className="w-20 h-8"
                      min={1}
                      disabled={!config.enabled}
                    />
                    <span className="text-sm text-muted-foreground">units</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Low Stock Items List */}
      <div className="space-y-4">
        <h3 className="font-medium">Current Low Stock Items</h3>
        
        {lowStockItems.map((item: LowStockItem) => {
          const urgency = getRestockUrgency(item.currentStock);
          
          return (
            <div key={`${item.productId}-${item.variantName ?? item.variantId ?? 'default'}`} className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h4 className="font-medium">{item.productName}</h4>
                    {item.variantName && (
                      <span className="text-sm text-muted-foreground">
                        ({item.variantName})
                      </span>
                    )}
                    <InventoryBadge inventory={item.currentStock} variant="admin" showCount />
                  </div>
                  
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span>Threshold: {item.threshold} units</span>
                    {item.lastRestocked && (
                      <>
                        <span>•</span>
                        <span>Last restocked: {new Date(item.lastRestocked).toLocaleDateString()}</span>
                      </>
                    )}
                    {urgency === 'critical' && (
                      <>
                        <span>•</span>
                        <span className="text-red-600 font-medium">Critical</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleQuickRestock(item.productId)}
                  >
                    <Package className="w-4 h-4 mr-2" />
                    Restock
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      // Add to reorder list (stored in localStorage for now)
                      const reorderList = JSON.parse(localStorage.getItem('reorderList') ?? '[]') as ReorderListItem[];
                      const existingIndex = reorderList.findIndex((r) => 
                        r.productId === item.productId && r.variantId === item.variantId,
                      );
                      
                      if (existingIndex === -1) {
                        reorderList.push({
                          productId: item.productId,
                          variantId: item.variantId,
                          productName: item.productName,
                          variantName: item.variantName,
                          threshold: item.threshold,
                          suggestedQuantity: Math.max(item.threshold * 2 - item.currentStock, 10),
                          addedAt: new Date().toISOString(),
                        });
                        localStorage.setItem('reorderList', JSON.stringify(reorderList));
                        
                        // Show success message (could be a toast in production)
                        const message = document.createElement('div');
                        message.textContent = `Added ${item.productName} to reorder list`;
                        message.style.cssText = 'position: fixed; bottom: 20px; right: 20px; background: #10b981; color: white; padding: 12px 24px; border-radius: 8px; z-index: 9999;';
                        document.body.appendChild(message);
                        setTimeout(() => message.remove(), 3000);
                      }
                    }}
                  >
                    <ShoppingCart className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}

        {lowStockItems.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>All products are well stocked!</p>
          </div>
        )}
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="flex items-center px-3 text-sm">
              Page {page} of {totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}