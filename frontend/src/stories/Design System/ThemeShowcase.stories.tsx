import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/Alert';
import { ShoppingCart, Info } from 'lucide-react';

const meta = {
  title: 'Design System/Theme Showcase',
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const ComponentComparison = () => {
  return (
    <div className="p-8 space-y-12">
      <div>
        <h1 className="text-3xl font-bold mb-8">Theme Component Showcase</h1>
        <p className="text-muted-foreground mb-8">
          Compare how components look across different themes. Use the theme selector in the toolbar to switch between themes.
        </p>
      </div>

      <section>
        <h2 className="text-2xl font-semibold mb-6">Buttons</h2>
        <div className="flex flex-wrap gap-4">
          <Button>Primary Button</Button>
          <Button variant="secondary">Secondary Button</Button>
          <Button variant="outline">Outline Button</Button>
          <Button variant="ghost">Ghost Button</Button>
          <Button variant="destructive">Destructive Button</Button>
          <Button size="sm">Small Button</Button>
          <Button size="lg">Large Button</Button>
          <Button disabled>Disabled Button</Button>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-6">Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Premium Wireless Headphones</CardTitle>
              <CardDescription>Experience superior sound quality</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <img 
                  src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=200&fit=crop" 
                  alt="Headphones" 
                  className="w-full h-48 object-cover rounded-md"
                />
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">$299</span>
                  <Badge>25% OFF</Badge>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Add to Cart
              </Button>
            </CardFooter>
          </Card>

          <Card className="w-full">
            <CardHeader>
              <CardTitle>Smart Watch Pro</CardTitle>
              <CardDescription>Track your fitness goals</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <img 
                  src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=200&fit=crop" 
                  alt="Smart Watch" 
                  className="w-full h-48 object-cover rounded-md"
                />
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">$399</span>
                  <Badge variant="secondary">New</Badge>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button variant="outline" className="flex-1">View Details</Button>
              <Button className="flex-1">Buy Now</Button>
            </CardFooter>
          </Card>

          <Card className="w-full">
            <CardHeader>
              <CardTitle>Portable Speaker</CardTitle>
              <CardDescription>Music on the go</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <img 
                  src="https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=300&h=200&fit=crop" 
                  alt="Speaker" 
                  className="w-full h-48 object-cover rounded-md"
                />
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-2xl font-bold">$149</span>
                    <span className="text-sm text-muted-foreground line-through ml-2">$199</span>
                  </div>
                  <Badge variant="destructive">Sale</Badge>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" variant="secondary">Add to Cart</Button>
            </CardFooter>
          </Card>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-6">Form Elements</h2>
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>Enter your credentials to access your account</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="name@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="Enter your password" />
              </div>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button className="w-full">Sign In</Button>
            <Button variant="outline" className="w-full">Create Account</Button>
          </CardFooter>
        </Card>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-6">Alerts</h2>
        <div className="space-y-4 max-w-2xl">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Information</AlertTitle>
            <AlertDescription>
              Your order has been processed and will be shipped within 24 hours.
            </AlertDescription>
          </Alert>
          <Alert variant="destructive">
            <Info className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              There was a problem processing your payment. Please try again.
            </AlertDescription>
          </Alert>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-6">Badges</h2>
        <div className="flex flex-wrap gap-2">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="info">Info</Badge>
        </div>
      </section>
    </div>
  );
};

export const ThemeComparison: Story = {
  render: () => <ComponentComparison />,
};