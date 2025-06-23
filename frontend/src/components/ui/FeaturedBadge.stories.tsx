import type { Meta, StoryObj } from '@storybook/react-vite';
import { FeaturedBadge } from './FeaturedBadge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useState } from 'react';
import { Star, Sparkles, Trophy, Zap, Award, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

// Custom colored badge component
const CustomColoredBadge = ({ 
  color, 
  className 
}: { 
  color: 'blue' | 'green' | 'purple' | 'red'; 
  className?: string;
}) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    green: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    red: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  };
  
  return (
    <div 
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium',
        colorClasses[color],
        className,
      )}
    >
      <Star className="w-4 h-4 fill-current" />
      <span>Featured</span>
    </div>
  );
};

// Badge with custom icon
const BadgeWithIcon = ({ 
  icon: Icon, 
  text,
  className 
}: { 
  icon: typeof Star; 
  text: string;
  className?: string;
}) => {
  return (
    <div 
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-warning text-warning-foreground px-3 py-1.5 text-sm font-medium',
        className,
      )}
    >
      <Icon className="w-4 h-4" />
      <span>{text}</span>
    </div>
  );
};

// Animated badge component
const AnimatedBadge = ({ 
  variant = 'pulse' 
}: { 
  variant?: 'pulse' | 'bounce' | 'sparkle';
}) => {
  const [isAnimating, setIsAnimating] = useState(true);
  
  const animationClasses = {
    pulse: 'animate-pulse',
    bounce: 'animate-bounce',
    sparkle: 'animate-pulse',
  };
  
  return (
    <div className="relative inline-flex">
      {variant === 'sparkle' && isAnimating && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
        </div>
      )}
      <div 
        className={cn(
          'inline-flex items-center gap-1 rounded-full bg-warning text-warning-foreground px-3 py-1.5 text-sm font-medium',
          isAnimating && animationClasses[variant],
        )}
      >
        <Star className="w-4 h-4 fill-current" />
        <span>Featured</span>
      </div>
      <Button
        size="sm"
        variant="ghost"
        className="ml-2"
        onClick={() => setIsAnimating(!isAnimating)}
      >
        {isAnimating ? 'Stop' : 'Start'} Animation
      </Button>
    </div>
  );
};

// Badge showcase grid
const BadgeShowcase = () => {
  const badges = [
    { size: 'sm' as const, showText: true, label: 'Small with text' },
    { size: 'md' as const, showText: true, label: 'Medium with text' },
    { size: 'lg' as const, showText: true, label: 'Large with text' },
    { size: 'sm' as const, showText: false, label: 'Small icon only' },
    { size: 'md' as const, showText: false, label: 'Medium icon only' },
    { size: 'lg' as const, showText: false, label: 'Large icon only' },
  ];
  
  return (
    <div className="grid grid-cols-3 gap-4">
      {badges.map((badge, index) => (
        <Card key={index} className="p-4 text-center">
          <div className="mb-2">
            <FeaturedBadge size={badge.size} showText={badge.showText} />
          </div>
          <p className="text-xs text-muted-foreground">{badge.label}</p>
        </Card>
      ))}
    </div>
  );
};

// Product card with badge
const ProductCardWithBadge = () => {
  return (
    <Card className="overflow-hidden">
      <div className="relative">
        <img
          src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop"
          alt="Premium Headphones"
          className="w-full h-48 object-cover"
        />
        <div className="absolute top-2 right-2">
          <FeaturedBadge />
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold mb-1">Premium Headphones</h3>
        <p className="text-sm text-muted-foreground mb-2">
          Noise-cancelling wireless headphones
        </p>
        <p className="text-lg font-bold">$299.99</p>
      </div>
    </Card>
  );
};

// Multiple badges demo
const MultipleBadgesDemo = () => {
  const items = [
    { icon: Star, text: 'Featured', color: 'warning' },
    { icon: Trophy, text: 'Best Seller', color: 'blue' },
    { icon: Zap, text: 'New', color: 'green' },
    { icon: Award, text: 'Top Rated', color: 'purple' },
    { icon: Crown, text: 'Premium', color: 'red' },
  ];
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-2">Badge Variations</h3>
      <div className="flex flex-wrap gap-2">
        {items.map((item, index) => (
          <BadgeWithIcon
            key={index}
            icon={item.icon}
            text={item.text}
            className={cn(
              item.color === 'warning' && 'bg-warning text-warning-foreground',
              item.color === 'blue' && 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
              item.color === 'green' && 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
              item.color === 'purple' && 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
              item.color === 'red' && 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
            )}
          />
        ))}
      </div>
    </div>
  );
};

