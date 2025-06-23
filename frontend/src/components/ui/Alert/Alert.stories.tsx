import type { Meta, StoryObj } from '@storybook/react-vite';
import { Alert, AlertDescription, AlertTitle } from '../Alert';
import { 
  Info, 
  AlertCircle, 
  CheckCircle, 
  AlertTriangle, 
  X,
  Terminal,
  Rocket,
  Bell,
  Lightbulb,
  ShieldAlert,
  Zap,
  Heart,
  Star,
  TrendingUp,
  Download,
  ArrowRight
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { userEvent, within, expect } from '@storybook/test';
import { Button } from '../Button';

const meta = {
  title: 'UI/Alert',
  component: Alert,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['default', 'destructive'],
    },
  },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Alert>
      <Info className="h-4 w-4" />
      <AlertTitle>Heads up!</AlertTitle>
      <AlertDescription>
        You can add components to your app using the Storybook interface.
      </AlertDescription>
    </Alert>
  ),
};

export const Destructive: Story = {
  render: () => (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        Your session has expired. Please log in again to continue.
      </AlertDescription>
    </Alert>
  ),
};

export const Success: Story = {
  render: () => (
    <Alert className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
      <AlertTitle className="text-green-800 dark:text-green-200">Success!</AlertTitle>
      <AlertDescription className="text-green-700 dark:text-green-300">
        Your changes have been saved successfully.
      </AlertDescription>
    </Alert>
  ),
};

export const Warning: Story = {
  render: () => (
    <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800">
      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      <AlertTitle className="text-amber-800 dark:text-amber-200">Warning</AlertTitle>
      <AlertDescription className="text-amber-700 dark:text-amber-300">
        Your subscription will expire in 3 days. Please renew to continue.
      </AlertDescription>
    </Alert>
  ),
};

export const Information: Story = {
  render: () => (
    <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
      <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
      <AlertTitle className="text-blue-800 dark:text-blue-200">Information</AlertTitle>
      <AlertDescription className="text-blue-700 dark:text-blue-300">
        A new version is available. Click here to update.
      </AlertDescription>
    </Alert>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div className="space-y-4">
      <Alert>
        <Terminal className="h-4 w-4" />
        <AlertTitle>Default Alert</AlertTitle>
        <AlertDescription>
          This is a default alert with neutral styling.
        </AlertDescription>
      </Alert>
      
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Destructive Alert</AlertTitle>
        <AlertDescription>
          This is a destructive alert for errors or critical warnings.
        </AlertDescription>
      </Alert>
      
      <Alert className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
        <AlertTitle className="text-green-800 dark:text-green-200">Success Alert</AlertTitle>
        <AlertDescription className="text-green-700 dark:text-green-300">
          This is a success alert for positive feedback.
        </AlertDescription>
      </Alert>
      
      <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800">
        <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <AlertTitle className="text-amber-800 dark:text-amber-200">Warning Alert</AlertTitle>
        <AlertDescription className="text-amber-700 dark:text-amber-300">
          This is a warning alert for cautions or important notices.
        </AlertDescription>
      </Alert>
      
      <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertTitle className="text-blue-800 dark:text-blue-200">Info Alert</AlertTitle>
        <AlertDescription className="text-blue-700 dark:text-blue-300">
          This is an info alert for general information.
        </AlertDescription>
      </Alert>
    </div>
  ),
};

export const Dismissible: Story = {
  render: () => {
    const DismissibleAlert = () => {
      const [isVisible, setIsVisible] = useState(true);
      
      if (!isVisible) {
        return (
          <div className="text-center py-4">
            <Button onClick={() => setIsVisible(true)} variant="outline">
              Show Alert Again
            </Button>
          </div>
        );
      }
      
      return (
        <Alert className="relative pr-12">
          <Info className="h-4 w-4" />
          <AlertTitle>Dismissible Alert</AlertTitle>
          <AlertDescription>
            This alert can be dismissed by clicking the close button.
          </AlertDescription>
          <button
            onClick={() => setIsVisible(false)}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            aria-label="Dismiss alert"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </Alert>
      );
    };
    
    return <DismissibleAlert />;
  },
};

