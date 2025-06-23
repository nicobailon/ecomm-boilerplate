import type { Meta, StoryObj } from '@storybook/react-vite';
import { useMetaTags } from './MetaTags';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/Badge';
import { Eye, Twitter, Facebook, LinkIcon } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/Alert';

// Demo component wrapper
const MetaTagsDemo = ({ 
  title,
  description,
  image,
  url,
  type = 'website',
  price,
  currency,
  availability,
}: Parameters<typeof useMetaTags>[0]) => {
  useMetaTags({ title, description, image, url, type, price, currency, availability });
  
  const [showPreview, setShowPreview] = useState(false);
  const siteUrl = import.meta.env.VITE_SITE_URL || 'https://example.com';
  const fullUrl = url ? `${siteUrl}${url}` : siteUrl;
  const ogImage = image || `${siteUrl}/og-image.jpg`;
  
  return (
    <div className="space-y-4">
      <Alert>
        <AlertDescription>
          Meta tags have been applied to the document head. Open DevTools to inspect.
        </AlertDescription>
      </Alert>
      
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Current Meta Tags</h3>
        <div className="space-y-2 font-mono text-sm">
          <div className="p-2 bg-muted rounded">
            <span className="text-muted-foreground">title:</span> {title}
          </div>
          {description && (
            <div className="p-2 bg-muted rounded">
              <span className="text-muted-foreground">description:</span> {description}
            </div>
          )}
          <div className="p-2 bg-muted rounded">
            <span className="text-muted-foreground">og:image:</span> {ogImage}
          </div>
          <div className="p-2 bg-muted rounded">
            <span className="text-muted-foreground">og:url:</span> {fullUrl}
          </div>
          <div className="p-2 bg-muted rounded">
            <span className="text-muted-foreground">og:type:</span> {type}
          </div>
          {type === 'product' && price && (
            <>
              <div className="p-2 bg-muted rounded">
                <span className="text-muted-foreground">product:price:</span> {price} {currency}
              </div>
              {availability && (
                <div className="p-2 bg-muted rounded">
                  <span className="text-muted-foreground">product:availability:</span> {availability}
                </div>
              )}
            </>
          )}
        </div>
      </Card>
      
      <Button onClick={() => setShowPreview(!showPreview)}>
        <Eye className="w-4 h-4 mr-2" />
        {showPreview ? 'Hide' : 'Show'} Social Preview
      </Button>
      
      {showPreview && (
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="overflow-hidden">
            <div className="p-4 bg-muted">
              <h4 className="font-semibold flex items-center gap-2">
                <Facebook className="w-4 h-4" />
                Facebook Preview
              </h4>
            </div>
            <div className="p-4">
              <div className="border rounded-lg overflow-hidden">
                <div className="aspect-video bg-gray-200">
                  <img 
                    src={ogImage} 
                    alt="OG Image"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/1200x630?text=OG+Image';
                    }}
                  />
                </div>
                <div className="p-4">
                  <p className="text-xs text-muted-foreground uppercase">{new URL(fullUrl).hostname}</p>
                  <h5 className="font-semibold mt-1">{title}</h5>
                  {description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{description}</p>
                  )}
                </div>
              </div>
            </div>
          </Card>
          
          <Card className="overflow-hidden">
            <div className="p-4 bg-muted">
              <h4 className="font-semibold flex items-center gap-2">
                <Twitter className="w-4 h-4" />
                Twitter Preview
              </h4>
            </div>
            <div className="p-4">
              <div className="border rounded-lg overflow-hidden">
                <div className="aspect-video bg-gray-200">
                  <img 
                    src={ogImage} 
                    alt="Twitter Card"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/1200x675?text=Twitter+Card';
                    }}
                  />
                </div>
                <div className="p-4">
                  <h5 className="font-semibold">{title}</h5>
                  {description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{description}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    {new URL(fullUrl).hostname}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

// Interactive editor
const MetaTagsEditor = () => {
  const [tags, setTags] = useState<{
    title: string;
    description: string;
    image: string;
    url: string;
    type: 'website' | 'article' | 'product';
    price: number;
    currency: string;
    availability: 'in stock' | 'out of stock';
  }>({
    title: 'Premium Wireless Headphones | MyStore',
    description: 'Experience crystal-clear audio with our premium noise-cancelling wireless headphones. Free shipping on orders over $50.',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&h=630&fit=crop',
    url: '/products/premium-headphones',
    type: 'product',
    price: 299.99,
    currency: 'USD',
    availability: 'in stock',
  });
  
  const [activeTab, setActiveTab] = useState('editor');
  
  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="editor">Editor</TabsTrigger>
        <TabsTrigger value="preview">Preview</TabsTrigger>
        <TabsTrigger value="code">Code</TabsTrigger>
      </TabsList>
      
      <TabsContent value="editor" className="space-y-4">
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Meta Tags Editor</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={tags.title}
                onChange={(e) => setTags({ ...tags, title: e.target.value })}
                placeholder="Page title"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {tags.title.length}/60 characters
              </p>
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={tags.description}
                onChange={(e) => setTags({ ...tags, description: e.target.value })}
                placeholder="Page description"
                className="w-full p-2 border rounded-md"
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {tags.description?.length || 0}/160 characters
              </p>
            </div>
            
            <div>
              <Label htmlFor="image">Image URL</Label>
              <Input
                id="image"
                value={tags.image}
                onChange={(e) => setTags({ ...tags, image: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            
            <div>
              <Label htmlFor="url">URL Path</Label>
              <Input
                id="url"
                value={tags.url}
                onChange={(e) => setTags({ ...tags, url: e.target.value })}
                placeholder="/products/item-name"
              />
            </div>
            
            <div>
              <Label htmlFor="type">Type</Label>
              <select
                id="type"
                value={tags.type}
                onChange={(e) => setTags({ ...tags, type: e.target.value as 'website' | 'article' | 'product' })}
                className="w-full p-2 border rounded-md"
              >
                <option value="website">Website</option>
                <option value="article">Article</option>
                <option value="product">Product</option>
              </select>
            </div>
            
            {tags.type === 'product' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">Price</Label>
                    <Input
                      id="price"
                      type="number"
                      value={tags.price}
                      onChange={(e) => setTags({ ...tags, price: parseFloat(e.target.value) })}
                      placeholder="99.99"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <select
                      id="currency"
                      value={tags.currency}
                      onChange={(e) => setTags({ ...tags, currency: e.target.value })}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="availability">Availability</Label>
                  <select
                    id="availability"
                    value={tags.availability}
                    onChange={(e) => setTags({ ...tags, availability: e.target.value as 'in stock' | 'out of stock' })}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="in stock">In Stock</option>
                    <option value="out of stock">Out of Stock</option>
                  </select>
                </div>
              </>
            )}
          </div>
        </Card>
      </TabsContent>
      
      <TabsContent value="preview">
        <MetaTagsDemo {...tags} />
      </TabsContent>
      
      <TabsContent value="code" className="space-y-4">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Generated Code</h3>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const code = `useMetaTags(${JSON.stringify(tags, null, 2)})`;
                navigator.clipboard.writeText(code);
              }}
            >
              Copy Code
            </Button>
          </div>
          <pre className="p-4 bg-muted rounded-lg overflow-x-auto">
            <code className="text-sm">
{`import { useMetaTags } from '@/components/seo/MetaTags';

function MyComponent() {
  useMetaTags(${JSON.stringify(tags, null, 2)});
  
  return <div>Your content here</div>;
}`}
            </code>
          </pre>
        </Card>
        
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Generated HTML Tags</h3>
          <pre className="p-4 bg-muted rounded-lg overflow-x-auto">
            <code className="text-sm">
{`<title>${tags.title}</title>
<meta name="description" content="${tags.description}" />
<meta property="og:title" content="${tags.title}" />
<meta property="og:description" content="${tags.description}" />
<meta property="og:image" content="${tags.image}" />
<meta property="og:url" content="${import.meta.env.VITE_SITE_URL || 'https://example.com'}${tags.url}" />
<meta property="og:type" content="${tags.type}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${tags.title}" />
<meta name="twitter:description" content="${tags.description}" />
<meta name="twitter:image" content="${tags.image}" />${
  tags.type === 'product' && tags.price
    ? `\n<meta property="product:price:amount" content="${tags.price}" />
<meta property="product:price:currency" content="${tags.currency}" />
<meta property="product:availability" content="${tags.availability}" />`
    : ''
}`}
            </code>
          </pre>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

// Dummy component for Storybook meta
const DummyComponent = () => <div>Meta Tags Hook</div>;

const meta = {
  title: 'SEO/MetaTags',
  component: DummyComponent,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof DummyComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  decorators: [
    () => <MetaTagsDemo title="My Page Title" description="This is a description of my page" />,
  ],
};

export const ProductPage: Story = {
  decorators: [
    () => (
      <MetaTagsDemo
        title="Premium Wireless Headphones | MyStore"
        description="Experience crystal-clear audio with our premium noise-cancelling wireless headphones. Free shipping on orders over $50."
        image="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&h=630&fit=crop"
        url="/products/premium-headphones"
        type="product"
        price={299.99}
        currency="USD"
        availability="in stock"
      />
    ),
  ],
};

export const CollectionPage: Story = {
  decorators: [
    () => (
      <MetaTagsDemo
        title="Summer Collection 2024 | Fashion & Style"
        description="Discover our latest summer collection featuring trendy outfits, accessories, and must-have fashion items for the season."
        image="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1200&h=630&fit=crop"
        url="/collections/summer-2024"
        type="website"
      />
    ),
  ],
};

export const HomePage: Story = {
  decorators: [
    () => (
      <MetaTagsDemo
        title="MyStore - Premium Online Shopping Experience"
        description="Shop the latest products with free shipping, easy returns, and exceptional customer service. Discover quality items at great prices."
        image="https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=1200&h=630&fit=crop"
        url="/"
        type="website"
      />
    ),
  ],
};

export const ArticlePage: Story = {
  decorators: [
    () => (
      <MetaTagsDemo
        title="10 Tips for Choosing the Perfect Headphones | MyStore Blog"
        description="Learn how to select the best headphones for your needs with our comprehensive guide covering sound quality, comfort, and features."
        image="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&h=630&fit=crop"
        url="/blog/choosing-perfect-headphones"
        type="article"
      />
    ),
  ],
};

export const InteractiveEditor: Story = {
  decorators: [
    () => <MetaTagsEditor />,
  ],
};

export const DynamicOGImage: Story = {
  decorators: [
    () => {
      const [productName, setProductName] = useState('Wireless Headphones');
      const [price, setPrice] = useState('299.99');
      
      // Simulate dynamic OG image generation
      const ogImageUrl = `https://og-image.vercel.app/${encodeURIComponent(
        productName
      )}.png?theme=light&md=1&fontSize=100px&images=https%3A%2F%2Fassets.vercel.com%2Fimage%2Fupload%2Ffront%2Fassets%2Fdesign%2Fvercel-triangle-black.svg&images=${encodeURIComponent(
        `https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop`
      )}&widths=300&heights=300&price=$${price}`;
      
      return (
        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Dynamic OG Image Generator</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="product-name">Product Name</Label>
                <Input
                  id="product-name"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="Enter product name"
                />
              </div>
              <div>
                <Label htmlFor="product-price">Price</Label>
                <Input
                  id="product-price"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="99.99"
                />
              </div>
            </div>
          </Card>
          
          <MetaTagsDemo
            title={`${productName} - $${price}`}
            description={`Premium ${productName} available now for just $${price}. Free shipping included.`}
            image={ogImageUrl}
            url={`/products/${productName.toLowerCase().replace(/\s+/g, '-')}`}
            type="product"
            price={parseFloat(price)}
            availability="in stock"
          />
        </div>
      );
    },
  ],
};

export const TwitterCards: Story = {
  decorators: [
    () => {
      const cardTypes = [
        {
          title: 'Summary Card',
          description: 'Standard Twitter card with small image',
          image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop',
        },
        {
          title: 'Summary Large Image',
          description: 'Twitter card with large prominent image',
          image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&h=675&fit=crop',
        },
      ];
      
      const [selectedCard, setSelectedCard] = useState(0);
      
      return (
        <div className="space-y-4">
          <div className="flex gap-2">
            {cardTypes.map((_, index) => (
              <Button
                key={index}
                variant={selectedCard === index ? 'default' : 'outline'}
                onClick={() => setSelectedCard(index)}
              >
                {cardTypes[index].title}
              </Button>
            ))}
          </div>
          
          <MetaTagsDemo
            title={cardTypes[selectedCard].title}
            description={cardTypes[selectedCard].description}
            image={cardTypes[selectedCard].image}
            url="/twitter-card-demo"
          />
        </div>
      );
    },
  ],
};

export const MetaTagsList: Story = {
  decorators: [
    () => {
      const pages = [
        {
          path: '/',
          title: 'Home',
          description: 'Welcome to our store',
          type: 'website' as const,
        },
        {
          path: '/products',
          title: 'All Products',
          description: 'Browse our complete catalog',
          type: 'website' as const,
        },
        {
          path: '/products/headphones',
          title: 'Premium Headphones',
          description: 'High-quality audio equipment',
          type: 'product' as const,
          price: 299.99,
        },
        {
          path: '/blog/audio-guide',
          title: 'Ultimate Audio Guide',
          description: 'Everything about audio quality',
          type: 'article' as const,
        },
      ];
      
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Site Meta Tags Overview</h3>
          {pages.map((page) => (
            <Card key={page.path} className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{page.title}</h4>
                    <Badge variant="outline">{page.type}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{page.description}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <LinkIcon className="w-3 h-3" />
                    <code>{page.path}</code>
                  </div>
                </div>
                <div className="flex gap-2">
                  {page.type === 'product' && page.price && (
                    <Badge variant="secondary">${page.price}</Badge>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      );
    },
  ],
};

export const SEOValidation: Story = {
  decorators: [
    () => {
      const [title, setTitle] = useState('My Product');
      const [description, setDescription] = useState('A great product');
      
      const issues = [];
      if (title.length < 30) issues.push({ type: 'warning', message: 'Title is too short (recommended: 30-60 characters)' });
      if (title.length > 60) issues.push({ type: 'error', message: 'Title is too long (max: 60 characters)' });
      if (description.length < 120) issues.push({ type: 'warning', message: 'Description is too short (recommended: 120-160 characters)' });
      if (description.length > 160) issues.push({ type: 'error', message: 'Description is too long (max: 160 characters)' });
      
      return (
        <div className="space-y-4">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">SEO Validation</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="seo-title">Title</Label>
                <Input
                  id="seo-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {title.length}/60 characters
                </p>
              </div>
              <div>
                <Label htmlFor="seo-desc">Description</Label>
                <textarea
                  id="seo-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2 border rounded-md"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {description.length}/160 characters
                </p>
              </div>
            </div>
            
            {issues.length > 0 && (
              <div className="mt-4 space-y-2">
                {issues.map((issue, index) => (
                  <Alert key={index} variant={issue.type === 'error' ? 'destructive' : 'default'}>
                    <AlertDescription>{issue.message}</AlertDescription>
                  </Alert>
                ))}
              </div>
            )}
          </Card>
          
          <MetaTagsDemo title={title} description={description} />
        </div>
      );
    },
  ],
};

export const MobileView: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  decorators: [
    () => (
      <div className="p-4">
        <MetaTagsDemo
          title="Mobile Optimized Page"
          description="This page is optimized for mobile devices with responsive meta tags."
          image="https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&h=800&fit=crop"
          url="/mobile"
        />
      </div>
    ),
  ],
};

export const DarkMode: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
  },
  decorators: [
    () => (
      <div className="dark">
        <MetaTagsEditor />
      </div>
    ),
  ],
};