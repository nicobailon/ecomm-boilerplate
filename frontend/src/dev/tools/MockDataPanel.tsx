import React, { useState } from 'react';
import { 
  createMockUser, 
  createMockProduct, 
  createMockCollection, 
  createMockCartItem, 
  createMockCoupon, 
  createMockMediaItem,
  createMockInventoryUpdate,
  createMockAnalyticsData,
} from '@/mocks/factories';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Package, 
  FolderOpen, 
  ShoppingCart, 
  Tag, 
  Image, 
  BarChart3, 
  Copy, 
  Check,
  Sparkles,
  RefreshCw,
  Database,
} from 'lucide-react';
import { nanoid } from 'nanoid';

interface MockDataCategory {
  id: string;
  name: string;
  icon: React.ElementType;
  description: string;
  generators: MockDataGenerator[];
}

interface MockDataGenerator {
  id: string;
  name: string;
  description: string;
  generate: () => unknown;
  count?: number;
}

export const MockDataPanel: React.FC = () => {
  const [generatedData, setGeneratedData] = useState<unknown>(null);
  const [copied, setCopied] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<'json' | 'pretty'>('pretty');

  const categories: MockDataCategory[] = [
    {
      id: 'users',
      name: 'Users',
      icon: User,
      description: 'Generate mock user data',
      generators: [
        {
          id: 'single-user',
          name: 'Single User',
          description: 'Generate one user',
          generate: () => createMockUser(),
        },
        {
          id: 'admin-user',
          name: 'Admin User',
          description: 'Generate an admin user',
          generate: () => createMockUser({ role: 'admin', name: 'Admin User' }),
        },
        {
          id: 'multiple-users',
          name: 'Multiple Users',
          description: 'Generate 5 users',
          generate: () => Array.from({ length: 5 }, (_, i) => 
            createMockUser({ 
              name: `User ${i + 1}`, 
              email: `user${i + 1}@example.com`, 
            }),
          ),
          count: 5,
        },
      ],
    },
    {
      id: 'products',
      name: 'Products',
      icon: Package,
      description: 'Generate mock product data',
      generators: [
        {
          id: 'single-product',
          name: 'Single Product',
          description: 'Generate one product',
          generate: () => createMockProduct(),
        },
        {
          id: 'featured-product',
          name: 'Featured Product',
          description: 'Generate a featured product',
          generate: () => createMockProduct({ 
            isFeatured: true, 
            name: 'Featured Product',
            price: 149.99, 
          }),
        },
        {
          id: 'product-catalog',
          name: 'Product Catalog',
          description: 'Generate 10 products',
          generate: () => {
            return Array.from({ length: 10 }, (_, i) => 
              createMockProduct({
                name: `Product ${i + 1}`,
                slug: `product-${i + 1}`,
                price: Math.floor(Math.random() * 200) + 19.99,
                inventory: Math.floor(Math.random() * 100),
                isFeatured: Math.random() > 0.7,
              }),
            );
          },
          count: 10,
        },
        {
          id: 'out-of-stock',
          name: 'Out of Stock Product',
          description: 'Generate a product with no inventory',
          generate: () => createMockProduct({ 
            inventory: 0, 
            name: 'Out of Stock Item', 
          }),
        },
      ],
    },
    {
      id: 'collections',
      name: 'Collections',
      icon: FolderOpen,
      description: 'Generate mock collection data',
      generators: [
        {
          id: 'single-collection',
          name: 'Single Collection',
          description: 'Generate one collection',
          generate: () => createMockCollection(),
        },
        {
          id: 'collection-with-products',
          name: 'Collection with Products',
          description: 'Generate collection with 5 products',
          generate: () => {
            const products = Array.from({ length: 5 }, () => nanoid());
            return createMockCollection({
              name: 'Summer Collection',
              slug: 'summer-collection',
              products,
            });
          },
        },
      ],
    },
    {
      id: 'cart',
      name: 'Cart',
      icon: ShoppingCart,
      description: 'Generate mock cart data',
      generators: [
        {
          id: 'single-cart-item',
          name: 'Single Cart Item',
          description: 'Generate one cart item',
          generate: () => createMockCartItem(),
        },
        {
          id: 'full-cart',
          name: 'Full Shopping Cart',
          description: 'Generate cart with 5 items',
          generate: () => Array.from({ length: 5 }, () => 
            createMockCartItem({
              quantity: Math.floor(Math.random() * 3) + 1,
            }),
          ),
          count: 5,
        },
      ],
    },
    {
      id: 'coupons',
      name: 'Coupons',
      icon: Tag,
      description: 'Generate mock coupon data',
      generators: [
        {
          id: 'single-coupon',
          name: 'Single Coupon',
          description: 'Generate one coupon',
          generate: () => createMockCoupon(),
        },
        {
          id: 'expired-coupon',
          name: 'Expired Coupon',
          description: 'Generate an expired coupon',
          generate: () => createMockCoupon({
            code: 'EXPIRED',
            expirationDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            isActive: false,
          }),
        },
        {
          id: 'high-discount',
          name: 'High Discount Coupon',
          description: 'Generate 50% off coupon',
          generate: () => createMockCoupon({
            code: 'HALFOFF',
            discountPercentage: 50,
          }),
        },
      ],
    },
    {
      id: 'media',
      name: 'Media',
      icon: Image,
      description: 'Generate mock media data',
      generators: [
        {
          id: 'single-image',
          name: 'Single Image',
          description: 'Generate one image media item',
          generate: () => createMockMediaItem(),
        },
        {
          id: 'video-media',
          name: 'Video Media',
          description: 'Generate a video media item',
          generate: () => createMockMediaItem({
            type: 'video',
            url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          }),
        },
        {
          id: 'media-gallery',
          name: 'Media Gallery',
          description: 'Generate 5 media items',
          generate: () => Array.from({ length: 5 }, (_, i) => 
            createMockMediaItem({
              order: i,
              url: `https://via.placeholder.com/800x600?text=Image+${i + 1}`,
            }),
          ),
          count: 5,
        },
      ],
    },
    {
      id: 'analytics',
      name: 'Analytics',
      icon: BarChart3,
      description: 'Generate mock analytics data',
      generators: [
        {
          id: 'analytics-dashboard',
          name: 'Analytics Dashboard',
          description: 'Generate full analytics data',
          generate: () => createMockAnalyticsData(),
        },
        {
          id: 'inventory-update',
          name: 'Inventory Update',
          description: 'Generate inventory update event',
          generate: () => createMockInventoryUpdate(nanoid(), Math.floor(Math.random() * 100)),
        },
      ],
    },
  ];

  const handleGenerate = (generator: MockDataGenerator) => {
    const data = generator.generate();
    setGeneratedData(data);
    setCopied(false);
  };

  const handleCopy = () => {
    if (!generatedData) return;
    
    const textToCopy = selectedFormat === 'json' 
      ? JSON.stringify(generatedData)
      : JSON.stringify(generatedData, null, 2);
    
    void navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setGeneratedData(null);
    setCopied(false);
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Mock Data Generator</h3>
          <Badge variant="outline" className="gap-1">
            <Database className="w-3 h-3" />
            {categories.reduce((acc, cat) => acc + cat.generators.length, 0)} Generators
          </Badge>
        </div>

        <Tabs defaultValue={categories[0].id} className="w-full">
          <div className="w-full overflow-auto scrollbar-overlay">
            <TabsList className="inline-flex w-max">
              {categories.map(category => {
                const Icon = category.icon;
                return (
                  <TabsTrigger key={category.id} value={category.id} className="gap-2">
                    <Icon className="w-4 h-4" />
                    {category.name}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          {categories.map(category => (
            <TabsContent key={category.id} value={category.id} className="mt-4">
              <div className="space-y-3">
                <p className="text-sm text-gray-600 mb-4">{category.description}</p>
                
                {category.generators.map(generator => (
                  <div 
                    key={generator.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm">{generator.name}</h4>
                        {generator.count && (
                          <Badge variant="secondary" className="text-xs">
                            ×{generator.count}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{generator.description}</p>
                    </div>
                    
                    <Button
                      onClick={() => handleGenerate(generator)}
                      size="sm"
                      variant="outline"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate
                    </Button>
                  </div>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </Card>

      {generatedData !== null && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium">Generated Data</h4>
            <div className="flex items-center gap-2">
              <div className="flex rounded-md shadow-sm">
                <button
                  onClick={() => setSelectedFormat('pretty')}
                  className={`px-3 py-1 text-sm font-medium rounded-l-md border ${
                    selectedFormat === 'pretty' 
                      ? 'bg-blue-50 text-blue-700 border-blue-200' 
                      : 'bg-white text-gray-700 border-gray-300'
                  }`}
                >
                  Pretty
                </button>
                <button
                  onClick={() => setSelectedFormat('json')}
                  className={`px-3 py-1 text-sm font-medium rounded-r-md border-t border-r border-b ${
                    selectedFormat === 'json' 
                      ? 'bg-blue-50 text-blue-700 border-blue-200' 
                      : 'bg-white text-gray-700 border-gray-300'
                  }`}
                >
                  Compact
                </button>
              </div>
              
              <Button
                onClick={handleCopy}
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
                    Copy
                  </>
                )}
              </Button>
              
              <Button
                onClick={handleClear}
                size="sm"
                variant="ghost"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="h-96 w-full overflow-auto">
            <pre className="text-xs font-mono bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
              {selectedFormat === 'json' 
                ? JSON.stringify(generatedData)
                : JSON.stringify(generatedData, null, 2)
              }
            </pre>
          </div>
        </Card>
      )}
    </div>
  );
};