export const WithActions: Story = {
  render: () => (
    <div className="space-y-4">
      <Alert>
        <Download className="h-4 w-4" />
        <AlertTitle>Update Available</AlertTitle>
        <AlertDescription>
          A new version of the application is ready to install.
        </AlertDescription>
        <div className="mt-3 flex gap-2">
          <Button size="sm">Update Now</Button>
          <Button size="sm" variant="outline">Remind Me Later</Button>
        </div>
      </Alert>
      
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Payment Failed</AlertTitle>
        <AlertDescription>
          We couldn't process your payment. Please try again.
        </AlertDescription>
        <div className="mt-3 flex gap-2">
          <Button size="sm" variant="destructive">Retry Payment</Button>
          <Button size="sm" variant="outline">Contact Support</Button>
        </div>
      </Alert>
      
      <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800">
        <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        <AlertTitle className="text-amber-800 dark:text-amber-200">Storage Almost Full</AlertTitle>
        <AlertDescription className="text-amber-700 dark:text-amber-300">
          You're using 90% of your storage. Upgrade to get more space.
        </AlertDescription>
        <div className="mt-3">
          <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white">
            Upgrade Plan
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </Alert>
    </div>
  ),
};

export const CustomIcons: Story = {
  render: () => (
    <div className="space-y-4">
      <Alert>
        <Rocket className="h-4 w-4" />
        <AlertTitle>Launch Successful!</AlertTitle>
        <AlertDescription>
          Your project has been deployed successfully.
        </AlertDescription>
      </Alert>
      
      <Alert>
        <Bell className="h-4 w-4" />
        <AlertTitle>New Notification</AlertTitle>
        <AlertDescription>
          You have 3 unread messages in your inbox.
        </AlertDescription>
      </Alert>
      
      <Alert>
        <Lightbulb className="h-4 w-4" />
        <AlertTitle>Pro Tip</AlertTitle>
        <AlertDescription>
          Use keyboard shortcuts to navigate faster. Press ? to see all shortcuts.
        </AlertDescription>
      </Alert>
      
      <Alert variant="destructive">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Security Alert</AlertTitle>
        <AlertDescription>
          Unusual activity detected on your account. Please verify your identity.
        </AlertDescription>
      </Alert>
      
      <Alert className="border-purple-200 bg-purple-50 dark:bg-purple-950 dark:border-purple-800">
        <Zap className="h-4 w-4 text-purple-600 dark:text-purple-400" />
        <AlertTitle className="text-purple-800 dark:text-purple-200">Performance Boost</AlertTitle>
        <AlertDescription className="text-purple-700 dark:text-purple-300">
          Your app is now 50% faster with the latest optimization.
        </AlertDescription>
      </Alert>
      
      <Alert className="border-pink-200 bg-pink-50 dark:bg-pink-950 dark:border-pink-800">
        <Heart className="h-4 w-4 text-pink-600 dark:text-pink-400" />
        <AlertTitle className="text-pink-800 dark:text-pink-200">Thank You!</AlertTitle>
        <AlertDescription className="text-pink-700 dark:text-pink-300">
          Your feedback helps us improve. We appreciate your support!
        </AlertDescription>
      </Alert>
    </div>
  ),
};

export const LongContent: Story = {
  render: () => (
    <Alert>
      <Info className="h-4 w-4" />
      <AlertTitle>Terms of Service Update</AlertTitle>
      <AlertDescription>
        We've updated our Terms of Service to reflect changes in data protection laws and to clarify 
        how we handle user information. The key changes include: enhanced privacy controls, clearer 
        data retention policies, updated cookie usage guidelines, and improved transparency about 
        third-party integrations. These changes will take effect on January 1, 2024. By continuing 
        to use our service after this date, you agree to the updated terms.
      </AlertDescription>
    </Alert>
  ),
};

export const NoTitle: Story = {
  render: () => (
    <Alert>
      <CheckCircle className="h-4 w-4" />
      <AlertDescription>
        File uploaded successfully.
      </AlertDescription>
    </Alert>
  ),
};

