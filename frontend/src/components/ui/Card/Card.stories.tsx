import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../Card';
import { Button } from '../Button';
import { Badge } from '../Badge';

const meta = {
  title: 'Components/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Premium Headphones</CardTitle>
        <CardDescription>High-quality wireless audio experience</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Experience crystal-clear sound with our latest noise-cancelling technology.
          </p>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">$299</span>
            <Badge variant="secondary">25% OFF</Badge>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full">Add to Cart</Button>
      </CardFooter>
    </Card>
  ),
};

export const Interactive: Story = {
  render: () => (
    <Card className="w-[350px] transition-all duration-200 hover:shadow-lg hover:scale-105 cursor-pointer">
      <CardHeader>
        <CardTitle>Special Offer</CardTitle>
        <CardDescription>Limited time deal</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm">
            Get 50% off on your first purchase when you sign up for our newsletter.
          </p>
          <div className="flex gap-2">
            <Badge>New</Badge>
            <Badge variant="secondary">Limited</Badge>
          </div>
        </div>
      </CardContent>
      <CardFooter className="gap-2">
        <Button variant="outline" className="flex-1">Learn More</Button>
        <Button className="flex-1">Sign Up</Button>
      </CardFooter>
    </Card>
  ),
};