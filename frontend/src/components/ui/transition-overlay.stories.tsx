import type { Meta, StoryObj } from '@storybook/react-vite';
import { TransitionOverlay } from './transition-overlay';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle, AlertCircle, Info, Upload, Download, RefreshCw } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Custom transition overlays
const FadeOverlay = ({ isVisible, message }: { isVisible: boolean; message?: string }) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
        >
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            {message && <p className="text-sm text-muted-foreground">{message}</p>}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const SlideOverlay = ({ isVisible, message, direction = 'up' }: { isVisible: boolean; message?: string; direction?: 'up' | 'down' | 'left' | 'right' }) => {
  const variants = {
    up: { initial: { y: '100%' }, animate: { y: 0 }, exit: { y: '100%' } },
    down: { initial: { y: '-100%' }, animate: { y: 0 }, exit: { y: '-100%' } },
    left: { initial: { x: '100%' }, animate: { x: 0 }, exit: { x: '100%' } },
    right: { initial: { x: '-100%' }, animate: { x: 0 }, exit: { x: '-100%' } },
  };
  
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={variants[direction].initial}
          animate={variants[direction].animate}
          exit={variants[direction].exit}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="absolute inset-0 bg-background/95 z-50 flex items-center justify-center"
        >
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            {message && <p className="text-sm text-muted-foreground">{message}</p>}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const ScaleOverlay = ({ isVisible, message }: { isVisible: boolean; message?: string }) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 200 }}
          className="absolute inset-0 bg-background/90 z-50 flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring' }}
            className="flex flex-col items-center gap-2 bg-background p-8 rounded-lg shadow-lg"
          >
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            {message && <p className="text-sm text-muted-foreground">{message}</p>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Success/Error overlays
const StatusOverlay = ({ 
  isVisible, 
  status, 
  message, 
}: { 
  isVisible: boolean; 
  status: 'success' | 'error' | 'info';
  message?: string;
}) => {
  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
  };
  
  const colors = {
    success: 'text-green-500',
    error: 'text-red-500',
    info: 'text-blue-500',
  };
  
  const Icon = icons[status];
  
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
        >
          <motion.div
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            className="flex flex-col items-center gap-3 bg-background p-8 rounded-lg shadow-xl"
          >
            <Icon className={`h-12 w-12 ${colors[status]}`} />
            <p className="text-lg font-medium">{message || status}</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Demo component
const TransitionDemo = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [autoClose, setAutoClose] = useState(false);
  const [duration] = useState(3000);
  
  useEffect(() => {
    if (isVisible && autoClose) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, autoClose, duration]);
  
  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <Button onClick={() => setIsVisible(!isVisible)}>
          {isVisible ? 'Hide' : 'Show'} Overlay
        </Button>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={autoClose}
            onChange={(e) => setAutoClose(e.target.checked)}
            className="w-4 h-4"
          />
          <span>Auto-close after {duration}ms</span>
        </label>
      </div>
      
      <div className="relative h-64 border rounded-lg overflow-hidden">
        <Card className="p-8 h-full flex items-center justify-center">
          <p className="text-center text-muted-foreground">
            Content behind the overlay
          </p>
        </Card>
        <TransitionOverlay isVisible={isVisible} message="Loading..." />
      </div>
    </div>
  );
};

// Multiple overlays demo
const MultipleOverlaysDemo = () => {
  const [activeOverlays, setActiveOverlays] = useState<Set<string>>(new Set());
  
  const toggleOverlay = (id: string) => {
    setActiveOverlays(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };
  
  const overlays = [
    { id: 'upload', icon: Upload, message: 'Uploading files...' },
    { id: 'download', icon: Download, message: 'Downloading data...' },
    { id: 'sync', icon: RefreshCw, message: 'Syncing changes...' },
  ];
  
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {overlays.map(overlay => (
          <Button
            key={overlay.id}
            variant={activeOverlays.has(overlay.id) ? 'default' : 'outline'}
            onClick={() => toggleOverlay(overlay.id)}
          >
            <overlay.icon className="w-4 h-4 mr-2" />
            {overlay.message}
          </Button>
        ))}
      </div>
      
      <div className="relative h-64 border rounded-lg overflow-hidden">
        <Card className="p-8 h-full">
          <div className="space-y-2">
            <h3 className="font-semibold">Active Operations:</h3>
            {activeOverlays.size === 0 ? (
              <p className="text-muted-foreground">No active operations</p>
            ) : (
              <ul className="space-y-1">
                {Array.from(activeOverlays).map(id => {
                  const overlay = overlays.find(o => o.id === id);
                  return overlay ? (
                    <li key={id} className="flex items-center gap-2">
                      <overlay.icon className="w-4 h-4 animate-spin" />
                      <span>{overlay.message}</span>
                    </li>
                  ) : null;
                })}
              </ul>
            )}
          </div>
        </Card>
        {Array.from(activeOverlays).map((id, index) => {
          const overlay = overlays.find(o => o.id === id);
          return overlay ? (
            <div
              key={id}
              className="absolute inset-0 bg-background/20 z-10"
              style={{ zIndex: 10 + index }}
            >
              <TransitionOverlay isVisible={true} message={overlay.message} />
            </div>
          ) : null;
        })}
      </div>
    </div>
  );
};

