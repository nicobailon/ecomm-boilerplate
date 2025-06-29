import React, { useState, useEffect, useMemo } from 'react';
import { FEATURE_FLAGS } from '@/lib/feature-flags';
import { useFeatureFlagsStore } from '@/stores/featureFlags.store';
import { Card } from '@/components/ui/Card';
import { Switch } from '@/components/ui/Switch';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { AlertCircle, RefreshCw, Copy, Check } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';

interface FeatureFlag {
  key: string;
  value: boolean;
  category: 'tRPC' | 'Features' | 'Experimental';
  description?: string;
  requiresReload?: boolean;
}

export const FeatureFlagsPanel: React.FC = () => {
  const { flags: storeFlags, setFlags } = useFeatureFlagsStore();
  const [localFlags, setLocalFlags] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Combine all feature flags from different sources
  const allFlags: FeatureFlag[] = useMemo(() => [
    // tRPC flags
    {
      key: 'USE_TRPC_CART',
      value: FEATURE_FLAGS.USE_TRPC_CART,
      category: 'tRPC',
      description: 'Use tRPC for cart operations',
      requiresReload: true,
    },
    {
      key: 'USE_TRPC_ANALYTICS',
      value: FEATURE_FLAGS.USE_TRPC_ANALYTICS,
      category: 'tRPC',
      description: 'Use tRPC for analytics',
      requiresReload: true,
    },
    {
      key: 'USE_TRPC_COUPONS',
      value: FEATURE_FLAGS.USE_TRPC_COUPONS,
      category: 'tRPC',
      description: 'Use tRPC for coupon operations',
      requiresReload: true,
    },
    {
      key: 'USE_TRPC_PAYMENT',
      value: FEATURE_FLAGS.USE_TRPC_PAYMENT,
      category: 'tRPC',
      description: 'Use tRPC for payment processing',
      requiresReload: true,
    },
    // Feature flags
    {
      key: 'USE_VARIANT_ATTRIBUTES',
      value: storeFlags.useVariantAttributes || FEATURE_FLAGS.USE_VARIANT_ATTRIBUTES,
      category: 'Features',
      description: 'Enable variant attributes system',
    },
    {
      key: 'USE_MEDIA_GALLERY',
      value: FEATURE_FLAGS.USE_MEDIA_GALLERY,
      category: 'Features',
      description: 'Enable media gallery for products',
    },
  ], [storeFlags.useVariantAttributes]);

  useEffect(() => {
    // Initialize local flags from current values
    const initialFlags: Record<string, boolean> = {};
    allFlags.forEach(flag => {
      initialFlags[flag.key] = flag.value;
    });
    setLocalFlags(initialFlags);
  }, [allFlags]);

  const handleToggle = (key: string, value: boolean) => {
    setLocalFlags(prev => ({
      ...prev,
      [key]: value,
    }));
    setHasChanges(true);

    // Update store flags if applicable
    if (key === 'USE_VARIANT_ATTRIBUTES') {
      setFlags({ useVariantAttributes: value });
    }
  };

  const groupedFlags = allFlags.reduce((acc, flag) => {
    if (!acc[flag.category]) {
      acc[flag.category] = [];
    }
    acc[flag.category].push(flag);
    return acc;
  }, {} as Record<string, FeatureFlag[]>);

  const copyConfiguration = () => {
    const config = {
      env: Object.entries(localFlags)
        .filter(([key]) => key.startsWith('USE_TRPC_'))
        .map(([key, value]) => `VITE_${key}=${value}`)
        .join('\n'),
      runtime: Object.entries(localFlags)
        .filter(([key]) => !key.startsWith('USE_TRPC_'))
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {}),
    };

    void navigator.clipboard.writeText(JSON.stringify(config, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReload = () => {
    window.location.reload();
  };

  const categoryColors: Record<string, string> = {
    tRPC: 'bg-blue-100 text-blue-800',
    Features: 'bg-green-100 text-green-800',
    Experimental: 'bg-yellow-100 text-yellow-800',
  };

  const needsReload = hasChanges && allFlags.some(flag => 
    flag.requiresReload && localFlags[flag.key] !== flag.value,
  );

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Feature Flags</h3>
          <div className="flex items-center gap-2">
            <Button
              onClick={copyConfiguration}
              size="sm"
              variant="outline"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Config
                </>
              )}
            </Button>
            {needsReload && (
              <Button
                onClick={handleReload}
                size="sm"
                variant="destructive"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reload Required
              </Button>
            )}
          </div>
        </div>

        {needsReload && (
          <Alert variant="default" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <div>
              <p className="font-medium">Reload Required</p>
              <p className="text-sm">Some changes require a page reload to take effect.</p>
            </div>
          </Alert>
        )}

        <div className="space-y-6">
          {Object.entries(groupedFlags).map(([category, flags]) => (
            <div key={category}>
              <div className="flex items-center gap-2 mb-3">
                <h4 className="font-medium">{category}</h4>
                <Badge className={categoryColors[category] || 'bg-gray-100 text-gray-800'}>
                  {flags.length}
                </Badge>
              </div>
              
              <div className="space-y-3">
                {flags.map(flag => (
                  <div 
                    key={flag.key}
                    className="flex items-start justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <code className="text-sm font-mono bg-white px-2 py-1 rounded border">
                          {flag.key}
                        </code>
                        {flag.requiresReload && (
                          <Badge variant="outline" className="text-xs">
                            Requires Reload
                          </Badge>
                        )}
                      </div>
                      {flag.description && (
                        <p className="text-sm text-gray-600 mt-1">{flag.description}</p>
                      )}
                    </div>
                    
                    <Switch
                      checked={localFlags[flag.key] ?? flag.value}
                      onCheckedChange={(checked) => handleToggle(flag.key, checked)}
                      aria-label={`Toggle ${flag.key}`}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <h4 className="font-medium mb-3">Environment Variables</h4>
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
          <pre className="text-xs font-mono">
{`# Add to .env file for tRPC flags
${Object.entries(localFlags)
  .filter(([key]) => key.startsWith('USE_TRPC_'))
  .map(([key, value]) => `VITE_${key}=${value}`)
  .join('\n')}

# Runtime flags are managed in the application`}
          </pre>
        </div>
      </Card>

      <Card className="p-4">
        <h4 className="font-medium mb-3">Usage Guide</h4>
        <div className="space-y-2 text-sm text-gray-600">
          <p>• <strong>tRPC flags</strong> require environment variables and page reload</p>
          <p>• <strong>Feature flags</strong> can be toggled at runtime</p>
          <p>• <strong>Experimental flags</strong> may be unstable or incomplete</p>
          <p>• Use the &quot;Copy Config&quot; button to get the current configuration</p>
        </div>
      </Card>
    </div>
  );
};