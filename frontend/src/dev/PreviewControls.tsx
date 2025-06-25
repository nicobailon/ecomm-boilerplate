import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/hooks/useTheme';

interface PreviewControlsProps {
  onViewportChange: (width: number, height: number) => void;
  onContainerWidthChange: (width: string) => void;
}

const viewportSizes = [
  { name: 'Mobile', width: 375, height: 667, icon: '📱' },
  { name: 'Tablet', width: 768, height: 1024, icon: '📱' },
  { name: 'Desktop', width: 1440, height: 900, icon: '💻' },
  { name: 'Full', width: 0, height: 0, icon: '🖥️' },
];

const containerWidths = [
  { name: 'Auto', value: 'auto' },
  { name: 'Small', value: '640px' },
  { name: 'Medium', value: '768px' },
  { name: 'Large', value: '1024px' },
  { name: 'XL', value: '1280px' },
];

export default function PreviewControls({
  onViewportChange,
  onContainerWidthChange,
}: PreviewControlsProps) {
  const [selectedViewport, setSelectedViewport] = useState('Full');
  const [selectedWidth, setSelectedWidth] = useState('auto');
  const { theme, setTheme } = useTheme();
  
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleViewportChange = (viewport: typeof viewportSizes[0]) => {
    setSelectedViewport(viewport.name);
    onViewportChange(viewport.width, viewport.height);
  };

  const handleContainerWidthChange = (width: string) => {
    setSelectedWidth(width);
    onContainerWidthChange(width);
  };

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
      <div className="flex items-center justify-between gap-6">
        {/* Viewport size buttons */}
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            Viewport
          </label>
          <div className="flex gap-2">
            {viewportSizes.map((size) => (
              <Button
                key={size.name}
                variant={selectedViewport === size.name ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleViewportChange(size)}
                className="flex items-center gap-1"
              >
                <span>{size.icon}</span>
                <span className="hidden sm:inline">{size.name}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Container width controls */}
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            Container Width
          </label>
          <div className="flex gap-2">
            {containerWidths.map((width) => (
              <Button
                key={width.name}
                variant={selectedWidth === width.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleContainerWidthChange(width.value)}
              >
                {width.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Theme toggle */}
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            Theme
          </label>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleTheme}
            className="flex items-center gap-2"
          >
            {theme === 'dark' ? '🌙' : '☀️'}
            <span>{theme === 'dark' ? 'Dark' : 'Light'}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}