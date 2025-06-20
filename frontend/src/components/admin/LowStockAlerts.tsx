import { useState } from 'react';
import { AlertTriangle, Settings, Mail, ShoppingCart, Package } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import { Label } from '@/components/ui/Label';
import { InventoryBadge } from '@/components/ui/InventoryBadge';
import { getRestockUrgency } from '@/utils/inventory';

interface AlertConfig {
  productId: string;
  productName: string;
  threshold: number;
  enabled: boolean;
}

interface LowStockItem {
  productId: string;
  productName: string;
  variantInfo?: string;
  currentStock: number;
  threshold: number;
  lastNotified?: string;
}

// Mock data
const mockLowStockItems: LowStockItem[] = [
  {
    productId: '1',
    productName: 'Classic T-Shirt',
    variantInfo: 'Size: M',
    currentStock: 3,
    threshold: 5,
    lastNotified: '2 hours ago'
  },
  {
    productId: '2',
    productName: 'Classic T-Shirt',
    variantInfo: 'Size: L',
    currentStock: 0,
    threshold: 5,
    lastNotified: '1 day ago'
  },
  {
    productId: '3',
    productName: 'Denim Jeans',
    currentStock: 8,
    threshold: 10,
    lastNotified: 'Never'
  }
];

const mockAlertConfigs: AlertConfig[] = [
  { productId: '1', productName: 'Classic T-Shirt', threshold: 5, enabled: true },
  { productId: '2', productName: 'Denim Jeans', threshold: 10, enabled: true },
  { productId: '3', productName: 'Winter Jacket', threshold: 3, enabled: false },
];

export function LowStockAlerts() {
  const [showSettings, setShowSettings] = useState(false);
  const [globalThreshold, setGlobalThreshold] = useState(5);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [alertConfigs, setAlertConfigs] = useState(mockAlertConfigs);

  const handleQuickRestock = (productId: string) => {
    // Mock restock action
    alert(`Opening restock form for product ${productId}`);
  };

  const handlePreviewEmail = () => {
    // Mock email preview
    alert('Email preview:\n\nSubject: Low Stock Alert - 3 items need attention\n\nDear Admin,\n\nThe following items are running low on stock...');
  };

  const updateThreshold = (productId: string, newThreshold: number) => {
    setAlertConfigs(configs => 
      configs.map(config => 
        config.productId === productId 
          ? { ...config, threshold: newThreshold }
          : config
      )
    );
  };

  const toggleAlert = (productId: string) => {
    setAlertConfigs(configs => 
      configs.map(config => 
        config.productId === productId 
          ? { ...config, enabled: !config.enabled }
          : config
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Alert Summary */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-medium text-orange-900">
              {mockLowStockItems.length} items are running low on stock
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
                  onChange={(e) => setGlobalThreshold(parseInt(e.target.value) || 0)}
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
                      onChange={(e) => updateThreshold(config.productId, parseInt(e.target.value) || 0)}
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
        
        {mockLowStockItems.map((item) => {
          const urgency = getRestockUrgency(item.currentStock);
          
          return (
            <div key={`${item.productId}-${item.variantInfo}`} className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h4 className="font-medium">{item.productName}</h4>
                    {item.variantInfo && (
                      <span className="text-sm text-muted-foreground">
                        ({item.variantInfo})
                      </span>
                    )}
                    <InventoryBadge inventory={item.currentStock} variant="admin" showCount />
                  </div>
                  
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span>Threshold: {item.threshold} units</span>
                    <span>•</span>
                    <span>Last notified: {item.lastNotified}</span>
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
                      // Mock add to cart for reorder
                      alert(`Added ${item.productName} to reorder list`);
                    }}
                  >
                    <ShoppingCart className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}

        {mockLowStockItems.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>All products are well stocked!</p>
          </div>
        )}
      </div>
    </div>
  );
}