// Custom timing demo
const CustomTimingDemo = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [timing, setTiming] = useState({ duration: 0.3, delay: 0 });
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Duration (seconds)</label>
          <input
            type="range"
            min="0.1"
            max="2"
            step="0.1"
            value={timing.duration}
            onChange={(e) => setTiming({ ...timing, duration: parseFloat(e.target.value) })}
            className="w-full mt-1"
          />
          <span className="text-sm text-muted-foreground">{timing.duration}s</span>
        </div>
        <div>
          <label className="text-sm font-medium">Delay (seconds)</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={timing.delay}
            onChange={(e) => setTiming({ ...timing, delay: parseFloat(e.target.value) })}
            className="w-full mt-1"
          />
          <span className="text-sm text-muted-foreground">{timing.delay}s</span>
        </div>
      </div>
      
      <Button onClick={() => setIsVisible(!isVisible)}>
        {isVisible ? 'Hide' : 'Show'} Custom Timed Overlay
      </Button>
      
      <div className="relative h-64 border rounded-lg overflow-hidden">
        <Card className="p-8 h-full flex items-center justify-center">
          <p className="text-center text-muted-foreground">
            Overlay with custom timing
          </p>
        </Card>
        <AnimatePresence>
          {isVisible && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: timing.duration, delay: timing.delay }}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
            >
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  Duration: {timing.duration}s, Delay: {timing.delay}s
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const meta = {
  title: 'UI/TransitionOverlay',
  component: TransitionOverlay,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof TransitionOverlay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    isVisible: true,
    message: 'Loading...',
  },
  decorators: [
    (Story) => (
      <div className="relative h-64 border rounded-lg overflow-hidden">
        <Card className="p-8 h-full flex items-center justify-center">
          <p className="text-center text-muted-foreground">
            Content behind the overlay
          </p>
        </Card>
        <Story />
      </div>
    ),
  ],
};

export const WithoutMessage: Story = {
  args: {
    isVisible: true,
  },
  decorators: [
    (Story) => (
      <div className="relative h-64 border rounded-lg overflow-hidden">
        <Card className="p-8 h-full flex items-center justify-center">
          <p className="text-center text-muted-foreground">
            Content behind the overlay
          </p>
        </Card>
        <Story />
      </div>
    ),
  ],
};

export const Interactive: Story = {
  args: {
    isVisible: false,
  },
  decorators: [
    () => <TransitionDemo />,
  ],
};

export const FadeTransition: Story = {
  args: {
    isVisible: false,
  },
  decorators: [
    () => {
      const [isVisible, setIsVisible] = useState(false);
      
      return (
        <div className="space-y-4">
          <Button onClick={() => setIsVisible(!isVisible)}>
            Toggle Fade Overlay
          </Button>
          <div className="relative h-64 border rounded-lg overflow-hidden">
            <Card className="p-8 h-full flex items-center justify-center">
              <p className="text-center text-muted-foreground">
                Fade transition effect
              </p>
            </Card>
            <FadeOverlay isVisible={isVisible} message="Fading in..." />
          </div>
        </div>
      );
    },
  ],
};

export const SlideTransitions: Story = {
  args: {
    isVisible: false,
  },
  decorators: [
    () => {
      const [isVisible, setIsVisible] = useState(false);
      const [direction, setDirection] = useState<'up' | 'down' | 'left' | 'right'>('up');
      
      return (
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={() => setIsVisible(!isVisible)}>
              Toggle Slide
            </Button>
            <select
              value={direction}
              onChange={(e) => setDirection(e.target.value as 'up' | 'down' | 'left' | 'right')}
              className="px-3 py-2 border rounded-md"
            >
              <option value="up">Slide Up</option>
              <option value="down">Slide Down</option>
              <option value="left">Slide Left</option>
              <option value="right">Slide Right</option>
            </select>
          </div>
          <div className="relative h-64 border rounded-lg overflow-hidden">
            <Card className="p-8 h-full flex items-center justify-center">
              <p className="text-center text-muted-foreground">
                Slide from {direction}
              </p>
            </Card>
            <SlideOverlay isVisible={isVisible} message="Sliding..." direction={direction} />
          </div>
        </div>
      );
    },
  ],
};