export const NoIcon: Story = {
  render: () => (
    <Alert>
      <AlertTitle>System Maintenance</AlertTitle>
      <AlertDescription>
        The system will be under maintenance from 2:00 AM to 4:00 AM EST.
      </AlertDescription>
    </Alert>
  ),
};

export const Responsive: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  render: () => (
    <div className="space-y-4 p-4">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Mobile Alert</AlertTitle>
        <AlertDescription>
          This alert adapts to mobile screens with proper spacing and readability.
        </AlertDescription>
      </Alert>
      
      <Alert variant="destructive" className="relative pr-12">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error on Mobile</AlertTitle>
        <AlertDescription>
          Dismissible alerts work well on mobile devices too.
        </AlertDescription>
        <button
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          aria-label="Dismiss alert"
        >
          <X className="h-4 w-4" />
        </button>
      </Alert>
      
      <Alert>
        <Download className="h-4 w-4" />
        <AlertTitle>Update Available</AlertTitle>
        <AlertDescription>
          Version 2.0 is ready to install.
        </AlertDescription>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Button size="sm" className="w-full sm:w-auto">Update Now</Button>
          <Button size="sm" variant="outline" className="w-full sm:w-auto">Later</Button>
        </div>
      </Alert>
    </div>
  ),
};

export const Accessibility: Story = {
  render: () => {
    const AccessibleAlert = () => {
      const [announcement, setAnnouncement] = useState('');
      const alertRef = useRef<HTMLDivElement>(null);
      
      useEffect(() => {
        if (alertRef.current) {
          alertRef.current.focus();
        }
      }, []);
      
      const handleAction = (action: string) => {
        setAnnouncement(`${action} action triggered`);
      };
      
      return (
        <>
          <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
            {announcement}
          </div>
          
          <Alert ref={alertRef} tabIndex={-1}>
            <Bell className="h-4 w-4" />
            <AlertTitle id="alert-title">Accessible Alert</AlertTitle>
            <AlertDescription id="alert-desc">
              This alert demonstrates accessibility features including proper ARIA attributes, 
              keyboard navigation, and screen reader announcements.
            </AlertDescription>
            <div className="mt-3 flex gap-2">
              <Button 
                size="sm" 
                onClick={() => handleAction('Primary')}
                aria-describedby="alert-desc"
              >
                Primary Action
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleAction('Secondary')}
                aria-describedby="alert-desc"
              >
                Secondary Action
              </Button>
            </div>
          </Alert>
          
          <div className="mt-4 text-sm text-muted-foreground">
            <p>Accessibility features:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>role="alert" for automatic screen reader announcement</li>
              <li>Keyboard focusable with tab navigation</li>
              <li>ARIA labels and descriptions for context</li>
              <li>Live region for action announcements</li>
              <li>Focus management on mount</li>
            </ul>
          </div>
        </>
      );
    };
    
    return <AccessibleAlert />;
  },
};

export const KeyboardNavigation: Story = {
  render: () => {
    const KeyboardAlert = () => {
      const [focusedButton, setFocusedButton] = useState<number | null>(null);
      
      const handleKeyDown = (e: React.KeyboardEvent, currentIndex: number) => {
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          setFocusedButton(currentIndex === 2 ? 0 : currentIndex + 1);
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          setFocusedButton(currentIndex === 0 ? 2 : currentIndex - 1);
        }
      };
      
      useEffect(() => {
        if (focusedButton !== null) {
          const button = document.getElementById(`alert-btn-${focusedButton}`);
          button?.focus();
        }
      }, [focusedButton]);
      
      return (
        <Alert>
          <Terminal className="h-4 w-4" />
          <AlertTitle>Keyboard Navigation Demo</AlertTitle>
          <AlertDescription>
            Use arrow keys to navigate between buttons. Press Tab to move through elements.
          </AlertDescription>
          <div className="mt-3 flex gap-2" role="group" aria-label="Alert actions">
            <Button
              id="alert-btn-0"
              size="sm"
              onKeyDown={(e) => handleKeyDown(e, 0)}
              onFocus={() => setFocusedButton(0)}
            >
              First
            </Button>
            <Button
              id="alert-btn-1"
              size="sm"
              variant="outline"
              onKeyDown={(e) => handleKeyDown(e, 1)}
              onFocus={() => setFocusedButton(1)}
            >
              Second
            </Button>
            <Button
              id="alert-btn-2"
              size="sm"
              variant="outline"
              onKeyDown={(e) => handleKeyDown(e, 2)}
              onFocus={() => setFocusedButton(2)}
            >
              Third
            </Button>
          </div>
        </Alert>
      );
    };
    
    return <KeyboardAlert />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    const firstButton = await canvas.findByText('First');
    firstButton.focus();
    
    await userEvent.keyboard('{ArrowRight}');
    const secondButton = await canvas.findByText('Second');
    await expect(document.activeElement).toBe(secondButton);
    
    await userEvent.keyboard('{ArrowRight}');
    const thirdButton = await canvas.findByText('Third');
    await expect(document.activeElement).toBe(thirdButton);
    
    await userEvent.keyboard('{ArrowRight}');
    await expect(document.activeElement).toBe(firstButton);
  },
};