const meta = {
  title: 'UI/FeaturedBadge',
  component: FeaturedBadge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof FeaturedBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const Small: Story = {
  args: {
    size: 'sm',
  },
};

export const Medium: Story = {
  args: {
    size: 'md',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
  },
};

export const IconOnly: Story = {
  args: {
    showText: false,
  },
};

export const AllSizes: Story = {
  decorators: [
    () => (
      <div className="flex items-center gap-4">
        <FeaturedBadge size="sm" />
        <FeaturedBadge size="md" />
        <FeaturedBadge size="lg" />
      </div>
    ),
  ],
};

export const CustomColors: Story = {
  decorators: [
    () => (
      <div className="flex flex-wrap gap-3">
        <FeaturedBadge />
        <CustomColoredBadge color="blue" />
        <CustomColoredBadge color="green" />
        <CustomColoredBadge color="purple" />
        <CustomColoredBadge color="red" />
      </div>
    ),
  ],
};

export const WithCustomIcons: Story = {
  decorators: [
    () => <MultipleBadgesDemo />,
  ],
};

export const AnimatedPulse: Story = {
  decorators: [
    () => <AnimatedBadge variant="pulse" />,
  ],
};

export const AnimatedBounce: Story = {
  decorators: [
    () => <AnimatedBadge variant="bounce" />,
  ],
};

export const AnimatedSparkle: Story = {
  decorators: [
    () => <AnimatedBadge variant="sparkle" />,
  ],
};

export const OnProductCard: Story = {
  decorators: [
    () => <ProductCardWithBadge />,
  ],
};

export const BadgeShowcaseGrid: Story = {
  decorators: [
    () => <BadgeShowcase />,
  ],
};

export const InlineWithText: Story = {
  decorators: [
    () => (
      <div className="space-y-4">
        <p className="text-lg">
          This product is <FeaturedBadge size="sm" className="mx-1" /> in our catalog.
        </p>
        <p>
          Check out our <FeaturedBadge className="mx-1" /> collection for the best deals!
        </p>
        <p className="text-sm text-muted-foreground">
          Items marked with <FeaturedBadge size="sm" showText={false} className="mx-1" /> are hand-picked by our team.
        </p>
      </div>
    ),
  ],
};

export const CustomClassName: Story = {
  args: {
    className: 'shadow-lg scale-110 hover:scale-125 transition-transform',
  },
};

export const BadgeList: Story = {
  decorators: [
    () => {
      const products = [
        { name: 'Premium Headphones', featured: true, bestSeller: true },
        { name: 'Wireless Mouse', featured: true, bestSeller: false },
        { name: 'USB-C Hub', featured: false, bestSeller: true },
        { name: 'Laptop Stand', featured: true, bestSeller: true },
      ];
      
      return (
        <div className="space-y-2">
          {products.map((product, index) => (
            <Card key={index} className="p-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">{product.name}</span>
                <div className="flex gap-2">
                  {product.featured && <FeaturedBadge size="sm" />}
                  {product.bestSeller && (
                    <BadgeWithIcon 
                      icon={Trophy} 
                      text="Best Seller" 
                      className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 text-xs px-2 py-1"
                    />
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

export const Responsive: Story = {
  decorators: [
    () => (
      <div className="space-y-4">
        <div className="block sm:hidden">
          <p className="text-sm text-muted-foreground mb-2">Mobile View</p>
          <FeaturedBadge size="sm" />
        </div>
        <div className="hidden sm:block md:hidden">
          <p className="text-sm text-muted-foreground mb-2">Tablet View</p>
          <FeaturedBadge size="md" />
        </div>
        <div className="hidden md:block">
          <p className="text-sm text-muted-foreground mb-2">Desktop View</p>
          <FeaturedBadge size="lg" />
        </div>
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
        <div className="flex flex-wrap gap-3">
          <FeaturedBadge />
          <CustomColoredBadge color="blue" />
          <CustomColoredBadge color="green" />
          <CustomColoredBadge color="purple" />
          <CustomColoredBadge color="red" />
        </div>
      </div>
    ),
  ],
};

export const Accessibility: Story = {
  decorators: [
    () => (
      <div className="space-y-4">
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">Screen Reader Friendly</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Badge includes semantic HTML and proper contrast ratios
          </p>
          <div className="flex gap-3">
            <FeaturedBadge />
            <span className="sr-only">This item is featured</span>
          </div>
        </div>
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold mb-2">Keyboard Navigation</h3>
          <p className="text-sm text-muted-foreground mb-3">
            When used in interactive contexts
          </p>
          <Button variant="outline" className="relative">
            View Product
            <FeaturedBadge size="sm" className="absolute -top-2 -right-2" />
          </Button>
        </div>
      </div>
    ),
  ],
};