export const ScaleTransition: Story = {
  args: {
    isVisible: false,
  },
  decorators: [
    () => {
      const [isVisible, setIsVisible] = useState(false);
      
      return (
        <div className="space-y-4">
          <Button onClick={() => setIsVisible(!isVisible)}>
            Toggle Scale Overlay
          </Button>
          <div className="relative h-64 border rounded-lg overflow-hidden">
            <Card className="p-8 h-full flex items-center justify-center">
              <p className="text-center text-muted-foreground">
                Scale transition effect
              </p>
            </Card>
            <ScaleOverlay isVisible={isVisible} message="Scaling..." />
          </div>
        </div>
      );
    },
  ],
};

export const StatusOverlays: Story = {
  args: {
    isVisible: false,
  },
  decorators: [
    () => {
      const [status, setStatus] = useState<'success' | 'error' | 'info' | null>(null);
      
      return (
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setStatus('success');
                setTimeout(() => setStatus(null), 2000);
              }}
            >
              Show Success
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setStatus('error');
                setTimeout(() => setStatus(null), 2000);
              }}
            >
              Show Error
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setStatus('info');
                setTimeout(() => setStatus(null), 2000);
              }}
            >
              Show Info
            </Button>
          </div>
          <div className="relative h-64 border rounded-lg overflow-hidden">
            <Card className="p-8 h-full flex items-center justify-center">
              <p className="text-center text-muted-foreground">
                Click buttons to show status overlays
              </p>
            </Card>
            {status && (
              <StatusOverlay
                isVisible={true}
                status={status}
                message={
                  status === 'success' ? 'Operation completed!' :
                  status === 'error' ? 'Something went wrong!' :
                  'Processing information...'
                }
              />
            )}
          </div>
        </div>
      );
    },
  ],
};

export const MultipleOverlays: Story = {
  args: {
    isVisible: false,
  },
  decorators: [
    () => <MultipleOverlaysDemo />,
  ],
};

export const CustomTiming: Story = {
  args: {
    isVisible: false,
  },
  decorators: [
    () => <CustomTimingDemo />,
  ],
};

export const WithTabs: Story = {
  args: {
    isVisible: false,
  },
  decorators: [
    () => {
      const [loadingTab, setLoadingTab] = useState<string | null>(null);
      
      const handleTabChange = (value: string) => {
        setLoadingTab(value);
        setTimeout(() => setLoadingTab(null), 1000);
      };
      
      return (
        <div className="relative">
          <Tabs defaultValue="tab1" onValueChange={handleTabChange}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="tab1">Tab 1</TabsTrigger>
              <TabsTrigger value="tab2">Tab 2</TabsTrigger>
              <TabsTrigger value="tab3">Tab 3</TabsTrigger>
            </TabsList>
            <TabsContent value="tab1" className="relative min-h-[200px]">
              <Card className="p-6">
                <h3 className="font-semibold mb-2">Tab 1 Content</h3>
                <p className="text-muted-foreground">This is the content of tab 1</p>
              </Card>
            </TabsContent>
            <TabsContent value="tab2" className="relative min-h-[200px]">
              <Card className="p-6">
                <h3 className="font-semibold mb-2">Tab 2 Content</h3>
                <p className="text-muted-foreground">This is the content of tab 2</p>
              </Card>
            </TabsContent>
            <TabsContent value="tab3" className="relative min-h-[200px]">
              <Card className="p-6">
                <h3 className="font-semibold mb-2">Tab 3 Content</h3>
                <p className="text-muted-foreground">This is the content of tab 3</p>
              </Card>
            </TabsContent>
          </Tabs>
          <TransitionOverlay
            isVisible={loadingTab !== null}
            message={`Loading ${loadingTab}...`}
          />
        </div>
      );
    },
  ],
};

export const MobileView: Story = {
  args: {
    isVisible: true,
    message: 'Loading on mobile...',
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  decorators: [
    (Story) => (
      <div className="relative h-screen">
        <Card className="p-4 h-full">
          <p className="text-center text-muted-foreground">
            Mobile content
          </p>
        </Card>
        <Story />
      </div>
    ),
  ],
};

export const DarkMode: Story = {
  args: {
    isVisible: true,
    message: 'Loading in dark mode...',
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (Story) => (
      <div className="dark">
        <div className="relative h-64 border rounded-lg overflow-hidden">
          <Card className="p-8 h-full flex items-center justify-center">
            <p className="text-center text-muted-foreground">
              Dark mode content
            </p>
          </Card>
          <Story />
        </div>
      </div>
    ),
  ],
};