export const AnimatedEntry: Story = {
  render: () => {
    const AnimatedAlert = () => {
      const [show, setShow] = useState(false);
      
      useEffect(() => {
        const timer = setTimeout(() => setShow(true), 100);
        return () => clearTimeout(timer);
      }, []);
      
      return (
        <div className="space-y-4">
          <Button onClick={() => setShow(!show)}>
            Toggle Alert
          </Button>
          
          <div
            className={`transform transition-all duration-300 ease-out ${
              show 
                ? 'translate-y-0 opacity-100' 
                : '-translate-y-4 opacity-0 pointer-events-none'
            }`}
          >
            <Alert>
              <Rocket className="h-4 w-4" />
              <AlertTitle>Animated Alert</AlertTitle>
              <AlertDescription>
                This alert slides in with a smooth animation.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      );
    };
    
    return <AnimatedAlert />;
  },
};

export const ProgressAlert: Story = {
  render: () => {
    const ProgressAlert = () => {
      const [progress, setProgress] = useState(0);
      
      useEffect(() => {
        const interval = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 100) {
              clearInterval(interval);
              return 100;
            }
            return prev + 10;
          });
        }, 500);
        
        return () => clearInterval(interval);
      }, []);
      
      return (
        <Alert className="overflow-hidden">
          <TrendingUp className="h-4 w-4" />
          <AlertTitle>Processing...</AlertTitle>
          <AlertDescription>
            Upload progress: {progress}%
          </AlertDescription>
          <div className="absolute bottom-0 left-0 h-1 bg-primary transition-all duration-300 ease-out"
               style={{ width: `${progress}%` }}
               role="progressbar"
               aria-valuenow={progress}
               aria-valuemin={0}
               aria-valuemax={100}
          />
        </Alert>
      );
    };
    
    return <ProgressAlert />;
  },
};

export const CompactList: Story = {
  render: () => (
    <div className="space-y-2">
      <Alert className="py-2">
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>File uploaded</AlertDescription>
      </Alert>
      
      <Alert className="py-2">
        <Star className="h-4 w-4" />
        <AlertDescription>Added to favorites</AlertDescription>
      </Alert>
      
      <Alert className="py-2" variant="destructive">
        <X className="h-4 w-4" />
        <AlertDescription>Item removed</AlertDescription>
      </Alert>
    </div>
  ),
};

export const DarkMode: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
  },
  render: () => (
    <div className="dark">
      <div className="space-y-4 bg-background p-6">
        <Alert>
          <Terminal className="h-4 w-4" />
          <AlertTitle>Dark Mode Alert</AlertTitle>
          <AlertDescription>
            This alert adapts to dark mode automatically.
          </AlertDescription>
        </Alert>
        
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error in Dark Mode</AlertTitle>
          <AlertDescription>
            Destructive alerts maintain visibility in dark themes.
          </AlertDescription>
        </Alert>
        
        <Alert className="border-green-800 bg-green-950">
          <CheckCircle className="h-4 w-4 text-green-400" />
          <AlertTitle className="text-green-200">Success in Dark Mode</AlertTitle>
          <AlertDescription className="text-green-300">
            Custom colored alerts work great in dark mode too.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  ),
};